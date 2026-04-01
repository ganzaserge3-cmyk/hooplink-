"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeaturedAthletes, type AthleteSummary } from "@/lib/athlete";

function SpotlightsPageContent() {
  const [athletes, setAthletes] = useState<AthleteSummary[]>([]);

  useEffect(() => {
    void getFeaturedAthletes().then(setAthletes);
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Featured Athlete Spotlights</CardTitle>
            <CardDescription>Discover athletes with strong profiles, verified presence, and standout momentum.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {athletes.map((athlete) => (
              <Link key={athlete.uid} href={`/profile/${athlete.uid}`} className="rounded-xl border p-4 hover:bg-muted/40">
                <div className="flex gap-3">
                  <img src={athlete.photoURL || "https://placehold.co/80x80?text=A"} alt={athlete.displayName} className="h-14 w-14 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold">{athlete.displayName}</p>
                    <p className="text-sm text-muted-foreground">{[athlete.sport, athlete.position, athlete.team].filter(Boolean).join(" • ")}</p>
                    <p className="mt-2 text-sm">PPG {athlete.stats.pointsPerGame} • APG {athlete.stats.assistsPerGame} • RPG {athlete.stats.reboundsPerGame}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{athlete.achievements.slice(0, 2).join(" • ") || `${athlete.followers} followers`}</p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function SpotlightsPage() {
  return (
    <AuthProvider>
      <SpotlightsPageContent />
    </AuthProvider>
  );
}
