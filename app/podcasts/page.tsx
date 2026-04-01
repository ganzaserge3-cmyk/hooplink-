"use client";

import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { scheduleGuestCoHost, publishPodcastEpisode, getGuestSlots, getPodcastEpisodes, type GuestSlotRecord, type PodcastEpisodeRecord } from "@/lib/phase7";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";

function PodcastsPageContent() {
  const [episodes, setEpisodes] = useState<PodcastEpisodeRecord[]>([]);
  const [guestSlots, setGuestSlots] = useState<GuestSlotRecord[]>([]);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [episodeForm, setEpisodeForm] = useState({ title: "", summary: "", audioUrl: "", guestName: "", chapters: "Intro:0,Film Room:8,Q&A:22" });
  const [guestForm, setGuestForm] = useState({ guestUid: "", scheduledFor: "", notes: "" });

  const refresh = async () => {
    const [nextEpisodes, nextGuests, nextProfiles] = await Promise.all([
      getPodcastEpisodes(),
      getGuestSlots(),
      searchProfiles(""),
    ]);
    setEpisodes(nextEpisodes);
    setGuestSlots(nextGuests);
    setProfiles(nextProfiles);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Podcasts & Audio Spaces</h1>
          <p className="text-muted-foreground">Publish podcast episodes, add chapter markers, and schedule guest co-hosts.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Publish Episode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={episodeForm.title} onChange={(event) => setEpisodeForm((current) => ({ ...current, title: event.target.value }))} placeholder="Episode title" />
              <Input value={episodeForm.summary} onChange={(event) => setEpisodeForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Episode summary" />
              <Input value={episodeForm.audioUrl} onChange={(event) => setEpisodeForm((current) => ({ ...current, audioUrl: event.target.value }))} placeholder="Audio URL" />
              <Input value={episodeForm.guestName} onChange={(event) => setEpisodeForm((current) => ({ ...current, guestName: event.target.value }))} placeholder="Guest name" />
              <Input value={episodeForm.chapters} onChange={(event) => setEpisodeForm((current) => ({ ...current, chapters: event.target.value }))} placeholder="Chapter:minute, Chapter:minute" />
              <Button
                onClick={() =>
                  void publishPodcastEpisode({
                    title: episodeForm.title,
                    summary: episodeForm.summary,
                    audioUrl: episodeForm.audioUrl,
                    guestName: episodeForm.guestName,
                    chapters: episodeForm.chapters.split(",").map((item) => {
                      const [title, minuteMark] = item.split(":");
                      return { title: title.trim(), minuteMark: Number(minuteMark || 0) };
                    }),
                  }).then(() => {
                    setEpisodeForm({ title: "", summary: "", audioUrl: "", guestName: "", chapters: "Intro:0,Film Room:8,Q&A:22" });
                    refresh();
                  })
                }
              >
                Publish Episode
              </Button>
              <div className="space-y-3">
                {episodes.map((episode) => (
                  <div key={episode.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold">{episode.title}</p>
                    <p className="text-muted-foreground">{episode.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{episode.guestName ? `Guest: ${episode.guestName}` : "Solo episode"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {episode.chapters.map((chapter) => (
                        <span key={`${episode.id}-${chapter.title}`} className="rounded-full bg-muted px-2 py-1 text-xs">
                          {chapter.title} {chapter.minuteMark}m
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest Co-Host Scheduling</CardTitle>
              <CardDescription>Invite guests into future podcasts or audio spaces.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <select value={guestForm.guestUid} onChange={(event) => setGuestForm((current) => ({ ...current, guestUid: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Choose guest</option>
                {profiles.map((profile) => (
                  <option key={profile.uid} value={profile.uid}>{profile.displayName}</option>
                ))}
              </select>
              <Input type="datetime-local" value={guestForm.scheduledFor} onChange={(event) => setGuestForm((current) => ({ ...current, scheduledFor: event.target.value }))} />
              <textarea value={guestForm.notes} onChange={(event) => setGuestForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Guest notes" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Button
                onClick={() => {
                  const profile = profiles.find((item) => item.uid === guestForm.guestUid);
                  return void scheduleGuestCoHost({
                    guestUid: guestForm.guestUid,
                    guestName: profile?.displayName || "Guest",
                    scheduledFor: guestForm.scheduledFor,
                    notes: guestForm.notes,
                  }).then(() => {
                    setGuestForm({ guestUid: "", scheduledFor: "", notes: "" });
                    refresh();
                  });
                }}
              >
                Schedule Guest
              </Button>
              <div className="space-y-2">
                {guestSlots.map((slot) => (
                  <div key={slot.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-semibold">{slot.guestName}</p>
                    <p className="text-muted-foreground">{slot.scheduledFor}</p>
                    <p className="mt-1">{slot.notes}</p>
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

export default function PodcastsPage() {
  return (
    <AuthProvider>
      <PodcastsPageContent />
    </AuthProvider>
  );
}
