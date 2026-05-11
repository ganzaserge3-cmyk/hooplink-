"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUserProfile, updateCurrentUserProfile } from "@/lib/user-profile";
import { getCurrentUserSettings, updateCurrentUserSettings } from "@/lib/settings";

function EditProfilePageContent() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    sport: "",
    position: "",
    team: "",
    experience: "",
    age: "",
    height: "",
    location: "",
    bio: "",
    headline: "",
    availabilityStatus: "available",
    tagline: "",
    pronouns: "",
    hometown: "",
    gradYear: "",
    website: "",
    instagram: "",
    quote: "",
    nickname: "",
    signatureLine: "",
    localLanguageBio: "",
    introVideoUrl: "",
    audioIntroUrl: "",
    askMeAbout: "",
    teamHistory: "",
    injuryStatus: "",
    recruitingAvailable: false,
    transferInterest: false,
    nilInterest: false,
    parentManaged: false,
    sponsorshipDeckUrl: "",
    linkBio: "",
    coachEndorsements: "",
    peerEndorsements: "",
    academicGpa: "",
    academicTestScores: "",
    transcriptLinks: "",
    eligibilityStatus: "",
    schoolHistory: "",
    clubHistory: "",
    campHistory: "",
    visitHistory: "",
    offerHistory: "",
    resumeBullets: "",
    careerGoals: "",
    profileVisits: "",
    scoutVisits: "",
    recruiterEngagementScore: "",
    audienceGrowthScore: "",
    creatorTrustScore: "",
    sponsorReadinessScore: "",
    profileCompletenessScore: "",
    comparisonNotes: "",
    guestbook: "",
    fanComments: "",
    teamEndorsements: "",
    parentNotes: "",
    mentorNotes: "",
    recommendationRequests: "",
    recommendationVault: "",
    verifiedDocuments: "",
    favoriteBrands: "",
    sponsorshipInterests: "",
    partnershipHistory: "",
    contactPreference: "",
    publicAvailability: "",
    roleTabs: "",
    wingspan: "",
    weight: "",
    verticalLeap: "",
    sprintTime: "",
    pointsPerGame: "",
    assistsPerGame: "",
    reboundsPerGame: "",
    skills: "",
    achievements: "",
    gameLogs: "",
    milestones: "",
    profileTheme: "classic",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    getCurrentUserProfile().then((profile) => {
      const role = (profile?.role as Record<string, unknown> | undefined) ?? {};
      const athleteProfile = (profile?.athleteProfile as Record<string, unknown> | undefined) ?? {};
      const identity = (profile?.identity as Record<string, unknown> | undefined) ?? {};
      const profileExtras = (profile?.profileExtras as Record<string, unknown> | undefined) ?? {};
      const academicProfile = (profile?.academicProfile as Record<string, unknown> | undefined) ?? {};
      const profileSignals = (profile?.profileSignals as Record<string, unknown> | undefined) ?? {};
      const profileCommunity = (profile?.profileCommunity as Record<string, unknown> | undefined) ?? {};
      const athleticMeasurements = (profile?.athleticMeasurements as Record<string, unknown> | undefined) ?? {};
      const stats = (athleteProfile.stats as Record<string, unknown> | undefined) ?? {};
      const gameLogs = Array.isArray(athleteProfile.gameLogs)
        ? (athleteProfile.gameLogs as Array<Record<string, unknown>>)
        : [];
      const milestones = Array.isArray(profile?.milestones)
        ? (profile?.milestones as Array<Record<string, unknown>>)
        : [];

      setFormData({
        displayName: user.displayName || String(profile?.displayName ?? ""),
        username: String(profile?.username ?? user.uid.slice(0, 8)),
        sport: String(role.sport ?? ""),
        position: String(role.position ?? ""),
        team: String(role.team ?? ""),
        experience: String(role.experience ?? ""),
        age: role.age ? String(role.age) : "",
        height: String(role.height ?? ""),
        location: String(profile?.location ?? ""),
        bio: String(role.bio ?? ""),
        headline: "",
        availabilityStatus: "available",
        tagline: String(identity.tagline ?? ""),
        pronouns: String(identity.pronouns ?? ""),
        hometown: String(identity.hometown ?? ""),
        gradYear: String(identity.gradYear ?? ""),
        website: String(identity.website ?? ""),
        instagram: String(identity.instagram ?? ""),
        quote: String(identity.quote ?? ""),
        nickname: String(profileCommunity.nickname ?? ""),
        signatureLine: String(profileCommunity.signatureLine ?? ""),
        localLanguageBio: String(profileCommunity.localLanguageBio ?? ""),
        introVideoUrl: String(profileExtras.introVideoUrl ?? ""),
        audioIntroUrl: String(profileExtras.audioIntroUrl ?? ""),
        askMeAbout: Array.isArray(profileExtras.askMeAbout) ? (profileExtras.askMeAbout as string[]).join(", ") : "",
        teamHistory: Array.isArray(profileExtras.teamHistory)
          ? (profileExtras.teamHistory as Array<Record<string, unknown>>)
              .map((item) => [String(item.season ?? ""), String(item.team ?? ""), String(item.detail ?? "")].join("|"))
              .join("\n")
          : "",
        injuryStatus: String(profileExtras.injuryStatus ?? ""),
        recruitingAvailable: profileExtras.recruitingAvailable === true,
        transferInterest: profileExtras.transferInterest === true,
        nilInterest: profileExtras.nilInterest === true,
        parentManaged: profileExtras.parentManaged === true,
        sponsorshipDeckUrl: String(profileExtras.sponsorshipDeckUrl ?? ""),
        linkBio: Array.isArray(profileExtras.linkBio)
          ? (profileExtras.linkBio as Array<Record<string, unknown>>)
              .map((item) => [String(item.label ?? ""), String(item.url ?? "")].join("|"))
              .join("\n")
          : "",
        coachEndorsements: Array.isArray(profileExtras.coachEndorsements) ? (profileExtras.coachEndorsements as string[]).join("\n") : "",
        peerEndorsements: Array.isArray(profileExtras.peerEndorsements) ? (profileExtras.peerEndorsements as string[]).join("\n") : "",
        academicGpa: String(academicProfile.gpa ?? ""),
        academicTestScores: Array.isArray(academicProfile.testScores) ? (academicProfile.testScores as string[]).join("\n") : "",
        transcriptLinks: Array.isArray(academicProfile.transcriptLinks) ? (academicProfile.transcriptLinks as string[]).join("\n") : "",
        eligibilityStatus: String(academicProfile.eligibilityStatus ?? ""),
        schoolHistory: Array.isArray(academicProfile.schoolHistory) ? (academicProfile.schoolHistory as string[]).join("\n") : "",
        clubHistory: Array.isArray(academicProfile.clubHistory) ? (academicProfile.clubHistory as string[]).join("\n") : "",
        campHistory: Array.isArray(academicProfile.campHistory) ? (academicProfile.campHistory as string[]).join("\n") : "",
        visitHistory: Array.isArray(academicProfile.visitHistory) ? (academicProfile.visitHistory as string[]).join("\n") : "",
        offerHistory: Array.isArray(academicProfile.offerHistory) ? (academicProfile.offerHistory as string[]).join("\n") : "",
        resumeBullets: Array.isArray(academicProfile.resumeBullets) ? (academicProfile.resumeBullets as string[]).join("\n") : "",
        careerGoals: Array.isArray(academicProfile.careerGoals) ? (academicProfile.careerGoals as string[]).join("\n") : "",
        profileVisits: profileSignals.profileVisits ? String(profileSignals.profileVisits) : "",
        scoutVisits: profileSignals.scoutVisits ? String(profileSignals.scoutVisits) : "",
        recruiterEngagementScore: profileSignals.recruiterEngagementScore ? String(profileSignals.recruiterEngagementScore) : "",
        audienceGrowthScore: profileSignals.audienceGrowthScore ? String(profileSignals.audienceGrowthScore) : "",
        creatorTrustScore: profileSignals.creatorTrustScore ? String(profileSignals.creatorTrustScore) : "",
        sponsorReadinessScore: profileSignals.sponsorReadinessScore ? String(profileSignals.sponsorReadinessScore) : "",
        profileCompletenessScore: profileSignals.profileCompletenessScore ? String(profileSignals.profileCompletenessScore) : "",
        comparisonNotes: Array.isArray(profileSignals.comparisonNotes) ? (profileSignals.comparisonNotes as string[]).join("\n") : "",
        guestbook: Array.isArray(profileCommunity.guestbook) ? (profileCommunity.guestbook as string[]).join("\n") : "",
        fanComments: Array.isArray(profileCommunity.fanComments) ? (profileCommunity.fanComments as string[]).join("\n") : "",
        teamEndorsements: Array.isArray(profileCommunity.teamEndorsements) ? (profileCommunity.teamEndorsements as string[]).join("\n") : "",
        parentNotes: Array.isArray(profileCommunity.parentNotes) ? (profileCommunity.parentNotes as string[]).join("\n") : "",
        mentorNotes: Array.isArray(profileCommunity.mentorNotes) ? (profileCommunity.mentorNotes as string[]).join("\n") : "",
        recommendationRequests: Array.isArray(profileCommunity.recommendationRequests) ? (profileCommunity.recommendationRequests as string[]).join("\n") : "",
        recommendationVault: Array.isArray(profileCommunity.recommendationVault) ? (profileCommunity.recommendationVault as string[]).join("\n") : "",
        verifiedDocuments: Array.isArray(profileCommunity.verifiedDocuments) ? (profileCommunity.verifiedDocuments as string[]).join("\n") : "",
        favoriteBrands: Array.isArray(profileCommunity.favoriteBrands) ? (profileCommunity.favoriteBrands as string[]).join(", ") : "",
        sponsorshipInterests: Array.isArray(profileCommunity.sponsorshipInterests) ? (profileCommunity.sponsorshipInterests as string[]).join(", ") : "",
        partnershipHistory: Array.isArray(profileCommunity.partnershipHistory) ? (profileCommunity.partnershipHistory as string[]).join("\n") : "",
        contactPreference: String(profileCommunity.contactPreference ?? ""),
        publicAvailability: Array.isArray(profileCommunity.publicAvailability) ? (profileCommunity.publicAvailability as string[]).join("\n") : "",
        roleTabs: Array.isArray(profileCommunity.roleTabs) ? (profileCommunity.roleTabs as string[]).join(", ") : "",
        wingspan: String(athleticMeasurements.wingspan ?? ""),
        weight: String(athleticMeasurements.weight ?? ""),
        verticalLeap: String(athleticMeasurements.verticalLeap ?? ""),
        sprintTime: String(athleticMeasurements.sprintTime ?? ""),
        pointsPerGame: stats.pointsPerGame ? String(stats.pointsPerGame) : "",
        assistsPerGame: stats.assistsPerGame ? String(stats.assistsPerGame) : "",
        reboundsPerGame: stats.reboundsPerGame ? String(stats.reboundsPerGame) : "",
        skills: Array.isArray(athleteProfile.skills) ? (athleteProfile.skills as string[]).join(", ") : "",
        achievements: Array.isArray(athleteProfile.achievements) ? (athleteProfile.achievements as string[]).join(", ") : "",
        gameLogs: gameLogs
          .map((log) =>
            [
              String(log.date ?? ""),
              String(log.opponent ?? ""),
              String(log.points ?? ""),
              String(log.assists ?? ""),
              String(log.rebounds ?? ""),
              String(log.result ?? ""),
            ].join("|")
          )
          .join("\n"),
        milestones: milestones
          .map((item) =>
            [
              String(item.date ?? ""),
              String(item.title ?? ""),
              String(item.detail ?? ""),
            ].join("|")
          )
          .join("\n"),
        profileTheme: String(profile?.profileTheme ?? "classic"),
      });
    });

    void getCurrentUserSettings().then((settings) => {
      setFormData((current) => ({
        ...current,
        headline: settings.headline,
        availabilityStatus: settings.availabilityStatus,
      }));
    });
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateCurrentUserProfile({
        displayName: formData.displayName,
        username: formData.username,
        sport: formData.sport,
        position: formData.position,
        team: formData.team,
        experience: formData.experience,
        age: formData.age ? Number(formData.age) : undefined,
        height: formData.height,
        location: formData.location,
        bio: formData.bio,
        avatarFile,
        coverPhotoFile,
        profileTheme: formData.profileTheme,
        identity: {
          tagline: formData.tagline,
          pronouns: formData.pronouns,
          hometown: formData.hometown,
          gradYear: formData.gradYear,
          website: formData.website,
          instagram: formData.instagram,
          quote: formData.quote,
        },
        profileExtras: {
          introVideoUrl: formData.introVideoUrl,
          audioIntroUrl: formData.audioIntroUrl,
          askMeAbout: formData.askMeAbout.split(",").map((value) => value.trim()).filter(Boolean),
          teamHistory: formData.teamHistory
            .split("\n")
            .map((row) => row.trim())
            .filter(Boolean)
            .map((row) => {
              const [season, team, detail] = row.split("|");
              return {
                season: (season ?? "").trim(),
                team: (team ?? "").trim(),
                detail: (detail ?? "").trim(),
              };
            }),
          injuryStatus: formData.injuryStatus,
          recruitingAvailable: formData.recruitingAvailable,
          transferInterest: formData.transferInterest,
          nilInterest: formData.nilInterest,
          parentManaged: formData.parentManaged,
          sponsorshipDeckUrl: formData.sponsorshipDeckUrl,
          linkBio: formData.linkBio
            .split("\n")
            .map((row) => row.trim())
            .filter(Boolean)
            .map((row) => {
              const [label, url] = row.split("|");
              return {
                label: (label ?? "").trim(),
                url: (url ?? "").trim(),
              };
            }),
          coachEndorsements: formData.coachEndorsements.split("\n").map((value) => value.trim()).filter(Boolean),
          peerEndorsements: formData.peerEndorsements.split("\n").map((value) => value.trim()).filter(Boolean),
        },
        milestones: formData.milestones
          .split("\n")
          .map((row) => row.trim())
          .filter(Boolean)
          .map((row) => {
            const [date, title, detail] = row.split("|");
            return {
              date: (date ?? "").trim(),
              title: (title ?? "").trim(),
              detail: (detail ?? "").trim(),
            };
          }),
        stats: {
          pointsPerGame: formData.pointsPerGame ? Number(formData.pointsPerGame) : undefined,
          assistsPerGame: formData.assistsPerGame ? Number(formData.assistsPerGame) : undefined,
          reboundsPerGame: formData.reboundsPerGame ? Number(formData.reboundsPerGame) : undefined,
        },
        skills: formData.skills.split(",").map((value) => value.trim()).filter(Boolean),
        achievements: formData.achievements.split(",").map((value) => value.trim()).filter(Boolean),
        gameLogs: formData.gameLogs
          .split("\n")
          .map((row) => row.trim())
          .filter(Boolean)
          .map((row) => {
            const [date, opponent, points, assists, rebounds, result] = row.split("|");
            return {
              date: (date ?? "").trim(),
              opponent: (opponent ?? "").trim(),
              points: points ? Number(points.trim()) : undefined,
              assists: assists ? Number(assists.trim()) : undefined,
              rebounds: rebounds ? Number(rebounds.trim()) : undefined,
              result: (result ?? "").trim(),
            };
          }),
        academicProfile: {
          gpa: formData.academicGpa,
          testScores: formData.academicTestScores.split("\n").map((value) => value.trim()).filter(Boolean),
          transcriptLinks: formData.transcriptLinks.split("\n").map((value) => value.trim()).filter(Boolean),
          eligibilityStatus: formData.eligibilityStatus,
          schoolHistory: formData.schoolHistory.split("\n").map((value) => value.trim()).filter(Boolean),
          clubHistory: formData.clubHistory.split("\n").map((value) => value.trim()).filter(Boolean),
          campHistory: formData.campHistory.split("\n").map((value) => value.trim()).filter(Boolean),
          visitHistory: formData.visitHistory.split("\n").map((value) => value.trim()).filter(Boolean),
          offerHistory: formData.offerHistory.split("\n").map((value) => value.trim()).filter(Boolean),
          resumeBullets: formData.resumeBullets.split("\n").map((value) => value.trim()).filter(Boolean),
          careerGoals: formData.careerGoals.split("\n").map((value) => value.trim()).filter(Boolean),
        },
        profileSignals: {
          profileVisits: formData.profileVisits ? Number(formData.profileVisits) : 0,
          scoutVisits: formData.scoutVisits ? Number(formData.scoutVisits) : 0,
          recruiterEngagementScore: formData.recruiterEngagementScore ? Number(formData.recruiterEngagementScore) : 0,
          audienceGrowthScore: formData.audienceGrowthScore ? Number(formData.audienceGrowthScore) : 0,
          creatorTrustScore: formData.creatorTrustScore ? Number(formData.creatorTrustScore) : 0,
          sponsorReadinessScore: formData.sponsorReadinessScore ? Number(formData.sponsorReadinessScore) : 0,
          profileCompletenessScore: formData.profileCompletenessScore ? Number(formData.profileCompletenessScore) : 0,
          comparisonNotes: formData.comparisonNotes.split("\n").map((value) => value.trim()).filter(Boolean),
        },
        profileCommunity: {
          nickname: formData.nickname,
          signatureLine: formData.signatureLine,
          localLanguageBio: formData.localLanguageBio,
          guestbook: formData.guestbook.split("\n").map((value) => value.trim()).filter(Boolean),
          fanComments: formData.fanComments.split("\n").map((value) => value.trim()).filter(Boolean),
          teamEndorsements: formData.teamEndorsements.split("\n").map((value) => value.trim()).filter(Boolean),
          parentNotes: formData.parentNotes.split("\n").map((value) => value.trim()).filter(Boolean),
          mentorNotes: formData.mentorNotes.split("\n").map((value) => value.trim()).filter(Boolean),
          recommendationRequests: formData.recommendationRequests.split("\n").map((value) => value.trim()).filter(Boolean),
          recommendationVault: formData.recommendationVault.split("\n").map((value) => value.trim()).filter(Boolean),
          verifiedDocuments: formData.verifiedDocuments.split("\n").map((value) => value.trim()).filter(Boolean),
          favoriteBrands: formData.favoriteBrands.split(",").map((value) => value.trim()).filter(Boolean),
          sponsorshipInterests: formData.sponsorshipInterests.split(",").map((value) => value.trim()).filter(Boolean),
          partnershipHistory: formData.partnershipHistory.split("\n").map((value) => value.trim()).filter(Boolean),
          contactPreference: formData.contactPreference,
          publicAvailability: formData.publicAvailability.split("\n").map((value) => value.trim()).filter(Boolean),
          roleTabs: formData.roleTabs.split(",").map((value) => value.trim()).filter(Boolean),
        },
        athleticMeasurements: {
          wingspan: formData.wingspan,
          weight: formData.weight,
          verticalLeap: formData.verticalLeap,
          sprintTime: formData.sprintTime,
        },
      });
      await updateCurrentUserSettings({
        headline: formData.headline,
        availabilityStatus: formData.availabilityStatus as "available" | "locked_in" | "recovering",
      });
      router.push("/profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>Update your public identity, athlete details, stat card, trophies, and game log history.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input value={formData.displayName} onChange={(event) => setFormData((current) => ({ ...current, displayName: event.target.value }))} placeholder="Display name" />
              <Input value={formData.username} onChange={(event) => setFormData((current) => ({ ...current, username: event.target.value }))} placeholder="Username" />
              <Input type="file" accept="image/*" onChange={(event: ChangeEvent<HTMLInputElement>) => setAvatarFile(event.target.files?.[0] ?? null)} />
              <Input type="file" accept="image/*" onChange={(event: ChangeEvent<HTMLInputElement>) => setCoverPhotoFile(event.target.files?.[0] ?? null)} />
              <select
                value={formData.profileTheme}
                onChange={(event) => setFormData((current) => ({ ...current, profileTheme: event.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="classic">Classic</option>
                <option value="sunset">Sunset</option>
                <option value="court">Court</option>
                <option value="midnight">Midnight</option>
                <option value="championship">Championship</option>
                <option value="ice">Ice</option>
              </select>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input value={formData.sport} onChange={(event) => setFormData((current) => ({ ...current, sport: event.target.value }))} placeholder="Sport" />
                <Input value={formData.position} onChange={(event) => setFormData((current) => ({ ...current, position: event.target.value }))} placeholder="Position" />
                <Input value={formData.team} onChange={(event) => setFormData((current) => ({ ...current, team: event.target.value }))} placeholder="Team / organization" />
                <Input value={formData.experience} onChange={(event) => setFormData((current) => ({ ...current, experience: event.target.value }))} placeholder="Experience level" />
                <Input value={formData.age} type="number" onChange={(event) => setFormData((current) => ({ ...current, age: event.target.value }))} placeholder="Age" />
                <Input value={formData.height} onChange={(event) => setFormData((current) => ({ ...current, height: event.target.value }))} placeholder="Height" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input value={formData.headline} onChange={(event) => setFormData((current) => ({ ...current, headline: event.target.value }))} placeholder="Profile headline" />
                <select
                  value={formData.availabilityStatus}
                  onChange={(event) => setFormData((current) => ({ ...current, availabilityStatus: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="available">Available</option>
                  <option value="locked_in">Locked in</option>
                  <option value="recovering">Recovering</option>
                </select>
                <Input value={formData.tagline} onChange={(event) => setFormData((current) => ({ ...current, tagline: event.target.value }))} placeholder="Tagline" />
                <Input value={formData.pronouns} onChange={(event) => setFormData((current) => ({ ...current, pronouns: event.target.value }))} placeholder="Pronouns" />
                <Input value={formData.hometown} onChange={(event) => setFormData((current) => ({ ...current, hometown: event.target.value }))} placeholder="Hometown" />
                <Input value={formData.gradYear} onChange={(event) => setFormData((current) => ({ ...current, gradYear: event.target.value }))} placeholder="Graduation year" />
                <Input value={formData.website} onChange={(event) => setFormData((current) => ({ ...current, website: event.target.value }))} placeholder="Website link" />
                <Input value={formData.instagram} onChange={(event) => setFormData((current) => ({ ...current, instagram: event.target.value }))} placeholder="Instagram handle or link" />
                <Input value={formData.nickname} onChange={(event) => setFormData((current) => ({ ...current, nickname: event.target.value }))} placeholder="Nickname" />
                <Input value={formData.signatureLine} onChange={(event) => setFormData((current) => ({ ...current, signatureLine: event.target.value }))} placeholder="Signature line" />
              </div>
              <Input value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
              <textarea value={formData.bio} onChange={(event) => setFormData((current) => ({ ...current, bio: event.target.value }))} placeholder="Bio" className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.quote} onChange={(event) => setFormData((current) => ({ ...current, quote: event.target.value }))} placeholder="Favorite quote or signature line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.localLanguageBio} onChange={(event) => setFormData((current) => ({ ...current, localLanguageBio: event.target.value }))} placeholder="Local language profile bio" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input value={formData.introVideoUrl} onChange={(event) => setFormData((current) => ({ ...current, introVideoUrl: event.target.value }))} placeholder="Personal intro video URL" />
                <Input value={formData.audioIntroUrl} onChange={(event) => setFormData((current) => ({ ...current, audioIntroUrl: event.target.value }))} placeholder="Audio intro URL" />
              </div>
              <Input value={formData.askMeAbout} onChange={(event) => setFormData((current) => ({ ...current, askMeAbout: event.target.value }))} placeholder="Ask me about, comma separated" />
              <Input value={formData.injuryStatus} onChange={(event) => setFormData((current) => ({ ...current, injuryStatus: event.target.value }))} placeholder="Current injury or status note" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input type="checkbox" checked={formData.recruitingAvailable} onChange={(event) => setFormData((current) => ({ ...current, recruitingAvailable: event.target.checked }))} />
                  Recruiting open
                </label>
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input type="checkbox" checked={formData.transferInterest} onChange={(event) => setFormData((current) => ({ ...current, transferInterest: event.target.checked }))} />
                  Transfer interest
                </label>
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input type="checkbox" checked={formData.nilInterest} onChange={(event) => setFormData((current) => ({ ...current, nilInterest: event.target.checked }))} />
                  NIL interest
                </label>
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input type="checkbox" checked={formData.parentManaged} onChange={(event) => setFormData((current) => ({ ...current, parentManaged: event.target.checked }))} />
                  Parent managed
                </label>
              </div>
              <Input value={formData.sponsorshipDeckUrl} onChange={(event) => setFormData((current) => ({ ...current, sponsorshipDeckUrl: event.target.value }))} placeholder="Sponsorship deck URL" />

              <div className="grid gap-4 sm:grid-cols-3">
                <Input value={formData.pointsPerGame} type="number" onChange={(event) => setFormData((current) => ({ ...current, pointsPerGame: event.target.value }))} placeholder="Points per game" />
                <Input value={formData.assistsPerGame} type="number" onChange={(event) => setFormData((current) => ({ ...current, assistsPerGame: event.target.value }))} placeholder="Assists per game" />
                <Input value={formData.reboundsPerGame} type="number" onChange={(event) => setFormData((current) => ({ ...current, reboundsPerGame: event.target.value }))} placeholder="Rebounds per game" />
              </div>

              <Input value={formData.skills} onChange={(event) => setFormData((current) => ({ ...current, skills: event.target.value }))} placeholder="Skills, comma separated" />
              <Input value={formData.achievements} onChange={(event) => setFormData((current) => ({ ...current, achievements: event.target.value }))} placeholder="Achievements / trophies, comma separated" />
              <textarea
                value={formData.gameLogs}
                onChange={(event) => setFormData((current) => ({ ...current, gameLogs: event.target.value }))}
                placeholder="Game logs: date|opponent|points|assists|rebounds|result"
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={formData.milestones}
                onChange={(event) => setFormData((current) => ({ ...current, milestones: event.target.value }))}
                placeholder="Milestones: date|title|detail"
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={formData.teamHistory}
                onChange={(event) => setFormData((current) => ({ ...current, teamHistory: event.target.value }))}
                placeholder="Team history: season|team|detail"
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={formData.linkBio}
                onChange={(event) => setFormData((current) => ({ ...current, linkBio: event.target.value }))}
                placeholder="Link in bio: label|url"
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={formData.coachEndorsements}
                onChange={(event) => setFormData((current) => ({ ...current, coachEndorsements: event.target.value }))}
                placeholder="Coach endorsements, one per line"
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={formData.peerEndorsements}
                onChange={(event) => setFormData((current) => ({ ...current, peerEndorsements: event.target.value }))}
                placeholder="Peer endorsements, one per line"
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea value={formData.academicTestScores} onChange={(event) => setFormData((current) => ({ ...current, academicTestScores: event.target.value }))} placeholder="Academic test scores, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.transcriptLinks} onChange={(event) => setFormData((current) => ({ ...current, transcriptLinks: event.target.value }))} placeholder="Transcript links, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input value={formData.academicGpa} onChange={(event) => setFormData((current) => ({ ...current, academicGpa: event.target.value }))} placeholder="Academic GPA" />
                <Input value={formData.eligibilityStatus} onChange={(event) => setFormData((current) => ({ ...current, eligibilityStatus: event.target.value }))} placeholder="Eligibility status" />
                <Input value={formData.profileVisits} type="number" onChange={(event) => setFormData((current) => ({ ...current, profileVisits: event.target.value }))} placeholder="Profile visits" />
                <Input value={formData.scoutVisits} type="number" onChange={(event) => setFormData((current) => ({ ...current, scoutVisits: event.target.value }))} placeholder="Scout visits" />
                <Input value={formData.recruiterEngagementScore} type="number" onChange={(event) => setFormData((current) => ({ ...current, recruiterEngagementScore: event.target.value }))} placeholder="Recruiter engagement score" />
                <Input value={formData.audienceGrowthScore} type="number" onChange={(event) => setFormData((current) => ({ ...current, audienceGrowthScore: event.target.value }))} placeholder="Audience growth score" />
                <Input value={formData.creatorTrustScore} type="number" onChange={(event) => setFormData((current) => ({ ...current, creatorTrustScore: event.target.value }))} placeholder="Creator trust score" />
                <Input value={formData.sponsorReadinessScore} type="number" onChange={(event) => setFormData((current) => ({ ...current, sponsorReadinessScore: event.target.value }))} placeholder="Sponsor readiness score" />
                <Input value={formData.profileCompletenessScore} type="number" onChange={(event) => setFormData((current) => ({ ...current, profileCompletenessScore: event.target.value }))} placeholder="Profile completeness score" />
                <Input value={formData.contactPreference} onChange={(event) => setFormData((current) => ({ ...current, contactPreference: event.target.value }))} placeholder="Contact preference" />
                <Input value={formData.wingspan} onChange={(event) => setFormData((current) => ({ ...current, wingspan: event.target.value }))} placeholder="Wingspan" />
                <Input value={formData.weight} onChange={(event) => setFormData((current) => ({ ...current, weight: event.target.value }))} placeholder="Weight" />
                <Input value={formData.verticalLeap} onChange={(event) => setFormData((current) => ({ ...current, verticalLeap: event.target.value }))} placeholder="Vertical leap" />
                <Input value={formData.sprintTime} onChange={(event) => setFormData((current) => ({ ...current, sprintTime: event.target.value }))} placeholder="Sprint time" />
              </div>
              <textarea value={formData.resumeBullets} onChange={(event) => setFormData((current) => ({ ...current, resumeBullets: event.target.value }))} placeholder="Resume bullets, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.schoolHistory} onChange={(event) => setFormData((current) => ({ ...current, schoolHistory: event.target.value }))} placeholder="School history, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.clubHistory} onChange={(event) => setFormData((current) => ({ ...current, clubHistory: event.target.value }))} placeholder="Club history, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.campHistory} onChange={(event) => setFormData((current) => ({ ...current, campHistory: event.target.value }))} placeholder="Camp history, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.visitHistory} onChange={(event) => setFormData((current) => ({ ...current, visitHistory: event.target.value }))} placeholder="Visit history, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.offerHistory} onChange={(event) => setFormData((current) => ({ ...current, offerHistory: event.target.value }))} placeholder="Offer history, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.careerGoals} onChange={(event) => setFormData((current) => ({ ...current, careerGoals: event.target.value }))} placeholder="Career goals, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.comparisonNotes} onChange={(event) => setFormData((current) => ({ ...current, comparisonNotes: event.target.value }))} placeholder="Comparison notes, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.guestbook} onChange={(event) => setFormData((current) => ({ ...current, guestbook: event.target.value }))} placeholder="Guestbook entries, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.fanComments} onChange={(event) => setFormData((current) => ({ ...current, fanComments: event.target.value }))} placeholder="Fan comments, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.teamEndorsements} onChange={(event) => setFormData((current) => ({ ...current, teamEndorsements: event.target.value }))} placeholder="Team endorsements, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.parentNotes} onChange={(event) => setFormData((current) => ({ ...current, parentNotes: event.target.value }))} placeholder="Parent notes, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.mentorNotes} onChange={(event) => setFormData((current) => ({ ...current, mentorNotes: event.target.value }))} placeholder="Mentor notes, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.recommendationRequests} onChange={(event) => setFormData((current) => ({ ...current, recommendationRequests: event.target.value }))} placeholder="Recommendation requests, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.recommendationVault} onChange={(event) => setFormData((current) => ({ ...current, recommendationVault: event.target.value }))} placeholder="Recommendation vault, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.verifiedDocuments} onChange={(event) => setFormData((current) => ({ ...current, verifiedDocuments: event.target.value }))} placeholder="Verified documents, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={formData.partnershipHistory} onChange={(event) => setFormData((current) => ({ ...current, partnershipHistory: event.target.value }))} placeholder="Partnership history, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Input value={formData.favoriteBrands} onChange={(event) => setFormData((current) => ({ ...current, favoriteBrands: event.target.value }))} placeholder="Favorite brands, comma separated" />
              <Input value={formData.sponsorshipInterests} onChange={(event) => setFormData((current) => ({ ...current, sponsorshipInterests: event.target.value }))} placeholder="Sponsorship interests, comma separated" />
              <Input value={formData.roleTabs} onChange={(event) => setFormData((current) => ({ ...current, roleTabs: event.target.value }))} placeholder="Role tabs, comma separated" />
              <textarea value={formData.publicAvailability} onChange={(event) => setFormData((current) => ({ ...current, publicAvailability: event.target.value }))} placeholder="Public availability, one per line" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function EditProfilePage() {
  return (
    <AuthProvider>
      <EditProfilePageContent />
    </AuthProvider>
  );
}
