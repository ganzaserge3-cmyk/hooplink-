"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuthContext } from "@/components/AuthProvider";
import { getAppAccessSettings, type AppAccessSettings } from "@/lib/admin";
import { createWaitlistEntry } from "@/lib/business";

export default function HomePageClient() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [settings, setSettings] = useState<AppAccessSettings | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "athlete", note: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/feed");
      return;
    }

    void getAppAccessSettings().then(setSettings);
  }, [loading, router, user]);

  if (loading || user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const handleWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createWaitlistEntry(form);
    setSaved(true);
    setForm({ name: "", email: "", role: "athlete", note: "" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 text-center dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">HoopLink</h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
            The sports network for athletes, coaches, scouts, and creators.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/signup"
            className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Create new account
          </Link>
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            Log in
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-500 dark:text-slate-400">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
