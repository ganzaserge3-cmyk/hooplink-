"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AppNotification,
    getVisibleNotifications,
    markNotificationRead,
    subscribeToNotifications,
} from "@/lib/notifications";
import { useAuthContext } from "@/components/AuthProvider";

export function NotificationBell() {
    const { user } = useAuthContext();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToNotifications(user.uid, (allNotifications) => {
            setNotifications(allNotifications);
            const visible = getVisibleNotifications(allNotifications, user.uid);
            const unread = visible.filter((n) => !n.readBy?.includes(user.uid)).length;
            setUnreadCount(unread);
        });

        return unsubscribe;
    }, [user]);

    const handleClick = async () => {
        if (!user || unreadCount === 0) return;

        // Mark all visible notifications as read
        const visible = getVisibleNotifications(notifications, user.uid);
        const unreadNotifications = visible.filter((n) => !n.readBy?.includes(user.uid));

        await Promise.all(unreadNotifications.map((n) => markNotificationRead(n.id)));
    };

    if (!user) return null;

    return (
        <Link href="/notifications" onClick={handleClick}>
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <Badge
                        className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full px-1 text-xs"
                        variant="default"
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                )}
            </Button>
        </Link>
    );
}