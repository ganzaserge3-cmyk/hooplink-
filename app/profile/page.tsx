"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, Brain, Dribbble, Dumbbell, Ellipsis, Film, GraduationCap, Grid3X3, Heart, LayoutGrid, LineChart, Link2, Mic, Pencil, Pin, PlaySquare, QrCode, Quote, Settings, ShieldPlus, Sparkles, Target, Trophy, Trash2, Users, Video } from "lucide-react";
import { History } from "lucide-react";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deletePost, subscribeToUserPosts, togglePostLike, type FeedPost } from "@/lib/posts";
import { getCurrentSeasonDashboard, getRecoverySnapshot, type SeasonalDashboard } from "@/lib/performance";
import { getCurrentUserSettings, togglePinnedPost, type UserSettings } from "@/lib/settings";
import { getStoryHighlightCollectionsForUser, type StoryHighlightCollectionWithStories } from "@/lib/stories";
import { getCurrentUserProfile } from "@/lib/user-profile";

interface StoredProfile {
  uid?: string;
  displayName?: string;
  username?: string;
  location?: string;
  photoURL?: string;
  coverPhotoURL?: string;
  profileTheme?: string;
  savedPosts?: string[];
  role?: {
    type?: string;
    sport?: string;
    position?: string;
    team?: string;
    experience?: string;
    age?: number;
    height?: string;
    bio?: string;
  };
  identity?: {
    tagline?: string;
    pronouns?: string;
    hometown?: string;
    gradYear?: string;
    website?: string;
    instagram?: string;
    quote?: string;
  };
  milestones?: Array<{
    title?: string;
    date?: string;
    detail?: string;
  }>;
  profileExtras?: {
    introVideoUrl?: string;
    audioIntroUrl?: string;
    askMeAbout?: string[];
    teamHistory?: Array<{
      season?: string;
      team?: string;
      detail?: string;
    }>;
    injuryStatus?: string;
    recruitingAvailable?: boolean;
    transferInterest?: boolean;
    nilInterest?: boolean;
    parentManaged?: boolean;
    sponsorshipDeckUrl?: string;
    linkBio?: Array<{
      label?: string;
      url?: string;
    }>;
    coachEndorsements?: string[];
    peerEndorsements?: string[];
  };
  followers?: string[];
  following?: string[];
  postsCount?: number;
  reelsCount?: number;
  verified?: boolean;
  business?: {
    supportUrl?: string;
    merchUrl?: string;
    collaborationPitch?: string;
    training?: {
      enabled?: boolean;
      priceLabel?: string;
    };
    consultation?: {
      enabled?: boolean;
      priceLabel?: string;
    };
  };
  athleteProfile?: {
    stats?: {
      pointsPerGame?: number;
      assistsPerGame?: number;
      reboundsPerGame?: number;
    };
    skills?: string[];
    achievements?: string[];
    gameLogs?: Array<{
      opponent?: string;
      date?: string;
      points?: number;
      assists?: number;
      rebounds?: number;
      result?: string;
    }>;
  };
  academicProfile?: {
    gpa?: string;
    testScores?: string[];
    transcriptLinks?: string[];
    eligibilityStatus?: string;
    schoolHistory?: string[];
    clubHistory?: string[];
    campHistory?: string[];
    visitHistory?: string[];
    offerHistory?: string[];
    resumeBullets?: string[];
    careerGoals?: string[];
  };
  profileSignals?: {
    profileVisits?: number;
    scoutVisits?: number;
    recruiterEngagementScore?: number;
    audienceGrowthScore?: number;
    creatorTrustScore?: number;
    sponsorReadinessScore?: number;
    profileCompletenessScore?: number;
    comparisonNotes?: string[];
  };
  profileCommunity?: {
    guestbook?: string[];
    fanComments?: string[];
    teamEndorsements?: string[];
    parentNotes?: string[];
    mentorNotes?: string[];
    recommendationRequests?: string[];
    recommendationVault?: string[];
    verifiedDocuments?: string[];
    favoriteBrands?: string[];
    sponsorshipInterests?: string[];
    partnershipHistory?: string[];
    contactPreference?: string;
    publicAvailability?: string[];
    roleTabs?: string[];
    localLanguageBio?: string;
    nickname?: string;
    signatureLine?: string;
  };
  athleticMeasurements?: {
    wingspan?: string;
    weight?: string;
    verticalLeap?: string;
    sprintTime?: string;
  };
}

function getProfileThemeClass(theme?: string) {
  if (theme === "sunset") return "from-orange-500 via-rose-500 to-amber-400";
  if (theme === "court") return "from-emerald-600 via-lime-500 to-yellow-300";
  if (theme === "midnight") return "from-slate-900 via-blue-900 to-cyan-700";
  if (theme === "championship") return "from-yellow-500 via-amber-300 to-orange-500";
  if (theme === "ice") return "from-cyan-500 via-sky-300 to-slate-100";
  return "from-primary to-secondary";
}

function getVerifiedRoleLabel(role?: string) {
  if (role === "athlete") return "Verified Athlete";
  if (role === "coach") return "Verified Coach";
  if (role === "scout") return "Verified Scout";
  return "Verified";
}

function ProfilePageContent() {
  const { user } = useAuthContext();
  const currentUserId = user?.uid ?? "";
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [seasonDashboard, setSeasonDashboard] = useState<SeasonalDashboard | null>(null);
  const [contentView, setContentView] = useState<"posts" | "reels">("posts");
  const [profileTab, setProfileTab] = useState<"overview" | "media" | "recruiting" | "team" | "career">("overview");
  const [recoverySnapshot, setRecoverySnapshot] = useState<{
    latest: { status: string; date: string; energy: number; soreness: number } | null;
    streak: number;
  } | null>(null);
  const [storyHighlights, setStoryHighlights] = useState<StoryHighlightCollectionWithStories[]>([]);

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    getCurrentUserProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile((data as StoredProfile | null) ?? null);
        }
      })
      .then(() => getCurrentUserSettings())
      .then((nextSettings) => {
        if (!cancelled) {
          setSettings(nextSettings);
        }
      })
      .then(async () => {
        const [nextSeasonDashboard, nextRecoverySnapshot] = await Promise.all([
          getCurrentSeasonDashboard(),
          getRecoverySnapshot(),
        ]);
        if (!cancelled) {
          setSeasonDashboard(nextSeasonDashboard);
          setRecoverySnapshot(nextRecoverySnapshot);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false);
        }
      });

    void getStoryHighlightCollectionsForUser(user.uid).then((collections) => {
      if (!cancelled) {
        setStoryHighlights(collections);
      }
    });

    const unsubscribe = subscribeToUserPosts(user.uid, setPosts);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  const initials = useMemo(() => {
    const name = user?.displayName || profile?.displayName || "HoopLink User";
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile?.displayName, user?.displayName]);

  const standardPosts = useMemo(
    () => posts.filter((post) => post.contentType === "post"),
    [posts]
  );

  const reelPosts = useMemo(
    () => posts.filter((post) => post.contentType === "reel"),
    [posts]
  );

  const visibleContent = contentView === "reels" ? reelPosts : standardPosts;

  const primaryActions = [
    {
      href: "/edit-profile",
      label: "Edit Profile",
      icon: Pencil,
      variant: "outline" as const,
    },
    {
      href: "/upload",
      label: "New Post",
      variant: "default" as const,
    },
  ];

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${currentUserId}`;
  const publicResumeUrl = `/resume/${currentUserId}`;
  const embedProfileCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/profile/${currentUserId}" width="420" height="240" style="border:0;border-radius:16px;" loading="lazy"></iframe>`;
  const embedHighlightsCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/highlights/${currentUserId}" width="720" height="420" style="border:0;border-radius:16px;" loading="lazy"></iframe>`;
  const shareCardText = `${user?.displayName || profile?.displayName || "HoopLink User"}\n${profile?.identity?.tagline || profile?.role?.bio || ""}\n${profileUrl}`;

  const quickAccessLinks = [
    { href: "/analytics", label: "Analytics", icon: LineChart },
    { href: "/performance", label: "Performance", icon: ShieldPlus },
    { href: "/training", label: "Training", icon: Dumbbell },
    { href: "/recruiting-ready", label: "Recruiting", icon: GraduationCap },
    { href: "/mentorship", label: "Mentorship", icon: Users },
    { href: "/virtual-tryouts", label: "Tryouts", icon: Target },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/ai-coach", label: "AI Coach", icon: Brain },
  ];

  const moreToolsLinks = [
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: "/drafts", label: "Drafts", icon: Film },
    { href: "/verify", label: "Verify", icon: BadgeCheck },
    { href: "/history", label: "History", icon: History },
    { href: "/media-lab", label: "Media Lab", icon: Film },
    { href: "/directory", label: "Directory", icon: Users },
    { href: "/stats-import", label: "Stats Import", icon: LineChart },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  if (profileLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl pb-20">
        <div className="px-4 pt-4">
          <div className={`relative h-52 overflow-hidden rounded-[28px] bg-gradient-to-r ${getProfileThemeClass(profile?.profileTheme)}`}>
            {profile?.coverPhotoURL ? (
              <img src={profile.coverPhotoURL} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-black/25" />
          </div>
        </div>

        <Card className="mx-4 -mt-14 rounded-[28px] border-border/60 shadow-lg">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <Avatar className="h-28 w-28 shrink-0 ring-4 ring-background shadow-lg">
                <AvatarImage src={user.photoURL || profile?.photoURL || ""} />
                <AvatarFallback className="text-2xl font-bold">{initials || "HL"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-3 text-center md:pt-6 md:text-left">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <h1 className="break-words text-3xl font-bold leading-tight">
                      {user.displayName || profile?.displayName || "HoopLink User"}
                    </h1>
                    {profile?.verified ? (
                      <Badge variant="secondary" className="gap-1">
                        <Dribbble className="h-3 w-3" />
                        {getVerifiedRoleLabel(profile?.role?.type)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">@{profile?.username || currentUserId.slice(0, 8)}</p>
                  {profile?.profileCommunity?.nickname ? (
                    <p className="text-xs text-muted-foreground">Also known as {profile.profileCommunity.nickname}</p>
                  ) : null}
                </div>

                {settings?.headline ? <p className="text-sm font-medium text-primary">{settings.headline}</p> : null}
                {profile?.identity?.tagline ? (
                  <p className="text-sm font-semibold text-foreground/80">{profile.identity.tagline}</p>
                ) : null}

                <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                  <Badge variant="outline">
                    {settings?.availabilityStatus === "locked_in"
                      ? "Locked In"
                      : settings?.availabilityStatus === "recovering"
                        ? "Recovering"
                        : "Available"}
                  </Badge>
                  {profile?.role?.type ? <Badge>{profile.role.type.toUpperCase()}</Badge> : null}
                  {profile?.role?.sport ? <Badge>{profile.role.sport}</Badge> : null}
                  {profile?.role?.position ? <Badge>{profile.role.position}</Badge> : null}
                  {profile?.role?.team ? <Badge>{profile.role.team}</Badge> : null}
                  {profile?.role?.experience ? <Badge>{profile.role.experience}</Badge> : null}
                  {profile?.role?.age ? <Badge>{profile.role.age}yo</Badge> : null}
                  {profile?.role?.height ? <Badge>{profile.role.height}</Badge> : null}
                  {profile?.identity?.pronouns ? <Badge>{profile.identity.pronouns}</Badge> : null}
                  {profile?.identity?.hometown ? <Badge>{profile.identity.hometown}</Badge> : null}
                  {profile?.identity?.gradYear ? <Badge>Class of {profile.identity.gradYear}</Badge> : null}
                  {profile?.profileExtras?.recruitingAvailable ? <Badge>Recruiting Open</Badge> : null}
                  {profile?.profileExtras?.transferInterest ? <Badge>Transfer Interest</Badge> : null}
                  {profile?.profileExtras?.nilInterest ? <Badge>NIL Open</Badge> : null}
                  {profile?.profileExtras?.parentManaged ? <Badge>Parent Managed</Badge> : null}
                </div>

                <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground md:mx-0 md:text-base">
                  {profile?.role?.bio || "Complete your profile to tell people what your game is about."}
                </p>
                {profile?.profileCommunity?.signatureLine ? (
                  <p className="text-sm font-medium text-primary">{profile.profileCommunity.signatureLine}</p>
                ) : null}
                {profile?.profileCommunity?.localLanguageBio ? (
                  <p className="text-sm text-muted-foreground">{profile.profileCommunity.localLanguageBio}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-muted/70 p-4 text-center">
                <div className="text-2xl font-bold text-primary">{profile?.followers?.length ?? 0}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="rounded-2xl bg-muted/70 p-4 text-center">
                <div className="text-2xl font-bold">{profile?.following?.length ?? 0}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
              <div className="rounded-2xl bg-muted/70 p-4 text-center">
                <div className="text-2xl font-bold">{profile?.postsCount ?? standardPosts.length}</div>
                <div className="text-sm text-muted-foreground">Posts</div>
              </div>
              <div className="rounded-2xl bg-muted/70 p-4 text-center">
                <div className="text-2xl font-bold">{profile?.reelsCount ?? reelPosts.length}</div>
                <div className="text-sm text-muted-foreground">Reels</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              {primaryActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button key={action.href} className="h-11 md:flex-1" variant={action.variant} asChild>
                    <Link href={action.href}>
                      {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
                      {action.label}
                    </Link>
                  </Button>
                );
              })}
              <Button
                className="h-11 md:flex-1"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/profile/${user.uid}`)}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copy Profile Link
              </Button>
              <Button
                className="h-11 md:flex-1"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(shareCardText)}
              >
                Share Card Text
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1 sm:grid-cols-5">
              {([
                { id: "overview", label: "Overview" },
                { id: "media", label: "Media" },
                { id: "recruiting", label: "Recruiting" },
                { id: "team", label: "Team" },
                { id: "career", label: "Career" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProfileTab(tab.id)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium ${
                    profileTab === tab.id ? "bg-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
                <button
                  type="button"
                  className="rounded-xl bg-background px-3 py-2 text-sm font-medium shadow-sm"
                >
                  Private View
                </button>
                <Link
                  href={`/profile/${user.uid}`}
                  className="rounded-xl px-3 py-2 text-center text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
                >
                  Public View
                </Link>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Quick Access</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickAccessLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button key={item.href} variant="outline" asChild className="justify-start">
                      <Link href={item.href}>
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <details className="group">
            <summary className="list-none">
              <Card className="cursor-pointer transition-colors group-open:border-primary/40">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold">More Tools</h2>
                  </div>
                  <span className="text-sm text-muted-foreground group-open:hidden">Show</span>
                  <span className="hidden text-sm text-muted-foreground group-open:inline">Hide</span>
                </CardContent>
              </Card>
            </summary>
            <Card className="mt-3">
              <CardContent className="p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {moreToolsLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button key={item.href} variant="ghost" asChild className="justify-start">
                        <Link href={item.href}>
                          <Icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </details>
        </div>

        <div className="px-4">
          <Card>
            <CardContent className="p-5">
              {profileTab === "overview" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="rounded-2xl border p-4">
                      <h2 className="font-semibold">Identity Snapshot</h2>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        {profile?.identity?.hometown ? <Badge variant="outline">Hometown: {profile.identity.hometown}</Badge> : null}
                        {profile?.identity?.gradYear ? <Badge variant="outline">Grad Year: {profile.identity.gradYear}</Badge> : null}
                        {profile?.identity?.pronouns ? <Badge variant="outline">Pronouns: {profile.identity.pronouns}</Badge> : null}
                        {profile?.profileCommunity?.contactPreference ? <Badge variant="outline">Contact: {profile.profileCommunity.contactPreference}</Badge> : null}
                        {profile?.business?.training?.enabled ? <Badge variant="outline">Booking Ready</Badge> : null}
                        {profile?.profileExtras?.transferInterest ? <Badge variant="outline">Open to Work</Badge> : null}
                        {profile?.profileExtras?.recruitingAvailable ? <Badge variant="outline">Looking for Team</Badge> : null}
                        {profile?.business?.collaborationPitch ? <Badge variant="outline">Open for Collab</Badge> : null}
                        {profile?.location ? <Badge variant="outline">Local Area</Badge> : null}
                      </div>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <h2 className="font-semibold">Athletic Measurements</h2>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-muted p-3 text-sm">Height: {profile?.role?.height || "Not listed"}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Wingspan: {profile?.athleticMeasurements?.wingspan || "Not listed"}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Weight: {profile?.athleticMeasurements?.weight || "Not listed"}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Vertical: {profile?.athleticMeasurements?.verticalLeap || "Not listed"}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Sprint: {profile?.athleticMeasurements?.sprintTime || "Not listed"}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Position: {profile?.role?.position || "Not listed"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border p-4">
                      <h2 className="font-semibold">Signals and Analytics</h2>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-muted p-3 text-sm">Profile Visits: {profile?.profileSignals?.profileVisits ?? 0}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Scout Visits: {profile?.profileSignals?.scoutVisits ?? 0}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Recruiter Engagement: {profile?.profileSignals?.recruiterEngagementScore ?? 0}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Audience Growth: {profile?.profileSignals?.audienceGrowthScore ?? 0}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Creator Trust: {profile?.profileSignals?.creatorTrustScore ?? 0}</div>
                        <div className="rounded-xl bg-muted p-3 text-sm">Sponsor Readiness: {profile?.profileSignals?.sponsorReadinessScore ?? 0}</div>
                      </div>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <h2 className="font-semibold">Community</h2>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {(profile?.profileCommunity?.guestbook ?? []).slice(0, 3).map((item, index) => <div key={`guest-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                        {(profile?.profileCommunity?.fanComments ?? []).slice(0, 2).map((item, index) => <div key={`fan-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                        {(profile?.profileCommunity?.teamEndorsements ?? []).slice(0, 2).map((item, index) => <div key={`team-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {profileTab === "media" ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border p-4">
                    <h2 className="font-semibold">Media and Share Tools</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" asChild><Link href={publicResumeUrl}>Resume Style View</Link></Button>
                      <Button variant="outline" onClick={() => void navigator.clipboard.writeText(embedProfileCode)}>Embed Widget</Button>
                      <Button variant="outline" onClick={() => void navigator.clipboard.writeText(`PROFILE:${user.uid}`)}>QR Card</Button>
                      <Button variant="outline" onClick={() => void navigator.clipboard.writeText(shareCardText)}>Share Card</Button>
                    </div>
                    {profile?.profileExtras?.introVideoUrl ? <p className="mt-3 text-sm text-muted-foreground">Intro video ready</p> : null}
                    {profile?.profileExtras?.audioIntroUrl ? <p className="text-sm text-muted-foreground">Audio intro ready</p> : null}
                  </div>
                  <div className="rounded-2xl border p-4">
                    <h2 className="font-semibold">Story Highlights</h2>
                    {storyHighlights.length ? (
                      <div className="mt-3 space-y-3">
                        {storyHighlights.slice(0, 4).map((collection) => (
                          <div key={collection.id} className="rounded-xl bg-muted p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium">{collection.title}</p>
                              <span className="text-xs text-muted-foreground">{collection.stories.length} stories</span>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {collection.stories.slice(0, 3).map((story) => (
                                <div key={story.id} className="overflow-hidden rounded-lg bg-background">
                                  {story.mediaType === "video" ? (
                                    <video src={story.mediaUrl} className="aspect-square w-full object-cover" />
                                  ) : story.mediaType === "text" ? (
                                    <div className="aspect-square bg-gradient-to-br from-orange-500 via-rose-500 to-slate-900 p-3 text-xs font-semibold text-white">
                                      {story.textCard?.title || story.caption || collection.title}
                                    </div>
                                  ) : (
                                    <img src={story.mediaUrl} alt={story.caption || collection.title} className="aspect-square w-full object-cover" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">Save stories to highlight collections from the stories workspace to feature them here.</p>
                    )}
                  </div>
                  <div className="rounded-2xl border p-4">
                    <h2 className="font-semibold">Brands and Partnerships</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(profile?.profileCommunity?.favoriteBrands ?? []).map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
                      {(profile?.profileCommunity?.sponsorshipInterests ?? []).map((item) => <Badge key={item}>{item}</Badge>)}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {(profile?.profileCommunity?.partnershipHistory ?? []).map((item, index) => <div key={`partner-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                    </div>
                  </div>
                </div>
              ) : null}

              {profileTab === "recruiting" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <h2 className="font-semibold">Academic Profile</h2>
                    <p className="mt-2 text-sm">GPA: {profile?.academicProfile?.gpa || "Not listed"}</p>
                    <p className="text-sm">Eligibility: {profile?.academicProfile?.eligibilityStatus || "Not listed"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(profile?.academicProfile?.testScores ?? []).map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <h2 className="font-semibold">Recruiting Records</h2>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {(profile?.academicProfile?.visitHistory ?? []).map((item, index) => <div key={`visit-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      {(profile?.academicProfile?.offerHistory ?? []).map((item, index) => <div key={`offer-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                    </div>
                  </div>
                </div>
              ) : null}

              {profileTab === "team" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <h2 className="font-semibold">Team and Club History</h2>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {(profile?.academicProfile?.schoolHistory ?? []).map((item, index) => <div key={`school-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      {(profile?.academicProfile?.clubHistory ?? []).map((item, index) => <div key={`club-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      {(profile?.academicProfile?.campHistory ?? []).map((item, index) => <div key={`camp-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <h2 className="font-semibold">Endorsements and Notes</h2>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {(profile?.profileCommunity?.parentNotes ?? []).map((item, index) => <div key={`parent-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      {(profile?.profileCommunity?.mentorNotes ?? []).map((item, index) => <div key={`mentor-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      {(profile?.profileCommunity?.recommendationRequests ?? []).map((item, index) => <div key={`request-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                    </div>
                  </div>
                </div>
              ) : null}

              {profileTab === "career" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <h2 className="font-semibold">Career Goals and Resume</h2>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {(profile?.academicProfile?.careerGoals ?? []).map((item, index) => <div key={`goal-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      {(profile?.academicProfile?.resumeBullets ?? []).map((item, index) => <div key={`resume-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      {(profile?.profileSignals?.comparisonNotes ?? []).map((item, index) => <div key={`compare-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <h2 className="font-semibold">Vault and Availability</h2>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {(profile?.profileCommunity?.recommendationVault ?? []).map((item, index) => <div key={`vault-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      {(profile?.profileCommunity?.verifiedDocuments ?? []).map((item, index) => <div key={`doc-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                      {(profile?.profileCommunity?.publicAvailability ?? []).map((item, index) => <div key={`availability-${index}`} className="rounded-xl bg-muted p-3">{item}</div>)}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {profile?.business ? (
          <Card className="mx-4">
            <CardContent className="p-5">
              <h2 className="mb-3 font-semibold">Business</h2>
              <div className="flex flex-wrap gap-2">
                {profile.business.supportUrl ? (
                  <Button variant="outline" asChild>
                    <a href={profile.business.supportUrl} target="_blank" rel="noreferrer">Support Link</a>
                  </Button>
                ) : null}
                {profile.business.merchUrl ? (
                  <Button variant="outline" asChild>
                    <a href={profile.business.merchUrl} target="_blank" rel="noreferrer">Merch Link</a>
                  </Button>
                ) : null}
                <Button variant="outline" asChild>
                  <Link href="/business">Manage Business</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/bookings">Bookings</Link>
                </Button>
              </div>
              {profile.business.collaborationPitch ? (
                <p className="mt-3 text-sm text-muted-foreground">{profile.business.collaborationPitch}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 px-4">
          {profile?.athleteProfile ? (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-semibold">Athlete Card</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted p-4 text-center">
                    <div className="text-2xl font-bold">{profile.athleteProfile.stats?.pointsPerGame ?? 0}</div>
                    <div className="text-sm text-muted-foreground">PPG</div>
                  </div>
                  <div className="rounded-xl bg-muted p-4 text-center">
                    <div className="text-2xl font-bold">{profile.athleteProfile.stats?.assistsPerGame ?? 0}</div>
                    <div className="text-sm text-muted-foreground">APG</div>
                  </div>
                  <div className="rounded-xl bg-muted p-4 text-center">
                    <div className="text-2xl font-bold">{profile.athleteProfile.stats?.reboundsPerGame ?? 0}</div>
                    <div className="text-sm text-muted-foreground">RPG</div>
                  </div>
                </div>
                {profile.athleteProfile.skills?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.athleteProfile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                ) : null}
                {profile.athleteProfile.achievements?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.athleteProfile.achievements.map((achievement) => (
                      <Badge key={achievement}>{achievement}</Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {profile?.identity || profile?.milestones?.length ? (
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Identity</h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
                  <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
                    {profile?.identity?.quote ? (
                      <div className="rounded-xl bg-background p-4">
                        <div className="mb-2 flex items-center gap-2 text-primary">
                          <Quote className="h-4 w-4" />
                          <span className="text-sm font-semibold">Signature line</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{profile.identity.quote}</p>
                      </div>
                    ) : null}
                    <div className="grid gap-2 text-sm">
                      {profile?.identity?.website ? (
                        <a href={profile.identity.website} target="_blank" rel="noreferrer" className="rounded-xl border bg-background px-3 py-2 hover:bg-muted">
                          Website
                        </a>
                      ) : null}
                      {profile?.identity?.instagram ? (
                        <a
                          href={profile.identity.instagram.startsWith("http") ? profile.identity.instagram : `https://instagram.com/${profile.identity.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border bg-background px-3 py-2 hover:bg-muted"
                        >
                          Instagram
                        </a>
                      ) : null}
                      <Link href={`/resume/${user.uid}`} className="rounded-xl border bg-background px-3 py-2 hover:bg-muted">
                        Resume page
                      </Link>
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <p className="font-semibold">Milestone timeline</p>
                    </div>
                    {profile?.milestones?.length ? (
                      <div className="space-y-3">
                        {profile.milestones.slice(0, 5).map((milestone, index) => (
                          <div key={`${milestone.title}-${index}`} className="rounded-2xl border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold">{milestone.title || "Milestone"}</p>
                              {milestone.date ? <span className="text-xs text-muted-foreground">{milestone.date}</span> : null}
                            </div>
                            {milestone.detail ? <p className="mt-2 text-sm text-muted-foreground">{milestone.detail}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Add milestone lines in edit profile to show your progress, offers, awards, or career steps.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {profile?.profileExtras ? (
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Profile Media</h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {profile.profileExtras.introVideoUrl ? (
                    <div className="rounded-2xl border p-4">
                      <p className="mb-2 text-sm font-semibold">Personal intro video</p>
                      <a href={profile.profileExtras.introVideoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                        Open intro video
                      </a>
                    </div>
                  ) : null}
                  {profile.profileExtras.audioIntroUrl ? (
                    <div className="rounded-2xl border p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <Mic className="h-4 w-4 text-primary" />
                        Audio intro
                      </div>
                      <audio controls className="w-full" src={profile.profileExtras.audioIntroUrl} />
                    </div>
                  ) : null}
                </div>
                {profile.profileExtras.askMeAbout?.length ? (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold">Ask me about</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.profileExtras.askMeAbout.map((item) => (
                        <Badge key={item} variant="secondary">{item}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {profile?.profileExtras?.teamHistory?.length ? (
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Team History</h2>
                </div>
                <div className="space-y-3">
                  {profile.profileExtras.teamHistory.map((item, index) => (
                    <div key={`${item.season}-${item.team}-${index}`} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{item.team || "Team"}</p>
                        {item.season ? <span className="text-xs text-muted-foreground">{item.season}</span> : null}
                      </div>
                      {item.detail ? <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p> : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {profile?.profileExtras?.injuryStatus ? (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-2 font-semibold">Status Tracker</h2>
                <p className="text-sm text-muted-foreground">{profile.profileExtras.injuryStatus}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Profile Tools</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" asChild>
                  <Link href={publicResumeUrl}>Resume View</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/media-kit/${user.uid}`}>Media Kit</Link>
                </Button>
                {profile?.profileExtras?.sponsorshipDeckUrl ? (
                  <Button variant="outline" asChild>
                    <a href={profile.profileExtras.sponsorshipDeckUrl} target="_blank" rel="noreferrer">Sponsorship Deck</a>
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => void navigator.clipboard.writeText(embedProfileCode)}>
                  Copy Profile Embed
                </Button>
                <Button variant="outline" onClick={() => void navigator.clipboard.writeText(embedHighlightsCode)}>
                  Copy Highlights Embed
                </Button>
                <Button variant="outline" onClick={() => void navigator.clipboard.writeText(`PROFILE:${user.uid}`)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Copy QR Card Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {profile?.profileExtras?.linkBio?.length ? (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-semibold">Link In Bio</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {profile.profileExtras.linkBio.map((item, index) => (
                    <a
                      key={`${item.label}-${index}`}
                      href={item.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border p-4 text-sm hover:bg-muted/40"
                    >
                      <p className="font-semibold">{item.label || "Link"}</p>
                      <p className="mt-1 text-muted-foreground">{item.url}</p>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {(profile?.profileExtras?.coachEndorsements?.length || profile?.profileExtras?.peerEndorsements?.length) ? (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-semibold">Endorsements</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold">Coach endorsements</p>
                    <div className="space-y-2">
                      {(profile.profileExtras.coachEndorsements ?? []).map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-xl bg-muted p-3 text-sm">{item}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Peer endorsements</p>
                    <div className="space-y-2">
                      {(profile.profileExtras.peerEndorsements ?? []).map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-xl bg-muted p-3 text-sm">{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {seasonDashboard || recoverySnapshot ? (
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Performance Snapshot</h2>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/performance">Open Hub</Link>
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Season</p>
                    <p className="font-semibold">
                      {seasonDashboard ? `${seasonDashboard.wins}-${seasonDashboard.losses} · ${seasonDashboard.gamesPlayed} games` : "No games logged yet"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {seasonDashboard ? `${seasonDashboard.avgPoints} PTS · ${seasonDashboard.avgAssists} AST · ${seasonDashboard.avgRebounds} REB` : "Add game logs to unlock season averages"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Recovery</p>
                    <p className="font-semibold capitalize">
                      {recoverySnapshot?.latest ? `${recoverySnapshot.latest.status} on ${recoverySnapshot.latest.date}` : "No recovery entries yet"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {recoverySnapshot?.latest
                        ? `Energy ${recoverySnapshot.latest.energy}/10 · Soreness ${recoverySnapshot.latest.soreness}/10`
                        : "Track sleep, soreness, and body readiness in the hub"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {profile?.athleteProfile?.gameLogs?.length ? (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-semibold">Game Log</h2>
                <div className="space-y-3">
                  {profile.athleteProfile.gameLogs.slice(0, 5).map((log, index) => (
                    <div key={`${log.date}-${log.opponent}-${index}`} className="rounded-xl border p-3">
                      <p className="font-medium">{log.date} vs {log.opponent}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.points ?? 0} pts • {log.assists ?? 0} ast • {log.rebounds ?? 0} reb • {log.result || "Result n/a"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {settings?.pinnedPosts?.length ? (
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Pin className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Pinned Content</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {posts
                    .filter((post) => settings.pinnedPosts.includes(post.id))
                    .map((post) => (
                      <div key={post.id} className="overflow-hidden rounded-lg bg-muted">
                        {post.mediaType === "video" ? (
                          <video src={post.mediaUrl} className="aspect-square w-full object-cover" />
                        ) : (
                          <img src={post.mediaUrl} alt={post.caption || "Pinned post"} className="aspect-square w-full object-cover" />
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Saved Highlights</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                You have {profile?.savedPosts?.length ?? 0} saved posts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Your Content</h2>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setContentView("posts")}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      contentView === "posts" ? "bg-background shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Posts
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentView("reels")}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      contentView === "reels" ? "bg-background shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <PlaySquare className="h-4 w-4" />
                    Reels
                  </button>
                </div>
              </div>

              {visibleContent.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center">
                  <p className="font-medium">
                    {contentView === "reels" ? "No reels yet" : "No posts yet"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {contentView === "reels"
                      ? "Upload a reel and it will appear here on your profile."
                      : "Create a post and it will appear here on your profile."}
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href={contentView === "reels" ? "/upload" : "/upload"}>
                      {contentView === "reels" ? "Upload Reel" : "Create Post"}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visibleContent.map((post) => (
                    <div key={post.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                      <Link
                        href={post.contentType === "reel" ? `/reels?reel=${post.id}` : `/feed?post=${post.id}`}
                        className="absolute inset-0 z-10"
                        aria-label={post.contentType === "reel" ? "Open reel" : "Open post"}
                      />
                      {post.mediaType === "video" ? (
                        <>
                          <video src={post.mediaUrl} className="h-full w-full object-cover" />
                          {post.contentType === "reel" ? (
                            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">
                              Reel
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <img src={post.mediaUrl} alt={post.caption || "Post media"} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110" />
                      )}
                      <button
                        type="button"
                        className="absolute bottom-2 left-2 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-white opacity-0 transition-all group-hover:opacity-100"
                        disabled={pendingPostId === post.id}
                        onClick={async (event) => {
                          event.preventDefault();
                          setPendingPostId(post.id);
                          try {
                            await togglePostLike(post.id, post.likes.includes(user.uid));
                          } finally {
                            setPendingPostId(null);
                          }
                        }}
                      >
                        <span className="flex items-center gap-2 text-white">
                          <Heart className={`h-5 w-5 ${post.likes.includes(user.uid) ? "fill-current text-red-400" : "fill-current"}`} />
                          <span className="text-sm font-semibold">{post.likes.length}</span>
                        </span>
                      </button>
                      <details className="absolute right-2 top-2 z-20">
                        <summary className="flex list-none items-center justify-center rounded-full bg-black/60 p-2 text-white marker:hidden">
                          <Ellipsis className="h-4 w-4" />
                        </summary>
                        <div className="absolute right-0 top-10 z-20 min-w-[140px] overflow-hidden rounded-xl border bg-background shadow-lg">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() =>
                              void togglePinnedPost(
                                post.id,
                                Boolean(settings?.pinnedPosts?.includes(post.id))
                              ).then(() => getCurrentUserSettings().then(setSettings))
                            }
                          >
                            <Pin className={`h-4 w-4 ${settings?.pinnedPosts?.includes(post.id) ? "fill-current text-yellow-500" : ""}`} />
                            {settings?.pinnedPosts?.includes(post.id) ? "Unpin" : "Pin"}
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-muted"
                            onClick={async () => {
                              setPendingPostId(post.id);
                              try {
                                await deletePost(post.id);
                              } finally {
                                setPendingPostId(null);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfilePageContent />
    </AuthProvider>
  );
}
