import React from "react";

interface TrendingTopicsWidgetProps {
  topics: string[];
  activeTopic?: string;
  onSelectTopic: (topic: string) => void;
}

/**
 * A widget to display and select from a list of trending topics.
 */
export function TrendingTopicsWidget({
  topics,
  activeTopic,
  onSelectTopic,
}: TrendingTopicsWidgetProps) {
  if (topics.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {topics.map((topic) => (
        <button
          key={topic}
          type="button"
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
            activeTopic === topic
              ? "border-primary bg-primary/5 text-primary"
              : "hover:border-primary/30 bg-background"
          }`}
          onClick={() => onSelectTopic(topic)}
        >
          #{topic}
        </button>
      ))}
    </div>
  );
}