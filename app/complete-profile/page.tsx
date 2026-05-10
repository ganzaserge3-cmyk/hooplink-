"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, MapPin, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";
import {
  getCurrentUserProfile,
  getPostAuthDestination,
  getProfileCompletionSummary,
  saveUserProfile,
  type HoopLinkRole,
  type OnboardingGoal,
} from "@/lib/user-profile";

const allowedRoles: HoopLinkRole[] = ["athlete", "coach", "scout", "fan"];

function CompleteProfilePageContent() {
  const draftStorageKey = "hooplink_complete_profile_draft";
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const defaultRole = allowedRoles.includes(roleParam as HoopLinkRole)
    ? (roleParam as HoopLinkRole)
    : "athlete";

  const [formData, setFormData] = useState({
    role: defaultRole,
    sport: "",
    position: "",
    team: "",
    experience: "",
    age: "",
    height: "",
    location: "",
    bio: "",
    username: "",
    goals: [] as OnboardingGoal[],
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth?.currentUser) {
      return;
    }

    let cancelled = false;

    const getFallbackPath = () => {
      const storageKey = `hooplink_recent_pages_${auth.currentUser?.uid}`;

      try {
        const recent = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as Array<{
          path: string;
          visitedAt: number;
        }>;
        return (
          recent.find(
            (entry) =>
              entry.path &&
              entry.path !== "/" &&
              entry.path !== "/role-selection" &&
              entry.path !== "/complete-profile"
          )?.path || "/feed"
        );
      } catch {
        return "/feed";
      }
    };

    void getPostAuthDestination().then(({ destination }) => {
      if (cancelled || destination === "/complete-profile") {
        return;
      }

      router.replace(getFallbackPath());
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!auth?.currentUser) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await getCurrentUserProfile();
        if (!profile || cancelled) return;

        setFormData((prev) => ({
          ...prev,
          role: (profile.role?.type as HoopLinkRole) || prev.role,
          sport:
            profile.role?.sport ||
            String((profile.setupPreferences as Record<string, unknown> | undefined)?.primarySport ?? ""),
          position: profile.role?.position || "",
          team: profile.role?.team || "",
          experience: profile.role?.experience || "",
          age: profile.role?.age ? String(profile.role.age) : "",
          height: profile.role?.height || "",
          location: profile.location || "",
          bio: profile.role?.bio || "",
          username: String(profile.username ?? auth.currentUser?.uid.slice(0, 8) ?? ""),
          goals: Array.isArray(profile.onboarding?.goals) ? (profile.onboarding.goals as OnboardingGoal[]) : [],
        }));
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const draft = window.localStorage.getItem(draftStorageKey);
    if (!draft) {
      return;
    }

    try {
      const parsed = JSON.parse(draft) as typeof formData;
      setFormData((current) => ({ ...current, ...parsed, role: current.role || parsed.role }));
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, []);

  useEffect(() => {
    if (loadingProfile) {
      return;
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(formData));
  }, [draftStorageKey, formData, loadingProfile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!formData.sport.trim()) {
      setError("Please add your main sport.");
      return;
    }

    if (!formData.bio.trim()) {
      setError("Please add a short bio.");
      return;
    }

    setSubmitting(true);

    try {
      await saveUserProfile({
        role: formData.role,
        sport: formData.sport,
        position: formData.position,
        team: formData.team,
        experience: formData.experience,
        age: formData.age ? Number(formData.age) : undefined,
        height: formData.height,
        location: formData.location,
        bio: formData.bio,
        username: formData.username,
        goals: formData.goals,
        onboardingCompleted: true,
        completedSteps: ["role", "profile", "dashboard"],
        lastCompletedStep: "dashboard",
        pinnedShortcuts: ["/dashboard", "/upload", "/search"],
        setupPreferences: {
          primarySport: formData.sport,
        },
      });
      window.localStorage.removeItem(draftStorageKey);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const formHints = {
    sport: formData.sport.trim() ? "" : "Add your main sport to unlock role-based recommendations.",
    bio:
      formData.bio.trim().length >= 20
        ? ""
        : "A short bio helps coaches, teams, and fans understand you faster.",
    username: formData.username.trim().length >= 3 ? "" : "Pick a username people can remember and search for.",
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const completion = getProfileCompletionSummary({
    role: {
      type: formData.role,
      sport: formData.sport,
      bio: formData.bio,
    },
    location: formData.location,
    username: formData.username,
    onboarding: {
      goals: formData.goals,
    },
  });

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Step 2 of 3
          </p>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserCircle2 className="h-8 w-8" />
          </div>
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>
            Add the details people will see when they discover you on HoopLink.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-sm font-semibold">Profile strength</p>
              <p className="text-sm text-muted-foreground">
                Complete the basics now so people know who you are right away.
              </p>
            </div>
            <div className="rounded-full bg-background px-4 py-2 text-sm font-semibold text-primary">
              {completion.score}% complete
            </div>
          </div>
          <div className="mb-6 grid gap-3 rounded-2xl border p-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold">Guided setup</p>
              <p className="text-xs text-muted-foreground">You are one step away from a personalized dashboard.</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Auto-save draft</p>
              <p className="text-xs text-muted-foreground">This form keeps a local draft while you work.</p>
            </div>
            <div className="flex items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const draft = window.localStorage.getItem(draftStorageKey);
                  if (!draft) {
                    return;
                  }

                  try {
                    setFormData(JSON.parse(draft) as typeof formData);
                  } catch {
                    window.localStorage.removeItem(draftStorageKey);
                  }
                }}
              >
                Restore draft
              </Button>
            </div>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="yourname"
                />
                {formHints.username ? <p className="text-xs text-muted-foreground">{formHints.username}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="sport" className="text-sm font-medium">
                  Sport
                </label>
                <Input
                  id="sport"
                  value={formData.sport}
                  onChange={(event) => setFormData((prev) => ({ ...prev, sport: event.target.value }))}
                  placeholder="Basketball"
                />
                {formHints.sport ? <p className="text-xs text-muted-foreground">{formHints.sport}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="position" className="text-sm font-medium">
                  Position
                </label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(event) => setFormData((prev) => ({ ...prev, position: event.target.value }))}
                  placeholder="Point Guard"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="team" className="text-sm font-medium">
                  Team
                </label>
                <Input
                  id="team"
                  value={formData.team}
                  onChange={(event) => setFormData((prev) => ({ ...prev, team: event.target.value }))}
                  placeholder="School or club team"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="experience" className="text-sm font-medium">
                  Experience
                </label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(event) => setFormData((prev) => ({ ...prev, experience: event.target.value }))}
                  placeholder="Varsity, AAU, youth, creator, coach"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="age" className="text-sm font-medium">
                  Age
                </label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  value={formData.age}
                  onChange={(event) => setFormData((prev) => ({ ...prev, age: event.target.value }))}
                  placeholder="18"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="height" className="text-sm font-medium">
                  Height
                </label>
                <Input
                  id="height"
                  value={formData.height}
                  onChange={(event) => setFormData((prev) => ({ ...prev, height: event.target.value }))}
                  placeholder="6'2&quot;"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="Atlanta, GA"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(event) => setFormData((prev) => ({ ...prev, bio: event.target.value }))}
                placeholder="Tell coaches, scouts, and fans what you're about."
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {formHints.bio ? <p className="text-xs text-muted-foreground">{formHints.bio}</p> : null}
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm font-semibold">Setup checklist</p>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                {[
                  { label: "Choose your role", complete: Boolean(formData.role) },
                  { label: "Pick your goals", complete: formData.goals.length > 0 },
                  { label: "Add your sport", complete: Boolean(formData.sport.trim()) },
                  { label: "Write a short bio", complete: Boolean(formData.bio.trim()) },
                  { label: "Claim your username", complete: Boolean(formData.username.trim()) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${item.complete ? "text-primary" : "text-muted-foreground/50"}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? "Saving profile..." : "Finish setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={null}>
      <CompleteProfilePageContent />
    </Suspense>
  );
}
