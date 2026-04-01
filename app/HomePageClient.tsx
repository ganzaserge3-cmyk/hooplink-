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
    <div className="mx-auto grid max-w-6xl gap-10 py-10 lg:grid-cols-[1.05fr,0.95fr]">
      <div className="text-left">
        <h1 className="mb-8 text-5xl font-bold gradient-text">Welcome to HoopLink</h1>
        <p className="mb-8 max-w-2xl text-xl text-muted-foreground">
          The sports network for athletes, coaches, scouts, and creators. Share highlights, book sessions,
          grow your audience, and build your path.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-primary px-8 py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="rounded-xl border border-border px-8 py-4 font-semibold transition-all hover:bg-accent"
          >
            Learn More
          </Link>
        </div>
        {settings?.requireInvite ? (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="font-semibold text-primary">Invite-only onboarding is active</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {settings.inviteOnlyMessage}
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border bg-background p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Join the waitlist</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use this if you do not have an invite code yet and want early access updates.
        </p>
        <form className="mt-6 space-y-3" onSubmit={handleWaitlist}>
          <input
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Your name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <input
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <select
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
          >
            <option value="athlete">Athlete</option>
            <option value="coach">Coach</option>
            <option value="scout">Scout</option>
            <option value="fan">Fan</option>
          </select>
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="What do you want from HoopLink?"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
          />
          <button className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground" type="submit">
            Join Waitlist
          </button>
          {saved ? <p className="text-sm text-primary">You are on the list. We saved your interest.</p> : null}
        </form>
      </div>
    </div>
  );
}
