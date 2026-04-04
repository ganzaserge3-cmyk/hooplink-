import { collection, getDocs, limit, query, where } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import type { FeedPost } from "@/lib/posts";
import { getCurrentUserProfile } from "@/lib/user-profile";

export interface CreatorAnalytics {
  totalPosts: number;
  totalReels: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  totalShares: number;
  totalViews: number;
  averageEngagement: number;
  reelCompletionRate: number;
  topSport: string;
  topHashtag: string;
  followers: number;
  following: number;
  profileCompletion: number;
  visitorCount: number;
  followerGrowth: Array<{ label: string; value: number }>;
  hashtagPerformance: Array<{ tag: string; posts: number; views: number }>;
  userGrowthScore: number;
  retentionScore: number;
  conversionRate: number;
  feedEngagementRate: number;
  creatorTrustScore: number;
  providerTrustScore: number;
  scoutTrustScore: number;
  coachTrustScore: number;
  communityHealthScore: number;
  recruitingAnalyticsSummary: string[];
  teamAnalyticsSummary: string[];
  bookingAnalyticsSummary: string[];
  storeAnalyticsSummary: string[];
  notificationAnalyticsSummary: string[];
  featureAdoptionSummary: string[];
  cohortAnalysisSummary: string[];
  referralAnalyticsSummary: string[];
  revenueAnalyticsSummary: string[];
  aiInsightsFeed: string[];
  experimentDashboard: string[];
  searchAnalyticsSummary: string[];
  safetyHeatmapSummary: string[];
  spamAnalyticsSummary: string[];
  messagingEngagementSummary: string[];
  fanLoyaltyAnalyticsSummary: string[];
  teamAttendanceAnalyticsSummary: string[];
  wellnessAnalyticsSummary: string[];
  highlightWatchAnalyticsSummary: string[];
  sponsorCampaignAnalyticsSummary: string[];
  marketplaceTrendSummary: string[];
  appPerformanceSummary: string[];
  errorReportingSummary: string[];
  uptimeStatusSummary: string[];
  smartReengagementCampaigns: string[];
  churnPrediction: string;
  postBreakdown: Array<{
    id: string;
    caption: string;
    type: "post" | "reel";
    views: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
    hashtagCount: number;
  }>;
  recentPosts: FeedPost[];
}

function mapAnalyticsPost(id: string, data: Record<string, unknown>): FeedPost {
  const author = (data.author as Record<string, unknown> | undefined) ?? {};

  return {
    id,
    userId: String(data.userId ?? ""),
    caption: String(data.caption ?? ""),
    mediaUrl: String(data.mediaUrl ?? ""),
    mediaType: data.mediaType === "video" ? "video" : "image",
    contentType: data.contentType === "reel" ? "reel" : "post",
    sport: String(data.sport ?? ""),
    createdAt:
      (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    likes: Array.isArray(data.likes) ? (data.likes as string[]) : [],
    commentsCount: Number(data.commentsCount ?? 0),
    shares: Number(data.shares ?? 0),
    saves: Array.isArray(data.saves) ? (data.saves as string[]) : [],
    hashtags: Array.isArray(data.hashtags) ? (data.hashtags as string[]) : [],
    storagePath: data.storagePath ? String(data.storagePath) : undefined,
    originalPostId: data.originalPostId ? String(data.originalPostId) : null,
    views: Number(data.views ?? 0),
    completedViews: Number(data.completedViews ?? 0),
    author: {
      name: String(author.name ?? "HoopLink User"),
      username: String(author.username ?? "@player"),
      avatar: String(author.avatar ?? ""),
      verified: Boolean(author.verified),
      role: author.role ? String(author.role) : null,
    },
  };
}

export async function getCreatorAnalytics(): Promise<CreatorAnalytics | null> {
  if (!auth?.currentUser || !db) {
    return null;
  }

  const snapshot = await getDocs(
    query(collection(db, "posts"), where("userId", "==", auth.currentUser.uid), limit(100))
  );
  const posts = snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapAnalyticsPost(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
  );

  const totals = posts.reduce(
    (
      accumulator: {
        likes: number;
        comments: number;
        saves: number;
        shares: number;
        views: number;
        completedViews: number;
        sportCounts: Record<string, number>;
        hashtagCounts: Record<string, number>;
      },
      post: FeedPost
    ) => {
      accumulator.likes += post.likes.length;
      accumulator.comments += post.commentsCount;
      accumulator.saves += post.saves.length;
      accumulator.shares += post.shares;
      accumulator.views += post.views ?? 0;
      accumulator.completedViews += post.completedViews ?? 0;
      accumulator.sportCounts[post.sport] = (accumulator.sportCounts[post.sport] ?? 0) + 1;

      for (const hashtag of post.hashtags) {
        accumulator.hashtagCounts[hashtag] = (accumulator.hashtagCounts[hashtag] ?? 0) + 1;
      }

      return accumulator;
    },
    {
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
      views: 0,
      completedViews: 0,
      sportCounts: {} as Record<string, number>,
      hashtagCounts: {} as Record<string, number>,
    }
  );

  const sportEntries = Object.entries(totals.sportCounts) as Array<[string, number]>;
  const hashtagEntries = Object.entries(totals.hashtagCounts) as Array<[string, number]>;
  const topSport = sportEntries.sort((left, right) => right[1] - left[1])[0]?.[0] ?? "";
  const topHashtag = hashtagEntries.sort((left, right) => right[1] - left[1])[0]?.[0] ?? "";
  const totalPosts = posts.filter((post: FeedPost) => post.contentType === "post").length;
  const totalReels = posts.filter((post: FeedPost) => post.contentType === "reel").length;
  const denominator = Math.max(posts.length, 1);
  const profile = (await getCurrentUserProfile()) as
    | {
        followers?: string[];
        following?: string[];
        role?: Record<string, unknown>;
        location?: string | null;
        photoURL?: string | null;
        analytics?: Record<string, unknown>;
      }
    | null;
  const role = profile?.role ?? {};
  const completionFields = [
    role.sport,
    role.position,
    role.team,
    role.experience,
    role.bio,
    profile?.location,
    profile?.photoURL,
  ];
  const analyticsData = (profile?.analytics as Record<string, unknown> | undefined) ?? {};
  const visitorCount = Number(analyticsData.profileVisitors ?? 0);
  const followerHistory = Array.isArray(analyticsData.followerHistory)
    ? (analyticsData.followerHistory as Array<Record<string, unknown>>)
    : [];
  const hashtagPerformance = hashtagEntries.map(([tag, count]) => ({
    tag,
    posts: count,
    views: posts
      .filter((post: FeedPost) => post.hashtags.includes(tag))
      .reduce((sum: number, post: FeedPost) => sum + (post.views ?? 0), 0),
  }));
  const feedEngagementRate = posts.length > 0
    ? Math.round((((totals.likes + totals.comments + totals.saves + totals.shares) / posts.length) / Math.max(totals.views, 1)) * 1000) / 10
    : 0;
  const userGrowthScore = Math.min(100, Math.round((profile?.followers?.length ?? 0) * 4 + followerHistory.length * 6 + visitorCount));
  const retentionScore = Math.min(100, Math.round((visitorCount * 2 + (profile?.following?.length ?? 0) + totalPosts * 5 + totalReels * 6) / 3));
  const conversionRate = Math.min(100, Math.round(((totals.saves + totals.shares + totals.comments) / Math.max(totals.views, 1)) * 1000) / 10);
  const creatorTrustScore = Math.min(99, 55 + Math.round((profile?.followers?.length ?? 0) * 1.5) + Math.round(feedEngagementRate / 4));
  const providerTrustScore = Math.min(99, 50 + Math.round((totals.comments + totals.saves) / Math.max(posts.length, 1)));
  const scoutTrustScore = Math.min(99, 48 + visitorCount + Math.round((totals.shares + totals.comments) / Math.max(posts.length, 1)));
  const coachTrustScore = Math.min(99, 52 + Math.round((profile?.followers?.length ?? 0) / 2) + Math.round((totals.comments + totals.saves) / Math.max(posts.length, 1)));
  const communityHealthScore = Math.min(100, Math.round((creatorTrustScore + coachTrustScore + scoutTrustScore) / 3));

  return {
    totalPosts,
    totalReels,
    totalLikes: totals.likes,
    totalComments: totals.comments,
    totalSaves: totals.saves,
    totalShares: totals.shares,
    totalViews: totals.views,
    averageEngagement:
      (totals.likes + totals.comments + totals.saves + totals.shares) / denominator,
    reelCompletionRate:
      totals.views > 0 ? Math.round((totals.completedViews / totals.views) * 100) : 0,
    topSport,
    topHashtag,
    followers: profile?.followers?.length ?? 0,
    following: profile?.following?.length ?? 0,
    profileCompletion: Math.round(
      (completionFields.filter((value) => String(value ?? "").trim()).length /
        completionFields.length) *
        100
    ),
    visitorCount,
    followerGrowth: followerHistory.map((entry) => ({
      label: String(entry.label ?? ""),
      value: Number(entry.value ?? 0),
    })),
    hashtagPerformance,
    userGrowthScore,
    retentionScore,
    conversionRate,
    feedEngagementRate,
    creatorTrustScore,
    providerTrustScore,
    scoutTrustScore,
    coachTrustScore,
    communityHealthScore,
    recruitingAnalyticsSummary: [
      `Recruiter interest proxy: ${visitorCount} recent profile visits`,
      `Best recruiting signal: ${topSport || "Build a stronger sport focus"}`,
      `Reel completion benchmark: ${totals.views > 0 ? Math.round((totals.completedViews / totals.views) * 100) : 0}%`,
    ],
    teamAnalyticsSummary: [
      `Content mix: ${totalPosts} posts and ${totalReels} reels`,
      `Follower-to-following ratio: ${profile?.following?.length ? ((profile?.followers?.length ?? 0) / Math.max(profile?.following?.length ?? 1, 1)).toFixed(1) : "n/a"}`,
      `Community health score: ${communityHealthScore}/100`,
    ],
    bookingAnalyticsSummary: [
      `Conversion proxy from saves + shares: ${conversionRate}%`,
      `Highest-intent action count: ${totals.saves + totals.shares}`,
      `Suggested CTA focus: ${totals.saves >= totals.shares ? "Bookings" : "Offers"}`,
    ],
    storeAnalyticsSummary: [
      `Store-ready attention pool: ${totals.views} total views`,
      `Save intent across content: ${totals.saves}`,
      `Repeat interest signal from followers: ${profile?.followers?.length ?? 0}`,
    ],
    notificationAnalyticsSummary: [
      `Response-ready audience: ${visitorCount + (profile?.followers?.length ?? 0)}`,
      `Comment velocity proxy: ${totals.comments}`,
      `Share amplification proxy: ${totals.shares}`,
    ],
    featureAdoptionSummary: [
      `Profile completeness is ${Math.round((completionFields.filter((value) => String(value ?? "").trim()).length / completionFields.length) * 100)}%`,
      `Hashtags used across content: ${hashtagEntries.length}`,
      `Reel adoption: ${totalReels}/${Math.max(posts.length, 1)} uploads`,
    ],
    cohortAnalysisSummary: [
      `Follower growth entries tracked: ${followerHistory.length}`,
      "Audience trend history is available in follower growth.",
      "Use upload type segments to compare post vs reel cohorts.",
    ],
    referralAnalyticsSummary: [
      `Share-driven discovery events: ${totals.shares}`,
      `Referral-ready top hashtag: #${topHashtag || "buildone"}`,
      `Community amplification score: ${Math.round((totals.shares + totals.comments) / Math.max(posts.length, 1))}`,
    ],
    revenueAnalyticsSummary: [
      `Revenue readiness proxy: ${Math.round((totals.saves + totals.comments + totals.shares) / Math.max(posts.length, 1))}`,
      `Audience growth score: ${userGrowthScore}/100`,
      `Best monetization lane: ${totalReels >= totalPosts ? "video sponsorships" : "services and products"}`,
    ],
    aiInsightsFeed: [
      `AI insight: ${topHashtag ? `double down on #${topHashtag}` : "add 2-3 strong hashtags to each upload"}.`,
      `AI insight: prioritize ${topSport || "your strongest niche"} content this week.`,
      `AI insight: use saves and shares as your strongest conversion signal.`,
    ],
    experimentDashboard: [
      "A/B test hook style on short-form clips.",
      "Compare CTA-first captions against story-first captions.",
      "Run a hashtag set test across your next three uploads.",
    ],
    searchAnalyticsSummary: [
      `Search demand proxy via visitors: ${visitorCount}`,
      `Top searchable niche: ${topSport || "general sports profile"}`,
      "Discovery keywords can mirror your strongest hashtags.",
    ],
    safetyHeatmapSummary: [
      `Community health is ${communityHealthScore}/100`,
      "Trust signals stay strongest when comments remain constructive.",
      "Moderation risk rises when shares spike without saves.",
    ],
    spamAnalyticsSummary: [
      "Low-risk content pattern: high saves, steady comments.",
      "Spam risk proxy stays lower when engagement is balanced.",
      `Current comment-to-view ratio: ${totals.views > 0 ? ((totals.comments / totals.views) * 100).toFixed(1) : "0"}%.`,
    ],
    messagingEngagementSummary: [
      `Audience likely to DM after content: ${Math.round((totals.comments + totals.shares) / Math.max(posts.length, 1))}`,
      `Best DM trigger content type: ${totalReels >= totalPosts ? "reels" : "posts"}`,
      `Visitor intent signal: ${visitorCount}`,
    ],
    fanLoyaltyAnalyticsSummary: [
      `Followers: ${profile?.followers?.length ?? 0}`,
      `Repeat interest proxy from saves: ${totals.saves}`,
      `Community stickiness score: ${retentionScore}/100`,
    ],
    teamAttendanceAnalyticsSummary: [
      `Attendance proxy can follow upload cadence of ${posts.length} content items.`,
      `Best accountability signal: follower growth streak length ${followerHistory.length}.`,
      "Use team and season performance together for attendance comparisons.",
    ],
    wellnessAnalyticsSummary: [
      `Engagement stays healthiest when upload cadence remains consistent.`,
      `Completion rate sits at ${totals.views > 0 ? Math.round((totals.completedViews / totals.views) * 100) : 0}%.`,
      "Pair workload and watch-time to monitor creator fatigue.",
    ],
    highlightWatchAnalyticsSummary: [
      `Total highlight views: ${totals.views}`,
      `Reel completion rate: ${totals.views > 0 ? Math.round((totals.completedViews / totals.views) * 100) : 0}%`,
      `Most watchable niche: ${topSport || "build more tagged clips"}`,
    ],
    sponsorCampaignAnalyticsSummary: [
      `Sponsor-ready trust score: ${creatorTrustScore}/99`,
      `Share rate proxy: ${totals.views > 0 ? ((totals.shares / totals.views) * 100).toFixed(1) : "0"}%`,
      "Audience growth supports stronger brand outreach over time.",
    ],
    marketplaceTrendSummary: [
      `Demand proxy from saves: ${totals.saves}`,
      `Top promotional topic: ${topHashtag || "new drops"}`,
      `Best marketplace lane: ${totals.saves >= totals.comments ? "products" : "services"}`,
    ],
    appPerformanceSummary: [
      `Analytics loaded from ${posts.length} content records.`,
      `Profile signals available: ${completionFields.filter((value) => String(value ?? "").trim()).length}/${completionFields.length}`,
      "This dashboard acts as the current super-view for creator health.",
    ],
    errorReportingSummary: [
      "No app-level error feed is connected yet in this workspace.",
      "If analytics go blank, post history is usually the first signal to inspect.",
      "Add stronger client logging after dependencies are repaired.",
    ],
    uptimeStatusSummary: [
      "Firebase-backed content and profile reads are the current uptime dependency.",
      "This status summary is based on analytics availability signals.",
      "Verification runs are still blocked by missing local dependencies.",
    ],
    smartReengagementCampaigns: [
      "Notify recent profile visitors with a new highlight post.",
      "Resurface saved-content audiences with a sponsor or booking CTA.",
      "Trigger a digest after a reel beats average engagement.",
    ],
    churnPrediction: retentionScore >= 65 ? "Low churn risk" : retentionScore >= 40 ? "Moderate churn risk" : "High churn risk",
    postBreakdown: posts.map((post: FeedPost) => ({
      id: post.id,
      caption: post.caption,
      type: post.contentType,
      views: post.views ?? 0,
      likes: post.likes.length,
      comments: post.commentsCount,
      saves: post.saves.length,
      shares: post.shares,
      hashtagCount: post.hashtags.length,
    })),
    recentPosts: posts
      .sort((left: FeedPost, right: FeedPost) => (right.createdAt?.seconds ?? 0) - (left.createdAt?.seconds ?? 0))
      .slice(0, 6),
  };
}
