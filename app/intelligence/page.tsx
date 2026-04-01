"use client";

import { useEffect, useMemo, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentSeasonDashboard } from "@/lib/performance";
import {
  addFieldMetric,
  addMoralePulse,
  buildCampaignPerformancePrediction,
  buildDrillRecommendations,
  buildHeatmapBuckets,
  buildLivestreamAnalyticsInsight,
  buildNutritionSuggestions,
  buildOpponentScoutingReport,
  buildRosterBalanceInsight,
  buildSeasonRecapStory,
  buildSleepRecoveryCoaching,
  detectScheduleConflicts,
  getFieldMetrics,
  getModerationRiskScore,
  getMoralePulses,
  getQuietHoursSettings,
  getWearableSyncs,
  isSpamCandidate,
  loadOfflineDraft,
  saveOfflineDraft,
  saveQuietHoursSettings,
  saveWearableSync,
  type FieldMetricRecord,
  type MoralePulseRecord,
  type QuietHoursSettings,
  type WearableSyncRecord,
} from "@/lib/phase10";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";

function IntelligencePageContent() {
  const [wearables, setWearables] = useState<WearableSyncRecord[]>([]);
  const [metrics, setMetrics] = useState<FieldMetricRecord[]>([]);
  const [morale, setMorale] = useState<MoralePulseRecord[]>([]);
  const [quietHours, setQuietHours] = useState<QuietHoursSettings | null>(null);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [season, setSeason] = useState<Awaited<ReturnType<typeof getCurrentSeasonDashboard>> | null>(null);
  const [offlineDraft, setOfflineDraft] = useState("");
  const [installReady, setInstallReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [opponentForm, setOpponentForm] = useState({ opponent: "", tendencies: "", weakSpots: "" });
  const [gameLogSummary, setGameLogSummary] = useState("");
  const [nutritionForm, setNutritionForm] = useState({ goal: "", load: "" });
  const [sleepForm, setSleepForm] = useState({ sleepHours: "8", soreness: "3" });
  const [riskText, setRiskText] = useState("");
  const [wearableForm, setWearableForm] = useState({ provider: "wearable" as WearableSyncRecord["provider"], label: "" });
  const [metricForm, setMetricForm] = useState({ type: "gps" as FieldMetricRecord["type"], label: "", value: "5", notes: "" });
  const [moraleForm, setMoraleForm] = useState({ score: "7", reflection: "" });
  const [scheduleText, setScheduleText] = useState("Practice,2026-04-02T09:00:00Z,2026-04-02T10:30:00Z\nFilm,2026-04-02T10:00:00Z,2026-04-02T11:00:00Z");
  const [campaignMetrics, setCampaignMetrics] = useState({ impressions: "1200", clicks: "52" });
  const [streamMetrics, setStreamMetrics] = useState({ viewers: "140", avgWatchMinutes: "9" });

  const refresh = async () => {
    const [nextWearables, nextMetrics, nextMorale, nextQuietHours, nextProfiles, nextSeason] = await Promise.all([
      getWearableSyncs(),
      getFieldMetrics(),
      getMoralePulses(),
      getQuietHoursSettings(),
      searchProfiles(""),
      getCurrentSeasonDashboard(),
    ]);
    setWearables(nextWearables);
    setMetrics(nextMetrics);
    setMorale(nextMorale);
    setQuietHours(nextQuietHours);
    setProfiles(nextProfiles);
    setSeason(nextSeason);
  };

  useEffect(() => {
    setOfflineDraft(loadOfflineDraft("phase10"));
    void refresh();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const listener = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setInstallReady(true);
    };
    window.addEventListener("beforeinstallprompt", listener as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", listener as EventListener);
  }, []);

  const scoutingReport = useMemo(() => buildOpponentScoutingReport(opponentForm), [opponentForm]);
  const drillRecommendations = useMemo(() => buildDrillRecommendations(gameLogSummary), [gameLogSummary]);
  const nutritionSuggestion = useMemo(() => buildNutritionSuggestions(nutritionForm), [nutritionForm]);
  const recoveryCoaching = useMemo(() => buildSleepRecoveryCoaching({ sleepHours: Number(sleepForm.sleepHours), soreness: Number(sleepForm.soreness) }), [sleepForm]);
  const moderationRisk = useMemo(() => getModerationRiskScore(riskText), [riskText]);
  const scheduleConflicts = useMemo(
    () =>
      detectScheduleConflicts(
        scheduleText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [label, startIso, endIso] = line.split(",").map((value) => value.trim());
            return { label, startIso, endIso };
          })
      ),
    [scheduleText]
  );
  const rosterInsight = useMemo(() => {
    const counts = profiles.reduce<Record<string, number>>((accumulator, profile) => {
      const role = profile.role?.type || "unknown";
      accumulator[role] = (accumulator[role] ?? 0) + 1;
      return accumulator;
    }, {});
    return buildRosterBalanceInsight({ roleCounts: counts });
  }, [profiles]);
  const seasonRecap = useMemo(
    () => buildSeasonRecapStory({ seasonLabel: "2026 Season", wins: season?.wins ?? 0, losses: season?.losses ?? 0, highlight: season?.bestGame?.label ?? "" }),
    [season]
  );

  if (!quietHours) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">AI & Intelligence Hub</h1>
          <p className="text-muted-foreground">Opponent scouting, recovery coaching, moderation signals, wearable syncs, smart scheduling, field metrics, and season recap automation.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>AI Coaching Stack</CardTitle>
              <CardDescription>Opponent reports, drill recommendations, nutrition suggestions, sleep coaching, and roster balance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Input value={opponentForm.opponent} onChange={(event) => setOpponentForm((current) => ({ ...current, opponent: event.target.value }))} placeholder="Opponent name" />
                <Input value={opponentForm.tendencies} onChange={(event) => setOpponentForm((current) => ({ ...current, tendencies: event.target.value }))} placeholder="Opponent tendencies" />
                <Input value={opponentForm.weakSpots} onChange={(event) => setOpponentForm((current) => ({ ...current, weakSpots: event.target.value }))} placeholder="Weak spots to attack" />
              </div>
              <div className="rounded-xl border p-4 text-sm">{scoutingReport}</div>
              <textarea value={gameLogSummary} onChange={(event) => setGameLogSummary(event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Recent game log summary" />
              <div className="rounded-xl border p-4 text-sm space-y-2">
                {drillRecommendations.map((item) => <p key={item}>{item}</p>)}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={nutritionForm.goal} onChange={(event) => setNutritionForm((current) => ({ ...current, goal: event.target.value }))} placeholder="Nutrition goal" />
                <Input value={nutritionForm.load} onChange={(event) => setNutritionForm((current) => ({ ...current, load: event.target.value }))} placeholder="Training load" />
                <Input value={sleepForm.sleepHours} onChange={(event) => setSleepForm((current) => ({ ...current, sleepHours: event.target.value }))} placeholder="Sleep hours" />
                <Input value={sleepForm.soreness} onChange={(event) => setSleepForm((current) => ({ ...current, soreness: event.target.value }))} placeholder="Soreness 1-10" />
              </div>
              <div className="rounded-xl border p-4 text-sm">{nutritionSuggestion}</div>
              <div className="rounded-xl border p-4 text-sm">{recoveryCoaching}</div>
              <div className="rounded-xl border p-4 text-sm">{rosterInsight}</div>
              <div className="rounded-xl border p-4 text-sm">{seasonRecap}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation, Campaigns, and Scheduling</CardTitle>
              <CardDescription>Risk scoring, spam detection, livestream intelligence, campaign prediction, and schedule conflict detection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea value={riskText} onChange={(event) => setRiskText(event.target.value)} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Paste message or content copy to evaluate" />
              <div className="rounded-xl border p-4 text-sm">
                <p>Moderation risk score: <span className="font-semibold">{moderationRisk}/100</span></p>
                <p className="mt-1 text-muted-foreground">{isSpamCandidate(riskText) ? "Spam indicators detected." : "No obvious spam pattern detected."}</p>
              </div>
              <textarea value={scheduleText} onChange={(event) => setScheduleText(event.target.value)} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Label,start,end" />
              <div className="rounded-xl border p-4 text-sm">
                {scheduleConflicts.length === 0 ? "No conflicts detected." : scheduleConflicts.map((conflict) => (
                  <p key={`${conflict.first}-${conflict.second}`}>{conflict.first} overlaps with {conflict.second}</p>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={streamMetrics.viewers} onChange={(event) => setStreamMetrics((current) => ({ ...current, viewers: event.target.value }))} placeholder="Viewers" />
                <Input value={streamMetrics.avgWatchMinutes} onChange={(event) => setStreamMetrics((current) => ({ ...current, avgWatchMinutes: event.target.value }))} placeholder="Avg watch minutes" />
                <Input value={campaignMetrics.impressions} onChange={(event) => setCampaignMetrics((current) => ({ ...current, impressions: event.target.value }))} placeholder="Impressions" />
                <Input value={campaignMetrics.clicks} onChange={(event) => setCampaignMetrics((current) => ({ ...current, clicks: event.target.value }))} placeholder="Clicks" />
              </div>
              <div className="rounded-xl border p-4 text-sm">{buildLivestreamAnalyticsInsight({ viewers: Number(streamMetrics.viewers), avgWatchMinutes: Number(streamMetrics.avgWatchMinutes) })}</div>
              <div className="rounded-xl border p-4 text-sm">{buildCampaignPerformancePrediction({ impressions: Number(campaignMetrics.impressions), clicks: Number(campaignMetrics.clicks) })}</div>
              <div className="rounded-xl border p-4 text-sm">
                <label className="flex items-center justify-between text-sm">
                  <span>Quiet hours enabled</span>
                  <input type="checkbox" checked={quietHours.enabled} onChange={(event) => setQuietHours((current) => current ? { ...current, enabled: event.target.checked } : current)} />
                </label>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input value={String(quietHours.startHour)} onChange={(event) => setQuietHours((current) => current ? { ...current, startHour: Number(event.target.value) } : current)} placeholder="Start hour" />
                  <Input value={String(quietHours.endHour)} onChange={(event) => setQuietHours((current) => current ? { ...current, endHour: Number(event.target.value) } : current)} placeholder="End hour" />
                </div>
                <Button className="mt-3" variant="outline" onClick={() => void saveQuietHoursSettings(quietHours)}>Save Quiet Hours</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Wearables and Field Metrics</CardTitle>
              <CardDescription>Wearable sync, Apple Health / Google Fit style connections, GPS heatmaps, sprint/jump logs, and shooting chart buckets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={wearableForm.provider} onChange={(event) => setWearableForm((current) => ({ ...current, provider: event.target.value as WearableSyncRecord["provider"] }))}>
                  <option value="wearable">Wearable</option>
                  <option value="apple_health">Apple Health</option>
                  <option value="google_fit">Google Fit</option>
                </select>
                <Input value={wearableForm.label} onChange={(event) => setWearableForm((current) => ({ ...current, label: event.target.value }))} placeholder="Device label" />
                <Button onClick={() => void saveWearableSync(wearableForm.provider, wearableForm.label).then(() => { setWearableForm({ provider: "wearable", label: "" }); return refresh(); })}>Connect</Button>
              </div>
              <div className="space-y-2 text-sm">
                {wearables.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3">{item.label} • {item.provider} • {item.status}</div>)}
              </div>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-4">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={metricForm.type} onChange={(event) => setMetricForm((current) => ({ ...current, type: event.target.value as FieldMetricRecord["type"] }))}>
                  <option value="gps">GPS</option>
                  <option value="sprint">Sprint</option>
                  <option value="jump">Jump</option>
                  <option value="shooting">Shooting</option>
                </select>
                <Input value={metricForm.label} onChange={(event) => setMetricForm((current) => ({ ...current, label: event.target.value }))} placeholder="Label" />
                <Input value={metricForm.value} onChange={(event) => setMetricForm((current) => ({ ...current, value: event.target.value }))} placeholder="Value" />
                <Input value={metricForm.notes} onChange={(event) => setMetricForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" />
              </div>
              <Button variant="outline" onClick={() => void addFieldMetric({ type: metricForm.type, label: metricForm.label, value: Number(metricForm.value), notes: metricForm.notes }).then(() => { setMetricForm({ type: "gps", label: "", value: "5", notes: "" }); return refresh(); })}>Add Metric</Button>
              <div className="grid gap-3 md:grid-cols-2">
                {(["gps", "sprint", "jump", "shooting"] as const).map((type) => (
                  <div key={type} className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold capitalize">{type} heatmap</p>
                    <div className="mt-2 space-y-2">
                      {buildHeatmapBuckets(metrics, type).map((bucket) => (
                        <div key={bucket.zone} className="flex items-center gap-2">
                          <span className="w-20 text-xs text-muted-foreground">{bucket.label}</span>
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${bucket.intensity * 10}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Morale, Offline, and Install</CardTitle>
              <CardDescription>Team morale pulse survey, offline draft support, and installable app flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[140px,1fr,auto]">
                <Input value={moraleForm.score} onChange={(event) => setMoraleForm((current) => ({ ...current, score: event.target.value }))} placeholder="Pulse 1-10" />
                <Input value={moraleForm.reflection} onChange={(event) => setMoraleForm((current) => ({ ...current, reflection: event.target.value }))} placeholder="Team morale reflection" />
                <Button onClick={() => void addMoralePulse(Number(moraleForm.score), moraleForm.reflection).then(() => { setMoraleForm({ score: "7", reflection: "" }); return refresh(); })}>Log Pulse</Button>
              </div>
              <div className="space-y-2 text-sm">
                {morale.map((entry) => <div key={entry.id} className="rounded-lg bg-muted p-3">Pulse {entry.score}/10 • {entry.reflection}</div>)}
              </div>

              <div className="rounded-xl border p-4">
                <p className="font-semibold">Offline Draft Support</p>
                <textarea value={offlineDraft} onChange={(event) => setOfflineDraft(event.target.value)} className="mt-3 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Capture notes before you reconnect." />
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={() => saveOfflineDraft("phase10", offlineDraft)}>Save Offline Draft</Button>
                  <Button variant="outline" onClick={() => setOfflineDraft(loadOfflineDraft("phase10"))}>Reload Saved Draft</Button>
                </div>
              </div>

              <div className="rounded-xl border p-4 text-sm">
                <p className="font-semibold">PWA Install Flow</p>
                <p className="mt-1 text-muted-foreground">{installReady ? "App install prompt is available on this device." : "Install prompt will appear when the browser supports it."}</p>
                <Button className="mt-3" disabled={!installReady} onClick={() => {
                  const promptEvent = deferredPrompt as (Event & { prompt?: () => Promise<void> }) | null;
                  if (promptEvent?.prompt) {
                    void promptEvent.prompt();
                  }
                }}>
                  Install HoopLink
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function IntelligencePage() {
  return (
    <AuthProvider>
      <IntelligencePageContent />
    </AuthProvider>
  );
}
