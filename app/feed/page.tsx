"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PostCard } from "@/components/feed/PostCard";
import { TopicFollowWidget } from "@/components/TopicFollowWidget";
import { TrendingTopicsWidget } from "@/components/TrendingTopicsWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSavedCollections, type SavedCollection } from "@/lib/collections";
import {
  FeedPost,
  subscribeToFeed,
} from "@/lib/posts";
import { formatStoryTime } from "@/lib/stories";
import { useFeedFilters } from "@/hooks/useFeedFilters";
import { useStories } from "@/hooks/useStories";
import { useTopics } from "@/hooks/useTopics";
import { useUserProfile } from "@/hooks/useUserProfile";

function FeedPageContent() {
  const { user, loading } = useAuthContext();
  
  const feedTabs = [
    { value: "for_you", label: "For You" },
    { value: "following", label: "Following" },
    { value: "recruiting", label: "Recruiting" },
    { value: "saved", label: "Saved" },
  ] as const;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([]);

  const {
    followingIds,
    currentUserLocation,
    currentUserTeam,
    currentUserRole,
  } = useUserProfile();

  const {
    activeFilters,
    setActiveFilters,
    visiblePosts,
    hideAuthor,
    hideSport,
    hideTopic,
    hidePostType,
    resetFilters,
  } = useFeedFilters(posts, user?.uid ?? "", currentUserLocation, currentUserTeam, followingIds);

  const {
    followedTopics,
    trendingTopics,
    suggestedTopics,
    pendingTopic,
    handleTopicFollow,
  } = useTopics(posts);

  const { storyHighlights } = useStories();

  useEffect(() => {
    const loadingFallback = window.setTimeout(() => {
      setPostsLoading(false);
      setFeedError((current) => current || "Feed is taking too long to load.");
    }, 10000);

    const unsubscribe = subscribeToFeed(
      (nextPosts) => {
        setPosts(nextPosts);
        setFeedError("");
        setPostsLoading(false);
        window.clearTimeout(loadingFallback);
      },
      (error) => {
        setFeedError(error.message || "Could not load the feed.");
        setPostsLoading(false);
        window.clearTimeout(loadingFallback);
      }
    );

    return () => {
      window.clearTimeout(loadingFallback);
      unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      void getSavedCollections().then(setSavedCollections);
    }
  }, [user?.uid]);

  const availableSports = useMemo<string[]>(() => {
    return Array.from(
      new Set(posts.map((post) => post.sport?.trim()).filter((s): s is string => !!s))
    ).sort((left, right) => left.localeCompare(right));
  }, [posts]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Create non-nullable references to clear IDE red lines
  const currentUser = user!;
  const userId = currentUser.uid;
  // Using a consistent placeholder logic for the avatar
  const userPhoto = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=random`;
  const userName = currentUser.displayName || "User";

  return (
      <div className="mx-auto max-w-2xl space-y-6 pb-24">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-4">
              <img src={userPhoto} alt="Your avatar" className="h-12 w-12 rounded-full object-cover" />
              <Button variant="ghost" className="h-auto flex-1 justify-start px-0" asChild>
                <Link href="/upload">What&apos;s happening in your sport today?</Link>
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Link href="/upload?template=standard" className="rounded-xl border px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5">
                Create post
              </Link>
              <Link href="/upload?template=highlight" className="rounded-xl border px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5">
                Add reel
              </Link>
              <Link href="/stories" className="rounded-xl border px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5">
                Open stories
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2 rounded-xl border px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={activeFilters.search}
                onChange={(event) => setActiveFilters(prev => ({ ...prev, search: event.target.value }))}
                placeholder="Search the network..."
                className="h-11 w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {feedTabs.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    activeFilters.view === option.value ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/30"
                  }`}
                  onClick={() => setActiveFilters(prev => ({ ...prev, view: option.value }))}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${showMoreFilters ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/30"}`}
                onClick={() => setShowMoreFilters((current) => !current)}
              >
                More filters
              </button>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border bg-muted/30 p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs ${activeFilters.sport === "all" ? "border-primary bg-primary/5 text-primary" : ""}`}
                  onClick={() => setActiveFilters(prev => ({ ...prev, sport: "all" }))}
                >
                  All Sports
                </button>
                {availableSports.slice(0, 4).map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-xs ${activeFilters.sport === sport ? "border-primary bg-primary/5 text-primary" : ""}`}
                    onClick={() => setActiveFilters(prev => ({ ...prev, sport }))}
                  >
                    {sport}
                  </button>
                ))}
              </div>
              <TrendingTopicsWidget
                topics={(trendingTopics || []).slice(0, 4)}
                activeTopic={activeFilters.topic}
                onSelectTopic={(topic) => setActiveFilters(prev => ({ ...prev, topic }))}
              />
              {showMoreFilters ? (
                <div className="space-y-3 rounded-xl bg-background p-3">
                  {(currentUserRole || currentUserLocation || currentUserTeam) ? (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {currentUserRole ? <span className="rounded-full bg-muted px-2 py-1 capitalize">{currentUserRole}</span> : null}
                      {currentUserTeam ? <span className="rounded-full bg-muted px-2 py-1">{currentUserTeam}</span> : null}
                      {currentUserLocation ? <span className="rounded-full bg-muted px-2 py-1">{currentUserLocation}</span> : null}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {(["all", "nearby", "team", "creator", "coach", "polls", "qa"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`rounded-full border px-3 py-1.5 text-xs ${activeFilters.extra === value ? "border-primary bg-primary/5 text-primary" : ""}`}
                        onClick={() => setActiveFilters(prev => ({ ...prev, extra: value }))}
                      >
                        {value === "all" ? "No extra filter" : value}
                      </button>
                    ))}
                  </div>
                  <TopicFollowWidget
                    topics={suggestedTopics || []}
                    followedTopics={followedTopics}
                    pendingTopic={pendingTopic}
                    onFollowTopic={handleTopicFollow}
                  />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">Stories</p>
                <p className="text-xs text-muted-foreground">Quick updates from your people</p>
              </div>
              <Link href="/stories" className="text-sm text-primary hover:underline">
                Open stories
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              <Link href="/stories" className="flex min-w-[76px] flex-col items-center gap-2">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 p-[2px] shadow-sm">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
                    <img
                      src={userPhoto}
                      alt="Your story"
                      className="h-[70px] w-[70px] rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow">
                    +
                  </span>
                </div>
                <span className="max-w-[76px] truncate text-center text-xs font-medium">{userName}</span>
              </Link>

              {storyHighlights.length === 0 ? (
                <div className="flex items-center rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  No active stories yet.
                </div>
              ) : (
                (storyHighlights || []).map((story) => (
                  <Link key={story.id} href={`/stories?story=${story.id}`} className="flex min-w-[76px] flex-col items-center gap-2">
                    <div className="rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 p-[2px] shadow-sm">
                      <div className="rounded-full bg-background p-[2px]">
                        <img
                          src={story.authorAvatar || "https://placehold.co/80x80?text=S"}
                          alt={story.authorName}
                          className={`h-[70px] w-[70px] rounded-full object-cover ${story.seenBy?.includes(userId) ? "opacity-75" : ""}`}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="block max-w-[76px] truncate text-xs font-medium">{story.authorName}</span>
                      <span className="text-[11px] text-muted-foreground">{formatStoryTime(story.createdAt)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {postsLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : null}

        {!postsLoading && feedError ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold">Feed could not load</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {feedError.includes("permissions")
                  ? "Firestore rules are still blocking this feed. Deploy the rules, then refresh."
                  : feedError}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!feedError && visiblePosts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold">Nothing matches this view yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another tab, clear your filters, or switch back to For You.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={resetFilters}>
                  Reset filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!feedError && visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={currentUser}
            savedCollections={savedCollections}
            onRefreshCollections={() => getSavedCollections().then(setSavedCollections)}
            onHideAuthor={hideAuthor}
            onHideSport={hideSport}
            onHideTopic={hideTopic}
            onHidePostType={hidePostType}
            onSelectTopic={(tag) => setActiveFilters(prev => ({ ...prev, topic: tag }))}
          />
        ))}
      </div>
  );
}

export default function FeedPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <FeedPageContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}
