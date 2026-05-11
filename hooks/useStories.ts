import { useState, useEffect, useMemo } from "react";
import { getActiveStories, type StoryItem } from "@/lib/stories";

export function useStories() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    void getActiveStories().then((nextStories) => {
      if (isMounted) {
        setStories(nextStories);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;   
    };
  }, []);

  const storyHighlights = useMemo(() => {
    const uniqueStories = new Map<string, StoryItem>();

    stories.forEach((story) => {
      if (!uniqueStories.has(story.userId)) {
        uniqueStories.set(story.userId, story);
      }
    });

    return Array.from(uniqueStories.values());
  }, [stories]);

  return { stories, storyHighlights, loading };
}