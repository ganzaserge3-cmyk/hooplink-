"use client";

import { FormEvent, useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addRecoveryJournalEntry,
  getCurrentSeasonDashboard,
  getCurrentUserLiveScores,
  getCurrentUserRecoveryJournal,
  type LiveScoreRecord,
  type RecoveryJournalEntry,
  type SeasonalDashboard,
} from "@/lib/performance";

function PerformancePageContent() {
  const [scores, setScores] = useState<LiveScoreRecord[]>([]);
  const [entries, setEntries] = useState<RecoveryJournalEntry[]>([]);
  const [season, setSeason] = useState<SeasonalDashboard | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    status: "good" as RecoveryJournalEntry["status"],
    energy: "7",
    soreness: "3",
    sleepHours: "8",
    notes: "",
  });

  const refresh = async () => {
    const [nextScores, nextEntries, nextSeason] = await Promise.all([
      getCurrentUserLiveScores(),
      getCurrentUserRecoveryJournal(),
      getCurrentSeasonDashboard(),
    ]);
    setScores(nextScores);
    setEntries(nextEntries);
    setSeason(nextSeason);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Performance Hub</h1>
          <p className="text-muted-foreground">
            Track live team scores, log how your body feels, and keep a season-level view of your progress.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Live Score Widgets</CardTitle>
              <CardDescription>Game scorecards from teams you belong to show up here in real time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scores.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No live scorecards yet. When a coach or team admin updates a game score, it will appear here.
                </div>
              ) : (
                scores.map((score) => (
                  <div key={score.id} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{score.status}</p>
                        <h3 className="font-semibold">{score.teamName} vs {score.opponentName}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{score.teamScore} - {score.opponentScore}</p>
                        <p className="text-sm text-muted-foreground">{score.periodLabel}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Season Dashboard</CardTitle>
              <CardDescription>Built from your game log, content reach, and recovery trend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {season ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Record</p>
                      <p className="text-2xl font-bold">{season.wins}-{season.losses}</p>
                    </div>
                    <div className="rounded-xl bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Games Played</p>
                      <p className="text-2xl font-bold">{season.gamesPlayed}</p>
                    </div>
                    <div className="rounded-xl bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Averages</p>
                      <p className="text-sm font-medium">{season.avgPoints} PTS · {season.avgAssists} AST · {season.avgRebounds} REB</p>
                    </div>
                    <div className="rounded-xl bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Recovery Trend</p>
                      <p className="text-2xl font-bold">{season.recoveryTrend}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">Best game</p>
                    <p className="font-semibold">
                      {season.bestGame ? `${season.bestGame.label} · ${season.bestGame.totalContribution} total impact` : "Add game logs to unlock this"}
                    </p>
                  </div>
                  <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                    {season.totalPosts} uploads generated {season.totalViews} views this season. Current availability: {season.availability.replace("_", " ")}.
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Seasonal performance appears after you add game logs and activity.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Journal</CardTitle>
              <CardDescription>Log soreness, sleep, and readiness so you can spot patterns early.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  setSubmitting(true);
                  try {
                    await addRecoveryJournalEntry({
                      date: form.date,
                      status: form.status,
                      energy: Number(form.energy),
                      soreness: Number(form.soreness),
                      sleepHours: Number(form.sleepHours),
                      notes: form.notes,
                    });
                    setForm((current) => ({ ...current, notes: "" }));
                    await refresh();
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} type="date" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RecoveryJournalEntry["status"] }))} className="h-10 rounded-md border border-input px-3 text-sm">
                    <option value="great">Great</option>
                    <option value="good">Good</option>
                    <option value="sore">Sore</option>
                    <option value="injured">Injured</option>
                  </select>
                  <input value={form.energy} onChange={(event) => setForm((current) => ({ ...current, energy: event.target.value }))} type="number" min={1} max={10} placeholder="Energy 1-10" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={form.soreness} onChange={(event) => setForm((current) => ({ ...current, soreness: event.target.value }))} type="number" min={1} max={10} placeholder="Soreness 1-10" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={form.sleepHours} onChange={(event) => setForm((current) => ({ ...current, sleepHours: event.target.value }))} type="number" min={0} max={14} step="0.5" placeholder="Sleep hours" className="h-10 rounded-md border border-input px-3 text-sm sm:col-span-2" />
                </div>
                <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Body felt explosive, left knee tight, heavy legs after travel..." className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Recovery Entry"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entries.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No recovery entries yet. Start with a quick daily check-in.
                </div>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{entry.date}</p>
                        <p className="text-sm text-muted-foreground capitalize">{entry.status}</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Energy {entry.energy}/10</p>
                        <p>Soreness {entry.soreness}/10 · Sleep {entry.sleepHours}h</p>
                      </div>
                    </div>
                    {entry.notes ? <p className="mt-3 text-sm">{entry.notes}</p> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function PerformancePage() {
  return (
    <AuthProvider>
      <PerformancePageContent />
    </AuthProvider>
  );
}
