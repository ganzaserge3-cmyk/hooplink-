"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Search, Target } from "lucide-react";

import { createOrGetConversation, sendConversationMessage } from "@/lib/messaging";
import { submitTryoutApplication } from "@/lib/teams";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function VirtualTryoutsPageContent() {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCoachUid, setSelectedCoachUid] = useState("");
  const [teamId, setTeamId] = useState("");
  const [athleteForm, setAthleteForm] = useState({ name: "", position: "", message: "I would like to join your next virtual tryout and share my training profile.", contactLink: "" });
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    void searchProfiles("").then(setProfiles);
  }, []);

  const coaches = useMemo(() => {
    return profiles
      .filter((profile) => {
        const role = profile.role as Record<string, unknown> | undefined;
        return ["coach", "mentor", "scout"].includes(String(role?.type ?? "").toLowerCase());
      })
      .filter((profile) => {
        const searchable = [profile.displayName, profile.role?.sport, profile.role?.position, profile.role?.team].filter(Boolean).join(" ").toLowerCase();
        return searchable.includes(query.trim().toLowerCase());
      });
  }, [profiles, query]);

  const selectedCoach = coaches.find((coach) => coach.uid === selectedCoachUid) ?? null;

  const handleSubmitTryout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!teamId.trim() || !athleteForm.name.trim() || !athleteForm.position.trim()) {
      setStatus("Enter your team ID, athlete name, and position to submit your tryout request.");
      return;
    }

    setSubmitting(true);
    setStatus("Sending virtual tryout request...");

    try {
      await submitTryoutApplication(teamId.trim(), {
        name: athleteForm.name.trim(),
        position: athleteForm.position.trim(),
        message: athleteForm.message.trim(),
      });
      setStatus("Your tryout application was submitted.");
      setAthleteForm((current) => ({ ...current, name: "", position: "", message: "I would like to join your next virtual tryout and share my training profile.", contactLink: "" }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to submit the tryout application.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCoachMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCoachUid || !athleteForm.message.trim()) {
      setStatus("Select a coach and write a message before sending.");
      return;
    }

    setSendingMessage(true);
    setStatus("Sending outreach message...");

    try {
      const conversationId = await createOrGetConversation(selectedCoachUid);
      await sendConversationMessage(conversationId, athleteForm.message.trim());
      setStatus(`Message sent to ${selectedCoach?.displayName || "coach"}.`);
      setAthleteForm((current) => ({ ...current, message: "I would like to join your next virtual tryout and share my training profile." }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send the message.");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Virtual Tryouts</h1>
          <p className="text-muted-foreground">
            Organize virtual tryout opportunities, send athlete applications, and reach coaches with a strong tryout pitch.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Publish Your Tryout Pitch</CardTitle>
              <CardDescription>Send a direct tryout request to coaches or submit your profile for an open team tryout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={handleSubmitTryout}>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input value={teamId} onChange={(event) => setTeamId(event.target.value)} placeholder="Team ID" />
                  <Input value={athleteForm.name} onChange={(event) => setAthleteForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
                  <Input value={athleteForm.position} onChange={(event) => setAthleteForm((current) => ({ ...current, position: event.target.value }))} placeholder="Position" />
                </div>
                <textarea
                  value={athleteForm.message}
                  onChange={(event) => setAthleteForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Add your tryout summary and highlight your strengths."
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Send virtual tryout application"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coach Outreach</CardTitle>
              <CardDescription>Find coaches, scouts, and mentors to invite to a virtual tryout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search coaches by sport or name" />
                <Button variant="outline" size="sm" disabled>
                  <Search className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>

              <div className="space-y-3">
                {coaches.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    No coaches found. Try a broader search.
                  </div>
                ) : (
                  coaches.slice(0, 6).map((coach) => (
                    <button
                      key={coach.uid}
                      type="button"
                      onClick={() => setSelectedCoachUid(coach.uid)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${selectedCoachUid === coach.uid ? "border-primary bg-primary/5" : "border-muted/70 hover:border-primary"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{coach.displayName}</p>
                          <p className="text-sm text-muted-foreground">{[coach.role?.sport, coach.role?.position, coach.role?.team].filter(Boolean).join(" • ")}</p>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs">Coach</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <form className="space-y-4" onSubmit={handleSendCoachMessage}>
                <textarea
                  value={athleteForm.message}
                  onChange={(event) => setAthleteForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Send a coach a quick outreach note with your tryout focus."
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button type="submit" disabled={!selectedCoachUid || sendingMessage}>
                  {sendingMessage ? "Sending..." : "Send coach outreach"}
                </Button>
              </form>
              {status ? <p className="text-sm text-primary">{status}</p> : null}
              <p className="text-sm text-muted-foreground">
                Use team ID if you have a specific program, or message a coach first to request a virtual tryout link.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tryout Prep</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
            <div className="rounded-xl bg-muted p-4">
              <p className="font-semibold">Pack your story</p>
              <p>Explain your position, timeline, and what makes you a strong addition.</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="font-semibold">Share your best clips</p>
              <p>Include a short highlight link or training reel in your outreach message.</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="font-semibold">Ask for next steps</p>
              <p>Close your message with availability, preferred tryout dates, and follow-up plans.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function VirtualTryoutsPage() {
  return <VirtualTryoutsPageContent />;
}
