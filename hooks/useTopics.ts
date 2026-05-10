import { useState, useEffect, useMemo } from "react";
import { FeedPost } from "@/lib/posts";
import { getCurrentUserProfile, toggleFollowTopic } from "@/lib/user-profile";

export function useTopics(posts: FeedPost[]) {
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);

  useEffect(() => {
    void getCurrentUserProfile().then((profile) => {
      setFollowedTopics(Array.isArray(profile?.followedTopics) ? (profile.followedTopics as string[]) : []);
    });
  }, []);

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

  const handleTopicFollow = async (topic: string) => {
    if (pendingTopic) return;
    
    setPendingTopic(topic);
    try {
      const isFollowing = followedTopics.includes(topic);
      await toggleFollowTopic(topic, isFollowing);
      setFollowedTopics((current) =>
        isFollowing ? current.filter((item) => item !== topic) : [...current, topic]
      );
    } catch (error) {
      console.error("Error toggling topic follow:", error);
    } finally {
      setPendingTopic(null);
    }
  };

  return {
    followedTopics,
    trendingTopics,
    suggestedTopics,
    pendingTopic,
    handleTopicFollow,
  };
}