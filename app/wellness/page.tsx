"use client";

import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createAthleteJournalEntry,
  createCoachIntervention,
  createDefensiveAssignment,
  createHeartRateZone,
  createJumpMetric,
  createMealPlan,
  createReturnToPlayApproval,
  createShotAnalytics,
  createSkillChallengeLadder,
  createSpecialistBooking,
  createSprintMetric,
  createWarmupChecklist,
  createWearableAlert,
  getHealthOpsProfile,
  getHealthHubSnapshot,
  saveHealthOpsProfile,
} from "@/lib/phase6-health";

const ADVANCED_HEALTH_FIELDS = [
  { key: "symptomChecker", label: "Symptom checker" },
  { key: "medicalClearanceTracker", label: "Medical clearance tracker" },
  { key: "rehabAppointmentLog", label: "Rehab appointment log" },
  { key: "physioProviderDirectory", label: "Physio provider directory" },
  { key: "medicalDocumentLocker", label: "Medical document locker" },
  { key: "emergencyMedicalProfile", label: "Emergency medical profile" },
  { key: "allergyNotes", label: "Allergy notes" },
  { key: "medicationReminders", label: "Medication reminders" },
  { key: "concussionFollowUpTracker", label: "Concussion follow-up tracker" },
  { key: "painMapJournaling", label: "Pain-map journaling" },
  { key: "jointMobilityTrends", label: "Joint mobility trends" },
  { key: "injuryReturnConfidenceScore", label: "Injury return confidence score" },
  { key: "therapyExerciseReminders", label: "Therapy exercise reminders" },
  { key: "doctorRecommendationUpload", label: "Doctor recommendation upload" },
  { key: "wellnessAlertThresholds", label: "Wellness alert thresholds" },
  { key: "healthProviderChatHandoff", label: "Health-provider chat handoff" },
  { key: "athleticTrainerWorkspace", label: "Athletic trainer workspace" },
  { key: "medicalAppointmentCalendar", label: "Medical appointment calendar" },
  { key: "recoveryComplianceScore", label: "Recovery compliance score" },
  { key: "bodyReadinessCheck", label: "Body readiness check" },
] as const;

function WellnessPageContent() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getHealthHubSnapshot>> | null>(null);

  const [journalForm, setJournalForm] = useState({ date: new Date().toISOString().slice(0, 10), title: "", body: "", tags: "", moodScore: "7" });
  const [mealForm, setMealForm] = useState({ title: "", goal: "", meals: "", groceryItems: "" });
  const [interventionForm, setInterventionForm] = useState({ coachName: "", trigger: "", recommendation: "", status: "watch" });
  const [warmupForm, setWarmupForm] = useState({ title: "", items: "" });
  const [ladderForm, setLadderForm] = useState({ title: "", steps: "", currentStep: "0" });
  const [alertForm, setAlertForm] = useState({ source: "", metric: "", valueLabel: "", severity: "medium" });
  const [zoneForm, setZoneForm] = useState({ workoutName: "", zone1: "10", zone2: "15", zone3: "12", zone4: "8", zone5: "5" });
  const [sprintForm, setSprintForm] = useState({ label: "", split10m: "1.9", split20m: "3.3", topSpeed: "28" });
  const [jumpForm, setJumpForm] = useState({ label: "", leftLoad: "52", rightLoad: "48", maxJump: "31" });
  const [shotForm, setShotForm] = useState({ sessionName: "", paintMakes: "25", midrangeMakes: "18", threePointMakes: "22" });
  const [defenseForm, setDefenseForm] = useState({ matchup: "", stops: "6", blowBys: "2", notes: "" });
  const [approvalForm, setApprovalForm] = useState({ approverName: "", phase: "", status: "pending", notes: "" });
  const [bookingForm, setBookingForm] = useState({ specialistType: "nutritionist", specialistName: "", scheduledFor: "", focus: "" });
  const [advancedHealthMeta, setAdvancedHealthMeta] = useState<Record<string, string[]>>({});

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [nextSnapshot, healthOpsProfile] = await Promise.all([getHealthHubSnapshot(), getHealthOpsProfile()]);
      setSnapshot(nextSnapshot);
      setAdvancedHealthMeta(healthOpsProfile.advancedHealthMeta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load wellness data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const submit = async (action: () => Promise<void>, message: string, reset?: () => void) => {
    await action();
    reset?.();
    setStatus(message);
    await refresh();
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  if (!snapshot) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border p-6 text-center">
            <h2 className="text-xl font-semibold">Wellness could not load</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || "Something blocked the wellness data."}
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Wellness and Performance Lab</h1>
          <p className="text-muted-foreground">Private journaling, readiness, nutrition, wearable insight, performance metrics, and specialist support.</p>
          {status ? <p className="mt-2 text-sm text-primary">{status}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.moodAverage || "-"}</div><div className="text-sm text-muted-foreground">Mood trend</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.readinessScore}</div><div className="text-sm text-muted-foreground">Readiness score</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.trainingLoadScore}</div><div className="text-sm text-muted-foreground">Training load</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.alerts.length}</div><div className="text-sm text-muted-foreground">Wearable alerts</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.recoveryMilestones.length}</div><div className="text-sm text-muted-foreground">Recovery badges</div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Journal, Mood, and Meal Planning</CardTitle><CardDescription>Log private reflections, build meal plans, and generate grocery checklists from them.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={journalForm.date} onChange={(e) => setJournalForm((c) => ({ ...c, date: e.target.value }))} placeholder="Date" />
                <Input value={journalForm.title} onChange={(e) => setJournalForm((c) => ({ ...c, title: e.target.value }))} placeholder="Journal title" />
                <Input value={journalForm.tags} onChange={(e) => setJournalForm((c) => ({ ...c, tags: e.target.value }))} placeholder="Private tags, comma separated" />
                <Input value={journalForm.moodScore} onChange={(e) => setJournalForm((c) => ({ ...c, moodScore: e.target.value }))} placeholder="Mood 1-10" />
              </div>
              <textarea value={journalForm.body} onChange={(e) => setJournalForm((c) => ({ ...c, body: e.target.value }))} placeholder="How training, school, sleep, and stress felt today" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Button onClick={() => void submit(() => createAthleteJournalEntry({ date: journalForm.date, title: journalForm.title, body: journalForm.body, tags: journalForm.tags.split(",").map((item) => item.trim()).filter(Boolean), moodScore: Number(journalForm.moodScore) }), "Journal entry saved.", () => setJournalForm({ date: new Date().toISOString().slice(0, 10), title: "", body: "", tags: "", moodScore: "7" }))} disabled={!journalForm.title.trim()}>Save Journal Entry</Button>

              <div className="border-t pt-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={mealForm.title} onChange={(e) => setMealForm((c) => ({ ...c, title: e.target.value }))} placeholder="Meal plan title" />
                  <Input value={mealForm.goal} onChange={(e) => setMealForm((c) => ({ ...c, goal: e.target.value }))} placeholder="Goal" />
                  <Input value={mealForm.meals} onChange={(e) => setMealForm((c) => ({ ...c, meals: e.target.value }))} placeholder="Meals, comma separated" />
                  <Input value={mealForm.groceryItems} onChange={(e) => setMealForm((c) => ({ ...c, groceryItems: e.target.value }))} placeholder="Groceries, comma separated" />
                </div>
                <Button className="mt-3" variant="outline" onClick={() => void submit(() => createMealPlan({ title: mealForm.title, goal: mealForm.goal, meals: mealForm.meals.split(",").map((item) => item.trim()).filter(Boolean), groceryItems: mealForm.groceryItems.split(",").map((item) => item.trim()).filter(Boolean) }), "Meal plan saved.", () => setMealForm({ title: "", goal: "", meals: "", groceryItems: "" }))} disabled={!mealForm.title.trim()}>Save Meal Plan</Button>
                <p className="mt-3 text-sm text-muted-foreground">{snapshot.sleepDebtAlert}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Readiness, Warmups, and Coach Intervention</CardTitle><CardDescription>Turn recovery trends into action plans before performance drops.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={warmupForm.title} onChange={(e) => setWarmupForm((c) => ({ ...c, title: e.target.value }))} placeholder="Warmup title" />
                <Input value={warmupForm.items} onChange={(e) => setWarmupForm((c) => ({ ...c, items: e.target.value }))} placeholder="Warmup items, comma separated" />
                <Input value={ladderForm.title} onChange={(e) => setLadderForm((c) => ({ ...c, title: e.target.value }))} placeholder="Challenge ladder" />
                <Input value={ladderForm.steps} onChange={(e) => setLadderForm((c) => ({ ...c, steps: e.target.value }))} placeholder="Steps, comma separated" />
                <Input value={interventionForm.coachName} onChange={(e) => setInterventionForm((c) => ({ ...c, coachName: e.target.value }))} placeholder="Coach name" />
                <Input value={interventionForm.trigger} onChange={(e) => setInterventionForm((c) => ({ ...c, trigger: e.target.value }))} placeholder="Trigger" />
              </div>
              <textarea value={interventionForm.recommendation} onChange={(e) => setInterventionForm((c) => ({ ...c, recommendation: e.target.value }))} placeholder="Intervention recommendation" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createWarmupChecklist({ title: warmupForm.title, items: warmupForm.items.split(",").map((item) => item.trim()).filter(Boolean) }), "Warmup checklist saved.", () => setWarmupForm({ title: "", items: "" }))} disabled={!warmupForm.title.trim()}>Save Warmup</Button>
                <Button variant="outline" onClick={() => void submit(() => createSkillChallengeLadder({ title: ladderForm.title, steps: ladderForm.steps.split(",").map((item) => item.trim()).filter(Boolean), currentStep: Number(ladderForm.currentStep) }), "Skill challenge ladder saved.", () => setLadderForm({ title: "", steps: "", currentStep: "0" }))} disabled={!ladderForm.title.trim()}>Save Ladder</Button>
                <Button variant="outline" onClick={() => void submit(() => createCoachIntervention({ coachName: interventionForm.coachName, trigger: interventionForm.trigger, recommendation: interventionForm.recommendation, status: interventionForm.status as "watch" | "action" | "resolved" }), "Coach intervention logged.", () => setInterventionForm({ coachName: "", trigger: "", recommendation: "", status: "watch" }))} disabled={!interventionForm.coachName.trim()}>Log Intervention</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{snapshot.warmups.length}</p><p className="text-muted-foreground">Warmups</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{snapshot.ladders.length}</p><p className="text-muted-foreground">Skill ladders</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{snapshot.interventions.length}</p><p className="text-muted-foreground">Interventions</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Wearables and Movement Analytics</CardTitle><CardDescription>Track recovery alerts, heart-rate zones, sprint splits, jump balance, and shot performance.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={alertForm.source} onChange={(e) => setAlertForm((c) => ({ ...c, source: e.target.value }))} placeholder="Device source" />
                <Input value={alertForm.metric} onChange={(e) => setAlertForm((c) => ({ ...c, metric: e.target.value }))} placeholder="Metric" />
                <Input value={alertForm.valueLabel} onChange={(e) => setAlertForm((c) => ({ ...c, valueLabel: e.target.value }))} placeholder="Value" />
                <Input value={zoneForm.workoutName} onChange={(e) => setZoneForm((c) => ({ ...c, workoutName: e.target.value }))} placeholder="Workout name" />
                <Input value={sprintForm.label} onChange={(e) => setSprintForm((c) => ({ ...c, label: e.target.value }))} placeholder="Sprint test label" />
                <Input value={jumpForm.label} onChange={(e) => setJumpForm((c) => ({ ...c, label: e.target.value }))} placeholder="Jump test label" />
                <Input value={shotForm.sessionName} onChange={(e) => setShotForm((c) => ({ ...c, sessionName: e.target.value }))} placeholder="Shot session" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createWearableAlert({ ...alertForm, severity: alertForm.severity as "low" | "medium" | "high" }), "Wearable alert saved.", () => setAlertForm({ source: "", metric: "", valueLabel: "", severity: "medium" }))} disabled={!alertForm.metric.trim()}>Save Alert</Button>
                <Button variant="outline" onClick={() => void submit(() => createHeartRateZone({ workoutName: zoneForm.workoutName, zone1: Number(zoneForm.zone1), zone2: Number(zoneForm.zone2), zone3: Number(zoneForm.zone3), zone4: Number(zoneForm.zone4), zone5: Number(zoneForm.zone5) }), "Heart-rate zones saved.", () => setZoneForm({ workoutName: "", zone1: "10", zone2: "15", zone3: "12", zone4: "8", zone5: "5" }))} disabled={!zoneForm.workoutName.trim()}>Save Zones</Button>
                <Button variant="outline" onClick={() => void submit(() => createSprintMetric({ label: sprintForm.label, split10m: Number(sprintForm.split10m), split20m: Number(sprintForm.split20m), topSpeed: Number(sprintForm.topSpeed) }), "Sprint metrics saved.", () => setSprintForm({ label: "", split10m: "1.9", split20m: "3.3", topSpeed: "28" }))} disabled={!sprintForm.label.trim()}>Save Sprint</Button>
                <Button variant="outline" onClick={() => void submit(() => createJumpMetric({ label: jumpForm.label, leftLoad: Number(jumpForm.leftLoad), rightLoad: Number(jumpForm.rightLoad), maxJump: Number(jumpForm.maxJump) }), "Jump metrics saved.", () => setJumpForm({ label: "", leftLoad: "52", rightLoad: "48", maxJump: "31" }))} disabled={!jumpForm.label.trim()}>Save Jump</Button>
                <Button variant="outline" onClick={() => void submit(() => createShotAnalytics({ sessionName: shotForm.sessionName, paintMakes: Number(shotForm.paintMakes), midrangeMakes: Number(shotForm.midrangeMakes), threePointMakes: Number(shotForm.threePointMakes) }), "Shot analytics saved.", () => setShotForm({ sessionName: "", paintMakes: "25", midrangeMakes: "18", threePointMakes: "22" }))} disabled={!shotForm.sessionName.trim()}>Save Shots</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Input value={zoneForm.zone1} onChange={(e) => setZoneForm((c) => ({ ...c, zone1: e.target.value }))} placeholder="Z1" />
                <Input value={zoneForm.zone2} onChange={(e) => setZoneForm((c) => ({ ...c, zone2: e.target.value }))} placeholder="Z2" />
                <Input value={zoneForm.zone3} onChange={(e) => setZoneForm((c) => ({ ...c, zone3: e.target.value }))} placeholder="Z3" />
                <Input value={zoneForm.zone4} onChange={(e) => setZoneForm((c) => ({ ...c, zone4: e.target.value }))} placeholder="Z4" />
                <Input value={zoneForm.zone5} onChange={(e) => setZoneForm((c) => ({ ...c, zone5: e.target.value }))} placeholder="Z5" />
                <Input value={sprintForm.split10m} onChange={(e) => setSprintForm((c) => ({ ...c, split10m: e.target.value }))} placeholder="10m split" />
                <Input value={sprintForm.split20m} onChange={(e) => setSprintForm((c) => ({ ...c, split20m: e.target.value }))} placeholder="20m split" />
                <Input value={sprintForm.topSpeed} onChange={(e) => setSprintForm((c) => ({ ...c, topSpeed: e.target.value }))} placeholder="Top speed" />
                <Input value={jumpForm.leftLoad} onChange={(e) => setJumpForm((c) => ({ ...c, leftLoad: e.target.value }))} placeholder="Left load" />
                <Input value={jumpForm.rightLoad} onChange={(e) => setJumpForm((c) => ({ ...c, rightLoad: e.target.value }))} placeholder="Right load" />
                <Input value={jumpForm.maxJump} onChange={(e) => setJumpForm((c) => ({ ...c, maxJump: e.target.value }))} placeholder="Max jump" />
                <Input value={shotForm.paintMakes} onChange={(e) => setShotForm((c) => ({ ...c, paintMakes: e.target.value }))} placeholder="Paint makes" />
                <Input value={shotForm.midrangeMakes} onChange={(e) => setShotForm((c) => ({ ...c, midrangeMakes: e.target.value }))} placeholder="Midrange makes" />
                <Input value={shotForm.threePointMakes} onChange={(e) => setShotForm((c) => ({ ...c, threePointMakes: e.target.value }))} placeholder="3PT makes" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Defense, Return-to-Play, and Specialists</CardTitle><CardDescription>Track defensive assignments, recovery approval routing, nutritionist directory, and sports psych booking.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={defenseForm.matchup} onChange={(e) => setDefenseForm((c) => ({ ...c, matchup: e.target.value }))} placeholder="Matchup assignment" />
                <Input value={defenseForm.stops} onChange={(e) => setDefenseForm((c) => ({ ...c, stops: e.target.value }))} placeholder="Stops" />
                <Input value={defenseForm.blowBys} onChange={(e) => setDefenseForm((c) => ({ ...c, blowBys: e.target.value }))} placeholder="Blow-bys" />
                <Input value={approvalForm.approverName} onChange={(e) => setApprovalForm((c) => ({ ...c, approverName: e.target.value }))} placeholder="Approver name" />
                <Input value={approvalForm.phase} onChange={(e) => setApprovalForm((c) => ({ ...c, phase: e.target.value }))} placeholder="Return-to-play phase" />
                <Input value={bookingForm.specialistName} onChange={(e) => setBookingForm((c) => ({ ...c, specialistName: e.target.value }))} placeholder="Specialist name" />
                <Input value={bookingForm.scheduledFor} onChange={(e) => setBookingForm((c) => ({ ...c, scheduledFor: e.target.value }))} placeholder="Scheduled for" />
              </div>
              <textarea value={defenseForm.notes} onChange={(e) => setDefenseForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Defensive notes" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={approvalForm.notes} onChange={(e) => setApprovalForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Approval notes" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Input value={bookingForm.focus} onChange={(e) => setBookingForm((c) => ({ ...c, focus: e.target.value }))} placeholder="Booking focus" />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createDefensiveAssignment({ matchup: defenseForm.matchup, stops: Number(defenseForm.stops), blowBys: Number(defenseForm.blowBys), notes: defenseForm.notes }), "Defensive assignment logged.", () => setDefenseForm({ matchup: "", stops: "6", blowBys: "2", notes: "" }))} disabled={!defenseForm.matchup.trim()}>Save Defense</Button>
                <Button variant="outline" onClick={() => void submit(() => createReturnToPlayApproval({ approverName: approvalForm.approverName, phase: approvalForm.phase, status: approvalForm.status as "pending" | "approved", notes: approvalForm.notes }), "Return-to-play approval saved.", () => setApprovalForm({ approverName: "", phase: "", status: "pending", notes: "" }))} disabled={!approvalForm.approverName.trim()}>Save Approval</Button>
                <Button variant="outline" onClick={() => void submit(() => createSpecialistBooking({ specialistType: bookingForm.specialistType as "nutritionist" | "sports_psych", specialistName: bookingForm.specialistName, scheduledFor: bookingForm.scheduledFor, focus: bookingForm.focus }), "Specialist booking created.", () => setBookingForm({ specialistType: "nutritionist", specialistName: "", scheduledFor: "", focus: "" }))} disabled={!bookingForm.specialistName.trim()}>Book Specialist</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">Nutritionists</p>
                  <p className="text-muted-foreground">{snapshot.nutritionists.slice(0, 3).map((item) => item.displayName).join(", ") || "None yet"}</p>
                </div>
                <div className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">Sports psych</p>
                  <p className="text-muted-foreground">{snapshot.sportsPsychs.slice(0, 3).map((item) => item.displayName).join(", ") || "None yet"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Health and Medical Workspace</CardTitle><CardDescription>Track symptoms, rehab, medical documents, clearances, provider handoffs, readiness, and the broader athlete medical workflow.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{snapshot.approvals.length}</div><div className="text-sm text-muted-foreground">Medical approvals</div></div>
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{snapshot.bookings.length}</div><div className="text-sm text-muted-foreground">Specialist bookings</div></div>
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{snapshot.alerts.length}</div><div className="text-sm text-muted-foreground">Wellness alerts</div></div>
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{Object.values(advancedHealthMeta).reduce((sum, items) => sum + items.length, 0)}</div><div className="text-sm text-muted-foreground">Medical notes</div></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {ADVANCED_HEALTH_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2 rounded-xl border p-4">
                  <p className="font-medium">{field.label}</p>
                  <textarea
                    value={(advancedHealthMeta[field.key] ?? []).join("\n")}
                    onChange={(event) => setAdvancedHealthMeta((current) => ({
                      ...current,
                      [field.key]: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                    }))}
                    placeholder={`${field.label} notes, one item per line`}
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={() => void saveHealthOpsProfile({ advancedHealthMeta }).then(() => setStatus("Advanced health and medical tools saved."))}>
              Save Health Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function WellnessPage() {
  return (
    <AuthProvider>
      <WellnessPageContent />
    </AuthProvider>
  );
}
