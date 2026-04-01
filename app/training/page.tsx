"use client";

import { FormEvent, useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addCoachCheckIn,
  addConditioningLog,
  addMedicalClearance,
  addNutritionJournalEntry,
  addRehabAssignment,
  createDrill,
  createGoal,
  createRecoveryAppointment,
  getCurrentUserCoachCheckIns,
  getCurrentUserConditioningLogs,
  getCurrentUserGoals,
  getCurrentUserMedicalClearances,
  getCurrentUserNutritionJournal,
  getCurrentUserRehabAssignments,
  getCurrentUserRecoveryAppointments,
  getCurrentUserReturnToPlayChecklist,
  getCurrentUserSkillProgress,
  getDrills,
  getPracticeAttendanceStreak,
  saveDrill,
  saveReturnToPlayChecklist,
  toggleReturnToPlayItem,
  updateGoalProgress,
  upsertSkillProgress,
  type CoachCheckInRecord,
  type ConditioningLogRecord,
  type DrillRecord,
  type GoalRecord,
  type MedicalClearanceRecord,
  type NutritionJournalRecord,
  type RehabAssignmentRecord,
  type RecoveryAppointmentRecord,
  type ReturnToPlayChecklistRecord,
  type SkillProgressRecord,
} from "@/lib/training";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";

function TrainingPageContent() {
  const [drills, setDrills] = useState<DrillRecord[]>([]);
  const [skills, setSkills] = useState<SkillProgressRecord[]>([]);
  const [conditioning, setConditioning] = useState<ConditioningLogRecord[]>([]);
  const [nutrition, setNutrition] = useState<NutritionJournalRecord[]>([]);
  const [appointments, setAppointments] = useState<{ incoming: RecoveryAppointmentRecord[]; outgoing: RecoveryAppointmentRecord[] }>({ incoming: [], outgoing: [] });
  const [clearances, setClearances] = useState<MedicalClearanceRecord[]>([]);
  const [returnToPlay, setReturnToPlay] = useState<ReturnToPlayChecklistRecord | null>(null);
  const [rehab, setRehab] = useState<RehabAssignmentRecord[]>([]);
  const [checkIns, setCheckIns] = useState<CoachCheckInRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [attendanceStreak, setAttendanceStreak] = useState(0);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [medicalTitle, setMedicalTitle] = useState("");
  const [drillForm, setDrillForm] = useState({ title: "", category: "", description: "" });
  const [skillForm, setSkillForm] = useState({ skillName: "", currentLevel: "4", targetLevel: "8" });
  const [conditioningForm, setConditioningForm] = useState({ date: new Date().toISOString().slice(0, 10), workoutType: "", durationMinutes: "60", intensity: "7" });
  const [nutritionForm, setNutritionForm] = useState({ date: new Date().toISOString().slice(0, 10), meals: "", hydrationOz: "80" });
  const [appointmentForm, setAppointmentForm] = useState({ hostId: "", hostName: "", type: "recovery" as "recovery" | "physio", scheduledFor: "", note: "" });
  const [checklistForm, setChecklistForm] = useState("Pain free jogging, cleared by physio, completed mobility block");
  const [rehabForm, setRehabForm] = useState({ title: "", notes: "" });
  const [checkInForm, setCheckInForm] = useState({ reflection: "", burnoutScore: "4" });
  const [goalForm, setGoalForm] = useState({ title: "", category: "", target: "10" });

  const refresh = async () => {
    const [
      nextDrills,
      nextSkills,
      nextConditioning,
      nextNutrition,
      nextAppointments,
      nextClearances,
      nextReturnToPlay,
      nextRehab,
      nextCheckIns,
      nextGoals,
      nextAttendanceStreak,
      nextProfiles,
    ] = await Promise.all([
      getDrills(),
      getCurrentUserSkillProgress(),
      getCurrentUserConditioningLogs(),
      getCurrentUserNutritionJournal(),
      getCurrentUserRecoveryAppointments(),
      getCurrentUserMedicalClearances(),
      getCurrentUserReturnToPlayChecklist(),
      getCurrentUserRehabAssignments(),
      getCurrentUserCoachCheckIns(),
      getCurrentUserGoals(),
      getPracticeAttendanceStreak(),
      searchProfiles(""),
    ]);
    setDrills(nextDrills);
    setSkills(nextSkills);
    setConditioning(nextConditioning);
    setNutrition(nextNutrition);
    setAppointments(nextAppointments);
    setClearances(nextClearances);
    setReturnToPlay(nextReturnToPlay);
    setRehab(nextRehab);
    setCheckIns(nextCheckIns);
    setGoals(nextGoals);
    setAttendanceStreak(nextAttendanceStreak);
    setProfiles(nextProfiles);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const averageBurnout = checkIns.length
    ? Math.round(checkIns.reduce((sum, entry) => sum + entry.burnoutScore, 0) / checkIns.length)
    : 0;
  const hydrationAverage = nutrition.length
    ? Math.round(nutrition.reduce((sum, entry) => sum + entry.hydrationOz, 0) / nutrition.length)
    : 0;

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Training Hub</h1>
          <p className="text-muted-foreground">
            Build practice plans, track skills and conditioning, manage rehab, and keep weekly coach accountability in one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{attendanceStreak}</div><div className="text-sm text-muted-foreground">Practice streak</div></div>
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{goals.filter((goal) => goal.progress >= goal.target).length}</div><div className="text-sm text-muted-foreground">Milestones hit</div></div>
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{hydrationAverage}oz</div><div className="text-sm text-muted-foreground">Avg hydration</div></div>
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{averageBurnout}/10</div><div className="text-sm text-muted-foreground">Burnout risk</div></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Drill Library</CardTitle>
              <CardDescription>Create drills, save favorites, and build your private training stack.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  await createDrill(drillForm);
                  setDrillForm({ title: "", category: "", description: "" });
                  await refresh();
                }}
              >
                <input value={drillForm.title} onChange={(event) => setDrillForm((current) => ({ ...current, title: event.target.value }))} placeholder="Drill title" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={drillForm.category} onChange={(event) => setDrillForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" className="h-10 rounded-md border border-input px-3 text-sm" />
                <textarea value={drillForm.description} onChange={(event) => setDrillForm((current) => ({ ...current, description: event.target.value }))} placeholder="Cues, setup, reps, and coaching points" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm" />
                <Button type="submit">Add Drill</Button>
              </form>
              <div className="space-y-3 border-t pt-4">
                {drills.map((drill) => (
                  <div key={drill.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{drill.title}</p>
                        <p className="text-sm text-muted-foreground">{drill.category}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => void saveDrill(drill.id).then(refresh)}>Save</Button>
                    </div>
                    <p className="mt-2 text-sm">{drill.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skill Progress and Goals</CardTitle>
              <CardDescription>Track improvement arcs and celebrate milestones as you close the gap.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
                event.preventDefault();
                await upsertSkillProgress({ skillName: skillForm.skillName, currentLevel: Number(skillForm.currentLevel), targetLevel: Number(skillForm.targetLevel) });
                setSkillForm({ skillName: "", currentLevel: "4", targetLevel: "8" });
                await refresh();
              }}>
                <input value={skillForm.skillName} onChange={(event) => setSkillForm((current) => ({ ...current, skillName: event.target.value }))} placeholder="Skill" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={skillForm.currentLevel} onChange={(event) => setSkillForm((current) => ({ ...current, currentLevel: event.target.value }))} type="number" min={1} max={10} className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={skillForm.targetLevel} onChange={(event) => setSkillForm((current) => ({ ...current, targetLevel: event.target.value }))} type="number" min={1} max={10} className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-3">Save Skill Progress</Button>
              </form>

              <form className="grid gap-3 border-t pt-4 md:grid-cols-3" onSubmit={async (event) => {
                event.preventDefault();
                await createGoal({ title: goalForm.title, category: goalForm.category, target: Number(goalForm.target) });
                setGoalForm({ title: "", category: "", target: "10" });
                await refresh();
              }}>
                <input value={goalForm.title} onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))} placeholder="Goal" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={goalForm.category} onChange={(event) => setGoalForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={goalForm.target} onChange={(event) => setGoalForm((current) => ({ ...current, target: event.target.value }))} type="number" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-3">Create Goal</Button>
              </form>

              <div className="space-y-3 border-t pt-4">
                {skills.map((skill) => (
                  <div key={skill.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{skill.skillName}</p>
                      <span className="text-sm text-muted-foreground">{skill.currentLevel}/{skill.targetLevel}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((skill.currentLevel / Math.max(skill.targetLevel, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
                {goals.map((goal) => (
                  <div key={goal.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{goal.title}</p>
                        <p className="text-sm text-muted-foreground">{goal.category}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{goal.progress}/{goal.target}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min((goal.progress / Math.max(goal.target, 1)) * 100, 100)}%` }} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => void updateGoalProgress(goal.id, Math.min(goal.progress + 1, goal.target)).then(refresh)}>+1</Button>
                      {goal.progress >= goal.target ? <span className="rounded-full bg-primary/10 px-3 py-2 text-xs text-primary">Milestone unlocked</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Conditioning, Nutrition, and Hydration</CardTitle>
              <CardDescription>Log your workload and fueling habits to spot consistency patterns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3 md:grid-cols-4" onSubmit={async (event) => {
                event.preventDefault();
                await addConditioningLog({
                  date: conditioningForm.date,
                  workoutType: conditioningForm.workoutType,
                  durationMinutes: Number(conditioningForm.durationMinutes),
                  intensity: Number(conditioningForm.intensity),
                });
                setConditioningForm((current) => ({ ...current, workoutType: "" }));
                await refresh();
              }}>
                <input value={conditioningForm.date} onChange={(event) => setConditioningForm((current) => ({ ...current, date: event.target.value }))} type="date" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={conditioningForm.workoutType} onChange={(event) => setConditioningForm((current) => ({ ...current, workoutType: event.target.value }))} placeholder="Lift / sprint / mobility" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={conditioningForm.durationMinutes} onChange={(event) => setConditioningForm((current) => ({ ...current, durationMinutes: event.target.value }))} type="number" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={conditioningForm.intensity} onChange={(event) => setConditioningForm((current) => ({ ...current, intensity: event.target.value }))} type="number" min={1} max={10} className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-4">Log Workout</Button>
              </form>

              <form className="grid gap-3 border-t pt-4 md:grid-cols-3" onSubmit={async (event) => {
                event.preventDefault();
                await addNutritionJournalEntry({
                  date: nutritionForm.date,
                  meals: nutritionForm.meals,
                  hydrationOz: Number(nutritionForm.hydrationOz),
                });
                setNutritionForm((current) => ({ ...current, meals: "" }));
                await refresh();
              }}>
                <input value={nutritionForm.date} onChange={(event) => setNutritionForm((current) => ({ ...current, date: event.target.value }))} type="date" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={nutritionForm.hydrationOz} onChange={(event) => setNutritionForm((current) => ({ ...current, hydrationOz: event.target.value }))} type="number" placeholder="Hydration oz" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={nutritionForm.meals} onChange={(event) => setNutritionForm((current) => ({ ...current, meals: event.target.value }))} placeholder="Meals, snacks, recovery shake..." className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-3">Save Nutrition Entry</Button>
              </form>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                {conditioning.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-semibold">{entry.workoutType}</p>
                    <p className="text-muted-foreground">{entry.date} · {entry.durationMinutes} min · intensity {entry.intensity}/10</p>
                  </div>
                ))}
                {nutrition.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-semibold">{entry.date}</p>
                    <p className="text-muted-foreground">{entry.hydrationOz}oz hydration</p>
                    <p className="mt-1">{entry.meals}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recovery Sessions and Physio</CardTitle>
              <CardDescription>Request recovery or physio appointments directly from HoopLink.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
                event.preventDefault();
                await createRecoveryAppointment(appointmentForm);
                setAppointmentForm((current) => ({ ...current, note: "", scheduledFor: "" }));
                await refresh();
              }}>
                <select value={appointmentForm.hostId} onChange={(event) => {
                  const match = profiles.find((profile) => profile.uid === event.target.value);
                  setAppointmentForm((current) => ({ ...current, hostId: event.target.value, hostName: match?.displayName || "" }));
                }} className="h-10 rounded-md border border-input px-3 text-sm">
                  <option value="">Choose host</option>
                  {profiles.map((profile) => (
                    <option key={profile.uid} value={profile.uid}>{profile.displayName}</option>
                  ))}
                </select>
                <select value={appointmentForm.type} onChange={(event) => setAppointmentForm((current) => ({ ...current, type: event.target.value as "recovery" | "physio" }))} className="h-10 rounded-md border border-input px-3 text-sm">
                  <option value="recovery">Recovery session</option>
                  <option value="physio">Physio request</option>
                </select>
                <input value={appointmentForm.scheduledFor} onChange={(event) => setAppointmentForm((current) => ({ ...current, scheduledFor: event.target.value }))} type="datetime-local" className="h-10 rounded-md border border-input px-3 text-sm md:col-span-2" />
                <textarea value={appointmentForm.note} onChange={(event) => setAppointmentForm((current) => ({ ...current, note: event.target.value }))} placeholder="Describe the issue, tight area, workload, or treatment goal" className="min-h-24 rounded-md border border-input px-3 py-2 text-sm md:col-span-2" />
                <Button type="submit" className="md:col-span-2">Request Appointment</Button>
              </form>
              <div className="space-y-2 border-t pt-4">
                {[...appointments.outgoing, ...appointments.incoming].map((entry) => (
                  <div key={entry.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-semibold">{entry.type === "physio" ? "Physio" : "Recovery"} · {entry.hostName}</p>
                    <p className="text-muted-foreground">{entry.scheduledFor} · {entry.status}</p>
                    <p className="mt-1">{entry.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Medical, Rehab, and Return to Play</CardTitle>
              <CardDescription>Track your injury timeline, clearances, and rehab assignments in one recovery lane.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
                <input value={medicalTitle} onChange={(event) => setMedicalTitle(event.target.value)} placeholder="Clearance title" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input type="file" accept="image/*" onChange={(event) => setMedicalFile(event.target.files?.[0] ?? null)} className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="button" onClick={() => medicalFile ? void addMedicalClearance({ title: medicalTitle, imageFile: medicalFile }).then(async () => { setMedicalTitle(""); setMedicalFile(null); await refresh(); }) : undefined}>Upload</Button>
              </div>

              <form className="space-y-3 border-t pt-4" onSubmit={async (event) => {
                event.preventDefault();
                await saveReturnToPlayChecklist({
                  title: "Return to Play",
                  items: checklistForm.split(",").map((value) => value.trim()).filter(Boolean),
                });
                await refresh();
              }}>
                <textarea value={checklistForm} onChange={(event) => setChecklistForm(event.target.value)} placeholder="Comma separated checklist items" className="min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm" />
                <Button type="submit">Save Return-to-Play Checklist</Button>
              </form>

              <form className="grid gap-3 border-t pt-4" onSubmit={async (event) => {
                event.preventDefault();
                await addRehabAssignment(rehabForm);
                setRehabForm({ title: "", notes: "" });
                await refresh();
              }}>
                <input value={rehabForm.title} onChange={(event) => setRehabForm((current) => ({ ...current, title: event.target.value }))} placeholder="Rehab drill assignment" className="h-10 rounded-md border border-input px-3 text-sm" />
                <textarea value={rehabForm.notes} onChange={(event) => setRehabForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Volume, cues, or pain threshold notes" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm" />
                <Button type="submit">Assign Rehab Drill</Button>
              </form>

              <div className="space-y-3 border-t pt-4">
                {clearances.map((entry) => (
                  <div key={entry.id} className="rounded-xl border p-3 text-sm">{entry.title} · {entry.status}</div>
                ))}
                {returnToPlay ? (
                  <div className="rounded-xl border p-3">
                    <p className="font-semibold">{returnToPlay.title}</p>
                    <div className="mt-2 space-y-2">
                      {returnToPlay.items.map((item, index) => (
                        <label key={`${item.label}-${index}`} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={item.done} onChange={(event) => void toggleReturnToPlayItem(index, event.target.checked).then(refresh)} />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                {rehab.map((entry) => (
                  <div key={entry.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-semibold">{entry.title}</p>
                    <p className="text-muted-foreground">{entry.coachName}</p>
                    <p className="mt-1">{entry.notes}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coach Check-ins and Burnout Watch</CardTitle>
              <CardDescription>Use weekly reflections to track workload, mindset, and burnout risk before it spikes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3" onSubmit={async (event) => {
                event.preventDefault();
                await addCoachCheckIn({ reflection: checkInForm.reflection, burnoutScore: Number(checkInForm.burnoutScore) });
                setCheckInForm({ reflection: "", burnoutScore: "4" });
                await refresh();
              }}>
                <input value={checkInForm.burnoutScore} onChange={(event) => setCheckInForm((current) => ({ ...current, burnoutScore: event.target.value }))} type="number" min={1} max={10} placeholder="Burnout score" className="h-10 rounded-md border border-input px-3 text-sm" />
                <textarea value={checkInForm.reflection} onChange={(event) => setCheckInForm((current) => ({ ...current, reflection: event.target.value }))} placeholder="What felt heavy this week, what moved well, what needs coach attention?" className="min-h-24 rounded-md border border-input px-3 py-2 text-sm" />
                <Button type="submit">Save Weekly Check-in</Button>
              </form>
              <div className="space-y-3 border-t pt-4">
                {checkIns.map((entry) => (
                  <div key={entry.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{entry.coachName}</p>
                      <span className={`rounded-full px-3 py-1 text-xs ${entry.burnoutScore >= 7 ? "bg-red-100 text-red-700" : entry.burnoutScore >= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        Burnout {entry.burnoutScore}/10
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{entry.reflection}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function TrainingPage() {
  return (
    <AuthProvider>
      <TrainingPageContent />
    </AuthProvider>
  );
}
