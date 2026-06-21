"use client";

import { useEffect, useRef, useState } from "react";


import Link from "next/link";
import {
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  X,
} from "lucide-react";
import { useDoubleTap } from "@/hooks/useDoubleTap";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SavedCollection } from "@/lib/collections";
import {
  addPostComment,
  formatTimeAgo,
  subscribeToComments,
  togglePostLike,
  togglePostReaction,
  toggleSavePost,
  type FeedPost,
  type PostComment,
} from "@/lib/posts";

const POST_REACTION_EMOJIS = ["\uD83D\uDD25", "\uD83D\uDC4F", "\uD83D\uDC4D", "\u26A1", "\uD83C\uDFC6"];

function CommentsPanel({
  postId,
  comments,
  setComments,
  totalCount,
  visibleCount,
  onLoadMore,
}: {
  postId: string;
  comments: PostComment[];
  setComments: React.Dispatch<React.SetStateAction<PostComment[]>>;
  totalCount: number;
  visibleCount: number;
  onLoadMore?: () => void;
}) {
  useEffect(() => {
    if (!postId) return;

    const cleanup = subscribeToComments(postId, (nextComments) => {
      setComments(nextComments);
    }, visibleCount);

    return () => {
      cleanup();
    };
  }, [postId, setComments, visibleCount]);

  const hasMore = comments.length < totalCount;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      {comments.length === 0 ? (
        <div className="flex h-44 flex-col items-center justify-center text-center">
          <MessageCircle className="mb-3 h-9 w-9 text-muted-foreground" />
          <p className="text-sm font-semibold">No comments yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Start the conversation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 text-sm">
              <Link href={`/profile/${comment.userId}`} className="shrink-0" aria-label={`Open ${comment.author.name}'s profile`}>
                <img
                  src={comment.author.avatar || "https://placehold.co/40x40?text=C"}
                  alt={comment.author.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <Link href={`/profile/${comment.userId}`} className="max-w-[12rem] truncate font-semibold hover:underline">
                    {comment.author.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))}
          {hasMore && onLoadMore && (
            <button
              type="button"
              onClick={onLoadMore}
              className="w-full rounded-md border border-primary/20 bg-primary/5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              View more comments
            </button>
          )}
        </div>
      )}
    </div>
  );
}


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

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);

  const [reactions, setReactions] = useState<Record<string, string[]>>(post.reactions ?? {});
  const [reactionBusy, setReactionBusy] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const hasReacted = (emoji: string) => Boolean(reactions?.[emoji]?.includes(user.uid));

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setShareFeedback("Link copied!");
      setTimeout(() => setShareFeedback(""), 2000);
    } catch {
      setShareFeedback("Failed to copy");
      setTimeout(() => setShareFeedback(""), 2000);
    }
  }

  function handleDoubleTap() {
    if (!hasLiked) {
      handleLike();
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
  }

  const doubleTapRef = useDoubleTap(handleDoubleTap, 300);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isSwiping) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchStartX.current - touchCurrentX.current;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 120));
    }
  }

  function handleTouchEnd() {
    if (swipeOffset > 60) {
      setShowControls(true);
    }
    setSwipeOffset(0);
    setIsSwiping(false);
  }


  const hasLiked = likes.includes(user.uid);
  const isSaved = saves.includes(user.uid);
  const savedCollectionCount = savedCollections.filter((collection) =>
    collection.postIds.includes(post.id)
  ).length;
  const postType = post.postType ?? "standard";

  useEffect(() => {
    setComments([]);
    setCommentsPage(1);
  }, [post.id]);

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
          <div
            ref={doubleTapRef}
            className="relative overflow-hidden rounded-xl border bg-muted"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ transform: `translateX(-${swipeOffset}px)`, transition: isSwiping ? 'none' : 'transform 0.3s ease' }}
          >
            {mediaItems[0].type === "video" ? (
              <video src={mediaItems[0].url} controls className="max-h-[640px] w-full bg-black object-contain" />
            ) : (
              <img src={mediaItems[0].url} alt={post.accessibilityLabel || post.caption || "Post media"} className="max-h-[640px] w-full object-cover" />
            )}
            {showHeartAnimation && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Heart className="h-24 w-24 animate-ping fill-current text-white" />
              </div>
            )}
            {isSwiping && swipeOffset > 0 && (
              <div className="absolute inset-y-0 left-0 flex items-center bg-primary/20 px-4" style={{ width: swipeOffset }}>
                <Bookmark className="h-6 w-6 text-primary" />
              </div>
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(true)}
            >
              <MessageCircle className="mr-1 h-4 w-4" />
              {post.commentsCount}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                const postUrl = `${window.location.origin}/post/${post.id}`;
                const shareData = {
                  title: post.author.name,
                  text: post.caption || "Check out this post on HoopLink",
                  url: postUrl,
                };

                if (navigator.share) {
                  try {
                    await navigator.share(shareData);
                    setShareFeedback("Shared!");
                    setTimeout(() => setShareFeedback(""), 2000);
                  } catch {
                    await copyToClipboard(postUrl);
                  }
                } else {
                  await copyToClipboard(postUrl);
                }
              }}
            >
              <Share2 className="mr-1 h-4 w-4" />
              {shareFeedback || post.shares}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden items-center gap-1 sm:flex">
              <Eye className="h-4 w-4" />
              {post.views ?? 0}
            </span>
            <div className="relative flex flex-wrap items-center gap-2 sm:justify-end">
              <div className="flex flex-wrap items-center gap-1">
                {POST_REACTION_EMOJIS.map((emoji) => {
                  const count = reactions?.[emoji]?.length ?? 0;
                  const reacted = hasReacted(emoji);
                  return (
                    <Button
                      key={emoji}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (reactionBusy) return;
                        setReactionBusy(true);
                        try {
                          await togglePostReaction(post.id, emoji);
                          setReactions((current) => {
                            const users = current?.[emoji] ?? [];
                            const has = users.includes(user.uid);
                            const nextUsers = has ? users.filter((uid) => uid !== user.uid) : [...users, user.uid];
                            return { ...(current ?? {}), [emoji]: nextUsers };
                          });
                        } finally {
                          setReactionBusy(false);
                        }
                      }}
                      className={reacted ? "px-2 text-primary" : "px-2"}
                      disabled={reactionBusy}
                      aria-label={`React ${emoji}`}
                    >
                      <span className={reacted ? "font-semibold" : ""}>{emoji}</span>
                      <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">{count}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={handleSave} disabled={isBusy}>
              <Bookmark className={`mr-1 h-4 w-4 ${isSaved ? "fill-current text-primary" : ""}`} />
              {savedCollectionCount || saves.length}
            </Button>
          </div>
        </div>

        {showComments ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-0 sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-label="Comments">
            <div className="flex h-[82vh] w-full flex-col rounded-t-2xl bg-background shadow-2xl sm:h-[680px] sm:max-h-[86vh] sm:max-w-xl sm:rounded-2xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <div className="text-base font-semibold">Comments</div>
                  <div className="text-xs text-muted-foreground">{post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}</div>
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label="Close comments" onClick={() => setShowComments(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <CommentsPanel
                postId={post.id}
                comments={comments}
                setComments={setComments}
                totalCount={post.commentsCount}
                visibleCount={commentsPage * 10}
                onLoadMore={() => setCommentsPage((p) => p + 1)}
              />

              <div className="border-t bg-background p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onKeyDown={async (event) => {
                      if (event.key !== "Enter" || event.shiftKey || !commentText.trim() || isBusy) return;
                      event.preventDefault();
                      const text = commentText;
                      setCommentText("");
                      try {
                        setIsBusy(true);
                        await addPostComment(post.id, text);
                      } catch {
                        setCommentText(text);
                      } finally {
                        setIsBusy(false);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={!commentText.trim() || isBusy}
                    onClick={async () => {
                      const text = commentText;
                      setCommentText("");
                      try {
                        setIsBusy(true);
                        await addPostComment(post.id, text);
                      } catch {
                        setCommentText(text);
                      } finally {
                        setIsBusy(false);
                      }
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </CardContent>

    </Card>
  );
}
