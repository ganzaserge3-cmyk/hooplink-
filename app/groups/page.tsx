"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getJoinablePremiumGroups,
  joinPremiumGroup,
  type PremiumGroupRecord,
} from "@/lib/creator-hub";
import { getCurrentUserProfile } from "@/lib/user-profile";

interface ViewerProfile {
  premiumGroupIds?: string[];
}

function GroupsPageContent() {
  const [groups, setGroups] = useState<PremiumGroupRecord[]>([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([getJoinablePremiumGroups(), getCurrentUserProfile()]).then(
      ([nextGroups, profile]) => {
        setGroups(nextGroups);
        setJoinedGroupIds(
          Array.isArray((profile as ViewerProfile | null)?.premiumGroupIds)
            ? ((profile as ViewerProfile).premiumGroupIds as string[])
            : []
        );
      }
    );
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Premium Groups</CardTitle>
            <CardDescription>
              Join creator communities, unlock member-only posts, and keep up with premium drops.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No premium groups yet. Check back after creators launch subscriber spaces.
              </div>
            ) : null}

            {groups.map((group) => {
              const joined = joinedGroupIds.includes(group.id);
              return (
                <div key={group.id} className="rounded-2xl border p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{group.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {group.priceLabel} · {Math.max(0, group.memberIds.length - 1)} members
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild>
                        <Link href={`/profile/${group.ownerId}`}>View creator</Link>
                      </Button>
                      <Button
                        disabled={joined || pendingGroupId === group.id}
                        onClick={async () => {
                          setPendingGroupId(group.id);
                          try {
                            await joinPremiumGroup(group.id);
                            setJoinedGroupIds((current) =>
                              Array.from(new Set([...current, group.id]))
                            );
                          } finally {
                            setPendingGroupId(null);
                          }
                        }}
                      >
                        {joined ? "Joined" : pendingGroupId === group.id ? "Joining..." : "Join group"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function GroupsPage() {
  return (
    <AuthProvider>
      <GroupsPageContent />
    </AuthProvider>
  );
}
