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
import { getEventDiscovery, type EventDiscoveryRecord } from "@/lib/phase5";
import { getOrganizationTeams, type TeamRecord } from "@/lib/teams";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";

type FirestoreTimestamp = { seconds?: number; nanoseconds?: number } | null;

export interface AdvisorDirectoryEntry {
  uid: string;
  displayName: string;
  roleLabel: string;
  sport: string;
  location: string;
  verified: boolean;
  expertise: string[];
}

export interface ComplianceAlertRecord {
  id: string;
  teamId: string;
  title: string;
  severity: "low" | "medium" | "high";
  details: string;
  createdBy: string;
  createdAt?: FirestoreTimestamp;
}

export interface RosterCapWarning {
  teamId: string;
  teamName: string;
  currentRosterSize: number;
  rosterCap: number;
  status: "safe" | "approaching" | "over";
}

export interface ScholarshipBudgetRecord {
  id: string;
  teamId: string;
  teamName: string;
  totalBudget: number;
  committedBudget: number;
  remainingBudget: number;
  updatedAt?: FirestoreTimestamp;
}

export interface RosterNeedRecord {
  id: string;
  teamId: string;
  programName: string;
  position: string;
  classYear: string;
  priority: "low" | "medium" | "high";
  notes: string;
  createdAt?: FirestoreTimestamp;
}

export interface PositionDemandRecord {
  position: string;
  openRoles: number;
  highPriorityRoles: number;
}

export interface ShowcasePerformanceBadgeRecord {
  id: string;
  eventId: string;
  athleteName: string;
  badge: string;
  notes: string;
  awardedBy: string;
  createdAt?: FirestoreTimestamp;
}

export interface JudgePanelRecord {
  id: string;
  eventId: string;
  title: string;
  criteria: string[];
  createdBy: string;
  createdAt?: FirestoreTimestamp;
}

export interface CampDrillStationRecord {
  id: string;
  teamId: string;
  eventId: string;
  name: string;
  focusArea: string;
  coachName: string;
  createdAt?: FirestoreTimestamp;
}

export interface StaffShiftRecord {
  id: string;
  eventId: string;
  role: string;
  assigneeName: string;
  startsAt: string;
  endsAt: string;
  createdAt?: FirestoreTimestamp;
}

export interface VolunteerRegistrationRecord {
  id: string;
  eventId: string;
  name: string;
  role: string;
  availability: string;
  createdAt?: FirestoreTimestamp;
}

export interface SponsorBoothRecord {
  id: string;
  eventId: string;
  sponsorName: string;
  boothLabel: string;
  contactName: string;
  createdAt?: FirestoreTimestamp;
}

export interface VendorApplicationRecord {
  id: string;
  eventId: string;
  businessName: string;
  category: string;
  contactEmail: string;
  status: "pending" | "approved" | "declined";
  createdAt?: FirestoreTimestamp;
}

export interface LocalBusinessSponsorshipRecord {
  id: string;
  businessName: string;
  city: string;
  offerType: string;
  budgetLabel: string;
  status: "lead" | "active" | "closed";
  createdAt?: FirestoreTimestamp;
}

export interface SponsorLeadRecord {
  id: string;
  brandName: string;
  stage: "new" | "contacted" | "proposal" | "won" | "lost";
  valueLabel: string;
  ownerName: string;
  createdAt?: FirestoreTimestamp;
}

export interface OutreachCallLogRecord {
  id: string;
  contactName: string;
  organization: string;
  summary: string;
  nextStep: string;
  createdAt?: FirestoreTimestamp;
}

export interface RevenueSplitRecord {
  id: string;
  campaignTitle: string;
  creatorName: string;
  partnerName: string;
  creatorPercent: number;
  partnerPercent: number;
  createdAt?: FirestoreTimestamp;
}

export interface EquipmentSponsorApplicationRecord {
  id: string;
  brandName: string;
  equipmentType: string;
  askSummary: string;
  status: "draft" | "submitted" | "review" | "approved";
  createdAt?: FirestoreTimestamp;
}

export interface GrantTrackerRecord {
  id: string;
  programName: string;
  amountLabel: string;
  dueDate: string;
  status: "research" | "drafting" | "submitted" | "awarded";
  createdAt?: FirestoreTimestamp;
}

export interface NonprofitPartnerRecord {
  id: string;
  name: string;
  mission: string;
  city: string;
  programFocus: string;
  createdAt?: FirestoreTimestamp;
}

function requireAuth() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
  return auth.currentUser;
}

function mapTimestamp(value: unknown): FirestoreTimestamp {
  return (value as FirestoreTimestamp | undefined) ?? null;
}

function mapDocs<T>(
  snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> },
  mapper: (id: string, data: Record<string, unknown>) => T
) {
  return snapshot.docs.map((docSnapshot) => mapper(docSnapshot.id, docSnapshot.data()));
}

async function getOrderedCollection<T>(
  collectionName: string,
  mapper: (id: string, data: Record<string, unknown>) => T
) {
  if (!db) {
    return [] as T[];
  }

  const snapshot = await getDocs(
    query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(50))
  );
  return mapDocs(snapshot, mapper);
}

export async function getAdvisorDirectory() {
  const profiles = await searchProfiles("");
  return profiles
    .filter((profile: SearchProfile) => {
      const type = String(profile.role?.type ?? "").toLowerCase();
      return type === "coach" || type === "scout" || type === "trainer";
    })
    .map((profile: SearchProfile) => ({
      uid: profile.uid,
      displayName: profile.displayName,
      roleLabel: profile.role?.type ?? "advisor",
      sport: profile.role?.sport ?? "",
      location: profile.location ?? "",
      verified: Boolean(profile.verified),
      expertise: [
        profile.role?.position ?? "",
        profile.role?.team ?? "",
        profile.role?.bio ?? "",
      ].filter(Boolean),
    })) satisfies AdvisorDirectoryEntry[];
}

export async function getComplianceAlerts() {
  return getOrderedCollection("phase4ComplianceAlerts", (id, data) => ({
    id,
    teamId: String(data.teamId ?? ""),
    title: String(data.title ?? ""),
    severity:
      data.severity === "low" || data.severity === "high" ? data.severity : "medium",
    details: String(data.details ?? ""),
    createdBy: String(data.createdBy ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<ComplianceAlertRecord[]>;
}

export async function createComplianceAlert(input: {
  teamId: string;
  title: string;
  severity: ComplianceAlertRecord["severity"];
  details: string;
}) {
  const user = requireAuth();
  await addDoc(collection(db!, "phase4ComplianceAlerts"), {
    teamId: input.teamId,
    title: input.title.trim(),
    severity: input.severity,
    details: input.details.trim(),
    createdBy: user.displayName || user.email || user.uid,
    createdAt: serverTimestamp(),
  });
}

export async function getRosterCapWarnings() {
  const teams = await getOrganizationTeams().catch(() => [] as TeamRecord[]);
  return teams.map((team: TeamRecord) => {
    const rosterCap = team.sport.toLowerCase().includes("basketball") ? 15 : 25;
    const currentRosterSize = team.memberIds.length;
    const ratio = currentRosterSize / rosterCap;
    return {
      teamId: team.id,
      teamName: team.name,
      currentRosterSize,
      rosterCap,
      status: ratio > 1 ? "over" : ratio >= 0.8 ? "approaching" : "safe",
    } satisfies RosterCapWarning;
  });
}

export async function getScholarshipBudgets() {
  const teams = await getOrganizationTeams().catch(() => [] as TeamRecord[]);
  const snapshot = db
    ? await getDocs(query(collection(db, "phase4ScholarshipBudgets"), limit(50)))
    : null;
  const stored = snapshot
    ? Object.fromEntries(
        snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => [
          docSnapshot.data().teamId as string,
          { id: docSnapshot.id, ...docSnapshot.data() },
        ])
      )
    : {};

  return teams.map((team: TeamRecord) => {
    const record = stored[team.id] as Record<string, unknown> | undefined;
    const totalBudget = Number(record?.totalBudget ?? 100000);
    const committedBudget = Number(record?.committedBudget ?? Math.min(totalBudget, team.memberIds.length * 4500));
    return {
      id: String(record?.id ?? team.id),
      teamId: team.id,
      teamName: team.name,
      totalBudget,
      committedBudget,
      remainingBudget: Number(record?.remainingBudget ?? Math.max(totalBudget - committedBudget, 0)),
      updatedAt: mapTimestamp(record?.updatedAt),
    } satisfies ScholarshipBudgetRecord;
  });
}

export async function saveScholarshipBudget(input: {
  teamId: string;
  totalBudget: number;
  committedBudget: number;
}) {
  requireAuth();
  const teams = await getOrganizationTeams().catch(() => [] as TeamRecord[]);
  const team = teams.find((entry: TeamRecord) => entry.id === input.teamId);
  await addDoc(collection(db!, "phase4ScholarshipBudgets"), {
    teamId: input.teamId,
    teamName: team?.name ?? "Program",
    totalBudget: input.totalBudget,
    committedBudget: input.committedBudget,
    remainingBudget: Math.max(input.totalBudget - input.committedBudget, 0),
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function getCollegeRosterNeeds() {
  return getOrderedCollection("phase4RosterNeeds", (id, data) => ({
    id,
    teamId: String(data.teamId ?? ""),
    programName: String(data.programName ?? ""),
    position: String(data.position ?? ""),
    classYear: String(data.classYear ?? ""),
    priority:
      data.priority === "low" || data.priority === "medium" ? data.priority : "high",
    notes: String(data.notes ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<RosterNeedRecord[]>;
}

export async function createRosterNeed(input: {
  teamId: string;
  programName: string;
  position: string;
  classYear: string;
  priority: RosterNeedRecord["priority"];
  notes: string;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4RosterNeeds"), {
    ...input,
    programName: input.programName.trim(),
    position: input.position.trim(),
    classYear: input.classYear.trim(),
    notes: input.notes.trim(),
    createdAt: serverTimestamp(),
  });
}

export function getPositionDemandHeatmap(needs: RosterNeedRecord[]) {
  const buckets = new Map<string, PositionDemandRecord>();
  needs.forEach((need) => {
    const key = need.position || "unknown";
    const existing = buckets.get(key) ?? { position: key, openRoles: 0, highPriorityRoles: 0 };
    existing.openRoles += 1;
    if (need.priority === "high") {
      existing.highPriorityRoles += 1;
    }
    buckets.set(key, existing);
  });
  return Array.from(buckets.values()).sort((left, right) => right.openRoles - left.openRoles);
}

export async function getShowcasePerformanceBadges() {
  return getOrderedCollection("phase4ShowcaseBadges", (id, data) => ({
    id,
    eventId: String(data.eventId ?? ""),
    athleteName: String(data.athleteName ?? ""),
    badge: String(data.badge ?? ""),
    notes: String(data.notes ?? ""),
    awardedBy: String(data.awardedBy ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<ShowcasePerformanceBadgeRecord[]>;
}

export async function awardShowcaseBadge(input: {
  eventId: string;
  athleteName: string;
  badge: string;
  notes: string;
}) {
  const user = requireAuth();
  await addDoc(collection(db!, "phase4ShowcaseBadges"), {
    eventId: input.eventId,
    athleteName: input.athleteName.trim(),
    badge: input.badge.trim(),
    notes: input.notes.trim(),
    awardedBy: user.displayName || user.email || user.uid,
    createdAt: serverTimestamp(),
  });
}

export async function getJudgePanels() {
  return getOrderedCollection("phase4JudgePanels", (id, data) => ({
    id,
    eventId: String(data.eventId ?? ""),
    title: String(data.title ?? ""),
    criteria: Array.isArray(data.criteria) ? data.criteria.map(String) : [],
    createdBy: String(data.createdBy ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<JudgePanelRecord[]>;
}

export async function createJudgePanel(input: { eventId: string; title: string; criteria: string[] }) {
  const user = requireAuth();
  await addDoc(collection(db!, "phase4JudgePanels"), {
    eventId: input.eventId,
    title: input.title.trim(),
    criteria: input.criteria.filter(Boolean),
    createdBy: user.displayName || user.email || user.uid,
    createdAt: serverTimestamp(),
  });
}

export async function getCampDrillStations() {
  return getOrderedCollection("phase4CampDrillStations", (id, data) => ({
    id,
    teamId: String(data.teamId ?? ""),
    eventId: String(data.eventId ?? ""),
    name: String(data.name ?? ""),
    focusArea: String(data.focusArea ?? ""),
    coachName: String(data.coachName ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<CampDrillStationRecord[]>;
}

export async function createCampDrillStation(input: {
  teamId: string;
  eventId: string;
  name: string;
  focusArea: string;
  coachName: string;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4CampDrillStations"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getStaffShifts() {
  return getOrderedCollection("phase4StaffShifts", (id, data) => ({
    id,
    eventId: String(data.eventId ?? ""),
    role: String(data.role ?? ""),
    assigneeName: String(data.assigneeName ?? ""),
    startsAt: String(data.startsAt ?? ""),
    endsAt: String(data.endsAt ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<StaffShiftRecord[]>;
}

export async function assignStaffShift(input: {
  eventId: string;
  role: string;
  assigneeName: string;
  startsAt: string;
  endsAt: string;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4StaffShifts"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getVolunteerRegistrations() {
  return getOrderedCollection("phase4Volunteers", (id, data) => ({
    id,
    eventId: String(data.eventId ?? ""),
    name: String(data.name ?? ""),
    role: String(data.role ?? ""),
    availability: String(data.availability ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<VolunteerRegistrationRecord[]>;
}

export async function registerVolunteer(input: {
  eventId: string;
  name: string;
  role: string;
  availability: string;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4Volunteers"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getSponsorBooths() {
  return getOrderedCollection("phase4SponsorBooths", (id, data) => ({
    id,
    eventId: String(data.eventId ?? ""),
    sponsorName: String(data.sponsorName ?? ""),
    boothLabel: String(data.boothLabel ?? ""),
    contactName: String(data.contactName ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<SponsorBoothRecord[]>;
}

export async function addSponsorBooth(input: {
  eventId: string;
  sponsorName: string;
  boothLabel: string;
  contactName: string;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4SponsorBooths"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getVendorApplications() {
  return getOrderedCollection("phase4VendorApplications", (id, data) => ({
    id,
    eventId: String(data.eventId ?? ""),
    businessName: String(data.businessName ?? ""),
    category: String(data.category ?? ""),
    contactEmail: String(data.contactEmail ?? ""),
    status:
      data.status === "approved" || data.status === "declined" ? data.status : "pending",
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<VendorApplicationRecord[]>;
}

export async function submitVendorApplication(input: {
  eventId: string;
  businessName: string;
  category: string;
  contactEmail: string;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4VendorApplications"), {
    ...input,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getLocalBusinessSponsorships() {
  return getOrderedCollection("phase4LocalSponsorships", (id, data) => ({
    id,
    businessName: String(data.businessName ?? ""),
    city: String(data.city ?? ""),
    offerType: String(data.offerType ?? ""),
    budgetLabel: String(data.budgetLabel ?? ""),
    status:
      data.status === "active" || data.status === "closed" ? data.status : "lead",
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<LocalBusinessSponsorshipRecord[]>;
}

export async function createLocalBusinessSponsorship(input: {
  businessName: string;
  city: string;
  offerType: string;
  budgetLabel: string;
  status: LocalBusinessSponsorshipRecord["status"];
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4LocalSponsorships"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getSponsorLeads() {
  return getOrderedCollection("phase4SponsorLeads", (id, data) => ({
    id,
    brandName: String(data.brandName ?? ""),
    stage:
      data.stage === "contacted" ||
      data.stage === "proposal" ||
      data.stage === "won" ||
      data.stage === "lost"
        ? data.stage
        : "new",
    valueLabel: String(data.valueLabel ?? ""),
    ownerName: String(data.ownerName ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<SponsorLeadRecord[]>;
}

export async function createSponsorLead(input: {
  brandName: string;
  stage: SponsorLeadRecord["stage"];
  valueLabel: string;
  ownerName: string;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4SponsorLeads"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getOutreachCallLogs() {
  return getOrderedCollection("phase4OutreachCallLogs", (id, data) => ({
    id,
    contactName: String(data.contactName ?? ""),
    organization: String(data.organization ?? ""),
    summary: String(data.summary ?? ""),
    nextStep: String(data.nextStep ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<OutreachCallLogRecord[]>;
}

export async function logOutreachCall(input: {
  contactName: string;
  organization: string;
  summary: string;
  nextStep: string;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4OutreachCallLogs"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getRevenueSplits() {
  return getOrderedCollection("phase4RevenueSplits", (id, data) => ({
    id,
    campaignTitle: String(data.campaignTitle ?? ""),
    creatorName: String(data.creatorName ?? ""),
    partnerName: String(data.partnerName ?? ""),
    creatorPercent: Number(data.creatorPercent ?? 50),
    partnerPercent: Number(data.partnerPercent ?? 50),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<RevenueSplitRecord[]>;
}

export async function saveRevenueSplit(input: {
  campaignTitle: string;
  creatorName: string;
  partnerName: string;
  creatorPercent: number;
  partnerPercent: number;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4RevenueSplits"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getEquipmentSponsorApplications() {
  return getOrderedCollection("phase4EquipmentApplications", (id, data) => ({
    id,
    brandName: String(data.brandName ?? ""),
    equipmentType: String(data.equipmentType ?? ""),
    askSummary: String(data.askSummary ?? ""),
    status:
      data.status === "submitted" || data.status === "review" || data.status === "approved"
        ? data.status
        : "draft",
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<EquipmentSponsorApplicationRecord[]>;
}

export async function submitEquipmentSponsorApplication(input: {
  brandName: string;
  equipmentType: string;
  askSummary: string;
  status: EquipmentSponsorApplicationRecord["status"];
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4EquipmentApplications"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getGrantTrackers() {
  return getOrderedCollection("phase4GrantTrackers", (id, data) => ({
    id,
    programName: String(data.programName ?? ""),
    amountLabel: String(data.amountLabel ?? ""),
    dueDate: String(data.dueDate ?? ""),
    status:
      data.status === "drafting" || data.status === "submitted" || data.status === "awarded"
        ? data.status
        : "research",
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<GrantTrackerRecord[]>;
}

export async function saveGrantTracker(input: {
  programName: string;
  amountLabel: string;
  dueDate: string;
  status: GrantTrackerRecord["status"];
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4GrantTrackers"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getNonprofitPartners() {
  return getOrderedCollection("phase4NonprofitPartners", (id, data) => ({
    id,
    name: String(data.name ?? ""),
    mission: String(data.mission ?? ""),
    city: String(data.city ?? ""),
    programFocus: String(data.programFocus ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  })) as Promise<NonprofitPartnerRecord[]>;
}

export async function saveNonprofitPartner(input: {
  name: string;
  mission: string;
  city: string;
  programFocus: string;
}) {
  requireAuth();
  await addDoc(collection(db!, "phase4NonprofitPartners"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getPhase4Events() {
  return getEventDiscovery("");
}

export async function getEventOptions() {
  const events = await getPhase4Events();
  return events.map((event) => ({
    id: event.id,
    label: [event.title, event.city || event.location, event.date].filter(Boolean).join(" • "),
  }));
}

export async function getTeamOptions() {
  const teams = await getOrganizationTeams().catch(() => [] as TeamRecord[]);
  return teams.map((team: TeamRecord) => ({
    id: team.id,
    label: [team.name, team.sport, team.location].filter(Boolean).join(" • "),
  }));
}

export function getVendorPipelineSummary(applications: VendorApplicationRecord[]) {
  return {
    pending: applications.filter((item) => item.status === "pending").length,
    approved: applications.filter((item) => item.status === "approved").length,
    declined: applications.filter((item) => item.status === "declined").length,
  };
}

export function getLeadPipelineSummary(leads: SponsorLeadRecord[]) {
  return {
    open: leads.filter((item) => item.stage === "new" || item.stage === "contacted").length,
    proposal: leads.filter((item) => item.stage === "proposal").length,
    won: leads.filter((item) => item.stage === "won").length,
  };
}

export function getNonprofitCoverage(partners: NonprofitPartnerRecord[]) {
  const cities = new Set(partners.map((partner) => partner.city).filter(Boolean));
  return {
    partners: partners.length,
    cities: cities.size,
  };
}
