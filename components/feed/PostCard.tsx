"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SavedCollection } from "@/lib/collections";
import {
  formatTimeAgo,
  togglePostLike,
  toggleSavePost,
  type FeedPost,
} from "@/lib/posts";

interface PostCardProps {
  post: FeedPost;
  user: { uid: string };
  savedCollections: SavedCollection[];
  onRefreshCollections: () => void | Promise<void>;
  onHideAuthor: (authorId: string) => void;
  onHideSport: (sport: string) => void;
  onHideTopic: (topic: string) => void;
  onHidePostType: (postType: NonNullable<FeedPost["postType"]>) => void;
  onSelectTopic: (tag: string) => void;
}

export function PostCard({
  post,
  user,
  savedCollections,
  onRefreshCollections,
  onHideAuthor,
  onHideSport,
  onHideTopic,
  onHidePostType,
  onSelectTopic,
}: PostCardProps) {
  const [likes, setLikes] = useState(post.likes);
  const [saves, setSaves] = useState(post.saves);
  const [isBusy, setIsBusy] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const hasLiked = likes.includes(user.uid);
  const isSaved = saves.includes(user.uid);
  const savedCollectionCount = savedCollections.filter((collection) =>
    collection.postIds.includes(post.id)
  ).length;
  const postType = post.postType ?? "standard";
  const mediaItems = post.mediaItems?.length
    ? post.mediaItems
    : post.mediaUrl
      ? [{ url: post.mediaUrl, type: post.mediaType }]
      : [];

  async function handleLike() {
    if (isBusy) return;
    setIsBusy(true);
    setLikes((current) =>
      hasLiked ? current.filter((uid) => uid !== user.uid) : [...current, user.uid]
    );
    try {
      await togglePostLike(post.id, hasLiked);
    } catch {
      setLikes(post.likes);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSave() {
    if (isBusy) return;
    setIsBusy(true);
    setSaves((current) =>
      isSaved ? current.filter((uid) => uid !== user.uid) : [...current, user.uid]
    );
    try {
      await toggleSavePost(post.id, isSaved);
      await onRefreshCollections();
    } catch {
      setSaves(post.saves);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/profile/${post.userId}`} className="flex min-w-0 items-center gap-3">
            <img
              src={post.author.avatar || "https://placehold.co/48x48?text=HL"}
              alt={post.author.name}
              className="h-11 w-11 rounded-full object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{post.author.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {post.author.username} · {formatTimeAgo(post.createdAt)}
              </span>
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Post controls"
            onClick={() => setShowControls((current) => !current)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showControls ? (
          <div className="flex flex-wrap gap-2 rounded-xl bg-muted/40 p-3 text-xs">
            <button type="button" className="rounded-full border px-3 py-1" onClick={() => onHideAuthor(post.userId)}>
              Hide author
            </button>
            <button type="button" className="rounded-full border px-3 py-1" onClick={() => onHideSport(post.sport)}>
              Hide sport
            </button>
            <button type="button" className="rounded-full border px-3 py-1" onClick={() => onHidePostType(postType)}>
              Hide type
            </button>
          </div>
        ) : null}

        {post.caption ? <p className="whitespace-pre-wrap text-sm">{post.caption}</p> : null}

        {mediaItems.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-muted">
            {mediaItems[0].type === "video" ? (
              <video src={mediaItems[0].url} controls className="max-h-[640px] w-full bg-black object-contain" />
            ) : (
              <img src={mediaItems[0].url} alt={post.accessibilityLabel || post.caption || "Post media"} className="max-h-[640px] w-full object-cover" />
            )}
          </div>
        ) : null}

        {post.hashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => onSelectTopic(tag)}
                onDoubleClick={() => onHideTopic(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={handleLike} disabled={isBusy}>
              <Heart className={`mr-1 h-4 w-4 ${hasLiked ? "fill-current text-primary" : ""}`} />
              {likes.length}
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href={`/analytics/${post.id}`}>
                <MessageCircle className="mr-1 h-4 w-4" />
                {post.commentsCount}
              </Link>
            </Button>
            <Button type="button" variant="ghost" size="sm">
              <Share2 className="mr-1 h-4 w-4" />
              {post.shares}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden items-center gap-1 sm:flex">
              <Eye className="h-4 w-4" />
              {post.views ?? 0}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={handleSave} disabled={isBusy}>
              <Bookmark className={`mr-1 h-4 w-4 ${isSaved ? "fill-current text-primary" : ""}`} />
              {savedCollectionCount || saves.length}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
