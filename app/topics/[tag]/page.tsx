"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeToTopicPosts, type FeedPost } from "@/lib/posts";
import { getCurrentUserSettings, toggleTopicFollow } from "@/lib/settings";

function TopicPageContent({ params }: { params: { tag: string } }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => subscribeToTopicPosts(params.tag, setPosts), [params.tag]);

  useEffect(() => {
    void getCurrentUserSettings().then((settings) =>
      setIsFollowing(settings.followedTopics.includes(params.tag.toLowerCase()))
    );
  }, [params.tag]);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>#{params.tag}</CardTitle>
            <Button
              variant={isFollowing ? "default" : "outline"}
              onClick={() =>
                void toggleTopicFollow(params.tag, isFollowing).then(() => setIsFollowing((current) => !current))
              }
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts in this topic yet.</p>
            ) : (
              posts.map((post) => (
                <Link key={post.id} href={post.contentType === "reel" ? "/reels" : "/feed"} className="block rounded-xl border p-4 hover:bg-muted/40">
                  <p className="font-semibold">{post.author.name}</p>
                  <p className="text-sm text-muted-foreground">{post.caption}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function TopicPage({ params }: { params: { tag: string } }) {
  return (
    <AuthProvider>
      <TopicPageContent params={params} />
    </AuthProvider>
  );
}
