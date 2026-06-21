"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toggleFollowUser } from "@/lib/user-profile";

interface FollowButtonProps {
  targetUid: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  displayName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  showFollowing?: boolean;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function FollowButton({
  targetUid,
  isFollowing,
  onFollowChange,
  displayName = "User",
  variant = "default",
  showFollowing = true,
  size = "default",
  className = "",
}: FollowButtonProps) {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [currentFollowing, setCurrentFollowing] = useState(isFollowing);

  useEffect(() => {
    setCurrentFollowing(isFollowing);
  }, [isFollowing, targetUid]);

  const handleFollowClick = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (pending) return;

    const previousFollowing = currentFollowing;
    const nextFollowing = !previousFollowing;
    setCurrentFollowing(nextFollowing);
    onFollowChange?.(nextFollowing);
    setPending(true);

    try {
      await toggleFollowUser(targetUid, previousFollowing);
    } catch (error) {
      console.error(`Failed to toggle follow for ${displayName}:`, error);
      setCurrentFollowing(previousFollowing);
      onFollowChange?.(previousFollowing);
    } finally {
      setPending(false);
    }
  };

  const buttonText = currentFollowing
    ? showFollowing
      ? "Following"
      : "Unfollow"
    : "Follow";

  return (
    <Button
      onClick={handleFollowClick}
      disabled={!user}
      variant={currentFollowing && showFollowing ? "secondary" : variant}
      size={size}
      className={className}
      aria-busy={pending}
    >
      {pending ? (currentFollowing ? "Following" : "Follow") : buttonText}
    </Button>
  );
}