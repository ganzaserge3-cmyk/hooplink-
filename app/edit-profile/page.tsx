"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUserProfile, updateCurrentUserProfile } from "@/lib/user-profile";

function EditProfilePageContent() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    sport: "",
    position: "",
    team: "",
    experience: "",
    age: "",
    height: "",
    location: "",
    bio: "",
    pointsPerGame: "",
    assistsPerGame: "",
    reboundsPerGame: "",
    skills: "",
    achievements: "",
    gameLogs: "",
    profileTheme: "classic",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    getCurrentUserProfile().then((profile) => {
      const role = (profile?.role as Record<string, unknown> | undefined) ?? {};
      const athleteProfile = (profile?.athleteProfile as Record<string, unknown> | undefined) ?? {};
      const stats = (athleteProfile.stats as Record<string, unknown> | undefined) ?? {};
      const gameLogs = Array.isArray(athleteProfile.gameLogs)
        ? (athleteProfile.gameLogs as Array<Record<string, unknown>>)
        : [];

      setFormData({
        displayName: user.displayName || String(profile?.displayName ?? ""),
        username: String(profile?.username ?? user.uid.slice(0, 8)),
        sport: String(role.sport ?? ""),
        position: String(role.position ?? ""),
        team: String(role.team ?? ""),
        experience: String(role.experience ?? ""),
        age: role.age ? String(role.age) : "",
        height: String(role.height ?? ""),
        location: String(profile?.location ?? ""),
        bio: String(role.bio ?? ""),
        pointsPerGame: stats.pointsPerGame ? String(stats.pointsPerGame) : "",
        assistsPerGame: stats.assistsPerGame ? String(stats.assistsPerGame) : "",
        reboundsPerGame: stats.reboundsPerGame ? String(stats.reboundsPerGame) : "",
        skills: Array.isArray(athleteProfile.skills) ? (athleteProfile.skills as string[]).join(", ") : "",
        achievements: Array.isArray(athleteProfile.achievements) ? (athleteProfile.achievements as string[]).join(", ") : "",
        gameLogs: gameLogs
          .map((log) =>
            [
              String(log.date ?? ""),
              String(log.opponent ?? ""),
              String(log.points ?? ""),
              String(log.assists ?? ""),
              String(log.rebounds ?? ""),
              String(log.result ?? ""),
            ].join("|")
          )
          .join("\n"),
        profileTheme: String(profile?.profileTheme ?? "classic"),
      });
    });
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateCurrentUserProfile({
        displayName: formData.displayName,
        username: formData.username,
        sport: formData.sport,
        position: formData.position,
        team: formData.team,
        experience: formData.experience,
        age: formData.age ? Number(formData.age) : undefined,
        height: formData.height,
        location: formData.location,
        bio: formData.bio,
        avatarFile,
        coverPhotoFile,
        profileTheme: formData.profileTheme,
        stats: {
          pointsPerGame: formData.pointsPerGame ? Number(formData.pointsPerGame) : undefined,
          assistsPerGame: formData.assistsPerGame ? Number(formData.assistsPerGame) : undefined,
          reboundsPerGame: formData.reboundsPerGame ? Number(formData.reboundsPerGame) : undefined,
        },
        skills: formData.skills.split(",").map((value) => value.trim()).filter(Boolean),
        achievements: formData.achievements.split(",").map((value) => value.trim()).filter(Boolean),
        gameLogs: formData.gameLogs
          .split("\n")
          .map((row) => row.trim())
          .filter(Boolean)
          .map((row) => {
            const [date, opponent, points, assists, rebounds, result] = row.split("|");
            return {
              date: (date ?? "").trim(),
              opponent: (opponent ?? "").trim(),
              points: points ? Number(points.trim()) : undefined,
              assists: assists ? Number(assists.trim()) : undefined,
              rebounds: rebounds ? Number(rebounds.trim()) : undefined,
              result: (result ?? "").trim(),
            };
          }),
      });
      router.push("/profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>Update your public identity, athlete details, stat card, trophies, and game log history.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input value={formData.displayName} onChange={(event) => setFormData((current) => ({ ...current, displayName: event.target.value }))} placeholder="Display name" />
              <Input value={formData.username} onChange={(event) => setFormData((current) => ({ ...current, username: event.target.value }))} placeholder="Username" />
              <Input type="file" accept="image/*" onChange={(event: ChangeEvent<HTMLInputElement>) => setAvatarFile(event.target.files?.[0] ?? null)} />
              <Input type="file" accept="image/*" onChange={(event: ChangeEvent<HTMLInputElement>) => setCoverPhotoFile(event.target.files?.[0] ?? null)} />
              <select
                value={formData.profileTheme}
                onChange={(event) => setFormData((current) => ({ ...current, profileTheme: event.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="classic">Classic</option>
                <option value="sunset">Sunset</option>
                <option value="court">Court</option>
                <option value="midnight">Midnight</option>
              </select>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input value={formData.sport} onChange={(event) => setFormData((current) => ({ ...current, sport: event.target.value }))} placeholder="Sport" />
                <Input value={formData.position} onChange={(event) => setFormData((current) => ({ ...current, position: event.target.value }))} placeholder="Position" />
                <Input value={formData.team} onChange={(event) => setFormData((current) => ({ ...current, team: event.target.value }))} placeholder="Team / organization" />
                <Input value={formData.experience} onChange={(event) => setFormData((current) => ({ ...current, experience: event.target.value }))} placeholder="Experience level" />
                <Input value={formData.age} type="number" onChange={(event) => setFormData((current) => ({ ...current, age: event.target.value }))} placeholder="Age" />
                <Input value={formData.height} onChange={(event) => setFormData((current) => ({ ...current, height: event.target.value }))} placeholder="Height" />
              </div>
              <Input value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
              <textarea value={formData.bio} onChange={(event) => setFormData((current) => ({ ...current, bio: event.target.value }))} placeholder="Bio" className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />

              <div className="grid gap-4 sm:grid-cols-3">
                <Input value={formData.pointsPerGame} type="number" onChange={(event) => setFormData((current) => ({ ...current, pointsPerGame: event.target.value }))} placeholder="Points per game" />
                <Input value={formData.assistsPerGame} type="number" onChange={(event) => setFormData((current) => ({ ...current, assistsPerGame: event.target.value }))} placeholder="Assists per game" />
                <Input value={formData.reboundsPerGame} type="number" onChange={(event) => setFormData((current) => ({ ...current, reboundsPerGame: event.target.value }))} placeholder="Rebounds per game" />
              </div>

              <Input value={formData.skills} onChange={(event) => setFormData((current) => ({ ...current, skills: event.target.value }))} placeholder="Skills, comma separated" />
              <Input value={formData.achievements} onChange={(event) => setFormData((current) => ({ ...current, achievements: event.target.value }))} placeholder="Achievements / trophies, comma separated" />
              <textarea
                value={formData.gameLogs}
                onChange={(event) => setFormData((current) => ({ ...current, gameLogs: event.target.value }))}
                placeholder="Game logs: date|opponent|points|assists|rebounds|result"
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function EditProfilePage() {
  return (
    <AuthProvider>
      <EditProfilePageContent />
    </AuthProvider>
  );
}
