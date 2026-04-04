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
import { createNotification } from "@/lib/notifications";

export type BookingServiceType = "training" | "consultation" | "facility" | "camp" | "tryout";
export type ProviderRole = "coach" | "trainer" | "facility" | "camp" | "tryout";

export interface BusinessOffer {
  enabled: boolean;
  title: string;
  priceLabel: string;
  durationMinutes: number;
  checkoutUrl: string;
  locationLabel: string;
  capacity: number;
  depositLabel: string;
  allowWaitlist: boolean;
}

export interface ClassPackageRecord {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  sessionCount: number;
}

export interface AffiliateLinkRecord {
  id: string;
  label: string;
  url: string;
  commissionLabel: string;
}

export interface CreatorBusinessProfile {
  supportUrl: string;
  merchUrl: string;
  collaborationPitch: string;
  providerRoles: ProviderRole[];
  providerCity: string;
  providerRegion: string;
  providerCountry: string;
  discoveryTags: string[];
  trustedProvider: boolean;
  calendarSyncUrl: string;
  autoReplyMessage: string;
  bookingReminderHours: number;
  training: BusinessOffer;
  consultation: BusinessOffer;
  facility: BusinessOffer;
  camp: BusinessOffer;
  tryout: BusinessOffer;
  classPackages: ClassPackageRecord[];
  affiliateLinks: AffiliateLinkRecord[];
  advancedCommerceOps: Record<string, string[]>;
}

export interface BookingRequestRecord {
  id: string;
  hostId: string;
  hostName: string;
  requesterId: string;
  requesterName: string;
  type: BookingServiceType;
  scheduledFor: string;
  priceLabel: string;
  note: string;
  status: "pending" | "accepted" | "declined" | "completed" | "waitlisted" | "reschedule_requested";
  packageName: string;
  promoCode: string;
  depositLabel: string;
  reminderScheduled: boolean;
  rescheduleRequestedFor: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface DiscoverableProviderRecord {
  uid: string;
  displayName: string;
  roleLabel: string;
  sport: string;
  location: string;
  providerRoles: ProviderRole[];
  trustedProvider: boolean;
  discoveryTags: string[];
  offers: Array<{
    type: BookingServiceType;
    title: string;
    priceLabel: string;
    depositLabel: string;
  }>;
}

export interface BookingWaitlistEntryRecord {
  id: string;
  hostId: string;
  requesterId: string;
  requesterName: string;
  type: BookingServiceType;
  requestedFor: string;
  note: string;
  status: "waiting" | "promoted";
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

function isMissingIndexError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  const message = "message" in error ? String(error.message ?? "") : "";
  return code === "failed-precondition" && message.toLowerCase().includes("requires an index");
}

function compareCreatedAtDescending<
  T extends {
    createdAt?: { seconds?: number; nanoseconds?: number } | null;
  },
>(left: T, right: T) {
  const leftSeconds = left.createdAt?.seconds ?? 0;
  const rightSeconds = right.createdAt?.seconds ?? 0;
  if (leftSeconds !== rightSeconds) {
    return rightSeconds - leftSeconds;
  }

  const leftNanos = left.createdAt?.nanoseconds ?? 0;
  const rightNanos = right.createdAt?.nanoseconds ?? 0;
  return rightNanos - leftNanos;
}

type ListenerCleanup = () => void;
type FirestoreDocSnapshot = {
  id: string;
  data: () => Record<string, unknown>;
};

const defaultOffer: BusinessOffer = {
  enabled: false,
  title: "",
  priceLabel: "",
  durationMinutes: 45,
  checkoutUrl: "",
  locationLabel: "",
  capacity: 1,
  depositLabel: "",
  allowWaitlist: false,
};

const defaultBusinessProfile: CreatorBusinessProfile = {
  supportUrl: "",
  merchUrl: "",
  collaborationPitch: "",
  providerRoles: [],
  providerCity: "",
  providerRegion: "",
  providerCountry: "",
  discoveryTags: [],
  trustedProvider: false,
  calendarSyncUrl: "",
  autoReplyMessage: "",
  bookingReminderHours: 24,
  training: defaultOffer,
  consultation: defaultOffer,
  facility: defaultOffer,
  camp: defaultOffer,
  tryout: defaultOffer,
  classPackages: [],
  affiliateLinks: [],
  advancedCommerceOps: {},
};

function mapTimestamp(data: Record<string, unknown>, key: string) {
  return (data[key] as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null;
}

function mapBooking(id: string, data: Record<string, unknown>): BookingRequestRecord {
  return {
    id,
    hostId: String(data.hostId ?? ""),
    hostName: String(data.hostName ?? "Creator"),
    requesterId: String(data.requesterId ?? ""),
    requesterName: String(data.requesterName ?? "Member"),
    type:
      data.type === "consultation" ||
      data.type === "facility" ||
      data.type === "camp" ||
      data.type === "tryout"
        ? data.type
        : "training",
    scheduledFor: String(data.scheduledFor ?? ""),
    priceLabel: String(data.priceLabel ?? ""),
    note: String(data.note ?? ""),
    status:
      data.status === "accepted" ||
      data.status === "declined" ||
      data.status === "completed" ||
      data.status === "waitlisted" ||
      data.status === "reschedule_requested"
        ? data.status
        : "pending",
    packageName: String(data.packageName ?? ""),
    promoCode: String(data.promoCode ?? ""),
    depositLabel: String(data.depositLabel ?? ""),
    reminderScheduled: data.reminderScheduled === true,
    rescheduleRequestedFor: String(data.rescheduleRequestedFor ?? ""),
    createdAt: mapTimestamp(data, "createdAt"),
  };
}

function normalizeOffer(input?: Partial<BusinessOffer>): BusinessOffer {
  return {
    enabled: input?.enabled === true,
    title: String(input?.title ?? ""),
    priceLabel: String(input?.priceLabel ?? ""),
    durationMinutes: Math.max(15, Number(input?.durationMinutes ?? 45)),
    checkoutUrl: String(input?.checkoutUrl ?? ""),
    locationLabel: String(input?.locationLabel ?? ""),
    capacity: Math.max(1, Number(input?.capacity ?? 1)),
    depositLabel: String(input?.depositLabel ?? ""),
    allowWaitlist: input?.allowWaitlist === true,
  };
}

function normalizePackages(input?: ClassPackageRecord[]) {
  return (input ?? [])
    .map((entry, index) => ({
      id: entry.id || `package-${index + 1}`,
      name: String(entry.name ?? "").trim(),
      description: String(entry.description ?? "").trim(),
      priceLabel: String(entry.priceLabel ?? "").trim(),
      sessionCount: Math.max(1, Number(entry.sessionCount ?? 1)),
    }))
    .filter((entry) => entry.name);
}

function normalizeAffiliateLinks(input?: AffiliateLinkRecord[]) {
  return (input ?? [])
    .map((entry, index) => ({
      id: entry.id || `affiliate-${index + 1}`,
      label: String(entry.label ?? "").trim(),
      url: String(entry.url ?? "").trim(),
      commissionLabel: String(entry.commissionLabel ?? "").trim(),
    }))
    .filter((entry) => entry.label && entry.url);
}

function mapBusinessProfile(data: Record<string, unknown>): CreatorBusinessProfile {
  const business = (data.business as Record<string, unknown> | undefined) ?? {};
  return {
    supportUrl: String(business.supportUrl ?? ""),
    merchUrl: String(business.merchUrl ?? ""),
    collaborationPitch: String(business.collaborationPitch ?? ""),
    providerRoles: Array.isArray(business.providerRoles)
      ? (business.providerRoles as ProviderRole[]).filter(Boolean)
      : [],
    providerCity: String(business.providerCity ?? ""),
    providerRegion: String(business.providerRegion ?? ""),
    providerCountry: String(business.providerCountry ?? ""),
    discoveryTags: Array.isArray(business.discoveryTags)
      ? (business.discoveryTags as string[]).map((item) => item.trim()).filter(Boolean)
      : [],
    trustedProvider: business.trustedProvider === true,
    calendarSyncUrl: String(business.calendarSyncUrl ?? ""),
    autoReplyMessage: String(business.autoReplyMessage ?? ""),
    bookingReminderHours: Math.max(1, Number(business.bookingReminderHours ?? 24)),
    training: normalizeOffer(business.training as Partial<BusinessOffer> | undefined),
    consultation: normalizeOffer(business.consultation as Partial<BusinessOffer> | undefined),
    facility: normalizeOffer(business.facility as Partial<BusinessOffer> | undefined),
    camp: normalizeOffer(business.camp as Partial<BusinessOffer> | undefined),
    tryout: normalizeOffer(business.tryout as Partial<BusinessOffer> | undefined),
    classPackages: normalizePackages(business.classPackages as ClassPackageRecord[] | undefined),
    affiliateLinks: normalizeAffiliateLinks(business.affiliateLinks as AffiliateLinkRecord[] | undefined),
    advancedCommerceOps:
      business.advancedCommerceOps && typeof business.advancedCommerceOps === "object"
        ? Object.fromEntries(
            Object.entries(business.advancedCommerceOps as Record<string, unknown>).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.map(String).filter(Boolean) : [],
            ]),
          )
        : {},
  };
}

function getOfferFromProfile(profile: CreatorBusinessProfile, type: BookingServiceType) {
  switch (type) {
    case "consultation":
      return profile.consultation;
    case "facility":
      return profile.facility;
    case "camp":
      return profile.camp;
    case "tryout":
      return profile.tryout;
    default:
      return profile.training;
  }
}

export async function getCurrentUserBusinessProfile() {
  if (!auth?.currentUser || !db) {
    return defaultBusinessProfile;
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  if (!snapshot.exists()) {
    return defaultBusinessProfile;
  }

  return mapBusinessProfile(snapshot.data() as Record<string, unknown>);
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
        providerRoles: Array.from(new Set(input.providerRoles)),
        providerCity: input.providerCity.trim(),
        providerRegion: input.providerRegion.trim(),
        providerCountry: input.providerCountry.trim(),
        discoveryTags: Array.from(new Set(input.discoveryTags.map((item) => item.trim()).filter(Boolean))),
        trustedProvider: input.trustedProvider === true,
        calendarSyncUrl: input.calendarSyncUrl.trim(),
        autoReplyMessage: input.autoReplyMessage.trim(),
        bookingReminderHours: Math.max(1, Number(input.bookingReminderHours || 24)),
        training: normalizeOffer(input.training),
        consultation: normalizeOffer(input.consultation),
        facility: normalizeOffer(input.facility),
        camp: normalizeOffer(input.camp),
        tryout: normalizeOffer(input.tryout),
        classPackages: normalizePackages(input.classPackages),
        affiliateLinks: normalizeAffiliateLinks(input.affiliateLinks),
        advancedCommerceOps:
          input.advancedCommerceOps && typeof input.advancedCommerceOps === "object"
            ? Object.fromEntries(
                Object.entries(input.advancedCommerceOps).map(([key, value]) => [
                  key,
                  Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [],
                ]),
              )
            : {},
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function createBookingRequest(input: {
  hostId: string;
  type: BookingServiceType;
  scheduledFor: string;
  note: string;
  packageName?: string;
  promoCode?: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const requester = auth.currentUser;
  const hostSnapshot = await getDoc(doc(db, "users", input.hostId));
  if (!hostSnapshot.exists()) {
    throw new Error("Host profile not found.");
  }

  const hostData = hostSnapshot.data() as Record<string, unknown>;
  const businessProfile = mapBusinessProfile(hostData);
  const selectedOffer = getOfferFromProfile(businessProfile, input.type);

  if (!selectedOffer.enabled) {
    throw new Error("That booking type is not active right now.");
  }

  await addDoc(collection(db, "bookings"), {
    hostId: input.hostId,
    hostName: String(hostData.displayName ?? "Creator"),
    requesterId: requester.uid,
    requesterName: requester.displayName || "HoopLink User",
    type: input.type,
    scheduledFor: input.scheduledFor,
    priceLabel: selectedOffer.priceLabel,
    note: input.note.trim(),
    status: "pending",
    packageName: String(input.packageName ?? "").trim(),
    promoCode: String(input.promoCode ?? "").trim().toUpperCase(),
    depositLabel: selectedOffer.depositLabel,
    reminderScheduled: businessProfile.bookingReminderHours > 0,
    rescheduleRequestedFor: "",
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

export async function rescheduleBookingRequest(bookingId: string, nextDateTime: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "bookings", bookingId));
  if (!snapshot.exists()) {
    throw new Error("Booking not found.");
  }

  const booking = mapBooking(snapshot.id, snapshot.data() as Record<string, unknown>);
  await setDoc(
    doc(db, "bookings", bookingId),
    {
      status: "reschedule_requested",
      rescheduleRequestedFor: nextDateTime,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid,
    },
    { merge: true }
  );

  const notifyTarget = auth.currentUser.uid === booking.hostId ? booking.requesterId : booking.hostId;
  await createNotification({
    type: "booking",
    recipientId: notifyTarget,
    actorId: auth.currentUser.uid,
    actorName: auth.currentUser.displayName || "HoopLink User",
    actorAvatar: auth.currentUser.photoURL || "",
    message: `${auth.currentUser.displayName || "Someone"} requested to reschedule ${booking.type}.`,
  });
}

export async function joinBookingWaitlist(input: {
  hostId: string;
  type: BookingServiceType;
  requestedFor: string;
  note: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await addDoc(collection(db, "bookingWaitlists"), {
    hostId: input.hostId,
    requesterId: auth.currentUser.uid,
    requesterName: auth.currentUser.displayName || "HoopLink User",
    type: input.type,
    requestedFor: input.requestedFor,
    note: input.note.trim(),
    status: "waiting",
    createdAt: serverTimestamp(),
  });
}

export async function getIncomingBookingWaitlist(hostId: string) {
  if (!db) {
    return [];
  }

  let snapshot;

  try {
    snapshot = await getDocs(
      query(collection(db, "bookingWaitlists"), where("hostId", "==", hostId), orderBy("createdAt", "desc"), limit(50))
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db, "bookingWaitlists"), limit(100)));
  }

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        hostId: String(data.hostId ?? ""),
        requesterId: String(data.requesterId ?? ""),
        requesterName: String(data.requesterName ?? "HoopLink User"),
        type:
          data.type === "consultation" ||
          data.type === "facility" ||
          data.type === "camp" ||
          data.type === "tryout"
            ? data.type
            : "training",
        requestedFor: String(data.requestedFor ?? ""),
        note: String(data.note ?? ""),
        status: data.status === "promoted" ? "promoted" : "waiting",
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies BookingWaitlistEntryRecord;
    })
    .filter((entry: BookingWaitlistEntryRecord) => entry.hostId === hostId)
    .sort(compareCreatedAtDescending)
    .slice(0, 50);
}

export async function getDiscoverableProviders(searchTerm = "", locationFilter = "") {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "users"), limit(60)));
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedLocation = locationFilter.trim().toLowerCase();

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const businessProfile = mapBusinessProfile(data);
      const offers = (["training", "consultation", "facility", "camp", "tryout"] as BookingServiceType[])
        .map((type) => ({ type, offer: getOfferFromProfile(businessProfile, type) }))
        .filter(({ offer }) => offer.enabled)
        .map(({ type, offer }) => ({
          type,
          title: offer.title || type,
          priceLabel: offer.priceLabel,
          depositLabel: offer.depositLabel,
        }));

      return {
        uid: String(data.uid ?? docSnapshot.id),
        displayName: String(data.displayName ?? "HoopLink Provider"),
        roleLabel: String((data.role as { type?: string } | undefined)?.type ?? "member"),
        sport: String((data.role as { sport?: string } | undefined)?.sport ?? ""),
        location: [businessProfile.providerCity, businessProfile.providerRegion, businessProfile.providerCountry]
          .filter(Boolean)
          .join(", ") || String(data.location ?? ""),
        providerRoles: businessProfile.providerRoles,
        trustedProvider: businessProfile.trustedProvider,
        discoveryTags: businessProfile.discoveryTags,
        offers,
      } satisfies DiscoverableProviderRecord;
    })
    .filter((provider) => provider.offers.length > 0)
    .filter((provider) => {
      const haystack = [
        provider.displayName,
        provider.roleLabel,
        provider.sport,
        provider.location,
        ...provider.providerRoles,
        ...provider.discoveryTags,
      ]
        .join(" ")
        .toLowerCase();

      if (normalizedSearch && !haystack.includes(normalizedSearch)) {
        return false;
      }

      if (normalizedLocation && !provider.location.toLowerCase().includes(normalizedLocation)) {
        return false;
      }

      return true;
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

  const mapBookings = (docs: Array<{ id: string; data: () => Record<string, unknown> }>) =>
    docs
      .map((docSnapshot) => mapBooking(docSnapshot.id, docSnapshot.data() as Record<string, unknown>))
      .filter((booking) => booking.hostId === hostId)
      .sort(compareCreatedAtDescending)
      .slice(0, 50);

  try {
    return onSnapshot(
      bookingsQuery,
      (snapshot) => {
        callback(
          mapBookings(snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>)
        );
      },
      (error: unknown) => {
        if (!isMissingIndexError(error)) {
          callback([]);
          return;
        }

        void getDocs(query(collection(db, "bookings"), limit(150))).then((snapshot) => {
          callback(
            mapBookings(
              snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>
            )
          );
        });
      }
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      callback([]);
      return () => undefined;
    }

    void getDocs(query(collection(db, "bookings"), limit(150))).then((snapshot) => {
      callback(
        mapBookings(
          snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>
        )
      );
    });
    return () => undefined;
  }
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

  const mapBookings = (docs: Array<{ id: string; data: () => Record<string, unknown> }>) =>
    docs
      .map((docSnapshot) => mapBooking(docSnapshot.id, docSnapshot.data() as Record<string, unknown>))
      .filter((booking) => booking.requesterId === requesterId)
      .sort(compareCreatedAtDescending)
      .slice(0, 50);

  try {
    return onSnapshot(
      bookingsQuery,
      (snapshot) => {
        callback(
          mapBookings(snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>)
        );
      },
      (error: unknown) => {
        if (!isMissingIndexError(error)) {
          callback([]);
          return;
        }

        void getDocs(query(collection(db, "bookings"), limit(150))).then((snapshot) => {
          callback(
            mapBookings(
              snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>
            )
          );
        });
      }
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      callback([]);
      return () => undefined;
    }

    void getDocs(query(collection(db, "bookings"), limit(150))).then((snapshot) => {
      callback(
        mapBookings(
          snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>
        )
      );
    });
    return () => undefined;
  }
}

export async function updateBookingStatus(bookingId: string, status: BookingRequestRecord["status"]) {
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
  return onSnapshot(waitlistQuery, (snapshot) => {
    callback(
      snapshot.docs.map((docSnapshot: FirestoreDocSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        return {
          id: docSnapshot.id,
          name: String(data.name ?? ""),
          email: String(data.email ?? ""),
          role: String(data.role ?? ""),
          note: String(data.note ?? ""),
          status: data.status === "reviewed" ? "reviewed" : "new",
          createdAt: mapTimestamp(data, "createdAt"),
        } satisfies WaitlistEntryRecord;
      })
    );
  });
}
