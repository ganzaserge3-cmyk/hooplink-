"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGraduationYear, getPositionArchetype, getStatLeaders } from "@/lib/phase5";
import { type SearchProfile } from "@/lib/user-profile";

function LeaderboardsPageContent() {
  const [metric, setMetric] = useState<"followers" | "points" | "assists" | "rebounds">("followers");
  const [classYear, setClassYear] = useState("");
  const [archetype, setArchetype] = useState("");
  const [athletes, setAthletes] = useState<SearchProfile[]>([]);

  useEffect(() => {
    void getStatLeaders({ metric, classYear, archetype }).then((results) => setAthletes(results.slice(0, 20)));
  }, [archetype, classYear, metric]);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboards</CardTitle>
            <CardDescription>Public stat leader pages with class-year filters and position archetype tags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["followers", "points", "assists", "rebounds"] as const).map((value) => (
                <Button key={value} variant={metric === value ? "default" : "outline"} onClick={() => setMetric(value)}>
                  {value}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={classYear} onChange={(event) => setClassYear(event.target.value)} placeholder="Class year" className="h-10 rounded-md border border-input px-3 text-sm" />
              <input value={archetype} onChange={(event) => setArchetype(event.target.value)} placeholder="Archetype" className="h-10 rounded-md border border-input px-3 text-sm" />
            </div>
            <div className="space-y-3">
              {athletes.map((athlete, index) => (
                <Link key={athlete.uid} href={`/profile/${athlete.uid}`} className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{athlete.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {[athlete.role?.sport, athlete.role?.position, athlete.role?.team].filter(Boolean).join(" • ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[`Class ${getGraduationYear(athlete) ?? "?"}`, getPositionArchetype(athlete)].join(" • ")}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    {metric === "followers"
                      ? `${athlete.followers.length} followers`
                      : metric === "points"
                        ? `${athlete.athleteProfile?.stats?.pointsPerGame ?? 0} PPG`
                        : metric === "assists"
                          ? `${athlete.athleteProfile?.stats?.assistsPerGame ?? 0} APG`
                          : `${athlete.athleteProfile?.stats?.reboundsPerGame ?? 0} RPG`}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function LeaderboardsPage() {
  return (
    <AuthProvider>
      <LeaderboardsPageContent />
    </AuthProvider>
  );
}
