import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { uploadToCloudinary } from "@/lib/cloudinary";
import { auth, db } from "@/lib/firebase";

export interface DrillRecord {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  description: string;
  savedBy: string[];
}

export interface TeamPracticePlanRecord {
  id: string;
  teamId: string;
  title: string;
  date: string;
  focus: string;
  drills: string[];
  coachIds: string[];
}

export interface PlaybookBoardRecord {
  id: string;
  teamId: string;
  title: string;
  imageUrl: string;
}

export interface SkillProgressRecord {
  id: string;
  userId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
}

export interface ConditioningLogRecord {
  id: string;
  userId: string;
  date: string;
  workoutType: string;
  durationMinutes: number;
  intensity: number;
}

export interface NutritionJournalRecord {
  id: string;
  userId: string;
  date: string;
  meals: string;
  hydrationOz: number;
}

export interface RecoveryAppointmentRecord {
  id: string;
  requesterId: string;
  hostId: string;
  hostName: string;
  type: "recovery" | "physio";
  scheduledFor: string;
  note: string;
  status: "pending" | "accepted" | "completed";
}

export interface MedicalClearanceRecord {
  id: string;
  userId: string;
  title: string;
  imageUrl: string;
  status: "pending" | "cleared";
}

export interface ReturnToPlayChecklistRecord {
  id: string;
  userId: string;
  title: string;
  items: Array<{ label: string; done: boolean }>;
}

export interface RehabAssignmentRecord {
  id: string;
  userId: string;
  coachName: string;
  title: string;
  notes: string;
  completed: boolean;
}

export interface CoachCheckInRecord {
  id: string;
  userId: string;
  coachUid: string;
  coachName: string;
  reflection: string;
  burnoutScore: number;
}

export interface GoalRecord {
  id: string;
  userId: string;
  title: string;
  category: string;
  progress: number;
  target: number;
}

export interface AthleteDevelopmentProfile {
  userId: string;
  assessmentQuizzes: Array<{ id: string; title: string; score: number; focusArea: string }>;
  trainingPlan: Array<{ id: string; dayLabel: string; focus: string; drills: string[]; recovery: string; mindset: string }>;
  workoutCards: Array<{ id: string; title: string; reps: string; duration: string }>;
  habits: Array<{ id: string; title: string; streak: number }>;
  sleepLogs: Array<{ id: string; date: string; hours: number }>;
  recoveryReminders: Array<{ id: string; title: string; detail: string }>;
  injuryPreventionPlans: Array<{ id: string; title: string; exercises: string[] }>;
  warmups: Array<{ id: string; title: string; steps: string[] }>;
  cooldowns: Array<{ id: string; title: string; steps: string[] }>;
  benchmarks: Array<{ id: string; metric: string; current: string; goal: string }>;
  personalRecords: Array<{ id: string; label: string; value: string }>;
  formAnalyses: Array<{ id: string; title: string; mediaUrl: string; notes: string }>;
  aiTips: Array<{ id: string; title: string; body: string }>;
  coachHomework: Array<{ id: string; title: string; dueLabel: string; status: "todo" | "done" }>;
  challenges: Array<{ id: string; title: string; type: "friend" | "team"; detail: string }>;
  sharedUpdates: Array<{ id: string; title: string; summary: string }>;
  drillVideoDemos: string[];
  shotChartTracker: string[];
  finishingDrillTracker: string[];
  ballHandlingScores: string[];
  passingDrillScores: string[];
  footworkProgression: string[];
  mobilityTesting: string[];
  agilityLadderTracking: string[];
  conditioningIntervals: string[];
  heartRateLogs: string[];
  sprintSplitHistory: string[];
  verticalComparisonCharts: string[];
  skillHeatmaps: string[];
  weaknessFinder: string[];
  strengthFinder: string[];
  aiWeeklyRecap: string[];
  sideBySideAnalysis: string[];
  beforeAfterClips: string[];
  coachRubricGrading: string[];
  selfEvaluationJournal: string[];
  mentalPerformanceJournal: string[];
  confidenceTracker: string[];
  focusRoutineBuilder: string[];
  breathingExercises: string[];
  visualizationPlans: string[];
  gameRoutinePlanner: string[];
  preGameChecklist: string[];
  postGameRecoveryChecklist: string[];
  stretchLibrary: string[];
  nutritionSnapshots: string[];
  macroTargets: string[];
  groceryPlanner: string[];
  supplementNotes: string[];
  waterStreaks: string[];
  mealPhotoLogs: string[];
  wellnessScore: string[];
  dailyCheckInBot: string[];
  sorenessTracker: string[];
  loadManagementAlerts: string[];
  practiceEffortRating: string[];
  coachAttendanceOnDrills: string[];
  progressBadges: string[];
  athleteXp: string[];
  seasonalLevelUps: string[];
  benchmarkLeaderboards: string[];
  positionLeaderboards: string[];
  ageGroupLeaderboards: string[];
  smartDrillRecommendations: string[];
  aiPersonalizedProgression: string[];
  customDrillBuilder: string[];
  privateTrainingGroups: string[];
  trainerAssignmentFlow: string[];
  weeklyCheckpointReview: string[];
  videoFeedbackTimestamping: string[];
  formCorrectionNotes: string[];
  goalResetWizard: string[];
  breakoutPlanBuilder: string[];
  offseasonPlanBuilder: string[];
  inSeasonMaintenancePlan: string[];
  postInjuryConfidenceTracker: string[];
  conditioningCalendar: string[];
  restDayPlanner: string[];
  focusPlaylistIntegration: string[];
  trainingNoteExport: string[];
  athleteReportPdf: string;
  parentProgressSummary: string[];
  teamCoachProgressView: string[];
  scoutSafeSummaryCard: string[];
  athleteAvailabilityCalendarSync: string[];
  smartInjuryRiskDashboard: string[];
  trainingSessionAttendanceHeatmap: string[];
  playerConfidenceCheckInBeforeGames: string[];
  aiPracticePlanGenerator: string[];
  athleteHabitStreakCalendar: string[];
  gameFilmAutoTagging: string[];
  athleteCommandCenterNotes: string[];
}

function createDefaultDevelopmentProfile(userId: string): AthleteDevelopmentProfile {
  return {
    userId,
    assessmentQuizzes: [],
    trainingPlan: [],
    workoutCards: [],
    habits: [],
    sleepLogs: [],
    recoveryReminders: [],
    injuryPreventionPlans: [],
    warmups: [],
    cooldowns: [],
    benchmarks: [],
    personalRecords: [],
    formAnalyses: [],
    aiTips: [],
    coachHomework: [],
    challenges: [],
    sharedUpdates: [],
    drillVideoDemos: [],
    shotChartTracker: [],
    finishingDrillTracker: [],
    ballHandlingScores: [],
    passingDrillScores: [],
    footworkProgression: [],
    mobilityTesting: [],
    agilityLadderTracking: [],
    conditioningIntervals: [],
    heartRateLogs: [],
    sprintSplitHistory: [],
    verticalComparisonCharts: [],
    skillHeatmaps: [],
    weaknessFinder: [],
    strengthFinder: [],
    aiWeeklyRecap: [],
    sideBySideAnalysis: [],
    beforeAfterClips: [],
    coachRubricGrading: [],
    selfEvaluationJournal: [],
    mentalPerformanceJournal: [],
    confidenceTracker: [],
    focusRoutineBuilder: [],
    breathingExercises: [],
    visualizationPlans: [],
    gameRoutinePlanner: [],
    preGameChecklist: [],
    postGameRecoveryChecklist: [],
    stretchLibrary: [],
    nutritionSnapshots: [],
    macroTargets: [],
    groceryPlanner: [],
    supplementNotes: [],
    waterStreaks: [],
    mealPhotoLogs: [],
    wellnessScore: [],
    dailyCheckInBot: [],
    sorenessTracker: [],
    loadManagementAlerts: [],
    practiceEffortRating: [],
    coachAttendanceOnDrills: [],
    progressBadges: [],
    athleteXp: [],
    seasonalLevelUps: [],
    benchmarkLeaderboards: [],
    positionLeaderboards: [],
    ageGroupLeaderboards: [],
    smartDrillRecommendations: [],
    aiPersonalizedProgression: [],
    customDrillBuilder: [],
    privateTrainingGroups: [],
    trainerAssignmentFlow: [],
    weeklyCheckpointReview: [],
    videoFeedbackTimestamping: [],
    formCorrectionNotes: [],
    goalResetWizard: [],
    breakoutPlanBuilder: [],
    offseasonPlanBuilder: [],
    inSeasonMaintenancePlan: [],
    postInjuryConfidenceTracker: [],
    conditioningCalendar: [],
    restDayPlanner: [],
    focusPlaylistIntegration: [],
    trainingNoteExport: [],
    athleteReportPdf: "",
    parentProgressSummary: [],
    teamCoachProgressView: [],
    scoutSafeSummaryCard: [],
    athleteAvailabilityCalendarSync: [],
    smartInjuryRiskDashboard: [],
    trainingSessionAttendanceHeatmap: [],
    playerConfidenceCheckInBeforeGames: [],
    aiPracticePlanGenerator: [],
    athleteHabitStreakCalendar: [],
    gameFilmAutoTagging: [],
    athleteCommandCenterNotes: [],
  };
}

function mapDevelopmentProfile(userId: string, data: Record<string, unknown>): AthleteDevelopmentProfile {
  const fallback = createDefaultDevelopmentProfile(userId);
  const list = <T>(value: unknown, mapper: (item: Record<string, unknown>, index: number) => T) =>
    Array.isArray(value) ? (value as Array<Record<string, unknown>>).map(mapper) : [];

  return {
    userId,
    assessmentQuizzes: list(data.assessmentQuizzes, (item, index) => ({
      id: String(item.id ?? `assessment-${index + 1}`),
      title: String(item.title ?? ""),
      score: Number(item.score ?? 0),
      focusArea: String(item.focusArea ?? ""),
    })),
    trainingPlan: list(data.trainingPlan, (item, index) => ({
      id: String(item.id ?? `plan-${index + 1}`),
      dayLabel: String(item.dayLabel ?? ""),
      focus: String(item.focus ?? ""),
      drills: Array.isArray(item.drills) ? (item.drills as string[]).map(String).filter(Boolean) : [],
      recovery: String(item.recovery ?? ""),
      mindset: String(item.mindset ?? ""),
    })),
    workoutCards: list(data.workoutCards, (item, index) => ({
      id: String(item.id ?? `workout-${index + 1}`),
      title: String(item.title ?? ""),
      reps: String(item.reps ?? ""),
      duration: String(item.duration ?? ""),
    })),
    habits: list(data.habits, (item, index) => ({
      id: String(item.id ?? `habit-${index + 1}`),
      title: String(item.title ?? ""),
      streak: Number(item.streak ?? 0),
    })),
    sleepLogs: list(data.sleepLogs, (item, index) => ({
      id: String(item.id ?? `sleep-${index + 1}`),
      date: String(item.date ?? ""),
      hours: Number(item.hours ?? 0),
    })),
    recoveryReminders: list(data.recoveryReminders, (item, index) => ({
      id: String(item.id ?? `reminder-${index + 1}`),
      title: String(item.title ?? ""),
      detail: String(item.detail ?? ""),
    })),
    injuryPreventionPlans: list(data.injuryPreventionPlans, (item, index) => ({
      id: String(item.id ?? `injury-${index + 1}`),
      title: String(item.title ?? ""),
      exercises: Array.isArray(item.exercises) ? (item.exercises as string[]).map(String).filter(Boolean) : [],
    })),
    warmups: list(data.warmups, (item, index) => ({
      id: String(item.id ?? `warmup-${index + 1}`),
      title: String(item.title ?? ""),
      steps: Array.isArray(item.steps) ? (item.steps as string[]).map(String).filter(Boolean) : [],
    })),
    cooldowns: list(data.cooldowns, (item, index) => ({
      id: String(item.id ?? `cooldown-${index + 1}`),
      title: String(item.title ?? ""),
      steps: Array.isArray(item.steps) ? (item.steps as string[]).map(String).filter(Boolean) : [],
    })),
    benchmarks: list(data.benchmarks, (item, index) => ({
      id: String(item.id ?? `benchmark-${index + 1}`),
      metric: String(item.metric ?? ""),
      current: String(item.current ?? ""),
      goal: String(item.goal ?? ""),
    })),
    personalRecords: list(data.personalRecords, (item, index) => ({
      id: String(item.id ?? `record-${index + 1}`),
      label: String(item.label ?? ""),
      value: String(item.value ?? ""),
    })),
    formAnalyses: list(data.formAnalyses, (item, index) => ({
      id: String(item.id ?? `form-${index + 1}`),
      title: String(item.title ?? ""),
      mediaUrl: String(item.mediaUrl ?? ""),
      notes: String(item.notes ?? ""),
    })),
    aiTips: list(data.aiTips, (item, index) => ({
      id: String(item.id ?? `tip-${index + 1}`),
      title: String(item.title ?? ""),
      body: String(item.body ?? ""),
    })),
    coachHomework: list(data.coachHomework, (item, index) => ({
      id: String(item.id ?? `homework-${index + 1}`),
      title: String(item.title ?? ""),
      dueLabel: String(item.dueLabel ?? ""),
      status: item.status === "done" ? "done" : "todo",
    })),
    challenges: list(data.challenges, (item, index) => ({
      id: String(item.id ?? `challenge-${index + 1}`),
      title: String(item.title ?? ""),
      type: item.type === "team" ? "team" : "friend",
      detail: String(item.detail ?? ""),
    })),
    sharedUpdates: list(data.sharedUpdates, (item, index) => ({
      id: String(item.id ?? `share-${index + 1}`),
      title: String(item.title ?? ""),
      summary: String(item.summary ?? ""),
    })),
    drillVideoDemos: Array.isArray(data.drillVideoDemos) ? (data.drillVideoDemos as string[]).map(String).filter(Boolean) : [],
    shotChartTracker: Array.isArray(data.shotChartTracker) ? (data.shotChartTracker as string[]).map(String).filter(Boolean) : [],
    finishingDrillTracker: Array.isArray(data.finishingDrillTracker) ? (data.finishingDrillTracker as string[]).map(String).filter(Boolean) : [],
    ballHandlingScores: Array.isArray(data.ballHandlingScores) ? (data.ballHandlingScores as string[]).map(String).filter(Boolean) : [],
    passingDrillScores: Array.isArray(data.passingDrillScores) ? (data.passingDrillScores as string[]).map(String).filter(Boolean) : [],
    footworkProgression: Array.isArray(data.footworkProgression) ? (data.footworkProgression as string[]).map(String).filter(Boolean) : [],
    mobilityTesting: Array.isArray(data.mobilityTesting) ? (data.mobilityTesting as string[]).map(String).filter(Boolean) : [],
    agilityLadderTracking: Array.isArray(data.agilityLadderTracking) ? (data.agilityLadderTracking as string[]).map(String).filter(Boolean) : [],
    conditioningIntervals: Array.isArray(data.conditioningIntervals) ? (data.conditioningIntervals as string[]).map(String).filter(Boolean) : [],
    heartRateLogs: Array.isArray(data.heartRateLogs) ? (data.heartRateLogs as string[]).map(String).filter(Boolean) : [],
    sprintSplitHistory: Array.isArray(data.sprintSplitHistory) ? (data.sprintSplitHistory as string[]).map(String).filter(Boolean) : [],
    verticalComparisonCharts: Array.isArray(data.verticalComparisonCharts) ? (data.verticalComparisonCharts as string[]).map(String).filter(Boolean) : [],
    skillHeatmaps: Array.isArray(data.skillHeatmaps) ? (data.skillHeatmaps as string[]).map(String).filter(Boolean) : [],
    weaknessFinder: Array.isArray(data.weaknessFinder) ? (data.weaknessFinder as string[]).map(String).filter(Boolean) : [],
    strengthFinder: Array.isArray(data.strengthFinder) ? (data.strengthFinder as string[]).map(String).filter(Boolean) : [],
    aiWeeklyRecap: Array.isArray(data.aiWeeklyRecap) ? (data.aiWeeklyRecap as string[]).map(String).filter(Boolean) : [],
    sideBySideAnalysis: Array.isArray(data.sideBySideAnalysis) ? (data.sideBySideAnalysis as string[]).map(String).filter(Boolean) : [],
    beforeAfterClips: Array.isArray(data.beforeAfterClips) ? (data.beforeAfterClips as string[]).map(String).filter(Boolean) : [],
    coachRubricGrading: Array.isArray(data.coachRubricGrading) ? (data.coachRubricGrading as string[]).map(String).filter(Boolean) : [],
    selfEvaluationJournal: Array.isArray(data.selfEvaluationJournal) ? (data.selfEvaluationJournal as string[]).map(String).filter(Boolean) : [],
    mentalPerformanceJournal: Array.isArray(data.mentalPerformanceJournal) ? (data.mentalPerformanceJournal as string[]).map(String).filter(Boolean) : [],
    confidenceTracker: Array.isArray(data.confidenceTracker) ? (data.confidenceTracker as string[]).map(String).filter(Boolean) : [],
    focusRoutineBuilder: Array.isArray(data.focusRoutineBuilder) ? (data.focusRoutineBuilder as string[]).map(String).filter(Boolean) : [],
    breathingExercises: Array.isArray(data.breathingExercises) ? (data.breathingExercises as string[]).map(String).filter(Boolean) : [],
    visualizationPlans: Array.isArray(data.visualizationPlans) ? (data.visualizationPlans as string[]).map(String).filter(Boolean) : [],
    gameRoutinePlanner: Array.isArray(data.gameRoutinePlanner) ? (data.gameRoutinePlanner as string[]).map(String).filter(Boolean) : [],
    preGameChecklist: Array.isArray(data.preGameChecklist) ? (data.preGameChecklist as string[]).map(String).filter(Boolean) : [],
    postGameRecoveryChecklist: Array.isArray(data.postGameRecoveryChecklist) ? (data.postGameRecoveryChecklist as string[]).map(String).filter(Boolean) : [],
    stretchLibrary: Array.isArray(data.stretchLibrary) ? (data.stretchLibrary as string[]).map(String).filter(Boolean) : [],
    nutritionSnapshots: Array.isArray(data.nutritionSnapshots) ? (data.nutritionSnapshots as string[]).map(String).filter(Boolean) : [],
    macroTargets: Array.isArray(data.macroTargets) ? (data.macroTargets as string[]).map(String).filter(Boolean) : [],
    groceryPlanner: Array.isArray(data.groceryPlanner) ? (data.groceryPlanner as string[]).map(String).filter(Boolean) : [],
    supplementNotes: Array.isArray(data.supplementNotes) ? (data.supplementNotes as string[]).map(String).filter(Boolean) : [],
    waterStreaks: Array.isArray(data.waterStreaks) ? (data.waterStreaks as string[]).map(String).filter(Boolean) : [],
    mealPhotoLogs: Array.isArray(data.mealPhotoLogs) ? (data.mealPhotoLogs as string[]).map(String).filter(Boolean) : [],
    wellnessScore: Array.isArray(data.wellnessScore) ? (data.wellnessScore as string[]).map(String).filter(Boolean) : [],
    dailyCheckInBot: Array.isArray(data.dailyCheckInBot) ? (data.dailyCheckInBot as string[]).map(String).filter(Boolean) : [],
    sorenessTracker: Array.isArray(data.sorenessTracker) ? (data.sorenessTracker as string[]).map(String).filter(Boolean) : [],
    loadManagementAlerts: Array.isArray(data.loadManagementAlerts) ? (data.loadManagementAlerts as string[]).map(String).filter(Boolean) : [],
    practiceEffortRating: Array.isArray(data.practiceEffortRating) ? (data.practiceEffortRating as string[]).map(String).filter(Boolean) : [],
    coachAttendanceOnDrills: Array.isArray(data.coachAttendanceOnDrills) ? (data.coachAttendanceOnDrills as string[]).map(String).filter(Boolean) : [],
    progressBadges: Array.isArray(data.progressBadges) ? (data.progressBadges as string[]).map(String).filter(Boolean) : [],
    athleteXp: Array.isArray(data.athleteXp) ? (data.athleteXp as string[]).map(String).filter(Boolean) : [],
    seasonalLevelUps: Array.isArray(data.seasonalLevelUps) ? (data.seasonalLevelUps as string[]).map(String).filter(Boolean) : [],
    benchmarkLeaderboards: Array.isArray(data.benchmarkLeaderboards) ? (data.benchmarkLeaderboards as string[]).map(String).filter(Boolean) : [],
    positionLeaderboards: Array.isArray(data.positionLeaderboards) ? (data.positionLeaderboards as string[]).map(String).filter(Boolean) : [],
    ageGroupLeaderboards: Array.isArray(data.ageGroupLeaderboards) ? (data.ageGroupLeaderboards as string[]).map(String).filter(Boolean) : [],
    smartDrillRecommendations: Array.isArray(data.smartDrillRecommendations) ? (data.smartDrillRecommendations as string[]).map(String).filter(Boolean) : [],
    aiPersonalizedProgression: Array.isArray(data.aiPersonalizedProgression) ? (data.aiPersonalizedProgression as string[]).map(String).filter(Boolean) : [],
    customDrillBuilder: Array.isArray(data.customDrillBuilder) ? (data.customDrillBuilder as string[]).map(String).filter(Boolean) : [],
    privateTrainingGroups: Array.isArray(data.privateTrainingGroups) ? (data.privateTrainingGroups as string[]).map(String).filter(Boolean) : [],
    trainerAssignmentFlow: Array.isArray(data.trainerAssignmentFlow) ? (data.trainerAssignmentFlow as string[]).map(String).filter(Boolean) : [],
    weeklyCheckpointReview: Array.isArray(data.weeklyCheckpointReview) ? (data.weeklyCheckpointReview as string[]).map(String).filter(Boolean) : [],
    videoFeedbackTimestamping: Array.isArray(data.videoFeedbackTimestamping) ? (data.videoFeedbackTimestamping as string[]).map(String).filter(Boolean) : [],
    formCorrectionNotes: Array.isArray(data.formCorrectionNotes) ? (data.formCorrectionNotes as string[]).map(String).filter(Boolean) : [],
    goalResetWizard: Array.isArray(data.goalResetWizard) ? (data.goalResetWizard as string[]).map(String).filter(Boolean) : [],
    breakoutPlanBuilder: Array.isArray(data.breakoutPlanBuilder) ? (data.breakoutPlanBuilder as string[]).map(String).filter(Boolean) : [],
    offseasonPlanBuilder: Array.isArray(data.offseasonPlanBuilder) ? (data.offseasonPlanBuilder as string[]).map(String).filter(Boolean) : [],
    inSeasonMaintenancePlan: Array.isArray(data.inSeasonMaintenancePlan) ? (data.inSeasonMaintenancePlan as string[]).map(String).filter(Boolean) : [],
    postInjuryConfidenceTracker: Array.isArray(data.postInjuryConfidenceTracker) ? (data.postInjuryConfidenceTracker as string[]).map(String).filter(Boolean) : [],
    conditioningCalendar: Array.isArray(data.conditioningCalendar) ? (data.conditioningCalendar as string[]).map(String).filter(Boolean) : [],
    restDayPlanner: Array.isArray(data.restDayPlanner) ? (data.restDayPlanner as string[]).map(String).filter(Boolean) : [],
    focusPlaylistIntegration: Array.isArray(data.focusPlaylistIntegration) ? (data.focusPlaylistIntegration as string[]).map(String).filter(Boolean) : [],
    trainingNoteExport: Array.isArray(data.trainingNoteExport) ? (data.trainingNoteExport as string[]).map(String).filter(Boolean) : [],
    athleteReportPdf: String(data.athleteReportPdf ?? ""),
    parentProgressSummary: Array.isArray(data.parentProgressSummary) ? (data.parentProgressSummary as string[]).map(String).filter(Boolean) : [],
    teamCoachProgressView: Array.isArray(data.teamCoachProgressView) ? (data.teamCoachProgressView as string[]).map(String).filter(Boolean) : [],
    scoutSafeSummaryCard: Array.isArray(data.scoutSafeSummaryCard) ? (data.scoutSafeSummaryCard as string[]).map(String).filter(Boolean) : [],
    athleteAvailabilityCalendarSync: Array.isArray(data.athleteAvailabilityCalendarSync) ? (data.athleteAvailabilityCalendarSync as string[]).map(String).filter(Boolean) : [],
    smartInjuryRiskDashboard: Array.isArray(data.smartInjuryRiskDashboard) ? (data.smartInjuryRiskDashboard as string[]).map(String).filter(Boolean) : [],
    trainingSessionAttendanceHeatmap: Array.isArray(data.trainingSessionAttendanceHeatmap) ? (data.trainingSessionAttendanceHeatmap as string[]).map(String).filter(Boolean) : [],
    playerConfidenceCheckInBeforeGames: Array.isArray(data.playerConfidenceCheckInBeforeGames) ? (data.playerConfidenceCheckInBeforeGames as string[]).map(String).filter(Boolean) : [],
    aiPracticePlanGenerator: Array.isArray(data.aiPracticePlanGenerator) ? (data.aiPracticePlanGenerator as string[]).map(String).filter(Boolean) : [],
    athleteHabitStreakCalendar: Array.isArray(data.athleteHabitStreakCalendar) ? (data.athleteHabitStreakCalendar as string[]).map(String).filter(Boolean) : [],
    gameFilmAutoTagging: Array.isArray(data.gameFilmAutoTagging) ? (data.gameFilmAutoTagging as string[]).map(String).filter(Boolean) : [],
    athleteCommandCenterNotes: Array.isArray(data.athleteCommandCenterNotes) ? (data.athleteCommandCenterNotes as string[]).map(String).filter(Boolean) : [],
  };
}

function requireAuth() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
}

function mapSimple<T>(docSnapshot: { id: string; data: () => Record<string, unknown> }, mapper: (id: string, data: Record<string, unknown>) => T) {
  return mapper(docSnapshot.id, docSnapshot.data() as Record<string, unknown>);
}

export async function createDrill(input: { title: string; category: string; description: string }) {
  requireAuth();
  await addDoc(collection(db!, "drills"), {
    ownerId: auth!.currentUser!.uid,
    title: input.title.trim(),
    category: input.category.trim(),
    description: input.description.trim(),
    savedBy: [],
    createdAt: serverTimestamp(),
  });
}

export async function getDrills() {
  if (!db) {
    return [];
  }
  const snapshot = await getDocs(query(collection(db, "drills"), limit(100)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      ownerId: String(data.ownerId ?? ""),
      title: String(data.title ?? ""),
      category: String(data.category ?? ""),
      description: String(data.description ?? ""),
      savedBy: Array.isArray(data.savedBy) ? (data.savedBy as string[]) : [],
    } satisfies DrillRecord))
  );
}

export async function saveDrill(drillId: string) {
  requireAuth();
  await updateDoc(doc(db!, "drills", drillId), {
    savedBy: arrayUnion(auth!.currentUser!.uid),
  });
}

export async function createTeamPracticePlan(input: {
  teamId: string;
  title: string;
  date: string;
  focus: string;
  drills: string[];
}) {
  requireAuth();
  await addDoc(collection(db!, "teamPracticePlans"), {
    teamId: input.teamId,
    title: input.title.trim(),
    date: input.date.trim(),
    focus: input.focus.trim(),
    drills: input.drills,
    coachIds: [auth!.currentUser!.uid],
    createdAt: serverTimestamp(),
  });
}

export async function getTeamPracticePlans(teamId: string) {
  if (!db) {
    return [];
  }
  const snapshot = await getDocs(query(collection(db, "teamPracticePlans"), where("teamId", "==", teamId), limit(30)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      title: String(data.title ?? ""),
      date: String(data.date ?? ""),
      focus: String(data.focus ?? ""),
      drills: Array.isArray(data.drills) ? (data.drills as string[]) : [],
      coachIds: Array.isArray(data.coachIds) ? (data.coachIds as string[]) : [],
    } satisfies TeamPracticePlanRecord))
  );
}

export async function createPlaybookBoard(input: { teamId: string; title: string; imageFile: File }) {
  requireAuth();
  const upload = await uploadToCloudinary(input.imageFile, `hooplink/playbooks/${input.teamId}`);
  await addDoc(collection(db!, "playbookBoards"), {
    teamId: input.teamId,
    title: input.title.trim(),
    imageUrl: upload.url,
    createdAt: serverTimestamp(),
  });
}

export async function getPlaybookBoards(teamId: string) {
  if (!db) {
    return [];
  }
  const snapshot = await getDocs(query(collection(db, "playbookBoards"), where("teamId", "==", teamId), limit(20)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      teamId: String(data.teamId ?? ""),
      title: String(data.title ?? ""),
      imageUrl: String(data.imageUrl ?? ""),
    } satisfies PlaybookBoardRecord))
  );
}

export async function upsertSkillProgress(input: { skillName: string; currentLevel: number; targetLevel: number }) {
  requireAuth();
  await addDoc(collection(db!, "skillProgress"), {
    userId: auth!.currentUser!.uid,
    skillName: input.skillName.trim(),
    currentLevel: input.currentLevel,
    targetLevel: input.targetLevel,
    updatedAt: serverTimestamp(),
  });
}

export async function getCurrentUserSkillProgress() {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "skillProgress"), where("userId", "==", auth!.currentUser!.uid), limit(40)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      userId: String(data.userId ?? ""),
      skillName: String(data.skillName ?? ""),
      currentLevel: Number(data.currentLevel ?? 0),
      targetLevel: Number(data.targetLevel ?? 10),
    } satisfies SkillProgressRecord))
  );
}

export async function addConditioningLog(input: { date: string; workoutType: string; durationMinutes: number; intensity: number }) {
  requireAuth();
  await addDoc(collection(db!, "conditioningLogs"), {
    userId: auth!.currentUser!.uid,
    date: input.date.trim(),
    workoutType: input.workoutType.trim(),
    durationMinutes: input.durationMinutes,
    intensity: input.intensity,
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserConditioningLogs() {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "conditioningLogs"), where("userId", "==", auth!.currentUser!.uid), limit(40)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      userId: String(data.userId ?? ""),
      date: String(data.date ?? ""),
      workoutType: String(data.workoutType ?? ""),
      durationMinutes: Number(data.durationMinutes ?? 0),
      intensity: Number(data.intensity ?? 0),
    } satisfies ConditioningLogRecord))
  );
}

export async function addNutritionJournalEntry(input: { date: string; meals: string; hydrationOz: number }) {
  requireAuth();
  await addDoc(collection(db!, "nutritionJournal"), {
    userId: auth!.currentUser!.uid,
    date: input.date.trim(),
    meals: input.meals.trim(),
    hydrationOz: input.hydrationOz,
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserNutritionJournal() {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "nutritionJournal"), where("userId", "==", auth!.currentUser!.uid), limit(40)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      userId: String(data.userId ?? ""),
      date: String(data.date ?? ""),
      meals: String(data.meals ?? ""),
      hydrationOz: Number(data.hydrationOz ?? 0),
    } satisfies NutritionJournalRecord))
  );
}

export async function createRecoveryAppointment(input: { hostId: string; hostName: string; type: "recovery" | "physio"; scheduledFor: string; note: string }) {
  requireAuth();
  await addDoc(collection(db!, "recoveryAppointments"), {
    requesterId: auth!.currentUser!.uid,
    hostId: input.hostId,
    hostName: input.hostName,
    type: input.type,
    scheduledFor: input.scheduledFor.trim(),
    note: input.note.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserRecoveryAppointments() {
  requireAuth();
  const [incoming, outgoing] = await Promise.all([
    getDocs(query(collection(db!, "recoveryAppointments"), where("hostId", "==", auth!.currentUser!.uid), limit(30))),
    getDocs(query(collection(db!, "recoveryAppointments"), where("requesterId", "==", auth!.currentUser!.uid), limit(30))),
  ]);
  const mapRecord = (docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      requesterId: String(data.requesterId ?? ""),
      hostId: String(data.hostId ?? ""),
      hostName: String(data.hostName ?? ""),
      type: data.type === "physio" ? "physio" : "recovery",
      scheduledFor: String(data.scheduledFor ?? ""),
      note: String(data.note ?? ""),
      status: data.status === "accepted" || data.status === "completed" ? data.status : "pending",
    } satisfies RecoveryAppointmentRecord));
  return {
    incoming: incoming.docs.map(mapRecord),
    outgoing: outgoing.docs.map(mapRecord),
  };
}

export async function addMedicalClearance(input: { title: string; imageFile: File }) {
  requireAuth();
  const upload = await uploadToCloudinary(input.imageFile, `hooplink/medical/${auth!.currentUser!.uid}`);
  await addDoc(collection(db!, "medicalClearances"), {
    userId: auth!.currentUser!.uid,
    title: input.title.trim(),
    imageUrl: upload.url,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserMedicalClearances() {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "medicalClearances"), where("userId", "==", auth!.currentUser!.uid), limit(20)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      userId: String(data.userId ?? ""),
      title: String(data.title ?? ""),
      imageUrl: String(data.imageUrl ?? ""),
      status: data.status === "cleared" ? "cleared" : "pending",
    } satisfies MedicalClearanceRecord))
  );
}

export async function saveReturnToPlayChecklist(input: { title: string; items: string[] }) {
  requireAuth();
  await setDoc(
    doc(db!, "returnToPlay", auth!.currentUser!.uid),
    {
      userId: auth!.currentUser!.uid,
      title: input.title.trim(),
      items: input.items.map((label) => ({ label, done: false })),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function toggleReturnToPlayItem(index: number, done: boolean) {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "returnToPlay"), where("userId", "==", auth!.currentUser!.uid), limit(1)));
  const match = snapshot.docs[0];
  if (!match) {
    return;
  }
  const data = match.data() as Record<string, unknown>;
  const items = Array.isArray(data.items) ? (data.items as Array<Record<string, unknown>>) : [];
  items[index] = { ...(items[index] ?? {}), done };
  await updateDoc(doc(db!, "returnToPlay", match.id), { items });
}

export async function getCurrentUserReturnToPlayChecklist() {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "returnToPlay"), where("userId", "==", auth!.currentUser!.uid), limit(1)));
  const match = snapshot.docs[0];
  if (!match) {
    return null;
  }
  const data = match.data() as Record<string, unknown>;
  return {
    id: match.id,
    userId: String(data.userId ?? ""),
    title: String(data.title ?? ""),
    items: Array.isArray(data.items)
      ? (data.items as Array<Record<string, unknown>>).map((item) => ({
          label: String(item.label ?? ""),
          done: item.done === true,
        }))
      : [],
  } satisfies ReturnToPlayChecklistRecord;
}

export async function addRehabAssignment(input: { title: string; notes: string }) {
  requireAuth();
  await addDoc(collection(db!, "rehabAssignments"), {
    userId: auth!.currentUser!.uid,
    coachName: auth!.currentUser!.displayName || "Coach",
    title: input.title.trim(),
    notes: input.notes.trim(),
    completed: false,
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserRehabAssignments() {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "rehabAssignments"), where("userId", "==", auth!.currentUser!.uid), limit(30)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      userId: String(data.userId ?? ""),
      coachName: String(data.coachName ?? ""),
      title: String(data.title ?? ""),
      notes: String(data.notes ?? ""),
      completed: data.completed === true,
    } satisfies RehabAssignmentRecord))
  );
}

export async function addCoachCheckIn(input: { reflection: string; burnoutScore: number }) {
  requireAuth();
  await addDoc(collection(db!, "coachCheckIns"), {
    userId: auth!.currentUser!.uid,
    coachUid: auth!.currentUser!.uid,
    coachName: auth!.currentUser!.displayName || "Coach",
    reflection: input.reflection.trim(),
    burnoutScore: input.burnoutScore,
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserCoachCheckIns() {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "coachCheckIns"), where("userId", "==", auth!.currentUser!.uid), limit(30)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      userId: String(data.userId ?? ""),
      coachUid: String(data.coachUid ?? ""),
      coachName: String(data.coachName ?? ""),
      reflection: String(data.reflection ?? ""),
      burnoutScore: Number(data.burnoutScore ?? 0),
    } satisfies CoachCheckInRecord))
  );
}

export async function createGoal(input: { title: string; category: string; target: number }) {
  requireAuth();
  await addDoc(collection(db!, "trainingGoals"), {
    userId: auth!.currentUser!.uid,
    title: input.title.trim(),
    category: input.category.trim(),
    progress: 0,
    target: input.target,
    createdAt: serverTimestamp(),
  });
}

export async function updateGoalProgress(goalId: string, progress: number) {
  requireAuth();
  await updateDoc(doc(db!, "trainingGoals", goalId), { progress });
}

export async function getCurrentUserGoals() {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "trainingGoals"), where("userId", "==", auth!.currentUser!.uid), limit(30)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapSimple(docSnapshot, (id, data) => ({
      id,
      userId: String(data.userId ?? ""),
      title: String(data.title ?? ""),
      category: String(data.category ?? ""),
      progress: Number(data.progress ?? 0),
      target: Number(data.target ?? 1),
    } satisfies GoalRecord))
  );
}

export async function getPracticeAttendanceStreak() {
  requireAuth();
  const snapshot = await getDocs(query(collection(db!, "teamAttendance"), where("memberUid", "==", auth!.currentUser!.uid), limit(100)));
  return snapshot.docs.filter((docSnapshot: { data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return data.status === "present" || data.status === "late";
  }).length;
}

export async function getAthleteDevelopmentProfile() {
  requireAuth();
  const snapshot = await getDocs(
    query(collection(db!, "athleteDevelopment"), where("userId", "==", auth!.currentUser!.uid), limit(1))
  );
  const match = snapshot.docs[0];
  if (!match) {
    const fallback = createDefaultDevelopmentProfile(auth!.currentUser!.uid);
    await addDoc(collection(db!, "athleteDevelopment"), {
      ...fallback,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return fallback;
  }

  return mapDevelopmentProfile(auth!.currentUser!.uid, match.data() as Record<string, unknown>);
}

export async function saveAthleteDevelopmentProfile(
  values: Partial<AthleteDevelopmentProfile>
) {
  requireAuth();
  const snapshot = await getDocs(
    query(collection(db!, "athleteDevelopment"), where("userId", "==", auth!.currentUser!.uid), limit(1))
  );
  const match = snapshot.docs[0];
  if (match) {
    await updateDoc(doc(db!, "athleteDevelopment", match.id), {
      ...values,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await addDoc(collection(db!, "athleteDevelopment"), {
    ...createDefaultDevelopmentProfile(auth!.currentUser!.uid),
    ...values,
    userId: auth!.currentUser!.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function addFormAnalysisUpload(input: { title: string; notes: string; mediaFile: File }) {
  requireAuth();
  const upload = await uploadToCloudinary(input.mediaFile, `hooplink/form-analysis/${auth!.currentUser!.uid}`);
  const profile = await getAthleteDevelopmentProfile();
  await saveAthleteDevelopmentProfile({
    formAnalyses: [
      ...profile.formAnalyses,
      {
        id: `form-${Date.now()}`,
        title: input.title.trim(),
        mediaUrl: upload.url,
        notes: input.notes.trim(),
      },
    ],
  });
}
