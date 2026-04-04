import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { type FeedPost } from "@/lib/posts";

type ListenerCleanup = () => void;

export interface MediaPlaylist {
  id: string;
  userId: string;
  name: string;
  kind: "manual" | "season";
  postIds: string[];
  summary?: string | null;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface ClipChapter {
  id: string;
  userId: string;
  postId: string;
  label: string;
  timeSec: number;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface TelestrationNote {
  id: string;
  userId: string;
  postId: string;
  frameSec: number;
  note: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface ClipFeedbackRequest {
  id: string;
  userId: string;
  postId: string;
  prompt: string;
  status: "open" | "reviewed";
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface PeerReview {
  id: string;
  feedbackRequestId: string;
  postId: string;
  reviewerId: string;
  reviewerName: string;
  feedback: string;
  score: number;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface RubricScore {
  id: string;
  userId: string;
  postId: string;
  rubricName: string;
  metrics: Array<{ label: string; score: number }>;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface EvaluatorNote {
  id: string;
  userId: string;
  postId: string;
  title: string;
  note: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface ExpiringShare {
  id: string;
  userId: string;
  postId: string;
  expiresAt?: { seconds?: number; nanoseconds?: number } | null;
  note?: string | null;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface CreatorToolkitProfile {
  userId: string;
  musicLibrary: Array<{ id: string; title: string; mood: string }>;
  introTemplates: Array<{ id: string; title: string; style: string }>;
  outroTemplates: Array<{ id: string; title: string; style: string }>;
  overlays: Array<{ id: string; title: string; teamName: string }>;
  thumbnailTests: Array<{ id: string; postId: string; variantA: string; variantB: string }>;
  contentCalendar: Array<{ id: string; title: string; publishAt: string; platform: string }>;
  collaborationInvites: Array<{ id: string; creatorName: string; brief: string; status: "open" | "accepted" | "done" }>;
  fanClipRequests: Array<{ id: string; requester: string; clipType: string; note: string }>;
  clipMarketplace: Array<{ id: string; title: string; priceLabel: string; note: string }>;
  recruitingPacks: Array<{ id: string; title: string; audience: string; summary: string }>;
  advancedStudioNotes: Record<string, string[]>;
}

function createDefaultCreatorToolkitProfile(userId: string): CreatorToolkitProfile {
  return {
    userId,
    musicLibrary: [],
    introTemplates: [],
    outroTemplates: [],
    overlays: [],
    thumbnailTests: [],
    contentCalendar: [],
    collaborationInvites: [],
    fanClipRequests: [],
    clipMarketplace: [],
    recruitingPacks: [],
    advancedStudioNotes: {},
  };
}

function mapCreatorToolkitProfile(userId: string, data: Record<string, unknown>): CreatorToolkitProfile {
  const list = <T>(value: unknown, mapper: (item: Record<string, unknown>, index: number) => T) =>
    Array.isArray(value) ? (value as Array<Record<string, unknown>>).map(mapper) : [];
  return {
    userId,
    musicLibrary: list(data.musicLibrary, (item, index) => ({
      id: String(item.id ?? `music-${index + 1}`),
      title: String(item.title ?? ""),
      mood: String(item.mood ?? ""),
    })),
    introTemplates: list(data.introTemplates, (item, index) => ({
      id: String(item.id ?? `intro-${index + 1}`),
      title: String(item.title ?? ""),
      style: String(item.style ?? ""),
    })),
    outroTemplates: list(data.outroTemplates, (item, index) => ({
      id: String(item.id ?? `outro-${index + 1}`),
      title: String(item.title ?? ""),
      style: String(item.style ?? ""),
    })),
    overlays: list(data.overlays, (item, index) => ({
      id: String(item.id ?? `overlay-${index + 1}`),
      title: String(item.title ?? ""),
      teamName: String(item.teamName ?? ""),
    })),
    thumbnailTests: list(data.thumbnailTests, (item, index) => ({
      id: String(item.id ?? `thumb-${index + 1}`),
      postId: String(item.postId ?? ""),
      variantA: String(item.variantA ?? ""),
      variantB: String(item.variantB ?? ""),
    })),
    contentCalendar: list(data.contentCalendar, (item, index) => ({
      id: String(item.id ?? `calendar-${index + 1}`),
      title: String(item.title ?? ""),
      publishAt: String(item.publishAt ?? ""),
      platform: String(item.platform ?? ""),
    })),
    collaborationInvites: list(data.collaborationInvites, (item, index) => ({
      id: String(item.id ?? `collab-${index + 1}`),
      creatorName: String(item.creatorName ?? ""),
      brief: String(item.brief ?? ""),
      status: item.status === "accepted" || item.status === "done" ? item.status : "open",
    })),
    fanClipRequests: list(data.fanClipRequests, (item, index) => ({
      id: String(item.id ?? `fan-${index + 1}`),
      requester: String(item.requester ?? ""),
      clipType: String(item.clipType ?? ""),
      note: String(item.note ?? ""),
    })),
    clipMarketplace: list(data.clipMarketplace, (item, index) => ({
      id: String(item.id ?? `market-${index + 1}`),
      title: String(item.title ?? ""),
      priceLabel: String(item.priceLabel ?? ""),
      note: String(item.note ?? ""),
    })),
    recruitingPacks: list(data.recruitingPacks, (item, index) => ({
      id: String(item.id ?? `pack-${index + 1}`),
      title: String(item.title ?? ""),
      audience: String(item.audience ?? ""),
      summary: String(item.summary ?? ""),
    })),
    advancedStudioNotes:
      data.advancedStudioNotes && typeof data.advancedStudioNotes === "object"
        ? Object.fromEntries(
            Object.entries(data.advancedStudioNotes as Record<string, unknown>).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.map(String).filter(Boolean) : [],
            ]),
          )
        : {},
  };
}

function requireUser() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  return auth.currentUser;
}

function mapTimestamp(value: unknown) {
  return (value as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null;
}

function mapPlaylist(id: string, data: Record<string, unknown>): MediaPlaylist {
  return {
    id,
    userId: String(data.userId ?? ""),
    name: String(data.name ?? "Untitled playlist"),
    kind: data.kind === "season" ? "season" : "manual",
    postIds: Array.isArray(data.postIds) ? (data.postIds as string[]) : [],
    summary: data.summary ? String(data.summary) : null,
    createdAt: mapTimestamp(data.createdAt),
  };
}

function mapChapter(id: string, data: Record<string, unknown>): ClipChapter {
  return {
    id,
    userId: String(data.userId ?? ""),
    postId: String(data.postId ?? ""),
    label: String(data.label ?? ""),
    timeSec: Number(data.timeSec ?? 0),
    createdAt: mapTimestamp(data.createdAt),
  };
}

function mapTelestration(id: string, data: Record<string, unknown>): TelestrationNote {
  return {
    id,
    userId: String(data.userId ?? ""),
    postId: String(data.postId ?? ""),
    frameSec: Number(data.frameSec ?? 0),
    note: String(data.note ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  };
}

function mapFeedbackRequest(id: string, data: Record<string, unknown>): ClipFeedbackRequest {
  return {
    id,
    userId: String(data.userId ?? ""),
    postId: String(data.postId ?? ""),
    prompt: String(data.prompt ?? ""),
    status: data.status === "reviewed" ? "reviewed" : "open",
    createdAt: mapTimestamp(data.createdAt),
  };
}

function mapPeerReview(id: string, data: Record<string, unknown>): PeerReview {
  return {
    id,
    feedbackRequestId: String(data.feedbackRequestId ?? ""),
    postId: String(data.postId ?? ""),
    reviewerId: String(data.reviewerId ?? ""),
    reviewerName: String(data.reviewerName ?? "HoopLink Reviewer"),
    feedback: String(data.feedback ?? ""),
    score: Number(data.score ?? 0),
    createdAt: mapTimestamp(data.createdAt),
  };
}

function mapRubricScore(id: string, data: Record<string, unknown>): RubricScore {
  return {
    id,
    userId: String(data.userId ?? ""),
    postId: String(data.postId ?? ""),
    rubricName: String(data.rubricName ?? "Scout Rubric"),
    metrics: Array.isArray(data.metrics)
      ? (data.metrics as Array<Record<string, unknown>>).map((metric) => ({
          label: String(metric.label ?? ""),
          score: Number(metric.score ?? 0),
        }))
      : [],
    createdAt: mapTimestamp(data.createdAt),
  };
}

function mapEvaluatorNote(id: string, data: Record<string, unknown>): EvaluatorNote {
  return {
    id,
    userId: String(data.userId ?? ""),
    postId: String(data.postId ?? ""),
    title: String(data.title ?? ""),
    note: String(data.note ?? ""),
    createdAt: mapTimestamp(data.createdAt),
  };
}

function mapExpiringShare(id: string, data: Record<string, unknown>): ExpiringShare {
  return {
    id,
    userId: String(data.userId ?? ""),
    postId: String(data.postId ?? ""),
    expiresAt: mapTimestamp(data.expiresAt),
    note: data.note ? String(data.note) : null,
    createdAt: mapTimestamp(data.createdAt),
  };
}

export function generateSeasonHighlightPlan(posts: FeedPost[]) {
  const scored = [...posts]
    .filter((post) => post.mediaUrl)
    .sort((a, b) => {
      const aScore =
        a.likes.length * 2 + a.commentsCount * 3 + a.shares * 4 + Number(a.completedViews ?? 0);
      const bScore =
        b.likes.length * 2 + b.commentsCount * 3 + b.shares * 4 + Number(b.completedViews ?? 0);
      return bScore - aScore;
    })
    .slice(0, 8);

  return {
    postIds: scored.map((post) => post.id),
    summary: scored.length
      ? `Season reel built from ${scored.length} top clips across ${Array.from(new Set(scored.map((post) => post.sport))).join(", ")}.`
      : "Add a few clips to generate a season highlight reel.",
  };
}

export function findPotentialDuplicatePosts(posts: FeedPost[], selectedPostId: string) {
  const selected = posts.find((post) => post.id === selectedPostId);
  if (!selected) {
    return [];
  }

  const selectedCaption = selected.caption.toLowerCase();
  return posts
    .filter((post) => post.id !== selectedPostId)
    .filter(
      (post) =>
        post.mediaUrl === selected.mediaUrl ||
        post.originalPostId === selected.originalPostId ||
        (selectedCaption.length > 12 &&
          post.caption.toLowerCase().includes(selectedCaption.slice(0, Math.min(20, selectedCaption.length))))
    )
    .slice(0, 5);
}

export async function createPlaylist(input: {
  name: string;
  postIds: string[];
  kind?: "manual" | "season";
  summary?: string;
}) {
  const user = requireUser();

  await addDoc(collection(db!, "mediaPlaylists"), {
    userId: user.uid,
    name: input.name.trim() || "Untitled playlist",
    postIds: input.postIds,
    kind: input.kind ?? "manual",
    summary: input.summary?.trim() ?? "",
    createdAt: serverTimestamp(),
  });
}

export function subscribeToMyPlaylists(callback: (playlists: MediaPlaylist[]) => void): ListenerCleanup {
  if (!auth?.currentUser || !db) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(
    query(
      collection(db, "mediaPlaylists"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    ),
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(snapshot.docs.map((item) => mapPlaylist(item.id, item.data() as Record<string, unknown>)));
    }
  );
}

export async function saveClipChapter(postId: string, label: string, timeSec: number) {
  const user = requireUser();
  await addDoc(collection(db!, "mediaChapters"), {
    userId: user.uid,
    postId,
    label: label.trim(),
    timeSec,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToClipChapters(postId: string, callback: (chapters: ClipChapter[]) => void): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(
    query(
      collection(db, "mediaChapters"),
      where("postId", "==", postId),
      orderBy("timeSec", "asc")
    ),
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(snapshot.docs.map((item) => mapChapter(item.id, item.data() as Record<string, unknown>)));
    }
  );
}

export async function saveTelestrationNote(postId: string, frameSec: number, note: string) {
  const user = requireUser();
  await addDoc(collection(db!, "mediaTelestration"), {
    userId: user.uid,
    postId,
    frameSec,
    note: note.trim(),
    createdAt: serverTimestamp(),
  });
}

export function subscribeToTelestrationNotes(
  postId: string,
  callback: (notes: TelestrationNote[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(
    query(
      collection(db, "mediaTelestration"),
      where("postId", "==", postId),
      orderBy("createdAt", "desc")
    ),
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(
        snapshot.docs.map((item) => mapTelestration(item.id, item.data() as Record<string, unknown>))
      );
    }
  );
}

export async function createClipFeedbackRequest(postId: string, prompt: string) {
  const user = requireUser();
  await addDoc(collection(db!, "clipFeedbackRequests"), {
    userId: user.uid,
    postId,
    prompt: prompt.trim(),
    status: "open",
    createdAt: serverTimestamp(),
  });
}

export function subscribeToClipFeedbackRequests(
  userId: string,
  callback: (requests: ClipFeedbackRequest[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(
    query(
      collection(db, "clipFeedbackRequests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    ),
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(
        snapshot.docs.map((item) => mapFeedbackRequest(item.id, item.data() as Record<string, unknown>))
      );
    }
  );
}

export async function submitPeerReview(input: {
  feedbackRequestId: string;
  postId: string;
  reviewerName: string;
  feedback: string;
  score: number;
}) {
  const user = requireUser();
  await addDoc(collection(db!, "clipPeerReviews"), {
    feedbackRequestId: input.feedbackRequestId,
    postId: input.postId,
    reviewerId: user.uid,
    reviewerName: input.reviewerName.trim() || auth?.currentUser?.displayName || "HoopLink Reviewer",
    feedback: input.feedback.trim(),
    score: input.score,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToPeerReviews(
  feedbackRequestId: string,
  callback: (reviews: PeerReview[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(
    query(
      collection(db, "clipPeerReviews"),
      where("feedbackRequestId", "==", feedbackRequestId),
      orderBy("createdAt", "desc")
    ),
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(snapshot.docs.map((item) => mapPeerReview(item.id, item.data() as Record<string, unknown>)));
    }
  );
}

export async function saveRubricScore(input: {
  postId: string;
  rubricName: string;
  metrics: Array<{ label: string; score: number }>;
}) {
  const user = requireUser();
  await addDoc(collection(db!, "clipRubricScores"), {
    userId: user.uid,
    postId: input.postId,
    rubricName: input.rubricName.trim() || "Scout Rubric",
    metrics: input.metrics,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToRubricScores(postId: string, callback: (scores: RubricScore[]) => void): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(
    query(collection(db, "clipRubricScores"), where("postId", "==", postId), orderBy("createdAt", "desc")),
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(snapshot.docs.map((item) => mapRubricScore(item.id, item.data() as Record<string, unknown>)));
    }
  );
}

export async function saveEvaluatorNote(postId: string, title: string, note: string) {
  const user = requireUser();
  await addDoc(collection(db!, "clipEvaluatorNotes"), {
    userId: user.uid,
    postId,
    title: title.trim() || "Evaluator Note",
    note: note.trim(),
    createdAt: serverTimestamp(),
  });
}

export function subscribeToEvaluatorNotes(
  postId: string,
  callback: (notes: EvaluatorNote[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(
    query(collection(db, "clipEvaluatorNotes"), where("postId", "==", postId), orderBy("createdAt", "desc")),
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(snapshot.docs.map((item) => mapEvaluatorNote(item.id, item.data() as Record<string, unknown>)));
    }
  );
}

export async function createExpiringShare(postId: string, hoursValid: number, note?: string) {
  const user = requireUser();
  const expiresAt = new Date(Date.now() + Math.max(1, hoursValid) * 60 * 60 * 1000);
  await addDoc(collection(db!, "expiringShares"), {
    userId: user.uid,
    postId,
    expiresAt,
    note: note?.trim() ?? "",
    createdAt: serverTimestamp(),
  });
}

export function subscribeToExpiringShares(
  userId: string,
  callback: (shares: ExpiringShare[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  return onSnapshot(
    query(collection(db, "expiringShares"), where("userId", "==", userId), orderBy("createdAt", "desc")),
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      callback(snapshot.docs.map((item) => mapExpiringShare(item.id, item.data() as Record<string, unknown>)));
    }
  );
}

export async function getExpiringShare(shareId: string) {
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "expiringShares", shareId));
  return snapshot.exists() ? mapExpiringShare(snapshot.id, snapshot.data() as Record<string, unknown>) : null;
}

export async function getPostById(postId: string) {
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "posts", postId));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Record<string, unknown>;
  return {
    id: snapshot.id,
    userId: String(data.userId ?? ""),
    caption: String(data.caption ?? ""),
    mediaUrl: String(data.mediaUrl ?? ""),
    mediaType: data.mediaType === "video" ? "video" : "image",
    contentType: data.contentType === "reel" ? "reel" : "post",
    sport: String(data.sport ?? ""),
    author: data.author as FeedPost["author"],
    accessibilityLabel: data.accessibilityLabel ? String(data.accessibilityLabel) : null,
  };
}

export async function getCreatorToolkitProfile() {
  const user = requireUser();
  const snapshot = await getDoc(doc(db!, "creatorToolkit", user.uid));
  if (!snapshot.exists()) {
    const fallback = createDefaultCreatorToolkitProfile(user.uid);
    await setDoc(doc(db!, "creatorToolkit", user.uid), { ...fallback, updatedAt: serverTimestamp() }, { merge: true });
    return fallback;
  }

  return mapCreatorToolkitProfile(user.uid, snapshot.data() as Record<string, unknown>);
}

export async function saveCreatorToolkitProfile(values: Partial<CreatorToolkitProfile>) {
  const user = requireUser();
  await setDoc(doc(db!, "creatorToolkit", user.uid), { ...values, updatedAt: serverTimestamp() }, { merge: true });
}
