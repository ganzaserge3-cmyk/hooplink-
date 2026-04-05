import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createNotification } from "@/lib/notifications";

export interface TeamMember {
  uid: string;
  role: "owner" | "admin" | "coach" | "captain" | "player";
  displayName: string;
  orgPermissions?: Array<"manage_roster" | "manage_events" | "manage_content" | "manage_recruiting">;
}

export interface TeamRecord {
  id: string;
  ownerId: string;
  adminIds: string[];
  name: string;
  sport: string;
  location: string;
  bio: string;
  memberIds: string[];
  members: TeamMember[];
  announcement?: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  inviterId: string;
  inviteeUid: string;
  role: TeamMember["role"];
  status: "pending" | "accepted" | "declined";
}

export interface TeamEvent {
  id: string;
  teamId: string;
  title: string;
  date: string;
  location: string;
  type: "practice" | "game" | "meeting" | "tryout";
  rsvpBy?: Record<string, "going" | "maybe" | "not_going">;
  remindersSentAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface TeamTryout {
  id: string;
  teamId: string;
  name: string;
  position: string;
  message: string;
  status: "pending" | "reviewed";
}

export interface TeamPost {
  id: string;
  teamId: string;
  authorId: string;
  content: string;
  type: "announcement" | "feed";
  pinned?: boolean;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface TeamChatRoom {
  id: string;
  teamId: string;
  name: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface TeamChatMessage {
  id: string;
  roomId: string;
  teamId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface TeamAttendanceRecord {
  id: string;
  teamId: string;
  eventId: string;
  memberUid: string;
  memberName: string;
  status: "present" | "late" | "absent";
}

export interface CoachFeedbackRecord {
  id: string;
  teamId: string;
  postId: string;
  athleteUid: string;
  coachUid: string;
  coachName: string;
  feedback: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface TeamGalleryItem {
  id: string;
  teamId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string;
}

export interface StaffNoteRecord {
  id: string;
  teamId: string;
  memberUid: string;
  authorUid: string;
  authorName: string;
  note: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface TeamWorkspaceRecord {
  teamId: string;
  inviteCode: string;
  parentAccessEnabled: boolean;
  codeOfConduct: string;
  brandingKit: {
    primaryColor: string;
    secondaryColor: string;
    slogan: string;
    logoUrl: string;
  };
  merchLinks: string[];
  fundraisingPage: string;
  teamFundraiserDonorLeaderboard: string[];
  sponsorWall: Array<{ name: string; tier: string; link: string }>;
  statSummary: Array<{ label: string; value: string }>;
  goals: Array<{ id: string; title: string; progress: number }>;
  polls: Array<{ id: string; question: string; options: string[]; createdAt?: { seconds?: number; nanoseconds?: number } | null }>;
  tasks: Array<{ id: string; title: string; status: "todo" | "doing" | "done"; owner: string }>;
  travelBoard: Array<{ id: string; title: string; date: string; location: string; details: string }>;
  fileVault: Array<{ id: string; title: string; link: string; category: string }>;
  wellnessCheckIns: Array<{ id: string; memberName: string; status: "green" | "yellow" | "red"; note: string }>;
  scoutingReports: Array<{ id: string; opponent: string; summary: string; priority: string }>;
  opponentNotes: Array<{ id: string; opponent: string; note: string }>;
  depthChart: Array<{ id: string; position: string; starter: string; backup: string }>;
  leaderboard: Array<{ id: string; label: string; leader: string; value: string }>;
  chemistryActivities: Array<{ id: string; title: string; format: string; details: string }>;
  archiveHistory: Array<{ id: string; season: string; achievement: string; note: string }>;
  budgetTracker: string[];
  finesLedger: string[];
  waiverForms: string[];
  parentChatChannels: string[];
  staffOnlyBoard: string[];
  injuryReportBoard: string[];
  availabilityBoard: string[];
  playerAvailabilityAutoSync: string[];
  teamParentPaymentTracker: string[];
  transportationPlanner: string[];
  mealPlanBoard: string[];
  teamMealOrderPlanner: string[];
  hotelAssignmentBoard: string[];
  mediaDayPlanner: string[];
  mediaDayShotListPlanner: string[];
  seasonMilestonesBoard: string[];
  trainingCampPlanner: string[];
  drillAssignmentBoard: string[];
  academicsTracker: string[];
  studyHallBoard: string[];
  eligibilityTracker: string[];
  seasonAwardsTracker: string[];
  contractVault: string[];
  registrationForms: string[];
  volunteerBoard: string[];
  teamVolunteerShiftScheduler: string[];
  parentPickupAuthorizationBoard: string[];
  teamEquipmentCheckoutTracker: string[];
  boosterClubPage: string;
  parentDonationPage: string;
  teamSeatReservations: string[];
  busSeatingPlan: string[];
  teamCheckInScanner: string;
  homeAwayLogistics: string[];
  sponsorProposals: string[];
  teamWebsiteEmbed: string;
  teamSocialScheduler: string[];
  mediaRequestBoard: string[];
  athleteReleaseApprovals: string[];
  teamPayrollTools: string[];
  teamComplianceTracker: string[];
  ageGroupManagement: string[];
  multipleSquads: string[];
  tryoutEvaluations: string[];
  playerGradingMatrix: string[];
  staffFeedbackForms: string[];
  recognitionBadges: string[];
  traditionsBoard: string[];
  alumniNetworkBoard: string[];
  recruitmentNeedsBoard: string[];
  captainElections: string[];
  practiceAgendaBuilder: string[];
  matchPreparationChecklist: string[];
  postGameRecapBoard: string[];
  filmReviewRoom: string;
  coachPlayerOneOnOneMeetingNotes: string[];
  teamIssueReporting: string[];
  playerDevelopmentPlans: string[];
  sharedBenchmarks: string[];
  teamHydrationLogs: string[];
  teamSleepLogs: string[];
  recoveryRoomScheduling: string[];
  rotationPlanner: string[];
  positionGroupChannels: string[];
  staffMeetingRoom: string;
  parentOfficeHours: string;
  teamHallOfFame: string[];
  scholarshipBoard: string[];
  teamSponsorshipInventory: string[];
  teamSponsorRenewalPipeline: string[];
  seasonalBudgetForecast: string[];
  teamAiAssistantNotes: string[];
}

function isMissingIndexError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  const message = "message" in error ? String(error.message ?? "") : "";
  return code === "failed-precondition" && message.toLowerCase().includes("requires an index");
}

function compareCreatedAtDescending<
  T extends {
    createdAt?: { seconds?: number; nanoseconds?: number } | null;
  },
>(left: T, right: T) {
  const leftSeconds = left.createdAt?.seconds ?? 0;
  const rightSeconds = right.createdAt?.seconds ?? 0;
  if (leftSeconds !== rightSeconds) {
    return rightSeconds - leftSeconds;
  }

  const leftNanos = left.createdAt?.nanoseconds ?? 0;
  const rightNanos = right.createdAt?.nanoseconds ?? 0;
  return rightNanos - leftNanos;
}

function compareCreatedAtAscending<
  T extends {
    createdAt?: { seconds?: number; nanoseconds?: number } | null;
  },
>(left: T, right: T) {
  return compareCreatedAtDescending(right, left);
}

function createDefaultWorkspace(teamId: string): TeamWorkspaceRecord {
  return {
    teamId,
    inviteCode: teamId.slice(0, 8).toUpperCase(),
    parentAccessEnabled: false,
    codeOfConduct: "",
    brandingKit: {
      primaryColor: "#111827",
      secondaryColor: "#f97316",
      slogan: "",
      logoUrl: "",
    },
    merchLinks: [],
    fundraisingPage: "",
    teamFundraiserDonorLeaderboard: [],
    sponsorWall: [],
    statSummary: [],
    goals: [],
    polls: [],
    tasks: [],
    travelBoard: [],
    fileVault: [],
    wellnessCheckIns: [],
    scoutingReports: [],
    opponentNotes: [],
    depthChart: [],
    leaderboard: [],
    chemistryActivities: [],
    archiveHistory: [],
    budgetTracker: [],
    finesLedger: [],
    waiverForms: [],
    parentChatChannels: [],
    staffOnlyBoard: [],
    injuryReportBoard: [],
    availabilityBoard: [],
    playerAvailabilityAutoSync: [],
    teamParentPaymentTracker: [],
    transportationPlanner: [],
    mealPlanBoard: [],
    teamMealOrderPlanner: [],
    hotelAssignmentBoard: [],
    mediaDayPlanner: [],
    mediaDayShotListPlanner: [],
    seasonMilestonesBoard: [],
    trainingCampPlanner: [],
    drillAssignmentBoard: [],
    academicsTracker: [],
    studyHallBoard: [],
    eligibilityTracker: [],
    seasonAwardsTracker: [],
    contractVault: [],
    registrationForms: [],
    volunteerBoard: [],
    teamVolunteerShiftScheduler: [],
    parentPickupAuthorizationBoard: [],
    teamEquipmentCheckoutTracker: [],
    boosterClubPage: "",
    parentDonationPage: "",
    teamSeatReservations: [],
    busSeatingPlan: [],
    teamCheckInScanner: "",
    homeAwayLogistics: [],
    sponsorProposals: [],
    teamWebsiteEmbed: "",
    teamSocialScheduler: [],
    mediaRequestBoard: [],
    athleteReleaseApprovals: [],
    teamPayrollTools: [],
    teamComplianceTracker: [],
    ageGroupManagement: [],
    multipleSquads: [],
    tryoutEvaluations: [],
    playerGradingMatrix: [],
    staffFeedbackForms: [],
    recognitionBadges: [],
    traditionsBoard: [],
    alumniNetworkBoard: [],
    recruitmentNeedsBoard: [],
    captainElections: [],
    practiceAgendaBuilder: [],
    matchPreparationChecklist: [],
    postGameRecapBoard: [],
    filmReviewRoom: "",
    coachPlayerOneOnOneMeetingNotes: [],
    teamIssueReporting: [],
    playerDevelopmentPlans: [],
    sharedBenchmarks: [],
    teamHydrationLogs: [],
    teamSleepLogs: [],
    recoveryRoomScheduling: [],
    rotationPlanner: [],
    positionGroupChannels: [],
    staffMeetingRoom: "",
    parentOfficeHours: "",
    teamHallOfFame: [],
    scholarshipBoard: [],
    teamSponsorshipInventory: [],
    teamSponsorRenewalPipeline: [],
    seasonalBudgetForecast: [],
    teamAiAssistantNotes: [],
  };
}

function mapWorkspace(teamId: string, data: Record<string, unknown>): TeamWorkspaceRecord {
  const fallback = createDefaultWorkspace(teamId);
  return {
    teamId,
    inviteCode: String(data.inviteCode ?? fallback.inviteCode),
    parentAccessEnabled: data.parentAccessEnabled === true,
    codeOfConduct: String(data.codeOfConduct ?? ""),
    brandingKit: {
      primaryColor: String((data.brandingKit as Record<string, unknown> | undefined)?.primaryColor ?? fallback.brandingKit.primaryColor),
      secondaryColor: String((data.brandingKit as Record<string, unknown> | undefined)?.secondaryColor ?? fallback.brandingKit.secondaryColor),
      slogan: String((data.brandingKit as Record<string, unknown> | undefined)?.slogan ?? ""),
      logoUrl: String((data.brandingKit as Record<string, unknown> | undefined)?.logoUrl ?? ""),
    },
    merchLinks: Array.isArray(data.merchLinks) ? (data.merchLinks as string[]).map(String).filter(Boolean) : [],
    fundraisingPage: String(data.fundraisingPage ?? ""),
    teamFundraiserDonorLeaderboard: Array.isArray(data.teamFundraiserDonorLeaderboard) ? (data.teamFundraiserDonorLeaderboard as string[]).map(String).filter(Boolean) : [],
    sponsorWall: Array.isArray(data.sponsorWall)
      ? (data.sponsorWall as Array<Record<string, unknown>>).map((item, index) => ({
          name: String(item.name ?? `Sponsor ${index + 1}`),
          tier: String(item.tier ?? "Supporter"),
          link: String(item.link ?? ""),
        }))
      : [],
    statSummary: Array.isArray(data.statSummary)
      ? (data.statSummary as Array<Record<string, unknown>>).map((item) => ({
          label: String(item.label ?? ""),
          value: String(item.value ?? ""),
        }))
      : [],
    goals: Array.isArray(data.goals)
      ? (data.goals as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `goal-${index + 1}`),
          title: String(item.title ?? ""),
          progress: Number(item.progress ?? 0),
        }))
      : [],
    polls: Array.isArray(data.polls)
      ? (data.polls as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `poll-${index + 1}`),
          question: String(item.question ?? ""),
          options: Array.isArray(item.options) ? (item.options as string[]).map(String).filter(Boolean) : [],
          createdAt: (item.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
        }))
      : [],
    tasks: Array.isArray(data.tasks)
      ? (data.tasks as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `task-${index + 1}`),
          title: String(item.title ?? ""),
          status: item.status === "doing" || item.status === "done" ? item.status : "todo",
          owner: String(item.owner ?? ""),
        }))
      : [],
    travelBoard: Array.isArray(data.travelBoard)
      ? (data.travelBoard as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `travel-${index + 1}`),
          title: String(item.title ?? ""),
          date: String(item.date ?? ""),
          location: String(item.location ?? ""),
          details: String(item.details ?? ""),
        }))
      : [],
    fileVault: Array.isArray(data.fileVault)
      ? (data.fileVault as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `file-${index + 1}`),
          title: String(item.title ?? ""),
          link: String(item.link ?? ""),
          category: String(item.category ?? ""),
        }))
      : [],
    wellnessCheckIns: Array.isArray(data.wellnessCheckIns)
      ? (data.wellnessCheckIns as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `wellness-${index + 1}`),
          memberName: String(item.memberName ?? ""),
          status: item.status === "yellow" || item.status === "red" ? item.status : "green",
          note: String(item.note ?? ""),
        }))
      : [],
    scoutingReports: Array.isArray(data.scoutingReports)
      ? (data.scoutingReports as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `scouting-${index + 1}`),
          opponent: String(item.opponent ?? ""),
          summary: String(item.summary ?? ""),
          priority: String(item.priority ?? "normal"),
        }))
      : [],
    opponentNotes: Array.isArray(data.opponentNotes)
      ? (data.opponentNotes as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `note-${index + 1}`),
          opponent: String(item.opponent ?? ""),
          note: String(item.note ?? ""),
        }))
      : [],
    depthChart: Array.isArray(data.depthChart)
      ? (data.depthChart as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `depth-${index + 1}`),
          position: String(item.position ?? ""),
          starter: String(item.starter ?? ""),
          backup: String(item.backup ?? ""),
        }))
      : [],
    leaderboard: Array.isArray(data.leaderboard)
      ? (data.leaderboard as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `leader-${index + 1}`),
          label: String(item.label ?? ""),
          leader: String(item.leader ?? ""),
          value: String(item.value ?? ""),
        }))
      : [],
    chemistryActivities: Array.isArray(data.chemistryActivities)
      ? (data.chemistryActivities as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `chemistry-${index + 1}`),
          title: String(item.title ?? ""),
          format: String(item.format ?? ""),
          details: String(item.details ?? ""),
        }))
      : [],
    archiveHistory: Array.isArray(data.archiveHistory)
      ? (data.archiveHistory as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `archive-${index + 1}`),
          season: String(item.season ?? ""),
          achievement: String(item.achievement ?? ""),
          note: String(item.note ?? ""),
        }))
      : [],
    budgetTracker: Array.isArray(data.budgetTracker) ? (data.budgetTracker as string[]).map(String).filter(Boolean) : [],
    finesLedger: Array.isArray(data.finesLedger) ? (data.finesLedger as string[]).map(String).filter(Boolean) : [],
    waiverForms: Array.isArray(data.waiverForms) ? (data.waiverForms as string[]).map(String).filter(Boolean) : [],
    parentChatChannels: Array.isArray(data.parentChatChannels) ? (data.parentChatChannels as string[]).map(String).filter(Boolean) : [],
    staffOnlyBoard: Array.isArray(data.staffOnlyBoard) ? (data.staffOnlyBoard as string[]).map(String).filter(Boolean) : [],
    injuryReportBoard: Array.isArray(data.injuryReportBoard) ? (data.injuryReportBoard as string[]).map(String).filter(Boolean) : [],
    availabilityBoard: Array.isArray(data.availabilityBoard) ? (data.availabilityBoard as string[]).map(String).filter(Boolean) : [],
    playerAvailabilityAutoSync: Array.isArray(data.playerAvailabilityAutoSync) ? (data.playerAvailabilityAutoSync as string[]).map(String).filter(Boolean) : [],
    teamParentPaymentTracker: Array.isArray(data.teamParentPaymentTracker) ? (data.teamParentPaymentTracker as string[]).map(String).filter(Boolean) : [],
    transportationPlanner: Array.isArray(data.transportationPlanner) ? (data.transportationPlanner as string[]).map(String).filter(Boolean) : [],
    mealPlanBoard: Array.isArray(data.mealPlanBoard) ? (data.mealPlanBoard as string[]).map(String).filter(Boolean) : [],
    teamMealOrderPlanner: Array.isArray(data.teamMealOrderPlanner) ? (data.teamMealOrderPlanner as string[]).map(String).filter(Boolean) : [],
    hotelAssignmentBoard: Array.isArray(data.hotelAssignmentBoard) ? (data.hotelAssignmentBoard as string[]).map(String).filter(Boolean) : [],
    mediaDayPlanner: Array.isArray(data.mediaDayPlanner) ? (data.mediaDayPlanner as string[]).map(String).filter(Boolean) : [],
    mediaDayShotListPlanner: Array.isArray(data.mediaDayShotListPlanner) ? (data.mediaDayShotListPlanner as string[]).map(String).filter(Boolean) : [],
    seasonMilestonesBoard: Array.isArray(data.seasonMilestonesBoard) ? (data.seasonMilestonesBoard as string[]).map(String).filter(Boolean) : [],
    trainingCampPlanner: Array.isArray(data.trainingCampPlanner) ? (data.trainingCampPlanner as string[]).map(String).filter(Boolean) : [],
    drillAssignmentBoard: Array.isArray(data.drillAssignmentBoard) ? (data.drillAssignmentBoard as string[]).map(String).filter(Boolean) : [],
    academicsTracker: Array.isArray(data.academicsTracker) ? (data.academicsTracker as string[]).map(String).filter(Boolean) : [],
    studyHallBoard: Array.isArray(data.studyHallBoard) ? (data.studyHallBoard as string[]).map(String).filter(Boolean) : [],
    eligibilityTracker: Array.isArray(data.eligibilityTracker) ? (data.eligibilityTracker as string[]).map(String).filter(Boolean) : [],
    seasonAwardsTracker: Array.isArray(data.seasonAwardsTracker) ? (data.seasonAwardsTracker as string[]).map(String).filter(Boolean) : [],
    contractVault: Array.isArray(data.contractVault) ? (data.contractVault as string[]).map(String).filter(Boolean) : [],
    registrationForms: Array.isArray(data.registrationForms) ? (data.registrationForms as string[]).map(String).filter(Boolean) : [],
    volunteerBoard: Array.isArray(data.volunteerBoard) ? (data.volunteerBoard as string[]).map(String).filter(Boolean) : [],
    teamVolunteerShiftScheduler: Array.isArray(data.teamVolunteerShiftScheduler) ? (data.teamVolunteerShiftScheduler as string[]).map(String).filter(Boolean) : [],
    parentPickupAuthorizationBoard: Array.isArray(data.parentPickupAuthorizationBoard) ? (data.parentPickupAuthorizationBoard as string[]).map(String).filter(Boolean) : [],
    teamEquipmentCheckoutTracker: Array.isArray(data.teamEquipmentCheckoutTracker) ? (data.teamEquipmentCheckoutTracker as string[]).map(String).filter(Boolean) : [],
    boosterClubPage: String(data.boosterClubPage ?? ""),
    parentDonationPage: String(data.parentDonationPage ?? ""),
    teamSeatReservations: Array.isArray(data.teamSeatReservations) ? (data.teamSeatReservations as string[]).map(String).filter(Boolean) : [],
    busSeatingPlan: Array.isArray(data.busSeatingPlan) ? (data.busSeatingPlan as string[]).map(String).filter(Boolean) : [],
    teamCheckInScanner: String(data.teamCheckInScanner ?? ""),
    homeAwayLogistics: Array.isArray(data.homeAwayLogistics) ? (data.homeAwayLogistics as string[]).map(String).filter(Boolean) : [],
    sponsorProposals: Array.isArray(data.sponsorProposals) ? (data.sponsorProposals as string[]).map(String).filter(Boolean) : [],
    teamWebsiteEmbed: String(data.teamWebsiteEmbed ?? ""),
    teamSocialScheduler: Array.isArray(data.teamSocialScheduler) ? (data.teamSocialScheduler as string[]).map(String).filter(Boolean) : [],
    mediaRequestBoard: Array.isArray(data.mediaRequestBoard) ? (data.mediaRequestBoard as string[]).map(String).filter(Boolean) : [],
    athleteReleaseApprovals: Array.isArray(data.athleteReleaseApprovals) ? (data.athleteReleaseApprovals as string[]).map(String).filter(Boolean) : [],
    teamPayrollTools: Array.isArray(data.teamPayrollTools) ? (data.teamPayrollTools as string[]).map(String).filter(Boolean) : [],
    teamComplianceTracker: Array.isArray(data.teamComplianceTracker) ? (data.teamComplianceTracker as string[]).map(String).filter(Boolean) : [],
    ageGroupManagement: Array.isArray(data.ageGroupManagement) ? (data.ageGroupManagement as string[]).map(String).filter(Boolean) : [],
    multipleSquads: Array.isArray(data.multipleSquads) ? (data.multipleSquads as string[]).map(String).filter(Boolean) : [],
    tryoutEvaluations: Array.isArray(data.tryoutEvaluations) ? (data.tryoutEvaluations as string[]).map(String).filter(Boolean) : [],
    playerGradingMatrix: Array.isArray(data.playerGradingMatrix) ? (data.playerGradingMatrix as string[]).map(String).filter(Boolean) : [],
    staffFeedbackForms: Array.isArray(data.staffFeedbackForms) ? (data.staffFeedbackForms as string[]).map(String).filter(Boolean) : [],
    recognitionBadges: Array.isArray(data.recognitionBadges) ? (data.recognitionBadges as string[]).map(String).filter(Boolean) : [],
    traditionsBoard: Array.isArray(data.traditionsBoard) ? (data.traditionsBoard as string[]).map(String).filter(Boolean) : [],
    alumniNetworkBoard: Array.isArray(data.alumniNetworkBoard) ? (data.alumniNetworkBoard as string[]).map(String).filter(Boolean) : [],
    recruitmentNeedsBoard: Array.isArray(data.recruitmentNeedsBoard) ? (data.recruitmentNeedsBoard as string[]).map(String).filter(Boolean) : [],
    captainElections: Array.isArray(data.captainElections) ? (data.captainElections as string[]).map(String).filter(Boolean) : [],
    practiceAgendaBuilder: Array.isArray(data.practiceAgendaBuilder) ? (data.practiceAgendaBuilder as string[]).map(String).filter(Boolean) : [],
    matchPreparationChecklist: Array.isArray(data.matchPreparationChecklist) ? (data.matchPreparationChecklist as string[]).map(String).filter(Boolean) : [],
    postGameRecapBoard: Array.isArray(data.postGameRecapBoard) ? (data.postGameRecapBoard as string[]).map(String).filter(Boolean) : [],
    filmReviewRoom: String(data.filmReviewRoom ?? ""),
    coachPlayerOneOnOneMeetingNotes: Array.isArray(data.coachPlayerOneOnOneMeetingNotes) ? (data.coachPlayerOneOnOneMeetingNotes as string[]).map(String).filter(Boolean) : [],
    teamIssueReporting: Array.isArray(data.teamIssueReporting) ? (data.teamIssueReporting as string[]).map(String).filter(Boolean) : [],
    playerDevelopmentPlans: Array.isArray(data.playerDevelopmentPlans) ? (data.playerDevelopmentPlans as string[]).map(String).filter(Boolean) : [],
    sharedBenchmarks: Array.isArray(data.sharedBenchmarks) ? (data.sharedBenchmarks as string[]).map(String).filter(Boolean) : [],
    teamHydrationLogs: Array.isArray(data.teamHydrationLogs) ? (data.teamHydrationLogs as string[]).map(String).filter(Boolean) : [],
    teamSleepLogs: Array.isArray(data.teamSleepLogs) ? (data.teamSleepLogs as string[]).map(String).filter(Boolean) : [],
    recoveryRoomScheduling: Array.isArray(data.recoveryRoomScheduling) ? (data.recoveryRoomScheduling as string[]).map(String).filter(Boolean) : [],
    rotationPlanner: Array.isArray(data.rotationPlanner) ? (data.rotationPlanner as string[]).map(String).filter(Boolean) : [],
    positionGroupChannels: Array.isArray(data.positionGroupChannels) ? (data.positionGroupChannels as string[]).map(String).filter(Boolean) : [],
    staffMeetingRoom: String(data.staffMeetingRoom ?? ""),
    parentOfficeHours: String(data.parentOfficeHours ?? ""),
    teamHallOfFame: Array.isArray(data.teamHallOfFame) ? (data.teamHallOfFame as string[]).map(String).filter(Boolean) : [],
    scholarshipBoard: Array.isArray(data.scholarshipBoard) ? (data.scholarshipBoard as string[]).map(String).filter(Boolean) : [],
    teamSponsorshipInventory: Array.isArray(data.teamSponsorshipInventory) ? (data.teamSponsorshipInventory as string[]).map(String).filter(Boolean) : [],
    teamSponsorRenewalPipeline: Array.isArray(data.teamSponsorRenewalPipeline) ? (data.teamSponsorRenewalPipeline as string[]).map(String).filter(Boolean) : [],
    seasonalBudgetForecast: Array.isArray(data.seasonalBudgetForecast) ? (data.seasonalBudgetForecast as string[]).map(String).filter(Boolean) : [],
    teamAiAssistantNotes: Array.isArray(data.teamAiAssistantNotes) ? (data.teamAiAssistantNotes as string[]).map(String).filter(Boolean) : [],
  };
}

function mapTeam(id: string, data: Record<string, unknown>): TeamRecord {
  return {
    id,
    ownerId: String(data.ownerId ?? ""),
    adminIds: Array.isArray(data.adminIds) ? (data.adminIds as string[]) : [],
    name: String(data.name ?? ""),
    sport: String(data.sport ?? ""),
    location: String(data.location ?? ""),
    bio: String(data.bio ?? ""),
    memberIds: Array.isArray(data.memberIds) ? (data.memberIds as string[]) : [],
    members: Array.isArray(data.members)
      ? ((data.members as Array<Record<string, unknown>>).map((member) => ({
          uid: String(member.uid ?? ""),
          role:
            member.role === "admin" ||
            member.role === "coach" ||
            member.role === "captain" ||
            member.role === "player"
              ? member.role
              : "owner",
          displayName: String(member.displayName ?? "Member"),
          orgPermissions: Array.isArray(member.orgPermissions)
            ? ((member.orgPermissions as string[]).filter(
                (permission) =>
                  permission === "manage_roster" ||
                  permission === "manage_events" ||
                  permission === "manage_content" ||
                  permission === "manage_recruiting"
              ) as TeamMember["orgPermissions"])
            : [],
        })) as TeamMember[])
      : [],
    announcement: data.announcement ? String(data.announcement) : "",
    createdAt:
      (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
  };
}

function mapEvent(id: string, data: Record<string, unknown>): TeamEvent {
  return {
    id,
    teamId: String(data.teamId ?? ""),
    title: String(data.title ?? ""),
    date: String(data.date ?? ""),
    location: String(data.location ?? ""),
    type:
      data.type === "game" || data.type === "meeting" || data.type === "tryout"
        ? data.type
        : "practice",
    rsvpBy:
      data.rsvpBy && typeof data.rsvpBy === "object"
        ? (data.rsvpBy as Record<string, "going" | "maybe" | "not_going">)
        : {},
    remindersSentAt:
      (data.remindersSentAt as { seconds?: number; nanoseconds?: number } | null | undefined) ??
      null,
  };
}

export async function createTeam(input: {
  name: string;
  sport: string;
  location: string;
  bio: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in to create a team.");
  }

  await addDoc(collection(db, "teams"), {
    ownerId: auth.currentUser.uid,
    adminIds: [auth.currentUser.uid],
    name: input.name.trim(),
    sport: input.sport.trim(),
    location: input.location.trim(),
    bio: input.bio.trim(),
    memberIds: [auth.currentUser.uid],
    members: [
      {
        uid: auth.currentUser.uid,
        role: "owner",
        displayName: auth.currentUser.displayName || "Team Owner",
        orgPermissions: [
          "manage_roster",
          "manage_events",
          "manage_content",
          "manage_recruiting",
        ],
      },
    ],
    announcement: "",
    createdAt: serverTimestamp(),
  });
}

export function subscribeToTeams(callback: (teams: TeamRecord[]) => void) {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(
    query(collection(db, "teams"), orderBy("createdAt", "desc")),
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(snapshot.docs.map((docSnapshot) => mapTeam(docSnapshot.id, docSnapshot.data())));
    }
  );
}

export async function getTeam(teamId: string) {
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "teams", teamId));
  return snapshot.exists() ? mapTeam(snapshot.id, snapshot.data() as Record<string, unknown>) : null;
}

export async function joinTeam(teamId: string, role: TeamMember["role"] = "player") {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in to join a team.");
  }

  const team = await getTeam(teamId);
  if (!team) {
    throw new Error("Team not found.");
  }

  const nextMembers = [
    ...team.members.filter((member) => member.uid !== auth.currentUser?.uid),
    {
      uid: auth.currentUser.uid,
      role,
      displayName: auth.currentUser.displayName || "Team Member",
    },
  ];

  await updateDoc(doc(db, "teams", teamId), {
    memberIds: arrayUnion(auth.currentUser.uid),
    members: nextMembers,
    updatedAt: serverTimestamp(),
  });
}

export async function linkUserToTeam(teamId: string, teamName: string) {
  if (!auth?.currentUser || !db) {
    return;
  }

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      "role.team": teamName,
      teamId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function inviteToTeam(teamId: string, inviteeUid: string, role: TeamMember["role"]) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const team = await getTeam(teamId);
  if (!team) {
    throw new Error("Team not found.");
  }

  await addDoc(collection(db, "teamInvites"), {
    teamId,
    teamName: team.name,
    inviterId: auth.currentUser.uid,
    inviteeUid,
    role,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getTeamInvites() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, "teamInvites"),
      where("inviteeUid", "==", auth.currentUser.uid),
      limit(30)
    )
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Record<string, unknown>),
  })) as TeamInvite[];
}

export async function respondToTeamInvite(inviteId: string, status: "accepted" | "declined") {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "teamInvites", inviteId));
  if (!snapshot.exists()) {
    throw new Error("Invite not found.");
  }

  const invite = snapshot.data() as Record<string, unknown>;
  await setDoc(
    doc(db, "teamInvites", inviteId),
    { status, respondedAt: serverTimestamp() },
    { merge: true }
  );

  if (status === "accepted") {
    await joinTeam(String(invite.teamId ?? ""), (invite.role as TeamMember["role"]) ?? "player");
    await linkUserToTeam(String(invite.teamId ?? ""), String(invite.teamName ?? ""));
  }
}

export async function createTeamEvent(teamId: string, input: Omit<TeamEvent, "id" | "teamId">) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await addDoc(collection(db, "teamEvents"), {
    teamId,
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getTeamEvents(teamId: string) {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "teamEvents"), where("teamId", "==", teamId), limit(50))
  );
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapEvent(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
  );
}

export async function createTeamPost(teamId: string, content: string, type: "announcement" | "feed") {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await addDoc(collection(db, "teamPosts"), {
    teamId,
    authorId: auth.currentUser.uid,
    content: content.trim(),
    type,
    pinned: false,
    createdAt: serverTimestamp(),
  });
}

export async function getTeamPosts(teamId: string) {
  if (!db) {
    return [];
  }

  let snapshot;

  try {
    snapshot = await getDocs(
      query(collection(db, "teamPosts"), where("teamId", "==", teamId), orderBy("createdAt", "desc"), limit(50))
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db, "teamPosts"), limit(100)));
  }

  return snapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        teamId: String(data.teamId ?? ""),
        authorId: String(data.authorId ?? ""),
        content: String(data.content ?? ""),
        type: data.type === "announcement" ? "announcement" : "feed",
        pinned: data.pinned === true,
        createdAt:
          (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
      } satisfies TeamPost;
    })
    .filter((post: TeamPost) => post.teamId === teamId)
    .sort(compareCreatedAtDescending)
    .slice(0, 50);
}

export async function updateTeamAnnouncement(teamId: string, announcement: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(doc(db, "teams", teamId), { announcement: announcement.trim() }, { merge: true });
  if (announcement.trim()) {
    await createTeamPost(teamId, announcement, "announcement");
  }
}

export async function pinTeamPost(postId: string, pinned: boolean) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(doc(db, "teamPosts", postId), { pinned, updatedAt: serverTimestamp() }, { merge: true });
}

export async function submitTryoutApplication(teamId: string, input: Omit<TeamTryout, "id" | "teamId" | "status">) {
  if (!db) {
    throw new Error("Database unavailable.");
  }

  await addDoc(collection(db, "teamTryouts"), {
    teamId,
    ...input,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getTeamTryouts(teamId: string) {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "teamTryouts"), where("teamId", "==", teamId), limit(50))
  );
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Record<string, unknown>),
  })) as TeamTryout[];
}

export async function updateTeamMemberRole(teamId: string, memberUid: string, role: TeamMember["role"]) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const team = await getTeam(teamId);
  if (!team) {
    throw new Error("Team not found.");
  }

  const nextMembers = team.members.map((member) =>
    member.uid === memberUid
      ? {
          ...member,
          role,
          orgPermissions:
            member.orgPermissions && member.orgPermissions.length > 0
              ? member.orgPermissions
              : role === "owner" || role === "admin" || role === "coach"
                ? ["manage_roster", "manage_events", "manage_content"]
                : [],
        }
      : member
  );
  const nextAdminIds = Array.from(
    new Set(
      nextMembers
        .filter((member) => member.role === "owner" || member.role === "admin" || member.role === "coach")
        .map((member) => member.uid)
    )
  );

  await setDoc(
    doc(db, "teams", teamId),
    {
      members: nextMembers,
      adminIds: nextAdminIds,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getOrganizationTeams() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "teams"), where("adminIds", "array-contains", auth.currentUser.uid), limit(50))
  );
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapTeam(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
  );
}

export async function updateOrganizationPermissions(
  teamId: string,
  memberUid: string,
  permissions: TeamMember["orgPermissions"]
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const team = await getTeam(teamId);
  if (!team) {
    throw new Error("Team not found.");
  }

  const nextMembers = team.members.map((member) =>
    member.uid === memberUid ? { ...member, orgPermissions: permissions ?? [] } : member
  );

  await setDoc(doc(db, "teams", teamId), { members: nextMembers, updatedAt: serverTimestamp() }, { merge: true });
}

export async function createTeamChatRoom(teamId: string, name: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await addDoc(collection(db, "teamChatRooms"), {
    teamId,
    name: name.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getTeamChatRooms(teamId: string) {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "teamChatRooms"), where("teamId", "==", teamId), limit(50))
  );

  return snapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        teamId: String(data.teamId ?? ""),
        name: String(data.name ?? "Room"),
        createdAt:
          (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
      } satisfies TeamChatRoom;
    })
    .sort((left: TeamChatRoom, right: TeamChatRoom) => {
      const leftSeconds = left.createdAt?.seconds ?? 0;
      const rightSeconds = right.createdAt?.seconds ?? 0;
      if (leftSeconds !== rightSeconds) {
        return leftSeconds - rightSeconds;
      }
      const leftNanos = left.createdAt?.nanoseconds ?? 0;
      const rightNanos = right.createdAt?.nanoseconds ?? 0;
      return leftNanos - rightNanos;
    })
    .slice(0, 20);
}

export async function sendTeamChatMessage(teamId: string, roomId: string, text: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  await addDoc(collection(db, "teamChatMessages"), {
    teamId,
    roomId,
    senderId: auth.currentUser.uid,
    senderName: auth.currentUser.displayName || "Team Member",
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToTeamChatMessages(
  roomId: string,
  callback: (messages: TeamChatMessage[]) => void
) {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const mapMessages = (docs: Array<{ id: string; data: () => Record<string, unknown> }>) =>
    docs
      .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        return {
          id: docSnapshot.id,
          roomId: String(data.roomId ?? ""),
          teamId: String(data.teamId ?? ""),
          senderId: String(data.senderId ?? ""),
          senderName: String(data.senderName ?? "Team Member"),
          text: String(data.text ?? ""),
          createdAt:
            (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ??
            null,
        } satisfies TeamChatMessage;
      })
      .filter((message: TeamChatMessage) => message.roomId === roomId)
      .sort(compareCreatedAtAscending)
      .slice(-100);

  try {
    return onSnapshot(
      query(
        collection(db, "teamChatMessages"),
        where("roomId", "==", roomId),
        orderBy("createdAt", "asc"),
        limit(100)
      ),
      (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        callback(mapMessages(snapshot.docs));
      },
      (error: unknown) => {
        if (!isMissingIndexError(error)) {
          callback([]);
          return;
        }

        void getDocs(query(collection(db, "teamChatMessages"), limit(200))).then((snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
          callback(
            mapMessages(
              snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>
            )
          );
        });
      }
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      callback([]);
      return () => undefined;
    }

    void getDocs(query(collection(db, "teamChatMessages"), limit(200))).then((snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(
        mapMessages(
          snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>
        )
      );
    });
    return () => undefined;
  }
}

export async function updateEventRsvp(
  eventId: string,
  status: "going" | "maybe" | "not_going"
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(
    doc(db, "teamEvents", eventId),
    {
      [`rsvpBy.${auth.currentUser.uid}`]: status,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function sendEventRsvpReminders(teamId: string, event: TeamEvent, teamName: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const team = await getTeam(teamId);
  if (!team) {
    throw new Error("Team not found.");
  }

  const respondedIds = new Set(Object.keys(event.rsvpBy ?? {}));
  await Promise.all(
    team.memberIds
      .filter((memberUid) => memberUid !== auth.currentUser?.uid)
      .filter((memberUid) => !respondedIds.has(memberUid))
      .map((memberUid) =>
        createNotification({
          type: "team_rsvp",
          recipientId: memberUid,
          actorId: auth.currentUser!.uid,
          actorName: auth.currentUser!.displayName || teamName,
          actorAvatar: auth.currentUser!.photoURL || "",
          message: `RSVP reminder: ${event.title} is coming up for ${teamName}.`,
        })
      )
  );

  await setDoc(doc(db, "teamEvents", event.id), { remindersSentAt: serverTimestamp() }, { merge: true });
}

export async function markAttendance(
  teamId: string,
  eventId: string,
  memberUid: string,
  memberName: string,
  status: TeamAttendanceRecord["status"]
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(
    doc(db, "teamAttendance", `${eventId}__${memberUid}`),
    {
      teamId,
      eventId,
      memberUid,
      memberName,
      status,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getTeamAttendance(teamId: string, eventId: string) {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, "teamAttendance"),
      where("teamId", "==", teamId),
      where("eventId", "==", eventId),
      limit(100)
    )
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      teamId: String(data.teamId ?? ""),
      eventId: String(data.eventId ?? ""),
      memberUid: String(data.memberUid ?? ""),
      memberName: String(data.memberName ?? "Member"),
      status:
        data.status === "late" || data.status === "absent" ? data.status : "present",
    } satisfies TeamAttendanceRecord;
  });
}

export async function addCoachFeedback(
  teamId: string,
  postId: string,
  athleteUid: string,
  feedback: string
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const trimmed = feedback.trim();
  if (!trimmed) {
    return;
  }

  await addDoc(collection(db, "coachFeedback"), {
    teamId,
    postId,
    athleteUid,
    coachUid: auth.currentUser.uid,
    coachName: auth.currentUser.displayName || "Coach",
    feedback: trimmed,
    createdAt: serverTimestamp(),
  });

  if (athleteUid !== auth.currentUser.uid) {
    await createNotification({
      type: "coach_feedback",
      recipientId: athleteUid,
      actorId: auth.currentUser.uid,
      actorName: auth.currentUser.displayName || "Coach",
      actorAvatar: auth.currentUser.photoURL || "",
      message: `${auth.currentUser.displayName || "A coach"} left feedback on your post.`,
      postId,
    });
  }
}

export function subscribeToCoachFeedback(
  postId: string,
  callback: (feedback: CoachFeedbackRecord[]) => void
) {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const mapFeedback = (docs: Array<{ id: string; data: () => Record<string, unknown> }>) =>
    docs
      .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        return {
          id: docSnapshot.id,
          teamId: String(data.teamId ?? ""),
          postId: String(data.postId ?? ""),
          athleteUid: String(data.athleteUid ?? ""),
          coachUid: String(data.coachUid ?? ""),
          coachName: String(data.coachName ?? "Coach"),
          feedback: String(data.feedback ?? ""),
          createdAt:
            (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ??
            null,
        } satisfies CoachFeedbackRecord;
      })
      .filter((entry: CoachFeedbackRecord) => entry.postId === postId)
      .sort(compareCreatedAtDescending)
      .slice(0, 20);

  try {
    return onSnapshot(
      query(collection(db, "coachFeedback"), where("postId", "==", postId), orderBy("createdAt", "desc"), limit(20)),
      (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        callback(mapFeedback(snapshot.docs));
      },
      (error: unknown) => {
        if (!isMissingIndexError(error)) {
          callback([]);
          return;
        }

        void getDocs(query(collection(db, "coachFeedback"), limit(100))).then((snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
          callback(
            mapFeedback(
              snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>
            )
          );
        });
      }
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      callback([]);
      return () => undefined;
    }

    void getDocs(query(collection(db, "coachFeedback"), limit(100))).then((snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(
        mapFeedback(
          snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>
        )
      );
    });
    return () => undefined;
  }
}

export async function addTeamGalleryItem(teamId: string, file: File, caption: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const uploaded = await uploadToCloudinary(file, `hooplink/team-galleries/${teamId}`);
  await addDoc(collection(db, "teamGallery"), {
    teamId,
    mediaUrl: uploaded.url,
    mediaType: file.type.startsWith("video/") ? "video" : "image",
    caption: caption.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getTeamGallery(teamId: string) {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "teamGallery"), where("teamId", "==", teamId), limit(50))
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      teamId: String(data.teamId ?? ""),
      mediaUrl: String(data.mediaUrl ?? ""),
      mediaType: data.mediaType === "video" ? "video" : "image",
      caption: String(data.caption ?? ""),
    } satisfies TeamGalleryItem;
  });
}

export async function addStaffNote(teamId: string, memberUid: string, note: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await addDoc(collection(db, "staffNotes"), {
    teamId,
    memberUid,
    authorUid: auth.currentUser.uid,
    authorName: auth.currentUser.displayName || "Staff",
    note: note.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getStaffNotes(teamId: string, memberUid: string) {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, "staffNotes"),
      where("teamId", "==", teamId),
      where("memberUid", "==", memberUid),
      limit(50)
    )
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      teamId: String(data.teamId ?? ""),
      memberUid: String(data.memberUid ?? ""),
      authorUid: String(data.authorUid ?? ""),
      authorName: String(data.authorName ?? "Staff"),
      note: String(data.note ?? ""),
      createdAt:
        (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    } satisfies StaffNoteRecord;
  });
}

export async function getTeamWorkspace(teamId: string) {
  if (!db) {
    return createDefaultWorkspace(teamId);
  }

  const snapshot = await getDoc(doc(db, "teamWorkspaces", teamId));
  if (!snapshot.exists()) {
    const fallback = createDefaultWorkspace(teamId);
    await setDoc(doc(db, "teamWorkspaces", teamId), fallback, { merge: true });
    return fallback;
  }

  return mapWorkspace(teamId, snapshot.data() as Record<string, unknown>);
}

export async function updateTeamWorkspace(
  teamId: string,
  values: Partial<TeamWorkspaceRecord>
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(doc(db, "teamWorkspaces", teamId), values, { merge: true });
}

export async function saveTeamWorkspaceListItem(
  teamId: string,
  field:
    | "goals"
    | "polls"
    | "tasks"
    | "travelBoard"
    | "fileVault"
    | "wellnessCheckIns"
    | "scoutingReports"
    | "opponentNotes"
    | "depthChart"
    | "leaderboard"
    | "chemistryActivities"
    | "archiveHistory"
    | "sponsorWall"
    | "statSummary",
  items: TeamWorkspaceRecord[typeof field]
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(doc(db, "teamWorkspaces", teamId), { [field]: items }, { merge: true });
}
