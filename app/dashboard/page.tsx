"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Grip,
  Lightbulb,
  MessageCircle,
  Minus,
  Play,
  Search,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Users,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentUserProfile,
  getProfileCompletionSummary,
  saveDashboardPreferences,
  type OnboardingGoal,
} from "@/lib/user-profile";

interface StoredProfile {
  uid?: string;
  displayName?: string;
  username?: string;
  pinnedShortcuts?: string[];
  setupPreferences?: {
    focusMode?: boolean;
    homeWidgets?: string[];
    searchPreferences?: string[];
    accessibilityMode?: string;
    welcomeChecklistDismissed?: boolean;
  };
  role?: {
    type?: string;
    sport?: string;
    bio?: string;
  };
  onboarding?: {
    goals?: OnboardingGoal[];
    walkthroughCompleted?: boolean;
    walkthroughDismissed?: boolean;
    setupRewardSeen?: boolean;
  };
}

type ShortcutItem = 
  | { href: string; label: string; description: string; icon: any }
  | { id: string; label: string };

function isShortcutWithHref(item: ShortcutItem): item is { href: string; label: string; description: string; icon: any } {
  return 'href' in item;
}

const shortcutCatalog: ShortcutItem[] = [
  { href: "/upload", label: "Upload highlight", description: "Post your first clip or update.", icon: Upload },
  { href: "/search", label: "Search people", description: "Find athletes, coaches, and scouts.", icon: Search },
  { href: "/messages", label: "Open messages", description: "Reply faster and keep momentum going.", icon: MessageCircle },
  { href: "/feed", label: "Open feed", description: "See what your community is posting.", icon: Compass },
  { href: "/recruiting-ready", label: "Recruiting hub", description: "Build a more discoverable profile.", icon: Trophy },
  { href: "/mentorship", label: "Mentorship", description: "Connect with coaches and advisors.", icon: Users },
  { href: "/virtual-tryouts", label: "Virtual Tryouts", description: "Request or host tryout sessions.", icon: Target },
  { id: "suggestions", label: "Suggestions" },
  { id: "recent", label: "Recent pages" },
  { id: "gamification", label: "Gamification" },
  { id: "live-streams", label: "Live Streams" },
];

const widgetCatalog = [
  { id: "checklist", label: "Profile Checklist" },
  { id: "shortcuts", label: "Quick Shortcuts" },
  { id: "suggestions", label: "Follow Suggestions" },
  { id: "gamification", label: "Gamification" },
  { id: "live-streams", label: "Live Streams" },
  { id: "recent", label: "Recent Pages" },
];

const pageLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/upload": "Upload",
  "/feed": "Feed",
  "/search": "Search",
  "/messages": "Messages",
  "/recruiting-ready": "Recruiting Hub",
  "/training": "Training",
  "/bookings": "Bookings",
  "/profile": "Profile",
};

const goalCopy: Record<OnboardingGoal, { description: string }> = {
  get_recruited: {
    description: "Focus on profile strength, highlights, and search visibility.",
  },
  grow_audience: {
    description: "Keep posting, improve your profile, and stay active in the feed.",
  },
  book_sessions: {
    description: "Sharpen your profile and keep your inbox and schedule moving.",
  },
  join_team: {
    description: "Use teams, search, and profile quality to make stronger first impressions.",
  },
  discover_talent: {
    description: "Search, follow, and organize the people worth tracking.",
  },
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentPages, setRecentPages] = useState<Array<{ path: string; visitedAt: number }>>([]);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getCurrentUserProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile((data as StoredProfile | null) ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const completion = useMemo(
    () => getProfileCompletionSummary(profile as Record<string, unknown> | null),
    [profile]
  );

  const goals = profile?.onboarding?.goals ?? [];
  const pinnedShortcutSet = new Set(profile?.pinnedShortcuts ?? []);
  const activeWidgetIds = profile?.setupPreferences?.homeWidgets?.length
    ? profile.setupPreferences.homeWidgets
    : ["checklist", "shortcuts", "suggestions", "recent"];
  const shortcuts = shortcutCatalog.filter(isShortcutWithHref).filter((item) => pinnedShortcutSet.size === 0 || pinnedShortcutSet.has(item.href));
  const primaryGoal = goals[0];
  const focusMode = profile?.setupPreferences?.focusMode === true;

  useEffect(() => {
    if (!profile?.uid) {
      return;
    }

    const storageKey = `hooplink_recent_pages_${profile.uid}`;

    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        setRecentPages(JSON.parse(saved) as Array<{ path: string; visitedAt: number }>);
      }
    } catch {
      setRecentPages([]);
    }
  }, [profile?.uid]);

  const nextSteps = [
    {
      label: "Complete your profile basics",
      done: completion.score >= 100,
      href: "/complete-profile",
    },
    {
      label: "Upload your first highlight",
      done: false,
      href: "/upload",
    },
    {
      label: "Follow or message your first connection",
      done: false,
      href: "/search",
    },
  ];

  const dailySuggestions = [
    primaryGoal ? `Keep moving on "${primaryGoal.replace(/_/g, " ")}" today.` : "Finish one setup task today.",
    profile?.role?.sport ? `Search more ${profile.role.sport} people and programs.` : "Add your sport so recommendations get sharper.",
    "Use one shortcut instead of navigating the whole app.",
  ];

  const roleHomeFeedCopy =
    profile?.role?.type === "coach"
      ? "Coach feed: see talent, team updates, and recruiting momentum first."
      : profile?.role?.type === "scout"
        ? "Scout feed: surface recruiting-ready prospects and standout highlights first."
        : profile?.role?.type === "fan"
          ? "Fan feed: stay close to stories, highlights, and community posts."
          : "Athlete feed: keep highlights, recruiting, and team activity in front of you.";

  const savePrefs = async (next: Partial<StoredProfile["setupPreferences"]> & {
    pinnedShortcuts?: string[];
    walkthroughCompleted?: boolean;
    walkthroughDismissed?: boolean;
    setupRewardSeen?: boolean;
  }) => {
    setSavingPrefs(true);
    try {
      await saveDashboardPreferences({
        pinnedShortcuts: next.pinnedShortcuts,
        homeWidgets: next.homeWidgets,
        searchPreferences: next.searchPreferences,
        focusMode: next.focusMode,
        walkthroughCompleted: next.walkthroughCompleted,
        walkthroughDismissed: next.walkthroughDismissed,
        setupRewardSeen: next.setupRewardSeen,
        welcomeChecklistDismissed: next.welcomeChecklistDismissed,
      });
      setProfile((current) =>
        current
          ? {
              ...current,
              pinnedShortcuts: next.pinnedShortcuts ?? current.pinnedShortcuts,
              setupPreferences: {
                ...current.setupPreferences,
                ...(next.homeWidgets ? { homeWidgets: next.homeWidgets } : {}),
                ...(next.searchPreferences ? { searchPreferences: next.searchPreferences } : {}),
                ...(typeof next.focusMode === "boolean" ? { focusMode: next.focusMode } : {}),
                ...(typeof next.welcomeChecklistDismissed === "boolean"
                  ? { welcomeChecklistDismissed: next.welcomeChecklistDismissed }
                  : {}),
              },
              onboarding: {
                ...current.onboarding,
                ...(typeof next.walkthroughCompleted === "boolean"
                  ? { walkthroughCompleted: next.walkthroughCompleted }
                  : {}),
                ...(typeof next.walkthroughDismissed === "boolean"
                  ? { walkthroughDismissed: next.walkthroughDismissed }
                  : {}),
                ...(typeof next.setupRewardSeen === "boolean"
                  ? { setupRewardSeen: next.setupRewardSeen }
                  : {}),
              },
            }
          : current
      );
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleShortcut = async (href: string) => {
    const current = profile?.pinnedShortcuts ?? [];
    const next = current.includes(href) ? current.filter((item) => item !== href) : [...current, href];
    await savePrefs({ pinnedShortcuts: next });
  };

  const toggleWidget = async (widgetId: string) => {
    const current = profile?.setupPreferences?.homeWidgets?.length
      ? profile.setupPreferences.homeWidgets
      : ["checklist", "shortcuts", "suggestions", "recent"];
    const next = current.includes(widgetId)
      ? current.filter((item) => item !== widgetId)
      : [...current, widgetId];
    await savePrefs({ homeWidgets: next });
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl space-y-6 pb-20">
        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background">
            <CardHeader>
              <CardTitle className="text-3xl">
                {loading ? "Loading your setup..." : `Welcome back, ${profile?.displayName || "teammate"}`}
              </CardTitle>
              {primaryGoal && (
                <CardDescription className="max-w-2xl text-base">
                  {goalCopy[primaryGoal].description}
                </CardDescription>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="px-3 py-1 border rounded-full bg-background/50">{roleHomeFeedCopy}</span>
                {focusMode && <span className="px-3 py-1 border border-primary/30 rounded-full bg-primary/5 text-primary">Focus mode active</span>}
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/upload">
                  Post Update
                  <Upload className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/search">
                  Search the network
                  <Search className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Profile progress</CardTitle>
              <CardDescription>
                Finish the basics once and the rest of the app gets easier to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${completion.score}%` }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{completion.completedCount} of {completion.totalCount} setup items done</span>
                <span className="font-semibold text-primary">{completion.score}%</span>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/complete-profile">Finish profile setup</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Gamification</CardTitle>
              <CardDescription>
                Earn points, unlock achievements, and level up your HoopLink experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Level up your game</p>
                  <p className="text-sm text-muted-foreground">Complete challenges and earn rewards</p>
                </div>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/gamification">
                  View Achievements
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          {activeWidgetIds.includes("checklist") ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Suggested next actions</CardTitle>
              <CardDescription>
                These keep the app focused and reduce the number of taps for new users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextSteps.map((step) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className="flex items-center justify-between rounded-2xl border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 ${step.done ? "text-primary" : "text-muted-foreground/50"}`} />
                    <span className="font-medium">{step.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
          ) : null}

          {activeWidgetIds.includes("shortcuts") ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Pinned shortcuts</CardTitle>
              <CardDescription>
                Quick access to the tools most users need first.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {shortcutCatalog
                  .filter(isShortcutWithHref)
                  .map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      disabled={savingPrefs}
                      onClick={() => void toggleShortcut(item.href)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        (profile?.pinnedShortcuts ?? []).includes(item.href) ? "border-primary bg-primary/5 text-primary" : ""
                      }`}
                    >
                      {(profile?.pinnedShortcuts ?? []).includes(item.href) ? <Minus className="mr-2 inline h-4 w-4" /> : <Grip className="mr-2 inline h-4 w-4" />}
                      {item.label}
                    </button>
                  ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
              {shortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </Link>
                );
              })}
              </div>
            </CardContent>
          </Card>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role focus</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-3">
              <Target className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold capitalize">{profile?.role?.type || "Athlete"} workspace</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.role?.sport
                    ? `We are keeping ${profile.role.sport} front and center in your setup.`
                    : "Add your sport to unlock more relevant recommendations."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search faster</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-3">
              <Search className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Universal search is one tap away</p>
                <p className="text-sm text-muted-foreground">
                  Find people, teams, and opportunities without opening multiple sections first.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stay active</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Momentum matters</p>
                <p className="text-sm text-muted-foreground">
                  Use upload, teams, and messages first so HoopLink starts feeling useful right away.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          {activeWidgetIds.includes("suggestions") ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Daily suggestions</CardTitle>
                <CardDescription>Small prompts that make the app easier to use each day.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dailySuggestions.map((suggestion) => (
                  <div key={suggestion} className="rounded-2xl border p-4 text-sm">
                    <Lightbulb className="mr-2 inline h-4 w-4 text-primary" />
                    {suggestion}
                  </div>
                ))}
                <div className="rounded-2xl border bg-primary/5 p-4 text-sm">
                  <p className="font-semibold text-primary">AI what next</p>
                  <p className="mt-1 text-muted-foreground">
                    {primaryGoal
                      ? `Next best step: use ${primaryGoal === "get_recruited" ? "Recruiting Hub" : primaryGoal === "book_sessions" ? "Bookings" : "Feed + Upload"} to support your main goal.`
                      : "Next best step: finish one setup item, then upload or search."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeWidgetIds.includes("gamification") ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Daily Challenges</CardTitle>
                <CardDescription>Complete these challenges to earn points and level up.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border p-4 text-sm">
                  <Trophy className="mr-2 inline h-4 w-4 text-primary" />
                  <span className="font-semibold">Upload a highlight today</span>
                  <p className="mt-1 text-muted-foreground">Earn 50 points for sharing your skills</p>
                </div>
                <div className="rounded-2xl border p-4 text-sm">
                  <Users className="mr-2 inline h-4 w-4 text-primary" />
                  <span className="font-semibold">Follow 3 new athletes</span>
                  <p className="mt-1 text-muted-foreground">Earn 30 points for expanding your network</p>
                </div>
                <div className="rounded-2xl border p-4 text-sm">
                  <MessageCircle className="mr-2 inline h-4 w-4 text-primary" />
                  <span className="font-semibold">Send a message</span>
                  <p className="mt-1 text-muted-foreground">Earn 20 points for starting conversations</p>
                </div>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/gamification">
                    View All Challenges
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {activeWidgetIds.includes("live-streams") ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Live Streams</CardTitle>
                <CardDescription>Join live training sessions and broadcasts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border p-4 text-sm">
                  <Play className="mr-2 inline h-4 w-4 text-red-500" />
                  <span className="font-semibold">Morning Basketball Training</span>
                  <p className="mt-1 text-muted-foreground">Coach Johnson ΓÇó 24 viewers</p>
                </div>
                <div className="rounded-2xl border p-4 text-sm">
                  <Play className="mr-2 inline h-4 w-4 text-red-500" />
                  <span className="font-semibold">Recruiting Q&A Session</span>
                  <p className="mt-1 text-muted-foreground">Scout Davis ΓÇó 156 viewers</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" asChild>
                    <Link href="/live-stream">
                      Browse Live
                      <Play className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  {profile && (
                    <Button className="flex-1" variant="outline" asChild>
                      <Link href="/live-stream/create">
                        Go Live
                        <Play className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeWidgetIds.includes("recent") ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Continue where you left off</CardTitle>
                <CardDescription>Recently visited pages help you get back faster.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Your recently visited pages will appear here.</p>
                ) : (
                  recentPages.map((page) => (
                    <Link
                      key={`${page.path}-${page.visitedAt}`}
                      href={page.path}
                      className="flex items-center justify-between rounded-2xl border p-4 hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div>
                        <p className="font-semibold">{pageLabels[page.path] ?? page.path}</p>
                        <p className="text-sm text-muted-foreground">{page.path}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Home widgets</CardTitle>
              <CardDescription>Pick the dashboard cards you want to keep visible.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {widgetCatalog.map((widget) => (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() => void toggleWidget(widget.id)}
                  className={`rounded-full border px-3 py-2 text-sm ${
                    activeWidgetIds.includes(widget.id) ? "border-primary bg-primary/5 text-primary" : ""
                  }`}
                >
                  {widget.label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Welcome guidance</CardTitle>
              <CardDescription>Tour, coach marks, and first-week momentum in one place.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border p-4 text-sm">
                <p className="font-semibold">Guided walkthrough</p>
                <p className="mt-1 text-muted-foreground">
                  Follow dashboard, upload, feed, messages, and teams in that order for the easiest start.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void savePrefs({ walkthroughCompleted: true, setupRewardSeen: true })}
                >
                  Mark tour complete
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void savePrefs({ walkthroughDismissed: true, welcomeChecklistDismissed: true })}
                >
                  Dismiss coach marks
                </Button>
              </div>
              {profile?.onboarding?.setupRewardSeen ? (
                <div className="rounded-2xl bg-primary/5 p-4 text-sm text-primary">
                  Setup reward unlocked. Your onboarding dashboard is fully active.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </ProtectedRoute>
  );
}
