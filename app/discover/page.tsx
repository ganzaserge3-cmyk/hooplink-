"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFilterPresets, saveFilterPreset, type SavedFilterPreset } from "@/lib/discovery";
import { getRegionFromLocation, REGION_TABS } from "@/lib/phase9";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";

function DiscoverPageContent() {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [filters, setFilters] = useState({
    sport: "",
    position: "",
    location: "",
    role: "",
    minAge: "",
    maxAge: "",
    height: "",
    verifiedOnly: false,
  });
  const [regionTab, setRegionTab] = useState<(typeof REGION_TABS)[number]>("All");
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<SavedFilterPreset[]>([]);

  useEffect(() => {
    void Promise.all([searchProfiles(""), getFilterPresets("discover")]).then(([nextProfiles, nextPresets]) => {
      setProfiles(nextProfiles);
      setPresets(nextPresets);
    });
  }, []);

  const filteredProfiles = useMemo(
    () =>
      profiles.filter((profile) => {
        const age = profile.role?.age ?? null;
        const checks = [
          !filters.sport || profile.role?.sport?.toLowerCase().includes(filters.sport.toLowerCase()),
          !filters.position || profile.role?.position?.toLowerCase().includes(filters.position.toLowerCase()),
          !filters.location || profile.location?.toLowerCase().includes(filters.location.toLowerCase()),
          !filters.role || profile.role?.type?.toLowerCase().includes(filters.role.toLowerCase()),
          !filters.minAge || (age !== null && age >= Number(filters.minAge)),
          !filters.maxAge || (age !== null && age <= Number(filters.maxAge)),
          !filters.height || profile.role?.height?.toLowerCase().includes(filters.height.toLowerCase()),
          !filters.verifiedOnly || profile.verified,
          regionTab === "All" || getRegionFromLocation(profile.location) === regionTab,
        ];

        return checks.every(Boolean);
      }),
    [filters, profiles, regionTab]
  );

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Recruiter Discovery</CardTitle>
            <CardDescription>Filter athletes, coaches, scouts, and fans by role, age, height, location, and verification.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <Link href="/recruiting" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">Open recruiting board</Link>
              <Link href="/teams" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">Browse team pages</Link>
              <Link href="/spotlights" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">Athlete spotlights</Link>
              <Link href="/leaderboards" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">Leaderboards</Link>
              <Link href="/org" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">Org dashboard</Link>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-4 flex flex-wrap gap-2">
                {REGION_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`rounded-full border px-3 py-2 text-sm ${regionTab === tab ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/40"}`}
                    onClick={() => setRegionTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <Input value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))} placeholder="Role" />
              <Input value={filters.sport} onChange={(event) => setFilters((current) => ({ ...current, sport: event.target.value }))} placeholder="Sport" />
              <Input value={filters.position} onChange={(event) => setFilters((current) => ({ ...current, position: event.target.value }))} placeholder="Position" />
              <Input value={filters.location} onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
              <Input value={filters.minAge} onChange={(event) => setFilters((current) => ({ ...current, minAge: event.target.value }))} placeholder="Min age" />
              <Input value={filters.maxAge} onChange={(event) => setFilters((current) => ({ ...current, maxAge: event.target.value }))} placeholder="Max age" />
              <Input value={filters.height} onChange={(event) => setFilters((current) => ({ ...current, height: event.target.value }))} placeholder="Height" />
              <label className="flex items-center gap-2 rounded-md border px-3 text-sm">
                <input type="checkbox" checked={filters.verifiedOnly} onChange={(event) => setFilters((current) => ({ ...current, verifiedOnly: event.target.checked }))} />
                Verified
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <Input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Save filter preset as..." />
              <button
                type="button"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={() =>
                  void saveFilterPreset({ scope: "discover", name: presetName || "Discover preset", filters }).then(async () => {
                    setPresetName("");
                    setPresets(await getFilterPresets("discover"));
                  })
                }
              >
                Save Preset
              </button>
            </div>

            {presets.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40"
                    onClick={() =>
                      setFilters({
                        sport: String(preset.filters.sport ?? ""),
                        position: String(preset.filters.position ?? ""),
                        location: String(preset.filters.location ?? ""),
                        role: String(preset.filters.role ?? ""),
                        minAge: String(preset.filters.minAge ?? ""),
                        maxAge: String(preset.filters.maxAge ?? ""),
                        height: String(preset.filters.height ?? ""),
                        verifiedOnly: Boolean(preset.filters.verifiedOnly),
                      })
                    }
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {filteredProfiles.map((profile) => (
                <Link key={profile.uid} href={`/profile/${profile.uid}`} className="rounded-xl border p-4 hover:bg-muted/40">
                  <div className="flex gap-3">
                    <img src={profile.photoURL || "https://placehold.co/64x64?text=D"} alt={profile.displayName} className="h-12 w-12 rounded-full" />
                    <div>
                      <p className="font-semibold">{profile.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {[profile.role?.type, profile.role?.sport, profile.role?.position, profile.location].filter(Boolean).join(" • ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[profile.role?.team, profile.role?.experience, profile.role?.age ? `${profile.role.age}yo` : "", profile.role?.height].filter(Boolean).join(" • ")}
                      </p>
                      {profile.role?.bio ? <p className="mt-2 text-sm">{profile.role.bio}</p> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function DiscoverPage() {
  return (
    <AuthProvider>
      <DiscoverPageContent />
    </AuthProvider>
  );
}
