"use client";

import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createBenchmark,
  createCombineWorkflow,
  createCommunityPoll,
  createDigitalId,
  createDivisionStanding,
  createFanSurvey,
  createForumThread,
  createFreeAgent,
  createLeagueAdmin,
  createOffseasonBoard,
  createPortalTheme,
  createPostingLimit,
  createProspectRanking,
  createProtestSubmission,
  createRefAssignment,
  createRulebookQuiz,
  createSeasonSchedule,
  createStaffCertification,
  createTeamWebsite,
  createTopicModerator,
  getLeagueHubSnapshot,
} from "@/lib/phase9-league";

function LeagueHubContent() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getLeagueHubSnapshot>> | null>(null);
  const [teamId, setTeamId] = useState("");

  const [leagueForm, setLeagueForm] = useState({ leagueName: "", adminName: "", region: "" });
  const [standingForm, setStandingForm] = useState({ divisionName: "", teamName: "", wins: "0", losses: "0" });
  const [scheduleForm, setScheduleForm] = useState({ seasonLabel: "", teamName: "", opponentName: "", dateLabel: "" });
  const [refForm, setRefForm] = useState({ gameLabel: "", refereeName: "", roleLabel: "" });
  const [protestForm, setProtestForm] = useState({ teamName: "", gameLabel: "", summary: "", status: "submitted" });
  const [quizForm, setQuizForm] = useState({ title: "", questionCount: "10", passingScore: "8" });
  const [certForm, setCertForm] = useState({ staffName: "", certificationName: "", expiresOn: "" });
  const [offseasonForm, setOffseasonForm] = useState({ title: "", focusArea: "", ownerName: "" });
  const [freeAgentForm, setFreeAgentForm] = useState({ athleteName: "", sport: "", position: "", status: "available" });
  const [combineForm, setCombineForm] = useState({ athleteName: "", eventLabel: "", completedStations: "2", totalStations: "6" });
  const [benchmarkForm, setBenchmarkForm] = useState({ metricName: "", sport: "", eliteValue: "" });
  const [rankingForm, setRankingForm] = useState({ athleteName: "", rankValue: "1", scoutName: "" });
  const [pollForm, setPollForm] = useState({ question: "", options: "Yes,No" });
  const [surveyForm, setSurveyForm] = useState({ surveyTitle: "", responseCount: "15", avgScore: "4.5" });
  const [forumForm, setForumForm] = useState({ title: "", authorName: "", category: "" });
  const [moderatorForm, setModeratorForm] = useState({ topicName: "", moderatorName: "" });
  const [postingForm, setPostingForm] = useState({ reputationTier: "", dailyPostLimit: "5" });
  const [portalForm, setPortalForm] = useState({ schoolName: "", primaryColor: "#0f172a", mascotLabel: "" });
  const [websiteForm, setWebsiteForm] = useState({ siteTitle: "", heroMessage: "" });
  const [idForm, setIdForm] = useState({ athleteName: "", teamName: "", cardNumber: "" });

  const refresh = async () => {
    setLoading(true);
    try {
      const nextSnapshot = await getLeagueHubSnapshot();
      setSnapshot(nextSnapshot);
      if (!teamId && nextSnapshot.teamOptions[0]) setTeamId(nextSnapshot.teamOptions[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const submit = async (action: () => Promise<void>, message: string, reset?: () => void) => {
    await action();
    reset?.();
    setStatus(message);
    await refresh();
  };

  if (loading || !snapshot) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">League and Community Hub</h1>
          <p className="text-muted-foreground">League ops, officiating, scouting benchmarks, public forums, portal branding, and digital identity in one workspace.</p>
          {status ? <p className="mt-2 text-sm text-primary">{status}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.standings.length}</div><div className="text-sm text-muted-foreground">Standings rows</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.refAssignments.length}</div><div className="text-sm text-muted-foreground">Ref assignments</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.freeAgents.length}</div><div className="text-sm text-muted-foreground">Free agents</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.forumThreads.length}</div><div className="text-sm text-muted-foreground">Forum threads</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.digitalIds.length}</div><div className="text-sm text-muted-foreground">Digital IDs</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Team Context</CardTitle></CardHeader>
          <CardContent>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Choose team</option>
              {snapshot.teamOptions.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
            </select>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>League Ops</CardTitle><CardDescription>League admins, standings, schedules, refs, protests, rulebook quizzes, and certifications.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={leagueForm.leagueName} onChange={(e) => setLeagueForm((c) => ({ ...c, leagueName: e.target.value }))} placeholder="League name" />
                <Input value={leagueForm.adminName} onChange={(e) => setLeagueForm((c) => ({ ...c, adminName: e.target.value }))} placeholder="Admin name" />
                <Input value={leagueForm.region} onChange={(e) => setLeagueForm((c) => ({ ...c, region: e.target.value }))} placeholder="Region" />
                <Input value={standingForm.divisionName} onChange={(e) => setStandingForm((c) => ({ ...c, divisionName: e.target.value }))} placeholder="Division" />
                <Input value={standingForm.teamName} onChange={(e) => setStandingForm((c) => ({ ...c, teamName: e.target.value }))} placeholder="Team name" />
                <Input value={standingForm.wins} onChange={(e) => setStandingForm((c) => ({ ...c, wins: e.target.value }))} placeholder="Wins" />
                <Input value={standingForm.losses} onChange={(e) => setStandingForm((c) => ({ ...c, losses: e.target.value }))} placeholder="Losses" />
                <Input value={scheduleForm.seasonLabel} onChange={(e) => setScheduleForm((c) => ({ ...c, seasonLabel: e.target.value }))} placeholder="Season label" />
                <Input value={scheduleForm.teamName} onChange={(e) => setScheduleForm((c) => ({ ...c, teamName: e.target.value }))} placeholder="Scheduled team" />
                <Input value={scheduleForm.opponentName} onChange={(e) => setScheduleForm((c) => ({ ...c, opponentName: e.target.value }))} placeholder="Opponent" />
                <Input value={scheduleForm.dateLabel} onChange={(e) => setScheduleForm((c) => ({ ...c, dateLabel: e.target.value }))} placeholder="Date/time" />
                <Input value={refForm.gameLabel} onChange={(e) => setRefForm((c) => ({ ...c, gameLabel: e.target.value }))} placeholder="Game label" />
                <Input value={refForm.refereeName} onChange={(e) => setRefForm((c) => ({ ...c, refereeName: e.target.value }))} placeholder="Referee" />
                <Input value={refForm.roleLabel} onChange={(e) => setRefForm((c) => ({ ...c, roleLabel: e.target.value }))} placeholder="Role" />
                <Input value={quizForm.title} onChange={(e) => setQuizForm((c) => ({ ...c, title: e.target.value }))} placeholder="Rulebook quiz title" />
                <Input value={quizForm.questionCount} onChange={(e) => setQuizForm((c) => ({ ...c, questionCount: e.target.value }))} placeholder="Questions" />
                <Input value={quizForm.passingScore} onChange={(e) => setQuizForm((c) => ({ ...c, passingScore: e.target.value }))} placeholder="Passing score" />
                <Input value={certForm.staffName} onChange={(e) => setCertForm((c) => ({ ...c, staffName: e.target.value }))} placeholder="Staff name" />
                <Input value={certForm.certificationName} onChange={(e) => setCertForm((c) => ({ ...c, certificationName: e.target.value }))} placeholder="Certification" />
                <Input value={certForm.expiresOn} onChange={(e) => setCertForm((c) => ({ ...c, expiresOn: e.target.value }))} placeholder="Expires on" />
              </div>
              <textarea value={protestForm.summary} onChange={(e) => setProtestForm((c) => ({ ...c, summary: e.target.value }))} placeholder="Protest or dispute summary" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={protestForm.teamName} onChange={(e) => setProtestForm((c) => ({ ...c, teamName: e.target.value }))} placeholder="Protesting team" />
                <Input value={protestForm.gameLabel} onChange={(e) => setProtestForm((c) => ({ ...c, gameLabel: e.target.value }))} placeholder="Game label" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createLeagueAdmin(leagueForm), "League admin saved.", () => setLeagueForm({ leagueName: "", adminName: "", region: "" }))} disabled={!leagueForm.leagueName.trim()}>Save League Admin</Button>
                <Button variant="outline" onClick={() => void submit(() => createDivisionStanding({ divisionName: standingForm.divisionName, teamName: standingForm.teamName, wins: Number(standingForm.wins), losses: Number(standingForm.losses) }), "Division standing saved.", () => setStandingForm({ divisionName: "", teamName: "", wins: "0", losses: "0" }))} disabled={!standingForm.teamName.trim()}>Save Standing</Button>
                <Button variant="outline" onClick={() => void submit(() => createSeasonSchedule(scheduleForm), "Season schedule row saved.", () => setScheduleForm({ seasonLabel: "", teamName: "", opponentName: "", dateLabel: "" }))} disabled={!scheduleForm.teamName.trim()}>Save Schedule</Button>
                <Button variant="outline" onClick={() => void submit(() => createRefAssignment(refForm), "Ref assignment saved.", () => setRefForm({ gameLabel: "", refereeName: "", roleLabel: "" }))} disabled={!refForm.refereeName.trim()}>Save Ref</Button>
                <Button variant="outline" onClick={() => void submit(() => createProtestSubmission({ ...protestForm, status: protestForm.status as "submitted" | "reviewing" | "resolved" }), "Protest submitted.", () => setProtestForm({ teamName: "", gameLabel: "", summary: "", status: "submitted" }))} disabled={!protestForm.summary.trim()}>Submit Protest</Button>
                <Button variant="outline" onClick={() => void submit(() => createRulebookQuiz({ title: quizForm.title, questionCount: Number(quizForm.questionCount), passingScore: Number(quizForm.passingScore) }), "Rulebook quiz saved.", () => setQuizForm({ title: "", questionCount: "10", passingScore: "8" }))} disabled={!quizForm.title.trim()}>Save Quiz</Button>
                <Button variant="outline" onClick={() => void submit(() => createStaffCertification(certForm), "Staff certification saved.", () => setCertForm({ staffName: "", certificationName: "", expiresOn: "" }))} disabled={!certForm.staffName.trim()}>Save Certification</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Scouting and Offseason Ops</CardTitle><CardDescription>Offseason boards, free agents, combine workflow, benchmarks, and prospect rankings.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={offseasonForm.title} onChange={(e) => setOffseasonForm((c) => ({ ...c, title: e.target.value }))} placeholder="Offseason board title" />
                <Input value={offseasonForm.focusArea} onChange={(e) => setOffseasonForm((c) => ({ ...c, focusArea: e.target.value }))} placeholder="Focus area" />
                <Input value={offseasonForm.ownerName} onChange={(e) => setOffseasonForm((c) => ({ ...c, ownerName: e.target.value }))} placeholder="Owner" />
                <Input value={freeAgentForm.athleteName} onChange={(e) => setFreeAgentForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Free agent athlete" />
                <Input value={freeAgentForm.sport} onChange={(e) => setFreeAgentForm((c) => ({ ...c, sport: e.target.value }))} placeholder="Sport" />
                <Input value={freeAgentForm.position} onChange={(e) => setFreeAgentForm((c) => ({ ...c, position: e.target.value }))} placeholder="Position" />
                <Input value={combineForm.athleteName} onChange={(e) => setCombineForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Combine athlete" />
                <Input value={combineForm.eventLabel} onChange={(e) => setCombineForm((c) => ({ ...c, eventLabel: e.target.value }))} placeholder="Combine event" />
                <Input value={combineForm.completedStations} onChange={(e) => setCombineForm((c) => ({ ...c, completedStations: e.target.value }))} placeholder="Completed stations" />
                <Input value={combineForm.totalStations} onChange={(e) => setCombineForm((c) => ({ ...c, totalStations: e.target.value }))} placeholder="Total stations" />
                <Input value={benchmarkForm.metricName} onChange={(e) => setBenchmarkForm((c) => ({ ...c, metricName: e.target.value }))} placeholder="Benchmark metric" />
                <Input value={benchmarkForm.sport} onChange={(e) => setBenchmarkForm((c) => ({ ...c, sport: e.target.value }))} placeholder="Sport" />
                <Input value={benchmarkForm.eliteValue} onChange={(e) => setBenchmarkForm((c) => ({ ...c, eliteValue: e.target.value }))} placeholder="Elite value" />
                <Input value={rankingForm.athleteName} onChange={(e) => setRankingForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Ranked athlete" />
                <Input value={rankingForm.rankValue} onChange={(e) => setRankingForm((c) => ({ ...c, rankValue: e.target.value }))} placeholder="Rank" />
                <Input value={rankingForm.scoutName} onChange={(e) => setRankingForm((c) => ({ ...c, scoutName: e.target.value }))} placeholder="Scout name" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createOffseasonBoard({ teamId, ...offseasonForm }), "Offseason board saved.", () => setOffseasonForm({ title: "", focusArea: "", ownerName: "" }))} disabled={!teamId || !offseasonForm.title.trim()}>Save Offseason Board</Button>
                <Button variant="outline" onClick={() => void submit(() => createFreeAgent({ ...freeAgentForm, status: freeAgentForm.status as "available" | "contacted" | "signed" }), "Free agent saved.", () => setFreeAgentForm({ athleteName: "", sport: "", position: "", status: "available" }))} disabled={!freeAgentForm.athleteName.trim()}>Save Free Agent</Button>
                <Button variant="outline" onClick={() => void submit(() => createCombineWorkflow({ athleteName: combineForm.athleteName, eventLabel: combineForm.eventLabel, completedStations: Number(combineForm.completedStations), totalStations: Number(combineForm.totalStations) }), "Combine workflow saved.", () => setCombineForm({ athleteName: "", eventLabel: "", completedStations: "2", totalStations: "6" }))} disabled={!combineForm.athleteName.trim()}>Save Combine</Button>
                <Button variant="outline" onClick={() => void submit(() => createBenchmark(benchmarkForm), "Benchmark saved.", () => setBenchmarkForm({ metricName: "", sport: "", eliteValue: "" }))} disabled={!benchmarkForm.metricName.trim()}>Save Benchmark</Button>
                <Button variant="outline" onClick={() => void submit(() => createProspectRanking({ athleteName: rankingForm.athleteName, rankValue: Number(rankingForm.rankValue), scoutName: rankingForm.scoutName }), "Prospect ranking saved.", () => setRankingForm({ athleteName: "", rankValue: "1", scoutName: "" }))} disabled={!rankingForm.athleteName.trim()}>Save Ranking</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Community Governance</CardTitle><CardDescription>Community polls, fan surveys, public forum threads, topic moderators, and posting limits by reputation.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={pollForm.question} onChange={(e) => setPollForm((c) => ({ ...c, question: e.target.value }))} placeholder="Poll question" />
                <Input value={pollForm.options} onChange={(e) => setPollForm((c) => ({ ...c, options: e.target.value }))} placeholder="Poll options" />
                <Input value={surveyForm.surveyTitle} onChange={(e) => setSurveyForm((c) => ({ ...c, surveyTitle: e.target.value }))} placeholder="Survey title" />
                <Input value={surveyForm.responseCount} onChange={(e) => setSurveyForm((c) => ({ ...c, responseCount: e.target.value }))} placeholder="Responses" />
                <Input value={surveyForm.avgScore} onChange={(e) => setSurveyForm((c) => ({ ...c, avgScore: e.target.value }))} placeholder="Avg score" />
                <Input value={forumForm.title} onChange={(e) => setForumForm((c) => ({ ...c, title: e.target.value }))} placeholder="Forum title" />
                <Input value={forumForm.authorName} onChange={(e) => setForumForm((c) => ({ ...c, authorName: e.target.value }))} placeholder="Author" />
                <Input value={forumForm.category} onChange={(e) => setForumForm((c) => ({ ...c, category: e.target.value }))} placeholder="Category" />
                <Input value={moderatorForm.topicName} onChange={(e) => setModeratorForm((c) => ({ ...c, topicName: e.target.value }))} placeholder="Topic name" />
                <Input value={moderatorForm.moderatorName} onChange={(e) => setModeratorForm((c) => ({ ...c, moderatorName: e.target.value }))} placeholder="Moderator name" />
                <Input value={postingForm.reputationTier} onChange={(e) => setPostingForm((c) => ({ ...c, reputationTier: e.target.value }))} placeholder="Reputation tier" />
                <Input value={postingForm.dailyPostLimit} onChange={(e) => setPostingForm((c) => ({ ...c, dailyPostLimit: e.target.value }))} placeholder="Daily post limit" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createCommunityPoll({ question: pollForm.question, options: pollForm.options.split(",").map((item) => item.trim()).filter(Boolean) }), "Community poll saved.", () => setPollForm({ question: "", options: "Yes,No" }))} disabled={!pollForm.question.trim()}>Save Poll</Button>
                <Button variant="outline" onClick={() => void submit(() => createFanSurvey({ surveyTitle: surveyForm.surveyTitle, responseCount: Number(surveyForm.responseCount), avgScore: Number(surveyForm.avgScore) }), "Fan survey snapshot saved.", () => setSurveyForm({ surveyTitle: "", responseCount: "15", avgScore: "4.5" }))} disabled={!surveyForm.surveyTitle.trim()}>Save Survey</Button>
                <Button variant="outline" onClick={() => void submit(() => createForumThread(forumForm), "Forum thread saved.", () => setForumForm({ title: "", authorName: "", category: "" }))} disabled={!forumForm.title.trim()}>Save Thread</Button>
                <Button variant="outline" onClick={() => void submit(() => createTopicModerator(moderatorForm), "Topic moderator saved.", () => setModeratorForm({ topicName: "", moderatorName: "" }))} disabled={!moderatorForm.topicName.trim()}>Save Moderator</Button>
                <Button variant="outline" onClick={() => void submit(() => createPostingLimit({ reputationTier: postingForm.reputationTier, dailyPostLimit: Number(postingForm.dailyPostLimit) }), "Posting limit saved.", () => setPostingForm({ reputationTier: "", dailyPostLimit: "5" }))} disabled={!postingForm.reputationTier.trim()}>Save Posting Limit</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>School-Branded Portals</CardTitle><CardDescription>School themes, team website builder, and digital ID wallet records for athletes.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={portalForm.schoolName} onChange={(e) => setPortalForm((c) => ({ ...c, schoolName: e.target.value }))} placeholder="School name" />
                <Input value={portalForm.primaryColor} onChange={(e) => setPortalForm((c) => ({ ...c, primaryColor: e.target.value }))} placeholder="Primary color" />
                <Input value={portalForm.mascotLabel} onChange={(e) => setPortalForm((c) => ({ ...c, mascotLabel: e.target.value }))} placeholder="Mascot" />
                <Input value={websiteForm.siteTitle} onChange={(e) => setWebsiteForm((c) => ({ ...c, siteTitle: e.target.value }))} placeholder="Site title" />
                <Input value={websiteForm.heroMessage} onChange={(e) => setWebsiteForm((c) => ({ ...c, heroMessage: e.target.value }))} placeholder="Hero message" />
                <Input value={idForm.athleteName} onChange={(e) => setIdForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Athlete name" />
                <Input value={idForm.teamName} onChange={(e) => setIdForm((c) => ({ ...c, teamName: e.target.value }))} placeholder="Team name" />
                <Input value={idForm.cardNumber} onChange={(e) => setIdForm((c) => ({ ...c, cardNumber: e.target.value }))} placeholder="Card number" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createPortalTheme(portalForm), "Portal theme saved.", () => setPortalForm({ schoolName: "", primaryColor: "#0f172a", mascotLabel: "" }))} disabled={!portalForm.schoolName.trim()}>Save Portal Theme</Button>
                <Button variant="outline" onClick={() => void submit(() => createTeamWebsite({ teamId, ...websiteForm }), "Team website saved.", () => setWebsiteForm({ siteTitle: "", heroMessage: "" }))} disabled={!teamId || !websiteForm.siteTitle.trim()}>Save Team Website</Button>
                <Button variant="outline" onClick={() => void submit(() => createDigitalId(idForm), "Digital ID saved.", () => setIdForm({ athleteName: "", teamName: "", cardNumber: "" }))} disabled={!idForm.athleteName.trim()}>Save Digital ID</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function LeagueHubPage() {
  return (
    <AuthProvider>
      <LeagueHubContent />
    </AuthProvider>
  );
}
