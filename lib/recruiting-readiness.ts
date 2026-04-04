import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { uploadToCloudinary } from "@/lib/cloudinary";
import { auth, db } from "@/lib/firebase";
import { getUserProfileById } from "@/lib/user-profile";

export interface RecruitingDeadlineRecord {
  id: string;
  title: string;
  dueDate: string;
  category: string;
}

export interface CollegeInterestRecord {
  id: string;
  schoolName: string;
  level: "low" | "medium" | "high";
  notes: string;
}

export interface CampusVisitRecord {
  id: string;
  schoolName: string;
  date: string;
  notes: string;
}

export interface RecommendationRequestRecord {
  id: string;
  coachName: string;
  coachEmail: string;
  status: "draft" | "sent" | "received";
  note: string;
}

export interface ReferenceLetterRecord {
  id: string;
  title: string;
  url: string;
  authorName: string;
}

export interface ScholarshipRecord {
  id: string;
  schoolName: string;
  amountLabel: string;
  status: "target" | "offered" | "accepted";
}

export interface OfferRecord {
  id: string;
  schoolName: string;
  level: string;
  packageLabel: string;
  status: "interested" | "offered" | "committed";
}

export interface ContactLogRecord {
  id: string;
  schoolName: string;
  contactName: string;
  channel: string;
  date: string;
  summary: string;
}

export interface OutreachTemplateRecord {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface FollowUpReminderRecord {
  id: string;
  schoolName: string;
  dueDate: string;
  note: string;
  done: boolean;
}

export interface TranscriptRecord {
  id: string;
  name: string;
  url: string;
}

export interface TestScoreRecord {
  id: string;
  label: string;
  score: string;
  date: string;
}

export interface CampHistoryRecord {
  id: string;
  campName: string;
  date: string;
  note: string;
}

export interface ScoutWatchlistRecord {
  id: string;
  scoutName: string;
  organization: string;
  status: "watching" | "contacted" | "active";
}

export interface PositionBenchmarkRecord {
  id: string;
  metric: string;
  current: string;
  target: string;
}

export interface CareerTimelineRecord {
  id: string;
  dateLabel: string;
  title: string;
  type: "milestone" | "visit" | "offer" | "camp" | "transfer" | "pro";
  note: string;
}

export interface RecruitingReadinessProfile {
  academic: {
    gpa: string;
    graduationYear: string;
    eligibilityStatus: string;
    transcriptUrl: string;
    transcriptName: string;
    academicSummary: string;
    testScores: TestScoreRecord[];
    transcriptVault: TranscriptRecord[];
  };
  compliance: {
    ncaaChecklist: Array<{ label: string; done: boolean }>;
    naiaChecklist: Array<{ label: string; done: boolean }>;
    internationalDocs: Array<{ label: string; done: boolean }>;
    visaChecklist: Array<{ label: string; done: boolean }>;
  };
  deadlines: RecruitingDeadlineRecord[];
  interests: CollegeInterestRecord[];
  campusVisits: CampusVisitRecord[];
  recommendationRequests: RecommendationRequestRecord[];
  referenceLetters: ReferenceLetterRecord[];
  scholarships: ScholarshipRecord[];
  offers: OfferRecord[];
  contacts: ContactLogRecord[];
  outreachTemplates: OutreachTemplateRecord[];
  followUps: FollowUpReminderRecord[];
  recruitingChecklist: Array<{ label: string; done: boolean }>;
  scoutWatchlist: ScoutWatchlistRecord[];
  campHistory: CampHistoryRecord[];
  profileVisitAlerts: Array<{ id: string; date: string; source: string }>;
  highlightReels: Array<{ id: string; title: string; summary: string; bestPlay: string }>;
  emailDrafts: Array<{ id: string; schoolName: string; subject: string; body: string }>;
  transferPortal: {
    targetSchools: string[];
    status: string;
    notes: string;
  };
  proPathway: {
    targetLeague: string;
    advisorNotes: string;
  };
  readiness: {
    agentChecklist: Array<{ label: string; done: boolean }>;
    nilChecklist: Array<{ label: string; done: boolean }>;
    profileAutoShareEnabled: boolean;
  };
  analytics: {
    recruiterEngagementScore: number;
    publicBoardEnabled: boolean;
    comparisonSummary: string;
  };
  positionBenchmarks: PositionBenchmarkRecord[];
  careerTimeline: CareerTimelineRecord[];
  schoolFitScoreCards: string[];
  coachResponseTracker: string[];
  recruiterCrm: string[];
  offerComparisonMatrix: string[];
  commitmentDecisionBoard: string[];
  campusVisitNotes: string[];
  callLogTracker: string[];
  ncaaComplianceNotes: string[];
  eligibilityDeadlineAlerts: string[];
  commitmentAnnouncementBuilder: string[];
  recruitingMediaPack: string[];
  schoolFavoritesList: string[];
  positionDepthTracker: string[];
  programNeedMatching: string[];
  geographicFitFilters: string[];
  academicFitScoring: string[];
  costCalculator: string[];
  scholarshipGapEstimator: string[];
  transferValueEstimate: string[];
  highlightScoringEngine: string[];
  visitPrepChecklist: string[];
  travelBudgetPlanner: string[];
  parentRecruitingView: string[];
  guardianDecisionBoard: string[];
  coachRecommendationVault: string[];
  recruiterNotesSection: string[];
  officialUnofficialVisitTracker: string[];
  offerTimelineGraph: string[];
  recruitingFunnelAnalytics: string[];
  scoutVisibilityScore: string[];
  videoWatchAnalytics: string[];
  positionComparisonCards: string[];
  careerDecisionJournal: string[];
  milestoneCelebrationCards: string[];
  proScoutBoard: string[];
  agentOutreachTemplates: string[];
  nilPartnerShortlist: string[];
  brandFitScore: string[];
  endorsementPacketBuilder: string[];
  transferAnnouncementPlanner: string[];
  signingDayToolkit: string[];
  commitmentCountdown: string[];
  schoolCommunicationTracker: string[];
  referenceRequestManager: string[];
  characterEndorsementSection: string[];
  academicAdvisorChat: string[];
  eligibilityDocumentVault: string[];
  prospectRankingTracker: string[];
  targetSchoolsLeaderboard: string[];
  recruitingHeatmapByState: string[];
  coachInterestBadges: string[];
  offerStatusLabels: string[];
  multiSportRecruitingMode: string[];
  injuryDisclosureNotes: string[];
  recoveryReadyBadge: string[];
  academicAwardsVault: string[];
  studentAthletePlanner: string[];
  degreeInterestSection: string[];
  internationalRecruitingHelp: string[];
  visaTravelNotes: string[];
  trialSessionBookings: string[];
  coachCallBookingLinks: string[];
  scoutInboxIntegration: string[];
  selfScoutReportBuilder: string[];
  recruitingAiAdvisor: string[];
  aiSchoolListBuilder: string[];
  aiHighlightReelNotes: string[];
  aiResumeReview: string[];
  recruitingOperationsHubNotes: string[];
}

const defaultProfile: RecruitingReadinessProfile = {
  academic: {
    gpa: "",
    graduationYear: "",
    eligibilityStatus: "",
    transcriptUrl: "",
    transcriptName: "",
    academicSummary: "",
    testScores: [],
    transcriptVault: [],
  },
  compliance: {
    ncaaChecklist: [
      { label: "Core course review", done: false },
      { label: "Eligibility center account", done: false },
      { label: "Test / academic records submitted", done: false },
    ],
    naiaChecklist: [
      { label: "PlayNAIA registration", done: false },
      { label: "Transcripts submitted", done: false },
      { label: "Eligibility review complete", done: false },
    ],
    internationalDocs: [
      { label: "Passport valid", done: false },
      { label: "Academic translation ready", done: false },
      { label: "International records verified", done: false },
    ],
    visaChecklist: [
      { label: "Visa document packet started", done: false },
      { label: "School support letter requested", done: false },
      { label: "Interview prep complete", done: false },
    ],
  },
  deadlines: [],
  interests: [],
  campusVisits: [],
  recommendationRequests: [],
  referenceLetters: [],
  scholarships: [],
  offers: [],
  contacts: [],
  outreachTemplates: [],
  followUps: [],
  recruitingChecklist: [
    { label: "Complete recruiting profile", done: false },
    { label: "Upload transcript and test scores", done: false },
    { label: "Build outreach template", done: false },
    { label: "Track first 10 target schools", done: false },
  ],
  scoutWatchlist: [],
  campHistory: [],
  profileVisitAlerts: [],
  highlightReels: [],
  emailDrafts: [],
  transferPortal: {
    targetSchools: [],
    status: "",
    notes: "",
  },
  proPathway: {
    targetLeague: "",
    advisorNotes: "",
  },
  readiness: {
    agentChecklist: [
      { label: "Build verified highlight reel", done: false },
      { label: "Organize references and resume", done: false },
      { label: "Document role projection", done: false },
    ],
    nilChecklist: [
      { label: "Prepare media kit", done: false },
      { label: "Define brand guidelines", done: false },
      { label: "Create sponsor intro deck", done: false },
    ],
    profileAutoShareEnabled: false,
  },
  analytics: {
    recruiterEngagementScore: 0,
    publicBoardEnabled: false,
    comparisonSummary: "",
  },
  positionBenchmarks: [],
  careerTimeline: [],
  schoolFitScoreCards: [],
  coachResponseTracker: [],
  recruiterCrm: [],
  offerComparisonMatrix: [],
  commitmentDecisionBoard: [],
  campusVisitNotes: [],
  callLogTracker: [],
  ncaaComplianceNotes: [],
  eligibilityDeadlineAlerts: [],
  commitmentAnnouncementBuilder: [],
  recruitingMediaPack: [],
  schoolFavoritesList: [],
  positionDepthTracker: [],
  programNeedMatching: [],
  geographicFitFilters: [],
  academicFitScoring: [],
  costCalculator: [],
  scholarshipGapEstimator: [],
  transferValueEstimate: [],
  highlightScoringEngine: [],
  visitPrepChecklist: [],
  travelBudgetPlanner: [],
  parentRecruitingView: [],
  guardianDecisionBoard: [],
  coachRecommendationVault: [],
  recruiterNotesSection: [],
  officialUnofficialVisitTracker: [],
  offerTimelineGraph: [],
  recruitingFunnelAnalytics: [],
  scoutVisibilityScore: [],
  videoWatchAnalytics: [],
  positionComparisonCards: [],
  careerDecisionJournal: [],
  milestoneCelebrationCards: [],
  proScoutBoard: [],
  agentOutreachTemplates: [],
  nilPartnerShortlist: [],
  brandFitScore: [],
  endorsementPacketBuilder: [],
  transferAnnouncementPlanner: [],
  signingDayToolkit: [],
  commitmentCountdown: [],
  schoolCommunicationTracker: [],
  referenceRequestManager: [],
  characterEndorsementSection: [],
  academicAdvisorChat: [],
  eligibilityDocumentVault: [],
  prospectRankingTracker: [],
  targetSchoolsLeaderboard: [],
  recruitingHeatmapByState: [],
  coachInterestBadges: [],
  offerStatusLabels: [],
  multiSportRecruitingMode: [],
  injuryDisclosureNotes: [],
  recoveryReadyBadge: [],
  academicAwardsVault: [],
  studentAthletePlanner: [],
  degreeInterestSection: [],
  internationalRecruitingHelp: [],
  visaTravelNotes: [],
  trialSessionBookings: [],
  coachCallBookingLinks: [],
  scoutInboxIntegration: [],
  selfScoutReportBuilder: [],
  recruitingAiAdvisor: [],
  aiSchoolListBuilder: [],
  aiHighlightReelNotes: [],
  aiResumeReview: [],
  recruitingOperationsHubNotes: [],
};

function requireAuth() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
}

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeChecklist(input: unknown, fallback: RecruitingReadinessProfile["compliance"]["ncaaChecklist"]) {
  if (!Array.isArray(input)) {
    return fallback;
  }
  return input.map((item) => {
    const record = (item as Record<string, unknown>) ?? {};
    return {
      label: String(record.label ?? ""),
      done: record.done === true,
    };
  });
}

function mapProfile(data: Record<string, unknown> | null | undefined): RecruitingReadinessProfile {
  const academic = (data?.academic as Record<string, unknown> | undefined) ?? {};
  const compliance = (data?.compliance as Record<string, unknown> | undefined) ?? {};
  const mapArray = <T>(value: unknown, mapper: (item: Record<string, unknown>) => T): T[] =>
    Array.isArray(value) ? value.map((item) => mapper((item as Record<string, unknown>) ?? {})) : [];

  return {
    academic: {
      gpa: String(academic.gpa ?? ""),
      graduationYear: String(academic.graduationYear ?? ""),
      eligibilityStatus: String(academic.eligibilityStatus ?? ""),
      transcriptUrl: String(academic.transcriptUrl ?? ""),
      transcriptName: String(academic.transcriptName ?? ""),
      academicSummary: String(academic.academicSummary ?? ""),
      testScores: mapArray(academic.testScores, (item) => ({
        id: String(item.id ?? randomId("test")),
        label: String(item.label ?? ""),
        score: String(item.score ?? ""),
        date: String(item.date ?? ""),
      })),
      transcriptVault: mapArray(academic.transcriptVault, (item) => ({
        id: String(item.id ?? randomId("transcript")),
        name: String(item.name ?? ""),
        url: String(item.url ?? ""),
      })),
    },
    compliance: {
      ncaaChecklist: normalizeChecklist(compliance.ncaaChecklist, defaultProfile.compliance.ncaaChecklist),
      naiaChecklist: normalizeChecklist(compliance.naiaChecklist, defaultProfile.compliance.naiaChecklist),
      internationalDocs: normalizeChecklist(compliance.internationalDocs, defaultProfile.compliance.internationalDocs),
      visaChecklist: normalizeChecklist(compliance.visaChecklist, defaultProfile.compliance.visaChecklist),
    },
    deadlines: mapArray(data?.deadlines, (item) => ({
      id: String(item.id ?? randomId("deadline")),
      title: String(item.title ?? ""),
      dueDate: String(item.dueDate ?? ""),
      category: String(item.category ?? ""),
    })),
    interests: mapArray(data?.interests, (item) => ({
      id: String(item.id ?? randomId("interest")),
      schoolName: String(item.schoolName ?? ""),
      level: item.level === "high" || item.level === "low" ? item.level : "medium",
      notes: String(item.notes ?? ""),
    })),
    campusVisits: mapArray(data?.campusVisits, (item) => ({
      id: String(item.id ?? randomId("visit")),
      schoolName: String(item.schoolName ?? ""),
      date: String(item.date ?? ""),
      notes: String(item.notes ?? ""),
    })),
    recommendationRequests: mapArray(data?.recommendationRequests, (item) => ({
      id: String(item.id ?? randomId("rec")),
      coachName: String(item.coachName ?? ""),
      coachEmail: String(item.coachEmail ?? ""),
      status: item.status === "sent" || item.status === "received" ? item.status : "draft",
      note: String(item.note ?? ""),
    })),
    referenceLetters: mapArray(data?.referenceLetters, (item) => ({
      id: String(item.id ?? randomId("ref")),
      title: String(item.title ?? ""),
      url: String(item.url ?? ""),
      authorName: String(item.authorName ?? ""),
    })),
    scholarships: mapArray(data?.scholarships, (item) => ({
      id: String(item.id ?? randomId("sch")),
      schoolName: String(item.schoolName ?? ""),
      amountLabel: String(item.amountLabel ?? ""),
      status: item.status === "offered" || item.status === "accepted" ? item.status : "target",
    })),
    offers: mapArray(data?.offers, (item) => ({
      id: String(item.id ?? randomId("offer")),
      schoolName: String(item.schoolName ?? ""),
      level: String(item.level ?? ""),
      packageLabel: String(item.packageLabel ?? ""),
      status: item.status === "offered" || item.status === "committed" ? item.status : "interested",
    })),
    contacts: mapArray(data?.contacts, (item) => ({
      id: String(item.id ?? randomId("contact")),
      schoolName: String(item.schoolName ?? ""),
      contactName: String(item.contactName ?? ""),
      channel: String(item.channel ?? ""),
      date: String(item.date ?? ""),
      summary: String(item.summary ?? ""),
    })),
    outreachTemplates: mapArray(data?.outreachTemplates, (item) => ({
      id: String(item.id ?? randomId("template")),
      name: String(item.name ?? ""),
      subject: String(item.subject ?? ""),
      body: String(item.body ?? ""),
    })),
    followUps: mapArray(data?.followUps, (item) => ({
      id: String(item.id ?? randomId("follow")),
      schoolName: String(item.schoolName ?? ""),
      dueDate: String(item.dueDate ?? ""),
      note: String(item.note ?? ""),
      done: item.done === true,
    })),
    recruitingChecklist: normalizeChecklist(data?.recruitingChecklist, defaultProfile.recruitingChecklist),
    scoutWatchlist: mapArray(data?.scoutWatchlist, (item) => ({
      id: String(item.id ?? randomId("scout")),
      scoutName: String(item.scoutName ?? ""),
      organization: String(item.organization ?? ""),
      status: item.status === "contacted" || item.status === "active" ? item.status : "watching",
    })),
    campHistory: mapArray(data?.campHistory, (item) => ({
      id: String(item.id ?? randomId("camp")),
      campName: String(item.campName ?? ""),
      date: String(item.date ?? ""),
      note: String(item.note ?? ""),
    })),
    profileVisitAlerts: mapArray(data?.profileVisitAlerts, (item) => ({
      id: String(item.id ?? randomId("visit-alert")),
      date: String(item.date ?? ""),
      source: String(item.source ?? ""),
    })),
    highlightReels: mapArray(data?.highlightReels, (item) => ({
      id: String(item.id ?? randomId("reel")),
      title: String(item.title ?? ""),
      summary: String(item.summary ?? ""),
      bestPlay: String(item.bestPlay ?? ""),
    })),
    emailDrafts: mapArray(data?.emailDrafts, (item) => ({
      id: String(item.id ?? randomId("email")),
      schoolName: String(item.schoolName ?? ""),
      subject: String(item.subject ?? ""),
      body: String(item.body ?? ""),
    })),
    transferPortal: {
      targetSchools: Array.isArray((data?.transferPortal as Record<string, unknown> | undefined)?.targetSchools)
        ? (((data?.transferPortal as Record<string, unknown>).targetSchools as string[]).map(String).filter(Boolean))
        : [],
      status: String((data?.transferPortal as Record<string, unknown> | undefined)?.status ?? ""),
      notes: String((data?.transferPortal as Record<string, unknown> | undefined)?.notes ?? ""),
    },
    proPathway: {
      targetLeague: String((data?.proPathway as Record<string, unknown> | undefined)?.targetLeague ?? ""),
      advisorNotes: String((data?.proPathway as Record<string, unknown> | undefined)?.advisorNotes ?? ""),
    },
    readiness: {
      agentChecklist: normalizeChecklist((data?.readiness as Record<string, unknown> | undefined)?.agentChecklist, defaultProfile.readiness.agentChecklist),
      nilChecklist: normalizeChecklist((data?.readiness as Record<string, unknown> | undefined)?.nilChecklist, defaultProfile.readiness.nilChecklist),
      profileAutoShareEnabled: ((data?.readiness as Record<string, unknown> | undefined)?.profileAutoShareEnabled) === true,
    },
    analytics: {
      recruiterEngagementScore: Number((data?.analytics as Record<string, unknown> | undefined)?.recruiterEngagementScore ?? 0),
      publicBoardEnabled: ((data?.analytics as Record<string, unknown> | undefined)?.publicBoardEnabled) === true,
      comparisonSummary: String((data?.analytics as Record<string, unknown> | undefined)?.comparisonSummary ?? ""),
    },
    positionBenchmarks: mapArray(data?.positionBenchmarks, (item) => ({
      id: String(item.id ?? randomId("benchmark")),
      metric: String(item.metric ?? ""),
      current: String(item.current ?? ""),
      target: String(item.target ?? ""),
    })),
    careerTimeline: mapArray(data?.careerTimeline, (item) => ({
      id: String(item.id ?? randomId("timeline")),
      dateLabel: String(item.dateLabel ?? ""),
      title: String(item.title ?? ""),
      type:
        item.type === "visit" || item.type === "offer" || item.type === "camp" || item.type === "transfer" || item.type === "pro"
          ? item.type
          : "milestone",
      note: String(item.note ?? ""),
    })),
    schoolFitScoreCards: mapArray(data?.schoolFitScoreCards, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    coachResponseTracker: mapArray(data?.coachResponseTracker, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    recruiterCrm: mapArray(data?.recruiterCrm, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    offerComparisonMatrix: mapArray(data?.offerComparisonMatrix, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    commitmentDecisionBoard: mapArray(data?.commitmentDecisionBoard, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    campusVisitNotes: mapArray(data?.campusVisitNotes, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    callLogTracker: mapArray(data?.callLogTracker, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    ncaaComplianceNotes: mapArray(data?.ncaaComplianceNotes, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    eligibilityDeadlineAlerts: mapArray(data?.eligibilityDeadlineAlerts, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    commitmentAnnouncementBuilder: mapArray(data?.commitmentAnnouncementBuilder, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    recruitingMediaPack: mapArray(data?.recruitingMediaPack, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    schoolFavoritesList: mapArray(data?.schoolFavoritesList, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    positionDepthTracker: mapArray(data?.positionDepthTracker, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    programNeedMatching: mapArray(data?.programNeedMatching, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    geographicFitFilters: mapArray(data?.geographicFitFilters, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    academicFitScoring: mapArray(data?.academicFitScoring, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    costCalculator: mapArray(data?.costCalculator, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    scholarshipGapEstimator: mapArray(data?.scholarshipGapEstimator, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    transferValueEstimate: mapArray(data?.transferValueEstimate, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    highlightScoringEngine: mapArray(data?.highlightScoringEngine, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    visitPrepChecklist: mapArray(data?.visitPrepChecklist, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    travelBudgetPlanner: mapArray(data?.travelBudgetPlanner, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    parentRecruitingView: mapArray(data?.parentRecruitingView, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    guardianDecisionBoard: mapArray(data?.guardianDecisionBoard, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    coachRecommendationVault: mapArray(data?.coachRecommendationVault, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    recruiterNotesSection: mapArray(data?.recruiterNotesSection, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    officialUnofficialVisitTracker: mapArray(data?.officialUnofficialVisitTracker, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    offerTimelineGraph: mapArray(data?.offerTimelineGraph, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    recruitingFunnelAnalytics: mapArray(data?.recruitingFunnelAnalytics, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    scoutVisibilityScore: mapArray(data?.scoutVisibilityScore, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    videoWatchAnalytics: mapArray(data?.videoWatchAnalytics, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    positionComparisonCards: mapArray(data?.positionComparisonCards, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    careerDecisionJournal: mapArray(data?.careerDecisionJournal, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    milestoneCelebrationCards: mapArray(data?.milestoneCelebrationCards, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    proScoutBoard: mapArray(data?.proScoutBoard, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    agentOutreachTemplates: mapArray(data?.agentOutreachTemplates, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    nilPartnerShortlist: mapArray(data?.nilPartnerShortlist, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    brandFitScore: mapArray(data?.brandFitScore, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    endorsementPacketBuilder: mapArray(data?.endorsementPacketBuilder, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    transferAnnouncementPlanner: mapArray(data?.transferAnnouncementPlanner, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    signingDayToolkit: mapArray(data?.signingDayToolkit, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    commitmentCountdown: mapArray(data?.commitmentCountdown, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    schoolCommunicationTracker: mapArray(data?.schoolCommunicationTracker, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    referenceRequestManager: mapArray(data?.referenceRequestManager, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    characterEndorsementSection: mapArray(data?.characterEndorsementSection, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    academicAdvisorChat: mapArray(data?.academicAdvisorChat, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    eligibilityDocumentVault: mapArray(data?.eligibilityDocumentVault, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    prospectRankingTracker: mapArray(data?.prospectRankingTracker, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    targetSchoolsLeaderboard: mapArray(data?.targetSchoolsLeaderboard, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    recruitingHeatmapByState: mapArray(data?.recruitingHeatmapByState, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    coachInterestBadges: mapArray(data?.coachInterestBadges, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    offerStatusLabels: mapArray(data?.offerStatusLabels, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    multiSportRecruitingMode: mapArray(data?.multiSportRecruitingMode, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    injuryDisclosureNotes: mapArray(data?.injuryDisclosureNotes, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    recoveryReadyBadge: mapArray(data?.recoveryReadyBadge, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    academicAwardsVault: mapArray(data?.academicAwardsVault, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    studentAthletePlanner: mapArray(data?.studentAthletePlanner, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    degreeInterestSection: mapArray(data?.degreeInterestSection, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    internationalRecruitingHelp: mapArray(data?.internationalRecruitingHelp, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    visaTravelNotes: mapArray(data?.visaTravelNotes, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    trialSessionBookings: mapArray(data?.trialSessionBookings, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    coachCallBookingLinks: mapArray(data?.coachCallBookingLinks, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    scoutInboxIntegration: mapArray(data?.scoutInboxIntegration, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    selfScoutReportBuilder: mapArray(data?.selfScoutReportBuilder, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    recruitingAiAdvisor: mapArray(data?.recruitingAiAdvisor, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    aiSchoolListBuilder: mapArray(data?.aiSchoolListBuilder, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    aiHighlightReelNotes: mapArray(data?.aiHighlightReelNotes, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    aiResumeReview: mapArray(data?.aiResumeReview, (item) => String(item.value ?? item.label ?? item.note ?? "")),
    recruitingOperationsHubNotes: mapArray(data?.recruitingOperationsHubNotes, (item) => String(item.value ?? item.label ?? item.note ?? "")),
  };
}

export async function getCurrentRecruitingReadiness() {
  requireAuth();
  const snapshot = await getDoc(doc(db!, "recruitingReadiness", auth!.currentUser!.uid));
  return snapshot.exists() ? mapProfile(snapshot.data() as Record<string, unknown>) : defaultProfile;
}

export async function saveCurrentRecruitingReadiness(profile: RecruitingReadinessProfile) {
  requireAuth();
  await setDoc(
    doc(db!, "recruitingReadiness", auth!.currentUser!.uid),
    {
      ...profile,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function uploadTranscript(file: File, title: string) {
  requireAuth();
  const upload = await uploadToCloudinary(file, `hooplink/recruiting/transcripts/${auth!.currentUser!.uid}`);
  const current = await getCurrentRecruitingReadiness();
  current.academic.transcriptUrl = upload.url;
  current.academic.transcriptName = title.trim() || file.name;
  current.academic.transcriptVault.unshift({
    id: randomId("transcript"),
    name: title.trim() || file.name,
    url: upload.url,
  });
  await saveCurrentRecruitingReadiness(current);
}

export async function addReferenceLetter(file: File, title: string, authorName: string) {
  requireAuth();
  const upload = await uploadToCloudinary(file, `hooplink/recruiting/references/${auth!.currentUser!.uid}`);
  const current = await getCurrentRecruitingReadiness();
  current.referenceLetters.unshift({
    id: randomId("ref"),
    title: title.trim() || file.name,
    url: upload.url,
    authorName: authorName.trim(),
  });
  await saveCurrentRecruitingReadiness(current);
}

export async function addRecruitingCollectionItem<
  K extends
    | "deadlines"
    | "interests"
    | "campusVisits"
    | "recommendationRequests"
    | "scholarships"
    | "offers"
    | "contacts"
    | "outreachTemplates"
    | "followUps"
    | "scoutWatchlist"
    | "campHistory"
    | "profileVisitAlerts"
    | "highlightReels"
    | "emailDrafts"
    | "positionBenchmarks"
    | "careerTimeline"
>(key: K, item: RecruitingReadinessProfile[K][number]) {
  requireAuth();
  const current = await getCurrentRecruitingReadiness();
  (current[key] as Array<unknown>).unshift(item);
  await saveCurrentRecruitingReadiness(current);
}

export async function addAcademicTestScore(input: TestScoreRecord) {
  requireAuth();
  const current = await getCurrentRecruitingReadiness();
  current.academic.testScores.unshift(input);
  await saveCurrentRecruitingReadiness(current);
}

export async function updateRecruitingChecklist(
  key: keyof RecruitingReadinessProfile["compliance"],
  index: number,
  done: boolean
) {
  requireAuth();
  const current = await getCurrentRecruitingReadiness();
  const nextChecklist = [...current.compliance[key]];
  nextChecklist[index] = { ...nextChecklist[index], done };
  current.compliance[key] = nextChecklist;
  await saveCurrentRecruitingReadiness(current);
}

export async function updateSimpleChecklist(
  key: "recruitingChecklist" | "agentChecklist" | "nilChecklist",
  index: number,
  done: boolean
) {
  requireAuth();
  const current = await getCurrentRecruitingReadiness();
  if (key === "recruitingChecklist") {
    const nextChecklist = [...current.recruitingChecklist];
    nextChecklist[index] = { ...nextChecklist[index], done };
    current.recruitingChecklist = nextChecklist;
  } else if (key === "agentChecklist") {
    const nextChecklist = [...current.readiness.agentChecklist];
    nextChecklist[index] = { ...nextChecklist[index], done };
    current.readiness.agentChecklist = nextChecklist;
  } else {
    const nextChecklist = [...current.readiness.nilChecklist];
    nextChecklist[index] = { ...nextChecklist[index], done };
    current.readiness.nilChecklist = nextChecklist;
  }
  await saveCurrentRecruitingReadiness(current);
}

export function getRecruitingReadinessScore(profile: RecruitingReadinessProfile) {
  const checklistDone =
    profile.recruitingChecklist.filter((item) => item.done).length +
    profile.compliance.ncaaChecklist.filter((item) => item.done).length +
    profile.compliance.naiaChecklist.filter((item) => item.done).length;
  const totalChecklist =
    profile.recruitingChecklist.length +
    profile.compliance.ncaaChecklist.length +
    profile.compliance.naiaChecklist.length;
  const academicsBoost = profile.academic.gpa ? 10 : 0;
  const outreachBoost = Math.min(profile.contacts.length * 3, 15);
  const docsBoost = profile.academic.transcriptUrl ? 10 : 0;
  const offersBoost = Math.min(profile.offers.length * 5, 20);
  return Math.min(100, Math.round((checklistDone / Math.max(totalChecklist, 1)) * 45 + academicsBoost + outreachBoost + docsBoost + offersBoost));
}

export function getRecruiterEngagementScore(profile: RecruitingReadinessProfile) {
  return Math.min(
    100,
    profile.contacts.length * 8 +
      profile.followUps.filter((item) => item.done).length * 5 +
      profile.profileVisitAlerts.length * 4 +
      profile.offers.length * 10
  );
}

export async function updateFollowUpStatus(followUpId: string, done: boolean) {
  requireAuth();
  const current = await getCurrentRecruitingReadiness();
  current.followUps = current.followUps.map((item) =>
    item.id === followUpId ? { ...item, done } : item
  );
  await saveCurrentRecruitingReadiness(current);
}

export async function getPublicResumeData(uid: string) {
  if (!db) {
    return null;
  }
  const [profile, readinessSnapshot] = await Promise.all([
    getUserProfileById(uid),
    getDoc(doc(db, "recruitingReadiness", uid)),
  ]);
  return {
    profile,
    readiness: readinessSnapshot.exists()
      ? mapProfile(readinessSnapshot.data() as Record<string, unknown>)
      : defaultProfile,
  };
}

export function getRecruitingInterestHeatmap(profile: RecruitingReadinessProfile) {
  return profile.interests
    .map((item) => ({
      schoolName: item.schoolName,
      score: item.level === "high" ? 3 : item.level === "medium" ? 2 : 1,
      notes: item.notes,
    }))
    .sort((left, right) => right.score - left.score);
}

export function getSchoolFitScores(
  profile: RecruitingReadinessProfile,
  athleteProfile: Record<string, unknown> | null | undefined
) {
  const stats = ((athleteProfile?.stats as Record<string, unknown> | undefined) ?? {});
  const points = Number(stats.pointsPerGame ?? 0);
  const assists = Number(stats.assistsPerGame ?? 0);
  const rebounds = Number(stats.reboundsPerGame ?? 0);
  return profile.interests.map((school) => {
    const fitScore =
      (school.level === "high" ? 70 : school.level === "medium" ? 55 : 40) +
      Math.min(points * 2, 10) +
      Math.min(assists + rebounds, 10);
    return {
      schoolName: school.schoolName,
      fitScore: Math.min(99, Math.round(fitScore)),
      notes: school.notes,
    };
  });
}

export async function generateRecruitingFitSummary(input: {
  schoolName: string;
  athleteBio: string;
  sport: string;
  position: string;
  achievements: string[];
}) {
  const fallback = `${input.schoolName} fit looks strongest when you position yourself as a ${input.position || input.sport} with clear role value, verified academics, and recent achievement proof. Lead with one stat, one impact clip, and one reason that school matches your long-term development path.`;

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: "You write concise recruiting fit summaries for student-athletes." }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `School: ${input.schoolName}\nSport: ${input.sport}\nPosition: ${input.position}\nBio: ${input.athleteBio}\nAchievements: ${input.achievements.join(", ") || "None"}\n\nWrite 2-3 sentences on recruiting fit and what the athlete should emphasize.`,
              },
            ],
          },
        ],
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { output_text?: string };
    return data.output_text || fallback;
  } catch {
    return fallback;
  }
}

export async function getSchoolResumeIndex() {
  if (!db) {
    return [];
  }
  const snapshot = await getDocs(query(collection(db, "recruitingReadiness"), limit(100)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => ({
    uid: docSnapshot.id,
    readiness: mapProfile(docSnapshot.data() as Record<string, unknown>),
  }));
}
