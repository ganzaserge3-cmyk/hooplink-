"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AppNotification,
  getNotificationDigest,
  markNotificationRead,
  subscribeToNotifications,
  type NotificationDigest,
} from "@/lib/notifications";
import { formatTimeAgo } from "@/lib/posts";

function NotificationsPageContent() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "messages" | "activity">("all");
  const [digest, setDigest] = useState<NotificationDigest | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribeToNotifications(user.uid, setNotifications);
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void getNotificationDigest().then(setDigest);
  }, [notifications, user]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === "unread") {
        return !notification.readBy?.includes(user?.uid ?? "");
      }

      if (filter === "messages") {
        return notification.type === "message";
      }

      if (filter === "activity") {
        return notification.type !== "message";
      }

      return true;
    });
  }, [filter, notifications, user?.uid]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce<Record<string, AppNotification[]>>((groups, notification) => {
      const key = notification.type === "message" ? "Messages" : "Activity";
      groups[key] = [...(groups[key] ?? []), notification];
      return groups;
    }, {});
  }, [filteredNotifications]);

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Filter unread, message, and activity notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {digest ? (
              <div className="rounded-xl border p-4">
                <p className="font-semibold">Digest Preview</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {digest.unread} unread out of {digest.total} recent notifications
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {digest.byType.map((entry) => (
                    <span key={entry.type} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {entry.type}: {entry.count}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {(["all", "unread", "messages", "activity"] as const).map((value) => (
                <Button key={value} variant={filter === value ? "default" : "outline"} size="sm" onClick={() => setFilter(value)}>
                  {value}
                </Button>
              ))}
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="rounded-xl bg-muted p-6 text-sm text-muted-foreground">
                No notifications in this filter.
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([groupName, entries]) => (
                <div key={groupName} className="space-y-3">
                  <p className="text-sm font-semibold">{groupName}</p>
                  {entries.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.postId ? "/feed" : `/profile/${notification.actorId}`}
                      onClick={() => void markNotificationRead(notification.id)}
                      className={`flex gap-3 rounded-xl border p-4 hover:bg-muted/40 ${notification.readBy?.includes(user.uid) ? "" : "border-primary/40 bg-primary/5"}`}
                    >
                      <img src={notification.actorAvatar || "https://placehold.co/64x64?text=N"} alt={notification.actorName} className="h-10 w-10 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>
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
