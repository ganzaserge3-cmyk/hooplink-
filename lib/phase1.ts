import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
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

export interface OutreachSequenceRecord {
  id: string;
  label: string;
  recipientType: string;
  steps: string[];
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface PressReleaseRecord {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface MediaRequestRecord {
  id: string;
  requesterName: string;
  outlet: string;
  angle: string;
  status: "open" | "approved" | "closed";
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface JournalistRecord {
  id: string;
  name: string;
  outlet: string;
  beat: string;
  verified: boolean;
}

export interface SponsorCampaignInsightRecord {
  id: string;
  label: string;
  impressions: number;
  clicks: number;
  conversions: number;
  estimatedRevenue: number;
}

export interface DailyDigestRecord {
  id: string;
  headline: string;
  summary: string;
  topic: string;
}

export interface EventRecapRecord {
  id: string;
  title: string;
  summary: string;
  standout: string;
}

export async function saveOutreachSequence(input: { label: string; recipientType: string; steps: string[] }) {
  requireUser();
  await addDoc(collection(db!, "outreachSequences"), {
    label: input.label.trim(),
    recipientType: input.recipientType.trim(),
    steps: input.steps,
    createdAt: serverTimestamp(),
  });
}

export async function getOutreachSequences() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "outreachSequences"), orderBy("createdAt", "desc"), limit(20)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      label: String(data.label ?? ""),
      recipientType: String(data.recipientType ?? ""),
      steps: Array.isArray(data.steps) ? (data.steps as string[]) : [],
      createdAt: mapTime(data.createdAt),
    } satisfies OutreachSequenceRecord;
  });
}

export async function savePressRelease(input: { title: string; body: string; audience: string }) {
  requireUser();
  await addDoc(collection(db!, "pressReleases"), {
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getPressReleases() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "pressReleases"), orderBy("createdAt", "desc"), limit(20)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      title: String(data.title ?? ""),
      body: String(data.body ?? ""),
      audience: String(data.audience ?? ""),
      createdAt: mapTime(data.createdAt),
    } satisfies PressReleaseRecord;
  });
}

export async function saveMediaRequest(input: { requesterName: string; outlet: string; angle: string }) {
  requireUser();
  await addDoc(collection(db!, "mediaRequests"), {
    requesterName: input.requesterName.trim(),
    outlet: input.outlet.trim(),
    angle: input.angle.trim(),
    status: "open",
    createdAt: serverTimestamp(),
  });
}

export async function getMediaRequests() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "mediaRequests"), orderBy("createdAt", "desc"), limit(20)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      requesterName: String(data.requesterName ?? ""),
      outlet: String(data.outlet ?? ""),
      angle: String(data.angle ?? ""),
      status: data.status === "approved" || data.status === "closed" ? data.status : "open",
      createdAt: mapTime(data.createdAt),
    } satisfies MediaRequestRecord;
  });
}

export function getVerifiedJournalists() {
  return [
    { id: "j1", name: "Maya Brooks", outlet: "City Sports Daily", beat: "Recruiting and youth hoops", verified: true },
    { id: "j2", name: "Darnell Price", outlet: "Next Level Network", beat: "High school prospects", verified: true },
    { id: "j3", name: "Elena Cruz", outlet: "Courtside Wire", beat: "Women’s basketball and development", verified: true },
  ] satisfies JournalistRecord[];
}

export function getDailyNewsDigest() {
  return [
    { id: "d1", headline: "Recruiters prioritizing two-way wings", summary: "Latest recruiting chatter points to versatile perimeter defenders gaining more early traction.", topic: "recruiting" },
    { id: "d2", headline: "Recovery routines driving consistency", summary: "Teams are leaning harder into sleep, hydration, and travel recovery to sustain late-season form.", topic: "performance" },
    { id: "d3", headline: "Short-form highlight edits still winning attention", summary: "The best performing creator clips are staying tight, clear, and story-driven instead of just flashy.", topic: "media" },
  ] satisfies DailyDigestRecord[];
}

export function buildRecruitingChatReply(input: { question: string; athleteContext: string }) {
  return `Recruiting assistant: based on ${input.athleteContext || "your current profile"}, I would answer "${input.question}" by leading with fit, role clarity, academic readiness, and a concrete development plan. Keep the message concise, show coachability, and finish with one clear next step.`;
}

export function buildCoachInboxSummary(messages: string[]) {
  if (messages.length === 0) {
    return "Inbox summary: no new coaching threads to summarize.";
  }
  return `Inbox summary: ${messages.length} key thread(s). Main themes are ${messages.slice(0, 3).join(", ")}. Highest-priority follow-up is the item that affects training load or recruiting timing first.`;
}

export function buildSchedulingRecommendation(input: { postType: string; audience: string; urgency: string }) {
  return `Scheduling recommendation: publish the ${input.postType || "update"} for ${input.audience || "your audience"} in the next high-attention window, with urgency set to ${input.urgency || "medium"}. Best practice is posting once the visual and caption are ready enough to avoid a rushed first impression.`;
}

export function buildEventRecap(input: { title: string; score: string; standout: string; takeaway: string }) {
  return {
    title: input.title || "Event Recap",
    summary: `${input.title || "This event"} finished ${input.score || "with a strong showing"}, and the main takeaway was ${input.takeaway || "poise, tempo control, and shared effort"}.`,
    standout: input.standout || "Most impactful stretch came from the group’s defensive energy and late execution.",
  } satisfies Omit<EventRecapRecord, "id">;
}

export function buildScoutingPacket(input: { athlete: string; strengths: string; growthAreas: string; projection: string }) {
  return `Scouting packet for ${input.athlete || "prospect"}: strengths include ${input.strengths || "decision-making, effort, and positional versatility"}. Growth areas: ${input.growthAreas || "strength, pace control, and tighter shot selection"}. Projection: ${input.projection || "a coachable long-term fit with upward value if development continues."}`;
}

export function buildPregameBriefing(input: { opponent: string; focus: string; pressurePoint: string }) {
  return `Pregame briefing vs ${input.opponent || "opponent"}: today’s focus is ${input.focus || "starting sharp and winning possession battles"}. Pressure point: ${input.pressurePoint || "shrink the paint early and force secondary creators to finish possessions."}`;
}

export function buildHalftimeAdjustment(input: { issue: string; adjustment: string }) {
  return `Halftime note: current issue is ${input.issue || "letting the pace drift"}. Adjustment: ${input.adjustment || "simplify actions, attack earlier, and tighten help-side communication."}`;
}

export function buildPostgameFilmTasks(input: { themes: string }) {
  return [
    `Film task 1: review ${input.themes || "transition defense"} and tag three clips that show the real problem.`,
    "Film task 2: isolate one possession where the right read was available and explain what unlocked it.",
    "Film task 3: turn the film takeaway into one drill priority for the next session.",
  ];
}

export function buildTeamTendenciesReport(input: { offense: string; defense: string; rebounding: string }) {
  return `Team tendencies: offensively the group leans on ${input.offense || "early actions and downhill pressure"}, defensively it shows ${input.defense || "strong help but occasional late closeouts"}, and on the glass it trends toward ${input.rebounding || "collective effort over one dominant rebounder"}.`;
}

export function buildOpponentCard(input: { name: string; strength: string; weakness: string; note: string }) {
  return {
    title: input.name || "Opponent Card",
    summary: `Strength: ${input.strength || "transition pace"}. Weakness: ${input.weakness || "shot selection under pressure"}.`,
    note: input.note || "Force uncomfortable secondary decisions and stay disciplined after the first action.",
  };
}

export function buildRecruitingFitUpgrade(input: { schoolType: string; style: string; value: string }) {
  return `Recruiting fit upgrade: your strongest lane looks like ${input.schoolType || "development-focused programs"} that value ${input.style || "high-motor, team-first play"} and need ${input.value || "versatility plus dependable habits"}.`;
}

export function buildPressKit(input: { name: string; role: string; achievements: string; links: string }) {
  return `${input.name || "Athlete"} press kit\nRole: ${input.role || "Competitor / Creator"}\nKey achievements: ${input.achievements || "Add achievements here"}\nMedia links: ${input.links || "Add highlight and profile links here"}\nPositioning: present this person as a credible, coachable, audience-ready story with real momentum.`;
}

export function buildBrandPitch(input: { creator: string; audience: string; value: string }) {
  return `Brand pitch: ${input.creator || "This creator"} reaches ${input.audience || "a focused basketball audience"} and delivers ${input.value || "authentic training, recruiting, and performance storytelling"} that brands can attach to with clarity and trust.`;
}

export function getSponsorCampaignInsights() {
  return [
    { id: "s1", label: "Spring Showcase Push", impressions: 18400, clicks: 620, conversions: 42, estimatedRevenue: 2100 },
    { id: "s2", label: "Training Plan Promo", impressions: 9600, clicks: 410, conversions: 28, estimatedRevenue: 1240 },
  ] satisfies SponsorCampaignInsightRecord[];
}

export function buildResponseRateInsight(sent: number, replies: number) {
  const rate = sent > 0 ? Math.round((replies / sent) * 100) : 0;
  return `Recruiter response-rate insight: ${rate}% reply rate across ${sent} outbound touchpoints. Best next move is tightening personalization on the first step if replies are under target.`;
}
