"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentWeeklyChallenge, getWeeklyChallengePosts } from "@/lib/athlete";
import type { FeedPost } from "@/lib/posts";

function ChallengesPageContent() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const challenge = getCurrentWeeklyChallenge();

  useEffect(() => {
    void getWeeklyChallengePosts().then(setPosts);
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Challenge</CardTitle>
            <CardDescription>Join the current community challenge and post your best clip or answer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4">
              <p className="text-lg font-semibold">{challenge.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>
              <p className="mt-3 text-sm font-medium text-primary">Use #{challenge.hashtag}</p>
              <Button className="mt-4" asChild>
                <Link href={`/upload?caption=%23${challenge.hashtag}`}>Post Challenge Entry</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <Link key={post.id} href={post.contentType === "reel" ? "/reels" : "/feed"} className="rounded-xl border p-4 hover:bg-muted/40">
                  <p className="font-semibold">{post.author.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{post.caption || post.sport}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function ChallengesPage() {
  return (
    <AuthProvider>
      <ChallengesPageContent />
    </AuthProvider>
  );
}
