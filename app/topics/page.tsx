"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserSettings, getTrendingTopics, toggleTopicFollow } from "@/lib/settings";

function TopicsPageContent() {
  const [topics, setTopics] = useState<Array<{ tag: string; count: number }>>([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);

  const refresh = async () => {
    setTopics(await getTrendingTopics());
    const settings = await getCurrentUserSettings();
    setFollowedTopics(settings.followedTopics);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Trending Topics</CardTitle>
            <CardDescription>Follow topics to shape discovery and keep your favorite conversations close.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topics.map((topic) => {
              const isFollowing = followedTopics.includes(topic.tag);
              return (
                <div key={topic.tag} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <Link href={`/topics/${topic.tag}`} className="font-semibold hover:underline">
                      #{topic.tag}
                    </Link>
                    <p className="text-sm text-muted-foreground">{topic.count} posts</p>
                  </div>
                  <Button
                    variant={isFollowing ? "default" : "outline"}
                    onClick={() => void toggleTopicFollow(topic.tag, isFollowing).then(refresh)}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function TopicsPage() {
  return (
    <AuthProvider>
      <TopicsPageContent />
    </AuthProvider>
  );
}
