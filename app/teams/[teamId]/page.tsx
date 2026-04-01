"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildRosterCsv } from "@/lib/phase5";
import { getLiveScoresForTeam, upsertTeamLiveScore, type LiveScoreRecord } from "@/lib/performance";
import { createPlaybookBoard, createTeamPracticePlan, getPlaybookBoards, getTeamPracticePlans, type PlaybookBoardRecord, type TeamPracticePlanRecord } from "@/lib/training";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";
import {
  addCoachFeedback,
  addStaffNote,
  addTeamGalleryItem,
  createTeamChatRoom,
  createTeamEvent,
  createTeamPost,
  getTeam,
  getTeamAttendance,
  getTeamChatRooms,
  getTeamEvents,
  getTeamGallery,
  getTeamPosts,
  getStaffNotes,
  getTeamTryouts,
  inviteToTeam,
  joinTeam,
  linkUserToTeam,
  markAttendance,
  sendEventRsvpReminders,
  sendTeamChatMessage,
  subscribeToTeamChatMessages,
  submitTryoutApplication,
  updateEventRsvp,
  updateOrganizationPermissions,
  updateTeamAnnouncement,
  updateTeamMemberRole,
  type TeamAttendanceRecord,
  type TeamChatMessage,
  type TeamChatRoom,
  type TeamEvent,
  type TeamPost,
  type TeamRecord,
  type TeamTryout,
} from "@/lib/teams";

const ORG_PERMISSION_OPTIONS = [
  "manage_roster",
  "manage_events",
  "manage_content",
  "manage_recruiting",
] as const;

function TeamDetailsContent({ teamId }: { teamId: string }) {
  const { user } = useAuthContext();
  const [team, setTeam] = useState<TeamRecord | null>(null);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [posts, setPosts] = useState<TeamPost[]>([]);
  const [tryouts, setTryouts] = useState<TeamTryout[]>([]);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [chatRooms, setChatRooms] = useState<TeamChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<TeamChatMessage[]>([]);
  const [attendanceByEvent, setAttendanceByEvent] = useState<Record<string, TeamAttendanceRecord[]>>({});
  const [liveScoresByEvent, setLiveScoresByEvent] = useState<Record<string, LiveScoreRecord>>({});
  const [practicePlans, setPracticePlans] = useState<TeamPracticePlanRecord[]>([]);
  const [playbookBoards, setPlaybookBoards] = useState<PlaybookBoardRecord[]>([]);
  const [galleryItems, setGalleryItems] = useState<Array<{ id: string; mediaUrl: string; mediaType: "image" | "video"; caption: string }>>([]);
  const [staffNotesByMember, setStaffNotesByMember] = useState<Record<string, Array<{ id: string; authorName: string; note: string }>>>({});
  const [inviteUid, setInviteUid] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "coach" | "captain" | "player">("player");
  const [announcement, setAnnouncement] = useState("");
  const [eventForm, setEventForm] = useState({ title: "", date: "", location: "", type: "practice" as TeamEvent["type"] });
  const [postDraft, setPostDraft] = useState("");
  const [tryoutForm, setTryoutForm] = useState({ name: "", position: "", message: "" });
  const [roomName, setRoomName] = useState("");
  const [activeRoomId, setActiveRoomId] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [feedbackForm, setFeedbackForm] = useState({ postId: "", athleteUid: "", feedback: "" });
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [practicePlanForm, setPracticePlanForm] = useState({ title: "", date: "", focus: "", drills: "" });
  const [playbookTitle, setPlaybookTitle] = useState("");
  const [playbookFile, setPlaybookFile] = useState<File | null>(null);
  const [staffNoteDrafts, setStaffNoteDrafts] = useState<Record<string, string>>({});
  const [bracketTitle, setBracketTitle] = useState("");
  const [bracketRounds, setBracketRounds] = useState("Quarterfinals|Team A vs Team B|Team C vs Team D");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, {
    opponentName: string;
    teamScore: string;
    opponentScore: string;
    status: LiveScoreRecord["status"];
    periodLabel: string;
  }>>({});

  const refreshTeamData = async () => {
    const [nextTeam, nextEvents, nextPosts, nextTryouts, nextProfiles, nextRooms, nextGallery, nextLiveScores, nextPracticePlans, nextPlaybookBoards] = await Promise.all([
      getTeam(teamId),
      getTeamEvents(teamId),
      getTeamPosts(teamId),
      getTeamTryouts(teamId),
      searchProfiles(""),
      getTeamChatRooms(teamId),
      getTeamGallery(teamId),
      getLiveScoresForTeam(teamId),
      getTeamPracticePlans(teamId),
      getPlaybookBoards(teamId),
    ]);

    setTeam(nextTeam);
    setEvents(nextEvents);
    setPosts(nextPosts);
    setTryouts(nextTryouts);
    setProfiles(nextProfiles);
    setChatRooms(nextRooms);
    setGalleryItems(nextGallery);
    setLiveScoresByEvent(Object.fromEntries(nextLiveScores.map((score: LiveScoreRecord) => [score.eventId, score])));
    setPracticePlans(nextPracticePlans);
    setPlaybookBoards(nextPlaybookBoards);
    setActiveRoomId((current) => current || nextRooms[0]?.id || "");
    setAnnouncement(nextTeam?.announcement ?? "");
    setScoreDrafts((current) => {
      const nextDrafts = { ...current };
      nextEvents.forEach((event: TeamEvent) => {
        const existingScore = nextLiveScores.find((score: LiveScoreRecord) => score.eventId === event.id);
        nextDrafts[event.id] = existingScore
          ? {
              opponentName: existingScore.opponentName,
              teamScore: String(existingScore.teamScore),
              opponentScore: String(existingScore.opponentScore),
              status: existingScore.status,
              periodLabel: existingScore.periodLabel,
            }
          : nextDrafts[event.id] ?? {
              opponentName: event.title,
              teamScore: "0",
              opponentScore: "0",
              status: "scheduled",
              periodLabel: "Q1",
            };
      });
      return nextDrafts;
    });

    const attendanceEntries = await Promise.all(
      nextEvents.map(async (event: TeamEvent) => [event.id, await getTeamAttendance(teamId, event.id)] as const)
    );
    setAttendanceByEvent(Object.fromEntries(attendanceEntries));
    if (nextTeam) {
      const notesEntries = await Promise.all(
        nextTeam.members.map(async (member) => [member.uid, await getStaffNotes(teamId, member.uid)] as const)
      );
      setStaffNotesByMember(Object.fromEntries(notesEntries));
    }
  };

  useEffect(() => {
    void refreshTeamData();
  }, [teamId]);

  useEffect(() => {
    if (!activeRoomId) {
      setChatMessages([]);
      return;
    }

    return subscribeToTeamChatMessages(activeRoomId, setChatMessages);
  }, [activeRoomId]);

  const isAdmin = useMemo(
    () => Boolean(user && team && (team.adminIds.includes(user.uid) || team.ownerId === user.uid)),
    [team, user]
  );

  const isCoach = useMemo(
    () =>
      Boolean(
        user &&
          team?.members.some(
            (member) =>
              member.uid === user.uid &&
              (member.role === "coach" || member.role === "owner" || member.role === "admin")
          )
      ),
    [team, user]
  );

  if (!team) {
    return <div className="mx-auto max-w-3xl py-8">Team not found.</div>;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{team.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{[team.sport, team.location].filter(Boolean).join(" • ")}</p>
            <p>{team.bio}</p>
            <p className="text-sm text-muted-foreground">{team.memberIds.length} members • {team.adminIds.length} admins</p>
            {!team.memberIds.includes(user?.uid || "") ? (
              <Button
                onClick={async () => {
                  await joinTeam(team.id);
                  await linkUserToTeam(team.id, team.name);
                  await refreshTeamData();
                }}
              >
                Join team
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Feed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAdmin ? (
                  <form
                    className="space-y-3"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      void createTeamPost(team.id, postDraft, "feed").then(() => {
                        setPostDraft("");
                        return refreshTeamData();
                      });
                    }}
                  >
                    <textarea value={postDraft} onChange={(event) => setPostDraft(event.target.value)} placeholder="Post an update to the team feed" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    <Button type="submit" disabled={!postDraft.trim()}>Post update</Button>
                  </form>
                ) : null}
                {posts.map((post) => (
                  <div key={post.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{post.type === "announcement" ? "Announcement" : "Team post"}</p>
                      {isAdmin ? (
                        <button
                          type="button"
                          className={`rounded-full border px-2 py-1 text-xs ${post.pinned ? "border-primary bg-primary/5 text-primary" : ""}`}
                          onClick={() => void import("@/lib/teams").then(({ pinTeamPost }) => pinTeamPost(post.id, !post.pinned)).then(refreshTeamData)}
                        >
                          {post.pinned ? "Pinned" : "Pin"}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm">{post.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Chat Rooms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAdmin ? (
                  <div className="flex gap-2">
                    <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="New room" className="h-10 flex-1 rounded-md border border-input px-3 text-sm" />
                    <Button onClick={() => void createTeamChatRoom(team.id, roomName).then(() => { setRoomName(""); return refreshTeamData(); })}>
                      Add
                    </Button>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {chatRooms.map((room) => (
                    <button key={room.id} type="button" className={`rounded-full border px-3 py-2 text-sm ${activeRoomId === room.id ? "border-primary bg-primary/5 text-primary" : ""}`} onClick={() => setActiveRoomId(room.id)}>
                      {room.name}
                    </button>
                  ))}
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border p-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  ) : (
                    chatMessages.map((message) => (
                      <div key={message.id} className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">{message.senderName}</p>
                        <p className="text-sm">{message.text}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Message the room" className="h-10 flex-1 rounded-md border border-input px-3 text-sm" />
                  <Button disabled={!activeRoomId || !chatDraft.trim()} onClick={() => void sendTeamChatMessage(team.id, activeRoomId, chatDraft).then(() => setChatDraft(""))}>
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Gallery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAdmin ? (
                  <div className="space-y-3">
                    <input type="file" accept="image/*,video/*" onChange={(event) => setGalleryFile(event.target.files?.[0] ?? null)} />
                    <input value={galleryCaption} onChange={(event) => setGalleryCaption(event.target.value)} placeholder="Gallery caption" className="h-10 w-full rounded-md border border-input px-3 text-sm" />
                    <Button disabled={!galleryFile} onClick={() => galleryFile ? void addTeamGalleryItem(team.id, galleryFile, galleryCaption).then(() => { setGalleryFile(null); setGalleryCaption(""); return refreshTeamData(); }) : undefined}>
                      Add to Gallery
                    </Button>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {galleryItems.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-xl bg-muted">
                      {item.mediaType === "video" ? (
                        <video src={item.mediaUrl} className="aspect-square w-full object-cover" />
                      ) : (
                        <img src={item.mediaUrl} alt={item.caption} className="aspect-square w-full object-cover" />
                      )}
                      <div className="p-2 text-xs text-muted-foreground">{item.caption || "Gallery item"}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Practice Plans and Playbooks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCoach ? (
                  <>
                    <form
                      className="grid gap-3"
                      onSubmit={(event: FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        void createTeamPracticePlan({
                          teamId: team.id,
                          title: practicePlanForm.title,
                          date: practicePlanForm.date,
                          focus: practicePlanForm.focus,
                          drills: practicePlanForm.drills.split(",").map((value) => value.trim()).filter(Boolean),
                        }).then(() => {
                          setPracticePlanForm({ title: "", date: "", focus: "", drills: "" });
                          return refreshTeamData();
                        });
                      }}
                    >
                      <input value={practicePlanForm.title} onChange={(event) => setPracticePlanForm((current) => ({ ...current, title: event.target.value }))} placeholder="Practice title" className="h-10 rounded-md border border-input px-3 text-sm" />
                      <input value={practicePlanForm.date} onChange={(event) => setPracticePlanForm((current) => ({ ...current, date: event.target.value }))} placeholder="Date / time" className="h-10 rounded-md border border-input px-3 text-sm" />
                      <input value={practicePlanForm.focus} onChange={(event) => setPracticePlanForm((current) => ({ ...current, focus: event.target.value }))} placeholder="Practice focus" className="h-10 rounded-md border border-input px-3 text-sm" />
                      <input value={practicePlanForm.drills} onChange={(event) => setPracticePlanForm((current) => ({ ...current, drills: event.target.value }))} placeholder="Drills, comma separated" className="h-10 rounded-md border border-input px-3 text-sm" />
                      <Button type="submit">Save Shared Practice Plan</Button>
                    </form>

                    <div className="grid gap-3 border-t pt-4 md:grid-cols-[1fr,1fr,auto]">
                      <input value={playbookTitle} onChange={(event) => setPlaybookTitle(event.target.value)} placeholder="Playbook board title" className="h-10 rounded-md border border-input px-3 text-sm" />
                      <input type="file" accept="image/*" onChange={(event) => setPlaybookFile(event.target.files?.[0] ?? null)} className="h-10 rounded-md border border-input px-3 text-sm" />
                      <Button type="button" onClick={() => playbookFile ? void createPlaybookBoard({ teamId: team.id, title: playbookTitle, imageFile: playbookFile }).then(() => { setPlaybookTitle(""); setPlaybookFile(null); return refreshTeamData(); }) : undefined}>
                        Upload Board
                      </Button>
                    </div>
                  </>
                ) : null}

                <div className="space-y-3 border-t pt-4">
                  {practicePlans.map((plan) => (
                    <div key={plan.id} className="rounded-xl border p-4">
                      <p className="font-semibold">{plan.title}</p>
                      <p className="text-sm text-muted-foreground">{plan.date} · {plan.focus}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {plan.drills.map((drill) => (
                          <span key={`${plan.id}-${drill}`} className="rounded-full bg-muted px-3 py-1 text-xs">{drill}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    {playbookBoards.map((board) => (
                      <div key={board.id} className="overflow-hidden rounded-xl border">
                        <img src={board.imageUrl} alt={board.title} className="aspect-square w-full object-cover" />
                        <div className="p-3 text-sm">{board.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAdmin ? (
                  <form
                    className="grid gap-3 md:grid-cols-2"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      void createTeamEvent(team.id, eventForm).then(() => {
                        setEventForm({ title: "", date: "", location: "", type: "practice" });
                        return refreshTeamData();
                      });
                    }}
                  >
                    <input value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} placeholder="Event title" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <input value={eventForm.date} onChange={(event) => setEventForm((current) => ({ ...current, date: event.target.value }))} placeholder="Date / time" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <input value={eventForm.location} onChange={(event) => setEventForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" className="h-10 rounded-md border border-input px-3 text-sm" />
                    <select value={eventForm.type} onChange={(event) => setEventForm((current) => ({ ...current, type: event.target.value as TeamEvent["type"] }))} className="h-10 rounded-md border border-input px-3 text-sm">
                      <option value="practice">Practice</option>
                      <option value="game">Game</option>
                      <option value="meeting">Meeting</option>
                      <option value="tryout">Tryout</option>
                    </select>
                    <Button type="submit" className="md:col-span-2" disabled={!eventForm.title.trim() || !eventForm.date.trim()}>
                      Add event
                    </Button>
                  </form>
                ) : null}
                {events.map((event) => (
                  <div key={event.id} className="rounded-xl border p-4">
                    <p className="font-medium">{event.title}</p>
                    {event.type === "game" && liveScoresByEvent[event.id] ? (
                      <div className="mt-3 rounded-xl bg-muted p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{liveScoresByEvent[event.id].status}</p>
                            <p className="font-semibold">{team.name} vs {liveScoresByEvent[event.id].opponentName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">
                              {liveScoresByEvent[event.id].teamScore} - {liveScoresByEvent[event.id].opponentScore}
                            </p>
                            <p className="text-xs text-muted-foreground">{liveScoresByEvent[event.id].periodLabel}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <p className="text-sm text-muted-foreground">{[event.type, event.date, event.location].filter(Boolean).join(" • ")}</p>
                    {user ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["going", "maybe", "not_going"] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            className={`rounded-full border px-3 py-1 text-xs ${event.rsvpBy?.[user.uid] === status ? "border-primary bg-primary/5 text-primary" : ""}`}
                            onClick={() => void updateEventRsvp(event.id, status).then(refreshTeamData)}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {isAdmin ? (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        <Button size="sm" variant="outline" onClick={() => void sendEventRsvpReminders(team.id, event, team.name).then(refreshTeamData)}>
                          Send RSVP Reminder
                        </Button>
                        {event.type === "game" ? (
                          <div className="rounded-xl border p-3">
                            <p className="mb-3 text-sm font-medium">Live Score Controls</p>
                            <div className="grid gap-2 md:grid-cols-2">
                              <input
                                value={scoreDrafts[event.id]?.opponentName ?? event.title}
                                onChange={(eventChange) =>
                                  setScoreDrafts((current) => ({
                                    ...current,
                                    [event.id]: {
                                      opponentName: eventChange.target.value,
                                      teamScore: current[event.id]?.teamScore ?? "0",
                                      opponentScore: current[event.id]?.opponentScore ?? "0",
                                      status: current[event.id]?.status ?? "scheduled",
                                      periodLabel: current[event.id]?.periodLabel ?? "Q1",
                                    },
                                  }))
                                }
                                placeholder="Opponent name"
                                className="h-9 rounded-md border border-input px-3 text-sm"
                              />
                              <select
                                value={scoreDrafts[event.id]?.status ?? "scheduled"}
                                onChange={(eventChange) =>
                                  setScoreDrafts((current) => ({
                                    ...current,
                                    [event.id]: {
                                      opponentName: current[event.id]?.opponentName ?? event.title,
                                      teamScore: current[event.id]?.teamScore ?? "0",
                                      opponentScore: current[event.id]?.opponentScore ?? "0",
                                      status: eventChange.target.value as LiveScoreRecord["status"],
                                      periodLabel: current[event.id]?.periodLabel ?? "Q1",
                                    },
                                  }))
                                }
                                className="h-9 rounded-md border border-input px-3 text-sm"
                              >
                                <option value="scheduled">scheduled</option>
                                <option value="live">live</option>
                                <option value="final">final</option>
                              </select>
                              <input
                                value={scoreDrafts[event.id]?.teamScore ?? "0"}
                                onChange={(eventChange) =>
                                  setScoreDrafts((current) => ({
                                    ...current,
                                    [event.id]: {
                                      opponentName: current[event.id]?.opponentName ?? event.title,
                                      teamScore: eventChange.target.value,
                                      opponentScore: current[event.id]?.opponentScore ?? "0",
                                      status: current[event.id]?.status ?? "scheduled",
                                      periodLabel: current[event.id]?.periodLabel ?? "Q1",
                                    },
                                  }))
                                }
                                type="number"
                                placeholder={`${team.name} score`}
                                className="h-9 rounded-md border border-input px-3 text-sm"
                              />
                              <input
                                value={scoreDrafts[event.id]?.opponentScore ?? "0"}
                                onChange={(eventChange) =>
                                  setScoreDrafts((current) => ({
                                    ...current,
                                    [event.id]: {
                                      opponentName: current[event.id]?.opponentName ?? event.title,
                                      teamScore: current[event.id]?.teamScore ?? "0",
                                      opponentScore: eventChange.target.value,
                                      status: current[event.id]?.status ?? "scheduled",
                                      periodLabel: current[event.id]?.periodLabel ?? "Q1",
                                    },
                                  }))
                                }
                                type="number"
                                placeholder="Opponent score"
                                className="h-9 rounded-md border border-input px-3 text-sm"
                              />
                              <input
                                value={scoreDrafts[event.id]?.periodLabel ?? "Q1"}
                                onChange={(eventChange) =>
                                  setScoreDrafts((current) => ({
                                    ...current,
                                    [event.id]: {
                                      opponentName: current[event.id]?.opponentName ?? event.title,
                                      teamScore: current[event.id]?.teamScore ?? "0",
                                      opponentScore: current[event.id]?.opponentScore ?? "0",
                                      status: current[event.id]?.status ?? "scheduled",
                                      periodLabel: eventChange.target.value,
                                    },
                                  }))
                                }
                                placeholder="Quarter / half / final"
                                className="h-9 rounded-md border border-input px-3 text-sm md:col-span-2"
                              />
                            </div>
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={() =>
                                void upsertTeamLiveScore({
                                  teamId: team.id,
                                  eventId: event.id,
                                  teamName: team.name,
                                  opponentName: scoreDrafts[event.id]?.opponentName || event.title,
                                  teamScore: Number(scoreDrafts[event.id]?.teamScore ?? 0),
                                  opponentScore: Number(scoreDrafts[event.id]?.opponentScore ?? 0),
                                  status: scoreDrafts[event.id]?.status ?? "scheduled",
                                  periodLabel: scoreDrafts[event.id]?.periodLabel || "Q1",
                                }).then(refreshTeamData)
                              }
                            >
                              Save Score Widget
                            </Button>
                          </div>
                        ) : null}
                        <div className="space-y-2">
                          {team.members.map((member) => {
                            const currentAttendance = attendanceByEvent[event.id]?.find((entry) => entry.memberUid === member.uid)?.status ?? "present";
                            return (
                              <div key={member.uid} className="flex items-center justify-between rounded-lg bg-muted p-2">
                                <span className="text-sm">{member.displayName}</span>
                                <select
                                  value={currentAttendance}
                                  onChange={(eventChange) =>
                                    void markAttendance(team.id, event.id, member.uid, member.displayName, eventChange.target.value as TeamAttendanceRecord["status"]).then(refreshTeamData)
                                  }
                                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                >
                                  <option value="present">present</option>
                                  <option value="late">late</option>
                                  <option value="absent">absent</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tryouts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form
                  className="space-y-3"
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    void submitTryoutApplication(team.id, tryoutForm).then(() => {
                      setTryoutForm({ name: "", position: "", message: "" });
                      return refreshTeamData();
                    });
                  }}
                >
                  <input value={tryoutForm.name} onChange={(event) => setTryoutForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" className="h-10 w-full rounded-md border border-input px-3 text-sm" />
                  <input value={tryoutForm.position} onChange={(event) => setTryoutForm((current) => ({ ...current, position: event.target.value }))} placeholder="Position" className="h-10 w-full rounded-md border border-input px-3 text-sm" />
                  <textarea value={tryoutForm.message} onChange={(event) => setTryoutForm((current) => ({ ...current, message: event.target.value }))} placeholder="Why should this team notice you?" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <Button type="submit" disabled={!tryoutForm.name.trim() || !tryoutForm.position.trim()}>
                    Submit tryout form
                  </Button>
                </form>
                {isAdmin ? (
                  <div className="space-y-3 border-t pt-4">
                    <p className="font-medium">Applications</p>
                    {tryouts.map((tryout) => (
                      <div key={tryout.id} className="rounded-xl border p-4">
                        <p className="font-semibold">{tryout.name}</p>
                        <p className="text-sm text-muted-foreground">{tryout.position}</p>
                        <p className="mt-2 text-sm">{tryout.message}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Brackets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAdmin ? (
                  <>
                    <input value={bracketTitle} onChange={(event) => setBracketTitle(event.target.value)} placeholder="Bracket title" className="h-10 w-full rounded-md border border-input px-3 text-sm" />
                    <textarea value={bracketRounds} onChange={(event) => setBracketRounds(event.target.value)} placeholder="Round|Team A vs Team B|Team C vs Team D" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    <Button onClick={() => void import("@/lib/tournaments").then(({ createTournamentBracket }) => createTournamentBracket({
                      teamId: team.id,
                      title: bracketTitle || `${team.name} Bracket`,
                      rounds: bracketRounds.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
                        const [name, ...matchups] = line.split("|");
                        return {
                          name: name.trim(),
                          matchups: matchups.map((matchup) => {
                            const [home, away] = matchup.split("vs");
                            return { home: (home ?? "").trim(), away: (away ?? "").trim() };
                          }),
                        };
                      }),
                    }))}>
                      Save Bracket
                    </Button>
                  </>
                ) : null}
                <Button variant="outline" asChild>
                  <Link href={`/brackets?team=${team.id}`}>Open Brackets</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAdmin ? (
                  <>
                    <textarea value={announcement} onChange={(event) => setAnnouncement(event.target.value)} className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    <Button onClick={() => void updateTeamAnnouncement(team.id, announcement).then(refreshTeamData)}>
                      Save announcement
                    </Button>
                  </>
                ) : (
                  <p className="text-sm">{team.announcement || "No announcement yet."}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Roster</CardTitle>
                  {team ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const csv = buildRosterCsv(team);
                        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement("a");
                        anchor.href = url;
                        anchor.download = `${team.name.toLowerCase().replace(/\s+/g, "-")}-roster.csv`;
                        anchor.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export CSV
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {team.members.map((member) => (
                  <div key={member.uid} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{member.displayName}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    {isAdmin ? (
                      <select
                          value={member.role}
                          onChange={(event) =>
                            void updateTeamMemberRole(team.id, member.uid, event.target.value as typeof member.role).then(refreshTeamData)
                          }
                          className="h-9 rounded-md border border-input px-2 text-sm"
                        >
                          <option value="owner">owner</option>
                          <option value="admin">admin</option>
                          <option value="coach">coach</option>
                          <option value="captain">captain</option>
                          <option value="player">player</option>
                        </select>
                      ) : null}
                    </div>
                    {isAdmin ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ORG_PERMISSION_OPTIONS.map((permission) => {
                          const hasPermission = member.orgPermissions?.includes(permission) ?? false;
                          return (
                            <button
                              key={permission}
                              type="button"
                              className={`rounded-full border px-2 py-1 text-xs ${hasPermission ? "border-primary bg-primary/5 text-primary" : ""}`}
                              onClick={() =>
                                void updateOrganizationPermissions(
                                  team.id,
                                  member.uid,
                                  hasPermission
                                    ? (member.orgPermissions ?? []).filter((item) => item !== permission)
                                    : [...(member.orgPermissions ?? []), permission]
                                ).then(refreshTeamData)
                              }
                            >
                              {permission}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    {isAdmin ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={staffNoteDrafts[member.uid] ?? ""}
                          onChange={(event) => setStaffNoteDrafts((current) => ({ ...current, [member.uid]: event.target.value }))}
                          placeholder="Staff note on this member"
                          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <Button size="sm" variant="outline" onClick={() => void addStaffNote(team.id, member.uid, staffNoteDrafts[member.uid] ?? "").then(() => refreshTeamData())}>
                          Save Staff Note
                        </Button>
                        {(staffNotesByMember[member.uid] ?? []).map((entry) => (
                          <div key={entry.id} className="rounded-lg bg-muted p-2 text-sm">
                            <p className="font-medium">{entry.authorName}</p>
                            <p>{entry.note}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coach Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCoach ? (
                  <>
                    <select value={feedbackForm.postId} onChange={(event) => {
                      const selectedPost = posts.find((post) => post.id === event.target.value);
                      setFeedbackForm((current) => ({
                        ...current,
                        postId: event.target.value,
                        athleteUid: selectedPost?.authorId || "",
                      }));
                    }} className="h-10 w-full rounded-md border border-input px-3 text-sm">
                      <option value="">Select team post</option>
                      {posts.map((post) => (
                        <option key={post.id} value={post.id}>{post.content.slice(0, 50) || post.id}</option>
                      ))}
                    </select>
                    <textarea value={feedbackForm.feedback} onChange={(event) => setFeedbackForm((current) => ({ ...current, feedback: event.target.value }))} placeholder="Add specific coaching notes for this athlete post" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    <Button disabled={!feedbackForm.postId || !feedbackForm.feedback.trim()} onClick={() => void addCoachFeedback(team.id, feedbackForm.postId, feedbackForm.athleteUid, feedbackForm.feedback).then(() => setFeedbackForm({ postId: "", athleteUid: "", feedback: "" }))}>
                      Save feedback
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Coaches and admins can leave structured feedback for team content here.</p>
                )}
              </CardContent>
            </Card>

            {isAdmin ? (
              <Card>
                <CardHeader>
                  <CardTitle>Invite Member</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <select value={inviteUid} onChange={(event) => setInviteUid(event.target.value)} className="h-10 w-full rounded-md border border-input px-3 text-sm">
                    <option value="">Select user</option>
                    {profiles.map((profile) => (
                      <option key={profile.uid} value={profile.uid}>
                        {profile.displayName} ({profile.role?.type || "member"})
                      </option>
                    ))}
                  </select>
                  <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as typeof inviteRole)} className="h-10 w-full rounded-md border border-input px-3 text-sm">
                    <option value="player">player</option>
                    <option value="captain">captain</option>
                    <option value="coach">coach</option>
                    <option value="admin">admin</option>
                  </select>
                  <Button disabled={!inviteUid} onClick={() => void inviteToTeam(team.id, inviteUid, inviteRole).then(() => setInviteUid(""))}>
                    Send invite
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  return (
    <AuthProvider>
      <TeamDetailsContent teamId={params.teamId} />
    </AuthProvider>
  );
}
