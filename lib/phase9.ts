import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type ListenerCleanup = () => void;

function requireUser() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
  return auth.currentUser;
}

function mapTime(value: unknown) {
  return (value as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null;
}

export interface PlatformPreferences {
  language: string;
  dmTranslationLanguage: string;
  autoTranslateDms: boolean;
  timezone: string;
  accessibilityPreset: "default" | "focused" | "accessible";
  highContrast: boolean;
  advancedPlatformOps: Record<string, string[]>;
}

export interface SchoolAdminAccountRecord {
  id: string;
  schoolName: string;
  contactEmail: string;
  region: string;
  status: "pending" | "approved";
}

export interface CoachVerificationRecord {
  id: string;
  coachName: string;
  organization: string;
  status: "pending" | "verified";
}

export interface WhiteLabelPortalRecord {
  id: string;
  orgName: string;
  themeName: string;
  accentColor: string;
  customDomain: string;
}

export interface PartnerApiKeyRecord {
  id: string;
  label: string;
  scope: string;
  preview: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface WebhookRecord {
  id: string;
  label: string;
  url: string;
  eventType: string;
  active: boolean;
}

export interface IntegrationRecord {
  id: string;
  type: "zapier" | "make" | "crm" | "google_calendar";
  label: string;
  config: string;
  active: boolean;
}

export interface OrgStaffDirectoryRecord {
  id: string;
  orgName: string;
  memberName: string;
  title: string;
  region: string;
  timezone: string;
}

export interface OrgNoteRecord {
  id: string;
  orgId: string;
  note: string;
  createdBy: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface BulkImportJobRecord {
  id: string;
  teamId: string;
  rows: Array<{ name: string; email: string; role: string }>;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface ReleaseNoteRecord {
  id: string;
  version: string;
  title: string;
  summary: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

const DEFAULT_RELEASE_NOTES: ReleaseNoteRecord[] = [
  { id: "v1", version: "1.0", title: "Platform Expansion", summary: "Org tools, integrations, accessibility controls, and release center are now live." },
  { id: "v0.9", version: "0.9", title: "Security Layer", summary: "Security, compliance, moderation, and trust tools were expanded for staff operations." },
];

export async function getPlatformPreferences() {
  if (!auth?.currentUser || !db) {
    return {
      language: "en",
      dmTranslationLanguage: "en",
      autoTranslateDms: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      accessibilityPreset: "default",
      highContrast: false,
      advancedPlatformOps: {},
    } satisfies PlatformPreferences;
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const platform = (data.platform as Record<string, unknown> | undefined) ?? {};
  const advancedPlatformOps = (platform.advancedPlatformOps as Record<string, unknown> | undefined) ?? {};
  return {
    language: String(platform.language ?? "en"),
    dmTranslationLanguage: String(platform.dmTranslationLanguage ?? "en"),
    autoTranslateDms: platform.autoTranslateDms === true,
    timezone: String(platform.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"),
    accessibilityPreset:
      platform.accessibilityPreset === "focused" || platform.accessibilityPreset === "accessible"
        ? platform.accessibilityPreset
        : "default",
    highContrast: platform.highContrast === true,
    advancedPlatformOps: Object.fromEntries(
      Object.entries(advancedPlatformOps).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [],
      ])
    ),
  } satisfies PlatformPreferences;
}

export async function updatePlatformPreferences(input: PlatformPreferences) {
  const user = requireUser();
  await setDoc(
    doc(db!, "users", user.uid),
    {
      platform: {
        language: input.language.trim() || "en",
        dmTranslationLanguage: input.dmTranslationLanguage.trim() || "en",
        autoTranslateDms: input.autoTranslateDms,
        timezone: input.timezone.trim() || "UTC",
        accessibilityPreset: input.accessibilityPreset,
        highContrast: input.highContrast,
        advancedPlatformOps: Object.fromEntries(
          Object.entries(input.advancedPlatformOps ?? {}).map(([key, value]) => [
            key,
            (value ?? []).map((item) => item.trim()).filter(Boolean),
          ])
        ),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function applyHighContrastPreference(enabled: boolean) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("theme-high-contrast", enabled);
  window.localStorage.setItem("hooplink_high_contrast", enabled ? "1" : "0");
}

export async function createSchoolAdminAccount(input: { schoolName: string; contactEmail: string; region: string }) {
  requireUser();
  await addDoc(collection(db!, "schoolAdminAccounts"), {
    schoolName: input.schoolName.trim(),
    contactEmail: input.contactEmail.trim(),
    region: input.region.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getSchoolAdminAccounts() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "schoolAdminAccounts"), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      schoolName: String(data.schoolName ?? ""),
      contactEmail: String(data.contactEmail ?? ""),
      region: String(data.region ?? ""),
      status: data.status === "approved" ? "approved" : "pending",
    } satisfies SchoolAdminAccountRecord;
  });
}

export async function createCoachVerification(input: { coachName: string; organization: string }) {
  requireUser();
  await addDoc(collection(db!, "coachVerifications"), {
    coachName: input.coachName.trim(),
    organization: input.organization.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getCoachVerifications() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "coachVerifications"), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      coachName: String(data.coachName ?? ""),
      organization: String(data.organization ?? ""),
      status: data.status === "verified" ? "verified" : "pending",
    } satisfies CoachVerificationRecord;
  });
}

export async function saveWhiteLabelPortal(input: { orgName: string; themeName: string; accentColor: string; customDomain: string }) {
  requireUser();
  await setDoc(doc(db!, "whiteLabelPortals", input.orgName.trim().toLowerCase().replace(/\s+/g, "-") || "org"), {
    orgName: input.orgName.trim(),
    themeName: input.themeName.trim() || "Classic",
    accentColor: input.accentColor.trim() || "#111827",
    customDomain: input.customDomain.trim(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getWhiteLabelPortals() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "whiteLabelPortals"), limit(20)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      orgName: String(data.orgName ?? ""),
      themeName: String(data.themeName ?? ""),
      accentColor: String(data.accentColor ?? "#111827"),
      customDomain: String(data.customDomain ?? ""),
    } satisfies WhiteLabelPortalRecord;
  });
}

export async function createPartnerApiKey(label: string, scope: string) {
  requireUser();
  const raw = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const preview = `hl_${raw.slice(0, 4)}...${raw.slice(-4)}`;
  await addDoc(collection(db!, "partnerApiKeys"), {
    label: label.trim(),
    scope: scope.trim() || "read",
    preview,
    createdAt: serverTimestamp(),
  });
}

export async function getPartnerApiKeys() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "partnerApiKeys"), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      label: String(data.label ?? ""),
      scope: String(data.scope ?? ""),
      preview: String(data.preview ?? ""),
      createdAt: mapTime(data.createdAt),
    } satisfies PartnerApiKeyRecord;
  });
}

export async function saveWebhook(input: { label: string; url: string; eventType: string; active: boolean }) {
  requireUser();
  await addDoc(collection(db!, "orgWebhooks"), {
    label: input.label.trim(),
    url: input.url.trim(),
    eventType: input.eventType.trim(),
    active: input.active,
    createdAt: serverTimestamp(),
  });
}

export async function getWebhooks() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "orgWebhooks"), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      label: String(data.label ?? ""),
      url: String(data.url ?? ""),
      eventType: String(data.eventType ?? ""),
      active: data.active !== false,
    } satisfies WebhookRecord;
  });
}

export async function saveIntegration(input: { type: IntegrationRecord["type"]; label: string; config: string; active: boolean }) {
  requireUser();
  await addDoc(collection(db!, "platformIntegrations"), {
    type: input.type,
    label: input.label.trim(),
    config: input.config.trim(),
    active: input.active,
    createdAt: serverTimestamp(),
  });
}

export async function getIntegrations() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "platformIntegrations"), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      type: (String(data.type ?? "zapier") as IntegrationRecord["type"]),
      label: String(data.label ?? ""),
      config: String(data.config ?? ""),
      active: data.active !== false,
    } satisfies IntegrationRecord;
  });
}

export async function addOrgStaffDirectoryEntry(input: { orgName: string; memberName: string; title: string; region: string; timezone: string }) {
  requireUser();
  await addDoc(collection(db!, "orgStaffDirectory"), {
    orgName: input.orgName.trim(),
    memberName: input.memberName.trim(),
    title: input.title.trim(),
    region: input.region.trim(),
    timezone: input.timezone.trim() || "UTC",
    createdAt: serverTimestamp(),
  });
}

export async function getOrgStaffDirectory() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "orgStaffDirectory"), orderBy("createdAt", "desc"), limit(100)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      orgName: String(data.orgName ?? ""),
      memberName: String(data.memberName ?? ""),
      title: String(data.title ?? ""),
      region: String(data.region ?? ""),
      timezone: String(data.timezone ?? "UTC"),
    } satisfies OrgStaffDirectoryRecord;
  });
}

export async function addOrgNote(orgId: string, note: string) {
  const user = requireUser();
  await addDoc(collection(db!, "orgNotes"), {
    orgId,
    note: note.trim(),
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToOrgNotes(orgId: string, callback: (notes: OrgNoteRecord[]) => void): ListenerCleanup {
  if (!db || !orgId.trim()) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(query(collection(db, "orgNotes"), where("orgId", "==", orgId), orderBy("createdAt", "desc"), limit(50)), (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
    callback(snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        orgId: String(data.orgId ?? ""),
        note: String(data.note ?? ""),
        createdBy: String(data.createdBy ?? ""),
        createdAt: mapTime(data.createdAt),
      } satisfies OrgNoteRecord;
    }));
  });
}

export async function savePaidOrgTools(input: { orgId: string; tools: string[] }) {
  requireUser();
  await setDoc(doc(db!, "paidOrgTools", input.orgId.trim() || "default-org"), {
    orgId: input.orgId.trim() || "default-org",
    tools: input.tools,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getPaidOrgTools(orgId: string) {
  if (!db || !orgId.trim()) return [];
  const snapshot = await getDoc(doc(db, "paidOrgTools", orgId.trim()));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  return Array.isArray(data.tools) ? (data.tools as string[]) : [];
}

export async function createBulkImportJob(teamId: string, csvText: string) {
  requireUser();
  const rows = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, email, role] = line.split(",").map((value) => value.trim());
      return { name: name || "", email: email || "", role: role || "player" };
    });
  await addDoc(collection(db!, "bulkImportJobs"), {
    teamId: teamId.trim(),
    rows,
    createdAt: serverTimestamp(),
  });
}

export async function getBulkImportJobs() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "bulkImportJobs"), orderBy("createdAt", "desc"), limit(20)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      teamId: String(data.teamId ?? ""),
      rows: Array.isArray(data.rows) ? (data.rows as BulkImportJobRecord["rows"]) : [],
      createdAt: mapTime(data.createdAt),
    } satisfies BulkImportJobRecord;
  });
}

export async function createReleaseNote(input: { version: string; title: string; summary: string }) {
  requireUser();
  await addDoc(collection(db!, "releaseNotes"), {
    version: input.version.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getReleaseNotes() {
  if (!db) return DEFAULT_RELEASE_NOTES;
  const snapshot = await getDocs(query(collection(db, "releaseNotes"), orderBy("createdAt", "desc"), limit(20)));
  if (snapshot.empty) {
    return DEFAULT_RELEASE_NOTES;
  }
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      version: String(data.version ?? ""),
      title: String(data.title ?? ""),
      summary: String(data.summary ?? ""),
      createdAt: mapTime(data.createdAt),
    } satisfies ReleaseNoteRecord;
  });
}

export function getRegionFromLocation(location?: string | null) {
  const value = (location ?? "").toLowerCase();
  if (!value) return "Global";
  if (value.includes("europe") || value.includes("uk") || value.includes("france") || value.includes("germany")) return "Europe";
  if (value.includes("asia") || value.includes("japan") || value.includes("china") || value.includes("india")) return "Asia";
  if (value.includes("africa") || value.includes("egypt") || value.includes("libya") || value.includes("nigeria")) return "Africa";
  if (value.includes("canada") || value.includes("usa") || value.includes("united states") || value.includes("new york")) return "North America";
  if (value.includes("brazil") || value.includes("argentina") || value.includes("south america")) return "South America";
  if (value.includes("australia") || value.includes("new zealand") || value.includes("oceania")) return "Oceania";
  return "Global";
}

export const REGION_TABS = ["All", "North America", "Europe", "Asia", "Africa", "South America", "Oceania"] as const;

export function translateMessagePreview(text: string, language: string) {
  if (!text.trim()) return "";
  const normalized = language.trim().toLowerCase();
  if (normalized === "en") {
    return text;
  }
  return `[${normalized}] ${text}`;
}

export function buildGoogleCalendarLink(input: { title: string; details: string; location: string; start: string; end: string }) {
  const toCalendarDate = (value: string) => value.replace(/[-:]/g, "").replace(".000Z", "Z");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(input.title)}&details=${encodeURIComponent(input.details)}&location=${encodeURIComponent(input.location)}&dates=${toCalendarDate(input.start)}/${toCalendarDate(input.end)}`;
}

export function buildAppleCalendarIcs(input: { title: string; details: string; location: string; start: string; end: string }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${input.title}`,
    `DESCRIPTION:${input.details}`,
    `LOCATION:${input.location}`,
    `DTSTART:${input.start.replace(/[-:]/g, "").replace(".000Z", "Z")}`,
    `DTEND:${input.end.replace(/[-:]/g, "").replace(".000Z", "Z")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
}
