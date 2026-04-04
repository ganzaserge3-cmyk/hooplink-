import { collection, getDocs, limit, query } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { searchPosts, type FeedPost } from "@/lib/posts";

export interface AthleteSummary {
  uid: string;
  displayName: string;
  photoURL: string;
  verified: boolean;
  followers: number;
  sport: string;
  position: string;
  team: string;
  skills: string[];
  achievements: string[];
  stats: {
    pointsPerGame: number;
    assistsPerGame: number;
    reboundsPerGame: number;
  };
}

function mapAthlete(data: Record<string, unknown>): AthleteSummary {
  const role = (data.role as Record<string, unknown> | undefined) ?? {};
  const athleteProfile = (data.athleteProfile as Record<string, unknown> | undefined) ?? {};
  const stats = (athleteProfile.stats as Record<string, unknown> | undefined) ?? {};

  return {
    uid: String(data.uid ?? ""),
    displayName: String(data.displayName ?? "HoopLink User"),
    photoURL: String(data.photoURL ?? ""),
    verified: Boolean(data.verified),
    followers: Array.isArray(data.followers) ? (data.followers as string[]).length : 0,
    sport: String(role.sport ?? ""),
    position: String(role.position ?? ""),
    team: String(role.team ?? ""),
    skills: Array.isArray(athleteProfile.skills) ? (athleteProfile.skills as string[]) : [],
    achievements: Array.isArray(athleteProfile.achievements)
      ? (athleteProfile.achievements as string[])
      : [],
    stats: {
      pointsPerGame: Number(stats.pointsPerGame ?? 0),
      assistsPerGame: Number(stats.assistsPerGame ?? 0),
      reboundsPerGame: Number(stats.reboundsPerGame ?? 0),
    },
  };
}

export async function getAthletes() {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "users"), limit(100)));
  return snapshot.docs
    .map((docSnapshot: { data: () => Record<string, unknown> }) =>
      mapAthlete(docSnapshot.data() as Record<string, unknown>)
    )
    .filter((athlete: AthleteSummary) => athlete.sport || athlete.position || athlete.skills.length > 0);
}

export async function getFeaturedAthletes() {
  const athletes = await getAthletes();
  return athletes
    .sort((left: AthleteSummary, right: AthleteSummary) => {
      const leftScore =
        (left.verified ? 5 : 0) +
        left.followers +
        left.achievements.length * 2 +
        left.skills.length;
      const rightScore =
        (right.verified ? 5 : 0) +
        right.followers +
        right.achievements.length * 2 +
        right.skills.length;
      return rightScore - leftScore;
    })
    .slice(0, 8);
}

export async function getLeaderboard(metric: "followers" | "points" | "wins" | "achievements") {
  const athletes = await getAthletes();
  return athletes.sort((left: AthleteSummary, right: AthleteSummary) => {
    if (metric === "followers") {
      return right.followers - left.followers;
    }

    if (metric === "points") {
      return right.stats.pointsPerGame - left.stats.pointsPerGame;
    }

    if (metric === "achievements") {
      return right.achievements.length - left.achievements.length;
    }

    return (
      (right.achievements.filter((achievement: string) => achievement.toLowerCase().includes("win")).length ?? 0) -
      (left.achievements.filter((achievement: string) => achievement.toLowerCase().includes("win")).length ?? 0)
    );
  });
}

const challengeTemplates = [
  {
    title: "Weak Hand Week",
    description: "Post a clip showing your weak-hand finishing or dribble work.",
    hashtag: "weakhandweek",
  },
  {
    title: "Range Builder",
    description: "Share a shooting workout or game clip from deep range.",
    hashtag: "rangebuilder",
  },
  {
    title: "Lockdown Clip",
    description: "Post your best defensive sequence or footwork drill.",
    hashtag: "lockdownclip",
  },
];

export function getCurrentWeeklyChallenge() {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return challengeTemplates[weekNumber % challengeTemplates.length];
}

export async function getWeeklyChallengePosts(): Promise<FeedPost[]> {
  const challenge = getCurrentWeeklyChallenge();
  const posts = await searchPosts(challenge.hashtag);
  return posts
    .filter((post: FeedPost) => post.hashtags.includes(challenge.hashtag))
    .slice(0, 12);
}
