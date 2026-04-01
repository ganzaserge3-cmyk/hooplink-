"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTeam, getTeamInvites, respondToTeamInvite, subscribeToTeams, type TeamInvite, type TeamRecord } from "@/lib/teams";

function TeamsPageContent() {
  const { user } = useAuthContext();
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [form, setForm] = useState({ name: "", sport: "", location: "", bio: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeToTeams(setTeams), []);

  useEffect(() => {
    if (!user) {
      return;
    }

    void getTeamInvites().then(setInvites);
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createTeam(form);
      setForm({ name: "", sport: "", location: "", bio: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Create a team page, manage invitations, and step into a full team workspace.</p>
        </div>

        {invites.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Team Invites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-semibold">{invite.teamName}</p>
                    <p className="text-sm text-muted-foreground">Role offered: {invite.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => void respondToTeamInvite(invite.id, "accepted").then(() => getTeamInvites().then(setInvites))}>
                      Accept
                    </Button>
                    <Button variant="outline" onClick={() => void respondToTeamInvite(invite.id, "declined").then(() => getTeamInvites().then(setInvites))}>
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 md:grid-cols-[0.95fr,1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Create Team</CardTitle>
              <CardDescription>Best for coaches, clubs, and organizations building a public presence.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Team name" />
                <Input value={form.sport} onChange={(event) => setForm((current) => ({ ...current, sport: event.target.value }))} placeholder="Sport" />
                <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
                <textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder="What is this program about?" className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <Button type="submit" disabled={saving || !form.name.trim() || !form.sport.trim()}>
                  {saving ? "Creating..." : "Create team"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Team Pages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teams.length === 0 ? (
                <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No teams yet. Create the first one.</div>
              ) : (
                teams.map((team) => (
                  <Link key={team.id} href={`/teams/${team.id}`} className="block rounded-xl border p-4 hover:bg-muted/40">
                    <p className="font-semibold">{team.name}</p>
                    <p className="text-sm text-muted-foreground">{[team.sport, team.location].filter(Boolean).join(" • ")}</p>
                    <p className="mt-2 text-sm">{team.bio}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{team.memberIds.length} members • {team.adminIds.length} admins</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/org">Organization Dashboard</Link>
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function TeamsPage() {
  return (
    <AuthProvider>
      <TeamsPageContent />
    </AuthProvider>
  );
}
