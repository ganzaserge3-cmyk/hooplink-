import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type AchievementType =
  | "first_post"
  | "first_follow"
  | "first_follower"
  | "profile_complete"
  | "verified_athlete"
  | "hundred_followers"
  | "thousand_followers"
  | "first_highlight"
  | "first_reel"
  | "first_story"
  | "first_message"
  | "first_booking"
  | "first_merch_sale"
  | "perfect_game"
  | "recruiting_star"
  | "team_captain"
  | "coach_certified"
  | "scout_pro"
  | "fan_loyal"
  | "content_creator"
  | "social_butterfly"
  | "trendsetter"
  | "community_builder"
  | "rising_star"
  | "all_star"
  | "legend"
  | "daily_streak_7"
  | "daily_streak_30"
  | "early_adopter"
  | "beta_tester";

export interface Achievement {
  id: AchievementType;
  name: string;
  description: string;
  icon: string;
  category: "social" | "performance" | "engagement" | "milestone" | "special";
  points: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  requirements: {
    type: string;
    value: number | string | boolean;
  };
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface UserGamification {
  level: number;
  totalPoints: number;
  availablePoints: number;
  achievements: Achievement[];
  dailyChallenges: DailyChallenge[];
  streaks: {
    current: number;
    longest: number;
    lastActivity: Date;
  };
  weeklyStats: {
    posts: number;
    followers: number;
    engagement: number;
    weekStart: Date;
  };
  unlockedBadges: string[];
  redeemedRewards: string[];
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: "post" | "follow" | "engage" | "profile" | "social";
  target: number;
  current: number;
  points: number;
  expiresAt: Date;
  completed: boolean;
  claimed: boolean;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "premium_feature" | "badge" | "title" | "customization";
  value: string;
  available: boolean;
}

// Achievement definitions
export const ACHIEVEMENTS: Record<AchievementType, Omit<Achievement, "unlockedAt" | "progress" | "maxProgress">> = {
  first_post: {
    id: "first_post",
    name: "First Post",
    description: "Share your first post on HoopLink",
    icon: "📝",
    category: "social",
    points: 10,
    rarity: "common",
    requirements: { type: "posts", value: 1 },
  },
  first_follow: {
    id: "first_follow",
    name: "Social Butterfly",
    description: "Follow your first athlete or coach",
    icon: "🦋",
    category: "social",
    points: 5,
    rarity: "common",
    requirements: { type: "following", value: 1 },
  },
  first_follower: {
    id: "first_follower",
    name: "Rising Star",
    description: "Get your first follower",
    icon: "⭐",
    category: "milestone",
    points: 15,
    rarity: "common",
    requirements: { type: "followers", value: 1 },
  },
  profile_complete: {
    id: "profile_complete",
    name: "Profile Pro",
    description: "Complete 100% of your profile",
    icon: "👤",
    category: "engagement",
    points: 25,
    rarity: "rare",
    requirements: { type: "profile_completion", value: 100 },
  },
  verified_athlete: {
    id: "verified_athlete",
    name: "Verified Athlete",
    description: "Get verified as an athlete",
    icon: "✅",
    category: "milestone",
    points: 50,
    rarity: "rare",
    requirements: { type: "verified", value: true },
  },
  hundred_followers: {
    id: "hundred_followers",
    name: "Century Club",
    description: "Reach 100 followers",
    icon: "💯",
    category: "milestone",
    points: 100,
    rarity: "epic",
    requirements: { type: "followers", value: 100 },
  },
  thousand_followers: {
    id: "thousand_followers",
    name: "Influencer",
    description: "Reach 1,000 followers",
    icon: "👑",
    category: "milestone",
    points: 500,
    rarity: "legendary",
    requirements: { type: "followers", value: 1000 },
  },
  first_highlight: {
    id: "first_highlight",
    name: "Highlight Reel",
    description: "Upload your first highlight video",
    icon: "🎥",
    category: "performance",
    points: 20,
    rarity: "common",
    requirements: { type: "highlights", value: 1 },
  },
  first_reel: {
    id: "first_reel",
    name: "Reel Star",
    description: "Create your first reel",
    icon: "📹",
    category: "engagement",
    points: 15,
    rarity: "common",
    requirements: { type: "reels", value: 1 },
  },
  first_story: {
    id: "first_story",
    name: "Storyteller",
    description: "Share your first story",
    icon: "📖",
    category: "social",
    points: 10,
    rarity: "common",
    requirements: { type: "stories", value: 1 },
  },
  first_message: {
    id: "first_message",
    name: "Connector",
    description: "Send your first message",
    icon: "💬",
    category: "social",
    points: 5,
    rarity: "common",
    requirements: { type: "messages", value: 1 },
  },
  first_booking: {
    id: "first_booking",
    name: "Booked Solid",
    description: "Get your first training or consultation booking",
    icon: "📅",
    category: "engagement",
    points: 30,
    rarity: "rare",
    requirements: { type: "bookings", value: 1 },
  },
  first_merch_sale: {
    id: "first_merch_sale",
    name: "Entrepreneur",
    description: "Make your first merchandise sale",
    icon: "🛍️",
    category: "engagement",
    points: 40,
    rarity: "rare",
    requirements: { type: "merch_sales", value: 1 },
  },
  perfect_game: {
    id: "perfect_game",
    name: "Perfect Game",
    description: "Record a perfect game (all stats at career high)",
    icon: "🏀",
    category: "performance",
    points: 75,
    rarity: "epic",
    requirements: { type: "perfect_game", value: true },
  },
  recruiting_star: {
    id: "recruiting_star",
    name: "Recruiting Star",
    description: "Receive 10+ college recruiting inquiries",
    icon: "🎓",
    category: "milestone",
    points: 60,
    rarity: "epic",
    requirements: { type: "recruiting_inquiries", value: 10 },
  },
  team_captain: {
    id: "team_captain",
    name: "Team Captain",
    description: "Become team captain",
    icon: "👔",
    category: "milestone",
    points: 35,
    rarity: "rare",
    requirements: { type: "team_captain", value: true },
  },
  coach_certified: {
    id: "coach_certified",
    name: "Certified Coach",
    description: "Complete coaching certification",
    icon: "🎓",
    category: "engagement",
    points: 45,
    rarity: "rare",
    requirements: { type: "certified_coach", value: true },
  },
  scout_pro: {
    id: "scout_pro",
    name: "Scout Pro",
    description: "Complete 50+ player evaluations",
    icon: "🔍",
    category: "engagement",
    points: 55,
    rarity: "epic",
    requirements: { type: "evaluations", value: 50 },
  },
  fan_loyal: {
    id: "fan_loyal",
    name: "Loyal Fan",
    description: "Follow 50+ athletes",
    icon: "❤️",
    category: "social",
    points: 25,
    rarity: "rare",
    requirements: { type: "following", value: 50 },
  },
  content_creator: {
    id: "content_creator",
    name: "Content Creator",
    description: "Create 100+ posts",
    icon: "🎨",
    category: "engagement",
    points: 80,
    rarity: "epic",
    requirements: { type: "posts", value: 100 },
  },
  social_butterfly: {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Connect with 200+ users",
    icon: "🦋",
    category: "social",
    points: 90,
    rarity: "epic",
    requirements: { type: "connections", value: 200 },
  },
  trendsetter: {
    id: "trendsetter",
    name: "Trendsetter",
    description: "Start a trending topic",
    icon: "📈",
    category: "special",
    points: 120,
    rarity: "legendary",
    requirements: { type: "trending_topic", value: true },
  },
  community_builder: {
    id: "community_builder",
    name: "Community Builder",
    description: "Create and manage a community group",
    icon: "👥",
    category: "engagement",
    points: 70,
    rarity: "epic",
    requirements: { type: "community_created", value: true },
  },
  rising_star: {
    id: "rising_star",
    name: "Rising Star",
    description: "Reach level 10",
    icon: "🌟",
    category: "milestone",
    points: 150,
    rarity: "epic",
    requirements: { type: "level", value: 10 },
  },
  all_star: {
    id: "all_star",
    name: "All-Star",
    description: "Reach level 25",
    icon: "⭐",
    category: "milestone",
    points: 300,
    rarity: "legendary",
    requirements: { type: "level", value: 25 },
  },
  legend: {
    id: "legend",
    name: "Legend",
    description: "Reach level 50",
    icon: "👑",
    category: "milestone",
    points: 500,
    rarity: "legendary",
    requirements: { type: "level", value: 50 },
  },
  daily_streak_7: {
    id: "daily_streak_7",
    name: "Week Warrior",
    description: "7-day activity streak",
    icon: "🔥",
    category: "engagement",
    points: 35,
    rarity: "rare",
    requirements: { type: "streak", value: 7 },
  },
  daily_streak_30: {
    id: "daily_streak_30",
    name: "Monthly Master",
    description: "30-day activity streak",
    icon: "🔥",
    category: "engagement",
    points: 100,
    rarity: "epic",
    requirements: { type: "streak", value: 30 },
  },
  early_adopter: {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Joined during beta",
    icon: "🚀",
    category: "special",
    points: 25,
    rarity: "rare",
    requirements: { type: "beta_user", value: true },
  },
  beta_tester: {
    id: "beta_tester",
    name: "Beta Tester",
    description: "Active beta tester",
    icon: "🧪",
    category: "special",
    points: 50,
    rarity: "epic",
    requirements: { type: "beta_tester", value: true },
  },
};

// Level calculation
export function calculateLevel(points: number): number {
  // Level = floor(sqrt(points / 10)) + 1
  // This creates a gentle curve: L1=0pts, L2=10pts, L3=40pts, L4=90pts, L5=160pts, etc.
  return Math.floor(Math.sqrt(points / 10)) + 1;
}

export function pointsForNextLevel(currentLevel: number): number {
  // Points needed = (level)^2 * 10
  return currentLevel * currentLevel * 10;
}

export function pointsInCurrentLevel(totalPoints: number): number {
  const level = calculateLevel(totalPoints);
  const prevLevelPoints = pointsForNextLevel(level - 1);
  return totalPoints - prevLevelPoints;
}

// Initialize user gamification
export async function initializeUserGamification(uid: string): Promise<void> {
  if (!db) return;

  const gamification: UserGamification = {
    level: 1,
    totalPoints: 0,
    availablePoints: 0,
    achievements: [],
    dailyChallenges: [],
    streaks: {
      current: 0,
      longest: 0,
      lastActivity: new Date(),
    },
    weeklyStats: {
      posts: 0,
      followers: 0,
      engagement: 0,
      weekStart: new Date(),
    },
    unlockedBadges: [],
    redeemedRewards: [],
  };

  await setDoc(doc(db, "gamification", uid), gamification, { merge: true });
}

// Get user gamification data
export async function getUserGamification(uid: string): Promise<UserGamification | null> {
  if (!db) return null;

  try {
    const docSnap = await getDoc(doc(db, "gamification", uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserGamification;
    }
    return null;
  } catch (error) {
    console.error("Error getting gamification data:", error);
    return null;
  }
}

// Award achievement
export async function awardAchievement(uid: string, achievementId: AchievementType): Promise<boolean> {
  if (!db) return false;

  try {
    const gamificationRef = doc(db, "gamification", uid);
    const gamificationSnap = await getDoc(gamificationRef);

    if (!gamificationSnap.exists()) {
      await initializeUserGamification(uid);
      return awardAchievement(uid, achievementId);
    }

    const gamification = gamificationSnap.data() as UserGamification;

    // Check if already unlocked
    if (gamification.achievements.some(a => a.id === achievementId)) {
      return false;
    }

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return false;

    const newAchievement: Achievement = {
      ...achievement,
      unlockedAt: new Date(),
    };

    // Update gamification
    const updatedAchievements = [...gamification.achievements, newAchievement];
    const newTotalPoints = gamification.totalPoints + achievement.points;
    const newLevel = calculateLevel(newTotalPoints);

    await updateDoc(gamificationRef, {
      achievements: updatedAchievements,
      totalPoints: newTotalPoints,
      availablePoints: gamification.availablePoints + achievement.points,
      level: newLevel,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error awarding achievement:", error);
    return false;
  }
}

// Check and award achievements based on user data
export async function checkAndAwardAchievements(uid: string, userData: any): Promise<AchievementType[]> {
  const awarded: AchievementType[] = [];

  // First post
  if (userData.postsCount >= 1 && !(await hasAchievement(uid, "first_post"))) {
    if (await awardAchievement(uid, "first_post")) awarded.push("first_post");
  }

  // First follow
  if (userData.following?.length >= 1 && !(await hasAchievement(uid, "first_follow"))) {
    if (await awardAchievement(uid, "first_follow")) awarded.push("first_follow");
  }

  // First follower
  if (userData.followers?.length >= 1 && !(await hasAchievement(uid, "first_follower"))) {
    if (await awardAchievement(uid, "first_follower")) awarded.push("first_follower");
  }

  // Profile complete (simplified check)
  if (userData.role && userData.location && !(await hasAchievement(uid, "profile_complete"))) {
    if (await awardAchievement(uid, "profile_complete")) awarded.push("profile_complete");
  }

  // Verified athlete
  if (userData.verified && userData.role?.type === "athlete" && !(await hasAchievement(uid, "verified_athlete"))) {
    if (await awardAchievement(uid, "verified_athlete")) awarded.push("verified_athlete");
  }

  // Follower milestones
  const followerCount = userData.followers?.length || 0;
  if (followerCount >= 100 && !(await hasAchievement(uid, "hundred_followers"))) {
    if (await awardAchievement(uid, "hundred_followers")) awarded.push("hundred_followers");
  }
  if (followerCount >= 1000 && !(await hasAchievement(uid, "thousand_followers"))) {
    if (await awardAchievement(uid, "thousand_followers")) awarded.push("thousand_followers");
  }

  // Level-based achievements
  const gamification = await getUserGamification(uid);
  if (gamification) {
    if (gamification.level >= 10 && !(await hasAchievement(uid, "rising_star"))) {
      if (await awardAchievement(uid, "rising_star")) awarded.push("rising_star");
    }
    if (gamification.level >= 25 && !(await hasAchievement(uid, "all_star"))) {
      if (await awardAchievement(uid, "all_star")) awarded.push("all_star");
    }
    if (gamification.level >= 50 && !(await hasAchievement(uid, "legend"))) {
      if (await awardAchievement(uid, "legend")) awarded.push("legend");
    }
  }

  return awarded;
}

// Check if user has achievement
export async function hasAchievement(uid: string, achievementId: AchievementType): Promise<boolean> {
  const gamification = await getUserGamification(uid);
  return gamification?.achievements.some(a => a.id === achievementId) || false;
}

// Add points to user
export async function addPoints(uid: string, points: number, reason: string): Promise<void> {
  if (!db || points <= 0) return;

  try {
    const gamificationRef = doc(db, "gamification", uid);
    const gamificationSnap = await getDoc(gamificationRef);

    if (!gamificationSnap.exists()) {
      await initializeUserGamification(uid);
      return addPoints(uid, points, reason);
    }

    const gamification = gamificationSnap.data() as UserGamification;
    const newTotalPoints = gamification.totalPoints + points;
    const newLevel = calculateLevel(newTotalPoints);

    await updateDoc(gamificationRef, {
      totalPoints: newTotalPoints,
      availablePoints: gamification.availablePoints + points,
      level: newLevel,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding points:", error);
  }
}

// Generate daily challenges
export function generateDailyChallenges(): DailyChallenge[] {
  const challenges: DailyChallenge[] = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const challengeTemplates = [
    {
      title: "Share a Highlight",
      description: "Post a game highlight or training clip",
      type: "post" as const,
      target: 1,
      points: 10,
    },
    {
      title: "Connect with Peers",
      description: "Follow 3 new athletes or coaches",
      type: "follow" as const,
      target: 3,
      points: 15,
    },
    {
      title: "Engage with Community",
      description: "Like or comment on 5 posts",
      type: "engage" as const,
      target: 5,
      points: 8,
    },
    {
      title: "Update Profile",
      description: "Add a new achievement or update stats",
      type: "profile" as const,
      target: 1,
      points: 12,
    },
    {
      title: "Spread the Word",
      description: "Share a post or invite a friend",
      type: "social" as const,
      target: 1,
      points: 10,
    },
  ];

  // Select 3 random challenges
  const shuffled = challengeTemplates.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);

  selected.forEach((template, index) => {
    challenges.push({
      id: `daily_${Date.now()}_${index}`,
      ...template,
      current: 0,
      expiresAt: tomorrow,
      completed: false,
      claimed: false,
    });
  });

  return challenges;
}

// Update daily challenge progress
export async function updateChallengeProgress(
  uid: string,
  challengeType: DailyChallenge["type"],
  increment: number = 1
): Promise<void> {
  if (!db) return;

  try {
    const gamificationRef = doc(db, "gamification", uid);
    const gamificationSnap = await getDoc(gamificationRef);

    if (!gamificationSnap.exists()) return;

    const gamification = gamificationSnap.data() as UserGamification;
    const updatedChallenges = gamification.dailyChallenges.map(challenge => {
      if (challenge.type === challengeType && !challenge.completed) {
        const newCurrent = Math.min(challenge.current + increment, challenge.target);
        const completed = newCurrent >= challenge.target;

        return {
          ...challenge,
          current: newCurrent,
          completed,
        };
      }
      return challenge;
    });

    await updateDoc(gamificationRef, {
      dailyChallenges: updatedChallenges,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating challenge progress:", error);
  }
}

// Claim daily challenge reward
export async function claimChallengeReward(uid: string, challengeId: string): Promise<boolean> {
  if (!db) return false;

  try {
    const gamificationRef = doc(db, "gamification", uid);
    const gamificationSnap = await getDoc(gamificationRef);

    if (!gamificationSnap.exists()) return false;

    const gamification = gamificationSnap.data() as UserGamification;
    const challengeIndex = gamification.dailyChallenges.findIndex(c => c.id === challengeId);

    if (challengeIndex === -1) return false;

    const challenge = gamification.dailyChallenges[challengeIndex];
    if (!challenge.completed || challenge.claimed) return false;

    // Mark as claimed and add points
    const updatedChallenges = [...gamification.dailyChallenges];
    updatedChallenges[challengeIndex] = { ...challenge, claimed: true };

    await updateDoc(gamificationRef, {
      dailyChallenges: updatedChallenges,
      availablePoints: gamification.availablePoints + challenge.points,
      totalPoints: gamification.totalPoints + challenge.points,
      level: calculateLevel(gamification.totalPoints + challenge.points),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error claiming challenge reward:", error);
    return false;
  }
}

// Update activity streak
export async function updateActivityStreak(uid: string): Promise<void> {
  if (!db) return;

  try {
    const gamificationRef = doc(db, "gamification", uid);
    const gamificationSnap = await getDoc(gamificationRef);

    if (!gamificationSnap.exists()) return;

    const gamification = gamificationSnap.data() as UserGamification;
    const now = new Date();
    const lastActivity = gamification.streaks.lastActivity.toDate();
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = gamification.streaks.current;

    if (daysSinceLastActivity === 1) {
      // Consecutive day
      newStreak += 1;
    } else if (daysSinceLastActivity > 1) {
      // Streak broken
      newStreak = 1;
    }
    // If same day, keep current streak

    const newLongest = Math.max(gamification.streaks.longest, newStreak);

    await updateDoc(gamificationRef, {
      streaks: {
        current: newStreak,
        longest: newLongest,
        lastActivity: now,
      },
      updatedAt: serverTimestamp(),
    });

    // Check streak achievements
    if (newStreak >= 7 && !(await hasAchievement(uid, "daily_streak_7"))) {
      await awardAchievement(uid, "daily_streak_7");
    }
    if (newStreak >= 30 && !(await hasAchievement(uid, "daily_streak_30"))) {
      await awardAchievement(uid, "daily_streak_30");
    }
  } catch (error) {
    console.error("Error updating activity streak:", error);
  }
}

// Get leaderboard
export async function getGamificationLeaderboard(limit: number = 50): Promise<Array<{
  uid: string;
  displayName: string;
  level: number;
  totalPoints: number;
  achievements: number;
}>> {
  if (!db) return [];

  try {
    // This would need to be implemented with a more complex query
    // For now, return empty array - would need Cloud Functions for proper leaderboard
    return [];
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return [];
  }
}

// Available rewards
export const REWARDS: Reward[] = [
  {
    id: "premium_month",
    name: "Premium Month",
    description: "1 month of premium features",
    cost: 100,
    type: "premium_feature",
    value: "premium_month",
    available: true,
  },
  {
    id: "custom_badge",
    name: "Custom Badge",
    description: "Create a custom profile badge",
    cost: 200,
    type: "customization",
    value: "custom_badge",
    available: true,
  },
  {
    id: "featured_post",
    name: "Featured Post",
    description: "Feature a post on the homepage",
    cost: 150,
    type: "premium_feature",
    value: "featured_post",
    available: true,
  },
  {
    id: "analytics_boost",
    name: "Analytics Boost",
    description: "Advanced analytics for 1 week",
    cost: 75,
    type: "premium_feature",
    value: "analytics_boost",
    available: true,
  },
];

// Redeem reward
export async function redeemReward(uid: string, rewardId: string): Promise<boolean> {
  if (!db) return false;

  try {
    const gamificationRef = doc(db, "gamification", uid);
    const gamificationSnap = await getDoc(gamificationRef);

    if (!gamificationSnap.exists()) return false;

    const gamification = gamificationSnap.data() as UserGamification;
    const reward = REWARDS.find(r => r.id === rewardId);

    if (!reward || gamification.availablePoints < reward.cost) return false;

    // Check if already redeemed
    if (gamification.redeemedRewards.includes(rewardId)) return false;

    await updateDoc(gamificationRef, {
      availablePoints: gamification.availablePoints - reward.cost,
      redeemedRewards: arrayUnion(rewardId),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return false;
  }
}
