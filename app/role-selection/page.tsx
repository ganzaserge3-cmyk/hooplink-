"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Dribbble, Megaphone, Search, Shield, Trophy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  getPostAuthDestination,
  saveOnboardingPreferences,
  type AccessibilityMode,
  type AgeGroup,
  type HoopLinkRole,
  type OnboardingGoal,
  type SkillLevel,
} from "@/lib/user-profile";

const roles: Array<{
  id: HoopLinkRole;
  title: string;
  description: string;
  icon: typeof Dribbble;
  color: string;
}> = [
  {
    id: "athlete",
    title: "Athlete/Player",
    description: "Showcase your highlights and connect with coaches & scouts",
    icon: Dribbble,
    color: "from-orange-400 to-red-500",
  },
  {
    id: "coach",
    title: "Coach",
    description: "Discover talent and build your team",
    icon: Trophy,
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: "scout",
    title: "Scout",
    description: "Find the next big talent for your organization",
    icon: Shield,
    color: "from-purple-400 to-pink-500",
  },
  {
    id: "fan",
    title: "Fan",
    description: "Follow your favorite athletes and stay updated",
    icon: Users,
    color: "from-green-400 to-emerald-500",
  },
];

const goals: Array<{
  id: OnboardingGoal;
  title: string;
  description: string;
  icon: typeof BadgeCheck;
}> = [
  {
    id: "get_recruited",
    title: "Get recruited",
    description: "Build a stronger profile and get discovered faster.",
    icon: BadgeCheck,
  },
  {
    id: "grow_audience",
    title: "Grow audience",
    description: "Share more content and build your sports brand.",
    icon: Megaphone,
  },
  {
    id: "book_sessions",
    title: "Book sessions",
    description: "Make it easier to schedule training and coaching.",
    icon: Trophy,
  },
  {
    id: "join_team",
    title: "Join a team",
    description: "Find the right team, coaches, and opportunities.",
    icon: Users,
  },
  {
    id: "discover_talent",
    title: "Discover talent",
    description: "Spot players, creators, and programs worth following.",
    icon: Search,
  },
];

const skillLevels: SkillLevel[] = ["beginner", "intermediate", "advanced", "elite"];
const ageGroups: AgeGroup[] = ["under_13", "teen", "college", "adult"];
const accessibilityModes: AccessibilityMode[] = ["default", "high_visibility", "voice_ready"];
const importSources = ["Instagram", "YouTube", "Hudl", "TikTok"];

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<HoopLinkRole | "">("");
  const [selectedGoals, setSelectedGoals] = useState<OnboardingGoal[]>([]);
  const [primarySport, setPrimarySport] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("intermediate");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("teen");
  const [guardianMode, setGuardianMode] = useState(false);
  const [teamInviteCode, setTeamInviteCode] = useState("");
  const [clubInviteCode, setClubInviteCode] = useState("");
  const [schoolInviteCode, setSchoolInviteCode] = useState("");
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>("default");
  const [biggerText, setBiggerText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [voiceNavigationHelp, setVoiceNavigationHelp] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedImports, setSelectedImports] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

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
      if (cancelled || destination === "/role-selection") {
        return;
      }

      router.replace(getFallbackPath());
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const toggleGoal = (goalId: OnboardingGoal) => {
    setSelectedGoals((current) =>
      current.includes(goalId)
        ? current.filter((value) => value !== goalId)
        : current.length >= 3
          ? [...current.slice(1), goalId]
          : [...current, goalId]
    );
  };

  const toggleImport = (source: string) => {
    setSelectedImports((current) =>
      current.includes(source) ? current.filter((item) => item !== source) : [...current, source]
    );
  };

  const handleContinue = async () => {
    if (!selectedRole) return;
    if (selectedGoals.length === 0) {
      setError("Choose at least one goal so we can personalize your setup.");
      return;
    }

    if (!auth?.currentUser) {
      setError("Please sign in again to continue.");
      router.push("/login");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await saveOnboardingPreferences({
        role: selectedRole,
        goals: selectedGoals,
        primarySport,
        skillLevel,
        ageGroup,
        guardianMode,
        teamInviteCode,
        clubInviteCode,
        schoolInviteCode,
        importedSources: selectedImports,
        accessibilityMode,
        biggerText,
        highContrast,
        reduceMotion,
        voiceNavigationHelp,
        quickCreateEnabled: true,
        focusMode,
        notificationWizardCompleted: true,
      });
      router.push(`/complete-profile?role=${selectedRole}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your role.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <Card className="mb-8 border-primary/10 bg-background/90">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 rounded-full bg-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Step 1 of 3
            </p>
            <CardTitle className="mt-2 text-3xl font-bold">Set up your HoopLink experience</CardTitle>
            <CardDescription className="text-lg">
              Choose your role and goals so the app starts with the right tools.
            </CardDescription>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-3 py-1">Role-based onboarding</span>
              <span className="rounded-full bg-muted px-3 py-1">Guided setup</span>
              <span className="rounded-full bg-muted px-3 py-1">Accessibility-ready</span>
              <span className="rounded-full bg-muted px-3 py-1">Smart dashboard next</span>
            </div>
          </CardHeader>
        </Card>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer hover:shadow-lg transition-all group ${
                selectedRole === role.id ? "ring-2 ring-primary shadow-lg" : ""
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardContent className="p-8 pt-10">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${role.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <role.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-3">{role.title}</h3>
                <p className="text-muted-foreground text-center mb-6">{role.description}</p>
                {selectedRole === role.id ? (
                  <div className="w-full bg-primary/10 border border-primary/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-1/2 animate-pulse" />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">What do you want to do first?</CardTitle>
            <CardDescription>
              Pick up to 3 goals. We will use them to build your dashboard and shortcuts.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {goals.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoals.includes(goal.id);

              return (
                <button
                  key={goal.id}
                  type="button"
                  className={`rounded-2xl border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 ${
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                  }`}
                  onClick={() => toggleGoal(goal.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{goal.title}</p>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="mt-8 border-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">Personalize your setup</CardTitle>
            <CardDescription>
              This helps us build sport-specific onboarding, quick actions, and easier defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary sport</label>
              <input
                value={primarySport}
                onChange={(event) => setPrimarySport(event.target.value)}
                placeholder="Basketball"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Skill level</label>
              <select
                value={skillLevel}
                onChange={(event) => setSkillLevel(event.target.value as SkillLevel)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {skillLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Age group</label>
              <select
                value={ageGroup}
                onChange={(event) => setAgeGroup(event.target.value as AgeGroup)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ageGroups.map((group) => (
                  <option key={group} value={group}>
                    {group.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Accessibility mode</label>
              <select
                value={accessibilityMode}
                onChange={(event) => setAccessibilityMode(event.target.value as AccessibilityMode)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {accessibilityModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Team invite code</label>
              <input
                value={teamInviteCode}
                onChange={(event) => setTeamInviteCode(event.target.value)}
                placeholder="Optional"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">School invite code</label>
              <input
                value={schoolInviteCode}
                onChange={(event) => setSchoolInviteCode(event.target.value)}
                placeholder="Optional"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Club invite code</label>
              <input
                value={clubInviteCode}
                onChange={(event) => setClubInviteCode(event.target.value)}
                placeholder="Optional"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Import profile details from</label>
              <div className="flex flex-wrap gap-2">
                {importSources.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => toggleImport(source)}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      selectedImports.includes(source) ? "border-primary bg-primary/5 text-primary" : ""
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 text-sm md:col-span-2 md:grid-cols-2">
              {[
                { label: "Guardian setup", checked: guardianMode, onChange: setGuardianMode },
                { label: "Bigger text", checked: biggerText, onChange: setBiggerText },
                { label: "High contrast", checked: highContrast, onChange: setHighContrast },
                { label: "Reduce motion", checked: reduceMotion, onChange: setReduceMotion },
                { label: "Voice navigation help", checked: voiceNavigationHelp, onChange: setVoiceNavigationHelp },
                { label: "Focus mode dashboard", checked: focusMode, onChange: setFocusMode },
              ].map((item) => (
                <label key={item.label} className="flex items-center gap-3 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(event) => item.onChange(event.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button 
            variant="outline" 
            className="flex-1 max-w-md mx-auto"
            onClick={() => router.push("/login")}
          >
            Back to Login
          </Button>
          <Button 
            className="flex-1 max-w-md mx-auto font-semibold" 
            onClick={handleContinue}
            disabled={!selectedRole || selectedGoals.length === 0 || isSaving}
          >
            {isSaving ? "Saving..." : "Continue"}
          </Button>
        </div>
        {error ? (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
