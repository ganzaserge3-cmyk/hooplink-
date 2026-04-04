"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewedPosts, type ViewedPostRecord } from "@/lib/history";
import { formatTimeAgo, searchPosts, type FeedPost } from "@/lib/posts";

function HistoryPageContent() {
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const [history, allPosts] = await Promise.all([getViewedPosts(), searchPosts("")]);
      const postMap = new Map(allPosts.map((post: FeedPost) => [post.id, post]));
      setPosts(
        history
          .map((entry: ViewedPostRecord) => postMap.get(entry.postId))
          .filter((post: FeedPost | undefined): post is FeedPost => Boolean(post))
      );
    };

    void loadHistory();
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Views</CardTitle>
            <CardDescription>Posts and reels you recently opened or watched.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-xl bg-muted p-6 text-sm text-muted-foreground">
                No view history yet. Open posts from the feed or reels and they will show up here.
              </div>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={post.contentType === "reel" ? "/reels" : "/feed"}
                  className="block rounded-xl border p-4 hover:bg-muted/40"
                >
                  <p className="font-semibold">{post.author.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {post.caption || post.sport} • {formatTimeAgo(post.createdAt)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function HistoryPage() {
  return (
    <AuthProvider>
      <HistoryPageContent />
    </AuthProvider>
  );
}
