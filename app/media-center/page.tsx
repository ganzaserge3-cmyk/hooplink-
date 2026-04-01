"use client";

import { useEffect, useMemo, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildBrandPitch,
  buildPressKit,
  buildResponseRateInsight,
  type MediaRequestRecord,
  type OutreachSequenceRecord,
  type PressReleaseRecord,
  getDailyNewsDigest,
  getMediaRequests,
  getOutreachSequences,
  getPressReleases,
  getSponsorCampaignInsights,
  getVerifiedJournalists,
  saveMediaRequest,
  saveOutreachSequence,
  savePressRelease,
} from "@/lib/phase1";

function MediaCenterPageContent() {
  const [outreachSequences, setOutreachSequences] = useState<Awaited<ReturnType<typeof getOutreachSequences>>>([]);
  const [pressReleases, setPressReleases] = useState<Awaited<ReturnType<typeof getPressReleases>>>([]);
  const [mediaRequests, setMediaRequests] = useState<Awaited<ReturnType<typeof getMediaRequests>>>([]);
  const [outreachForm, setOutreachForm] = useState({ label: "", recipientType: "", steps: "Intro note, follow-up, final check-in" });
  const [pressForm, setPressForm] = useState({ title: "", body: "", audience: "media" });
  const [mediaForm, setMediaForm] = useState({ requesterName: "", outlet: "", angle: "" });
  const [pressKitForm, setPressKitForm] = useState({ name: "HoopLink Creator", role: "Athlete / Creator", achievements: "Showcase top stats, wins, and milestones", links: "Profile, highlights, and contact link" });
  const [pitchForm, setPitchForm] = useState({ creator: "HoopLink Creator", audience: "recruiting-focused basketball audience", value: "credible athlete stories, training content, and consistent engagement" });

  const refresh = async () => {
    const [nextOutreach, nextPress, nextMedia] = await Promise.all([
      getOutreachSequences(),
      getPressReleases(),
      getMediaRequests(),
    ]);
    setOutreachSequences(nextOutreach);
    setPressReleases(nextPress);
    setMediaRequests(nextMedia);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const pressKit = useMemo(() => buildPressKit(pressKitForm), [pressKitForm]);
  const brandPitch = useMemo(() => buildBrandPitch(pitchForm), [pitchForm]);
  const sponsorInsights = getSponsorCampaignInsights();
  const responseRateInsight = buildResponseRateInsight(24, 9);
  const digest = getDailyNewsDigest();
  const journalists = getVerifiedJournalists();

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Media Center</h1>
          <p className="text-muted-foreground">Press kits, brand pitches, sponsor analytics, outreach sequences, media requests, verified journalists, daily digest, and press releases.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Press Kit and Brand Pitch</CardTitle>
              <CardDescription>Generate media-ready positioning for creators, athletes, and campaigns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Input value={pressKitForm.name} onChange={(event) => setPressKitForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" />
                <Input value={pressKitForm.role} onChange={(event) => setPressKitForm((current) => ({ ...current, role: event.target.value }))} placeholder="Role" />
                <Input value={pressKitForm.achievements} onChange={(event) => setPressKitForm((current) => ({ ...current, achievements: event.target.value }))} placeholder="Achievements" />
                <Input value={pressKitForm.links} onChange={(event) => setPressKitForm((current) => ({ ...current, links: event.target.value }))} placeholder="Links" />
              </div>
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{pressKit}</div>
              <div className="grid gap-3 border-t pt-4">
                <Input value={pitchForm.creator} onChange={(event) => setPitchForm((current) => ({ ...current, creator: event.target.value }))} placeholder="Creator" />
                <Input value={pitchForm.audience} onChange={(event) => setPitchForm((current) => ({ ...current, audience: event.target.value }))} placeholder="Audience" />
                <Input value={pitchForm.value} onChange={(event) => setPitchForm((current) => ({ ...current, value: event.target.value }))} placeholder="Value" />
              </div>
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{brandPitch}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sponsor and Outreach Intelligence</CardTitle>
              <CardDescription>Campaign performance analytics, outreach sequences, and recruiter response-rate snapshots.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {sponsorInsights.map((insight) => (
                  <div key={insight.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold">{insight.label}</p>
                    <p className="mt-2 text-muted-foreground">{insight.impressions} impressions • {insight.clicks} clicks • {insight.conversions} conversions</p>
                    <p className="mt-2 font-medium">${insight.estimatedRevenue} estimated revenue</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{responseRateInsight}</div>
              <div className="grid gap-3 border-t pt-4">
                <Input value={outreachForm.label} onChange={(event) => setOutreachForm((current) => ({ ...current, label: event.target.value }))} placeholder="Sequence label" />
                <Input value={outreachForm.recipientType} onChange={(event) => setOutreachForm((current) => ({ ...current, recipientType: event.target.value }))} placeholder="Recipient type" />
                <textarea value={outreachForm.steps} onChange={(event) => setOutreachForm((current) => ({ ...current, steps: event.target.value }))} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Comma-separated sequence steps" />
                <Button onClick={() => void saveOutreachSequence({ label: outreachForm.label, recipientType: outreachForm.recipientType, steps: outreachForm.steps.split(",").map((item) => item.trim()).filter(Boolean) }).then(() => { setOutreachForm({ label: "", recipientType: "", steps: "Intro note, follow-up, final check-in" }); return refresh(); })}>Save Outreach Sequence</Button>
              </div>
              <div className="space-y-2 text-sm">
                {outreachSequences.map((sequence: OutreachSequenceRecord) => <div key={sequence.id} className="rounded-lg bg-muted p-3">{sequence.label} • {sequence.recipientType} • {sequence.steps.join(" -> ")}</div>)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>News, Press Releases, and Journalists</CardTitle>
              <CardDescription>Daily digest, in-app press release publishing, and a verified journalist directory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {digest.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold">{item.headline}</p>
                    <p className="mt-1 text-muted-foreground">{item.summary}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-primary">{item.topic}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 border-t pt-4">
                <Input value={pressForm.title} onChange={(event) => setPressForm((current) => ({ ...current, title: event.target.value }))} placeholder="Press release title" />
                <Input value={pressForm.audience} onChange={(event) => setPressForm((current) => ({ ...current, audience: event.target.value }))} placeholder="Audience" />
                <textarea value={pressForm.body} onChange={(event) => setPressForm((current) => ({ ...current, body: event.target.value }))} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Press release body" />
                <Button onClick={() => void savePressRelease(pressForm).then(() => { setPressForm({ title: "", body: "", audience: "media" }); return refresh(); })}>Publish Press Release</Button>
              </div>
              <div className="space-y-2 text-sm">
                {pressReleases.map((release: PressReleaseRecord) => <div key={release.id} className="rounded-lg bg-muted p-3"><span className="font-semibold">{release.title}</span><div className="mt-1 text-muted-foreground">{release.body}</div></div>)}
              </div>
              <div className="space-y-2 border-t pt-4 text-sm">
                {journalists.map((journalist) => <div key={journalist.id} className="rounded-lg bg-muted p-3">{journalist.name} • {journalist.outlet} • {journalist.beat}</div>)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media Interview Requests</CardTitle>
              <CardDescription>Capture inbound interview asks and keep a simple in-app request flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Input value={mediaForm.requesterName} onChange={(event) => setMediaForm((current) => ({ ...current, requesterName: event.target.value }))} placeholder="Requester name" />
                <Input value={mediaForm.outlet} onChange={(event) => setMediaForm((current) => ({ ...current, outlet: event.target.value }))} placeholder="Outlet" />
                <textarea value={mediaForm.angle} onChange={(event) => setMediaForm((current) => ({ ...current, angle: event.target.value }))} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Interview angle or request" />
                <Button onClick={() => void saveMediaRequest(mediaForm).then(() => { setMediaForm({ requesterName: "", outlet: "", angle: "" }); return refresh(); })}>Save Media Request</Button>
              </div>
              <div className="space-y-2 text-sm">
                {mediaRequests.map((request: MediaRequestRecord) => (
                  <div key={request.id} className="rounded-lg bg-muted p-3">
                    <p className="font-semibold">{request.requesterName} • {request.outlet}</p>
                    <p className="mt-1">{request.angle}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-primary">{request.status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function MediaCenterPage() {
  return (
    <AuthProvider>
      <MediaCenterPageContent />
    </AuthProvider>
  );
}
