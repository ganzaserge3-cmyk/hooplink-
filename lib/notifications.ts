import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

async function getRecipientNotificationPreferences(recipientId: string) {
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "users", recipientId));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const settings = (data.settings as Record<string, unknown> | undefined) ?? {};
  return (settings.notificationPreferences as Record<string, unknown> | undefined) ?? null;
}

export interface AppNotification {
  id: string;
  type: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  message: string;
  postId?: string | null;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  actionLabel?: string | null;
  actionUrl?: string | null;
  readBy?: string[];
  archivedBy?: string[];
  deletedBy?: string[];
  snoozedUntilBy?: Record<string, { seconds?: number; nanoseconds?: number } | null>;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface NotificationDigest {
  total: number;
  unread: number;
  byType: Array<{ type: string; count: number }>;
}

export type NotificationCategory =
  | "social"
  | "recruiting"
  | "team_updates"
  | "bookings"
  | "safety_compliance"
  | "performance_wellness"
  | "messages";

export type NotificationPriority = "urgent" | "important" | "info";

export interface SmartNotificationDigest {
  unreadByCategory: Array<{ category: NotificationCategory; count: number }>;
  urgentItems: AppNotification[];
  topUpdates: string[];
}

export interface PushDeviceRecord {
  id: string;
  userId: string;
  label: string;
  token: string;
  platform: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

type ListenerCleanup = () => void;

const notificationMetadata: Record<
  string,
  {
    category: NotificationCategory;
    priority: NotificationPriority;
    actionLabel: string;
    actionUrl: (notification: Pick<AppNotification, "actorId" | "postId" | "type">) => string;
    groupKey?: string;
  }
> = {
  like: {
    category: "social",
    priority: "info",
    actionLabel: "View post",
    actionUrl: () => "/feed",
    groupKey: "post",
  },
  comment: {
    category: "social",
    priority: "important",
    actionLabel: "View comments",
    actionUrl: () => "/feed",
    groupKey: "post",
  },
  mention: {
    category: "social",
    priority: "important",
    actionLabel: "Open mention",
    actionUrl: () => "/feed",
    groupKey: "post",
  },
  follow: {
    category: "social",
    priority: "important",
    actionLabel: "Follow back",
    actionUrl: (notification) => `/profile/${notification.actorId}`,
  },
  repost: {
    category: "social",
    priority: "info",
    actionLabel: "View repost",
    actionUrl: () => "/feed",
    groupKey: "post",
  },
  poll_vote: {
    category: "social",
    priority: "info",
    actionLabel: "View poll",
    actionUrl: () => "/feed",
    groupKey: "post",
  },
  profile_view: {
    category: "recruiting",
    priority: "important",
    actionLabel: "View profile",
    actionUrl: (notification) => `/profile/${notification.actorId}`,
  },
  message: {
    category: "messages",
    priority: "important",
    actionLabel: "Reply",
    actionUrl: () => "/messages",
    groupKey: "actor",
  },
  booking: {
    category: "bookings",
    priority: "important",
    actionLabel: "View booking",
    actionUrl: () => "/bookings",
    groupKey: "actor",
  },
  report: {
    category: "safety_compliance",
    priority: "urgent",
    actionLabel: "Review case",
    actionUrl: () => "/safety-ops",
  },
  team_rsvp: {
    category: "team_updates",
    priority: "important",
    actionLabel: "Respond now",
    actionUrl: () => "/teams",
    groupKey: "actor",
  },
  coach_feedback: {
    category: "performance_wellness",
    priority: "important",
    actionLabel: "View feedback",
    actionUrl: () => "/performance",
    groupKey: "actor",
  },
  subscription: {
    category: "recruiting",
    priority: "info",
    actionLabel: "Open creator hub",
    actionUrl: () => "/studio",
  },
  premium_group: {
    category: "team_updates",
    priority: "important",
    actionLabel: "Open group",
    actionUrl: () => "/groups",
  },
  campaign_application: {
    category: "recruiting",
    priority: "important",
    actionLabel: "Approve request",
    actionUrl: () => "/business",
    groupKey: "actor",
  },
  campaign_review: {
    category: "recruiting",
    priority: "important",
    actionLabel: "View decision",
    actionUrl: () => "/business",
    groupKey: "actor",
  },
  tip: {
    category: "social",
    priority: "info",
    actionLabel: "Open support",
    actionUrl: () => "/billing",
  },
  wellness_alert: {
    category: "performance_wellness",
    priority: "urgent",
    actionLabel: "Review alert",
    actionUrl: () => "/wellness",
  },
};

function getNotificationMetadata(notification: Pick<AppNotification, "type" | "actorId" | "postId">) {
  const metadata = notificationMetadata[notification.type];
  if (metadata) {
    return metadata;
  }

  return {
    category: "social" as NotificationCategory,
    priority: "info" as NotificationPriority,
    actionLabel: notification.postId ? "Open feed" : "Open profile",
    actionUrl: () => (notification.postId ? "/feed" : `/profile/${notification.actorId}`),
  };
}

function hydrateNotification(notification: AppNotification): AppNotification {
  const metadata = getNotificationMetadata(notification);
  return {
    ...notification,
    category: notification.category ?? metadata.category,
    priority: notification.priority ?? metadata.priority,
    actionLabel: notification.actionLabel ?? metadata.actionLabel,
    actionUrl: notification.actionUrl ?? metadata.actionUrl(notification),
  };
}

function parseNotificationRecord(id: string, data: Record<string, unknown>): AppNotification {
  return hydrateNotification({
    id,
    type: String(data.type ?? ""),
    recipientId: String(data.recipientId ?? ""),
    actorId: String(data.actorId ?? ""),
    actorName: String(data.actorName ?? "HoopLink User"),
    actorAvatar: String(data.actorAvatar ?? ""),
    message: String(data.message ?? ""),
    postId: data.postId ? String(data.postId) : null,
    category: typeof data.category === "string" ? (data.category as NotificationCategory) : undefined,
    priority:
      data.priority === "urgent" || data.priority === "important" || data.priority === "info"
        ? (data.priority as NotificationPriority)
        : undefined,
    actionLabel: data.actionLabel ? String(data.actionLabel) : null,
    actionUrl: data.actionUrl ? String(data.actionUrl) : null,
    readBy: Array.isArray(data.readBy) ? (data.readBy as string[]) : [],
    archivedBy: Array.isArray(data.archivedBy) ? (data.archivedBy as string[]) : [],
    deletedBy: Array.isArray(data.deletedBy) ? (data.deletedBy as string[]) : [],
    snoozedUntilBy:
      typeof data.snoozedUntilBy === "object" && data.snoozedUntilBy
        ? (data.snoozedUntilBy as Record<string, { seconds?: number; nanoseconds?: number } | null>)
        : {},
    createdAt:
      (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
  });
}

function isNotificationVisibleToUser(notification: AppNotification, userId: string, includeArchived = false) {
  if (notification.deletedBy?.includes(userId)) {
    return false;
  }

  const snoozedUntil = notification.snoozedUntilBy?.[userId];
  const snoozedUntilMs =
    snoozedUntil?.seconds != null
      ? snoozedUntil.seconds * 1000 + Math.floor((snoozedUntil.nanoseconds ?? 0) / 1_000_000)
      : 0;

  if (snoozedUntilMs > Date.now()) {
    return false;
  }

  if (!includeArchived && notification.archivedBy?.includes(userId)) {
    return false;
  }

  return true;
}

export async function createNotification(input: {
  type: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  message: string;
  postId?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  actionLabel?: string;
  actionUrl?: string;
}) {
  if (!db || input.recipientId === input.actorId) {
    return;
  }

  const preferences = await getRecipientNotificationPreferences(input.recipientId);
  const preferenceKeyMap: Record<string, string> = {
    like: "likes",
    comment: "comments",
    follow: "follows",
    message: "messages",
    booking: "bookings",
    repost: "reposts",
    report: "reports",
    mention: "comments",
    poll_vote: "comments",
    profile_view: "recruiting",
    campaign_application: "recruiting",
    campaign_review: "recruiting",
    subscription: "recruiting",
    premium_group: "teamUpdates",
    team_rsvp: "teamUpdates",
    coach_feedback: "performanceWellness",
    wellness_alert: "performanceWellness",
  };
  const preferenceKey = preferenceKeyMap[input.type];
  if (preferenceKey && preferences?.[preferenceKey] === false) {
    return;
  }

  const metadata = getNotificationMetadata({
    type: input.type,
    actorId: input.actorId,
    postId: input.postId ?? null,
  });

  await addDoc(collection(db, "notifications"), {
    ...input,
    postId: input.postId ?? null,
    category: input.category ?? metadata.category,
    priority: input.priority ?? metadata.priority,
    actionLabel: input.actionLabel ?? metadata.actionLabel,
    actionUrl: input.actionUrl ?? metadata.actionUrl(input),
    archivedBy: [],
    deletedBy: [],
    snoozedUntilBy: {},
    readBy: [],
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(notificationId: string) {
  if (!auth?.currentUser || !db) {
    return;
  }

  const snapshot = await getDoc(doc(db, "notifications", notificationId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const readBy = Array.isArray(data.readBy) ? (data.readBy as string[]) : [];
  if (readBy.includes(auth.currentUser.uid)) {
    return;
  }

  await setDoc(
    doc(db, "notifications", notificationId),
    {
      readBy: [...readBy, auth.currentUser.uid],
    },
    { merge: true }
  );
}

export async function markAllNotificationsRead() {
  if (!auth?.currentUser || !db) {
    return;
  }

  const snapshot = await getDocs(
    query(collection(db, "notifications"), where("recipientId", "==", auth.currentUser.uid), limit(50))
  );

  await Promise.all(
    snapshot.docs.map(async (docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const readBy = Array.isArray(data.readBy) ? (data.readBy as string[]) : [];
      if (readBy.includes(auth.currentUser!.uid)) {
        return;
      }

      await setDoc(
        doc(db, "notifications", docSnapshot.id),
        {
          readBy: [...readBy, auth.currentUser!.uid],
        },
        { merge: true }
      );
    })
  );
}

export async function archiveNotification(notificationId: string) {
  if (!auth?.currentUser || !db) {
    return;
  }

  const snapshot = await getDoc(doc(db, "notifications", notificationId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const archivedBy = Array.isArray(data.archivedBy) ? (data.archivedBy as string[]) : [];
  if (archivedBy.includes(auth.currentUser.uid)) {
    return;
  }

  await setDoc(
    doc(db, "notifications", notificationId),
    {
      archivedBy: [...archivedBy, auth.currentUser.uid],
    },
    { merge: true }
  );
}

export async function deleteNotificationForUser(notificationId: string) {
  if (!auth?.currentUser || !db) {
    return;
  }

  const snapshot = await getDoc(doc(db, "notifications", notificationId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const deletedBy = Array.isArray(data.deletedBy) ? (data.deletedBy as string[]) : [];
  if (deletedBy.includes(auth.currentUser.uid)) {
    return;
  }

  await setDoc(
    doc(db, "notifications", notificationId),
    {
      deletedBy: [...deletedBy, auth.currentUser.uid],
    },
    { merge: true }
  );
}

export async function snoozeNotification(notificationId: string, hours = 24) {
  if (!auth?.currentUser || !db) {
    return;
  }

  await updateDoc(doc(db, "notifications", notificationId), {
    [`snoozedUntilBy.${auth.currentUser.uid}`]: Timestamp.fromDate(
      new Date(Date.now() + hours * 60 * 60 * 1000)
    ),
  });
}

export function subscribeToNotifications(
  recipientId: string,
  callback: (notifications: AppNotification[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const notificationsQuery = query(
    collection(db, "notifications"),
    where("recipientId", "==", recipientId),
    limit(50)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(
        snapshot.docs
          .map((docSnapshot) => parseNotificationRecord(docSnapshot.id, docSnapshot.data()))
          .sort((left, right) => {
            const leftSeconds = left.createdAt?.seconds ?? 0;
            const rightSeconds = right.createdAt?.seconds ?? 0;
            if (leftSeconds !== rightSeconds) {
              return rightSeconds - leftSeconds;
            }
            const leftNanos = left.createdAt?.nanoseconds ?? 0;
            const rightNanos = right.createdAt?.nanoseconds ?? 0;
            return rightNanos - leftNanos;
          })
      );
    }
  );
}

export function getCurrentNotificationRecipient() {
  return auth?.currentUser?.uid ?? null;
}

export async function getNotificationDigest() {
  const recipientId = auth?.currentUser?.uid;
  if (!db || !recipientId) {
    return { total: 0, unread: 0, byType: [] } satisfies NotificationDigest;
  }

  const snapshot = await getDocs(
    query(
      collection(db, "notifications"),
      where("recipientId", "==", recipientId),
      limit(50)
    )
  );

  const docs = [...snapshot.docs].sort((left, right) => {
    const leftData = left.data() as Record<string, unknown>;
    const rightData = right.data() as Record<string, unknown>;
    const leftCreatedAt =
      (leftData.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null;
    const rightCreatedAt =
      (rightData.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null;
    const leftSeconds = leftCreatedAt?.seconds ?? 0;
    const rightSeconds = rightCreatedAt?.seconds ?? 0;
    if (leftSeconds !== rightSeconds) {
      return rightSeconds - leftSeconds;
    }
    const leftNanos = leftCreatedAt?.nanoseconds ?? 0;
    const rightNanos = rightCreatedAt?.nanoseconds ?? 0;
    return rightNanos - leftNanos;
  });

  const counts = new Map<string, number>();
  let unread = 0;

  docs.forEach((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const notification = parseNotificationRecord(docSnapshot.id, docSnapshot.data() as Record<string, unknown>);
    if (!isNotificationVisibleToUser(notification, recipientId)) {
      return;
    }

    const type = String(notification.type ?? "activity");
    counts.set(type, (counts.get(type) ?? 0) + 1);
    const readBy = Array.isArray(notification.readBy) ? (notification.readBy as string[]) : [];
    if (!readBy.includes(recipientId)) {
      unread += 1;
    }
  });

  return {
    total: docs.length,
    unread,
    byType: Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([type, count]) => ({ type, count })),
  } satisfies NotificationDigest;
}

export function getSmartNotificationDigest(
  notifications: AppNotification[],
  userId: string
): SmartNotificationDigest {
  const visibleNotifications = notifications.filter((notification) =>
    isNotificationVisibleToUser(notification, userId)
  );
  const unreadByCategory = new Map<NotificationCategory, number>();

  visibleNotifications.forEach((notification) => {
    if (!notification.readBy?.includes(userId) && notification.category) {
      unreadByCategory.set(
        notification.category,
        (unreadByCategory.get(notification.category) ?? 0) + 1
      );
    }
  });

  const urgentItems = visibleNotifications.filter((notification) => notification.priority === "urgent");

  const topUpdates = Array.from(
    visibleNotifications.reduce((groups, notification) => {
      const key = `${notification.type}:${notification.postId ?? notification.actorId ?? notification.id}`;
      groups.set(key, [...(groups.get(key) ?? []), notification]);
      return groups;
    }, new Map<string, AppNotification[]>()).values()
  )
    .sort((left, right) => right.length - left.length)
    .slice(0, 3)
    .map((group) =>
      group.length > 1
        ? `${group.length} ${group[0].type.replace(/_/g, " ")} updates`
        : group[0].message
    );

  return {
    unreadByCategory: Array.from(unreadByCategory.entries()).map(([category, count]) => ({
      category,
      count,
    })),
    urgentItems: urgentItems.slice(0, 3),
    topUpdates,
  };
}

export function getVisibleNotifications(
  notifications: AppNotification[],
  userId: string,
  options?: { includeArchived?: boolean }
) {
  return notifications.filter((notification) =>
    isNotificationVisibleToUser(notification, userId, options?.includeArchived)
  );
}

export async function registerPushDevice(input: {
  label: string;
  token: string;
  platform?: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await addDoc(collection(db, "pushDevices"), {
    userId: auth.currentUser.uid,
    label: input.label.trim(),
    token: input.token.trim(),
    platform: input.platform?.trim() || "web",
    createdAt: serverTimestamp(),
  });
}

export async function getPushDevices() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, "pushDevices"),
      where("userId", "==", auth.currentUser.uid),
      limit(20)
    )
  );

  return snapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        userId: String(data.userId ?? ""),
        label: String(data.label ?? ""),
        token: String(data.token ?? ""),
        platform: String(data.platform ?? "web"),
        createdAt:
          (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
      } satisfies PushDeviceRecord;
    })
    .sort((left: PushDeviceRecord, right: PushDeviceRecord) => {
      const leftSeconds = left.createdAt?.seconds ?? 0;
      const rightSeconds = right.createdAt?.seconds ?? 0;
      if (leftSeconds !== rightSeconds) {
        return rightSeconds - leftSeconds;
      }
      const leftNanos = left.createdAt?.nanoseconds ?? 0;
      const rightNanos = right.createdAt?.nanoseconds ?? 0;
      return rightNanos - leftNanos;
    });
}

export async function sendTestEmailDigest(recipientEmail: string, digest: NotificationDigest) {
  const response = await fetch("/api/notifications/digest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientEmail,
      digest,
    }),
  });

  if (!response.ok) {
    throw new Error("Email digest request failed.");
  }

  return response.json();
}

export async function sendTestPushAlert(input: {
  token: string;
  title: string;
  body: string;
}) {
  const response = await fetch("/api/notifications/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Push delivery request failed.");
  }

  return response.json();
}
