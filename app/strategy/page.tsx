"use client";

import { useMemo, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildCoachInboxSummary,
  buildEventRecap,
  buildHalftimeAdjustment,
  buildOpponentCard,
  buildPostgameFilmTasks,
  buildPregameBriefing,
  buildRecruitingChatReply,
  buildRecruitingFitUpgrade,
  buildSchedulingRecommendation,
  buildScoutingPacket,
  buildTeamTendenciesReport,
} from "@/lib/phase1";

function StrategyPageContent() {
  const [chatForm, setChatForm] = useState({ question: "", athleteContext: "" });
  const [inboxTopics, setInboxTopics] = useState("Training load check-in, recruiting follow-up, recovery concern");
  const [scheduleForm, setScheduleForm] = useState({ postType: "highlight reel", audience: "scouts and coaches", urgency: "medium" });
  const [eventForm, setEventForm] = useState({ title: "Spring Showcase", score: "78-70", standout: "Wing defense and second-half pace control", takeaway: "the group defended better after simplifying rotations" });
  const [scoutForm, setScoutForm] = useState({ athlete: "Jordan Miles", strengths: "motor, point-of-attack defense, quick second jump", growthAreas: "handle under pressure, upper-body strength", projection: "rotation athlete with upward recruiting value" });
  const [gameForm, setGameForm] = useState({ opponent: "Metro Prep", focus: "win the paint and value possessions", pressurePoint: "make their lead guard give it up early", halftimeIssue: "late closeouts and rushed finishers", halftimeAdjustment: "touch the paint before settling and talk earlier on switches", tendenciesOffense: "spread floor and attack gaps early", tendenciesDefense: "load strong side and stunt often", tendenciesRebounding: "gang rebound by committee", opponentStrength: "pace and live-dribble passing", opponentWeakness: "finishing through contact", opponentNote: "pressure their secondary ball handlers into rushed reads" });

  const recruitingReply = useMemo(() => buildRecruitingChatReply(chatForm), [chatForm]);
  const inboxSummary = useMemo(() => buildCoachInboxSummary(inboxTopics.split(",").map((item) => item.trim()).filter(Boolean)), [inboxTopics]);
  const schedulingRecommendation = useMemo(() => buildSchedulingRecommendation(scheduleForm), [scheduleForm]);
  const recap = useMemo(() => buildEventRecap(eventForm), [eventForm]);
  const scoutingPacket = useMemo(() => buildScoutingPacket(scoutForm), [scoutForm]);
  const pregameBriefing = useMemo(() => buildPregameBriefing({ opponent: gameForm.opponent, focus: gameForm.focus, pressurePoint: gameForm.pressurePoint }), [gameForm]);
  const halftimeNote = useMemo(() => buildHalftimeAdjustment({ issue: gameForm.halftimeIssue, adjustment: gameForm.halftimeAdjustment }), [gameForm]);
  const filmTasks = useMemo(() => buildPostgameFilmTasks({ themes: gameForm.halftimeIssue }), [gameForm]);
  const tendencies = useMemo(() => buildTeamTendenciesReport({ offense: gameForm.tendenciesOffense, defense: gameForm.tendenciesDefense, rebounding: gameForm.tendenciesRebounding }), [gameForm]);
  const opponentCard = useMemo(() => buildOpponentCard({ name: gameForm.opponent, strength: gameForm.opponentStrength, weakness: gameForm.opponentWeakness, note: gameForm.opponentNote }), [gameForm]);
  const fitUpgrade = useMemo(() => buildRecruitingFitUpgrade({ schoolType: "high-development mid-major programs", style: "competitive two-way play and coachability", value: "reliable effort with room to scale offensively" }), []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Strategy Hub</h1>
          <p className="text-muted-foreground">AI recruiting chat, coach inbox summaries, smart scheduling, event recaps, scouting packets, game briefings, and opponent prep.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recruiting Assistant</CardTitle>
              <CardDescription>Use the recruiting chatbot and fit assistant to sharpen prospect positioning.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={chatForm.question} onChange={(event) => setChatForm((current) => ({ ...current, question: event.target.value }))} placeholder="Recruiting question" />
              <textarea value={chatForm.athleteContext} onChange={(event) => setChatForm((current) => ({ ...current, athleteContext: event.target.value }))} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Athlete context" />
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{recruitingReply}</div>
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{fitUpgrade}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coach Inbox and Scheduling</CardTitle>
              <CardDescription>Summarize incoming threads and get a smarter publishing recommendation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea value={inboxTopics} onChange={(event) => setInboxTopics(event.target.value)} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Comma-separated inbox themes" />
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{inboxSummary}</div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input value={scheduleForm.postType} onChange={(event) => setScheduleForm((current) => ({ ...current, postType: event.target.value }))} placeholder="Post type" />
                <Input value={scheduleForm.audience} onChange={(event) => setScheduleForm((current) => ({ ...current, audience: event.target.value }))} placeholder="Audience" />
                <Input value={scheduleForm.urgency} onChange={(event) => setScheduleForm((current) => ({ ...current, urgency: event.target.value }))} placeholder="Urgency" />
              </div>
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{schedulingRecommendation}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Event Recap and Scouting Packet</CardTitle>
              <CardDescription>Auto-generate event recaps and recruiting packet language from a few structured inputs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} placeholder="Event title" />
                <Input value={eventForm.score} onChange={(event) => setEventForm((current) => ({ ...current, score: event.target.value }))} placeholder="Score or result" />
              </div>
              <Input value={eventForm.standout} onChange={(event) => setEventForm((current) => ({ ...current, standout: event.target.value }))} placeholder="Standout performance" />
              <textarea value={eventForm.takeaway} onChange={(event) => setEventForm((current) => ({ ...current, takeaway: event.target.value }))} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Main takeaway" />
              <div className="rounded-xl border p-4 text-sm">
                <p className="font-semibold">{recap.title}</p>
                <p className="mt-2">{recap.summary}</p>
                <p className="mt-2 text-muted-foreground">{recap.standout}</p>
              </div>

              <div className="grid gap-3 border-t pt-4">
                <Input value={scoutForm.athlete} onChange={(event) => setScoutForm((current) => ({ ...current, athlete: event.target.value }))} placeholder="Athlete" />
                <Input value={scoutForm.strengths} onChange={(event) => setScoutForm((current) => ({ ...current, strengths: event.target.value }))} placeholder="Strengths" />
                <Input value={scoutForm.growthAreas} onChange={(event) => setScoutForm((current) => ({ ...current, growthAreas: event.target.value }))} placeholder="Growth areas" />
                <Input value={scoutForm.projection} onChange={(event) => setScoutForm((current) => ({ ...current, projection: event.target.value }))} placeholder="Projection" />
              </div>
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{scoutingPacket}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Game Intelligence</CardTitle>
              <CardDescription>Pregame briefings, halftime adjustments, film tasks, team tendencies, and opponent scouting cards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={gameForm.opponent} onChange={(event) => setGameForm((current) => ({ ...current, opponent: event.target.value }))} placeholder="Opponent" />
                <Input value={gameForm.focus} onChange={(event) => setGameForm((current) => ({ ...current, focus: event.target.value }))} placeholder="Pregame focus" />
              </div>
              <Input value={gameForm.pressurePoint} onChange={(event) => setGameForm((current) => ({ ...current, pressurePoint: event.target.value }))} placeholder="Pressure point" />
              <Input value={gameForm.halftimeIssue} onChange={(event) => setGameForm((current) => ({ ...current, halftimeIssue: event.target.value }))} placeholder="Halftime issue" />
              <Input value={gameForm.halftimeAdjustment} onChange={(event) => setGameForm((current) => ({ ...current, halftimeAdjustment: event.target.value }))} placeholder="Halftime adjustment" />
              <Input value={gameForm.tendenciesOffense} onChange={(event) => setGameForm((current) => ({ ...current, tendenciesOffense: event.target.value }))} placeholder="Offense tendency" />
              <Input value={gameForm.tendenciesDefense} onChange={(event) => setGameForm((current) => ({ ...current, tendenciesDefense: event.target.value }))} placeholder="Defense tendency" />
              <Input value={gameForm.tendenciesRebounding} onChange={(event) => setGameForm((current) => ({ ...current, tendenciesRebounding: event.target.value }))} placeholder="Rebounding tendency" />
              <Input value={gameForm.opponentStrength} onChange={(event) => setGameForm((current) => ({ ...current, opponentStrength: event.target.value }))} placeholder="Opponent strength" />
              <Input value={gameForm.opponentWeakness} onChange={(event) => setGameForm((current) => ({ ...current, opponentWeakness: event.target.value }))} placeholder="Opponent weakness" />
              <textarea value={gameForm.opponentNote} onChange={(event) => setGameForm((current) => ({ ...current, opponentNote: event.target.value }))} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Opponent note" />

              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{pregameBriefing}</div>
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{halftimeNote}</div>
              <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">{tendencies}</div>
              <div className="rounded-xl border p-4 text-sm">
                <p className="font-semibold">{opponentCard.title}</p>
                <p className="mt-2">{opponentCard.summary}</p>
                <p className="mt-2 text-muted-foreground">{opponentCard.note}</p>
              </div>
              <div className="rounded-xl border p-4 text-sm space-y-2">
                {filmTasks.map((task) => <p key={task}>{task}</p>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function StrategyPage() {
  return (
    <AuthProvider>
      <StrategyPageContent />
    </AuthProvider>
  );
}
