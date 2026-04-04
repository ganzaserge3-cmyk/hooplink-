import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

function requireUser() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
  return auth.currentUser;
}

function mapTime(value: unknown) {
  return (value as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null;
}

export interface WearableSyncRecord {
  id: string;
  provider: "wearable" | "apple_health" | "google_fit";
  status: "connected" | "mocked";
  label: string;
}

export interface FieldMetricRecord {
  id: string;
  type: "gps" | "sprint" | "jump" | "shooting";
  label: string;
  value: number;
  notes: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface MoralePulseRecord {
  id: string;
  score: number;
  reflection: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface QuietHoursSettings {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

export interface FuturePremiumProfile {
  advancedFutureOps: Record<string, string[]>;
}

export interface ScheduleItemInput {
  label: string;
  startIso: string;
  endIso: string;
}

export async function saveWearableSync(provider: WearableSyncRecord["provider"], label: string) {
  requireUser();
  await addDoc(collection(db!, "wearableSyncs"), {
    userId: auth!.currentUser!.uid,
    provider,
    label: label.trim() || provider,
    status: "connected",
    createdAt: serverTimestamp(),
  });
}

export async function getWearableSyncs() {
  if (!auth?.currentUser || !db) return [];
  const snapshot = await getDocs(query(collection(db, "wearableSyncs"), limit(20)));
  return snapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        provider: String(data.provider ?? "wearable") as WearableSyncRecord["provider"],
        status: data.status === "mocked" ? "mocked" : "connected",
        label: String(data.label ?? ""),
      } satisfies WearableSyncRecord;
    })
    .filter((record: WearableSyncRecord) => record.label);
}

export async function addFieldMetric(input: { type: FieldMetricRecord["type"]; label: string; value: number; notes: string }) {
  requireUser();
  await addDoc(collection(db!, "fieldMetrics"), {
    userId: auth!.currentUser!.uid,
    type: input.type,
    label: input.label.trim(),
    value: input.value,
    notes: input.notes.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getFieldMetrics() {
  if (!auth?.currentUser || !db) return [];
  const snapshot = await getDocs(query(collection(db, "fieldMetrics"), orderBy("createdAt", "desc"), limit(100)));
  return snapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        type: String(data.type ?? "gps") as FieldMetricRecord["type"],
        label: String(data.label ?? ""),
        value: Number(data.value ?? 0),
        notes: String(data.notes ?? ""),
        createdAt: mapTime(data.createdAt),
      } satisfies FieldMetricRecord;
    })
    .filter((record: FieldMetricRecord) => record.label);
}

export async function addMoralePulse(score: number, reflection: string) {
  requireUser();
  await addDoc(collection(db!, "moralePulses"), {
    userId: auth!.currentUser!.uid,
    score,
    reflection: reflection.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getMoralePulses() {
  if (!auth?.currentUser || !db) return [];
  const snapshot = await getDocs(query(collection(db, "moralePulses"), orderBy("createdAt", "desc"), limit(30)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      score: Number(data.score ?? 0),
      reflection: String(data.reflection ?? ""),
      createdAt: mapTime(data.createdAt),
    } satisfies MoralePulseRecord;
  });
}

export async function getQuietHoursSettings() {
  if (!auth?.currentUser || !db) {
    return { enabled: false, startHour: 22, endHour: 7 } satisfies QuietHoursSettings;
  }

  const snapshot = await getDocs(query(collection(db, "quietHours"), limit(1)));
  const own = snapshot.docs.find((docSnapshot: { id: string; data: () => Record<string, unknown> }) => (docSnapshot.data() as Record<string, unknown>).userId === auth.currentUser?.uid);
  if (!own) {
    return { enabled: false, startHour: 22, endHour: 7 } satisfies QuietHoursSettings;
  }
  const data = own.data() as Record<string, unknown>;
  return {
    enabled: data.enabled === true,
    startHour: Number(data.startHour ?? 22),
    endHour: Number(data.endHour ?? 7),
  } satisfies QuietHoursSettings;
}

export async function saveQuietHoursSettings(input: QuietHoursSettings) {
  const user = requireUser();
  await setDoc(doc(db!, "quietHours", user.uid), {
    userId: user.uid,
    enabled: input.enabled,
    startHour: input.startHour,
    endHour: input.endHour,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function isSpamCandidate(text: string) {
  const normalized = text.toLowerCase();
  const triggers = ["buy now", "guaranteed", "click here", "dm for cash", "free money"];
  return triggers.some((trigger) => normalized.includes(trigger)) || /(.)\1{6,}/.test(normalized);
}

export function getModerationRiskScore(text: string) {
  let score = 20;
  if (isSpamCandidate(text)) score += 45;
  if (text.toLowerCase().includes("hate")) score += 15;
  if (text.toLowerCase().includes("threat")) score += 20;
  return Math.min(score, 100);
}

export function buildOpponentScoutingReport(input: { opponent: string; tendencies: string; weakSpots: string }) {
  return `${input.opponent} scouting report: lean on ${input.weakSpots || "transition pressure"} and stay alert for ${input.tendencies || "their early-action sets"}. First priority is taking away paint touches and forcing secondary creators into late-clock decisions.`;
}

export function buildDrillRecommendations(gameLogSummary: string) {
  return [
    `Drill focus from recent games: ${gameLogSummary || "ball security and finishing through contact"}.`,
    "Add one closeout-to-contain rep block and one weak-hand finishing block.",
    "End the session with pressure free throws after fatigue work.",
  ];
}

export function buildNutritionSuggestions(input: { goal: string; load: string }) {
  return `Nutrition suggestion: match ${input.goal || "performance recovery"} with higher-protein meals, a carb-focused pre-session snack, and hydration support for ${input.load || "heavy training days"}.`;
}

export function buildSleepRecoveryCoaching(input: { sleepHours: number; soreness: number }) {
  if (input.sleepHours < 7 || input.soreness > 6) {
    return "Recovery coaching: lower intensity today, extend sleep opportunity, and prioritize mobility plus hydration before extra volume.";
  }
  return "Recovery coaching: green-light normal workload, but keep post-session nutrition and cooldown consistent.";
}

export function buildHeatmapBuckets(metrics: FieldMetricRecord[], type: FieldMetricRecord["type"]) {
  const relevant = metrics.filter((metric) => metric.type === type);
  return relevant.map((metric, index) => ({
    zone: `${type}-${index + 1}`,
    intensity: Math.max(1, Math.min(10, Math.round(metric.value))),
    label: metric.label,
  }));
}

export function detectScheduleConflicts(items: ScheduleItemInput[]) {
  const sorted = [...items].sort((a, b) => a.startIso.localeCompare(b.startIso));
  const conflicts: Array<{ first: string; second: string }> = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    if (current.endIso > next.startIso) {
      conflicts.push({ first: current.label, second: next.label });
    }
  }
  return conflicts;
}

export function buildLivestreamAnalyticsInsight(input: { viewers: number; avgWatchMinutes: number }) {
  return `Livestream insight: ${input.viewers} viewers with ${input.avgWatchMinutes} average minutes watched suggests ${input.avgWatchMinutes >= 8 ? "strong session retention" : "opening interest with room to improve retention hooks"}.`;
}

export function buildCampaignPerformancePrediction(input: { impressions: number; clicks: number }) {
  const ctr = input.impressions > 0 ? (input.clicks / input.impressions) * 100 : 0;
  return `Campaign prediction: current CTR is ${ctr.toFixed(1)}%, which projects ${ctr >= 3 ? "healthy sponsor performance" : "a need for stronger creative and call-to-action refinement"}.`;
}

export async function getFuturePremiumProfile(): Promise<FuturePremiumProfile> {
  if (!auth?.currentUser || !db) {
    return { advancedFutureOps: {} };
  }

  const snapshot = await getDocs(query(collection(db, "futurePremiumProfiles"), limit(20)));
  const own = snapshot.docs.find((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    if (docSnapshot.id === auth.currentUser?.uid) {
      return true;
    }

    const data = docSnapshot.data() as Record<string, unknown>;
    return String(data.userId ?? "") === auth.currentUser?.uid;
  });
  const data = own ? (own.data() as Record<string, unknown>) : {};
  const advancedFutureOps = (data.advancedFutureOps as Record<string, unknown> | undefined) ?? {};

  return {
    advancedFutureOps: Object.fromEntries(
      Object.entries(advancedFutureOps).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [],
      ])
    ),
  };
}

export async function saveFuturePremiumProfile(input: FuturePremiumProfile) {
  const user = requireUser();
  await setDoc(
    doc(db!, "futurePremiumProfiles", user.uid),
    {
      userId: user.uid,
      advancedFutureOps: Object.fromEntries(
        Object.entries(input.advancedFutureOps).map(([key, value]) => [
          key,
          (value ?? []).map((item) => item.trim()).filter(Boolean),
        ])
      ),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function buildRosterBalanceInsight(input: { roleCounts: Record<string, number> }) {
  const entries = Object.entries(input.roleCounts).sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  const bottom = entries[entries.length - 1];
  if (!top || !bottom) {
    return "Roster balance insight unavailable until role counts are added.";
  }
  return `Roster balance insight: ${top[0]} is your deepest group, while ${bottom[0]} looks thinnest. Shift recruiting and development toward the thinner rotation lane.`;
}

export function buildSeasonRecapStory(input: { seasonLabel: string; wins: number; losses: number; highlight: string }) {
  return `${input.seasonLabel}: finished ${input.wins}-${input.losses}, with the season defined by ${input.highlight || "steady growth, resilient team culture, and late-season momentum"}.`;
}

export function saveOfflineDraft(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`hooplink_offline_${key}`, value);
}

export function loadOfflineDraft(key: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(`hooplink_offline_${key}`) ?? "";
}
