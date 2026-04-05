import { updateProfile as updateFirebaseProfile } from "firebase/auth";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import { recordFollowerGrowth } from "@/lib/profile-analytics";

export type HoopLinkRole = "athlete" | "coach" | "scout" | "fan";
export type OnboardingGoal =
  | "get_recruited"
  | "grow_audience"
  | "book_sessions"
  | "join_team"
  | "discover_talent";

export type AccessibilityMode = "default" | "high_visibility" | "voice_ready";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "elite";
export type AgeGroup = "under_13" | "teen" | "college" | "adult";

export interface UserSetupPreferences {
  primarySport?: string | null;
  skillLevel?: SkillLevel | null;
  ageGroup?: AgeGroup | null;
  guardianMode?: boolean;
  teamInviteCode?: string | null;
  clubInviteCode?: string | null;
  schoolInviteCode?: string | null;
  importedSources?: string[];
  accessibilityMode?: AccessibilityMode;
  biggerText?: boolean;
  highContrast?: boolean;
  reduceMotion?: boolean;
  voiceNavigationHelp?: boolean;
  locale?: string | null;
  notificationWizardCompleted?: boolean;
  quickCreateEnabled?: boolean;
  focusMode?: boolean;
  searchPreferences?: string[];
  homeWidgets?: string[];
  welcomeChecklistDismissed?: boolean;
}

export interface AcademicProfileInput {
  gpa?: string;
  testScores?: string[];
  transcriptLinks?: string[];
  eligibilityStatus?: string;
  schoolHistory?: string[];
  clubHistory?: string[];
  campHistory?: string[];
  visitHistory?: string[];
  offerHistory?: string[];
  resumeBullets?: string[];
  careerGoals?: string[];
}

export interface ProfileSignalsInput {
  profileVisits?: number;
  scoutVisits?: number;
  recruiterEngagementScore?: number;
  audienceGrowthScore?: number;
  creatorTrustScore?: number;
  sponsorReadinessScore?: number;
  profileCompletenessScore?: number;
  comparisonNotes?: string[];
}

export interface ProfileCommunityInput {
  guestbook?: string[];
  fanComments?: string[];
  teamEndorsements?: string[];
  parentNotes?: string[];
  mentorNotes?: string[];
  recommendationRequests?: string[];
  recommendationVault?: string[];
  verifiedDocuments?: string[];
  favoriteBrands?: string[];
  sponsorshipInterests?: string[];
  partnershipHistory?: string[];
  contactPreference?: string;
  publicAvailability?: string[];
  roleTabs?: string[];
  localLanguageBio?: string;
  nickname?: string;
  signatureLine?: string;
}

export interface AthleticMeasurementsInput {
  wingspan?: string;
  weight?: string;
  verticalLeap?: string;
  sprintTime?: string;
}

export interface UserOnboardingState {
  goals: OnboardingGoal[];
  completed: boolean;
  completedSteps: string[];
  lastCompletedStep: "role" | "profile" | "dashboard";
  completedAt?: unknown;
  walkthroughCompleted?: boolean;
  walkthroughDismissed?: boolean;
  setupRewardSeen?: boolean;
}

export interface CompleteProfileInput {
  role: HoopLinkRole;
  sport: string;
  bio: string;
  username?: string;
  position?: string;
  team?: string;
  experience?: string;
  age?: number;
  height?: string;
  location?: string;
  stats?: {
    pointsPerGame?: number;
    assistsPerGame?: number;
    reboundsPerGame?: number;
  };
  skills?: string[];
  achievements?: string[];
  gameLogs?: Array<{
    opponent: string;
    date: string;
    points?: number;
    assists?: number;
    rebounds?: number;
    result?: string;
  }>;
  identity?: {
    tagline?: string;
    pronouns?: string;
    hometown?: string;
    gradYear?: string;
    website?: string;
    instagram?: string;
    quote?: string;
  };
  milestones?: Array<{
    title: string;
    date?: string;
    detail?: string;
  }>;
  profileExtras?: {
    introVideoUrl?: string;
    audioIntroUrl?: string;
    askMeAbout?: string[];
    teamHistory?: Array<{
      season?: string;
      team?: string;
      detail?: string;
    }>;
    injuryStatus?: string;
    recruitingAvailable?: boolean;
    transferInterest?: boolean;
    nilInterest?: boolean;
    parentManaged?: boolean;
    sponsorshipDeckUrl?: string;
    linkBio?: Array<{
      label?: string;
      url?: string;
    }>;
    coachEndorsements?: string[];
    peerEndorsements?: string[];
  };
  goals?: OnboardingGoal[];
  onboardingCompleted?: boolean;
  completedSteps?: string[];
  lastCompletedStep?: "role" | "profile" | "dashboard";
  pinnedShortcuts?: string[];
  setupPreferences?: UserSetupPreferences;
  academicProfile?: AcademicProfileInput;
  profileSignals?: ProfileSignalsInput;
  profileCommunity?: ProfileCommunityInput;
  athleticMeasurements?: AthleticMeasurementsInput;
}

export interface SearchProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  username?: string | null;
  coverPhotoURL?: string | null;
  profileTheme?: string | null;
  verified: boolean;
  followers: string[];
  following: string[];
  location?: string | null;
  role?: {
    type?: string | null;
    sport?: string | null;
    position?: string | null;
    team?: string | null;
    experience?: string | null;
    bio?: string | null;
    age?: number | null;
    height?: string | null;
  };
  athleteProfile?: {
    stats?: {
      pointsPerGame?: number | null;
      assistsPerGame?: number | null;
      reboundsPerGame?: number | null;
    };
    skills?: string[];
    achievements?: string[];
    gameLogs?: Array<{
      opponent?: string | null;
      date?: string | null;
      points?: number | null;
      assists?: number | null;
      rebounds?: number | null;
      result?: string | null;
    }>;
  };
  identity?: {
    tagline?: string | null;
    pronouns?: string | null;
    hometown?: string | null;
    gradYear?: string | null;
    website?: string | null;
    instagram?: string | null;
    quote?: string | null;
  };
  milestones?: Array<{
    title?: string | null;
    date?: string | null;
    detail?: string | null;
  }>;
  profileExtras?: {
    introVideoUrl?: string | null;
    audioIntroUrl?: string | null;
    askMeAbout?: string[];
    teamHistory?: Array<{
      season?: string | null;
      team?: string | null;
      detail?: string | null;
    }>;
    injuryStatus?: string | null;
    recruitingAvailable?: boolean;
    transferInterest?: boolean;
    nilInterest?: boolean;
    parentManaged?: boolean;
    sponsorshipDeckUrl?: string | null;
    linkBio?: Array<{
      label?: string | null;
      url?: string | null;
    }>;
    coachEndorsements?: string[];
    peerEndorsements?: string[];
  };
  onboarding?: UserOnboardingState;
  pinnedShortcuts?: string[];
  followedTopics?: string[];
  setupPreferences?: UserSetupPreferences;
  academicProfile?: AcademicProfileInput;
  profileSignals?: ProfileSignalsInput;
  profileCommunity?: ProfileCommunityInput;
  athleticMeasurements?: AthleticMeasurementsInput;
}

export interface ProfileCompletionSummary {
  score: number;
  completedCount: number;
  totalCount: number;
  missingFields: string[];
}

export interface PostAuthDestination {
  destination: "/role-selection" | "/complete-profile" | "/dashboard";
  completion: ProfileCompletionSummary;
  profile: Record<string, unknown> | null;
}

async function ensureUsernameAvailable(username: string, currentUid?: string) {
  if (!db) {
    return;
  }

  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!normalized) {
    throw new Error("Username is required.");
  }

  const snapshot = await getDocs(query(collection(db, "users"), limit(100)));
  const taken = snapshot.docs.some((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return (
      docSnapshot.id !== currentUid &&
      String(data.username ?? "").toLowerCase() === normalized
    );
  });

  if (taken) {
    throw new Error("That username is already taken.");
  }
}

function normalizeUsername(input: string, fallbackUid: string) {
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return normalized || fallbackUid.slice(0, 8).toLowerCase();
}

export async function saveUserProfile(input: CompleteProfileInput) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in and Firebase must be configured.");
  }

  const user = auth.currentUser;
  const trimmedSport = input.sport.trim();
  const trimmedBio = input.bio.trim();
  const trimmedPosition = input.position?.trim() ?? "";
  const trimmedTeam = input.team?.trim() ?? "";
  const trimmedExperience = input.experience?.trim() ?? "";
  const trimmedHeight = input.height?.trim() ?? "";
  const trimmedLocation = input.location?.trim() ?? "";
  const normalizedUsername = normalizeUsername(input.username ?? "", user.uid);

  await ensureUsernameAvailable(normalizedUsername, user.uid);

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      username: normalizedUsername,
      coverPhotoURL: "",
      profileTheme: "classic",
      role: {
        type: input.role,
        sport: trimmedSport,
        position: trimmedPosition || null,
        team: trimmedTeam || null,
        experience: trimmedExperience || null,
        age: input.age ?? null,
        height: trimmedHeight || null,
        bio: trimmedBio,
      },
      followers: [],
      following: [],
      savedPosts: [],
      postsCount: 0,
      reelsCount: 0,
      verified: false,
      athleteProfile: {
        stats: {
          pointsPerGame: input.stats?.pointsPerGame ?? null,
          assistsPerGame: input.stats?.assistsPerGame ?? null,
          reboundsPerGame: input.stats?.reboundsPerGame ?? null,
        },
        skills: input.skills ?? [],
        achievements: input.achievements ?? [],
        gameLogs: input.gameLogs ?? [],
      },
      identity: {
        tagline: input.identity?.tagline?.trim() || null,
        pronouns: input.identity?.pronouns?.trim() || null,
        hometown: input.identity?.hometown?.trim() || null,
        gradYear: input.identity?.gradYear?.trim() || null,
        website: input.identity?.website?.trim() || null,
        instagram: input.identity?.instagram?.trim() || null,
        quote: input.identity?.quote?.trim() || null,
      },
      milestones: (input.milestones ?? [])
        .map((item) => ({
          title: item.title.trim(),
          date: item.date?.trim() || null,
          detail: item.detail?.trim() || null,
        }))
        .filter((item) => item.title),
      profileExtras: {
        introVideoUrl: input.profileExtras?.introVideoUrl?.trim() || null,
        audioIntroUrl: input.profileExtras?.audioIntroUrl?.trim() || null,
        askMeAbout: (input.profileExtras?.askMeAbout ?? []).map((item) => item.trim()).filter(Boolean),
        teamHistory: (input.profileExtras?.teamHistory ?? [])
          .map((item) => ({
            season: item.season?.trim() || null,
            team: item.team?.trim() || null,
            detail: item.detail?.trim() || null,
          }))
          .filter((item) => item.team || item.season || item.detail),
        injuryStatus: input.profileExtras?.injuryStatus?.trim() || null,
        recruitingAvailable: input.profileExtras?.recruitingAvailable === true,
        transferInterest: input.profileExtras?.transferInterest === true,
        nilInterest: input.profileExtras?.nilInterest === true,
        parentManaged: input.profileExtras?.parentManaged === true,
        sponsorshipDeckUrl: input.profileExtras?.sponsorshipDeckUrl?.trim() || null,
        linkBio: (input.profileExtras?.linkBio ?? [])
          .map((item) => ({
            label: item.label?.trim() || null,
            url: item.url?.trim() || null,
          }))
          .filter((item) => item.label || item.url),
        coachEndorsements: (input.profileExtras?.coachEndorsements ?? []).map((item) => item.trim()).filter(Boolean),
        peerEndorsements: (input.profileExtras?.peerEndorsements ?? []).map((item) => item.trim()).filter(Boolean),
      },
      academicProfile: {
        gpa: input.academicProfile?.gpa?.trim() || null,
        testScores: (input.academicProfile?.testScores ?? []).map((item) => item.trim()).filter(Boolean),
        transcriptLinks: (input.academicProfile?.transcriptLinks ?? []).map((item) => item.trim()).filter(Boolean),
        eligibilityStatus: input.academicProfile?.eligibilityStatus?.trim() || null,
        schoolHistory: (input.academicProfile?.schoolHistory ?? []).map((item) => item.trim()).filter(Boolean),
        clubHistory: (input.academicProfile?.clubHistory ?? []).map((item) => item.trim()).filter(Boolean),
        campHistory: (input.academicProfile?.campHistory ?? []).map((item) => item.trim()).filter(Boolean),
        visitHistory: (input.academicProfile?.visitHistory ?? []).map((item) => item.trim()).filter(Boolean),
        offerHistory: (input.academicProfile?.offerHistory ?? []).map((item) => item.trim()).filter(Boolean),
        resumeBullets: (input.academicProfile?.resumeBullets ?? []).map((item) => item.trim()).filter(Boolean),
        careerGoals: (input.academicProfile?.careerGoals ?? []).map((item) => item.trim()).filter(Boolean),
      },
      profileSignals: {
        profileVisits: input.profileSignals?.profileVisits ?? 0,
        scoutVisits: input.profileSignals?.scoutVisits ?? 0,
        recruiterEngagementScore: input.profileSignals?.recruiterEngagementScore ?? 0,
        audienceGrowthScore: input.profileSignals?.audienceGrowthScore ?? 0,
        creatorTrustScore: input.profileSignals?.creatorTrustScore ?? 0,
        sponsorReadinessScore: input.profileSignals?.sponsorReadinessScore ?? 0,
        profileCompletenessScore: input.profileSignals?.profileCompletenessScore ?? 0,
        comparisonNotes: (input.profileSignals?.comparisonNotes ?? []).map((item) => item.trim()).filter(Boolean),
      },
      profileCommunity: {
        guestbook: (input.profileCommunity?.guestbook ?? []).map((item) => item.trim()).filter(Boolean),
        fanComments: (input.profileCommunity?.fanComments ?? []).map((item) => item.trim()).filter(Boolean),
        teamEndorsements: (input.profileCommunity?.teamEndorsements ?? []).map((item) => item.trim()).filter(Boolean),
        parentNotes: (input.profileCommunity?.parentNotes ?? []).map((item) => item.trim()).filter(Boolean),
        mentorNotes: (input.profileCommunity?.mentorNotes ?? []).map((item) => item.trim()).filter(Boolean),
        recommendationRequests: (input.profileCommunity?.recommendationRequests ?? []).map((item) => item.trim()).filter(Boolean),
        recommendationVault: (input.profileCommunity?.recommendationVault ?? []).map((item) => item.trim()).filter(Boolean),
        verifiedDocuments: (input.profileCommunity?.verifiedDocuments ?? []).map((item) => item.trim()).filter(Boolean),
        favoriteBrands: (input.profileCommunity?.favoriteBrands ?? []).map((item) => item.trim()).filter(Boolean),
        sponsorshipInterests: (input.profileCommunity?.sponsorshipInterests ?? []).map((item) => item.trim()).filter(Boolean),
        partnershipHistory: (input.profileCommunity?.partnershipHistory ?? []).map((item) => item.trim()).filter(Boolean),
        contactPreference: input.profileCommunity?.contactPreference?.trim() || null,
        publicAvailability: (input.profileCommunity?.publicAvailability ?? []).map((item) => item.trim()).filter(Boolean),
        roleTabs: (input.profileCommunity?.roleTabs ?? []).map((item) => item.trim()).filter(Boolean),
        localLanguageBio: input.profileCommunity?.localLanguageBio?.trim() || null,
        nickname: input.profileCommunity?.nickname?.trim() || null,
        signatureLine: input.profileCommunity?.signatureLine?.trim() || null,
      },
      athleticMeasurements: {
        wingspan: input.athleticMeasurements?.wingspan?.trim() || null,
        weight: input.athleticMeasurements?.weight?.trim() || null,
        verticalLeap: input.athleticMeasurements?.verticalLeap?.trim() || null,
        sprintTime: input.athleticMeasurements?.sprintTime?.trim() || null,
      },
      onboarding: {
        goals: input.goals ?? [],
        completed: input.onboardingCompleted ?? false,
        completedSteps: input.completedSteps ?? [],
        lastCompletedStep: input.lastCompletedStep ?? "role",
        completedAt: input.onboardingCompleted ? serverTimestamp() : null,
        walkthroughCompleted: false,
        walkthroughDismissed: false,
        setupRewardSeen: false,
      },
      pinnedShortcuts: input.pinnedShortcuts ?? [],
      setupPreferences: {
        primarySport: input.setupPreferences?.primarySport?.trim() || trimmedSport || null,
        skillLevel: input.setupPreferences?.skillLevel ?? null,
        ageGroup: input.setupPreferences?.ageGroup ?? null,
        guardianMode: input.setupPreferences?.guardianMode === true,
        teamInviteCode: input.setupPreferences?.teamInviteCode?.trim() || null,
        clubInviteCode: input.setupPreferences?.clubInviteCode?.trim() || null,
        schoolInviteCode: input.setupPreferences?.schoolInviteCode?.trim() || null,
        importedSources: input.setupPreferences?.importedSources ?? [],
        accessibilityMode: input.setupPreferences?.accessibilityMode ?? "default",
        biggerText: input.setupPreferences?.biggerText === true,
        highContrast: input.setupPreferences?.highContrast === true,
        reduceMotion: input.setupPreferences?.reduceMotion === true,
        voiceNavigationHelp: input.setupPreferences?.voiceNavigationHelp === true,
        locale: input.setupPreferences?.locale?.trim() || null,
        notificationWizardCompleted: input.setupPreferences?.notificationWizardCompleted === true,
        quickCreateEnabled: input.setupPreferences?.quickCreateEnabled !== false,
        focusMode: input.setupPreferences?.focusMode === true,
        searchPreferences: input.setupPreferences?.searchPreferences ?? [],
        homeWidgets: input.setupPreferences?.homeWidgets ?? [],
        welcomeChecklistDismissed: input.setupPreferences?.welcomeChecklistDismissed === true,
      },
      location: trimmedLocation || null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveOnboardingPreferences(input: {
  role: HoopLinkRole;
  goals: OnboardingGoal[];
  primarySport?: string;
  skillLevel?: SkillLevel;
  ageGroup?: AgeGroup;
  guardianMode?: boolean;
  teamInviteCode?: string;
  clubInviteCode?: string;
  schoolInviteCode?: string;
  importedSources?: string[];
  accessibilityMode?: AccessibilityMode;
  biggerText?: boolean;
  highContrast?: boolean;
  reduceMotion?: boolean;
  voiceNavigationHelp?: boolean;
  quickCreateEnabled?: boolean;
  focusMode?: boolean;
  locale?: string;
  notificationWizardCompleted?: boolean;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in and Firebase must be configured.");
  }

  const user = auth.currentUser;
  const goals = Array.from(new Set(input.goals));

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      username: user.uid.slice(0, 8).toLowerCase(),
      role: {
        type: input.role,
      },
      onboarding: {
        goals,
        completed: false,
        completedSteps: ["role"],
        lastCompletedStep: "role",
        completedAt: null,
        walkthroughCompleted: false,
        walkthroughDismissed: false,
        setupRewardSeen: false,
      },
      setupPreferences: {
        primarySport: input.primarySport?.trim() || null,
        skillLevel: input.skillLevel ?? null,
        ageGroup: input.ageGroup ?? null,
        guardianMode: input.guardianMode === true,
        teamInviteCode: input.teamInviteCode?.trim() || null,
        clubInviteCode: input.clubInviteCode?.trim() || null,
        schoolInviteCode: input.schoolInviteCode?.trim() || null,
        importedSources: input.importedSources ?? [],
        accessibilityMode: input.accessibilityMode ?? "default",
        biggerText: input.biggerText === true,
        highContrast: input.highContrast === true,
        reduceMotion: input.reduceMotion === true,
        voiceNavigationHelp: input.voiceNavigationHelp === true,
        quickCreateEnabled: input.quickCreateEnabled !== false,
        focusMode: input.focusMode === true,
        locale: input.locale?.trim() || null,
        notificationWizardCompleted: input.notificationWizardCompleted === true,
        searchPreferences: [],
        homeWidgets: [],
        welcomeChecklistDismissed: false,
      },
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateCurrentUserProfile(input: {
  displayName: string;
  username?: string;
  sport: string;
  bio: string;
  position?: string;
  team?: string;
  experience?: string;
  age?: number;
  height?: string;
  location?: string;
  avatarFile?: File | null;
  coverPhotoFile?: File | null;
  profileTheme?: string;
  identity?: {
    tagline?: string;
    pronouns?: string;
    hometown?: string;
    gradYear?: string;
    website?: string;
    instagram?: string;
    quote?: string;
  };
  milestones?: Array<{
    title: string;
    date?: string;
    detail?: string;
  }>;
  profileExtras?: {
    introVideoUrl?: string;
    audioIntroUrl?: string;
    askMeAbout?: string[];
    teamHistory?: Array<{
      season?: string;
      team?: string;
      detail?: string;
    }>;
    injuryStatus?: string;
    recruitingAvailable?: boolean;
    transferInterest?: boolean;
    nilInterest?: boolean;
    parentManaged?: boolean;
    sponsorshipDeckUrl?: string;
    linkBio?: Array<{
      label?: string;
      url?: string;
    }>;
    coachEndorsements?: string[];
    peerEndorsements?: string[];
  };
  stats?: {
    pointsPerGame?: number;
    assistsPerGame?: number;
    reboundsPerGame?: number;
  };
  skills?: string[];
  achievements?: string[];
  gameLogs?: Array<{
    opponent: string;
    date: string;
    points?: number;
    assists?: number;
    rebounds?: number;
    result?: string;
  }>;
  academicProfile?: AcademicProfileInput;
  profileSignals?: ProfileSignalsInput;
  profileCommunity?: ProfileCommunityInput;
  athleticMeasurements?: AthleticMeasurementsInput;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in and Firebase must be configured.");
  }

  const user = auth.currentUser;
  let photoURL = user.photoURL ?? "";
  let coverPhotoURL = "";

  const currentProfileSnapshot = await getDoc(doc(db, "users", user.uid));
  const currentProfile = currentProfileSnapshot.exists()
    ? (currentProfileSnapshot.data() as Record<string, unknown>)
    : null;
  coverPhotoURL = String(currentProfile?.coverPhotoURL ?? "");
  const normalizedUsername = normalizeUsername(input.username ?? String(currentProfile?.username ?? ""), user.uid);

  await ensureUsernameAvailable(normalizedUsername, user.uid);

  if (input.avatarFile) {
    const uploadedAvatar = await uploadToCloudinary(
      input.avatarFile,
      `hooplink/avatars/${user.uid}`
    );
    photoURL = uploadedAvatar.url;
  }

  if (input.coverPhotoFile) {
    const uploadedCover = await uploadToCloudinary(
      input.coverPhotoFile,
      `hooplink/covers/${user.uid}`
    );
    coverPhotoURL = uploadedCover.url;
  }

  await updateFirebaseProfile(user as never, {
    displayName: input.displayName.trim(),
    photoURL: photoURL || null,
  } as never);

  await setDoc(
    doc(db, "users", user.uid),
    {
      displayName: input.displayName.trim(),
      photoURL,
      username: normalizedUsername,
      coverPhotoURL,
      profileTheme: input.profileTheme?.trim() || String(currentProfile?.profileTheme ?? "classic"),
      role: {
        sport: input.sport.trim(),
        position: input.position?.trim() || null,
        team: input.team?.trim() || null,
        experience: input.experience?.trim() || null,
        age: input.age ?? null,
        height: input.height?.trim() || null,
        bio: input.bio.trim(),
      },
      athleteProfile: {
        stats: {
          pointsPerGame: input.stats?.pointsPerGame ?? null,
          assistsPerGame: input.stats?.assistsPerGame ?? null,
          reboundsPerGame: input.stats?.reboundsPerGame ?? null,
        },
        skills: input.skills ?? [],
        achievements: input.achievements ?? [],
        gameLogs: input.gameLogs ?? [],
      },
      identity: {
        tagline: input.identity?.tagline?.trim() || null,
        pronouns: input.identity?.pronouns?.trim() || null,
        hometown: input.identity?.hometown?.trim() || null,
        gradYear: input.identity?.gradYear?.trim() || null,
        website: input.identity?.website?.trim() || null,
        instagram: input.identity?.instagram?.trim() || null,
        quote: input.identity?.quote?.trim() || null,
      },
      milestones: (input.milestones ?? [])
        .map((item) => ({
          title: item.title.trim(),
          date: item.date?.trim() || null,
          detail: item.detail?.trim() || null,
        }))
        .filter((item) => item.title),
      profileExtras: {
        introVideoUrl: input.profileExtras?.introVideoUrl?.trim() || null,
        audioIntroUrl: input.profileExtras?.audioIntroUrl?.trim() || null,
        askMeAbout: (input.profileExtras?.askMeAbout ?? []).map((item) => item.trim()).filter(Boolean),
        teamHistory: (input.profileExtras?.teamHistory ?? [])
          .map((item) => ({
            season: item.season?.trim() || null,
            team: item.team?.trim() || null,
            detail: item.detail?.trim() || null,
          }))
          .filter((item) => item.team || item.season || item.detail),
        injuryStatus: input.profileExtras?.injuryStatus?.trim() || null,
        recruitingAvailable: input.profileExtras?.recruitingAvailable === true,
        transferInterest: input.profileExtras?.transferInterest === true,
        nilInterest: input.profileExtras?.nilInterest === true,
        parentManaged: input.profileExtras?.parentManaged === true,
        sponsorshipDeckUrl: input.profileExtras?.sponsorshipDeckUrl?.trim() || null,
        linkBio: (input.profileExtras?.linkBio ?? [])
          .map((item) => ({
            label: item.label?.trim() || null,
            url: item.url?.trim() || null,
          }))
          .filter((item) => item.label || item.url),
        coachEndorsements: (input.profileExtras?.coachEndorsements ?? []).map((item) => item.trim()).filter(Boolean),
        peerEndorsements: (input.profileExtras?.peerEndorsements ?? []).map((item) => item.trim()).filter(Boolean),
      },
      academicProfile: {
        gpa: input.academicProfile?.gpa?.trim() || null,
        testScores: (input.academicProfile?.testScores ?? []).map((item) => item.trim()).filter(Boolean),
        transcriptLinks: (input.academicProfile?.transcriptLinks ?? []).map((item) => item.trim()).filter(Boolean),
        eligibilityStatus: input.academicProfile?.eligibilityStatus?.trim() || null,
        schoolHistory: (input.academicProfile?.schoolHistory ?? []).map((item) => item.trim()).filter(Boolean),
        clubHistory: (input.academicProfile?.clubHistory ?? []).map((item) => item.trim()).filter(Boolean),
        campHistory: (input.academicProfile?.campHistory ?? []).map((item) => item.trim()).filter(Boolean),
        visitHistory: (input.academicProfile?.visitHistory ?? []).map((item) => item.trim()).filter(Boolean),
        offerHistory: (input.academicProfile?.offerHistory ?? []).map((item) => item.trim()).filter(Boolean),
        resumeBullets: (input.academicProfile?.resumeBullets ?? []).map((item) => item.trim()).filter(Boolean),
        careerGoals: (input.academicProfile?.careerGoals ?? []).map((item) => item.trim()).filter(Boolean),
      },
      profileSignals: {
        profileVisits: input.profileSignals?.profileVisits ?? 0,
        scoutVisits: input.profileSignals?.scoutVisits ?? 0,
        recruiterEngagementScore: input.profileSignals?.recruiterEngagementScore ?? 0,
        audienceGrowthScore: input.profileSignals?.audienceGrowthScore ?? 0,
        creatorTrustScore: input.profileSignals?.creatorTrustScore ?? 0,
        sponsorReadinessScore: input.profileSignals?.sponsorReadinessScore ?? 0,
        profileCompletenessScore: input.profileSignals?.profileCompletenessScore ?? 0,
        comparisonNotes: (input.profileSignals?.comparisonNotes ?? []).map((item) => item.trim()).filter(Boolean),
      },
      profileCommunity: {
        guestbook: (input.profileCommunity?.guestbook ?? []).map((item) => item.trim()).filter(Boolean),
        fanComments: (input.profileCommunity?.fanComments ?? []).map((item) => item.trim()).filter(Boolean),
        teamEndorsements: (input.profileCommunity?.teamEndorsements ?? []).map((item) => item.trim()).filter(Boolean),
        parentNotes: (input.profileCommunity?.parentNotes ?? []).map((item) => item.trim()).filter(Boolean),
        mentorNotes: (input.profileCommunity?.mentorNotes ?? []).map((item) => item.trim()).filter(Boolean),
        recommendationRequests: (input.profileCommunity?.recommendationRequests ?? []).map((item) => item.trim()).filter(Boolean),
        recommendationVault: (input.profileCommunity?.recommendationVault ?? []).map((item) => item.trim()).filter(Boolean),
        verifiedDocuments: (input.profileCommunity?.verifiedDocuments ?? []).map((item) => item.trim()).filter(Boolean),
        favoriteBrands: (input.profileCommunity?.favoriteBrands ?? []).map((item) => item.trim()).filter(Boolean),
        sponsorshipInterests: (input.profileCommunity?.sponsorshipInterests ?? []).map((item) => item.trim()).filter(Boolean),
        partnershipHistory: (input.profileCommunity?.partnershipHistory ?? []).map((item) => item.trim()).filter(Boolean),
        contactPreference: input.profileCommunity?.contactPreference?.trim() || null,
        publicAvailability: (input.profileCommunity?.publicAvailability ?? []).map((item) => item.trim()).filter(Boolean),
        roleTabs: (input.profileCommunity?.roleTabs ?? []).map((item) => item.trim()).filter(Boolean),
        localLanguageBio: input.profileCommunity?.localLanguageBio?.trim() || null,
        nickname: input.profileCommunity?.nickname?.trim() || null,
        signatureLine: input.profileCommunity?.signatureLine?.trim() || null,
      },
      athleticMeasurements: {
        wingspan: input.athleticMeasurements?.wingspan?.trim() || null,
        weight: input.athleticMeasurements?.weight?.trim() || null,
        verticalLeap: input.athleticMeasurements?.verticalLeap?.trim() || null,
        sprintTime: input.athleticMeasurements?.sprintTime?.trim() || null,
      },
      location: input.location?.trim() || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getCurrentUserProfile() {
  if (!auth?.currentUser || !db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveDashboardPreferences(input: {
  pinnedShortcuts?: string[];
  homeWidgets?: string[];
  searchPreferences?: string[];
  focusMode?: boolean;
  walkthroughCompleted?: boolean;
  walkthroughDismissed?: boolean;
  setupRewardSeen?: boolean;
  welcomeChecklistDismissed?: boolean;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in and Firebase must be configured.");
  }

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      ...(input.pinnedShortcuts ? { pinnedShortcuts: input.pinnedShortcuts } : {}),
      setupPreferences: {
        ...(input.homeWidgets ? { homeWidgets: input.homeWidgets } : {}),
        ...(input.searchPreferences ? { searchPreferences: input.searchPreferences } : {}),
        ...(typeof input.focusMode === "boolean" ? { focusMode: input.focusMode } : {}),
        ...(typeof input.welcomeChecklistDismissed === "boolean"
          ? { welcomeChecklistDismissed: input.welcomeChecklistDismissed }
          : {}),
      },
      onboarding: {
        ...(typeof input.walkthroughCompleted === "boolean"
          ? { walkthroughCompleted: input.walkthroughCompleted }
          : {}),
        ...(typeof input.walkthroughDismissed === "boolean"
          ? { walkthroughDismissed: input.walkthroughDismissed }
          : {}),
        ...(typeof input.setupRewardSeen === "boolean"
          ? { setupRewardSeen: input.setupRewardSeen }
          : {}),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function getProfileCompletionSummary(
  profile: Record<string, unknown> | null | undefined
): ProfileCompletionSummary {
  const role = (profile?.role as Record<string, unknown> | undefined) ?? {};
  const onboarding = (profile?.onboarding as Record<string, unknown> | undefined) ?? {};
  const checks = [
    { field: "role", value: role.type },
    { field: "sport", value: role.sport },
    { field: "bio", value: role.bio },
    { field: "location", value: profile?.location },
    { field: "goals", value: Array.isArray(onboarding.goals) && onboarding.goals.length > 0 ? onboarding.goals : null },
    { field: "username", value: profile?.username },
  ];

  const completedCount = checks.filter(({ value }) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return Boolean(String(value ?? "").trim());
  }).length;

  return {
    score: Math.round((completedCount / checks.length) * 100),
    completedCount,
    totalCount: checks.length,
    missingFields: checks.filter(({ value }) => {
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return !String(value ?? "").trim();
    }).map(({ field }) => field),
  };
}

export async function getPostAuthDestination(): Promise<PostAuthDestination> {
  const profile = (await getCurrentUserProfile()) as Record<string, unknown> | null;
  const completion = getProfileCompletionSummary(profile);
  const role = (profile?.role as Record<string, unknown> | undefined) ?? {};
  const onboarding = (profile?.onboarding as Record<string, unknown> | undefined) ?? {};
  const goals = Array.isArray(onboarding.goals) ? onboarding.goals : [];

  if (!String(role.type ?? "").trim() || goals.length === 0) {
    return { destination: "/role-selection", completion, profile };
  }

  if (!String(role.sport ?? "").trim() || !String(role.bio ?? "").trim()) {
    return { destination: "/complete-profile", completion, profile };
  }

  return { destination: "/dashboard", completion, profile };
}

export async function checkUsernameAvailability(username: string) {
  try {
    await ensureUsernameAvailable(username, auth?.currentUser?.uid);
    return true;
  } catch {
    return false;
  }
}

export async function getUserProfileById(uid: string) {
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function toggleFollowUser(targetUid: string, isFollowing: boolean) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in to follow users.");
  }

  const currentUid = auth.currentUser.uid;
  if (currentUid === targetUid) {
    return;
  }

  await setDoc(
    doc(db, "users", currentUid),
    {
      following: isFollowing ? arrayRemove(targetUid) : arrayUnion(targetUid),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "users", targetUid),
    {
      followers: isFollowing ? arrayRemove(currentUid) : arrayUnion(currentUid),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const targetSnapshot = await getDoc(doc(db, "users", targetUid));
  const targetData = targetSnapshot.exists() ? (targetSnapshot.data() as Record<string, unknown>) : null;
  const nextFollowers = Array.isArray(targetData?.followers) ? (targetData?.followers as string[]) : [];
  await recordFollowerGrowth(targetUid, nextFollowers.length);

  if (!isFollowing) {
    await createNotification({
      type: "follow",
      recipientId: targetUid,
      actorId: currentUid,
      actorName: auth.currentUser.displayName || "HoopLink User",
      actorAvatar: auth.currentUser.photoURL || "",
      message: `${auth.currentUser.displayName || "Someone"} followed you.`,
    });
  }
}

export async function toggleFollowTopic(topic: string, isFollowing: boolean) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in to follow topics.");
  }

  const normalizedTopic = topic.trim().toLowerCase().replace(/^#/, "");
  if (!normalizedTopic) {
    return;
  }

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      followedTopics: isFollowing ? arrayRemove(normalizedTopic) : arrayUnion(normalizedTopic),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function searchProfiles(searchTerm: string) {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "users"), limit(250)));
  const normalized = searchTerm.trim().toLowerCase();
  const currentUserSnapshot = auth?.currentUser
    ? await getDoc(doc(db, "users", auth.currentUser.uid))
    : null;
  const currentUserData = currentUserSnapshot?.exists()
    ? (currentUserSnapshot.data() as Record<string, unknown>)
    : null;
  const blockedUsers = Array.isArray(currentUserData?.blockedUsers)
    ? (currentUserData?.blockedUsers as string[])
    : [];

  return snapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const role = (data.role as Record<string, unknown> | undefined) ?? {};
      const identity = (data.identity as Record<string, unknown> | undefined) ?? {};

      return {
        ...(data as unknown as SearchProfile),
        uid: String(data.uid ?? docSnapshot.id),
        displayName: String(data.displayName ?? "HoopLink User"),
        photoURL: String(data.photoURL ?? ""),
        username: data.username ? String(data.username) : null,
        location: data.location ? String(data.location) : null,
        verified: data.verified === true,
        followers: Array.isArray(data.followers) ? (data.followers as string[]) : [],
        following: Array.isArray(data.following) ? (data.following as string[]) : [],
        role: {
          type: role.type ? String(role.type) : null,
          sport: role.sport ? String(role.sport) : null,
          position: role.position ? String(role.position) : null,
          team: role.team ? String(role.team) : null,
          experience: role.experience ? String(role.experience) : null,
          bio: role.bio ? String(role.bio) : null,
          age: typeof role.age === "number" ? role.age : null,
          height: role.height ? String(role.height) : null,
        },
        identity: {
          ...(data.identity as SearchProfile["identity"]),
          tagline: identity.tagline ? String(identity.tagline) : null,
          hometown: identity.hometown ? String(identity.hometown) : null,
          gradYear: identity.gradYear ? String(identity.gradYear) : null,
        },
      } satisfies SearchProfile;
    })
    .filter((profile: SearchProfile) => !blockedUsers.includes(profile.uid))
    .filter((profile: SearchProfile) => {
      if (!normalized) {
        return true;
      }

      const haystack = [
        profile.displayName,
        profile.username,
        profile.role?.sport,
        profile.role?.position,
        profile.role?.team,
        profile.role?.experience,
        profile.role?.age ? String(profile.role.age) : "",
        profile.role?.height,
        profile.location,
        profile.role?.bio,
        profile.identity?.tagline,
        profile.identity?.hometown,
        profile.identity?.gradYear,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    })
    .sort((left: SearchProfile, right: SearchProfile) =>
      left.displayName.localeCompare(right.displayName)
    );
}
