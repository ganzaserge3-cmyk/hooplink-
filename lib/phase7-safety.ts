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
import { getOrganizationTeams, type TeamRecord } from "@/lib/teams";

type FirestoreTimestamp = { seconds?: number; nanoseconds?: number } | null;

export interface CaptainVoteRecord {
  id: string;
  teamId: string;
  nomineeName: string;
  voterName: string;
  reason: string;
  createdAt?: FirestoreTimestamp;
}

export interface LeadershipFeedbackRecord {
  id: string;
  teamId: string;
  subjectName: string;
  reviewerName: string;
  feedback: string;
  score: number;
  createdAt?: FirestoreTimestamp;
}

export interface HarassmentReportRecord {
  id: string;
  teamId: string;
  anonymous: boolean;
  targetName: string;
  summary: string;
  severity: "low" | "medium" | "high";
  createdAt?: FirestoreTimestamp;
}

export interface SafeSportRecord {
  id: string;
  teamId: string;
  requirement: string;
  ownerName: string;
  status: "pending" | "complete";
  createdAt?: FirestoreTimestamp;
}

export interface BackgroundCheckRecord {
  id: string;
  teamId: string;
  staffName: string;
  role: string;
  status: "pending" | "cleared" | "expired";
  createdAt?: FirestoreTimestamp;
}

export interface StaffOnboardingRecord {
  id: string;
  teamId: string;
  staffName: string;
  checklistTitle: string;
  completedSteps: number;
  totalSteps: number;
  createdAt?: FirestoreTimestamp;
}

export interface VolunteerWaiverRecord {
  id: string;
  eventName: string;
  volunteerName: string;
  signed: boolean;
  createdAt?: FirestoreTimestamp;
}

export interface FacilityAccessLogRecord {
  id: string;
  facilityName: string;
  memberName: string;
  action: "check_in" | "check_out";
  createdAt?: FirestoreTimestamp;
}

export interface EquipmentCheckoutRecord {
  id: string;
  teamId: string;
  itemName: string;
  assignedTo: string;
  dueBack: string;
  status: "out" | "returned";
  createdAt?: FirestoreTimestamp;
}

export interface JerseyAssignmentRecord {
  id: string;
  teamId: string;
  athleteName: string;
  jerseyNumber: string;
  setLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface BudgetRequestRecord {
  id: string;
  teamId: string;
  requesterName: string;
  title: string;
  amountLabel: string;
  status: "pending" | "approved" | "denied";
  createdAt?: FirestoreTimestamp;
}

export interface ExpenseApprovalRecord {
  id: string;
  teamId: string;
  title: string;
  amountLabel: string;
  approverName: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: FirestoreTimestamp;
}

export interface PurchaseOrderRecord {
  id: string;
  teamId: string;
  vendorName: string;
  itemSummary: string;
  poNumber: string;
  createdAt?: FirestoreTimestamp;
}

export interface PhotoReleaseRecord {
  id: string;
  eventName: string;
  participantName: string;
  approved: boolean;
  createdAt?: FirestoreTimestamp;
}

export interface MedicalStaffNoteRecord {
  id: string;
  athleteName: string;
  staffName: string;
  note: string;
  createdAt?: FirestoreTimestamp;
}

export interface EmergencyContactRecord {
  id: string;
  athleteName: string;
  contactName: string;
  relationship: string;
  phone: string;
  createdAt?: FirestoreTimestamp;
}

export interface WeatherAlertRecord {
  id: string;
  teamId: string;
  alertTitle: string;
  details: string;
  severity: "watch" | "warning";
  createdAt?: FirestoreTimestamp;
}

export interface EmergencyBroadcastRecord {
  id: string;
  teamId: string;
  title: string;
  message: string;
  createdAt?: FirestoreTimestamp;
}

export interface SosAlertRecord {
  id: string;
  teamId: string;
  senderName: string;
  locationLabel: string;
  message: string;
  createdAt?: FirestoreTimestamp;
}

export interface IncidentTimelineRecord {
  id: string;
  teamId: string;
  incidentTitle: string;
  eventTime: string;
  note: string;
  createdAt?: FirestoreTimestamp;
}

export interface SafetyHubSnapshot {
  captainVotes: CaptainVoteRecord[];
  feedbackReviews: LeadershipFeedbackRecord[];
  harassmentReports: HarassmentReportRecord[];
  safeSportItems: SafeSportRecord[];
  backgroundChecks: BackgroundCheckRecord[];
  onboardingChecklists: StaffOnboardingRecord[];
  volunteerWaivers: VolunteerWaiverRecord[];
  facilityLogs: FacilityAccessLogRecord[];
  equipmentCheckouts: EquipmentCheckoutRecord[];
  jerseyAssignments: JerseyAssignmentRecord[];
  budgetRequests: BudgetRequestRecord[];
  expenseApprovals: ExpenseApprovalRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  photoReleases: PhotoReleaseRecord[];
  medicalNotes: MedicalStaffNoteRecord[];
  emergencyContacts: EmergencyContactRecord[];
  weatherAlerts: WeatherAlertRecord[];
  broadcasts: EmergencyBroadcastRecord[];
  sosAlerts: SosAlertRecord[];
  incidents: IncidentTimelineRecord[];
  teamOptions: Array<{ id: string; label: string }>;
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
  if (!db) return [] as T[];
  const snapshot = await getDocs(query(collection(db, name), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapper(docSnapshot.id, docSnapshot.data())
  );
}

async function createRecord(name: string, data: Record<string, unknown>) {
  const user = requireUser();
  await addDoc(collection(db!, name), {
    ownerId: user.uid,
    ownerName: user.displayName || user.email || "HoopLink User",
    ...data,
    createdAt: serverTimestamp(),
  });
}

export const createCaptainVote = (input: { teamId: string; nomineeName: string; voterName: string; reason: string }) =>
  createRecord("phase7CaptainVotes", input);
export const createLeadershipFeedback = (input: { teamId: string; subjectName: string; reviewerName: string; feedback: string; score: number }) =>
  createRecord("phase7LeadershipFeedback", input);
export const createHarassmentReport = (input: { teamId: string; anonymous: boolean; targetName: string; summary: string; severity: HarassmentReportRecord["severity"] }) =>
  createRecord("phase7HarassmentReports", input);
export const createSafeSportItem = (input: { teamId: string; requirement: string; ownerName: string; status: SafeSportRecord["status"] }) =>
  createRecord("phase7SafeSport", input);
export const createBackgroundCheck = (input: { teamId: string; staffName: string; role: string; status: BackgroundCheckRecord["status"] }) =>
  createRecord("phase7BackgroundChecks", input);
export const createStaffOnboarding = (input: { teamId: string; staffName: string; checklistTitle: string; completedSteps: number; totalSteps: number }) =>
  createRecord("phase7Onboarding", input);
export const createVolunteerWaiver = (input: { eventName: string; volunteerName: string; signed: boolean }) =>
  createRecord("phase7VolunteerWaivers", input);
export const createFacilityAccessLog = (input: { facilityName: string; memberName: string; action: FacilityAccessLogRecord["action"] }) =>
  createRecord("phase7FacilityLogs", input);
export const createEquipmentCheckout = (input: { teamId: string; itemName: string; assignedTo: string; dueBack: string; status: EquipmentCheckoutRecord["status"] }) =>
  createRecord("phase7EquipmentCheckouts", input);
export const createJerseyAssignment = (input: { teamId: string; athleteName: string; jerseyNumber: string; setLabel: string }) =>
  createRecord("phase7JerseyAssignments", input);
export const createBudgetRequest = (input: { teamId: string; requesterName: string; title: string; amountLabel: string; status: BudgetRequestRecord["status"] }) =>
  createRecord("phase7BudgetRequests", input);
export const createExpenseApproval = (input: { teamId: string; title: string; amountLabel: string; approverName: string; status: ExpenseApprovalRecord["status"] }) =>
  createRecord("phase7ExpenseApprovals", input);
export const createPurchaseOrder = (input: { teamId: string; vendorName: string; itemSummary: string; poNumber: string }) =>
  createRecord("phase7PurchaseOrders", input);
export const createPhotoRelease = (input: { eventName: string; participantName: string; approved: boolean }) =>
  createRecord("phase7PhotoReleases", input);
export const createMedicalStaffNote = (input: { athleteName: string; staffName: string; note: string }) =>
  createRecord("phase7MedicalNotes", input);
export const createEmergencyContact = (input: { athleteName: string; contactName: string; relationship: string; phone: string }) =>
  createRecord("phase7EmergencyContacts", input);
export const createWeatherAlert = (input: { teamId: string; alertTitle: string; details: string; severity: WeatherAlertRecord["severity"] }) =>
  createRecord("phase7WeatherAlerts", input);
export const createEmergencyBroadcast = (input: { teamId: string; title: string; message: string }) =>
  createRecord("phase7Broadcasts", input);
export const createSosAlert = (input: { teamId: string; senderName: string; locationLabel: string; message: string }) =>
  createRecord("phase7SosAlerts", input);
export const createIncidentTimeline = (input: { teamId: string; incidentTitle: string; eventTime: string; note: string }) =>
  createRecord("phase7Incidents", input);

async function getTeamOptions() {
  const teams = await getOrganizationTeams().catch(() => [] as TeamRecord[]);
  return teams.map((team: TeamRecord) => ({
    id: team.id,
    label: [team.name, team.sport, team.location].filter(Boolean).join(" • "),
  }));
}

export async function getSafetyHubSnapshot(): Promise<SafetyHubSnapshot> {
  const [
    captainVotes,
    feedbackReviews,
    harassmentReports,
    safeSportItems,
    backgroundChecks,
    onboardingChecklists,
    volunteerWaivers,
    facilityLogs,
    equipmentCheckouts,
    jerseyAssignments,
    budgetRequests,
    expenseApprovals,
    purchaseOrders,
    photoReleases,
    medicalNotes,
    emergencyContacts,
    weatherAlerts,
    broadcasts,
    sosAlerts,
    incidents,
    teamOptions,
  ] = await Promise.all([
    getCollection("phase7CaptainVotes", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      nomineeName: String(data.nomineeName ?? ""),
      voterName: String(data.voterName ?? ""),
      reason: String(data.reason ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7LeadershipFeedback", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      subjectName: String(data.subjectName ?? ""),
      reviewerName: String(data.reviewerName ?? ""),
      feedback: String(data.feedback ?? ""),
      score: Number(data.score ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7HarassmentReports", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      anonymous: Boolean(data.anonymous),
      targetName: String(data.targetName ?? ""),
      summary: String(data.summary ?? ""),
      severity:
        data.severity === "low" || data.severity === "high" ? data.severity : "medium",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7SafeSport", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      requirement: String(data.requirement ?? ""),
      ownerName: String(data.ownerName ?? ""),
      status: data.status === "complete" ? "complete" : "pending",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7BackgroundChecks", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      staffName: String(data.staffName ?? ""),
      role: String(data.role ?? ""),
      status:
        data.status === "cleared" || data.status === "expired" ? data.status : "pending",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7Onboarding", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      staffName: String(data.staffName ?? ""),
      checklistTitle: String(data.checklistTitle ?? ""),
      completedSteps: Number(data.completedSteps ?? 0),
      totalSteps: Number(data.totalSteps ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7VolunteerWaivers", (id, data) => ({
      id,
      eventName: String(data.eventName ?? ""),
      volunteerName: String(data.volunteerName ?? ""),
      signed: Boolean(data.signed),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7FacilityLogs", (id, data) => ({
      id,
      facilityName: String(data.facilityName ?? ""),
      memberName: String(data.memberName ?? ""),
      action: data.action === "check_out" ? "check_out" : "check_in",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7EquipmentCheckouts", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      itemName: String(data.itemName ?? ""),
      assignedTo: String(data.assignedTo ?? ""),
      dueBack: String(data.dueBack ?? ""),
      status: data.status === "returned" ? "returned" : "out",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7JerseyAssignments", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      athleteName: String(data.athleteName ?? ""),
      jerseyNumber: String(data.jerseyNumber ?? ""),
      setLabel: String(data.setLabel ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7BudgetRequests", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      requesterName: String(data.requesterName ?? ""),
      title: String(data.title ?? ""),
      amountLabel: String(data.amountLabel ?? ""),
      status:
        data.status === "approved" || data.status === "denied" ? data.status : "pending",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7ExpenseApprovals", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      title: String(data.title ?? ""),
      amountLabel: String(data.amountLabel ?? ""),
      approverName: String(data.approverName ?? ""),
      status:
        data.status === "approved" || data.status === "rejected" ? data.status : "pending",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7PurchaseOrders", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      vendorName: String(data.vendorName ?? ""),
      itemSummary: String(data.itemSummary ?? ""),
      poNumber: String(data.poNumber ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7PhotoReleases", (id, data) => ({
      id,
      eventName: String(data.eventName ?? ""),
      participantName: String(data.participantName ?? ""),
      approved: Boolean(data.approved),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7MedicalNotes", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      staffName: String(data.staffName ?? ""),
      note: String(data.note ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7EmergencyContacts", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      contactName: String(data.contactName ?? ""),
      relationship: String(data.relationship ?? ""),
      phone: String(data.phone ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7WeatherAlerts", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      alertTitle: String(data.alertTitle ?? ""),
      details: String(data.details ?? ""),
      severity: data.severity === "warning" ? "warning" : "watch",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7Broadcasts", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      title: String(data.title ?? ""),
      message: String(data.message ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7SosAlerts", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      senderName: String(data.senderName ?? ""),
      locationLabel: String(data.locationLabel ?? ""),
      message: String(data.message ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase7Incidents", (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      incidentTitle: String(data.incidentTitle ?? ""),
      eventTime: String(data.eventTime ?? ""),
      note: String(data.note ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getTeamOptions(),
  ]);

  return {
    captainVotes,
    feedbackReviews,
    harassmentReports,
    safeSportItems,
    backgroundChecks,
    onboardingChecklists,
    volunteerWaivers,
    facilityLogs,
    equipmentCheckouts,
    jerseyAssignments,
    budgetRequests,
    expenseApprovals,
    purchaseOrders,
    photoReleases,
    medicalNotes,
    emergencyContacts,
    weatherAlerts,
    broadcasts,
    sosAlerts,
    incidents,
    teamOptions,
  };
}
