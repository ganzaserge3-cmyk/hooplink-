import { useState, useEffect } from "react";
import { getCurrentUserProfile } from "@/lib/user-profile";

export function useUserProfile() {
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [currentUserLocation, setCurrentUserLocation] = useState("");
  const [currentUserTeam, setCurrentUserTeam] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");

  useEffect(() => {
    void getCurrentUserProfile().then((profile) => {
      setFollowingIds(Array.isArray(profile?.following) ? (profile.following as string[]) : []);
      setCurrentUserLocation(String(profile?.location ?? ""));
      setCurrentUserRole(String((profile?.role as Record<string, unknown> | undefined)?.type ?? ""));
      setCurrentUserTeam(String((profile?.role as Record<string, unknown> | undefined)?.team ?? ""));
    });
  }, []);

  return {
    followingIds,
    currentUserLocation,
    currentUserTeam,
    currentUserRole,
  };
}