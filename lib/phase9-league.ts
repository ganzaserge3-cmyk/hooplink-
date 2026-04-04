import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getOrganizationTeams, type TeamRecord } from "@/lib/teams";

type FirestoreTimestamp = { seconds?: number; nanoseconds?: number } | null;

export interface LeagueAdminRecord {
  id: string;
  leagueName: string;
  adminName: string;
  region: string;
  createdAt?: FirestoreTimestamp;
}

export interface DivisionStandingRecord {
  id: string;
  divisionName: string;
  teamName: string;
  wins: number;
  losses: number;
  createdAt?: FirestoreTimestamp;
}

export interface ScheduleBuilderRecord {
  id: string;
  seasonLabel: string;
  teamName: string;
  opponentName: string;
  dateLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface RefAssignmentRecord {
  id: string;
  gameLabel: string;
  refereeName: string;
  roleLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface ProtestSubmissionRecord {
  id: string;
  teamName: string;
  gameLabel: string;
  summary: string;
  status: "submitted" | "reviewing" | "resolved";
  createdAt?: FirestoreTimestamp;
}

export interface RulebookQuizRecord {
  id: string;
  title: string;
  questionCount: number;
  passingScore: number;
  createdAt?: FirestoreTimestamp;
}

export interface StaffCertificationRecord {
  id: string;
  staffName: string;
  certificationName: string;
  expiresOn: string;
  createdAt?: FirestoreTimestamp;
}

export interface OffseasonBoardRecord {
  id: string;
  teamId: string;
  title: string;
  focusArea: string;
  ownerName: string;
  createdAt?: FirestoreTimestamp;
}

export interface FreeAgentRecord {
  id: string;
  athleteName: string;
  sport: string;
  position: string;
  status: "available" | "contacted" | "signed";
  createdAt?: FirestoreTimestamp;
}

export interface CombineWorkflowRecord {
  id: string;
  athleteName: string;
  eventLabel: string;
  completedStations: number;
  totalStations: number;
  createdAt?: FirestoreTimestamp;
}

export interface BenchmarkRecord {
  id: string;
  metricName: string;
  sport: string;
  eliteValue: string;
  createdAt?: FirestoreTimestamp;
}

export interface ProspectRankingRecord {
  id: string;
  athleteName: string;
  rankValue: number;
  scoutName: string;
  createdAt?: FirestoreTimestamp;
}

export interface CommunityPollRecord {
  id: string;
  question: string;
  options: string[];
  createdAt?: FirestoreTimestamp;
}

export interface FanSurveyRecord {
  id: string;
  surveyTitle: string;
  responseCount: number;
  avgScore: number;
  createdAt?: FirestoreTimestamp;
}

export interface ForumThreadRecord {
  id: string;
  title: string;
  authorName: string;
  category: string;
  createdAt?: FirestoreTimestamp;
}

export interface TopicModeratorRecord {
  id: string;
  topicName: string;
  moderatorName: string;
  createdAt?: FirestoreTimestamp;
}

export interface PostingLimitRecord {
  id: string;
  reputationTier: string;
  dailyPostLimit: number;
  createdAt?: FirestoreTimestamp;
}

export interface PortalThemeRecord {
  id: string;
  schoolName: string;
  primaryColor: string;
  mascotLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface TeamWebsiteRecord {
  id: string;
  teamId: string;
  siteTitle: string;
  heroMessage: string;
  createdAt?: FirestoreTimestamp;
}

export interface DigitalIdCardRecord {
  id: string;
  athleteName: string;
  teamName: string;
  cardNumber: string;
  createdAt?: FirestoreTimestamp;
}

export interface LeagueHubSnapshot {
  leagueAdmins: LeagueAdminRecord[];
  standings: DivisionStandingRecord[];
  schedules: ScheduleBuilderRecord[];
  refAssignments: RefAssignmentRecord[];
  protests: ProtestSubmissionRecord[];
  quizzes: RulebookQuizRecord[];
  certifications: StaffCertificationRecord[];
  offseasonBoards: OffseasonBoardRecord[];
  freeAgents: FreeAgentRecord[];
  combineWorkflows: CombineWorkflowRecord[];
  benchmarks: BenchmarkRecord[];
  rankings: ProspectRankingRecord[];
  polls: CommunityPollRecord[];
  surveys: FanSurveyRecord[];
  forumThreads: ForumThreadRecord[];
  moderators: TopicModeratorRecord[];
  postingLimits: PostingLimitRecord[];
  portalThemes: PortalThemeRecord[];
  teamWebsites: TeamWebsiteRecord[];
  digitalIds: DigitalIdCardRecord[];
  teamOptions: Array<{ id: string; label: string }>;
}

function requireUser() {
  if (!auth?.currentUser || !db) throw new Error("You must be signed in.");
  return auth.currentUser;
}

function mapTimestamp(data: Record<string, unknown>, key: string) {
  return (data[key] as FirestoreTimestamp | undefined) ?? null;
}

async function getCollection<T>(name: string, mapper: (id: string, data: Record<string, unknown>) => T) {
  if (!db) return [] as T[];
  const snapshot = await getDocs(query(collection(db, name), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapper(docSnapshot.id, docSnapshot.data())
  );
}

async function createRecord(name: string, data: Record<string, unknown>) {
  const user = requireUser();
  await addDoc(collection(db!, name), {
    ownerId: user.uid,
    ownerName: user.displayName || user.email || "HoopLink User",
    ...data,
    createdAt: serverTimestamp(),
  });
}

export const createLeagueAdmin = (input: Omit<LeagueAdminRecord, "id" | "createdAt">) => createRecord("phase9LeagueAdmins", input);
export const createDivisionStanding = (input: Omit<DivisionStandingRecord, "id" | "createdAt">) => createRecord("phase9Standings", input);
export const createSeasonSchedule = (input: Omit<ScheduleBuilderRecord, "id" | "createdAt">) => createRecord("phase9Schedules", input);
export const createRefAssignment = (input: Omit<RefAssignmentRecord, "id" | "createdAt">) => createRecord("phase9RefAssignments", input);
export const createProtestSubmission = (input: Omit<ProtestSubmissionRecord, "id" | "createdAt">) => createRecord("phase9Protests", input);
export const createRulebookQuiz = (input: Omit<RulebookQuizRecord, "id" | "createdAt">) => createRecord("phase9Quizzes", input);
export const createStaffCertification = (input: Omit<StaffCertificationRecord, "id" | "createdAt">) => createRecord("phase9Certifications", input);
export const createOffseasonBoard = (input: Omit<OffseasonBoardRecord, "id" | "createdAt">) => createRecord("phase9OffseasonBoards", input);
export const createFreeAgent = (input: Omit<FreeAgentRecord, "id" | "createdAt">) => createRecord("phase9FreeAgents", input);
export const createCombineWorkflow = (input: Omit<CombineWorkflowRecord, "id" | "createdAt">) => createRecord("phase9Combine", input);
export const createBenchmark = (input: Omit<BenchmarkRecord, "id" | "createdAt">) => createRecord("phase9Benchmarks", input);
export const createProspectRanking = (input: Omit<ProspectRankingRecord, "id" | "createdAt">) => createRecord("phase9Rankings", input);
export const createCommunityPoll = (input: Omit<CommunityPollRecord, "id" | "createdAt">) => createRecord("phase9Polls", input);
export const createFanSurvey = (input: Omit<FanSurveyRecord, "id" | "createdAt">) => createRecord("phase9Surveys", input);
export const createForumThread = (input: Omit<ForumThreadRecord, "id" | "createdAt">) => createRecord("phase9ForumThreads", input);
export const createTopicModerator = (input: Omit<TopicModeratorRecord, "id" | "createdAt">) => createRecord("phase9Moderators", input);
export const createPostingLimit = (input: Omit<PostingLimitRecord, "id" | "createdAt">) => createRecord("phase9PostingLimits", input);
export const createPortalTheme = (input: Omit<PortalThemeRecord, "id" | "createdAt">) => createRecord("phase9PortalThemes", input);
export const createTeamWebsite = (input: Omit<TeamWebsiteRecord, "id" | "createdAt">) => createRecord("phase9TeamWebsites", input);
export const createDigitalId = (input: Omit<DigitalIdCardRecord, "id" | "createdAt">) => createRecord("phase9DigitalIds", input);

async function getTeamOptions() {
  const teams = await getOrganizationTeams().catch(() => [] as TeamRecord[]);
  return teams.map((team: TeamRecord) => ({
    id: team.id,
    label: [team.name, team.sport, team.location].filter(Boolean).join(" • "),
  }));
}

export async function getLeagueHubSnapshot(): Promise<LeagueHubSnapshot> {
  const [
    leagueAdmins,
    standings,
    schedules,
    refAssignments,
    protests,
    quizzes,
    certifications,
    offseasonBoards,
    freeAgents,
    combineWorkflows,
    benchmarks,
    rankings,
    polls,
    surveys,
    forumThreads,
    moderators,
    postingLimits,
    portalThemes,
    teamWebsites,
    digitalIds,
    teamOptions,
  ] = await Promise.all([
    getCollection("phase9LeagueAdmins", (id, data) => ({ id, leagueName: String(data.leagueName ?? ""), adminName: String(data.adminName ?? ""), region: String(data.region ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Standings", (id, data) => ({ id, divisionName: String(data.divisionName ?? ""), teamName: String(data.teamName ?? ""), wins: Number(data.wins ?? 0), losses: Number(data.losses ?? 0), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Schedules", (id, data) => ({ id, seasonLabel: String(data.seasonLabel ?? ""), teamName: String(data.teamName ?? ""), opponentName: String(data.opponentName ?? ""), dateLabel: String(data.dateLabel ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9RefAssignments", (id, data) => ({ id, gameLabel: String(data.gameLabel ?? ""), refereeName: String(data.refereeName ?? ""), roleLabel: String(data.roleLabel ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Protests", (id, data) => ({ id, teamName: String(data.teamName ?? ""), gameLabel: String(data.gameLabel ?? ""), summary: String(data.summary ?? ""), status: data.status === "reviewing" || data.status === "resolved" ? data.status : "submitted", createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Quizzes", (id, data) => ({ id, title: String(data.title ?? ""), questionCount: Number(data.questionCount ?? 0), passingScore: Number(data.passingScore ?? 0), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Certifications", (id, data) => ({ id, staffName: String(data.staffName ?? ""), certificationName: String(data.certificationName ?? ""), expiresOn: String(data.expiresOn ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9OffseasonBoards", (id, data) => ({ id, teamId: String(data.teamId ?? ""), title: String(data.title ?? ""), focusArea: String(data.focusArea ?? ""), ownerName: String(data.ownerName ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9FreeAgents", (id, data) => ({ id, athleteName: String(data.athleteName ?? ""), sport: String(data.sport ?? ""), position: String(data.position ?? ""), status: data.status === "contacted" || data.status === "signed" ? data.status : "available", createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Combine", (id, data) => ({ id, athleteName: String(data.athleteName ?? ""), eventLabel: String(data.eventLabel ?? ""), completedStations: Number(data.completedStations ?? 0), totalStations: Number(data.totalStations ?? 0), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Benchmarks", (id, data) => ({ id, metricName: String(data.metricName ?? ""), sport: String(data.sport ?? ""), eliteValue: String(data.eliteValue ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Rankings", (id, data) => ({ id, athleteName: String(data.athleteName ?? ""), rankValue: Number(data.rankValue ?? 0), scoutName: String(data.scoutName ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Polls", (id, data) => ({ id, question: String(data.question ?? ""), options: Array.isArray(data.options) ? data.options.map(String) : [], createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Surveys", (id, data) => ({ id, surveyTitle: String(data.surveyTitle ?? ""), responseCount: Number(data.responseCount ?? 0), avgScore: Number(data.avgScore ?? 0), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9ForumThreads", (id, data) => ({ id, title: String(data.title ?? ""), authorName: String(data.authorName ?? ""), category: String(data.category ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9Moderators", (id, data) => ({ id, topicName: String(data.topicName ?? ""), moderatorName: String(data.moderatorName ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9PostingLimits", (id, data) => ({ id, reputationTier: String(data.reputationTier ?? ""), dailyPostLimit: Number(data.dailyPostLimit ?? 0), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9PortalThemes", (id, data) => ({ id, schoolName: String(data.schoolName ?? ""), primaryColor: String(data.primaryColor ?? ""), mascotLabel: String(data.mascotLabel ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9TeamWebsites", (id, data) => ({ id, teamId: String(data.teamId ?? ""), siteTitle: String(data.siteTitle ?? ""), heroMessage: String(data.heroMessage ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getCollection("phase9DigitalIds", (id, data) => ({ id, athleteName: String(data.athleteName ?? ""), teamName: String(data.teamName ?? ""), cardNumber: String(data.cardNumber ?? ""), createdAt: mapTimestamp(data, "createdAt") })),
    getTeamOptions(),
  ]);

  return { leagueAdmins, standings, schedules, refAssignments, protests, quizzes, certifications, offseasonBoards, freeAgents, combineWorkflows, benchmarks, rankings, polls, surveys, forumThreads, moderators, postingLimits, portalThemes, teamWebsites, digitalIds, teamOptions };
}
