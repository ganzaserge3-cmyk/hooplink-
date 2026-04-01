import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getCurrentUserRecoveryJournal } from "@/lib/performance";
import { getCurrentUserConditioningLogs, getCurrentUserNutritionJournal } from "@/lib/training";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";

type FirestoreTimestamp = { seconds?: number; nanoseconds?: number } | null;

export interface AthleteJournalEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  tags: string[];
  moodScore: number;
  createdAt?: FirestoreTimestamp;
}

export interface MealPlanRecord {
  id: string;
  title: string;
  goal: string;
  meals: string[];
  groceryItems: string[];
  createdAt?: FirestoreTimestamp;
}

export interface CoachInterventionRecord {
  id: string;
  coachName: string;
  trigger: string;
  recommendation: string;
  status: "watch" | "action" | "resolved";
  createdAt?: FirestoreTimestamp;
}

export interface WarmupChecklistRecord {
  id: string;
  title: string;
  items: string[];
  createdAt?: FirestoreTimestamp;
}

export interface SkillChallengeLadderRecord {
  id: string;
  title: string;
  steps: string[];
  currentStep: number;
  createdAt?: FirestoreTimestamp;
}

export interface WearableAlertRecord {
  id: string;
  source: string;
  metric: string;
  valueLabel: string;
  severity: "low" | "medium" | "high";
  createdAt?: FirestoreTimestamp;
}

export interface HeartRateZoneRecord {
  id: string;
  workoutName: string;
  zone1: number;
  zone2: number;
  zone3: number;
  zone4: number;
  zone5: number;
  createdAt?: FirestoreTimestamp;
}

export interface SprintMetricRecord {
  id: string;
  label: string;
  split10m: number;
  split20m: number;
  topSpeed: number;
  createdAt?: FirestoreTimestamp;
}

export interface JumpMetricRecord {
  id: string;
  label: string;
  leftLoad: number;
  rightLoad: number;
  maxJump: number;
  createdAt?: FirestoreTimestamp;
}

export interface ShotAnalyticsRecord {
  id: string;
  sessionName: string;
  paintMakes: number;
  midrangeMakes: number;
  threePointMakes: number;
  createdAt?: FirestoreTimestamp;
}

export interface DefensiveAssignmentRecord {
  id: string;
  matchup: string;
  stops: number;
  blowBys: number;
  notes: string;
  createdAt?: FirestoreTimestamp;
}

export interface ReturnToPlayApprovalRecord {
  id: string;
  approverName: string;
  phase: string;
  status: "pending" | "approved";
  notes: string;
  createdAt?: FirestoreTimestamp;
}

export interface DirectorySpecialistRecord {
  uid: string;
  displayName: string;
  type: "nutritionist" | "sports_psych";
  sport: string;
  location: string;
}

export interface SpecialistBookingRecord {
  id: string;
  specialistType: "nutritionist" | "sports_psych";
  specialistName: string;
  scheduledFor: string;
  focus: string;
  createdAt?: FirestoreTimestamp;
}

export interface HealthHubSnapshot {
  journal: AthleteJournalEntry[];
  mealPlans: MealPlanRecord[];
  interventions: CoachInterventionRecord[];
  warmups: WarmupChecklistRecord[];
  ladders: SkillChallengeLadderRecord[];
  alerts: WearableAlertRecord[];
  heartRateZones: HeartRateZoneRecord[];
  sprintMetrics: SprintMetricRecord[];
  jumpMetrics: JumpMetricRecord[];
  shotAnalytics: ShotAnalyticsRecord[];
  defensiveAssignments: DefensiveAssignmentRecord[];
  approvals: ReturnToPlayApprovalRecord[];
  nutritionists: DirectorySpecialistRecord[];
  sportsPsychs: DirectorySpecialistRecord[];
  bookings: SpecialistBookingRecord[];
  moodAverage: number;
  sleepDebtAlert: string;
  trainingLoadScore: number;
  readinessScore: number;
  recoveryMilestones: string[];
}

function requireUser() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
  return auth.currentUser;
}

function mapTimestamp(data: Record<string, unknown>, key: string) {
  return (data[key] as FirestoreTimestamp | undefined) ?? null;
}

async function getCollection<T>(name: string, mapper: (id: string, data: Record<string, unknown>) => T) {
  if (!db || !auth?.currentUser) return [] as T[];
  const snapshot = await getDocs(
    query(collection(db, name), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"), limit(40))
  );
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapper(docSnapshot.id, docSnapshot.data())
  );
}

async function createUserRecord(name: string, data: Record<string, unknown>) {
  const user = requireUser();
  await addDoc(collection(db!, name), {
    userId: user.uid,
    ownerName: user.displayName || user.email || "HoopLink User",
    ...data,
    createdAt: serverTimestamp(),
  });
}

async function safeFetch<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export const createAthleteJournalEntry = (input: { date: string; title: string; body: string; tags: string[]; moodScore: number }) =>
  createUserRecord("phase6Journal", input);
export const createMealPlan = (input: { title: string; goal: string; meals: string[]; groceryItems: string[] }) =>
  createUserRecord("phase6MealPlans", input);
export const createCoachIntervention = (input: { coachName: string; trigger: string; recommendation: string; status: CoachInterventionRecord["status"] }) =>
  createUserRecord("phase6Interventions", input);
export const createWarmupChecklist = (input: { title: string; items: string[] }) =>
  createUserRecord("phase6Warmups", input);
export const createSkillChallengeLadder = (input: { title: string; steps: string[]; currentStep: number }) =>
  createUserRecord("phase6Ladders", input);
export const createWearableAlert = (input: { source: string; metric: string; valueLabel: string; severity: WearableAlertRecord["severity"] }) =>
  createUserRecord("phase6WearableAlerts", input);
export const createHeartRateZone = (input: { workoutName: string; zone1: number; zone2: number; zone3: number; zone4: number; zone5: number }) =>
  createUserRecord("phase6HeartRateZones", input);
export const createSprintMetric = (input: { label: string; split10m: number; split20m: number; topSpeed: number }) =>
  createUserRecord("phase6SprintMetrics", input);
export const createJumpMetric = (input: { label: string; leftLoad: number; rightLoad: number; maxJump: number }) =>
  createUserRecord("phase6JumpMetrics", input);
export const createShotAnalytics = (input: { sessionName: string; paintMakes: number; midrangeMakes: number; threePointMakes: number }) =>
  createUserRecord("phase6ShotAnalytics", input);
export const createDefensiveAssignment = (input: { matchup: string; stops: number; blowBys: number; notes: string }) =>
  createUserRecord("phase6DefensiveAssignments", input);
export const createReturnToPlayApproval = (input: { approverName: string; phase: string; status: ReturnToPlayApprovalRecord["status"]; notes: string }) =>
  createUserRecord("phase6ReturnToPlayApprovals", input);
export const createSpecialistBooking = (input: { specialistType: SpecialistBookingRecord["specialistType"]; specialistName: string; scheduledFor: string; focus: string }) =>
  createUserRecord("phase6SpecialistBookings", input);

async function getSpecialists() {
  const profiles = await searchProfiles("");
  const mapped = profiles
    .filter((profile: SearchProfile) => {
      const role = String(profile.role?.type ?? "").toLowerCase();
      return role === "coach" || role === "scout" || role === "fan";
    })
    .map((profile: SearchProfile, index: number) => ({
      uid: profile.uid,
      displayName: profile.displayName,
      type: index % 2 === 0 ? "nutritionist" : "sports_psych",
      sport: profile.role?.sport ?? "",
      location: profile.location ?? "",
    })) as DirectorySpecialistRecord[];

  return {
    nutritionists: mapped.filter((entry) => entry.type === "nutritionist").slice(0, 10),
    sportsPsychs: mapped.filter((entry) => entry.type === "sports_psych").slice(0, 10),
  };
}

function calculateSleepDebtAlert(entries: Array<{ sleepHours: number }>) {
  if (!entries.length) return "No recent sleep trend yet.";
  const averageSleep = entries.reduce((sum, entry) => sum + entry.sleepHours, 0) / entries.length;
  if (averageSleep >= 8) return "Sleep trend is strong.";
  if (averageSleep >= 7) return "Watch sleep consistency this week.";
  return "Sleep debt risk is elevated.";
}

function calculateTrainingLoadScore(entries: Array<{ durationMinutes: number; intensity: number }>) {
  if (!entries.length) return 0;
  return Math.round(entries.reduce((sum, entry) => sum + entry.durationMinutes * entry.intensity, 0) / entries.length);
}

function calculateReadinessScore(input: { recoveryEntries: Array<{ energy: number; soreness: number; sleepHours: number }>; trainingLoadScore: number }) {
  const latest = input.recoveryEntries[0];
  if (!latest) return 72;
  const score = 50 + latest.energy * 4 + latest.sleepHours * 2 - latest.soreness * 3 - input.trainingLoadScore / 25;
  return Math.max(20, Math.min(99, Math.round(score)));
}

function getRecoveryMilestones(recoveryEntries: Array<{ status: string; energy: number; soreness: number }>) {
  const milestones: string[] = [];
  if (recoveryEntries.some((entry) => entry.status === "great")) milestones.push("Great recovery day logged");
  if (recoveryEntries.some((entry) => entry.energy >= 8)) milestones.push("High-energy session banked");
  if (recoveryEntries.some((entry) => entry.soreness <= 2)) milestones.push("Low soreness milestone hit");
  return milestones;
}

export async function getHealthHubSnapshot(): Promise<HealthHubSnapshot> {
  const [
    journal,
    mealPlans,
    interventions,
    warmups,
    ladders,
    alerts,
    heartRateZones,
    sprintMetrics,
    jumpMetrics,
    shotAnalytics,
    defensiveAssignments,
    approvals,
    bookings,
    specialists,
    recoveryEntries,
    conditioningLogs,
    nutritionJournal,
  ] = await Promise.all([
    safeFetch(getCollection("phase6Journal", (id, data) => ({
      id,
      date: String(data.date ?? ""),
      title: String(data.title ?? ""),
      body: String(data.body ?? ""),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      moodScore: Number(data.moodScore ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as AthleteJournalEntry[]),
    safeFetch(getCollection("phase6MealPlans", (id, data) => ({
      id,
      title: String(data.title ?? ""),
      goal: String(data.goal ?? ""),
      meals: Array.isArray(data.meals) ? data.meals.map(String) : [],
      groceryItems: Array.isArray(data.groceryItems) ? data.groceryItems.map(String) : [],
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as MealPlanRecord[]),
    safeFetch(getCollection("phase6Interventions", (id, data) => ({
      id,
      coachName: String(data.coachName ?? ""),
      trigger: String(data.trigger ?? ""),
      recommendation: String(data.recommendation ?? ""),
      status: data.status === "watch" || data.status === "resolved" ? data.status : "action",
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as CoachInterventionRecord[]),
    safeFetch(getCollection("phase6Warmups", (id, data) => ({
      id,
      title: String(data.title ?? ""),
      items: Array.isArray(data.items) ? data.items.map(String) : [],
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as WarmupChecklistRecord[]),
    safeFetch(getCollection("phase6Ladders", (id, data) => ({
      id,
      title: String(data.title ?? ""),
      steps: Array.isArray(data.steps) ? data.steps.map(String) : [],
      currentStep: Number(data.currentStep ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as SkillChallengeLadderRecord[]),
    safeFetch(getCollection("phase6WearableAlerts", (id, data) => ({
      id,
      source: String(data.source ?? ""),
      metric: String(data.metric ?? ""),
      valueLabel: String(data.valueLabel ?? ""),
      severity: data.severity === "low" || data.severity === "high" ? data.severity : "medium",
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as WearableAlertRecord[]),
    safeFetch(getCollection("phase6HeartRateZones", (id, data) => ({
      id,
      workoutName: String(data.workoutName ?? ""),
      zone1: Number(data.zone1 ?? 0),
      zone2: Number(data.zone2 ?? 0),
      zone3: Number(data.zone3 ?? 0),
      zone4: Number(data.zone4 ?? 0),
      zone5: Number(data.zone5 ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as HeartRateZoneRecord[]),
    safeFetch(getCollection("phase6SprintMetrics", (id, data) => ({
      id,
      label: String(data.label ?? ""),
      split10m: Number(data.split10m ?? 0),
      split20m: Number(data.split20m ?? 0),
      topSpeed: Number(data.topSpeed ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as SprintMetricRecord[]),
    safeFetch(getCollection("phase6JumpMetrics", (id, data) => ({
      id,
      label: String(data.label ?? ""),
      leftLoad: Number(data.leftLoad ?? 0),
      rightLoad: Number(data.rightLoad ?? 0),
      maxJump: Number(data.maxJump ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as JumpMetricRecord[]),
    safeFetch(getCollection("phase6ShotAnalytics", (id, data) => ({
      id,
      sessionName: String(data.sessionName ?? ""),
      paintMakes: Number(data.paintMakes ?? 0),
      midrangeMakes: Number(data.midrangeMakes ?? 0),
      threePointMakes: Number(data.threePointMakes ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as ShotAnalyticsRecord[]),
    safeFetch(getCollection("phase6DefensiveAssignments", (id, data) => ({
      id,
      matchup: String(data.matchup ?? ""),
      stops: Number(data.stops ?? 0),
      blowBys: Number(data.blowBys ?? 0),
      notes: String(data.notes ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as DefensiveAssignmentRecord[]),
    safeFetch(getCollection("phase6ReturnToPlayApprovals", (id, data) => ({
      id,
      approverName: String(data.approverName ?? ""),
      phase: String(data.phase ?? ""),
      status: data.status === "approved" ? "approved" : "pending",
      notes: String(data.notes ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as ReturnToPlayApprovalRecord[]),
    safeFetch(getCollection("phase6SpecialistBookings", (id, data) => ({
      id,
      specialistType: data.specialistType === "nutritionist" ? "nutritionist" : "sports_psych",
      specialistName: String(data.specialistName ?? ""),
      scheduledFor: String(data.scheduledFor ?? ""),
      focus: String(data.focus ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })), [] as SpecialistBookingRecord[]),
    safeFetch(getSpecialists(), {
      nutritionists: [] as DirectorySpecialistRecord[],
      sportsPsychs: [] as DirectorySpecialistRecord[],
    }),
    getCurrentUserRecoveryJournal().catch(() => []),
    getCurrentUserConditioningLogs().catch(() => []),
    getCurrentUserNutritionJournal().catch(() => []),
  ]);

  const moodAverage = journal.length
    ? Math.round(journal.reduce((sum: number, entry: AthleteJournalEntry) => sum + entry.moodScore, 0) / journal.length)
    : 0;
  const trainingLoadScore = calculateTrainingLoadScore(conditioningLogs);
  const readinessScore = calculateReadinessScore({ recoveryEntries, trainingLoadScore });

  return {
    journal,
    mealPlans,
    interventions,
    warmups,
    ladders,
    alerts,
    heartRateZones,
    sprintMetrics,
    jumpMetrics,
    shotAnalytics,
    defensiveAssignments,
    approvals,
    nutritionists: specialists.nutritionists,
    sportsPsychs: specialists.sportsPsychs,
    bookings,
    moodAverage,
    sleepDebtAlert: calculateSleepDebtAlert(recoveryEntries),
    trainingLoadScore,
    readinessScore,
    recoveryMilestones: getRecoveryMilestones(recoveryEntries),
  };
}
