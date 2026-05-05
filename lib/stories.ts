import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { uploadToCloudinary } from "@/lib/cloudinary";
import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import { sendConversationMessage, createOrGetConversation } from "@/lib/messaging";

export type StoryAudience = "everyone" | "followers" | "close_friends" | "team" | "scouts" | "coaches";
export type StoryCategory =
  | "general"
  | "recruiting"
  | "team"
  | "performance"
  | "event"
  | "promo";
export type StoryStickerType = "poll" | "qa" | "countdown" | "availability" | "mvp_vote";
export type StoryFormat =
  | "standard"
  | "challenge"
  | "coach_callout"
  | "progression"
  | "game_day"
  | "recruiting_spotlight"
  | "scoreboard"
  | "training_streak";

export interface StorySportsMeta {
  format: StoryFormat;
  challengeTitle?: string;
  challengePrompt?: string;
  challengeSkill?: string;
  calloutAthleteId?: string;
  calloutAthleteName?: string;
  coachNote?: string;
  progressionTitle?: string;
  progressionStepLabel?: string;
  progressionStepIndex?: number;
  progressionTotalSteps?: number;
  gameDayStage?: string;
  opponent?: string;
  venue?: string;
  scoreboard?: {
    teamScore?: string;
    opponentScore?: string;
    period?: string;
    statLine?: string;
    gameStatus?: string;
  } | null;
  recruitingProfile?: {
    position?: string;
    gradYear?: string;
    location?: string;
    offerStatus?: string;
    highlightCta?: string;
  } | null;
  trainingStreakDays?: number | null;
}

export interface StoryViewer {
  uid: string;
  name: string;
  avatar: string;
  viewedAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface StoryCTA {
  label: string;
  url: string;
}

export interface StoryTextCard {
  title: string;
  subtitle: string;
  accentColor: string;
  theme: "sunrise" | "arena" | "recruiting" | "wellness" | "spotlight";
}

export interface StorySticker {
  type: StoryStickerType;
  prompt: string;
  choices: string[];
  deadlineLabel?: string;
  responsesByUser?: Record<string, string>;
}

export interface StoryAnalytics {
  views: number;
  completionCount: number;
  replyCount: number;
  reactionCount: number;
  tapsForward: number;
  tapsBack: number;
  exits: number;
}

export interface StoryHighlightCollection {
  id: string;
  title: string;
  storyIds: string[];
  coverStoryId?: string;
}

export interface StoryHighlightCollectionWithStories extends StoryHighlightCollection {
  stories: StoryItem[];
}

export interface StoryItem {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "text";
  caption: string;
  seenBy?: string[];
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
  expiresAt?: { seconds?: number; nanoseconds?: number } | null;
  authorName: string;
  authorAvatar: string;
  audience: StoryAudience;
  audienceUserIds: string[];
  teamId?: string;
  category: StoryCategory;
  tags: string[];
  taggedUserIds: string[];
  linkedEntityPath?: string;
  eventLabel?: string;
  cta?: StoryCTA | null;
  sticker?: StorySticker | null;
  reactionsByUser: Record<string, string>;
  reactionCounts: Array<{ emoji: string; count: number }>;
  viewers: StoryViewer[];
  viewerCount: number;
  analytics: StoryAnalytics;
  textCard?: StoryTextCard | null;
  highlightCollectionIds: string[];
  sportsMeta?: StorySportsMeta | null;
}

interface StoryContext {
  following: string[];
  mutedStoryUserIds: string[];
  closeFriendIds: string[];
  teamIds: string[];
  roleType: string;
}

interface CreateStoriesInput {
  files?: File[];
  caption: string;
  audience?: StoryAudience;
  audienceUserIds?: string[];
  teamId?: string;
  category?: StoryCategory;
  tags?: string[];
  taggedUserIds?: string[];
  linkedEntityPath?: string;
  eventLabel?: string;
  cta?: StoryCTA | null;
  sticker?: StorySticker | null;
  textCard?: StoryTextCard | null;
  sportsMeta?: StorySportsMeta | null;
}

const defaultAnalytics: StoryAnalytics = {
  views: 0,
  completionCount: 0,
  replyCount: 0,
  reactionCount: 0,
  tapsForward: 0,
  tapsBack: 0,
  exits: 0,
};

function normalizeReactionCounts(reactionsByUser: Record<string, string>) {
  const counts = new Map<string, number>();
  Object.values(reactionsByUser).forEach((emoji) => {
    if (!emoji) {
      return;
    }
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((left, right) => right.count - left.count);
}

function parseStoryViewers(data: Record<string, unknown>) {
  const viewerMap =
    typeof data.viewerMap === "object" && data.viewerMap
      ? (data.viewerMap as Record<string, Record<string, unknown>>)
      : {};

  return Object.entries(viewerMap)
    .map(([uid, value]) => ({
      uid,
      name: String(value.name ?? "Viewer"),
      avatar: String(value.avatar ?? ""),
      viewedAt:
        (value.viewedAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    }))
    .sort((left, right) => (right.viewedAt?.seconds ?? 0) - (left.viewedAt?.seconds ?? 0));
}

function mapStory(id: string, data: Record<string, unknown>): StoryItem {
  const reactionsByUser =
    typeof data.reactionsByUser === "object" && data.reactionsByUser
      ? (data.reactionsByUser as Record<string, string>)
      : {};
  const stickerData =
    typeof data.sticker === "object" && data.sticker ? (data.sticker as Record<string, unknown>) : null;
  const sticker: StorySticker | null = stickerData
    ? {
        type: (
          stickerData.type === "poll" ||
          stickerData.type === "qa" ||
          stickerData.type === "countdown" ||
          stickerData.type === "availability" ||
          stickerData.type === "mvp_vote"
            ? stickerData.type
            : "poll"
        ) as StoryStickerType,
        prompt: String(stickerData.prompt ?? ""),
        choices: Array.isArray(stickerData.choices) ? stickerData.choices.map(String).filter(Boolean) : [],
        deadlineLabel: stickerData.deadlineLabel ? String(stickerData.deadlineLabel) : undefined,
        responsesByUser:
          typeof stickerData.responsesByUser === "object" && stickerData.responsesByUser
            ? (stickerData.responsesByUser as Record<string, string>)
            : {},
      }
    : null;

  return {
    id,
    userId: String(data.userId ?? ""),
    mediaUrl: String(data.mediaUrl ?? ""),
    mediaType: data.mediaType === "video" ? "video" : data.mediaType === "text" ? "text" : "image",
    caption: String(data.caption ?? ""),
    seenBy: Array.isArray(data.seenBy) ? (data.seenBy as string[]) : [],
    createdAt:
      (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    expiresAt:
      (data.expiresAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    authorName: String(data.authorName ?? "HoopLink User"),
    authorAvatar: String(data.authorAvatar ?? ""),
    audience:
      data.audience === "followers" ||
      data.audience === "close_friends" ||
      data.audience === "team" ||
      data.audience === "scouts" ||
      data.audience === "coaches"
        ? (data.audience as StoryAudience)
        : "everyone",
    audienceUserIds: Array.isArray(data.audienceUserIds) ? data.audienceUserIds.map(String) : [],
    teamId: data.teamId ? String(data.teamId) : undefined,
    category:
      data.category === "recruiting" ||
      data.category === "team" ||
      data.category === "performance" ||
      data.category === "event" ||
      data.category === "promo"
        ? (data.category as StoryCategory)
        : "general",
    tags: Array.isArray(data.tags) ? data.tags.map(String).filter(Boolean) : [],
    taggedUserIds: Array.isArray(data.taggedUserIds) ? data.taggedUserIds.map(String).filter(Boolean) : [],
    linkedEntityPath: data.linkedEntityPath ? String(data.linkedEntityPath) : undefined,
    eventLabel: data.eventLabel ? String(data.eventLabel) : undefined,
    cta:
      typeof data.cta === "object" && data.cta
        ? {
            label: String((data.cta as Record<string, unknown>).label ?? "Open"),
            url: String((data.cta as Record<string, unknown>).url ?? "/stories"),
          }
        : null,
    sticker,
    reactionsByUser,
    reactionCounts: normalizeReactionCounts(reactionsByUser),
    viewers: parseStoryViewers(data),
    viewerCount:
      typeof data.viewerCount === "number" ? data.viewerCount : parseStoryViewers(data).length,
    analytics:
      typeof data.analytics === "object" && data.analytics
        ? {
            views: Number((data.analytics as Record<string, unknown>).views ?? 0),
            completionCount: Number((data.analytics as Record<string, unknown>).completionCount ?? 0),
            replyCount: Number((data.analytics as Record<string, unknown>).replyCount ?? 0),
            reactionCount: Number((data.analytics as Record<string, unknown>).reactionCount ?? 0),
            tapsForward: Number((data.analytics as Record<string, unknown>).tapsForward ?? 0),
            tapsBack: Number((data.analytics as Record<string, unknown>).tapsBack ?? 0),
            exits: Number((data.analytics as Record<string, unknown>).exits ?? 0),
          }
        : defaultAnalytics,
    textCard:
      typeof data.textCard === "object" && data.textCard
        ? {
            title: String((data.textCard as Record<string, unknown>).title ?? ""),
            subtitle: String((data.textCard as Record<string, unknown>).subtitle ?? ""),
            accentColor: String((data.textCard as Record<string, unknown>).accentColor ?? "#f97316"),
            theme:
              (data.textCard as Record<string, unknown>).theme === "arena" ||
              (data.textCard as Record<string, unknown>).theme === "recruiting" ||
              (data.textCard as Record<string, unknown>).theme === "wellness" ||
              (data.textCard as Record<string, unknown>).theme === "spotlight"
                ? ((data.textCard as Record<string, unknown>).theme as StoryTextCard["theme"])
                : "sunrise",
          }
        : null,
    highlightCollectionIds: Array.isArray(data.highlightCollectionIds)
      ? data.highlightCollectionIds.map(String)
      : [],
    sportsMeta:
      typeof data.sportsMeta === "object" && data.sportsMeta
        ? {
            format: (
              (data.sportsMeta as Record<string, unknown>).format === "challenge" ||
              (data.sportsMeta as Record<string, unknown>).format === "coach_callout" ||
              (data.sportsMeta as Record<string, unknown>).format === "progression" ||
              (data.sportsMeta as Record<string, unknown>).format === "game_day" ||
              (data.sportsMeta as Record<string, unknown>).format === "recruiting_spotlight" ||
              (data.sportsMeta as Record<string, unknown>).format === "scoreboard" ||
              (data.sportsMeta as Record<string, unknown>).format === "training_streak"
                ? (data.sportsMeta as Record<string, unknown>).format
                : "standard"
            ) as StoryFormat,
            challengeTitle: (data.sportsMeta as Record<string, unknown>).challengeTitle
              ? String((data.sportsMeta as Record<string, unknown>).challengeTitle)
              : undefined,
            challengePrompt: (data.sportsMeta as Record<string, unknown>).challengePrompt
              ? String((data.sportsMeta as Record<string, unknown>).challengePrompt)
              : undefined,
            challengeSkill: (data.sportsMeta as Record<string, unknown>).challengeSkill
              ? String((data.sportsMeta as Record<string, unknown>).challengeSkill)
              : undefined,
            calloutAthleteId: (data.sportsMeta as Record<string, unknown>).calloutAthleteId
              ? String((data.sportsMeta as Record<string, unknown>).calloutAthleteId)
              : undefined,
            calloutAthleteName: (data.sportsMeta as Record<string, unknown>).calloutAthleteName
              ? String((data.sportsMeta as Record<string, unknown>).calloutAthleteName)
              : undefined,
            coachNote: (data.sportsMeta as Record<string, unknown>).coachNote
              ? String((data.sportsMeta as Record<string, unknown>).coachNote)
              : undefined,
            progressionTitle: (data.sportsMeta as Record<string, unknown>).progressionTitle
              ? String((data.sportsMeta as Record<string, unknown>).progressionTitle)
              : undefined,
            progressionStepLabel: (data.sportsMeta as Record<string, unknown>).progressionStepLabel
              ? String((data.sportsMeta as Record<string, unknown>).progressionStepLabel)
              : undefined,
            progressionStepIndex: typeof (data.sportsMeta as Record<string, unknown>).progressionStepIndex === "number"
              ? Number((data.sportsMeta as Record<string, unknown>).progressionStepIndex)
              : undefined,
            progressionTotalSteps: typeof (data.sportsMeta as Record<string, unknown>).progressionTotalSteps === "number"
              ? Number((data.sportsMeta as Record<string, unknown>).progressionTotalSteps)
              : undefined,
            gameDayStage: (data.sportsMeta as Record<string, unknown>).gameDayStage
              ? String((data.sportsMeta as Record<string, unknown>).gameDayStage)
              : undefined,
            opponent: (data.sportsMeta as Record<string, unknown>).opponent
              ? String((data.sportsMeta as Record<string, unknown>).opponent)
              : undefined,
            venue: (data.sportsMeta as Record<string, unknown>).venue
              ? String((data.sportsMeta as Record<string, unknown>).venue)
              : undefined,
            scoreboard:
              typeof (data.sportsMeta as Record<string, unknown>).scoreboard === "object" &&
              (data.sportsMeta as Record<string, unknown>).scoreboard
                ? {
                    teamScore: ((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).teamScore
                      ? String(((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).teamScore)
                      : undefined,
                    opponentScore: ((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).opponentScore
                      ? String(((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).opponentScore)
                      : undefined,
                    period: ((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).period
                      ? String(((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).period)
                      : undefined,
                    statLine: ((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).statLine
                      ? String(((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).statLine)
                      : undefined,
                    gameStatus: ((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).gameStatus
                      ? String(((data.sportsMeta as Record<string, unknown>).scoreboard as Record<string, unknown>).gameStatus)
                      : undefined,
                  }
                : null,
            recruitingProfile:
              typeof (data.sportsMeta as Record<string, unknown>).recruitingProfile === "object" &&
              (data.sportsMeta as Record<string, unknown>).recruitingProfile
                ? {
                    position: ((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).position
                      ? String(((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).position)
                      : undefined,
                    gradYear: ((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).gradYear
                      ? String(((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).gradYear)
                      : undefined,
                    location: ((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).location
                      ? String(((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).location)
                      : undefined,
                    offerStatus: ((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).offerStatus
                      ? String(((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).offerStatus)
                      : undefined,
                    highlightCta: ((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).highlightCta
                      ? String(((data.sportsMeta as Record<string, unknown>).recruitingProfile as Record<string, unknown>).highlightCta)
                      : undefined,
                  }
                : null,
            trainingStreakDays:
              typeof (data.sportsMeta as Record<string, unknown>).trainingStreakDays === "number"
                ? Number((data.sportsMeta as Record<string, unknown>).trainingStreakDays)
                : null,
          }
        : null,
  };
}

function canViewStory(story: StoryItem, currentUserId: string, context: StoryContext) {
  if (story.userId === currentUserId) {
    return true;
  }

  if (context.mutedStoryUserIds.includes(story.userId)) {
    return false;
  }

  if (story.audience === "everyone") {
    return true;
  }

  if (story.audience === "followers") {
    return context.following.includes(story.userId);
  }

  if (story.audience === "close_friends") {
    return story.audienceUserIds.includes(currentUserId);
  }

  if (story.audience === "team") {
    return story.teamId ? context.teamIds.includes(story.teamId) : false;
  }

  if (story.audience === "scouts") {
    return context.roleType === "scout";
  }

  if (story.audience === "coaches") {
    return context.roleType === "coach";
  }

  return false;
}

async function getCurrentStoryContext(): Promise<StoryContext> {
  if (!auth?.currentUser || !db) {
    return { following: [], mutedStoryUserIds: [], closeFriendIds: [], teamIds: [], roleType: "" };
  }

  const userSnapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  const userData = userSnapshot.exists() ? (userSnapshot.data() as Record<string, unknown>) : {};
  const teamsSnapshot = await getDocs(query(collection(db, "teams"), limit(50)));
  const teamIds = teamsSnapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => ({
      id: docSnapshot.id,
      memberIds: Array.isArray(docSnapshot.data().memberIds) ? (docSnapshot.data().memberIds as string[]) : [],
    }))
    .filter((team: { id: string; memberIds: string[] }) => team.memberIds.includes(auth.currentUser!.uid))
    .map((team: { id: string; memberIds: string[] }) => team.id);

  return {
    following: Array.isArray(userData.following) ? (userData.following as string[]) : [],
    mutedStoryUserIds: Array.isArray(userData.mutedStoryUserIds) ? (userData.mutedStoryUserIds as string[]) : [],
    closeFriendIds: Array.isArray(userData.closeFriendIds) ? (userData.closeFriendIds as string[]) : [],
    teamIds,
    roleType: String(((userData.role as Record<string, unknown> | undefined)?.type ?? "")).toLowerCase(),
  };
}

export function formatStoryTime(createdAt?: { seconds?: number } | null) {
  if (!createdAt?.seconds) {
    return "now";
  }

  const diffSeconds = Math.max(1, Math.floor(Date.now() / 1000) - createdAt.seconds);
  if (diffSeconds < 60) {
    return `${diffSeconds}s`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export function buildStoryCardSuggestion(category: StoryCategory) {
  switch (category) {
    case "recruiting":
      return {
        title: "Recruiting Update",
        subtitle: "Visits, offers, camps, and coach interest in one quick card.",
        accentColor: "#2563eb",
        theme: "recruiting" as const,
      };
    case "performance":
      return {
        title: "Daily Performance",
        subtitle: "Recovery, workload, and training momentum snapshot.",
        accentColor: "#10b981",
        theme: "wellness" as const,
      };
    case "team":
      return {
        title: "Team Drop",
        subtitle: "Practice notes, culture moments, and squad updates.",
        accentColor: "#ef4444",
        theme: "arena" as const,
      };
    case "event":
      return {
        title: "Game Day",
        subtitle: "Countdown, venue, matchup, and call-to-action.",
        accentColor: "#f59e0b",
        theme: "spotlight" as const,
      };
    case "promo":
      return {
        title: "Brand Story",
        subtitle: "Launch a promo, drop, or partnership with one tap.",
        accentColor: "#7c3aed",
        theme: "spotlight" as const,
      };
    default:
      return {
        title: "Story Card",
        subtitle: "Share a clean update with color, context, and motion.",
        accentColor: "#f97316",
        theme: "sunrise" as const,
      };
  }
}

export async function createStories(input: CreateStoriesInput) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in to post a story.");
  }

  const files = input.files ?? [];
  const category = input.category ?? "general";
  const baseAudienceUserIds = Array.from(new Set((input.audienceUserIds ?? []).map((value) => value.trim()).filter(Boolean)));
  const closeFriendIds = input.audience === "close_friends" ? await getCloseFriendIds() : [];
  const audienceUserIds =
    input.audience === "close_friends" ? closeFriendIds : baseAudienceUserIds;

  const createPayload = async (mediaUrl: string, mediaType: StoryItem["mediaType"]) => {
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const docRef = await addDoc(collection(db!, "stories"), {
      userId: auth.currentUser!.uid,
      mediaUrl,
      mediaType,
      caption: input.caption.trim(),
      authorName: auth.currentUser!.displayName || "HoopLink User",
      authorAvatar: auth.currentUser!.photoURL || "",
      createdAt: serverTimestamp(),
      expiresAt,
      seenBy: [],
      audience: input.audience ?? "everyone",
      audienceUserIds,
      teamId: input.teamId?.trim() || null,
      category,
      tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
      taggedUserIds: (input.taggedUserIds ?? []).map((tag) => tag.trim()).filter(Boolean),
      linkedEntityPath: input.linkedEntityPath?.trim() || null,
      eventLabel: input.eventLabel?.trim() || null,
      cta: input.cta?.label && input.cta.url ? input.cta : null,
      sticker: input.sticker?.prompt ? input.sticker : null,
      reactionsByUser: {},
      viewerMap: {},
      viewerCount: 0,
      analytics: defaultAnalytics,
      textCard: input.textCard ?? null,
      highlightCollectionIds: [],
      sportsMeta: input.sportsMeta ?? null,
    });

    await Promise.all(
      (input.taggedUserIds ?? [])
        .map((userId) => userId.trim())
        .filter(Boolean)
        .filter((userId) => userId !== auth.currentUser!.uid)
        .map((userId) =>
          createNotification({
            type: "mention",
            recipientId: userId,
            actorId: auth.currentUser!.uid,
            actorName: auth.currentUser!.displayName || "HoopLink User",
            actorAvatar: auth.currentUser!.photoURL || "",
            message: `${auth.currentUser!.displayName || "Someone"} tagged you in a story.`,
            actionLabel: "View story",
            actionUrl: `/stories?story=${docRef.id}`,
            category:
              category === "recruiting"
                ? "recruiting"
                : category === "team"
                  ? "team_updates"
                  : category === "performance"
                    ? "performance_wellness"
                    : "social",
          })
        )
    );

    if (input.sportsMeta?.format === "coach_callout" && input.sportsMeta.calloutAthleteId) {
      await createNotification({
        type: "mention",
        recipientId: input.sportsMeta.calloutAthleteId,
        actorId: auth.currentUser!.uid,
        actorName: auth.currentUser!.displayName || "HoopLink User",
        actorAvatar: auth.currentUser!.photoURL || "",
        message: `${auth.currentUser!.displayName || "A coach"} posted a coach callout story for you.`,
        actionLabel: "View story",
        actionUrl: `/stories?story=${docRef.id}`,
        category: "recruiting",
      });
    }

    return docRef.id;
  };

  if (input.textCard) {
    await createPayload("", "text");
  }

  if (files.length > 0) {
    const totalFiles = files.length;
    let completedUploads = 0;

    await Promise.all(
      files.map(async (file, index) => {
        const uploadedStory = await uploadToCloudinary(
          file,
          `hooplink/stories/${auth.currentUser!.uid}`,
          (progress) => {
            // Optional: emit progress for each file
            console.log(`Uploading ${file.name}: ${progress.toFixed(1)}%`);
          }
        );
        completedUploads++;
        console.log(`Uploaded ${completedUploads}/${totalFiles} files`);
        await createPayload(uploadedStory.url, file.type.startsWith("video/") ? "video" : "image");
      })
    );
  }
}

export async function createStory(file: File, caption: string) {
  await createStories({ files: [file], caption });
}

export async function getActiveStories() {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "stories"), orderBy("createdAt", "desc"), limit(100)));
  const nowSeconds = Math.floor(Date.now() / 1000);
  const currentUserId = auth?.currentUser?.uid ?? "";
  const context = await getCurrentStoryContext();

  const activeStories = snapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
      mapStory(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
    )
    .filter((story: StoryItem) => (story.expiresAt?.seconds ?? 0) > nowSeconds)
    .filter((story: StoryItem) => (currentUserId ? canViewStory(story, currentUserId, context) : story.audience === "everyone"));

  return activeStories.sort((left: StoryItem, right: StoryItem) => {
    const leftOwn = left.userId === currentUserId ? 1 : 0;
    const rightOwn = right.userId === currentUserId ? 1 : 0;
    if (leftOwn !== rightOwn) {
      return rightOwn - leftOwn;
    }

    const leftFollowing = context.following.includes(left.userId) ? 1 : 0;
    const rightFollowing = context.following.includes(right.userId) ? 1 : 0;
    if (leftFollowing !== rightFollowing) {
      return rightFollowing - leftFollowing;
    }

    const leftSeen = left.seenBy?.includes(currentUserId) ? 1 : 0;
    const rightSeen = right.seenBy?.includes(currentUserId) ? 1 : 0;
    if (leftSeen !== rightSeen) {
      return leftSeen - rightSeen;
    }

    return (right.createdAt?.seconds ?? 0) - (left.createdAt?.seconds ?? 0);
  });
}

export function subscribeToActiveStories(callback: (stories: StoryItem[]) => void) {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const currentUserId = auth?.currentUser?.uid ?? "";

  const unsubscribe = onSnapshot(
    query(collection(db, "stories"), orderBy("createdAt", "desc"), limit(100)),
    async (snapshot: import("firebase/firestore").QuerySnapshot<import("firebase/firestore").DocumentData>) => {
      const context = await getCurrentStoryContext();
      const activeStories = snapshot.docs
        .map((docSnapshot) => mapStory(docSnapshot.id, docSnapshot.data() as Record<string, unknown>))
        .filter((story) => (story.expiresAt?.seconds ?? 0) > nowSeconds)
        .filter((story) => (currentUserId ? canViewStory(story, currentUserId, context) : story.audience === "everyone"));

      const sorted = activeStories.sort((left, right) => {
        const leftOwn = left.userId === currentUserId ? 1 : 0;
        const rightOwn = right.userId === currentUserId ? 1 : 0;
        if (leftOwn !== rightOwn) return rightOwn - leftOwn;
        const leftFollowing = context.following.includes(left.userId) ? 1 : 0;
        const rightFollowing = context.following.includes(right.userId) ? 1 : 0;
        if (leftFollowing !== rightFollowing) return rightFollowing - leftFollowing;
        const leftSeen = left.seenBy?.includes(currentUserId) ? 1 : 0;
        const rightSeen = right.seenBy?.includes(currentUserId) ? 1 : 0;
        if (leftSeen !== rightSeen) return leftSeen - rightSeen;
        return (right.createdAt?.seconds ?? 0) - (left.createdAt?.seconds ?? 0);
      });

      callback(sorted);
    },
    () => callback([])
  );

  return unsubscribe;
}

export async function getStoryArchive() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "stories"), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"), limit(100))
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapStory(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
  );
}

export async function deleteStory(storyId: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "stories", storyId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  if (String(data.userId ?? "") !== auth.currentUser.uid) {
    throw new Error("You can only delete your own story.");
  }

  await deleteDoc(doc(db, "stories", storyId));
}

export async function markStorySeen(storyId: string) {
  if (!auth?.currentUser || !db) {
    return;
  }

  const snapshot = await getDoc(doc(db, "stories", storyId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const seenBy = Array.isArray(data.seenBy) ? (data.seenBy as string[]) : [];
  if (seenBy.includes(auth.currentUser.uid)) {
    return;
  }

  await updateDoc(doc(db, "stories", storyId), {
    seenBy: arrayUnion(auth.currentUser.uid),
    viewerCount: increment(1),
    "analytics.views": increment(1),
    [`viewerMap.${auth.currentUser.uid}`]: {
      name: auth.currentUser.displayName || "HoopLink User",
      avatar: auth.currentUser.photoURL || "",
      viewedAt: new Date(),
    },
  });
}

export async function recordStoryNavigation(storyId: string, direction: "forward" | "back") {
  if (!db) {
    return;
  }

  await updateDoc(doc(db, "stories", storyId), {
    [direction === "forward" ? "analytics.tapsForward" : "analytics.tapsBack"]: increment(1),
  });
}

export async function recordStoryCompletion(storyId: string) {
  if (!db) {
    return;
  }

  await updateDoc(doc(db, "stories", storyId), {
    "analytics.completionCount": increment(1),
  });
}

export async function recordStoryExit(storyId: string) {
  if (!db) {
    return;
  }

  await updateDoc(doc(db, "stories", storyId), {
    "analytics.exits": increment(1),
  });
}

export async function sendStoryReply(story: StoryItem, text: string) {
  if (!auth?.currentUser || !db || !text.trim()) {
    return;
  }

  const conversationId = await createOrGetConversation(story.userId);
  await sendConversationMessage(
    conversationId,
    `Story reply: ${text.trim() || story.caption || "Reacted to your story."}`
  );

  await updateDoc(doc(db, "stories", story.id), {
    "analytics.replyCount": increment(1),
  });
}

export async function toggleStoryReaction(storyId: string, emoji: string) {
  if (!auth?.currentUser || !db) {
    return;
  }

  const snapshot = await getDoc(doc(db, "stories", storyId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const reactionsByUser =
    typeof data.reactionsByUser === "object" && data.reactionsByUser
      ? { ...(data.reactionsByUser as Record<string, string>) }
      : {};

  if (reactionsByUser[auth.currentUser.uid] === emoji) {
    delete reactionsByUser[auth.currentUser.uid];
  } else {
    reactionsByUser[auth.currentUser.uid] = emoji;
  }

  await setDoc(
    doc(db, "stories", storyId),
    {
      reactionsByUser,
      reactionCounts: normalizeReactionCounts(reactionsByUser),
      analytics: {
        ...(typeof data.analytics === "object" && data.analytics ? (data.analytics as Record<string, unknown>) : {}),
        reactionCount: Object.keys(reactionsByUser).length,
      },
    },
    { merge: true }
  );
}

export async function respondToStorySticker(storyId: string, value: string) {
  if (!auth?.currentUser || !db || !value.trim()) {
    return;
  }

  const snapshot = await getDoc(doc(db, "stories", storyId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const sticker =
    typeof data.sticker === "object" && data.sticker ? { ...(data.sticker as Record<string, unknown>) } : {};
  const existingResponses =
    typeof sticker.responsesByUser === "object" && sticker.responsesByUser
      ? (sticker.responsesByUser as Record<string, string>)
      : {};

  await setDoc(
    doc(db, "stories", storyId),
    {
      sticker: {
        ...sticker,
        responsesByUser: {
          ...existingResponses,
          [auth.currentUser.uid]: value.trim(),
        },
      },
    },
    { merge: true }
  );
}

export async function updateCloseFriendIds(userIds: string[]) {
  if (!auth?.currentUser || !db) {
    return;
  }

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      closeFriendIds: Array.from(new Set(userIds.map((value) => value.trim()).filter(Boolean))),
    },
    { merge: true }
  );
}

export async function getCloseFriendIds() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  return Array.isArray(data.closeFriendIds) ? (data.closeFriendIds as string[]) : [];
}

export async function toggleMuteStoryCreator(targetUserId: string, muted: boolean) {
  if (!auth?.currentUser || !db) {
    return;
  }

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      mutedStoryUserIds: muted ? arrayRemove(targetUserId) : arrayUnion(targetUserId),
    },
    { merge: true }
  );
}

export async function getMutedStoryUserIds() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  return Array.isArray(data.mutedStoryUserIds) ? (data.mutedStoryUserIds as string[]) : [];
}

export async function getStoryHighlightCollections() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const collections = Array.isArray(data.storyHighlightCollections)
    ? (data.storyHighlightCollections as Array<Record<string, unknown>>)
    : [];

  return collections.map((collection) => ({
    id: String(collection.id ?? ""),
    title: String(collection.title ?? "Highlight"),
    storyIds: Array.isArray(collection.storyIds) ? collection.storyIds.map(String) : [],
    coverStoryId: collection.coverStoryId ? String(collection.coverStoryId) : undefined,
  })) satisfies StoryHighlightCollection[];
}

export async function getStoryHighlightCollectionsForUser(userId: string) {
  if (!db || !userId.trim()) {
    return [];
  }

  const userSnapshot = await getDoc(doc(db, "users", userId));
  const userData = userSnapshot.exists() ? (userSnapshot.data() as Record<string, unknown>) : {};
  const collections = Array.isArray(userData.storyHighlightCollections)
    ? (userData.storyHighlightCollections as Array<Record<string, unknown>>).map((collection) => ({
        id: String(collection.id ?? ""),
        title: String(collection.title ?? "Highlight"),
        storyIds: Array.isArray(collection.storyIds) ? collection.storyIds.map(String) : [],
        coverStoryId: collection.coverStoryId ? String(collection.coverStoryId) : undefined,
      }))
    : [];

  if (!collections.length) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "stories"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(100))
  );
  const currentUserId = auth?.currentUser?.uid ?? "";
  const context = await getCurrentStoryContext();
  const stories: StoryItem[] = snapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
      mapStory(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
    )
    .filter((story: StoryItem) =>
      currentUserId ? canViewStory(story, currentUserId, context) : story.audience === "everyone"
    );
  const storyMap = new Map(stories.map((story) => [story.id, story] as const));

  const hydratedCollections: StoryHighlightCollectionWithStories[] = collections.map(
    (collection: StoryHighlightCollection) => ({
      ...collection,
      stories: collection.storyIds
        .map((storyId: string) => storyMap.get(storyId))
        .filter((story: StoryItem | undefined): story is StoryItem => Boolean(story)),
    })
  );

  return hydratedCollections.filter(
    (collection: StoryHighlightCollectionWithStories) => collection.stories.length > 0
  );
}

export async function createStoryHighlightCollection(title: string) {
  if (!auth?.currentUser || !db || !title.trim()) {
    return;
  }

  const collections = await getStoryHighlightCollections();
  const nextCollections = [
    ...collections,
    {
      id: crypto.randomUUID(),
      title: title.trim(),
      storyIds: [],
    },
  ];

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      storyHighlightCollections: nextCollections,
    },
    { merge: true }
  );
}

export async function saveStoryToHighlightCollection(storyId: string, collectionId: string) {
  if (!auth?.currentUser || !db) {
    return;
  }

  const collections = await getStoryHighlightCollections();
  const nextCollections = collections.map((collection) =>
    collection.id === collectionId
      ? {
          ...collection,
          storyIds: Array.from(new Set([...collection.storyIds, storyId])),
          coverStoryId: collection.coverStoryId || storyId,
        }
      : collection
  );

  await Promise.all([
    setDoc(
      doc(db, "users", auth.currentUser.uid),
      {
        storyHighlightCollections: nextCollections,
      },
      { merge: true }
    ),
    setDoc(
      doc(db, "stories", storyId),
      {
        highlightCollectionIds: arrayUnion(collectionId),
      },
      { merge: true }
    ),
  ]);
}
