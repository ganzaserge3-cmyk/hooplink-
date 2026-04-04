"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getComparableAthletes,
  getDirectoryData,
  getGraduationYear,
  getPositionArchetype,
  getScoutWatchlistsByClassYear,
} from "@/lib/phase5";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";

function DirectoryPageContent() {
  const [sport, setSport] = useState("");
  const [region, setRegion] = useState("");
  const [selectedProfileUid, setSelectedProfileUid] = useState("");
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [comparables, setComparables] = useState<SearchProfile[]>([]);
  const [watchlists, setWatchlists] = useState<Array<{ classYear: string; items: Array<{ target: { id: string; stage: string; note: string }; profile?: SearchProfile }> }>>([]);
  const [directory, setDirectory] = useState<Awaited<ReturnType<typeof getDirectoryData>>>({
    verifiedScouts: [],
    coaches: [],
    clubs: [],
  });

  const refresh = async (nextSport = sport, nextRegion = region) => {
    const [nextDirectory, nextProfiles, nextWatchlists] = await Promise.all([
      getDirectoryData({ sport: nextSport, region: nextRegion }),
      searchProfiles(""),
      getScoutWatchlistsByClassYear(),
    ]);
    setDirectory(nextDirectory);
    setProfiles(nextProfiles);
    setWatchlists(nextWatchlists as never);
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selectedProfileUid) {
      setComparables([]);
      return;
    }

    void getComparableAthletes(selectedProfileUid).then(setComparables);
  }, [selectedProfileUid]);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Phase 5 Directory</h1>
          <p className="text-muted-foreground">
            Verified scouts, coach directories, clubs, academies, class-year watchlists, archetypes, and comparable athletes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Directory Filters</CardTitle>
            <CardDescription>Use sport and region to narrow the directories.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Input value={sport} onChange={(event) => setSport(event.target.value)} placeholder="Sport" />
            <Input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Region or city" />
            <Button onClick={() => void refresh(sport, region)}>Apply</Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Verified Scouts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {directory.verifiedScouts.map((profile: SearchProfile) => (
                <Link key={profile.uid} href={`/profile/${profile.uid}`} className="block rounded-xl border p-3 hover:bg-muted/40">
                  <p className="font-semibold">{profile.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {[profile.role?.sport, profile.location].filter(Boolean).join(" • ")}
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coach Directory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {directory.coaches.map((profile: SearchProfile) => (
                <Link key={profile.uid} href={`/profile/${profile.uid}`} className="block rounded-xl border p-3 hover:bg-muted/40">
                  <p className="font-semibold">{profile.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {[profile.role?.sport, profile.role?.team, profile.location].filter(Boolean).join(" • ")}
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clubs & Academies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {directory.clubs.map((team: { id: string; name: string; sport: string; location: string }) => (
                <Link key={team.id} href={`/teams/${team.id}`} className="block rounded-xl border p-3 hover:bg-muted/40">
                  <p className="font-semibold">{team.name}</p>
                  <p className="text-sm text-muted-foreground">{[team.sport, team.location].filter(Boolean).join(" • ")}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Comparable Athletes</CardTitle>
              <CardDescription>Pick a profile to generate comparable athlete suggestions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={selectedProfileUid}
                onChange={(event) => setSelectedProfileUid(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Choose athlete</option>
                {profiles
                  .filter((profile) => profile.role?.type === "athlete")
                  .map((profile) => (
                    <option key={profile.uid} value={profile.uid}>
                      {profile.displayName}
                    </option>
                  ))}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                {comparables.map((profile) => (
                  <Link key={profile.uid} href={`/profile/${profile.uid}`} className="rounded-xl border p-3 hover:bg-muted/40">
                    <p className="font-semibold">{profile.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {[profile.role?.sport, profile.role?.position, getPositionArchetype(profile)].filter(Boolean).join(" • ")}
                    </p>
                    <p className="text-xs text-muted-foreground">Class year {getGraduationYear(profile) ?? "Unknown"}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scout Watchlists By Class Year</CardTitle>
              <CardDescription>See your current recruiting board grouped by estimated graduation year.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {watchlists.map((group) => (
                <div key={group.classYear} className="rounded-xl border p-4">
                  <p className="font-semibold">Class of {group.classYear}</p>
                  <div className="mt-3 space-y-2">
                    {group.items.map(({ target, profile }) => (
                      <div key={target.id} className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{profile?.displayName || target.id}</p>
                        <p className="text-muted-foreground">
                          {[profile?.role?.position, getPositionArchetype((profile ?? {}) as SearchProfile), target.stage].filter(Boolean).join(" • ")}
                        </p>
                        <p className="mt-1">{target.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function DirectoryPage() {
  return (
    <AuthProvider>
      <DirectoryPageContent />
    </AuthProvider>
  );
}
