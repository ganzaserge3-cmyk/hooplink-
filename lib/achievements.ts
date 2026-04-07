import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastPostDate: string | null;
  totalPosts: number;
  totalReels: number;
  totalLikesReceived: number;
  updatedAt?: { seconds?: number } | null;
}

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: { seconds?: number; nanoseconds?: number } | null;
}

export type AchievementType =
  | "first_post"
  | "first_reel"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "highlights_10"
  | "highlights_100"
  | "likes_50"
  | "likes_500"
  | "followers_10"
  | "followers_100"
  | "verified";

const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementType,
  { title: string; description: string; icon: string }
> = {
  first_post: { title: "First Post", description: "Published your first post", icon: "📝" },
  first_reel: { title: "First Reel", description: "Uploaded your first highlight reel", icon: "🎬" },
  streak_3: { title: "3-Day Streak", description: "Posted 3 days in a row", icon: "🔥" },
  streak_7: { title: "Week Warrior", description: "Posted 7 days in a row", icon: "⚡" },
  streak_30: { title: "Monthly Grind", description: "Posted 30 days in a row", icon: "🏆" },
  highlights_10: { title: "10 Highlights", description: "Uploaded 10 highlight reels", icon: "🎥" },
  highlights_100: { title: "100 Highlights", description: "Uploaded 100 highlight reels", icon: "💎" },
  likes_50: { title: "50 Likes", description: "Received 50 likes on your posts", icon: "❤️" },
  likes_500: { title: "500 Likes", description: "Received 500 likes on your posts", icon: "💯" },
  followers_10: { title: "10 Followers", description: "Reached 10 followers", icon: "👥" },
  followers_100: { title: "Rising Star", description: "Reached 100 followers", icon: "⭐" },
  verified: { title: "Verified Athlete", description: "Got verified on HoopLink", icon: "✅" },
};

export async function getUserStreak(userId?: string): Promise<UserStreak> {
  const uid = userId ?? auth?.currentUser?.uid;
  if (!db || !uid) {
    return { currentStreak: 0, longestStreak: 0, lastPostDate: null, totalPosts: 0, totalReels: 0, totalLikesReceived: 0 };
  }

  const snapshot = await getDoc(doc(db, "streaks", uid));
  if (!snapshot.exists()) {
    return { currentStreak: 0, longestStreak: 0, lastPostDate: null, totalPosts: 0, totalReels: 0, totalLikesReceived: 0 };
  }

  const data = snapshot.data() as Record<string, unknown>;
  return {
    currentStreak: Number(data.currentStreak ?? 0),
    longestStreak: Number(data.longestStreak ?? 0),
    lastPostDate: data.lastPostDate ? String(data.lastPostDate) : null,
    totalPosts: Number(data.totalPosts ?? 0),
    totalReels: Number(data.totalReels ?? 0),
    totalLikesReceived: Number(data.totalLikesReceived ?? 0),
    updatedAt: (data.updatedAt as { seconds?: number } | null) ?? null,
  };
}

export async function recordPostForStreak(contentType: "post" | "reel") {
  if (!auth?.currentUser || !db) return;

  const uid = auth.currentUser.uid;
  const today = new Date().toISOString().slice(0, 10);
  const current = await getUserStreak(uid);

  const lastDate = current.lastPostDate;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let newStreak = 1;
  if (lastDate === today) {
    newStreak = current.currentStreak;
  } else if (lastDate === yesterday) {
    newStreak = current.currentStreak + 1;
  }

  const newTotalPosts = current.totalPosts + (contentType === "post" ? 1 : 0);
  const newTotalReels = current.totalReels + (contentType === "reel" ? 1 : 0);

  await setDoc(doc(db, "streaks", uid), {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, current.longestStreak),
    lastPostDate: today,
    totalPosts: newTotalPosts,
    totalReels: newTotalReels,
    totalLikesReceived: current.totalLikesReceived,
    updatedAt: serverTimestamp(),
  });

  await checkAndUnlockAchievements(uid, {
    currentStreak: newStreak,
    totalPosts: newTotalPosts,
    totalReels: newTotalReels,
    totalLikesReceived: current.totalLikesReceived,
  });
}

export async function updateLikesReceived(userId: string, delta: number) {
  if (!db) return;

  const current = await getUserStreak(userId);
  const newTotal = Math.max(0, current.totalLikesReceived + delta);

  await setDoc(doc(db, "streaks", userId), {
    ...current,
    totalLikesReceived: newTotal,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  await checkAndUnlockAchievements(userId, {
    currentStreak: current.currentStreak,
    totalPosts: current.totalPosts,
    totalReels: current.totalReels,
    totalLikesReceived: newTotal,
  });
}

async function checkAndUnlockAchievements(
  userId: string,
  stats: { currentStreak: number; totalPosts: number; totalReels: number; totalLikesReceived: number }
) {
  if (!db) return;

  const existing = await getUserAchievements(userId);
  const existingTypes = new Set(existing.map((a) => a.type));

  const toUnlock: AchievementType[] = [];

  if (stats.totalPosts >= 1 && !existingTypes.has("first_post")) toUnlock.push("first_post");
  if (stats.totalReels >= 1 && !existingTypes.has("first_reel")) toUnlock.push("first_reel");
  if (stats.currentStreak >= 3 && !existingTypes.has("streak_3")) toUnlock.push("streak_3");
  if (stats.currentStreak >= 7 && !existingTypes.has("streak_7")) toUnlock.push("streak_7");
  if (stats.currentStreak >= 30 && !existingTypes.has("streak_30")) toUnlock.push("streak_30");
  if (stats.totalReels >= 10 && !existingTypes.has("highlights_10")) toUnlock.push("highlights_10");
  if (stats.totalReels >= 100 && !existingTypes.has("highlights_100")) toUnlock.push("highlights_100");
  if (stats.totalLikesReceived >= 50 && !existingTypes.has("likes_50")) toUnlock.push("likes_50");
  if (stats.totalLikesReceived >= 500 && !existingTypes.has("likes_500")) toUnlock.push("likes_500");

  await Promise.all(
    toUnlock.map((type) => {
      const def = ACHIEVEMENT_DEFINITIONS[type];
      return addDoc(collection(db!, "achievements"), {
        userId,
        type,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlockedAt: serverTimestamp(),
      });
    })
  );
}

export async function getUserAchievements(userId?: string): Promise<Achievement[]> {
  const uid = userId ?? auth?.currentUser?.uid;
  if (!db || !uid) return [];

  const snapshot = await getDocs(
    query(collection(db, "achievements"), where("userId", "==", uid), orderBy("unlockedAt", "desc"), limit(50))
  );

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      userId: String(data.userId ?? ""),
      type: String(data.type ?? "") as AchievementType,
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      icon: String(data.icon ?? "🏅"),
      unlockedAt: (data.unlockedAt as { seconds?: number; nanoseconds?: number } | null) ?? null,
    };
  });
}

export async function unlockFollowerAchievement(userId: string, followerCount: number) {
  if (!db) return;

  const existing = await getUserAchievements(userId);
  const existingTypes = new Set(existing.map((a) => a.type));
  const toUnlock: AchievementType[] = [];

  if (followerCount >= 10 && !existingTypes.has("followers_10")) toUnlock.push("followers_10");
  if (followerCount >= 100 && !existingTypes.has("followers_100")) toUnlock.push("followers_100");

  await Promise.all(
    toUnlock.map((type) => {
      const def = ACHIEVEMENT_DEFINITIONS[type];
      return addDoc(collection(db!, "achievements"), {
        userId,
        type,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlockedAt: serverTimestamp(),
      });
    })
  );
}
