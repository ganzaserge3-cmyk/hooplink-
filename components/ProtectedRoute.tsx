"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getCurrentUserAccessStatus } from "@/lib/admin";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [accessStatus, setAccessStatus] = useState<"active" | "watch" | "suspended">("active");

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, user]);

  useEffect(() => {
    if (!user) {
      setAccessStatus("active");
      return;
    }

    void getCurrentUserAccessStatus().then(setAccessStatus);
  }, [user]);

  useEffect(() => {
    if (!user || !pathname || pathname === "/role-selection" || pathname === "/complete-profile") {
      return;
    }

    const storageKey = `hooplink_recent_pages_${user.uid}`;

    try {
      const existing = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as Array<{
        path: string;
        visitedAt: number;
      }>;
      const next = [{ path: pathname, visitedAt: Date.now() }, ...existing.filter((entry) => entry.path !== pathname)].slice(0, 8);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify([{ path: pathname, visitedAt: Date.now() }])
      );
    }
  }, [pathname, user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold">Sign in required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You need an account before using this part of HoopLink.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessStatus === "suspended") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold">Account paused</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An admin has temporarily restricted this account. Contact support or an admin to review it.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/profile">Back to profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
