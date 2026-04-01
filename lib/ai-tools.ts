import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getCurrentUserProfile } from "@/lib/user-profile";

export interface CoachEntry {
  id: string;
  type: "chat" | "plan" | "profile";
  title?: string;
  prompt: string;
  response: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

function mapEntry(id: string, data: Record<string, unknown>): CoachEntry {
  return {
    id,
    type: data.type === "plan" || data.type === "profile" ? data.type : "chat",
    title: data.title ? String(data.title) : "",
    prompt: String(data.prompt ?? ""),
    response: String(data.response ?? ""),
    createdAt:
      (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
  };
}

export async function saveCoachEntry(input: Omit<CoachEntry, "id" | "createdAt">) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in to save AI coaching history.");
  }

  await addDoc(collection(db, "coachHistory"), {
    userId: auth.currentUser.uid,
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getCoachHistory() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, "coachHistory"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    )
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapEntry(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
  );
}

export async function renameCoachEntry(entryId: string, title: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(
    doc(db, "coachHistory", entryId),
    {
      title: title.trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteCoachEntry(entryId: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await deleteDoc(doc(db, "coachHistory", entryId));
}

export async function buildProfileOptimizationPrompt() {
  const profile = (await getCurrentUserProfile()) as Record<string, unknown> | null;
  const role = (profile?.role as Record<string, unknown> | undefined) ?? {};

  return [
    `Display name: ${String(profile?.displayName ?? auth?.currentUser?.displayName ?? "Unknown")}`,
    `Role: ${String(role.type ?? "unknown")}`,
    `Sport: ${String(role.sport ?? "unknown")}`,
    `Position: ${String(role.position ?? "unknown")}`,
    `Team: ${String(role.team ?? "unknown")}`,
    `Experience: ${String(role.experience ?? "unknown")}`,
    `Bio: ${String(role.bio ?? "No bio")}`,
    `Location: ${String(profile?.location ?? "unknown")}`,
  ].join("\n");
}
