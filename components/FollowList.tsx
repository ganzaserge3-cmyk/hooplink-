"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFollowersList, getFollowingList } from "@/lib/follow-system";

interface UserCard {
  uid: string;
  displayName: string;
  photoURL?: string;
}

interface FollowListProps {
  userId: string;
  type: "followers" | "following";
  limit?: number;
}

export function FollowList({ userId, type, limit = 50 }: FollowListProps) {
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const data = type === "followers" 
          ? await getFollowersList(userId, limit)
          : await getFollowingList(userId, limit);
        setUsers(data);
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [userId, type, limit]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {type} yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {users.map((user) => (
        <Card key={user.uid} className="p-4">
          <Link href={`/profile/${user.uid}`}>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback>
                  {user.displayName
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">@{user.uid.slice(0, 8)}</p>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
}
