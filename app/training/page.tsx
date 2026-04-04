"use client";

import { FormEvent, useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addCoachCheckIn,
  addConditioningLog,
  addFormAnalysisUpload,
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
  getAthleteDevelopmentProfile,
  getPracticeAttendanceStreak,
  saveDrill,
  saveAthleteDevelopmentProfile,
  saveReturnToPlayChecklist,
  toggleReturnToPlayItem,
  updateGoalProgress,
  upsertSkillProgress,
  type AthleteDevelopmentProfile,
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

const ADVANCED_TRAINING_LIST_FIELDS = [
  { key: "drillVideoDemos", label: "Drill video demos" },
  { key: "shotChartTracker", label: "Shot chart tracker" },
  { key: "finishingDrillTracker", label: "Finishing drill tracker" },
  { key: "ballHandlingScores", label: "Ball-handling scores" },
  { key: "passingDrillScores", label: "Passing drill scores" },
  { key: "footworkProgression", label: "Footwork progression" },
  { key: "mobilityTesting", label: "Mobility testing" },
  { key: "agilityLadderTracking", label: "Agility ladder tracking" },
  { key: "conditioningIntervals", label: "Conditioning intervals" },
  { key: "heartRateLogs", label: "Heart-rate logs" },
  { key: "sprintSplitHistory", label: "Sprint split history" },
  { key: "verticalComparisonCharts", label: "Vertical comparison charts" },
  { key: "skillHeatmaps", label: "Skill heatmaps" },
  { key: "weaknessFinder", label: "Weakness finder" },
  { key: "strengthFinder", label: "Strength finder" },
  { key: "aiWeeklyRecap", label: "AI weekly recap" },
  { key: "sideBySideAnalysis", label: "Side-by-side analysis" },
  { key: "beforeAfterClips", label: "Before/after clips" },
  { key: "coachRubricGrading", label: "Coach rubric grading" },
  { key: "selfEvaluationJournal", label: "Self-evaluation journal" },
  { key: "mentalPerformanceJournal", label: "Mental performance journal" },
  { key: "confidenceTracker", label: "Confidence tracker" },
  { key: "focusRoutineBuilder", label: "Focus routine builder" },
  { key: "breathingExercises", label: "Breathing exercises" },
  { key: "visualizationPlans", label: "Visualization plans" },
  { key: "gameRoutinePlanner", label: "Game routine planner" },
  { key: "preGameChecklist", label: "Pre-game checklist" },
  { key: "postGameRecoveryChecklist", label: "Post-game recovery checklist" },
  { key: "stretchLibrary", label: "Stretch library" },
  { key: "nutritionSnapshots", label: "Nutrition snapshots" },
  { key: "macroTargets", label: "Macro targets" },
  { key: "groceryPlanner", label: "Grocery planner" },
  { key: "supplementNotes", label: "Supplement notes" },
  { key: "waterStreaks", label: "Water streaks" },
  { key: "mealPhotoLogs", label: "Meal photo logs" },
  { key: "wellnessScore", label: "Wellness score" },
  { key: "dailyCheckInBot", label: "Daily check-in bot" },
  { key: "sorenessTracker", label: "Soreness tracker" },
  { key: "loadManagementAlerts", label: "Load management alerts" },
  { key: "practiceEffortRating", label: "Practice effort rating" },
  { key: "coachAttendanceOnDrills", label: "Coach attendance on drills" },
  { key: "progressBadges", label: "Progress badges" },
  { key: "athleteXp", label: "Athlete XP" },
  { key: "seasonalLevelUps", label: "Seasonal level-ups" },
  { key: "benchmarkLeaderboards", label: "Benchmark leaderboards" },
  { key: "positionLeaderboards", label: "Position leaderboards" },
  { key: "ageGroupLeaderboards", label: "Age-group leaderboards" },
  { key: "smartDrillRecommendations", label: "Smart drill recommendations" },
  { key: "aiPersonalizedProgression", label: "AI personalized progression" },
  { key: "customDrillBuilder", label: "Custom drill builder" },
  { key: "privateTrainingGroups", label: "Private training groups" },
  { key: "trainerAssignmentFlow", label: "Trainer assignment flow" },
  { key: "weeklyCheckpointReview", label: "Weekly checkpoint review" },
  { key: "videoFeedbackTimestamping", label: "Video feedback timestamping" },
  { key: "formCorrectionNotes", label: "Form correction notes" },
  { key: "goalResetWizard", label: "Goal reset wizard" },
  { key: "breakoutPlanBuilder", label: "Breakout plan builder" },
  { key: "offseasonPlanBuilder", label: "Offseason plan builder" },
  { key: "inSeasonMaintenancePlan", label: "In-season maintenance plan" },
  { key: "postInjuryConfidenceTracker", label: "Post-injury confidence tracker" },
  { key: "conditioningCalendar", label: "Conditioning calendar" },
  { key: "restDayPlanner", label: "Rest-day planner" },
  { key: "focusPlaylistIntegration", label: "Focus playlist integration" },
  { key: "trainingNoteExport", label: "Training note export" },
  { key: "parentProgressSummary", label: "Parent progress summary" },
  { key: "teamCoachProgressView", label: "Team coach progress view" },
  { key: "scoutSafeSummaryCard", label: "Scout-safe summary card" },
  { key: "athleteAvailabilityCalendarSync", label: "Athlete availability calendar sync" },
  { key: "smartInjuryRiskDashboard", label: "Smart injury-risk dashboard" },
  { key: "trainingSessionAttendanceHeatmap", label: "Training session attendance heatmap" },
  { key: "playerConfidenceCheckInBeforeGames", label: "Player confidence check-in before games" },
  { key: "aiPracticePlanGenerator", label: "AI practice plan generator" },
  { key: "athleteHabitStreakCalendar", label: "Athlete habit streak calendar" },
  { key: "gameFilmAutoTagging", label: "Game film auto-tagging" },
  { key: "athleteCommandCenterNotes", label: "Athlete command center notes" },
] as const;

const ADVANCED_TRAINING_TEXT_FIELDS = [
  { key: "athleteReportPdf", label: "Athlete report PDF" },
] as const;

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
  const [developmentProfile, setDevelopmentProfile] = useState<AthleteDevelopmentProfile | null>(null);
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
  const [assessmentForm, setAssessmentForm] = useState({ title: "", score: "75", focusArea: "" });
  const [planForm, setPlanForm] = useState({ dayLabel: "", focus: "", drills: "", recovery: "", mindset: "" });
  const [workoutCardForm, setWorkoutCardForm] = useState({ title: "", reps: "", duration: "" });
  const [habitForm, setHabitForm] = useState({ title: "", streak: "1" });
  const [sleepForm, setSleepForm] = useState({ date: new Date().toISOString().slice(0, 10), hours: "8" });
  const [recoveryReminderForm, setRecoveryReminderForm] = useState({ title: "", detail: "" });
  const [preventionForm, setPreventionForm] = useState({ title: "", exercises: "" });
  const [warmupRoutineForm, setWarmupRoutineForm] = useState({ title: "", steps: "" });
  const [cooldownRoutineForm, setCooldownRoutineForm] = useState({ title: "", steps: "" });
  const [benchmarkForm, setBenchmarkForm] = useState({ metric: "", current: "", goal: "" });
  const [recordForm, setRecordForm] = useState({ label: "", value: "" });
  const [tipForm, setTipForm] = useState({ title: "", body: "" });
  const [homeworkForm, setHomeworkForm] = useState({ title: "", dueLabel: "", status: "todo" as "todo" | "done" });
  const [challengeForm, setChallengeForm] = useState({ title: "", type: "friend" as "friend" | "team", detail: "" });
  const [shareForm, setShareForm] = useState({ title: "", summary: "" });
  const [formAnalysisFile, setFormAnalysisFile] = useState<File | null>(null);
  const [formAnalysisForm, setFormAnalysisForm] = useState({ title: "", notes: "" });
  const [advancedTrainingMeta, setAdvancedTrainingMeta] = useState<Record<string, string>>({});

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
      nextDevelopmentProfile,
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
      getAthleteDevelopmentProfile(),
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
    setDevelopmentProfile(nextDevelopmentProfile);
    setAttendanceStreak(nextAttendanceStreak);
    setProfiles(nextProfiles);
    setAdvancedTrainingMeta({
      ...Object.fromEntries(ADVANCED_TRAINING_LIST_FIELDS.map(({ key }) => [key, ((nextDevelopmentProfile as unknown as Record<string, string[]>)[key] ?? []).join("\n")])),
      ...Object.fromEntries(ADVANCED_TRAINING_TEXT_FIELDS.map(({ key }) => [key, String((nextDevelopmentProfile as unknown as Record<string, string>)[key] ?? "")])),
    });
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
  const averageSleep = developmentProfile?.sleepLogs.length
    ? (
        developmentProfile.sleepLogs.reduce((sum, entry) => sum + entry.hours, 0) /
        developmentProfile.sleepLogs.length
      ).toFixed(1)
    : "0.0";
  const restDaySuggestion =
    Number(averageBurnout) >= 6 || Number(averageSleep) < 7
      ? "Recovery coaching: lower volume today, extend sleep, and keep mobility plus hydration high."
      : "Readiness looks stable. Push skill work today and save a lighter recovery block for tomorrow.";

  const updateDevelopmentList = async <
    K extends Exclude<keyof AthleteDevelopmentProfile, "userId">
  >(
    field: K,
    items: AthleteDevelopmentProfile[K]
  ) => {
    await saveAthleteDevelopmentProfile({ [field]: items } as Partial<AthleteDevelopmentProfile>);
    await refresh();
  };

  const saveAdvancedTrainingMeta = async () => {
    if (!developmentProfile) return;
    const nextLists = Object.fromEntries(
      ADVANCED_TRAINING_LIST_FIELDS.map(({ key }) => [
        key,
        (advancedTrainingMeta[key] ?? "")
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
      ]),
    );
    const nextText = Object.fromEntries(
      ADVANCED_TRAINING_TEXT_FIELDS.map(({ key }) => [key, (advancedTrainingMeta[key] ?? "").trim()]),
    );
    await saveAthleteDevelopmentProfile({
      ...(nextLists as Partial<AthleteDevelopmentProfile>),
      ...(nextText as Partial<AthleteDevelopmentProfile>),
    });
    await refresh();
  };

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

        {developmentProfile ? (
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{developmentProfile.assessmentQuizzes.length}</div><div className="text-sm text-muted-foreground">Skill assessments</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{developmentProfile.trainingPlan.length}</div><div className="text-sm text-muted-foreground">Training plan days</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{averageSleep}h</div><div className="text-sm text-muted-foreground">Average sleep</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{developmentProfile.personalRecords.length}</div><div className="text-sm text-muted-foreground">Personal records</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{developmentProfile.coachHomework.filter((item) => item.status !== "done").length}</div><div className="text-sm text-muted-foreground">Coach homework</div></div>
          </div>
        ) : null}

        {developmentProfile ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Athlete Development Plan</CardTitle>
                <CardDescription>Skill quizzes, daily workout cards, personalized plan days, and AI-ready movement coaching.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("assessmentQuizzes", [
                    ...developmentProfile.assessmentQuizzes,
                    { id: `assessment-${Date.now()}`, title: assessmentForm.title, score: Number(assessmentForm.score), focusArea: assessmentForm.focusArea },
                  ]);
                  setAssessmentForm({ title: "", score: "75", focusArea: "" });
                }}>
                  <input value={assessmentForm.title} onChange={(event) => setAssessmentForm((current) => ({ ...current, title: event.target.value }))} placeholder="Assessment title" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={assessmentForm.score} onChange={(event) => setAssessmentForm((current) => ({ ...current, score: event.target.value }))} type="number" placeholder="Score" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={assessmentForm.focusArea} onChange={(event) => setAssessmentForm((current) => ({ ...current, focusArea: event.target.value }))} placeholder="Focus area" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <Button type="submit" className="md:col-span-3">Save Assessment</Button>
                </form>

                <form className="grid gap-3 border-t pt-4" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("trainingPlan", [
                    ...developmentProfile.trainingPlan,
                    {
                      id: `plan-${Date.now()}`,
                      dayLabel: planForm.dayLabel,
                      focus: planForm.focus,
                      drills: planForm.drills.split(",").map((value) => value.trim()).filter(Boolean),
                      recovery: planForm.recovery,
                      mindset: planForm.mindset,
                    },
                  ]);
                  setPlanForm({ dayLabel: "", focus: "", drills: "", recovery: "", mindset: "" });
                }}>
                  <input value={planForm.dayLabel} onChange={(event) => setPlanForm((current) => ({ ...current, dayLabel: event.target.value }))} placeholder="Day label" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={planForm.focus} onChange={(event) => setPlanForm((current) => ({ ...current, focus: event.target.value }))} placeholder="Daily focus" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={planForm.drills} onChange={(event) => setPlanForm((current) => ({ ...current, drills: event.target.value }))} placeholder="Drills, comma separated" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={planForm.recovery} onChange={(event) => setPlanForm((current) => ({ ...current, recovery: event.target.value }))} placeholder="Recovery block" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={planForm.mindset} onChange={(event) => setPlanForm((current) => ({ ...current, mindset: event.target.value }))} placeholder="Mindset checkpoint" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <Button type="submit">Add Plan Day</Button>
                </form>

                <form className="grid gap-3 border-t pt-4 md:grid-cols-3" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("workoutCards", [
                    ...developmentProfile.workoutCards,
                    { id: `workout-${Date.now()}`, title: workoutCardForm.title, reps: workoutCardForm.reps, duration: workoutCardForm.duration },
                  ]);
                  setWorkoutCardForm({ title: "", reps: "", duration: "" });
                }}>
                  <input value={workoutCardForm.title} onChange={(event) => setWorkoutCardForm((current) => ({ ...current, title: event.target.value }))} placeholder="Workout card" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={workoutCardForm.reps} onChange={(event) => setWorkoutCardForm((current) => ({ ...current, reps: event.target.value }))} placeholder="Reps / sets" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={workoutCardForm.duration} onChange={(event) => setWorkoutCardForm((current) => ({ ...current, duration: event.target.value }))} placeholder="Duration" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <Button type="submit" className="md:col-span-3">Add Daily Workout Card</Button>
                </form>

                <div className="space-y-3 border-t pt-4">
                  <div className="rounded-xl bg-muted p-4 text-sm">{restDaySuggestion}</div>
                  {developmentProfile.trainingPlan.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.dayLabel}</p>
                        <span className="text-sm text-muted-foreground">{item.focus}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.drills.join(" | ")}</p>
                      <p className="mt-2 text-sm">Recovery: {item.recovery || "Not set"}</p>
                      <p className="text-sm">Mindset: {item.mindset || "Not set"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Habits, Recovery, and Routines</CardTitle>
                <CardDescription>Habit tracking, sleep logs, hydration support, injury prevention, warmups, and cooldowns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <form className="grid gap-3" onSubmit={async (event) => {
                    event.preventDefault();
                    await updateDevelopmentList("habits", [...developmentProfile.habits, { id: `habit-${Date.now()}`, title: habitForm.title, streak: Number(habitForm.streak) }]);
                    setHabitForm({ title: "", streak: "1" });
                  }}>
                    <input value={habitForm.title} onChange={(event) => setHabitForm((current) => ({ ...current, title: event.target.value }))} placeholder="Habit" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <input value={habitForm.streak} onChange={(event) => setHabitForm((current) => ({ ...current, streak: event.target.value }))} type="number" placeholder="Streak" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <Button type="submit">Save Habit</Button>
                  </form>
                  <form className="grid gap-3" onSubmit={async (event) => {
                    event.preventDefault();
                    await updateDevelopmentList("sleepLogs", [...developmentProfile.sleepLogs, { id: `sleep-${Date.now()}`, date: sleepForm.date, hours: Number(sleepForm.hours) }]);
                    setSleepForm({ date: new Date().toISOString().slice(0, 10), hours: "8" });
                  }}>
                    <input value={sleepForm.date} onChange={(event) => setSleepForm((current) => ({ ...current, date: event.target.value }))} type="date" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <input value={sleepForm.hours} onChange={(event) => setSleepForm((current) => ({ ...current, hours: event.target.value }))} type="number" step="0.5" placeholder="Sleep hours" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <Button type="submit">Log Sleep</Button>
                  </form>
                </div>

                <form className="grid gap-3 border-t pt-4 md:grid-cols-2" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("recoveryReminders", [...developmentProfile.recoveryReminders, { id: `reminder-${Date.now()}`, title: recoveryReminderForm.title, detail: recoveryReminderForm.detail }]);
                  setRecoveryReminderForm({ title: "", detail: "" });
                }}>
                  <input value={recoveryReminderForm.title} onChange={(event) => setRecoveryReminderForm((current) => ({ ...current, title: event.target.value }))} placeholder="Recovery reminder" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={recoveryReminderForm.detail} onChange={(event) => setRecoveryReminderForm((current) => ({ ...current, detail: event.target.value }))} placeholder="Detail" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <Button type="submit" className="md:col-span-2">Add Reminder</Button>
                </form>

                <div className="grid gap-3 border-t pt-4 md:grid-cols-3">
                  <div className="space-y-3">
                    <input value={preventionForm.title} onChange={(event) => setPreventionForm((current) => ({ ...current, title: event.target.value }))} placeholder="Injury prevention plan" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <input value={preventionForm.exercises} onChange={(event) => setPreventionForm((current) => ({ ...current, exercises: event.target.value }))} placeholder="Exercises, comma separated" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <Button type="button" variant="outline" onClick={() => void updateDevelopmentList("injuryPreventionPlans", [...developmentProfile.injuryPreventionPlans, { id: `injury-${Date.now()}`, title: preventionForm.title, exercises: preventionForm.exercises.split(",").map((value) => value.trim()).filter(Boolean) }]).then(() => setPreventionForm({ title: "", exercises: "" }))}>Save Prevention Plan</Button>
                  </div>
                  <div className="space-y-3">
                    <input value={warmupRoutineForm.title} onChange={(event) => setWarmupRoutineForm((current) => ({ ...current, title: event.target.value }))} placeholder="Warmup title" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <input value={warmupRoutineForm.steps} onChange={(event) => setWarmupRoutineForm((current) => ({ ...current, steps: event.target.value }))} placeholder="Steps, comma separated" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <Button type="button" variant="outline" onClick={() => void updateDevelopmentList("warmups", [...developmentProfile.warmups, { id: `warmup-${Date.now()}`, title: warmupRoutineForm.title, steps: warmupRoutineForm.steps.split(",").map((value) => value.trim()).filter(Boolean) }]).then(() => setWarmupRoutineForm({ title: "", steps: "" }))}>Save Warmup</Button>
                  </div>
                  <div className="space-y-3">
                    <input value={cooldownRoutineForm.title} onChange={(event) => setCooldownRoutineForm((current) => ({ ...current, title: event.target.value }))} placeholder="Cooldown title" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <input value={cooldownRoutineForm.steps} onChange={(event) => setCooldownRoutineForm((current) => ({ ...current, steps: event.target.value }))} placeholder="Steps, comma separated" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <Button type="button" variant="outline" onClick={() => void updateDevelopmentList("cooldowns", [...developmentProfile.cooldowns, { id: `cooldown-${Date.now()}`, title: cooldownRoutineForm.title, steps: cooldownRoutineForm.steps.split(",").map((value) => value.trim()).filter(Boolean) }]).then(() => setCooldownRoutineForm({ title: "", steps: "" }))}>Save Cooldown</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

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
                    <p className="text-muted-foreground">{entry.date} | {entry.durationMinutes} min | intensity {entry.intensity}/10</p>
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
                    <p className="font-semibold">{entry.type === "physio" ? "Physio" : "Recovery"} | {entry.hostName}</p>
                    <p className="text-muted-foreground">{entry.scheduledFor} | {entry.status}</p>
                    <p className="mt-1">{entry.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {developmentProfile ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Benchmarks, Testing, and Personal Records</CardTitle>
                <CardDescription>Strength benchmarks, vertical/speed/stamina tracking, and a personal records board.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("benchmarks", [...developmentProfile.benchmarks, { id: `benchmark-${Date.now()}`, metric: benchmarkForm.metric, current: benchmarkForm.current, goal: benchmarkForm.goal }]);
                  setBenchmarkForm({ metric: "", current: "", goal: "" });
                }}>
                  <input value={benchmarkForm.metric} onChange={(event) => setBenchmarkForm((current) => ({ ...current, metric: event.target.value }))} placeholder="Metric" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={benchmarkForm.current} onChange={(event) => setBenchmarkForm((current) => ({ ...current, current: event.target.value }))} placeholder="Current" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={benchmarkForm.goal} onChange={(event) => setBenchmarkForm((current) => ({ ...current, goal: event.target.value }))} placeholder="Goal" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <Button type="submit" className="md:col-span-3">Save Benchmark</Button>
                </form>

                <form className="grid gap-3 border-t pt-4 md:grid-cols-2" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("personalRecords", [...developmentProfile.personalRecords, { id: `record-${Date.now()}`, label: recordForm.label, value: recordForm.value }]);
                  setRecordForm({ label: "", value: "" });
                }}>
                  <input value={recordForm.label} onChange={(event) => setRecordForm((current) => ({ ...current, label: event.target.value }))} placeholder="PR label" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={recordForm.value} onChange={(event) => setRecordForm((current) => ({ ...current, value: event.target.value }))} placeholder="PR value" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <Button type="submit" className="md:col-span-2">Save Personal Record</Button>
                </form>

                <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                  {developmentProfile.benchmarks.map((item) => (
                    <div key={item.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-semibold">{item.metric}</p>
                      <p className="text-muted-foreground">Current: {item.current}</p>
                      <p>Goal: {item.goal}</p>
                    </div>
                  ))}
                  {developmentProfile.personalRecords.map((item) => (
                    <div key={item.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-muted-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Analysis, AI Tips, and Coach Homework</CardTitle>
                <CardDescription>Upload movement clips, save AI-style coaching tips, and manage coach-assigned homework.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
                  <input value={formAnalysisForm.title} onChange={(event) => setFormAnalysisForm((current) => ({ ...current, title: event.target.value }))} placeholder="Form analysis title" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input type="file" accept="image/*,video/*" onChange={(event) => setFormAnalysisFile(event.target.files?.[0] ?? null)} className="h-10 rounded-md border border-input px-3 text-sm" />
                  <Button type="button" onClick={() => formAnalysisFile ? void addFormAnalysisUpload({ title: formAnalysisForm.title, notes: formAnalysisForm.notes, mediaFile: formAnalysisFile }).then(async () => { setFormAnalysisForm({ title: "", notes: "" }); setFormAnalysisFile(null); await refresh(); }) : undefined}>
                    Upload
                  </Button>
                </div>
                <textarea value={formAnalysisForm.notes} onChange={(event) => setFormAnalysisForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Form analysis notes" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm" />

                <form className="grid gap-3 border-t pt-4" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("aiTips", [...developmentProfile.aiTips, { id: `tip-${Date.now()}`, title: tipForm.title, body: tipForm.body }]);
                  setTipForm({ title: "", body: "" });
                }}>
                  <input value={tipForm.title} onChange={(event) => setTipForm((current) => ({ ...current, title: event.target.value }))} placeholder="AI movement tip title" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <textarea value={tipForm.body} onChange={(event) => setTipForm((current) => ({ ...current, body: event.target.value }))} placeholder="Tip body" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm" />
                  <Button type="submit">Save AI Tip</Button>
                </form>

                <form className="grid gap-3 border-t pt-4 md:grid-cols-3" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("coachHomework", [...developmentProfile.coachHomework, { id: `homework-${Date.now()}`, title: homeworkForm.title, dueLabel: homeworkForm.dueLabel, status: homeworkForm.status }]);
                  setHomeworkForm({ title: "", dueLabel: "", status: "todo" });
                }}>
                  <input value={homeworkForm.title} onChange={(event) => setHomeworkForm((current) => ({ ...current, title: event.target.value }))} placeholder="Homework task" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <input value={homeworkForm.dueLabel} onChange={(event) => setHomeworkForm((current) => ({ ...current, dueLabel: event.target.value }))} placeholder="Due label" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <select value={homeworkForm.status} onChange={(event) => setHomeworkForm((current) => ({ ...current, status: event.target.value as typeof current.status }))} className="h-10 rounded-md border border-input px-3 text-sm">
                    <option value="todo">todo</option>
                    <option value="done">done</option>
                  </select>
                  <Button type="submit" className="md:col-span-3">Save Homework</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : null}

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
                  <div key={entry.id} className="rounded-xl border p-3 text-sm">{entry.title} | {entry.status}</div>
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

        {developmentProfile ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Challenges and Progress Sharing</CardTitle>
                <CardDescription>Challenge friends on drills, run team competitions, and prepare shareable progress updates for the feed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("challenges", [...developmentProfile.challenges, { id: `challenge-${Date.now()}`, title: challengeForm.title, type: challengeForm.type, detail: challengeForm.detail }]);
                  setChallengeForm({ title: "", type: "friend", detail: "" });
                }}>
                  <input value={challengeForm.title} onChange={(event) => setChallengeForm((current) => ({ ...current, title: event.target.value }))} placeholder="Challenge title" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <select value={challengeForm.type} onChange={(event) => setChallengeForm((current) => ({ ...current, type: event.target.value as typeof current.type }))} className="h-10 rounded-md border border-input px-3 text-sm">
                    <option value="friend">friend</option>
                    <option value="team">team</option>
                  </select>
                  <input value={challengeForm.detail} onChange={(event) => setChallengeForm((current) => ({ ...current, detail: event.target.value }))} placeholder="Challenge detail" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <Button type="submit" className="md:col-span-3">Save Challenge</Button>
                </form>

                <form className="grid gap-3 border-t pt-4" onSubmit={async (event) => {
                  event.preventDefault();
                  await updateDevelopmentList("sharedUpdates", [...developmentProfile.sharedUpdates, { id: `share-${Date.now()}`, title: shareForm.title, summary: shareForm.summary }]);
                  setShareForm({ title: "", summary: "" });
                }}>
                  <input value={shareForm.title} onChange={(event) => setShareForm((current) => ({ ...current, title: event.target.value }))} placeholder="Progress share title" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <textarea value={shareForm.summary} onChange={(event) => setShareForm((current) => ({ ...current, summary: event.target.value }))} placeholder="What should be shared to the feed?" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm" />
                  <Button type="submit">Save Share Draft</Button>
                </form>

                <div className="space-y-3 border-t pt-4">
                  {developmentProfile.challenges.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.type} challenge</p>
                      <p className="mt-2 text-sm">{item.detail}</p>
                    </div>
                  ))}
                  {developmentProfile.sharedUpdates.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-2 text-sm">{item.summary}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Development Snapshot</CardTitle>
                <CardDescription>Weekly and monthly progress, milestone celebrations, and athlete-friendly review cards.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">Weekly progress dashboard</p>
                    <p className="mt-2 text-2xl font-bold">{developmentProfile.habits.reduce((sum, item) => sum + item.streak, 0)}</p>
                    <p className="text-sm text-muted-foreground">Habit reps banked this week</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">Monthly progress report</p>
                    <p className="mt-2 text-2xl font-bold">{developmentProfile.formAnalyses.length + developmentProfile.personalRecords.length}</p>
                    <p className="text-sm text-muted-foreground">Form uploads and PR entries logged</p>
                  </div>
                </div>
                <div className="rounded-xl bg-primary/5 p-4 text-sm text-primary">
                  Goal milestone celebrations unlock automatically when your training goals hit target, and your development hub now keeps the surrounding context in one place.
                </div>
                <div className="space-y-2">
                  {developmentProfile.aiTips.map((item) => (
                    <div key={item.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1">{item.body}</p>
                    </div>
                  ))}
                  {developmentProfile.coachHomework.map((item) => (
                    <div key={item.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-muted-foreground">{item.dueLabel || "No due date"} | {item.status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {developmentProfile ? (
          <Card>
            <CardHeader>
              <CardTitle>Full Athlete Command Center</CardTitle>
              <CardDescription>Extended athlete-development tracking for skill analytics, journals, planning, nutrition, progression, reporting, and coach or parent views.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{developmentProfile.progressBadges.length}</div><div className="text-sm text-muted-foreground">Progress badges</div></div>
                <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{developmentProfile.athleteXp.length}</div><div className="text-sm text-muted-foreground">XP / level logs</div></div>
                <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{developmentProfile.smartDrillRecommendations.length}</div><div className="text-sm text-muted-foreground">Smart drill recs</div></div>
                <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{developmentProfile.parentProgressSummary.length + developmentProfile.teamCoachProgressView.length + developmentProfile.scoutSafeSummaryCard.length}</div><div className="text-sm text-muted-foreground">Shared summary views</div></div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {ADVANCED_TRAINING_TEXT_FIELDS.map(({ key, label }) => (
                  <div key={key} className="rounded-xl border p-4">
                    <p className="font-semibold">{label}</p>
                    <input
                      value={advancedTrainingMeta[key] ?? ""}
                      onChange={(event) => setAdvancedTrainingMeta((current) => ({ ...current, [key]: event.target.value }))}
                      placeholder={label}
                      className="mt-3 h-10 w-full rounded-md border border-input px-3 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {ADVANCED_TRAINING_LIST_FIELDS.map(({ key, label }) => (
                  <div key={key} className="rounded-xl border p-4">
                    <p className="font-semibold">{label}</p>
                    <textarea
                      value={advancedTrainingMeta[key] ?? ""}
                      onChange={(event) => setAdvancedTrainingMeta((current) => ({ ...current, [key]: event.target.value }))}
                      placeholder={`One ${label.toLowerCase()} item per line`}
                      className="mt-3 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <div className="mt-3 space-y-2">
                      {((developmentProfile as unknown as Record<string, string[]>)[key] ?? []).slice(0, 4).map((item) => (
                        <div key={`${key}-${item}`} className="rounded-lg bg-muted p-2 text-sm">{item}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => void saveAdvancedTrainingMeta()}>Save Command Center</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
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
