"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Gem, Grid3X3, PlaySquare, Quote, ShieldAlert, Sparkles, Star, Trophy, UserX } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getJoinablePremiumGroups, toggleCreatorSubscription, type PremiumGroupRecord } from "@/lib/creator-hub";
import { reportEntity, toggleBlockedUser } from "@/lib/moderation";
import { subscribeToUserPosts, type FeedPost } from "@/lib/posts";
import { recordProfileVisit } from "@/lib/profile-analytics";
import { createPriorityInboxRequest, getCreatorMerchProducts, type MerchProductRecord } from "@/lib/phase6";
import { getUserProfileById, toggleFollowUser } from "@/lib/user-profile";
import { buildSiteUrl } from "@/lib/site";

interface PublicProfile {
  uid?: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  coverPhotoURL?: string;
  profileTheme?: string;
  verified?: boolean;
  blockedUsers?: string[];
  followers?: string[];
  following?: string[];
  subscriberIds?: string[];
  premiumGroupIds?: string[];
  pinnedPosts?: string[];
  settings?: {
    availabilityStatus?: string;
    headline?: string;
  };
  presence?: {
    isOnline?: boolean;
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
  role?: {
    type?: string;
    sport?: string;
    position?: string;
    team?: string;
    bio?: string;
    age?: number;
    height?: string;
  };
  business?: {
    supportUrl?: string;
    merchUrl?: string;
    collaborationPitch?: string;
    training?: {
      enabled?: boolean;
      title?: string;
      priceLabel?: string;
    };
    consultation?: {
      enabled?: boolean;
      title?: string;
      priceLabel?: string;
    };
  };
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

function buildProfileDescription(profile: PublicProfile, uid: string) {
  const roleText = [profile.role?.type, profile.role?.sport, profile.role?.position]
    .filter(Boolean)
    .join(", ");
  const bio = profile.role?.bio?.trim();
  const location = profile.location?.trim();
  const team = profile.role?.team?.trim();

  return [
    roleText ? `${profile.displayName || "HoopLink User"} profile` : profile.displayName || "HoopLink User",
    roleText || null,
    team ? `Team ${team}` : null,
    location || null,
    bio || `View highlights, reels, stats, and updates from ${profile.displayName || `user ${uid}`}.`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function RolePanel({ profile }: { profile: PublicProfile }) {
  const role = profile.role?.type;

  if (role === "athlete") {
    return (
      <div className="rounded-xl bg-muted p-4 text-sm">
        Athlete profile: {profile.role?.sport || "Sport not set"}
        {profile.role?.position ? ` • ${profile.role.position}` : ""}
        {profile.role?.age ? ` • ${profile.role.age}yo` : ""}
        {profile.role?.height ? ` • ${profile.role.height}` : ""}
      </div>
    );
  }

  if (role === "coach") {
    return (
      <div className="rounded-xl bg-muted p-4 text-sm">
        Coach profile focused on team-building, scouting, and player development.
      </div>
    );
  }

  if (role === "scout") {
    return (
      <div className="rounded-xl bg-muted p-4 text-sm">
        Scout profile focused on talent discovery, evaluation, and recruiting signals.
      </div>
    );
  }

  return <div className="rounded-xl bg-muted p-4 text-sm">Fan profile following athletes and sports communities.</div>;
}

export default function PublicProfilePage({ params }: { params: { uid: string } }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [premiumGroups, setPremiumGroups] = useState<PremiumGroupRecord[]>([]);
  const [subscriptionPending, setSubscriptionPending] = useState(false);
  const [merchProducts, setMerchProducts] = useState<MerchProductRecord[]>([]);
  const [contentView, setContentView] = useState<"posts" | "reels">("posts");
  const [profileTab, setProfileTab] = useState<"overview" | "media" | "recruiting" | "team" | "career">("overview");

  useEffect(() => {
    let cancelled = false;

    getUserProfileById(params.uid)
      .then((data) => {
        if (!cancelled) {
          setProfile((data as PublicProfile | null) ?? null);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    void getJoinablePremiumGroups(params.uid).then((groups) => {
      if (!cancelled) {
        setPremiumGroups(groups);
      }
    });
    void getCreatorMerchProducts(params.uid).then((items) => {
      if (!cancelled) {
        setMerchProducts(items);
      }
    });

    void recordProfileVisit(params.uid);

    const unsubscribe = subscribeToUserPosts(params.uid, setPosts);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [params.uid]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const pageTitle = `${profile.displayName || "HoopLink User"} | ${[
      profile.role?.sport,
      profile.role?.position,
      "HoopLink",
    ]
      .filter(Boolean)
      .join(" ")}`;
    const description = buildProfileDescription(profile, params.uid);
    const canonicalUrl = buildSiteUrl(`/profile/${params.uid}`);

    document.title = pageTitle;

    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.setAttribute("name", "description");
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute("content", description);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);
  }, [params.uid, profile]);

  const initials = useMemo(() => {
    const name = profile?.displayName || "Player";
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile?.displayName]);

  const standardPosts = useMemo(
    () => posts.filter((post) => post.contentType === "post"),
    [posts]
  );

  const reelPosts = useMemo(
    () => posts.filter((post) => post.contentType === "reel"),
    [posts]
  );

  const visibleContent = contentView === "reels" ? reelPosts : standardPosts;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return <div className="mx-auto max-w-2xl py-8">Profile not found.</div>;
  }

  const isSelf = user?.uid === params.uid;
  const isFollowing = Boolean(user && profile.followers?.includes(user.uid));
  const isSubscribed = Boolean(user && profile.subscriberIds?.includes(user.uid));
  const profileStructuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: buildSiteUrl(`/profile/${params.uid}`),
    name: `${profile.displayName || "HoopLink User"} on HoopLink`,
    description: buildProfileDescription(profile, params.uid),
    mainEntity: {
      "@type": "Person",
      name: profile.displayName || "HoopLink User",
      alternateName: profile.username ? `@${profile.username}` : undefined,
      description: profile.role?.bio || profile.identity?.tagline || undefined,
      homeLocation: profile.location || profile.identity?.hometown || undefined,
      jobTitle: [profile.role?.type, profile.role?.sport, profile.role?.position].filter(Boolean).join(" "),
      url: buildSiteUrl(`/profile/${params.uid}`),
      image: profile.photoURL || buildSiteUrl("/icon.svg"),
    },
  };

  return (
    <div className="mx-auto max-w-3xl py-8">
      <Script
        id={`profile-structured-data-${params.uid}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileStructuredData) }}
      />
      <Card>
        <CardContent className="p-6">
          <div className={`-mx-6 -mt-6 mb-6 h-40 overflow-hidden bg-gradient-to-r ${getProfileThemeClass(profile.profileTheme)}`}>
            {profile.coverPhotoURL ? (
              <img src={profile.coverPhotoURL} alt="Cover" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col gap-6 sm:flex-row">
            <Avatar className="h-28 w-28">
              <AvatarImage src={profile.photoURL || ""} />
              <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h1 className="text-3xl font-bold">{profile.displayName || "HoopLink User"}</h1>
                {profile.verified ? <Badge variant="secondary">{getVerifiedRoleLabel(profile.role?.type)}</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username || params.uid.slice(0, 8)}</p>
              {profile.profileCommunity?.nickname ? <p className="text-xs text-muted-foreground">Also known as {profile.profileCommunity.nickname}</p> : null}
              <p className="text-muted-foreground">
                {[profile.role?.type, profile.role?.sport, profile.role?.position].filter(Boolean).join(" • ")}
              </p>
              {profile.settings?.headline ? <p className="mt-1 text-sm font-medium text-primary">{profile.settings.headline}</p> : null}
              {profile.identity?.tagline ? <p className="mt-1 text-sm font-semibold">{profile.identity.tagline}</p> : null}
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.presence?.isOnline ? "Online now" : "Offline"}
                {profile.settings?.availabilityStatus ? ` • ${profile.settings.availabilityStatus.replace("_", " ")}` : ""}
              </p>
              {profile.role?.team ? <p className="mt-1 text-sm text-muted-foreground">Team: {profile.role.team}</p> : null}
              <p className="mt-3">{profile.role?.bio || "No bio yet."}</p>
              {profile.profileCommunity?.signatureLine ? <p className="mt-1 text-sm font-medium text-primary">{profile.profileCommunity.signatureLine}</p> : null}
              {profile.profileCommunity?.localLanguageBio ? <p className="mt-1 text-sm text-muted-foreground">{profile.profileCommunity.localLanguageBio}</p> : null}
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span>{profile.followers?.length ?? 0} followers</span>
                <span>{profile.following?.length ?? 0} following</span>
                <span>{standardPosts.length} posts</span>
                <span>{reelPosts.length} reels</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.identity?.pronouns ? <Badge variant="outline">{profile.identity.pronouns}</Badge> : null}
                {profile.identity?.hometown ? <Badge variant="outline">{profile.identity.hometown}</Badge> : null}
                {profile.identity?.gradYear ? <Badge variant="outline">Class of {profile.identity.gradYear}</Badge> : null}
                {profile.profileExtras?.recruitingAvailable ? <Badge variant="outline">Recruiting Open</Badge> : null}
                {profile.profileExtras?.transferInterest ? <Badge variant="outline">Transfer Interest</Badge> : null}
                {profile.profileExtras?.nilInterest ? <Badge variant="outline">NIL Open</Badge> : null}
                {profile.profileExtras?.parentManaged ? <Badge variant="outline">Parent Managed</Badge> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {isSelf ? (
                  <Button asChild>
                    <Link href="/edit-profile">Edit profile</Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      disabled={!user || pending}
                      onClick={async () => {
                        setPending(true);
                        try {
                          await toggleFollowUser(params.uid, isFollowing);
                          const refreshed = await getUserProfileById(params.uid);
                          setProfile((refreshed as PublicProfile | null) ?? null);
                        } finally {
                          setPending(false);
                        }
                      }}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/messages?user=${params.uid}`}>Message</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/marketplace?creator=${params.uid}`}>Tip / Review</Link>
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!user}
                      onClick={() => void createPriorityInboxRequest({ creatorId: params.uid, note: "I want priority access to your inbox.", priceLabel: "$25" })}
                    >
                      Priority DM
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/resume/${params.uid}`}>Resume</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/media-kit/${params.uid}`}>Media Kit</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/newsletter/${params.uid}`}>Newsletter</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/blog/${params.uid}`}>Blog</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/athlete/${params.uid}`}>Landing Page</Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/profile/${params.uid}`)}
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!user || subscriptionPending}
                      onClick={async () => {
                        setSubscriptionPending(true);
                        try {
                          await toggleCreatorSubscription(params.uid, isSubscribed);
                          const refreshed = await getUserProfileById(params.uid);
                          setProfile((refreshed as PublicProfile | null) ?? null);
                        } finally {
                          setSubscriptionPending(false);
                        }
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isSubscribed ? "Subscribed" : "Subscribe"}
                    </Button>
                    {profile.business?.training?.enabled ? (
                      <Button variant="outline" asChild>
                        <Link href={`/bookings?host=${params.uid}&type=training`}>
                          {profile.business.training.title || "Book Training"}
                        </Link>
                      </Button>
                    ) : null}
                    {profile.business?.consultation?.enabled ? (
                      <Button variant="outline" asChild>
                        <Link href={`/bookings?host=${params.uid}&type=consultation`}>
                          {profile.business.consultation.title || "Book Consultation"}
                        </Link>
                      </Button>
                    ) : null}
                    <Button variant="outline" asChild>
                      <Link href={`/recruiting?target=${params.uid}`}>
                        <Star className="mr-2 h-4 w-4" />
                        Scout
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      disabled={blocking}
                      onClick={async () => {
                        setBlocking(true);
                        try {
                          await toggleBlockedUser(params.uid, false);
                        } finally {
                          setBlocking(false);
                        }
                      }}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Block
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        void reportEntity({
                          targetId: params.uid,
                          targetType: "user",
                          reason: "profile",
                          details: "Reported from public profile page.",
                        })
                      }
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Report
                    </Button>
                  </>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1 sm:grid-cols-5">
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
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 rounded-xl border p-4">
        {profileTab === "overview" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-muted p-4">
              <p className="font-semibold">Identity Snapshot</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {profile.identity?.hometown ? <Badge variant="outline">{profile.identity.hometown}</Badge> : null}
                {profile.identity?.gradYear ? <Badge variant="outline">Class of {profile.identity.gradYear}</Badge> : null}
                {profile.profileCommunity?.contactPreference ? <Badge variant="outline">Contact: {profile.profileCommunity.contactPreference}</Badge> : null}
                {profile.business?.training?.enabled ? <Badge variant="outline">Booking Ready</Badge> : null}
                {profile.profileExtras?.recruitingAvailable ? <Badge variant="outline">Looking for Team</Badge> : null}
              </div>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="font-semibold">Signals</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                <div>Profile Visits: {profile.profileSignals?.profileVisits ?? 0}</div>
                <div>Scout Visits: {profile.profileSignals?.scoutVisits ?? 0}</div>
                <div>Audience Growth: {profile.profileSignals?.audienceGrowthScore ?? 0}</div>
                <div>Trust Score: {profile.profileSignals?.creatorTrustScore ?? 0}</div>
              </div>
            </div>
          </div>
        ) : null}
        {profileTab === "media" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-muted p-4 text-sm">Intro video, audio intro, sponsorship deck, QR card, and share card tools are active on this profile.</div>
            <div className="rounded-xl bg-muted p-4 text-sm">
              {(profile.profileCommunity?.favoriteBrands ?? []).concat(profile.profileCommunity?.sponsorshipInterests ?? []).join(" • ") || "No brand preferences listed."}
            </div>
          </div>
        ) : null}
        {profileTab === "recruiting" ? (
          <div className="grid gap-4 lg:grid-cols-2 text-sm">
            <div className="rounded-xl bg-muted p-4">
              GPA: {profile.academicProfile?.gpa || "Not listed"}<br />
              Eligibility: {profile.academicProfile?.eligibilityStatus || "Not listed"}
            </div>
            <div className="rounded-xl bg-muted p-4">
              {(profile.academicProfile?.offerHistory ?? []).join(" • ") || "No offers shared yet."}
            </div>
          </div>
        ) : null}
        {profileTab === "team" ? (
          <div className="grid gap-4 lg:grid-cols-2 text-sm">
            <div className="rounded-xl bg-muted p-4">{(profile.academicProfile?.schoolHistory ?? []).join(" • ") || "No school history shared yet."}</div>
            <div className="rounded-xl bg-muted p-4">{(profile.profileCommunity?.teamEndorsements ?? []).join(" • ") || "No team endorsements shared yet."}</div>
          </div>
        ) : null}
        {profileTab === "career" ? (
          <div className="grid gap-4 lg:grid-cols-2 text-sm">
            <div className="rounded-xl bg-muted p-4">{(profile.academicProfile?.careerGoals ?? []).join(" • ") || "No career goals shared yet."}</div>
            <div className="rounded-xl bg-muted p-4">{(profile.profileCommunity?.verifiedDocuments ?? []).join(" • ") || "No verified documents shared yet."}</div>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
              <RolePanel profile={profile} />

              {merchProducts.length ? (
                <div className="mt-6 rounded-xl border p-4">
                  <p className="font-semibold">Storefront</p>
                  <div className="mt-3 space-y-2">
                    {merchProducts.slice(0, 3).map((product) => (
                      <div key={product.id} className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{product.title}</p>
                        <p className="text-muted-foreground">{product.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{product.priceLabel}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
      </div>

      {profile.business ? (
        <div className="mt-6 rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">Creator Links</h2>
          <div className="flex flex-wrap gap-2">
            {profile.business.supportUrl ? (
              <a
                href={profile.business.supportUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40"
              >
                Support
              </a>
            ) : null}
            {profile.business.merchUrl ? (
              <a
                href={profile.business.merchUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40"
              >
                Merch
              </a>
            ) : null}
          </div>
          {profile.business.collaborationPitch ? (
            <p className="mt-3 text-sm text-muted-foreground">{profile.business.collaborationPitch}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {profile.business.training?.enabled ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                Training: {profile.business.training.priceLabel || "Available"}
              </span>
            ) : null}
            {profile.business.consultation?.enabled ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                Consultation: {profile.business.consultation.priceLabel || "Available"}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {profile.profileExtras ? (
        <div className="mt-6 rounded-xl border p-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              {profile.identity?.quote ? (
                <div className="rounded-xl bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <Quote className="h-4 w-4" />
                    <span className="text-sm font-semibold">Signature line</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{profile.identity.quote}</p>
                </div>
              ) : null}
              {profile.profileExtras.askMeAbout?.length ? (
                <div>
                  <p className="mb-2 text-sm font-semibold">Ask me about</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.profileExtras.askMeAbout.map((item) => (
                      <Badge key={item} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {profile.profileExtras.introVideoUrl ? (
                  <a href={profile.profileExtras.introVideoUrl} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">
                    Intro Video
                  </a>
                ) : null}
                {profile.profileExtras.audioIntroUrl ? (
                  <a href={profile.profileExtras.audioIntroUrl} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">
                    Audio Intro
                  </a>
                ) : null}
                {profile.profileExtras.sponsorshipDeckUrl ? (
                  <a href={profile.profileExtras.sponsorshipDeckUrl} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">
                    Sponsorship Deck
                  </a>
                ) : null}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Milestone timeline</h2>
              </div>
              {profile.milestones?.length ? (
                <div className="space-y-3">
                  {profile.milestones.slice(0, 5).map((milestone, index) => (
                    <div key={`${milestone.title}-${index}`} className="rounded-xl bg-muted p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{milestone.title || "Milestone"}</p>
                        {milestone.date ? <span className="text-xs text-muted-foreground">{milestone.date}</span> : null}
                      </div>
                      {milestone.detail ? <p className="mt-2 text-sm text-muted-foreground">{milestone.detail}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No milestones shared yet.</p>
              )}
            </div>
          </div>
          {profile.profileExtras.linkBio?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {profile.profileExtras.linkBio.map((item, index) => (
                <a
                  key={`${item.label}-${index}`}
                  href={item.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border p-4 text-sm hover:bg-muted/40"
                >
                  <p className="font-semibold">{item.label || "Link"}</p>
                  <p className="mt-1 text-muted-foreground">{item.url}</p>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {profile.profileExtras?.teamHistory?.length ? (
        <div className="mt-6 rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">Team History</h2>
          <div className="space-y-3">
            {profile.profileExtras.teamHistory.map((item, index) => (
              <div key={`${item.season}-${item.team}-${index}`} className="rounded-xl bg-muted p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.team || "Team"}</p>
                  {item.season ? <span className="text-xs text-muted-foreground">{item.season}</span> : null}
                </div>
                {item.detail ? <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(profile.profileExtras?.coachEndorsements?.length || profile.profileExtras?.peerEndorsements?.length) ? (
        <div className="mt-6 rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">Endorsements</h2>
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
        </div>
      ) : null}

      {premiumGroups.length ? (
        <div className="mt-6 rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Premium Groups</h2>
              <p className="text-sm text-muted-foreground">
                Join creator communities for subscriber-only content and member access.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/groups">
                <Gem className="mr-2 h-4 w-4" />
                Browse All
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {premiumGroups.map((group) => (
              <div key={group.id} className="rounded-xl bg-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                  <Badge variant="secondary">{group.priceLabel}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {profile.athleteProfile ? (
        <div className="mt-6 rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">Athlete Card</h2>
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
        </div>
      ) : null}

      {profile.athleteProfile?.gameLogs?.length ? (
        <div className="mt-6 rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">Game Log</h2>
          <div className="space-y-3">
            {profile.athleteProfile.gameLogs.slice(0, 5).map((log, index) => (
              <div key={`${log.date}-${log.opponent}-${index}`} className="rounded-xl bg-muted p-3">
                <p className="font-medium">{log.date} vs {log.opponent}</p>
                <p className="text-sm text-muted-foreground">
                  {log.points ?? 0} pts • {log.assists ?? 0} ast • {log.rebounds ?? 0} reb • {log.result || "Result n/a"}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {profile.pinnedPosts?.length ? (
        <div className="mt-6 rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">Pinned Content</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {posts
              .filter((post) => profile.pinnedPosts?.includes(post.id))
              .map((post) => (
                <div key={post.id} className="aspect-square overflow-hidden rounded-xl bg-muted">
                  {post.mediaType === "video" ? (
                    <video src={post.mediaUrl} className="h-full w-full object-cover" />
                  ) : (
                    <img src={post.mediaUrl} alt={post.caption} className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border p-4">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">Content</h2>
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
                ? "Reels will appear here when this user publishes them."
                : "Posts will appear here when this user publishes them."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleContent.map((post) => (
              <Link
                key={post.id}
                href={post.contentType === "reel" ? `/reels?reel=${post.id}` : `/feed?post=${post.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
              >
                {post.mediaType === "video" ? (
                  <video src={post.mediaUrl} className="h-full w-full object-cover" />
                ) : (
                  <img src={post.mediaUrl} alt={post.caption} className="h-full w-full object-cover" />
                )}
                {post.contentType === "reel" ? (
                  <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">
                    Reel
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
