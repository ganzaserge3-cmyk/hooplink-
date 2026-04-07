"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFollowSuggestions, type FollowSuggestion } from "@/lib/follow-system";
import { FollowButton } from "@/components/FollowButton";

interface FollowSuggestionsProps {
  limit?: number;
  title?: string;
}

export function FollowSuggestions({ limit = 6, title = "Suggested For You" }: FollowSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<FollowSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const data = await getFollowSuggestions(limit);
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [limit]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading suggestions...</div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No suggestions available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.uid} className="flex items-center gap-3 pb-4 border-b last:border-b-0 last:pb-0">
              <Link href={`/profile/${suggestion.uid}`}>
                <Avatar className="h-12 w-12 cursor-pointer hover:opacity-75 transition">
                  <AvatarImage src={suggestion.photoURL || ""} />
                  <AvatarFallback>
                    {suggestion.displayName
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${suggestion.uid}`}>
                  <p className="font-medium truncate hover:underline cursor-pointer">
                    {suggestion.displayName}
                  </p>
                </Link>
                {suggestion.role?.sport && (
                  <p className="text-xs text-muted-foreground">
                    {suggestion.role.sport}
                    {suggestion.role.position ? ` • ${suggestion.role.position}` : ""}
                  </p>
                )}
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{suggestion.followers} followers</span>
                  {suggestion.mutualFollowers > 0 && (
                    <span className="text-primary font-medium">
                      {suggestion.mutualFollowers} mutual
                    </span>
                  )}
                </div>
              </div>

              <FollowButton
                targetUid={suggestion.uid}
                isFollowing={false}
                displayName={suggestion.displayName}
                size="sm"
                variant="default"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
