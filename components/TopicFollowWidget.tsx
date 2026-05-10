import React from "react";

interface TopicFollowWidgetProps {
  topics: string[];
  followedTopics: string[];
  pendingTopic?: string | null;
  onFollowTopic: (topic: string) => void;
}

/**
 * A widget to display suggested topics with follow/unfollow functionality.
 */
export function TopicFollowWidget({
  topics,
  followedTopics,
  pendingTopic,
  onFollowTopic,
}: TopicFollowWidgetProps) {
  if (topics.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Follow a few topics to make your feed more personal.
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {topics.map((topic) => {
        const isFollowingTopic = followedTopics.includes(topic);
        return (
          <button
            key={topic}
            type="button"
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              isFollowingTopic
                ? "border-primary bg-primary/5 text-primary"
                : "hover:border-primary/30 bg-background"
            }`}
            disabled={pendingTopic === topic}
            onClick={() => onFollowTopic(topic)}
          >
            {isFollowingTopic ? "Following" : "Follow"} #{topic}
          </button>
        );
      })}
    </div>
  );
}