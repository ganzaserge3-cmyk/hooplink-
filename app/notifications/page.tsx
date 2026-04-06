"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AppNotification,
  archiveNotification,
  deleteNotificationForUser,
  getSmartNotificationDigest,
  getVisibleNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationCategory,
  snoozeNotification,
  subscribeToNotifications,
} from "@/lib/notifications";
import { formatTimeAgo } from "@/lib/posts";
import {
  getCurrentUserSettings,
  updateCurrentUserSettings,
  type UserSettings,
} from "@/lib/settings";

type NotificationFilter = "all" | "unread" | "archived" | NotificationCategory;

type NotificationGroup = {
  key: string;
  notifications: AppNotification[];
  actionLabel: string;
  actionUrl: string;
  actorAvatar: string;
  actorName: string;
  category: NotificationCategory;
  priority: "urgent" | "important" | "info";
  message: string;
  unread: boolean;
  newestCreatedAt?: AppNotification["createdAt"];
  types: string[];
};

const filterLabels: Record<NotificationFilter, string> = {
  all: "All",
  unread: "Unread",
  archived: "Archived",
  messages: "Messages",
  social: "Social",
  recruiting: "Recruiting",
  team_updates: "Team updates",
  bookings: "Bookings",
  safety_compliance: "Safety",
  performance_wellness: "Wellness",
};

const categoryLabels: Record<NotificationCategory, string> = {
  messages: "Messages",
  social: "Social",
  recruiting: "Recruiting",
  team_updates: "Team updates",
  bookings: "Bookings",
  safety_compliance: "Safety/compliance",
  performance_wellness: "Performance/wellness",
};

const preferenceLabels: Record<keyof UserSettings["notificationPreferences"], string> = {
  likes: "Likes",
  comments: "Comments",
  follows: "Follows",
  messages: "Messages",
  reposts: "Reposts",
  reports: "Reports",
  recruiting: "Recruiting",
  teamUpdates: "Team updates",
  bookings: "Bookings",
  safetyCompliance: "Safety/compliance",
  performanceWellness: "Performance/wellness",
};

const deliveryDescriptions: Record<UserSettings["notificationDeliveryMode"], string> = {
  off: "Keep everything in-app only.",
  push: "Deliver browser or device alerts only.",
  email: "Send digests by email only.",
  both: "Use both push alerts and email digests.",
};

function getPriorityRank(priority: NotificationGroup["priority"]) {
  if (priority === "urgent") {
    return 3;
  }
  if (priority === "important") {
    return 2;
  }
  return 1;
}

function buildGroupMessage(notifications: AppNotification[]) {
  const [first] = notifications;
  const count = notifications.length;
  if (!first) {
    return "Notification";
  }

  if (count === 1) {
    return first.message;
  }

  switch (first.type) {
    case "message":
      return `${count} new messages from ${first.actorName}`;
    case "comment":
      return `${count} new comments on your highlight`;
    case "like":
      return `${count} people liked your post`;
    case "follow":
      return `${count} new followers`;
    case "booking":
      return `${count} booking updates`;
    case "campaign_application":
      return `${count} campaign applications waiting`;
    case "campaign_review":
      return `${count} campaign review updates`;
    case "team_rsvp":
      return `${count} team RSVP reminders`;
    default:
      return `${count} ${first.type.replace(/_/g, " ")} updates`;
  }
}

function groupNotifications(notifications: AppNotification[], userId: string) {
  const groups = new Map<string, AppNotification[]>();

  notifications.forEach((notification) => {
    const groupKey = `${notification.type}:${notification.postId ?? notification.actorId ?? notification.actionUrl ?? notification.id}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), notification]);
  });

  return Array.from(groups.entries())
    .map(([key, entries]) => {
      const sortedEntries = [...entries].sort((left, right) => {
        const leftSeconds = left.createdAt?.seconds ?? 0;
        const rightSeconds = right.createdAt?.seconds ?? 0;
        if (leftSeconds !== rightSeconds) {
          return rightSeconds - leftSeconds;
        }

        const leftNanos = left.createdAt?.nanoseconds ?? 0;
        const rightNanos = right.createdAt?.nanoseconds ?? 0;
        return rightNanos - leftNanos;
      });

      const lead = sortedEntries[0];
      return {
        key,
        notifications: sortedEntries,
        actionLabel: lead.actionLabel ?? "Open",
        actionUrl: lead.actionUrl ?? (lead.postId ? "/feed" : `/profile/${lead.actorId}`),
        actorAvatar: lead.actorAvatar || "https://placehold.co/64x64?text=N",
        actorName: lead.actorName,
        category: lead.category ?? "social",
        priority: sortedEntries.reduce<NotificationGroup["priority"]>(
          (current, notification) =>
            getPriorityRank(notification.priority ?? "info") > getPriorityRank(current)
              ? (notification.priority ?? "info")
              : current,
          lead.priority ?? "info"
        ),
        message: buildGroupMessage(sortedEntries),
        unread: sortedEntries.some((notification) => !notification.readBy?.includes(userId)),
        newestCreatedAt: lead.createdAt,
        types: Array.from(new Set(sortedEntries.map((notification) => notification.type))),
      } satisfies NotificationGroup;
    })
    .sort((left, right) => {
      const leftSeconds = left.newestCreatedAt?.seconds ?? 0;
      const rightSeconds = right.newestCreatedAt?.seconds ?? 0;
      if (leftSeconds !== rightSeconds) {
        return rightSeconds - leftSeconds;
      }

      const leftNanos = left.newestCreatedAt?.nanoseconds ?? 0;
      const rightNanos = right.newestCreatedAt?.nanoseconds ?? 0;
      return rightNanos - leftNanos;
    });
}

function NotificationsPageContent() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    void getCurrentUserSettings().then(setSettings);
    return subscribeToNotifications(user.uid, setNotifications);
  }, [user]);

  const visibleNotifications = useMemo(() => {
    if (!user) {
      return [];
    }

    const includeArchived = filter === "archived";
    const base = getVisibleNotifications(notifications, user.uid, { includeArchived });
    if (filter === "archived") {
      return base.filter((notification) => notification.archivedBy?.includes(user.uid));
    }

    return base.filter((notification) => {
      if (notification.archivedBy?.includes(user.uid)) {
        return false;
      }

      if (filter === "unread") {
        return !notification.readBy?.includes(user.uid);
      }

      if (filter === "all") {
        return true;
      }

      return notification.category === filter;
    });
  }, [filter, notifications, user]);

  const groupedNotifications = useMemo(() => {
    if (!user) {
      return [];
    }

    return groupNotifications(visibleNotifications, user.uid);
  }, [user, visibleNotifications]);

  const smartDigest = useMemo(() => {
    if (!user) {
      return null;
    }

    return getSmartNotificationDigest(notifications, user.uid);
  }, [notifications, user]);

  const unreadCount = useMemo(() => {
    if (!user) {
      return 0;
    }

    return getVisibleNotifications(notifications, user.uid).filter(
      (notification) => !notification.readBy?.includes(user.uid)
    ).length;
  }, [notifications, user]);

  const updateSettings = async (patch: Partial<UserSettings>) => {
    if (!settings) {
      return;
    }

    const nextSettings = {
      ...settings,
      ...patch,
      notificationPreferences: {
        ...settings.notificationPreferences,
        ...patch.notificationPreferences,
      },
    };

    setSettings(nextSettings);
    setSavingSettings(true);
    try {
      await updateCurrentUserSettings(nextSettings);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeliveryModeChange = async (mode: UserSettings["notificationDeliveryMode"]) => {
    const emailDigestFrequency =
      mode === "email" || mode === "both"
        ? settings?.emailDigestFrequency === "off"
          ? "daily"
          : settings?.emailDigestFrequency ?? "daily"
        : "off";

    await updateSettings({
      notificationDeliveryMode: mode,
      emailDigestFrequency,
      pushNotificationsEnabled: mode === "push" || mode === "both",
    });
  };

  const applyToGroup = async (
    actionKey: string,
    group: NotificationGroup,
    callback: (notificationId: string) => Promise<void>
  ) => {
    setBusyAction(actionKey);
    try {
      await Promise.all(group.notifications.map((notification) => callback(notification.id)));
    } finally {
      setBusyAction(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      Grouped alerts, deep links, smart summaries, and quick actions in one place.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBusyAction("mark-all");
                        void markAllNotificationsRead().finally(() => setBusyAction(null));
                      }}
                      disabled={busyAction === "mark-all" || unreadCount === 0}
                    >
                      Mark all as read
                    </Button>
                    <Link href="/settings">
                      <Button size="sm" variant="outline">Open settings</Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(filterLabels) as NotificationFilter[]).map((value) => (
                    <Button
                      key={value}
                      variant={filter === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(value)}
                    >
                      {filterLabels[value]}
                    </Button>
                  ))}
                </div>

                {groupedNotifications.length === 0 ? (
                  <div className="rounded-xl bg-muted p-6 text-sm text-muted-foreground">
                    No notifications in this view.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupedNotifications.map((group) => (
                      <div
                        key={group.key}
                        className={`rounded-xl border p-4 ${group.unread ? "border-primary/40 bg-primary/5" : "bg-background"}`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={group.actorAvatar}
                            alt={group.actorName}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{categoryLabels[group.category]}</Badge>
                              <Badge
                                className={
                                  group.priority === "urgent"
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : group.priority === "important"
                                      ? "border-amber-200 bg-amber-50 text-amber-700"
                                      : "border-slate-200 bg-slate-50 text-slate-700"
                                }
                                variant="outline"
                              >
                                {group.priority}
                              </Badge>
                              {group.notifications.length > 1 ? (
                                <Badge variant="secondary">{group.notifications.length} grouped</Badge>
                              ) : null}
                            </div>

                            <div>
                              <p className="text-sm font-medium">{group.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimeAgo(group.newestCreatedAt)} by {group.actorName}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={group.actionUrl}
                                onClick={() =>
                                  void applyToGroup(`open-${group.key}`, group, markNotificationRead)
                                }
                              >
                                <Button size="sm">{group.actionLabel}</Button>
                              </Link>
                              {group.unread ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    void applyToGroup(`read-${group.key}`, group, markNotificationRead)
                                  }
                                  disabled={busyAction === `read-${group.key}`}
                                >
                                  Mark read
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void applyToGroup(`snooze-${group.key}`, group, (id) =>
                                    snoozeNotification(id, 24)
                                  )
                                }
                                disabled={busyAction === `snooze-${group.key}`}
                              >
                                Snooze 24h
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void applyToGroup(`archive-${group.key}`, group, archiveNotification)
                                }
                                disabled={busyAction === `archive-${group.key}`}
                              >
                                Archive
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  void applyToGroup(`delete-${group.key}`, group, deleteNotificationForUser)
                                }
                                disabled={busyAction === `delete-${group.key}`}
                              >
                                Delete
                              </Button>
                            </div>

                            {group.notifications.length > 1 ? (
                              <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                                {group.notifications
                                  .slice(0, 3)
                                  .map((notification) => notification.message)
                                  .join(" • ")}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Smart digest</CardTitle>
                <CardDescription>
                  Today&apos;s top updates, unread categories, and urgent items first.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border p-4">
                  <p className="text-2xl font-semibold">{unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Unread active notifications</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Unread by category</p>
                  {smartDigest?.unreadByCategory.length ? (
                    smartDigest.unreadByCategory.map((entry) => (
                      <div key={entry.category} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <span>{categoryLabels[entry.category]}</span>
                        <Badge variant="secondary">{entry.count}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                      You&apos;re all caught up.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Top updates</p>
                  {smartDigest?.topUpdates.length ? (
                    smartDigest.topUpdates.map((item) => (
                      <div key={item} className="rounded-lg border p-3 text-sm">
                        {item}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                      No standout changes right now.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Urgent first</p>
                  {smartDigest?.urgentItems.length ? (
                    smartDigest.urgentItems.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.actionUrl ?? "/notifications"}
                        onClick={() => void markNotificationRead(notification.id)}
                        className="block rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                      >
                        {notification.message}
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                      No urgent alerts.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick preferences</CardTitle>
                <CardDescription>
                  Control categories and delivery without leaving the notification center.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings ? (
                  <>
                    <div className="rounded-xl border p-3">
                      <p className="text-sm font-medium">Delivery mode</p>
                      <select
                        value={settings.notificationDeliveryMode}
                        onChange={(event) =>
                          void handleDeliveryModeChange(
                            event.target.value as UserSettings["notificationDeliveryMode"]
                          )
                        }
                        className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="off">Off</option>
                        <option value="push">Push only</option>
                        <option value="email">Email only</option>
                        <option value="both">Both</option>
                      </select>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {deliveryDescriptions[settings.notificationDeliveryMode]}
                      </p>
                    </div>

                    <div className="rounded-xl border p-3">
                      <p className="text-sm font-medium">Digest frequency</p>
                      <select
                        value={settings.emailDigestFrequency}
                        onChange={(event) =>
                          void updateSettings({
                            emailDigestFrequency: event.target.value as UserSettings["emailDigestFrequency"],
                          })
                        }
                        className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="off">Off</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      {(
                        Object.keys(settings.notificationPreferences) as Array<
                          keyof UserSettings["notificationPreferences"]
                        >
                      ).map((key) => (
                        <label key={key} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                          <span>{preferenceLabels[key]}</span>
                          <input
                            type="checkbox"
                            checked={settings.notificationPreferences[key]}
                            onChange={(event) =>
                              void updateSettings({
                                notificationPreferences: {
                                  [key]: event.target.checked,
                                } as Partial<UserSettings["notificationPreferences"]> &
                                  UserSettings["notificationPreferences"],
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {savingSettings ? "Saving preferences..." : "Preferences saved automatically."}
                    </p>
                  </>
                ) : (
                  <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    Loading notification settings...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function NotificationsPage() {
  return (
    <AuthProvider>
      <NotificationsPageContent />
    </AuthProvider>
  );
}
