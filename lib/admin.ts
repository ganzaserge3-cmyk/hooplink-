import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export interface AuditLogRecord {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface ManagedUserRecord {
  uid: string;
  displayName: string;
  email: string;
  verified: boolean;
  roleType: string;
  accessStatus: "active" | "watch" | "suspended";
  adminNote: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface InviteCodeRecord {
  id: string;
  code: string;
  active: boolean;
  maxUses: number;
  uses: number;
  note: string;
  createdBy: string;
  referralCount?: number;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface AppAccessSettings {
  requireInvite: boolean;
  waitlistOpen: boolean;
  inviteOnlyMessage: string;
}

type ListenerCleanup = () => void;

const defaultAccessSettings: AppAccessSettings = {
  requireInvite: false,
  waitlistOpen: true,
  inviteOnlyMessage: "Request access or use an invite code to join HoopLink.",
};

function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase();
}

export async function writeAuditLog(input: {
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  if (!auth?.currentUser || !db) {
    return;
  }

  await addDoc(collection(db, "auditLogs"), {
    actorId: auth.currentUser.uid,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary,
    metadata: input.metadata ?? {},
    createdAt: serverTimestamp(),
  });
}

export async function getAppAccessSettings(): Promise<AppAccessSettings> {
  if (!db) {
    return defaultAccessSettings;
  }

  const snapshot = await getDoc(doc(db, "appSettings", "access"));
  if (!snapshot.exists()) {
    return defaultAccessSettings;
  }

  const data = snapshot.data() as Record<string, unknown>;
  return {
    requireInvite: data.requireInvite === true,
    waitlistOpen: data.waitlistOpen !== false,
    inviteOnlyMessage: String(
      data.inviteOnlyMessage ?? defaultAccessSettings.inviteOnlyMessage
    ),
  };
}

export async function updateAppAccessSettings(input: AppAccessSettings) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(
    doc(db, "appSettings", "access"),
    {
      requireInvite: input.requireInvite,
      waitlistOpen: input.waitlistOpen,
      inviteOnlyMessage: input.inviteOnlyMessage.trim(),
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid,
    },
    { merge: true }
  );

  await writeAuditLog({
    action: "app_access_updated",
    targetType: "app_settings",
    targetId: "access",
    summary: "Updated invite-only and waitlist access settings.",
  });
}

export async function createInviteCode(input: {
  code: string;
  maxUses: number;
  note?: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const code = normalizeInviteCode(input.code);
  if (!code) {
    throw new Error("Invite code cannot be empty.");
  }

  await setDoc(
    doc(db, "inviteCodes", code),
    {
      code,
      active: true,
      maxUses: Math.max(1, Number(input.maxUses || 1)),
      uses: 0,
      usedBy: [],
      note: input.note?.trim() || "",
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await writeAuditLog({
    action: "invite_code_created",
    targetType: "invite_code",
    targetId: code,
    summary: `Created invite code ${code}.`,
  });
}

export async function toggleInviteCode(code: string, active: boolean) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const normalizedCode = normalizeInviteCode(code);
  await setDoc(
    doc(db, "inviteCodes", normalizedCode),
    {
      active,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await writeAuditLog({
    action: active ? "invite_code_enabled" : "invite_code_disabled",
    targetType: "invite_code",
    targetId: normalizedCode,
    summary: `${active ? "Enabled" : "Disabled"} invite code ${normalizedCode}.`,
  });
}

export async function validateInviteCode(code: string) {
  if (!db) {
    return { valid: false, reason: "Database unavailable." };
  }

  const normalizedCode = normalizeInviteCode(code);
  if (!normalizedCode) {
    return { valid: false, reason: "Enter an invite code." };
  }

  const snapshot = await getDoc(doc(db, "inviteCodes", normalizedCode));
  if (!snapshot.exists()) {
    return { valid: false, reason: "Invite code not found." };
  }

  const data = snapshot.data() as Record<string, unknown>;
  const active = data.active !== false;
  const uses = Number(data.uses ?? 0);
  const maxUses = Number(data.maxUses ?? 1);

  if (!active) {
    return { valid: false, reason: "Invite code is inactive." };
  }

  if (uses >= maxUses) {
    return { valid: false, reason: "Invite code has been used up." };
  }

  return { valid: true, reason: "" };
}

export async function redeemInviteCode(code: string, userId: string) {
  if (!db) {
    return;
  }

  const normalizedCode = normalizeInviteCode(code);
  const status = await validateInviteCode(normalizedCode);
  if (!status.valid) {
    throw new Error(status.reason);
  }

  await updateDoc(doc(db, "inviteCodes", normalizedCode), {
    uses: increment(1),
    usedBy: arrayUnion(userId),
    referralCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "referrals", `${normalizedCode}__${userId}`),
    {
      code: normalizedCode,
      userId,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeToInviteCodes(
  callback: (codes: InviteCodeRecord[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const codesQuery = query(collection(db, "inviteCodes"), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(
    codesQuery,
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
    callback(
      snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        return {
          id: docSnapshot.id,
          code: String(data.code ?? docSnapshot.id),
          active: data.active !== false,
          maxUses: Number(data.maxUses ?? 1),
          uses: Number(data.uses ?? 0),
          note: String(data.note ?? ""),
          createdBy: String(data.createdBy ?? ""),
          referralCount: Number(data.referralCount ?? data.uses ?? 0),
          createdAt:
            (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ??
            null,
        } satisfies InviteCodeRecord;
      })
    );
    }
  );
}

export function subscribeToManagedUsers(
  callback: (users: ManagedUserRecord[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(
    usersQuery,
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
    callback(
      snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        const adminFlags = (data.adminFlags as Record<string, unknown> | undefined) ?? {};
        const role = (data.role as Record<string, unknown> | undefined) ?? {};
        return {
          uid: String(data.uid ?? docSnapshot.id),
          displayName: String(data.displayName ?? "HoopLink User"),
          email: String(data.email ?? ""),
          verified: Boolean(data.verified),
          roleType: String(role.type ?? "member"),
          accessStatus:
            adminFlags.accessStatus === "watch" || adminFlags.accessStatus === "suspended"
              ? adminFlags.accessStatus
              : "active",
          adminNote: String(adminFlags.note ?? ""),
          createdAt:
            (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ??
            null,
        } satisfies ManagedUserRecord;
      })
    );
    }
  );
}

export async function updateManagedUser(
  uid: string,
  input: {
    accessStatus: ManagedUserRecord["accessStatus"];
    adminNote: string;
    verified: boolean;
  }
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(
    doc(db, "users", uid),
    {
      verified: input.verified,
      adminFlags: {
        accessStatus: input.accessStatus,
        note: input.adminNote.trim(),
        reviewedBy: auth.currentUser.uid,
        reviewedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await writeAuditLog({
    action: "user_access_updated",
    targetType: "user",
    targetId: uid,
    summary: `Updated user access to ${input.accessStatus}.`,
    metadata: { verified: input.verified },
  });
}

export async function getCurrentUserAccessStatus() {
  if (!auth?.currentUser || !db) {
    return "active" as ManagedUserRecord["accessStatus"];
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  if (!snapshot.exists()) {
    return "active" as ManagedUserRecord["accessStatus"];
  }

  const data = snapshot.data() as Record<string, unknown>;
  const adminFlags = (data.adminFlags as Record<string, unknown> | undefined) ?? {};
  return adminFlags.accessStatus === "watch" || adminFlags.accessStatus === "suspended"
    ? adminFlags.accessStatus
    : "active";
}

export function subscribeToAuditLogs(
  callback: (logs: AuditLogRecord[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const logsQuery = query(collection(db, "auditLogs"), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(
    logsQuery,
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
    callback(
      snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        return {
          id: docSnapshot.id,
          actorId: String(data.actorId ?? ""),
          action: String(data.action ?? ""),
          targetType: String(data.targetType ?? ""),
          targetId: String(data.targetId ?? ""),
          summary: String(data.summary ?? ""),
          metadata:
            (data.metadata as Record<string, unknown> | undefined) ?? undefined,
          createdAt:
            (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ??
            null,
        } satisfies AuditLogRecord;
      })
    );
    }
  );
}
