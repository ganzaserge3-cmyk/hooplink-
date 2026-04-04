"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  CornerDownRight,
  Heart,
  MessageCircle,
  Pencil,
  Search,
  Repeat2,
  Share2,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FeedPost,
  PostComment,
  addPostComment,
  deletePost,
  formatTimeAgo,
  recordPostView,
  repostPost,
  subscribeToComments,
  subscribeToFeed,
  toggleCommentReaction,
  togglePollVote,
  togglePostLike,
  toggleSavePost,
  updatePost,
} from "@/lib/posts";
import { reportEntity } from "@/lib/moderation";
import { formatStoryTime, getActiveStories, type StoryItem } from "@/lib/stories";
import { getCurrentUserProfile, toggleFollowTopic } from "@/lib/user-profile";

const COMMENT_REACTIONS = ["🔥", "👏", "💯"];

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\#[a-z0-9_]+|\@[a-z0-9_]+)/gi);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) {
          return null;
        }

        if (part.startsWith("#")) {
          const tag = part.replace("#", "").toLowerCase();
          return (
            <Link key={`${part}-${index}`} href={`/topics/${tag}`} className="font-medium text-primary hover:underline">
              {part}
            </Link>
          );
        }

        if (part.startsWith("@")) {
          return (
            <Link key={`${part}-${index}`} href={`/search?q=${encodeURIComponent(part)}`} className="font-medium text-primary hover:underline">
              {part}
            </Link>
          );
        }

        return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
      })}
    </>
  );
}

function FeedPageContent() {
  const { user, loading } = useAuthContext();
  const feedTabs = [
    { value: "for_you", label: "For You" },
    { value: "following", label: "Following" },
    { value: "nearby", label: "Nearby" },
    { value: "team", label: "Team" },
    { value: "recruiting", label: "Recruiting" },
    { value: "creator", label: "Creator" },
    { value: "coach", label: "Coach" },
    { value: "polls", label: "Polls" },
    { value: "qa", label: "Q&A" },
    { value: "saved", label: "Saved" },
  ] as const;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [pendingCommentPostId, setPendingCommentPostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editSport, setEditSport] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [feedSearch, setFeedSearch] = useState("");
  const [feedView, setFeedView] = useState<(typeof feedTabs)[number]["value"]>("for_you");
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [currentUserLocation, setCurrentUserLocation] = useState("");
  const [currentUserTeam, setCurrentUserTeam] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);

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
  }, []);

  useEffect(() => {
    void getActiveStories().then(setStories);
  }, []);

  useEffect(() => {
    void getCurrentUserProfile().then((profile) => {
      setFollowingIds(Array.isArray(profile?.following) ? (profile.following as string[]) : []);
      setFollowedTopics(Array.isArray(profile?.followedTopics) ? (profile.followedTopics as string[]) : []);
      setCurrentUserLocation(String(profile?.location ?? ""));
      setCurrentUserRole(String((profile?.role as Record<string, unknown> | undefined)?.type ?? ""));
      setCurrentUserTeam(String((profile?.role as Record<string, unknown> | undefined)?.team ?? ""));
    });
  }, []);

  useEffect(() => {
    const activePostIds = Object.entries(openComments)
      .filter(([, isOpen]) => isOpen)
      .map(([postId]) => postId);

    const cleanups = activePostIds.map((postId) =>
      subscribeToComments(postId, (comments) => {
        setCommentsByPost((current) => ({ ...current, [postId]: comments }));
      })
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [openComments]);

  const shareLinks = useMemo(() => {
    if (!sharePostId || typeof window === "undefined") {
      return null;
    }

    const shareUrl = `${window.location.origin}/feed?post=${sharePostId}`;
    const shareText = encodeURIComponent("Check this out on HoopLink");

    return {
      copy: async () => navigator.clipboard.writeText(shareUrl),
      x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareText}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check this out on HoopLink ${shareUrl}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    };
  }, [sharePostId]);

  const storyHighlights = useMemo(() => {
    const uniqueStories = new Map<string, StoryItem>();

    stories.forEach((story) => {
      if (!uniqueStories.has(story.userId)) {
        uniqueStories.set(story.userId, story);
      }
    });

    return Array.from(uniqueStories.values());
  }, [stories]);

  useEffect(() => {
    if (!shareMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setShareMessage(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [shareMessage]);

  const handleLike = async (postId: string, hasLiked: boolean) => {
    setPendingPostId(postId);
    try {
      await togglePostLike(postId, hasLiked);
    } finally {
      setPendingPostId(null);
    }
  };

  const handleSave = async (postId: string, isSaved: boolean) => {
    setPendingPostId(postId);
    try {
      await toggleSavePost(postId, isSaved);
    } finally {
      setPendingPostId(null);
    }
  };

  const toggleComments = (postId: string) => {
    setOpenComments((current) => ({ ...current, [postId]: !current[postId] }));
  };

  const handleCommentSubmit = async (postId: string, parentCommentId?: string) => {
    const draft = commentDrafts[parentCommentId || postId] ?? "";
    if (!draft.trim()) {
      return;
    }

    setPendingCommentPostId(postId);
    try {
      await addPostComment(postId, draft, parentCommentId);
      setCommentDrafts((current) => ({ ...current, [parentCommentId || postId]: "" }));
      setOpenComments((current) => ({ ...current, [postId]: true }));
      setReplyingToCommentId(null);
    } finally {
      setPendingCommentPostId(null);
    }
  };

  const availableSports = useMemo(() => {
    return Array.from(
      new Set(posts.map((post) => post.sport.trim()).filter(Boolean))
    ).sort((left, right) => left.localeCompare(right));
  }, [posts]);

  const trendingTopics = useMemo(() => {
    const counts = new Map<string, number>();

    posts.forEach((post) => {
      post.hashtags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [posts]);

  const suggestedTopics = useMemo(() => {
    return Array.from(new Set([...followedTopics, ...trendingTopics])).slice(0, 8);
  }, [followedTopics, trendingTopics]);

  const visiblePosts = useMemo(() => {
    const normalizedSearch = feedSearch.trim().toLowerCase();
    const following = new Set<string>(followingIds);
    const normalizedLocation = currentUserLocation.trim().toLowerCase();
    const normalizedTeam = currentUserTeam.trim().toLowerCase();
    const currentUserId = user?.uid ?? "";

    return posts.filter((post) => {
      if (feedView === "following" && !following.has(post.userId)) {
        return false;
      }

      if (feedView === "nearby" && (!normalizedLocation || post.author.location?.toLowerCase() !== normalizedLocation)) {
        return false;
      }

      if (feedView === "team" && (!normalizedTeam || post.author.team?.toLowerCase() !== normalizedTeam)) {
        return false;
      }

      if (feedView === "recruiting" && !post.author.recruitingAvailable) {
        return false;
      }

      if (feedView === "creator" && post.author.role !== "creator") {
        return false;
      }

      if (feedView === "coach" && post.author.role !== "coach") {
        return false;
      }

      if (feedView === "polls" && post.postType !== "poll") {
        return false;
      }

      if (feedView === "qa" && post.postType !== "qa") {
        return false;
      }

      if (feedView === "saved" && (!currentUserId || !post.saves.includes(currentUserId))) {
        return false;
      }

      if (selectedSport !== "all" && post.sport.toLowerCase() !== selectedSport.toLowerCase()) {
        return false;
      }

      if (selectedTopic !== "all" && !post.hashtags.includes(selectedTopic)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        post.caption,
        post.sport,
        post.author.name,
        post.author.username,
        post.author.location ?? "",
        post.author.team ?? "",
        post.author.role ?? "",
        ...(post.hashtags ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [
    currentUserLocation,
    currentUserTeam,
    feedSearch,
    feedView,
    followingIds,
    posts,
    selectedSport,
    selectedTopic,
    user?.uid,
  ]);

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

  const handleTopicFollow = async (topic: string) => {
    setPendingTopic(topic);
    try {
      const isFollowing = followedTopics.includes(topic);
      await toggleFollowTopic(topic, isFollowing);
      setFollowedTopics((current) =>
        isFollowing ? current.filter((item) => item !== topic) : [...current, topic]
      );
    } finally {
      setPendingTopic(null);
    }
  };

  const handleShare = async (postId: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const shareUrl = `${window.location.origin}/feed?post=${postId}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "HoopLink post",
          text: "Check this out on HoopLink",
          url: shareUrl,
        });
        setShareMessage("Shared successfully.");
        return;
      } catch {
        // Fall through to inline share actions when native share is cancelled or unavailable.
      }
    }

    setSharePostId(sharePostId === postId ? null : postId);
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl space-y-6 pb-24">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-4">
              <img src={user.photoURL || "https://placehold.co/80x80?text=U"} alt="Your avatar" className="h-12 w-12 rounded-full" />
              <Button variant="ghost" className="h-auto flex-1 justify-start px-0" asChild>
                <Link href="/upload">What&apos;s happening in your sport today?</Link>
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Link href="/upload?template=standard" className="rounded-xl border px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5">
                Share update
              </Link>
              <Link href="/upload?type=poll&template=poll" className="rounded-xl border px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5">
                Ask a poll
              </Link>
              <Link href="/upload?type=qa&template=qa" className="rounded-xl border px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5">
                Start Q&amp;A
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2 rounded-xl border px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={feedSearch}
                onChange={(event) => setFeedSearch(event.target.value)}
                placeholder="Search posts, people, sports, or hashtags"
                className="h-11 w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {feedTabs.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    feedView === option.value ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/30"
                  }`}
                  onClick={() => setFeedView(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Discover faster
              </div>
              {(currentUserRole || currentUserLocation || currentUserTeam) ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {currentUserRole ? <span className="rounded-full bg-background px-2 py-1 capitalize">{currentUserRole}</span> : null}
                  {currentUserTeam ? <span className="rounded-full bg-background px-2 py-1">{currentUserTeam}</span> : null}
                  {currentUserLocation ? <span className="rounded-full bg-background px-2 py-1">{currentUserLocation}</span> : null}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Follow a few topics to make your feed more personal.
                  </span>
                ) : (
                  suggestedTopics.map((topic) => {
                    const isFollowingTopic = followedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          isFollowingTopic ? "border-primary bg-primary/5 text-primary" : ""
                        }`}
                        disabled={pendingTopic === topic}
                        onClick={() => void handleTopicFollow(topic)}
                      >
                        {isFollowingTopic ? "Following" : "Follow"} #{topic}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs ${selectedSport === "all" ? "border-primary bg-primary/5 text-primary" : ""}`}
                  onClick={() => setSelectedSport("all")}
                >
                  All sports
                </button>
                {availableSports.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-xs ${selectedSport === sport ? "border-primary bg-primary/5 text-primary" : ""}`}
                    onClick={() => setSelectedSport(sport)}
                  >
                    {sport}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs ${selectedTopic === "all" ? "border-primary bg-primary/5 text-primary" : ""}`}
                  onClick={() => setSelectedTopic("all")}
                >
                  All topics
                </button>
                {trendingTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-xs ${selectedTopic === topic ? "border-primary bg-primary/5 text-primary" : ""}`}
                    onClick={() => setSelectedTopic(topic)}
                  >
                    #{topic}
                  </button>
                ))}
              </div>
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
                      src={user.photoURL || "https://placehold.co/80x80?text=Y"}
                      alt="Your story"
                      className="h-[70px] w-[70px] rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow">
                    +
                  </span>
                </div>
                <span className="max-w-[76px] truncate text-center text-xs font-medium">Your story</span>
              </Link>

              {storyHighlights.length === 0 ? (
                <div className="flex items-center rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  No active stories yet.
                </div>
              ) : (
                storyHighlights.map((story) => (
                  <Link key={story.id} href={`/stories?story=${story.id}`} className="flex min-w-[76px] flex-col items-center gap-2">
                    <div className="rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 p-[2px] shadow-sm">
                      <div className="rounded-full bg-background p-[2px]">
                        <img
                          src={story.authorAvatar || "https://placehold.co/80x80?text=S"}
                          alt={story.authorName}
                          className={`h-[70px] w-[70px] rounded-full object-cover ${story.seenBy?.includes(user.uid) ? "opacity-75" : ""}`}
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

        {shareMessage ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {shareMessage}
          </div>
        ) : null}

        {!feedError && visiblePosts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold">Nothing matches this view yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another tab, clear your filters, follow a topic, or create the first post for this community.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => {
                  setFeedSearch("");
                  setFeedView("for_you");
                  setSelectedSport("all");
                  setSelectedTopic("all");
                }}>
                  Reset filters
                </Button>
                <Button asChild>
                  <Link href="/upload">Create post</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!feedError ? visiblePosts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <div className="border-b p-5">
              <div className="flex items-center gap-3">
                <img src={post.author.avatar || "https://placehold.co/64x64?text=H"} alt={`${post.author.name} avatar`} className="h-10 w-10 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${post.userId}`} className="truncate text-sm font-semibold hover:underline">
                      {post.author.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">{post.author.username}</span>
                    {post.author.verified ? <Check className="h-4 w-4 text-primary" /> : null}
                    {post.sponsored ? <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-700">SPONSORED</span> : null}
                    {post.visibility === "subscribers" ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">SUBSCRIBERS</span> : null}
                    {post.visibility === "premium_group" ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">PREMIUM GROUP</span> : null}
                    {post.postType === "poll" ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">POLL</span> : null}
                    {post.postType === "qa" ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Q&A</span> : null}
                    {post.author.recruitingAvailable ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700">RECRUITING</span> : null}
                  </div>
                  {post.author.team || post.author.location ? (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {[post.author.team, post.author.location].filter(Boolean).join(" • ")}
                    </div>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{post.sport} • {formatTimeAgo(post.createdAt)}</span>
                </div>
                {post.userId === user.uid ? (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPostId(post.id);
                        setEditCaption(post.caption);
                        setEditSport(post.sport);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void deletePost(post.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void reportEntity({
                        targetId: post.id,
                        targetType: "post",
                        reason: "content",
                        details: "Reported from feed.",
                      })
                    }
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {post.mediaUrl ? (
              <button
                type="button"
                className="relative block w-full text-left"
                onClick={() => void recordPostView(post.id)}
                onContextMenu={post.rightClickProtected ? (event) => event.preventDefault() : undefined}
              >
                {post.mediaType === "video" ? (
                  <video
                    src={post.mediaUrl}
                    controlsList={post.downloadProtected ? "nodownload" : undefined}
                    aria-label={post.accessibilityLabel || post.caption || "Post media"}
                    className="aspect-video w-full bg-black object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onClick={(event) => {
                      const video = event.currentTarget;
                      if (video.paused) {
                        void video.play();
                      } else {
                        video.pause();
                      }
                    }}
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.accessibilityLabel || post.caption || "Post media"}
                    className="aspect-video w-full object-cover"
                  />
                )}
                {post.watermarkEnabled ? (
                  <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                    {post.author.username}
                  </span>
                ) : null}
              </button>
            ) : null}

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" disabled={pendingPostId === post.id} onClick={() => handleLike(post.id, post.likes.includes(user.uid))}>
                    <Heart className={`h-5 w-5 ${post.likes.includes(user.uid) ? "fill-current text-red-500" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => toggleComments(post.id)}>
                    <MessageCircle className={`h-5 w-5 ${openComments[post.id] ? "text-primary" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => void repostPost(post.id)}>
                    <Repeat2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 text-xs"
                    onClick={() => {
                      const quote = window.prompt("Add a caption to your quote repost", "");
                      if (quote === null) {
                        return;
                      }
                      void repostPost(post.id, quote);
                    }}
                  >
                    Quote
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => void handleShare(post.id)}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0" disabled={pendingPostId === post.id} onClick={() => handleSave(post.id, post.saves.includes(user.uid))}>
                  <Bookmark className={`h-5 w-5 ${post.saves.includes(user.uid) ? "fill-current text-emerald-500" : ""}`} />
                </Button>
              </div>

              {sharePostId === post.id && shareLinks ? (
                <div className="flex flex-wrap gap-2 rounded-xl border p-3">
                  <Button size="sm" variant="outline" onClick={() => void shareLinks.copy().then(() => {
                    setShareMessage("Link copied.");
                    setSharePostId(null);
                  })}>
                    Copy Link
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={shareLinks.x} target="_blank" rel="noreferrer">Share to X</a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={shareLinks.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={shareLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
                  </Button>
                </div>
              ) : null}

              <div className="text-sm">
                <span className="font-semibold">{post.likes.length.toLocaleString()}</span> likes
                <span className="ml-3 text-muted-foreground">{post.commentsCount} comments</span>
                <span className="ml-3 text-muted-foreground">{post.shares} reposts</span>
              </div>

              {editingPostId === post.id ? (
                <div className="space-y-2 rounded-xl border p-3">
                  <input value={editSport} onChange={(event) => setEditSport(event.target.value)} className="h-10 w-full rounded-md border border-input px-3 text-sm" />
                  <textarea value={editCaption} onChange={(event) => setEditCaption(event.target.value)} className="min-h-24 w-full rounded-md border border-input px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={async () => {
                      await updatePost(post.id, { caption: editCaption, sport: editSport });
                      setEditingPostId(null);
                    }}>
                      Save Changes
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingPostId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                      {post.visibility === "subscribers"
                        ? "Subscribers only"
                        : post.visibility === "premium_group"
                          ? "Premium group"
                          : "Public"}
                    </span>
                    {post.sponsored ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
                        {post.sponsorLabel || "Sponsored"}
                      </span>
                    ) : null}
                    {post.hashtags.slice(0, 4).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="rounded-full bg-primary/5 px-2 py-1 text-primary"
                        onClick={() => setSelectedTopic(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  {post.collaborators?.length ? (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Collaborators:</span>
                      {post.collaborators.map((collaborator) => (
                        <Link key={collaborator.uid} href={`/profile/${collaborator.uid}`} className="rounded-full bg-muted px-2 py-1 hover:text-primary">
                          {collaborator.username}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {post.remixOf ? (
                    <div className="text-xs text-muted-foreground">
                      Remix of <Link href={`/feed?post=${post.remixOf}`} className="text-primary hover:underline">another HoopLink post</Link>
                    </div>
                  ) : null}
                  {post.originalPostId ? (
                    <div className="text-xs text-muted-foreground">
                      Reposted from <Link href={`/feed?post=${post.originalPostId}`} className="text-primary hover:underline">the original post</Link>
                    </div>
                  ) : null}
                  {post.autoCaption ? (
                    <div className="rounded-xl bg-muted p-3 text-sm">
                      <span className="font-semibold">Caption:</span> {post.autoCaption}
                    </div>
                  ) : null}
                  {post.translatedCaption ? (
                    <div className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Translation:</span> {post.translatedCaption}
                    </div>
                  ) : null}
                  {post.aiHighlightAnalysis ? (
                    <div className="rounded-xl bg-primary/5 p-3 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">AI Analysis:</span> {post.aiHighlightAnalysis}
                    </div>
                  ) : null}
                  {post.voiceoverScript ? (
                    <div className="rounded-xl bg-primary/5 p-3 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Voiceover:</span> {post.voiceoverScript}
                    </div>
                  ) : null}
                  {post.thumbnailHint ? (
                    <div className="text-xs text-muted-foreground">
                      Best thumbnail: {post.thumbnailHint}
                    </div>
                  ) : null}
                  {post.clipStartSec !== null || post.clipEndSec !== null ? (
                    <div className="text-xs text-muted-foreground">
                      Clip range: {post.clipStartSec ?? 0}s - {post.clipEndSec ?? "end"}s
                    </div>
                  ) : null}
                  {post.accessibilityLabel ? (
                    <div className="text-xs text-muted-foreground">
                      Accessibility label: {post.accessibilityLabel}
                    </div>
                  ) : null}

                  {post.postType === "qa" && post.questionPrompt ? (
                    <div className="rounded-xl bg-primary/5 p-3 text-sm">
                      <span className="font-semibold text-primary">Question:</span>{" "}
                      <RichText text={post.questionPrompt} />
                    </div>
                  ) : null}

                  {post.caption ? (
                    <p className="text-sm leading-relaxed">
                      <RichText text={post.caption} />
                    </p>
                  ) : null}

                  {post.postType === "poll" && post.poll?.options?.length ? (
                    <div className="space-y-2 rounded-xl border p-3">
                      {post.poll.options.map((option, index) => {
                        const totalVotes = post.poll?.options.reduce((sum, current) => sum + current.votes.length, 0) ?? 0;
                        const percentage = totalVotes ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                        const hasVoted = option.votes.includes(user.uid);
                        return (
                          <button
                            key={`${option.label}-${index}`}
                            type="button"
                            className={`w-full rounded-xl border p-3 text-left ${hasVoted ? "border-primary bg-primary/5" : ""}`}
                            onClick={() => void togglePollVote(post.id, index)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span>{option.label}</span>
                              <span className="text-xs text-muted-foreground">{option.votes.length} votes • {percentage}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              )}

              {openComments[post.id] ? (
                <div className="space-y-3 rounded-xl border bg-muted/40 p-3">
                  <div className="space-y-3">
                    {(commentsByPost[post.id] ?? []).filter((comment) => !comment.parentCommentId).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
                    ) : (
                      (commentsByPost[post.id] ?? [])
                        .filter((comment) => !comment.parentCommentId)
                        .map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <img src={comment.author.avatar || "https://placehold.co/48x48?text=C"} alt={`${comment.author.name} avatar`} className="h-8 w-8 rounded-full" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="truncate font-semibold">{comment.author.name}</span>
                                <span className="text-muted-foreground">{comment.author.username}</span>
                                <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm leading-relaxed"><RichText text={comment.text} /></p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {COMMENT_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="rounded-full border px-2 py-1 text-xs"
                                    onClick={() => void toggleCommentReaction(comment.id, emoji)}
                                  >
                                    {emoji} {comment.reactions?.[emoji]?.length ?? 0}
                                  </button>
                                ))}
                              </div>
                              <button
                                type="button"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-primary"
                                onClick={() => setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id)}
                              >
                                <CornerDownRight className="h-3 w-3" />
                                Reply
                              </button>
                              <div className="mt-2 space-y-2">
                                {(commentsByPost[post.id] ?? [])
                                  .filter((reply) => reply.parentCommentId === comment.id)
                                  .map((reply) => (
                                    <div key={reply.id} className="rounded-lg bg-background/70 p-2">
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="font-semibold">{reply.author.name}</span>
                                        <span className="text-muted-foreground">{reply.author.username}</span>
                                        <span className="text-muted-foreground">{formatTimeAgo(reply.createdAt)}</span>
                                      </div>
                                      <p className="mt-1 text-sm"><RichText text={reply.text} /></p>
                                    </div>
                                  ))}
                              </div>
                              {replyingToCommentId === comment.id ? (
                                <div className="mt-2 flex gap-2">
                                  <input
                                    value={commentDrafts[comment.id] ?? ""}
                                    onChange={(event) => setCommentDrafts((current) => ({ ...current, [comment.id]: event.target.value }))}
                                    placeholder={`Reply to ${comment.author.name} with @mentions...`}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  />
                                  <Button type="button" size="sm" onClick={() => handleCommentSubmit(post.id, comment.id)}>
                                    Reply
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={commentDrafts[post.id] ?? ""}
                      onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                      placeholder={post.postType === "qa" ? "Answer the question or mention someone..." : "Write a comment with @mentions..."}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={pendingCommentPostId === post.id}
                    />
                    <Button type="button" size="sm" disabled={pendingCommentPostId === post.id || !(commentDrafts[post.id] ?? "").trim()} onClick={() => handleCommentSubmit(post.id)}>
                      Post
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        )) : null}
      </div>
    </ProtectedRoute>
  );
}

export default function FeedPage() {
  return (
    <AuthProvider>
      <FeedPageContent />
    </AuthProvider>
  );
}
