import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getOrganizationTeams, type TeamRecord } from "@/lib/teams";

type FirestoreTimestamp = { seconds?: number; nanoseconds?: number } | null;

export interface BusSeatPlanRecord {
  id: string;
  teamId: string;
  tripLabel: string;
  athleteName: string;
  seatLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface RoommateAssignmentRecord {
  id: string;
  teamId: string;
  tripLabel: string;
  athleteName: string;
  roommateName: string;
  createdAt?: FirestoreTimestamp;
}

export interface TravelReimbursementRecord {
  id: string;
  teamId: string;
  requesterName: string;
  expenseLabel: string;
  amountLabel: string;
  status: "pending" | "approved" | "paid";
  createdAt?: FirestoreTimestamp;
}

export interface VisaExpirationRecord {
  id: string;
  athleteName: string;
  documentType: string;
  expiresOn: string;
  country: string;
  createdAt?: FirestoreTimestamp;
}

export interface RelocationChecklistRecord {
  id: string;
  athleteName: string;
  city: string;
  checklistTitle: string;
  completedSteps: number;
  totalSteps: number;
  createdAt?: FirestoreTimestamp;
}

export interface ApartmentPartnerRecord {
  id: string;
  city: string;
  partnerName: string;
  offerSummary: string;
  contactLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface YouthAcademyRegistrationRecord {
  id: string;
  academyName: string;
  athleteName: string;
  ageGroup: string;
  status: "pending" | "accepted" | "waitlist";
  createdAt?: FirestoreTimestamp;
}

export interface ParentRosterContactRecord {
  id: string;
  teamId: string;
  athleteName: string;
  parentName: string;
  phone: string;
  createdAt?: FirestoreTimestamp;
}

export interface CarpoolRecord {
  id: string;
  teamId: string;
  driverName: string;
  routeLabel: string;
  seatsAvailable: number;
  createdAt?: FirestoreTimestamp;
}

export interface SnackSignupRecord {
  id: string;
  teamId: string;
  eventLabel: string;
  parentName: string;
  itemLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface PhotoDayScheduleRecord {
  id: string;
  teamId: string;
  athleteName: string;
  slotTime: string;
  lookLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface AwardNominationRecord {
  id: string;
  teamId: string;
  nomineeName: string;
  awardTitle: string;
  justification: string;
  createdAt?: FirestoreTimestamp;
}

export interface HallOfFameRecord {
  id: string;
  honoreeName: string;
  classYear: string;
  legacyNote: string;
  createdAt?: FirestoreTimestamp;
}

export interface ArchiveTimelineRecord {
  id: string;
  yearLabel: string;
  title: string;
  summary: string;
  createdAt?: FirestoreTimestamp;
}

export interface LegacyImportRecord {
  id: string;
  sourceLabel: string;
  statsSummary: string;
  importedCount: number;
  createdAt?: FirestoreTimestamp;
}

export interface AnniversaryPageRecord {
  id: string;
  title: string;
  milestoneYear: string;
  summary: string;
  createdAt?: FirestoreTimestamp;
}

export interface TraditionRecord {
  id: string;
  teamId: string;
  title: string;
  description: string;
  createdAt?: FirestoreTimestamp;
}

export interface LocalChapterRecord {
  id: string;
  city: string;
  chapterName: string;
  focus: string;
  createdAt?: FirestoreTimestamp;
}

export interface CityAmbassadorRecord {
  id: string;
  city: string;
  ambassadorName: string;
  chapterName: string;
  createdAt?: FirestoreTimestamp;
}

export interface VolunteerHourRecord {
  id: string;
  participantName: string;
  programName: string;
  hours: number;
  createdAt?: FirestoreTimestamp;
}

export interface TravelOpsProfile {
  advancedTravelOps: Record<string, string[]>;
}

export interface TravelLegacySnapshot {
  busPlans: BusSeatPlanRecord[];
  roommateAssignments: RoommateAssignmentRecord[];
  reimbursements: TravelReimbursementRecord[];
  visaAlerts: VisaExpirationRecord[];
  relocationChecklists: RelocationChecklistRecord[];
  apartmentPartners: ApartmentPartnerRecord[];
  academyRegistrations: YouthAcademyRegistrationRecord[];
  parentContacts: ParentRosterContactRecord[];
  carpools: CarpoolRecord[];
  snackSignups: SnackSignupRecord[];
  photoSchedules: PhotoDayScheduleRecord[];
  awardNominations: AwardNominationRecord[];
  hallOfFame: HallOfFameRecord[];
  archiveTimeline: ArchiveTimelineRecord[];
  legacyImports: LegacyImportRecord[];
  anniversaryPages: AnniversaryPageRecord[];
  traditions: TraditionRecord[];
  localChapters: LocalChapterRecord[];
  cityAmbassadors: CityAmbassadorRecord[];
  volunteerHours: VolunteerHourRecord[];
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

export const createBusSeatPlan = (input: Omit<BusSeatPlanRecord, "id" | "createdAt">) => createRecord("phase8BusPlans", input);
export const createRoommateAssignment = (input: Omit<RoommateAssignmentRecord, "id" | "createdAt">) => createRecord("phase8Roommates", input);
export const createTravelReimbursement = (input: Omit<TravelReimbursementRecord, "id" | "createdAt">) => createRecord("phase8Reimbursements", input);
export const createVisaAlert = (input: Omit<VisaExpirationRecord, "id" | "createdAt">) => createRecord("phase8VisaAlerts", input);
export const createRelocationChecklist = (input: Omit<RelocationChecklistRecord, "id" | "createdAt">) => createRecord("phase8Relocation", input);
export const createApartmentPartner = (input: Omit<ApartmentPartnerRecord, "id" | "createdAt">) => createRecord("phase8ApartmentPartners", input);
export const createAcademyRegistration = (input: Omit<YouthAcademyRegistrationRecord, "id" | "createdAt">) => createRecord("phase8AcademyRegistrations", input);
export const createParentRosterContact = (input: Omit<ParentRosterContactRecord, "id" | "createdAt">) => createRecord("phase8ParentContacts", input);
export const createCarpool = (input: Omit<CarpoolRecord, "id" | "createdAt">) => createRecord("phase8Carpools", input);
export const createSnackSignup = (input: Omit<SnackSignupRecord, "id" | "createdAt">) => createRecord("phase8SnackSignups", input);
export const createPhotoDaySchedule = (input: Omit<PhotoDayScheduleRecord, "id" | "createdAt">) => createRecord("phase8PhotoDay", input);
export const createAwardNomination = (input: Omit<AwardNominationRecord, "id" | "createdAt">) => createRecord("phase8AwardNominations", input);
export const createHallOfFameEntry = (input: Omit<HallOfFameRecord, "id" | "createdAt">) => createRecord("phase8HallOfFame", input);
export const createArchiveTimelineEntry = (input: Omit<ArchiveTimelineRecord, "id" | "createdAt">) => createRecord("phase8ArchiveTimeline", input);
export const createLegacyImport = (input: Omit<LegacyImportRecord, "id" | "createdAt">) => createRecord("phase8LegacyImports", input);
export const createAnniversaryPage = (input: Omit<AnniversaryPageRecord, "id" | "createdAt">) => createRecord("phase8AnniversaryPages", input);
export const createTradition = (input: Omit<TraditionRecord, "id" | "createdAt">) => createRecord("phase8Traditions", input);
export const createLocalChapter = (input: Omit<LocalChapterRecord, "id" | "createdAt">) => createRecord("phase8LocalChapters", input);
export const createCityAmbassador = (input: Omit<CityAmbassadorRecord, "id" | "createdAt">) => createRecord("phase8CityAmbassadors", input);
export const createVolunteerHours = (input: Omit<VolunteerHourRecord, "id" | "createdAt">) => createRecord("phase8VolunteerHours", input);

async function getTeamOptions() {
  const teams = await getOrganizationTeams().catch(() => [] as TeamRecord[]);
  return teams.map((team: TeamRecord) => ({
    id: team.id,
    label: [team.name, team.sport, team.location].filter(Boolean).join(" • "),
  }));
}

export async function getTravelLegacySnapshot(): Promise<TravelLegacySnapshot> {
  const [
    busPlans,
    roommateAssignments,
    reimbursements,
    visaAlerts,
    relocationChecklists,
    apartmentPartners,
    academyRegistrations,
    parentContacts,
    carpools,
    snackSignups,
    photoSchedules,
    awardNominations,
    hallOfFame,
    archiveTimeline,
    legacyImports,
    anniversaryPages,
    traditions,
    localChapters,
    cityAmbassadors,
    volunteerHours,
    teamOptions,
  ] = await Promise.all([
    getCollection("phase8BusPlans", (id, data) => ({ id, teamId: String(data.teamId ?? ""), tripLabel: String(data.tripLabel ?? ""), athleteName: String(data.athleteName ?? ""), seatLabel: String(data.seatLabel ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8Roommates", (id, data) => ({ id, teamId: String(data.teamId ?? ""), tripLabel: String(data.tripLabel ?? ""), athleteName: String(data.athleteName ?? ""), roommateName: String(data.roommateName ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8Reimbursements", (id, data) => ({ id, teamId: String(data.teamId ?? ""), requesterName: String(data.requesterName ?? ""), expenseLabel: String(data.expenseLabel ?? ""), amountLabel: String(data.amountLabel ?? ""), status: data.status === "approved" || data.status === "paid" ? data.status : "pending", createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8VisaAlerts", (id, data) => ({ id, athleteName: String(data.athleteName ?? ""), documentType: String(data.documentType ?? ""), expiresOn: String(data.expiresOn ?? ""), country: String(data.country ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8Relocation", (id, data) => ({ id, athleteName: String(data.athleteName ?? ""), city: String(data.city ?? ""), checklistTitle: String(data.checklistTitle ?? ""), completedSteps: Number(data.completedSteps ?? 0), totalSteps: Number(data.totalSteps ?? 0), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8ApartmentPartners", (id, data) => ({ id, city: String(data.city ?? ""), partnerName: String(data.partnerName ?? ""), offerSummary: String(data.offerSummary ?? ""), contactLabel: String(data.contactLabel ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8AcademyRegistrations", (id, data) => ({ id, academyName: String(data.academyName ?? ""), athleteName: String(data.athleteName ?? ""), ageGroup: String(data.ageGroup ?? ""), status: data.status === "accepted" || data.status === "waitlist" ? data.status : "pending", createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8ParentContacts", (id, data) => ({ id, teamId: String(data.teamId ?? ""), athleteName: String(data.athleteName ?? ""), parentName: String(data.parentName ?? ""), phone: String(data.phone ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8Carpools", (id, data) => ({ id, teamId: String(data.teamId ?? ""), driverName: String(data.driverName ?? ""), routeLabel: String(data.routeLabel ?? ""), seatsAvailable: Number(data.seatsAvailable ?? 0), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8SnackSignups", (id, data) => ({ id, teamId: String(data.teamId ?? ""), eventLabel: String(data.eventLabel ?? ""), parentName: String(data.parentName ?? ""), itemLabel: String(data.itemLabel ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8PhotoDay", (id, data) => ({ id, teamId: String(data.teamId ?? ""), athleteName: String(data.athleteName ?? ""), slotTime: String(data.slotTime ?? ""), lookLabel: String(data.lookLabel ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8AwardNominations", (id, data) => ({ id, teamId: String(data.teamId ?? ""), nomineeName: String(data.nomineeName ?? ""), awardTitle: String(data.awardTitle ?? ""), justification: String(data.justification ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8HallOfFame", (id, data) => ({ id, honoreeName: String(data.honoreeName ?? ""), classYear: String(data.classYear ?? ""), legacyNote: String(data.legacyNote ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8ArchiveTimeline", (id, data) => ({ id, yearLabel: String(data.yearLabel ?? ""), title: String(data.title ?? ""), summary: String(data.summary ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8LegacyImports", (id, data) => ({ id, sourceLabel: String(data.sourceLabel ?? ""), statsSummary: String(data.statsSummary ?? ""), importedCount: Number(data.importedCount ?? 0), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8AnniversaryPages", (id, data) => ({ id, title: String(data.title ?? ""), milestoneYear: String(data.milestoneYear ?? ""), summary: String(data.summary ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8Traditions", (id, data) => ({ id, teamId: String(data.teamId ?? ""), title: String(data.title ?? ""), description: String(data.description ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8LocalChapters", (id, data) => ({ id, city: String(data.city ?? ""), chapterName: String(data.chapterName ?? ""), focus: String(data.focus ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8CityAmbassadors", (id, data) => ({ id, city: String(data.city ?? ""), ambassadorName: String(data.ambassadorName ?? ""), chapterName: String(data.chapterName ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase8VolunteerHours", (id, data) => ({ id, participantName: String(data.participantName ?? ""), programName: String(data.programName ?? ""), hours: Number(data.hours ?? 0), createdAt: mapTimestamp(data, "createdAt") })),
    getTeamOptions(),
  ]);

  return { busPlans, roommateAssignments, reimbursements, visaAlerts, relocationChecklists, apartmentPartners, academyRegistrations, parentContacts, carpools, snackSignups, photoSchedules, awardNominations, hallOfFame, archiveTimeline, legacyImports, anniversaryPages, traditions, localChapters, cityAmbassadors, volunteerHours, teamOptions };
}

export async function getTravelOpsProfile(): Promise<TravelOpsProfile> {
  if (!auth?.currentUser || !db) {
    return { advancedTravelOps: {} };
  }

  const snapshot = await getDoc(doc(db, "travelOpsProfiles", auth.currentUser.uid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const advancedTravelOps = (data.advancedTravelOps as Record<string, unknown> | undefined) ?? {};

  return {
    advancedTravelOps: Object.fromEntries(
      Object.entries(advancedTravelOps).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [],
      ])
    ),
  };
}

export async function saveTravelOpsProfile(input: TravelOpsProfile) {
  const user = requireUser();
  await setDoc(
    doc(db!, "travelOpsProfiles", user.uid),
    {
      ownerId: user.uid,
      advancedTravelOps: Object.fromEntries(
        Object.entries(input.advancedTravelOps).map(([key, value]) => [
          key,
          (value ?? []).map((item) => item.trim()).filter(Boolean),
        ])
      ),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
