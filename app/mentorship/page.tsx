"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquare, Search, Users } from "lucide-react";

import { createOrGetConversation, sendConversationMessage } from "@/lib/messaging";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function MentorshipPageContent() {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [query, setQuery] = useState("");
  const [selectedMentorUid, setSelectedMentorUid] = useState("");
  const [message, setMessage] = useState("Hi! I'm looking for mentorship guidance on training, recruiting, and development.");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void searchProfiles("").then(setProfiles);
  }, []);

  const mentors = useMemo(() => {
    return profiles
      .filter((profile) => {
        const role = profile.role as Record<string, unknown> | undefined;
        const community = (profile.profileCommunity as Record<string, unknown> | undefined) ?? {};
        const mentorNotes = Array.isArray(community.mentorNotes) ? community.mentorNotes : [];
        return (
          String(role?.type ?? "").toLowerCase() === "coach" ||
          String(role?.type ?? "").toLowerCase() === "mentor" ||
          mentorNotes.length > 0 ||
          String(role?.experience ?? "").toLowerCase().includes("coach")
        );
      })
      .filter((profile) => {
        const searchable = [profile.displayName, profile.role?.sport, profile.role?.position, profile.role?.team]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(query.trim().toLowerCase());
      });
  }, [profiles, query]);

  const selectedMentor = mentors.find((mentor) => mentor.uid === selectedMentorUid) ?? null;

  const handleRequestMentor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMentorUid || !message.trim()) {
      setStatus("Please select a mentor and add a message.");
      return;
    }

    setSending(true);
    setStatus("Sending mentorship request...");

    try {
      const conversationId = await createOrGetConversation(selectedMentorUid);
      await sendConversationMessage(conversationId, message.trim());
      setStatus(`Mentorship request sent to ${selectedMentor?.displayName || "your mentor"}.`);
      setMessage("Hi! I'm looking for mentorship guidance on training, recruiting, and development.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Mentorship Hub</h1>
          <p className="text-muted-foreground">
            Find coaches, mentors, and advisory partners who can help you level up your training, recruiting, and career decisions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr,0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Mentorship Network</CardTitle>
              <CardDescription>Search mentor-ready profiles and connect with coaches or advisors who are available to share guidance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  placeholder="Search mentors by sport, position, or name"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <Button variant="outline" size="sm" disabled>
                  <Search className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>

              <div className="grid gap-3">
                {mentors.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    No mentors matched your search yet. Try a broader sport or coach search.
                  </div>
                ) : (
                  mentors.map((mentor) => {
                    const mentorCommunity = mentor.profileCommunity as Record<string, unknown> | undefined;
                    const mentorNotes = Array.isArray(mentorCommunity?.mentorNotes) ? mentorCommunity.mentorNotes : [];
                    return (
                      <button
                        key={mentor.uid}
                        type="button"
                        onClick={() => setSelectedMentorUid(mentor.uid)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${selectedMentorUid === mentor.uid ? "border-primary bg-primary/5" : "border-muted/70 hover:border-primary"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{mentor.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              {[mentor.role?.sport, mentor.role?.position, mentor.role?.team].filter(Boolean).join(" • ")}
                            </p>
                          </div>
                          <span className="rounded-full bg-muted px-3 py-1 text-xs">
                            Mentor
                          </span>
                        </div>
                        {mentorNotes.length > 0 ? (
                          <p className="mt-3 text-sm text-muted-foreground">{mentorNotes.slice(0, 2).join(" • ")}</p>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Mentorship</CardTitle>
              <CardDescription>Pick a mentor and send a direct request to begin the conversation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedMentor ? (
                <div className="rounded-2xl border p-4 bg-muted/50">
                  <p className="font-semibold">Selected mentor</p>
                  <p className="text-sm text-muted-foreground">{selectedMentor.displayName}</p>
                  <p className="text-sm text-muted-foreground">{[selectedMentor.role?.sport, selectedMentor.role?.position, selectedMentor.role?.team].filter(Boolean).join(" • ")}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Select a mentor from the list to send your request.
                </div>
              )}

              <form className="space-y-4" onSubmit={handleRequestMentor}>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell your mentor what you need help with."
                  className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" disabled={!selectedMentorUid || sending}>
                    {sending ? "Sending..." : "Send mentorship request"}
                  </Button>
                  <Link href="/messages" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
                    Go to messages to follow up
                  </Link>
                </div>
              </form>
              {status ? <p className="text-sm text-primary">{status}</p> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mentor Match Guide</CardTitle>
            <CardDescription>Use this workspace to connect to a coach or advisor and turn mentorship into action.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-muted p-4">
                <p className="font-semibold">Find the right mentor</p>
                <p>Search by sport, position, coach type, and leadership focus.</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="font-semibold">Prepare your ask</p>
                <p>Explain what guidance you need and the outcomes you hope to achieve.</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="font-semibold">Start the conversation</p>
                <p>Send a short, clear request and follow up with a meeting or tryout plan.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function MentorshipPage() {
  return <MentorshipPageContent />;
}
