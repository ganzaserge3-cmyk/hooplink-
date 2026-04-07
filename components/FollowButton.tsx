"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toggleFollowUser, getUserProfileById } from "@/lib/user-profile";

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

  const handleFollowClick = async () => {
    if (!user) {
      // Redirect to login or show login modal
      window.location.href = "/login";
      return;
    }

    setPending(true);
    try {
      // Toggle follow status
      await toggleFollowUser(targetUid, currentFollowing);
      
      // Update local state
      const newFollowingStatus = !currentFollowing;
      setCurrentFollowing(newFollowingStatus);
      
      // Call callback if provided
      onFollowChange?.(newFollowingStatus);
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      // Optionally show error toast here
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
      disabled={!user || pending}
      variant={currentFollowing && showFollowing ? "secondary" : variant}
      size={size}
      className={className}
    >
      {pending ? "..." : buttonText}
    </Button>
  );
}
