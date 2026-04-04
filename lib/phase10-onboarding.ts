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
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type FirestoreTimestamp = { seconds?: number; nanoseconds?: number } | null;

export interface Phase10Preferences {
  accessibilityMode: "default" | "high_visibility" | "voice_ready";
  dyslexiaFriendly: boolean;
  voiceNavigationEnabled: boolean;
}

export interface AdmissionsChecklistRecord {
  id: string;
  schoolName: string;
  applicantName: string;
  completedSteps: number;
  totalSteps: number;
  createdAt?: FirestoreTimestamp;
}

export interface HousingDepositRecord {
  id: string;
  athleteName: string;
  housingName: string;
  amountLabel: string;
  dueDate: string;
  createdAt?: FirestoreTimestamp;
}

export interface MealSwipeBudgetRecord {
  id: string;
  athleteName: string;
  monthlyBudget: number;
  currentBalance: number;
  createdAt?: FirestoreTimestamp;
}

export interface BankSetupRecord {
  id: string;
  athleteName: string;
  bankName: string;
  checklistStatus: "pending" | "complete";
  createdAt?: FirestoreTimestamp;
}

export interface InternationalArrivalRecord {
  id: string;
  athleteName: string;
  airport: string;
  arrivalDate: string;
  status: "planned" | "arrived";
  createdAt?: FirestoreTimestamp;
}

export interface LockerVaultRecord {
  id: string;
  athleteName: string;
  lockerLabel: string;
  codeHint: string;
  createdAt?: FirestoreTimestamp;
}

export interface RoleOnboardingRecord {
  id: string;
  roleName: string;
  title: string;
  checklist: string[];
  createdAt?: FirestoreTimestamp;
}

export interface CampusPrepRecord {
  id: string;
  athleteName: string;
  topic: string;
  summary: string;
  createdAt?: FirestoreTimestamp;
}

export interface FamilyTransitionRecord {
  id: string;
  athleteName: string;
  guardianName: string;
  planTitle: string;
  summary: string;
  createdAt?: FirestoreTimestamp;
}

export interface PrivatePrepPageRecord {
  id: string;
  title: string;
  accessGroup: string;
  summary: string;
  createdAt?: FirestoreTimestamp;
}

export interface ArrivalReminderRecord {
  id: string;
  athleteName: string;
  reminderTitle: string;
  reminderDate: string;
  createdAt?: FirestoreTimestamp;
}

export interface Phase10Snapshot {
  preferences: Phase10Preferences;
  admissions: AdmissionsChecklistRecord[];
  housingDeposits: HousingDepositRecord[];
  mealBudgets: MealSwipeBudgetRecord[];
  bankSetups: BankSetupRecord[];
  arrivals: InternationalArrivalRecord[];
  lockers: LockerVaultRecord[];
  roleOnboarding: RoleOnboardingRecord[];
  campusPrep: CampusPrepRecord[];
  familyTransitions: FamilyTransitionRecord[];
  prepPages: PrivatePrepPageRecord[];
  arrivalReminders: ArrivalReminderRecord[];
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

export async function getPhase10Preferences() {
  if (!auth?.currentUser || !db) {
    return {
      accessibilityMode: "default",
      dyslexiaFriendly: false,
      voiceNavigationEnabled: false,
    } satisfies Phase10Preferences;
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const prefs = (data.phase10 as Record<string, unknown> | undefined) ?? {};
  return {
    accessibilityMode:
      prefs.accessibilityMode === "high_visibility" || prefs.accessibilityMode === "voice_ready"
        ? prefs.accessibilityMode
        : "default",
    dyslexiaFriendly: prefs.dyslexiaFriendly === true,
    voiceNavigationEnabled: prefs.voiceNavigationEnabled === true,
  } satisfies Phase10Preferences;
}

export async function savePhase10Preferences(input: Phase10Preferences) {
  const user = requireUser();
  await setDoc(
    doc(db!, "users", user.uid),
    {
      phase10: {
        accessibilityMode: input.accessibilityMode,
        dyslexiaFriendly: input.dyslexiaFriendly,
        voiceNavigationEnabled: input.voiceNavigationEnabled,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export const createAdmissionsChecklist = (input: Omit<AdmissionsChecklistRecord, "id" | "createdAt">) =>
  createRecord("phase10Admissions", input);
export const createHousingDeposit = (input: Omit<HousingDepositRecord, "id" | "createdAt">) =>
  createRecord("phase10HousingDeposits", input);
export const createMealSwipeBudget = (input: Omit<MealSwipeBudgetRecord, "id" | "createdAt">) =>
  createRecord("phase10MealBudgets", input);
export const createBankSetup = (input: Omit<BankSetupRecord, "id" | "createdAt">) =>
  createRecord("phase10BankSetups", input);
export const createInternationalArrival = (input: Omit<InternationalArrivalRecord, "id" | "createdAt">) =>
  createRecord("phase10Arrivals", input);
export const createLockerVault = (input: Omit<LockerVaultRecord, "id" | "createdAt">) =>
  createRecord("phase10Lockers", input);
export const createRoleOnboarding = (input: Omit<RoleOnboardingRecord, "id" | "createdAt">) =>
  createRecord("phase10RoleOnboarding", input);
export const createCampusPrep = (input: Omit<CampusPrepRecord, "id" | "createdAt">) =>
  createRecord("phase10CampusPrep", input);
export const createFamilyTransition = (input: Omit<FamilyTransitionRecord, "id" | "createdAt">) =>
  createRecord("phase10FamilyTransition", input);
export const createPrivatePrepPage = (input: Omit<PrivatePrepPageRecord, "id" | "createdAt">) =>
  createRecord("phase10PrepPages", input);
export const createArrivalReminder = (input: Omit<ArrivalReminderRecord, "id" | "createdAt">) =>
  createRecord("phase10ArrivalReminders", input);

export async function getPhase10Snapshot(): Promise<Phase10Snapshot> {
  const [
    preferences,
    admissions,
    housingDeposits,
    mealBudgets,
    bankSetups,
    arrivals,
    lockers,
    roleOnboarding,
    campusPrep,
    familyTransitions,
    prepPages,
    arrivalReminders,
  ] = await Promise.all([
    getPhase10Preferences(),
    getCollection("phase10Admissions", (id, data) => ({
      id,
      schoolName: String(data.schoolName ?? ""),
      applicantName: String(data.applicantName ?? ""),
      completedSteps: Number(data.completedSteps ?? 0),
      totalSteps: Number(data.totalSteps ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10HousingDeposits", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      housingName: String(data.housingName ?? ""),
      amountLabel: String(data.amountLabel ?? ""),
      dueDate: String(data.dueDate ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10MealBudgets", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      monthlyBudget: Number(data.monthlyBudget ?? 0),
      currentBalance: Number(data.currentBalance ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10BankSetups", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      bankName: String(data.bankName ?? ""),
      checklistStatus: data.checklistStatus === "complete" ? "complete" : "pending",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10Arrivals", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      airport: String(data.airport ?? ""),
      arrivalDate: String(data.arrivalDate ?? ""),
      status: data.status === "arrived" ? "arrived" : "planned",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10Lockers", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      lockerLabel: String(data.lockerLabel ?? ""),
      codeHint: String(data.codeHint ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10RoleOnboarding", (id, data) => ({
      id,
      roleName: String(data.roleName ?? ""),
      title: String(data.title ?? ""),
      checklist: Array.isArray(data.checklist) ? data.checklist.map(String) : [],
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10CampusPrep", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      topic: String(data.topic ?? ""),
      summary: String(data.summary ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10FamilyTransition", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      guardianName: String(data.guardianName ?? ""),
      planTitle: String(data.planTitle ?? ""),
      summary: String(data.summary ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10PrepPages", (id, data) => ({
      id,
      title: String(data.title ?? ""),
      accessGroup: String(data.accessGroup ?? ""),
      summary: String(data.summary ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase10ArrivalReminders", (id, data) => ({
      id,
      athleteName: String(data.athleteName ?? ""),
      reminderTitle: String(data.reminderTitle ?? ""),
      reminderDate: String(data.reminderDate ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
  ]);

  return {
    preferences,
    admissions,
    housingDeposits,
    mealBudgets,
    bankSetups,
    arrivals,
    lockers,
    roleOnboarding,
    campusPrep,
    familyTransitions,
    prepPages,
    arrivalReminders,
  };
}
