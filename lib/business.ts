import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";

export interface BusinessOffer {
  enabled: boolean;
  title: string;
  priceLabel: string;
  durationMinutes: number;
  checkoutUrl: string;
}

export interface CreatorBusinessProfile {
  supportUrl: string;
  merchUrl: string;
  collaborationPitch: string;
  training: BusinessOffer;
  consultation: BusinessOffer;
}

export interface BookingRequestRecord {
  id: string;
  hostId: string;
  hostName: string;
  requesterId: string;
  requesterName: string;
  type: "training" | "consultation";
  scheduledFor: string;
  priceLabel: string;
  note: string;
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface WaitlistEntryRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  note: string;
  status: "new" | "reviewed";
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

type ListenerCleanup = () => void;

const defaultOffer: BusinessOffer = {
  enabled: false,
  title: "",
  priceLabel: "",
  durationMinutes: 45,
  checkoutUrl: "",
};

const defaultBusinessProfile: CreatorBusinessProfile = {
  supportUrl: "",
  merchUrl: "",
  collaborationPitch: "",
  training: defaultOffer,
  consultation: defaultOffer,
};

function mapBooking(
  id: string,
  data: Record<string, unknown>
): BookingRequestRecord {
  return {
    id,
    hostId: String(data.hostId ?? ""),
    hostName: String(data.hostName ?? "Creator"),
    requesterId: String(data.requesterId ?? ""),
    requesterName: String(data.requesterName ?? "Member"),
    type: data.type === "consultation" ? "consultation" : "training",
    scheduledFor: String(data.scheduledFor ?? ""),
    priceLabel: String(data.priceLabel ?? ""),
    note: String(data.note ?? ""),
    status:
      data.status === "accepted" ||
      data.status === "declined" ||
      data.status === "completed"
        ? data.status
        : "pending",
    createdAt:
      (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
  };
}

function normalizeOffer(input?: Partial<BusinessOffer>): BusinessOffer {
  return {
    enabled: input?.enabled === true,
    title: String(input?.title ?? ""),
    priceLabel: String(input?.priceLabel ?? ""),
    durationMinutes: Math.max(15, Number(input?.durationMinutes ?? 45)),
    checkoutUrl: String(input?.checkoutUrl ?? ""),
  };
}

export async function getCurrentUserBusinessProfile() {
  if (!auth?.currentUser || !db) {
    return defaultBusinessProfile;
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  if (!snapshot.exists()) {
    return defaultBusinessProfile;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const business = (data.business as Record<string, unknown> | undefined) ?? {};
  return {
    supportUrl: String(business.supportUrl ?? ""),
    merchUrl: String(business.merchUrl ?? ""),
    collaborationPitch: String(business.collaborationPitch ?? ""),
    training: normalizeOffer(business.training as Partial<BusinessOffer> | undefined),
    consultation: normalizeOffer(business.consultation as Partial<BusinessOffer> | undefined),
  } satisfies CreatorBusinessProfile;
}

export async function updateCurrentUserBusinessProfile(input: CreatorBusinessProfile) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      business: {
        supportUrl: input.supportUrl.trim(),
        merchUrl: input.merchUrl.trim(),
        collaborationPitch: input.collaborationPitch.trim(),
        training: normalizeOffer(input.training),
        consultation: normalizeOffer(input.consultation),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function createBookingRequest(input: {
  hostId: string;
  type: "training" | "consultation";
  scheduledFor: string;
  note: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const requester = auth.currentUser;
  const hostSnapshot = await getDoc(doc(db, "users", input.hostId));
  if (!hostSnapshot.exists()) {
    throw new Error("Host profile not found.");
  }

  const host = hostSnapshot.data() as Record<string, unknown>;
  const business = (host.business as Record<string, unknown> | undefined) ?? {};
  const selectedOffer =
    input.type === "consultation"
      ? normalizeOffer(business.consultation as Partial<BusinessOffer> | undefined)
      : normalizeOffer(business.training as Partial<BusinessOffer> | undefined);

  if (!selectedOffer.enabled) {
    throw new Error("That booking type is not active right now.");
  }

  await addDoc(collection(db, "bookings"), {
    hostId: input.hostId,
    hostName: String(host.displayName ?? "Creator"),
    requesterId: requester.uid,
    requesterName: requester.displayName || "HoopLink User",
    type: input.type,
    scheduledFor: input.scheduledFor,
    priceLabel: selectedOffer.priceLabel,
    note: input.note.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });

  await createNotification({
    type: "booking",
    recipientId: input.hostId,
    actorId: requester.uid,
    actorName: requester.displayName || "HoopLink User",
    actorAvatar: requester.photoURL || "",
    message: `${requester.displayName || "Someone"} requested a ${input.type} booking.`,
  });
}

export function subscribeToIncomingBookings(
  hostId: string,
  callback: (bookings: BookingRequestRecord[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const bookingsQuery = query(
    collection(db, "bookings"),
    where("hostId", "==", hostId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(
    bookingsQuery,
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
    callback(
      snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
        mapBooking(docSnapshot.id, docSnapshot.data())
      )
    );
    }
  );
}

export function subscribeToOutgoingBookings(
  requesterId: string,
  callback: (bookings: BookingRequestRecord[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const bookingsQuery = query(
    collection(db, "bookings"),
    where("requesterId", "==", requesterId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(
    bookingsQuery,
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
    callback(
      snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
        mapBooking(docSnapshot.id, docSnapshot.data())
      )
    );
    }
  );
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingRequestRecord["status"]
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(
    doc(db, "bookings", bookingId),
    {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid,
    },
    { merge: true }
  );
}

export async function createWaitlistEntry(input: {
  name: string;
  email: string;
  role: string;
  note: string;
}) {
  if (!db) {
    throw new Error("Database unavailable.");
  }

  await addDoc(collection(db, "waitlist"), {
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role.trim(),
    note: input.note.trim(),
    status: "new",
    createdAt: serverTimestamp(),
  });
}

export function subscribeToWaitlistEntries(
  callback: (entries: WaitlistEntryRecord[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const waitlistQuery = query(collection(db, "waitlist"), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(
    waitlistQuery,
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
    callback(
      snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        return {
          id: docSnapshot.id,
          name: String(data.name ?? ""),
          email: String(data.email ?? ""),
          role: String(data.role ?? ""),
          note: String(data.note ?? ""),
          status: data.status === "reviewed" ? "reviewed" : "new",
          createdAt:
            (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ??
            null,
        } satisfies WaitlistEntryRecord;
      })
    );
    }
  );
}
