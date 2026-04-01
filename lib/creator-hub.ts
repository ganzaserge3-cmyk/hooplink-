import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";

export interface PremiumGroupRecord {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  priceLabel: string;
  memberIds: string[];
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface EarningsSnapshot {
  subscribers: number;
  premiumGroupMembers: number;
  bookingRequests: number;
  estimatedRevenue: number;
}

export async function toggleCreatorSubscription(creatorId: string, isSubscribed: boolean) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const currentUid = auth.currentUser.uid;
  if (currentUid === creatorId) {
    return;
  }

  await setDoc(
    doc(db, "users", currentUid),
    {
      subscribedCreators: isSubscribed ? arrayRemove(creatorId) : arrayUnion(creatorId),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "users", creatorId),
    {
      subscriberIds: isSubscribed ? arrayRemove(currentUid) : arrayUnion(currentUid),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  if (!isSubscribed) {
    await createNotification({
      type: "subscription",
      recipientId: creatorId,
      actorId: currentUid,
      actorName: auth.currentUser.displayName || "HoopLink User",
      actorAvatar: auth.currentUser.photoURL || "",
      message: `${auth.currentUser.displayName || "Someone"} subscribed to your premium content.`,
    });
  }
}

export async function createPremiumGroup(input: {
  name: string;
  description: string;
  priceLabel: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const groupRef = await addDoc(collection(db, "premiumGroups"), {
    ownerId: auth.currentUser.uid,
    name: input.name.trim(),
    description: input.description.trim(),
    priceLabel: input.priceLabel.trim(),
    memberIds: [auth.currentUser.uid],
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      premiumGroupIds: arrayUnion(groupRef.id),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return groupRef.id;
}

export async function getOwnedPremiumGroups() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "premiumGroups"), where("ownerId", "==", auth.currentUser.uid), limit(20))
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      name: String(data.name ?? ""),
      description: String(data.description ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      memberIds: Array.isArray(data.memberIds) ? (data.memberIds as string[]) : [],
      createdAt:
        (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    } satisfies PremiumGroupRecord;
  });
}

export async function getJoinablePremiumGroups(ownerId?: string) {
  if (!db) {
    return [];
  }

  const groupsQuery = ownerId
    ? query(collection(db, "premiumGroups"), where("ownerId", "==", ownerId), limit(20))
    : query(collection(db, "premiumGroups"), limit(20));
  const snapshot = await getDocs(groupsQuery);
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      name: String(data.name ?? ""),
      description: String(data.description ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      memberIds: Array.isArray(data.memberIds) ? (data.memberIds as string[]) : [],
      createdAt:
        (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    } satisfies PremiumGroupRecord;
  });
}

export async function joinPremiumGroup(groupId: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "premiumGroups", groupId));
  if (!snapshot.exists()) {
    throw new Error("Group not found.");
  }

  const data = snapshot.data() as Record<string, unknown>;
  await setDoc(
    doc(db, "premiumGroups", groupId),
    {
      memberIds: arrayUnion(auth.currentUser.uid),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      premiumGroupIds: arrayUnion(groupId),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const ownerId = String(data.ownerId ?? "");
  if (ownerId && ownerId !== auth.currentUser.uid) {
    await createNotification({
      type: "premium_group",
      recipientId: ownerId,
      actorId: auth.currentUser.uid,
      actorName: auth.currentUser.displayName || "HoopLink User",
      actorAvatar: auth.currentUser.photoURL || "",
      message: `${auth.currentUser.displayName || "Someone"} joined your premium group.`,
    });
  }
}

export async function getCurrentEarningsSnapshot(): Promise<EarningsSnapshot> {
  if (!auth?.currentUser || !db) {
    return { subscribers: 0, premiumGroupMembers: 0, bookingRequests: 0, estimatedRevenue: 0 };
  }

  const [userSnapshot, groupsSnapshot, bookingsSnapshot] = await Promise.all([
    getDoc(doc(db, "users", auth.currentUser.uid)),
    getDocs(query(collection(db, "premiumGroups"), where("ownerId", "==", auth.currentUser.uid), limit(50))),
    getDocs(query(collection(db, "bookings"), where("hostId", "==", auth.currentUser.uid), limit(100))),
  ]);

  const userData = userSnapshot.exists() ? (userSnapshot.data() as Record<string, unknown>) : {};
  const subscriberIds = Array.isArray(userData.subscriberIds) ? (userData.subscriberIds as string[]) : [];
  const premiumGroupMembers = groupsSnapshot.docs.reduce(
    (
      sum: number,
      docSnapshot: { data: () => Record<string, unknown> }
    ) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const members = Array.isArray(data.memberIds) ? (data.memberIds as string[]) : [];
      return sum + Math.max(0, members.length - 1);
    },
    0
  );
  const bookingRequests = bookingsSnapshot.docs.length;
  const estimatedRevenue = subscriberIds.length * 9 + premiumGroupMembers * 15 + bookingRequests * 20;

  return {
    subscribers: subscriberIds.length,
    premiumGroupMembers,
    bookingRequests,
    estimatedRevenue,
  };
}
