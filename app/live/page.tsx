"use client";

import { useEffect, useMemo, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  askLiveQuestion,
  createLiveRoom,
  createReplayClip,
  endLiveRoom,
  getLiveOpsProfile,
  getLiveQuestions,
  getPlayerStatTickers,
  getLiveRooms,
  getReplayClips,
  pinLiveComment,
  saveLiveOpsProfile,
  savePlayerStatTicker,
  sendLiveChatMessage,
  subscribeToLiveChat,
  updateLiveRoomScoreboardOverlay,
  type LiveChatMessage,
  type LiveQuestionRecord,
  type LiveRoomRecord,
  type PlayerStatTickerRecord,
  type ReplayClipRecord,
} from "@/lib/phase7";

const ADVANCED_LIVE_FIELDS = [
  { key: "liveStatComparisonTool", label: "Live stat comparison tool" },
  { key: "coachClipboardNotesDuringGames", label: "Coach clipboard notes during games" },
  { key: "dynamicTicketPricing", label: "Dynamic ticket pricing" },
] as const;

function LivePageContent() {
  const [rooms, setRooms] = useState<LiveRoomRecord[]>([]);
  const [activeRoomId, setActiveRoomId] = useState("");
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [questions, setQuestions] = useState<LiveQuestionRecord[]>([]);
  const [replayClips, setReplayClips] = useState<ReplayClipRecord[]>([]);
  const [playerTicker, setPlayerTicker] = useState<PlayerStatTickerRecord[]>([]);
  const [status, setStatus] = useState("");
  const [advancedLiveOps, setAdvancedLiveOps] = useState<Record<string, string[]>>({});
  const [roomForm, setRoomForm] = useState({
    title: "",
    sponsorLabel: "",
    scoreOverlay: "",
    paidTicketLabel: "",
    homeTeam: "",
    awayTeam: "",
    homeScore: "0",
    awayScore: "0",
    periodLabel: "Q1",
    gameClock: "12:00",
    possession: "",
  });
  const [tickerForm, setTickerForm] = useState({ playerName: "", teamLabel: "", statLine: "", trendLabel: "", highlighted: true });
  const [chatDraft, setChatDraft] = useState("");
  const [questionDraft, setQuestionDraft] = useState("");
  const [replayForm, setReplayForm] = useState({ title: "", startSec: "0", endSec: "30" });

  const refresh = async (roomId = activeRoomId) => {
    const [nextRooms, nextLiveOps] = await Promise.all([getLiveRooms(), getLiveOpsProfile()]);
    setRooms(nextRooms);
    setAdvancedLiveOps(nextLiveOps.advancedLiveOps);
    if (roomId) {
      const [nextQuestions, nextReplays, nextTickers] = await Promise.all([
        getLiveQuestions(roomId),
        getReplayClips(roomId),
        getPlayerStatTickers(roomId),
      ]);
      setQuestions(nextQuestions);
      setReplayClips(nextReplays);
      setPlayerTicker(nextTickers);
    } else {
      setPlayerTicker([]);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!activeRoomId && rooms[0]) {
      setActiveRoomId(rooms[0].id);
    }
  }, [activeRoomId, rooms]);

  useEffect(() => {
    if (!activeRoomId) {
      setChatMessages([]);
      return;
    }
    void refresh(activeRoomId);
    return subscribeToLiveChat(activeRoomId, setChatMessages);
  }, [activeRoomId]);

  const activeRoom = useMemo(() => rooms.find((room) => room.id === activeRoomId) ?? null, [activeRoomId, rooms]);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Live Rooms</h1>
          <p className="text-muted-foreground">Host livestream rooms, run live chat, pin comments, save replay clips, sell tickets, and surface sponsor plus scoreboard overlays.</p>
          {status ? <p className="mt-2 text-sm text-primary">{status}</p> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Go Live</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={roomForm.title} onChange={(event) => setRoomForm((current) => ({ ...current, title: event.target.value }))} placeholder="Live room title" />
              <Input value={roomForm.sponsorLabel} onChange={(event) => setRoomForm((current) => ({ ...current, sponsorLabel: event.target.value }))} placeholder="Sponsor overlay label" />
              <Input value={roomForm.scoreOverlay} onChange={(event) => setRoomForm((current) => ({ ...current, scoreOverlay: event.target.value }))} placeholder="Scoreboard overlay text" />
              <Input value={roomForm.paidTicketLabel} onChange={(event) => setRoomForm((current) => ({ ...current, paidTicketLabel: event.target.value }))} placeholder="Paid ticket label" />
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={roomForm.homeTeam} onChange={(event) => setRoomForm((current) => ({ ...current, homeTeam: event.target.value }))} placeholder="Home team" />
                <Input value={roomForm.awayTeam} onChange={(event) => setRoomForm((current) => ({ ...current, awayTeam: event.target.value }))} placeholder="Away team" />
                <Input value={roomForm.homeScore} onChange={(event) => setRoomForm((current) => ({ ...current, homeScore: event.target.value }))} placeholder="Home score" />
                <Input value={roomForm.awayScore} onChange={(event) => setRoomForm((current) => ({ ...current, awayScore: event.target.value }))} placeholder="Away score" />
                <Input value={roomForm.periodLabel} onChange={(event) => setRoomForm((current) => ({ ...current, periodLabel: event.target.value }))} placeholder="Q1 / 1st Half" />
                <Input value={roomForm.gameClock} onChange={(event) => setRoomForm((current) => ({ ...current, gameClock: event.target.value }))} placeholder="12:00" />
                <Input value={roomForm.possession} onChange={(event) => setRoomForm((current) => ({ ...current, possession: event.target.value }))} placeholder="Possession arrow or team" className="md:col-span-2" />
              </div>
              <Button onClick={() => void createLiveRoom({
                title: roomForm.title,
                sponsorLabel: roomForm.sponsorLabel,
                scoreOverlay: roomForm.scoreOverlay,
                paidTicketLabel: roomForm.paidTicketLabel,
                scoreboardOverlay: {
                  homeTeam: roomForm.homeTeam,
                  awayTeam: roomForm.awayTeam,
                  homeScore: Number(roomForm.homeScore),
                  awayScore: Number(roomForm.awayScore),
                  periodLabel: roomForm.periodLabel,
                  gameClock: roomForm.gameClock,
                  possession: roomForm.possession,
                },
              }).then(() => { setRoomForm({ title: "", sponsorLabel: "", scoreOverlay: "", paidTicketLabel: "", homeTeam: "", awayTeam: "", homeScore: "0", awayScore: "0", periodLabel: "Q1", gameClock: "12:00", possession: "" }); refresh(); })}>
                Create Live Room
              </Button>
              <div className="space-y-2">
                {rooms.map((room) => (
                  <button key={room.id} type="button" onClick={() => setActiveRoomId(room.id)} className={`w-full rounded-xl border p-3 text-left ${activeRoomId === room.id ? "border-primary bg-primary/5" : ""}`}>
                    <p className="font-semibold">{room.title}</p>
                    <p className="text-xs text-muted-foreground">{[room.status, room.sponsorLabel, room.scoreOverlay, room.paidTicketLabel].filter(Boolean).join(" • ")}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{activeRoom?.title || "Select a room"}</CardTitle>
              <CardDescription>Live chat, pinned comments, Q&A, and replay workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeRoom ? (
                <>
                  <div className="rounded-2xl border bg-black p-6 text-white">
                    <p className="text-lg font-semibold">Live preview placeholder</p>
                    {activeRoom.sponsorLabel ? <p className="mt-2 text-amber-300">Sponsor: {activeRoom.sponsorLabel}</p> : null}
                    {activeRoom.scoreOverlay ? <p className="mt-2 text-sm">Scoreboard: {activeRoom.scoreOverlay}</p> : null}
                    {activeRoom.scoreboardOverlay ? (
                      <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4">
                        <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-wide text-white/70">
                          <span>{activeRoom.scoreboardOverlay.periodLabel}</span>
                          <span>{activeRoom.scoreboardOverlay.gameClock}</span>
                          <span>{activeRoom.scoreboardOverlay.possession || "No possession set"}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                          <div>
                            <p className="text-sm text-white/70">Home</p>
                            <p className="text-xl font-semibold">{activeRoom.scoreboardOverlay.homeTeam || "HOME"}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-4xl font-bold">{activeRoom.scoreboardOverlay.homeScore} - {activeRoom.scoreboardOverlay.awayScore}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white/70">Away</p>
                            <p className="text-xl font-semibold">{activeRoom.scoreboardOverlay.awayTeam || "AWAY"}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {activeRoom.paidTicketLabel ? <p className="mt-2 text-sm">Ticketed access: {activeRoom.paidTicketLabel}</p> : null}
                    <Button className="mt-4" variant="outline" onClick={() => void endLiveRoom(activeRoom.id).then(() => refresh(activeRoom.id))}>End Stream</Button>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">Live Scoreboard Overlay</p>
                      <Button
                        variant="outline"
                        onClick={() => void updateLiveRoomScoreboardOverlay(activeRoom.id, {
                          scoreOverlay: roomForm.scoreOverlay || activeRoom.scoreOverlay || "Game scoreboard",
                          scoreboardOverlay: {
                            homeTeam: roomForm.homeTeam || activeRoom.scoreboardOverlay?.homeTeam || "",
                            awayTeam: roomForm.awayTeam || activeRoom.scoreboardOverlay?.awayTeam || "",
                            homeScore: Number(roomForm.homeScore || activeRoom.scoreboardOverlay?.homeScore || 0),
                            awayScore: Number(roomForm.awayScore || activeRoom.scoreboardOverlay?.awayScore || 0),
                            periodLabel: roomForm.periodLabel || activeRoom.scoreboardOverlay?.periodLabel || "Q1",
                            gameClock: roomForm.gameClock || activeRoom.scoreboardOverlay?.gameClock || "12:00",
                            possession: roomForm.possession || activeRoom.scoreboardOverlay?.possession || "",
                          },
                        }).then(() => refresh(activeRoom.id))}
                      >
                        Update Overlay
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <Input value={roomForm.homeTeam} onChange={(event) => setRoomForm((current) => ({ ...current, homeTeam: event.target.value }))} placeholder={activeRoom.scoreboardOverlay?.homeTeam || "Home team"} />
                      <Input value={roomForm.awayTeam} onChange={(event) => setRoomForm((current) => ({ ...current, awayTeam: event.target.value }))} placeholder={activeRoom.scoreboardOverlay?.awayTeam || "Away team"} />
                      <Input value={roomForm.homeScore} onChange={(event) => setRoomForm((current) => ({ ...current, homeScore: event.target.value }))} placeholder={String(activeRoom.scoreboardOverlay?.homeScore ?? 0)} />
                      <Input value={roomForm.awayScore} onChange={(event) => setRoomForm((current) => ({ ...current, awayScore: event.target.value }))} placeholder={String(activeRoom.scoreboardOverlay?.awayScore ?? 0)} />
                      <Input value={roomForm.periodLabel} onChange={(event) => setRoomForm((current) => ({ ...current, periodLabel: event.target.value }))} placeholder={activeRoom.scoreboardOverlay?.periodLabel || "Q1"} />
                      <Input value={roomForm.gameClock} onChange={(event) => setRoomForm((current) => ({ ...current, gameClock: event.target.value }))} placeholder={activeRoom.scoreboardOverlay?.gameClock || "12:00"} />
                      <Input value={roomForm.possession} onChange={(event) => setRoomForm((current) => ({ ...current, possession: event.target.value }))} placeholder={activeRoom.scoreboardOverlay?.possession || "Possession"} className="md:col-span-2" />
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">Real-Time Player Stat Ticker</p>
                      <Button
                        variant="outline"
                        onClick={() => void savePlayerStatTicker({ roomId: activeRoom.id, ...tickerForm }).then(() => {
                          setTickerForm({ playerName: "", teamLabel: "", statLine: "", trendLabel: "", highlighted: true });
                          refresh(activeRoom.id);
                        })}
                        disabled={!tickerForm.playerName.trim() || !tickerForm.statLine.trim()}
                      >
                        Add Ticker Item
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <Input value={tickerForm.playerName} onChange={(event) => setTickerForm((current) => ({ ...current, playerName: event.target.value }))} placeholder="Player name" />
                      <Input value={tickerForm.teamLabel} onChange={(event) => setTickerForm((current) => ({ ...current, teamLabel: event.target.value }))} placeholder="Team label" />
                      <Input value={tickerForm.statLine} onChange={(event) => setTickerForm((current) => ({ ...current, statLine: event.target.value }))} placeholder="18 PTS • 7 REB • 4 AST" />
                      <Input value={tickerForm.trendLabel} onChange={(event) => setTickerForm((current) => ({ ...current, trendLabel: event.target.value }))} placeholder="8 straight points" />
                      <label className="flex items-center justify-between rounded-md border px-3 text-sm md:col-span-2">
                        <span>Highlight this ticker item</span>
                        <input type="checkbox" checked={tickerForm.highlighted} onChange={(event) => setTickerForm((current) => ({ ...current, highlighted: event.target.checked }))} />
                      </label>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-2xl border bg-muted/30">
                      <div className="flex gap-3 overflow-x-auto p-3">
                        {playerTicker.length === 0 ? (
                          <div className="rounded-full border px-4 py-2 text-sm text-muted-foreground">No ticker items yet.</div>
                        ) : (
                          playerTicker.map((item) => (
                            <div key={item.id} className={`min-w-max rounded-full border px-4 py-2 text-sm ${item.highlighted ? "border-primary bg-primary/10 text-primary" : "bg-background"}`}>
                              <span className="font-semibold">{item.playerName}</span>
                              {item.teamLabel ? ` • ${item.teamLabel}` : ""}
                              {item.statLine ? ` • ${item.statLine}` : ""}
                              {item.trendLabel ? ` • ${item.trendLabel}` : ""}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <p className="font-semibold">Live Chat</p>
                      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border p-3">
                        {chatMessages.map((message) => (
                          <div key={message.id} className="rounded-lg bg-muted p-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{message.senderName}</span>
                              <Button size="sm" variant="outline" onClick={() => void pinLiveComment(message.id, !message.pinned).then(() => refresh(activeRoom.id))}>
                                {message.pinned ? "Unpin" : "Pin"}
                              </Button>
                            </div>
                            <p className="mt-1">{message.text}</p>
                            {message.pinned ? <p className="mt-1 text-xs text-primary">Pinned comment</p> : null}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Send live chat message" />
                        <Button onClick={() => void sendLiveChatMessage(activeRoom.id, chatDraft).then(() => setChatDraft(""))}>Send</Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="font-semibold">Live Q&A</p>
                      <textarea value={questionDraft} onChange={(event) => setQuestionDraft(event.target.value)} placeholder="Ask a live question" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      <Button onClick={() => void askLiveQuestion(activeRoom.id, questionDraft).then(() => { setQuestionDraft(""); refresh(activeRoom.id); })}>Submit Question</Button>
                      <div className="space-y-2">
                        {questions.map((question) => (
                          <div key={question.id} className="rounded-xl border p-3 text-sm">
                            <p className="font-medium">{question.askerName}</p>
                            <p className="text-muted-foreground">{question.question}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="font-semibold">Replay Archive</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-4">
                      <Input value={replayForm.title} onChange={(event) => setReplayForm((current) => ({ ...current, title: event.target.value }))} placeholder="Clip title" />
                      <Input value={replayForm.startSec} onChange={(event) => setReplayForm((current) => ({ ...current, startSec: event.target.value }))} placeholder="Start sec" />
                      <Input value={replayForm.endSec} onChange={(event) => setReplayForm((current) => ({ ...current, endSec: event.target.value }))} placeholder="End sec" />
                      <Button onClick={() => void createReplayClip({ roomId: activeRoom.id, title: replayForm.title, startSec: Number(replayForm.startSec), endSec: Number(replayForm.endSec) }).then(() => { setReplayForm({ title: "", startSec: "0", endSec: "30" }); refresh(activeRoom.id); })}>Save Replay Clip</Button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {replayClips.map((clip) => (
                        <div key={clip.id} className="rounded-lg bg-muted p-3 text-sm">
                          <p className="font-medium">{clip.title}</p>
                          <p className="text-muted-foreground">{clip.startSec}s - {clip.endSec}s</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Create or select a live room to manage it.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Live Ops Workspace</CardTitle>
            <CardDescription>Manage stat comparison views, coach clipboard notes, and dynamic ticket-pricing notes for live events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{rooms.length}</div><div className="text-sm text-muted-foreground">Live rooms</div></div>
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{playerTicker.length}</div><div className="text-sm text-muted-foreground">Ticker items</div></div>
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{questions.length}</div><div className="text-sm text-muted-foreground">Live questions</div></div>
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{Object.values(advancedLiveOps).reduce((sum, items) => sum + items.length, 0)}</div><div className="text-sm text-muted-foreground">Live ops notes</div></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {ADVANCED_LIVE_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2 rounded-xl border p-4">
                  <p className="font-medium">{field.label}</p>
                  <textarea
                    value={(advancedLiveOps[field.key] ?? []).join("\n")}
                    onChange={(event) => setAdvancedLiveOps((current) => ({
                      ...current,
                      [field.key]: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                    }))}
                    placeholder={`${field.label} notes, one item per line`}
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={() => void saveLiveOpsProfile({ advancedLiveOps }).then(() => setStatus("Live ops workspace saved."))}>
              Save Live Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function LivePage() {
  return (
    <AuthProvider>
      <LivePageContent />
    </AuthProvider>
  );
}
