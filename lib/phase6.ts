import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getOwnedPremiumGroups } from "@/lib/creator-hub";
import { getTeam } from "@/lib/teams";
import { getUserProfileById, searchProfiles, type SearchProfile } from "@/lib/user-profile";

function requireUser() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
  return auth.currentUser;
}

export interface GrowthProfile {
  customDomain: string;
  storefrontHeadline: string;
  subscriberLandingTitle: string;
}

export interface FundraiserRecord {
  id: string;
  ownerId: string;
  ownerType: "user" | "team";
  ownerRefId: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
}

export interface MerchProductRecord {
  id: string;
  ownerId: string;
  title: string;
  priceLabel: string;
  description: string;
  limitedDropEndsAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface CouponRecord {
  id: string;
  ownerId: string;
  code: string;
  description: string;
  reward: string;
  uses: number;
}

export interface QuestRecord {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  pointsReward: number;
  completedBy: string[];
}

export interface PriorityInboxRequest {
  id: string;
  creatorId: string;
  requesterId: string;
  requesterName: string;
  note: string;
  priceLabel: string;
  status: "pending" | "accepted" | "closed";
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface NewsletterIssue {
  id: string;
  creatorId: string;
  title: string;
  body: string;
  subscriberOnly: boolean;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface BlogPostRecord {
  id: string;
  creatorId: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

function mapTime(value: unknown) {
  return (value as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null;
}

export async function getCurrentGrowthProfile() {
  if (!auth?.currentUser || !db) {
    return {
      customDomain: "",
      storefrontHeadline: "",
      subscriberLandingTitle: "Join my HoopLink updates",
    } satisfies GrowthProfile;
  }

  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const growth = (data.growth as Record<string, unknown> | undefined) ?? {};
  return {
    customDomain: String(growth.customDomain ?? ""),
    storefrontHeadline: String(growth.storefrontHeadline ?? ""),
    subscriberLandingTitle: String(growth.subscriberLandingTitle ?? "Join my HoopLink updates"),
  } satisfies GrowthProfile;
}

export async function updateCurrentGrowthProfile(input: GrowthProfile) {
  const user = requireUser();
  await setDoc(
    doc(db!, "users", user.uid),
    {
      growth: {
        customDomain: input.customDomain.trim(),
        storefrontHeadline: input.storefrontHeadline.trim(),
        subscriberLandingTitle: input.subscriberLandingTitle.trim(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function createFundraiser(input: {
  ownerType: "user" | "team";
  ownerRefId: string;
  title: string;
  description: string;
  goalAmount: number;
}) {
  const user = requireUser();
  await addDoc(collection(db!, "fundraisers"), {
    ownerId: user.uid,
    ownerType: input.ownerType,
    ownerRefId: input.ownerRefId,
    title: input.title.trim(),
    description: input.description.trim(),
    goalAmount: Math.max(1, Number(input.goalAmount || 0)),
    raisedAmount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function donateToFundraiser(fundraiserId: string, amount: number) {
  requireUser();
  await updateDoc(doc(db!, "fundraisers", fundraiserId), {
    raisedAmount: increment(Math.max(1, Number(amount || 0))),
    updatedAt: serverTimestamp(),
  });
}

export async function getOwnedFundraisers() {
  if (!auth?.currentUser || !db) return [];
  const snapshot = await getDocs(query(collection(db, "fundraisers"), where("ownerId", "==", auth.currentUser.uid), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      ownerType: data.ownerType === "team" ? "team" : "user",
      ownerRefId: String(data.ownerRefId ?? ""),
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      goalAmount: Number(data.goalAmount ?? 0),
      raisedAmount: Number(data.raisedAmount ?? 0),
    } satisfies FundraiserRecord;
  });
}

export async function createMerchProduct(input: {
  title: string;
  description: string;
  priceLabel: string;
  limitedDropEndsAt?: string;
}) {
  const user = requireUser();
  await addDoc(collection(db!, "merchProducts"), {
    ownerId: user.uid,
    title: input.title.trim(),
    description: input.description.trim(),
    priceLabel: input.priceLabel.trim(),
    limitedDropEndsAt: input.limitedDropEndsAt ? new Date(input.limitedDropEndsAt) : null,
    createdAt: serverTimestamp(),
  });
}

export async function getOwnedMerchProducts() {
  if (!auth?.currentUser || !db) return [];
  const snapshot = await getDocs(query(collection(db, "merchProducts"), where("ownerId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      limitedDropEndsAt: mapTime(data.limitedDropEndsAt),
    } satisfies MerchProductRecord;
  });
}

export async function getCreatorMerchProducts(uid: string) {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "merchProducts"), where("ownerId", "==", uid), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      limitedDropEndsAt: mapTime(data.limitedDropEndsAt),
    } satisfies MerchProductRecord;
  });
}

export async function createCoupon(input: { code: string; description: string; reward: string }) {
  const user = requireUser();
  await addDoc(collection(db!, "coupons"), {
    ownerId: user.uid,
    code: input.code.trim().toUpperCase(),
    description: input.description.trim(),
    reward: input.reward.trim(),
    uses: 0,
    createdAt: serverTimestamp(),
  });
}

export async function redeemCoupon(code: string) {
  const user = requireUser();
  const normalized = code.trim().toUpperCase();
  const snapshot = await getDocs(query(collection(db!, "coupons"), where("code", "==", normalized), limit(1)));
  if (!snapshot.docs[0]) throw new Error("Coupon not found.");
  await updateDoc(doc(db!, "coupons", snapshot.docs[0].id), {
    uses: increment(1),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db!, "users", user.uid), { couponsRedeemed: increment(1) }, { merge: true });
}

export async function getOwnedCoupons() {
  if (!auth?.currentUser || !db) return [];
  const snapshot = await getDocs(query(collection(db, "coupons"), where("ownerId", "==", auth.currentUser.uid), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      code: String(data.code ?? ""),
      description: String(data.description ?? ""),
      reward: String(data.reward ?? ""),
      uses: Number(data.uses ?? 0),
    } satisfies CouponRecord;
  });
}

export async function getInviteLeaderboard() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "inviteCodes"), orderBy("referralCount", "desc"), limit(20)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      code: String(data.code ?? docSnapshot.id),
      referralCount: Number(data.referralCount ?? data.uses ?? 0),
      note: String(data.note ?? ""),
    };
  });
}

export async function createQuest(input: { title: string; description: string; pointsReward: number }) {
  const user = requireUser();
  await addDoc(collection(db!, "quests"), {
    ownerId: user.uid,
    title: input.title.trim(),
    description: input.description.trim(),
    pointsReward: Math.max(1, Number(input.pointsReward || 0)),
    completedBy: [],
    createdAt: serverTimestamp(),
  });
}

export async function getOwnedQuests() {
  if (!auth?.currentUser || !db) return [];
  const snapshot = await getDocs(query(collection(db, "quests"), where("ownerId", "==", auth.currentUser.uid), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      pointsReward: Number(data.pointsReward ?? 0),
      completedBy: Array.isArray(data.completedBy) ? (data.completedBy as string[]) : [],
    } satisfies QuestRecord;
  });
}

export async function completeQuest(questId: string, pointsReward: number) {
  const user = requireUser();
  const questRef = doc(db!, "quests", questId);
  const questSnapshot = await getDoc(questRef);
  const data = questSnapshot.exists() ? (questSnapshot.data() as Record<string, unknown>) : {};
  const completedBy = Array.isArray(data.completedBy) ? (data.completedBy as string[]) : [];
  if (completedBy.includes(user.uid)) return;
  await updateDoc(questRef, { completedBy: [...completedBy, user.uid], updatedAt: serverTimestamp() });
  await setDoc(doc(db!, "users", user.uid), { rewards: { loyaltyPoints: increment(pointsReward), achievements: increment(1) } }, { merge: true });
}

export async function claimDailyCheckIn(teamId?: string) {
  const user = requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const rewardRef = doc(db!, "users", user.uid);
  const snapshot = await getDoc(rewardRef);
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const rewards = (data.rewards as Record<string, unknown> | undefined) ?? {};
  if (String(rewards.lastCheckInDate ?? "") === today) {
    return false;
  }
  await setDoc(
    rewardRef,
    {
      rewards: {
        lastCheckInDate: today,
        loyaltyPoints: increment(10),
        checkInStreak: increment(1),
      },
      ...(teamId ? { teamLoyaltyPoints: { [teamId]: increment(5) } } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return true;
}

export async function getRewardsSnapshot() {
  if (!auth?.currentUser || !db) return { loyaltyPoints: 0, checkInStreak: 0, familyPlan: false };
  const snapshot = await getDoc(doc(db, "users", auth.currentUser.uid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const rewards = (data.rewards as Record<string, unknown> | undefined) ?? {};
  const subscriptions = (data.subscriptions as Record<string, unknown> | undefined) ?? {};
  return {
    loyaltyPoints: Number(rewards.loyaltyPoints ?? 0),
    checkInStreak: Number(rewards.checkInStreak ?? 0),
    familyPlan: subscriptions.familyPlan === true,
  };
}

export async function enableFamilyPlan(memberEmails: string[]) {
  const user = requireUser();
  await setDoc(doc(db!, "users", user.uid), {
    subscriptions: {
      familyPlan: true,
      familyMembers: memberEmails.map((value) => value.trim()).filter(Boolean),
    },
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function createPriorityInboxRequest(input: { creatorId: string; note: string; priceLabel: string }) {
  const user = requireUser();
  await addDoc(collection(db!, "priorityInbox"), {
    creatorId: input.creatorId,
    requesterId: user.uid,
    requesterName: user.displayName || "HoopLink User",
    note: input.note.trim(),
    priceLabel: input.priceLabel.trim() || "$25",
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getIncomingPriorityInbox() {
  if (!auth?.currentUser || !db) return [];
  const snapshot = await getDocs(query(collection(db, "priorityInbox"), where("creatorId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      creatorId: String(data.creatorId ?? ""),
      requesterId: String(data.requesterId ?? ""),
      requesterName: String(data.requesterName ?? ""),
      note: String(data.note ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      status: data.status === "accepted" || data.status === "closed" ? data.status : "pending",
      createdAt: mapTime(data.createdAt),
    } satisfies PriorityInboxRequest;
  });
}

export async function updatePriorityInboxStatus(requestId: string, status: PriorityInboxRequest["status"]) {
  requireUser();
  await updateDoc(doc(db!, "priorityInbox", requestId), { status, updatedAt: serverTimestamp() });
}

export async function subscribeToCreatorNewsletter(creatorId: string, email: string) {
  await addDoc(collection(db!, "newsletterSubscribers"), {
    creatorId,
    email: email.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getCreatorSubscribersCount(creatorId: string) {
  if (!db) return 0;
  const snapshot = await getDocs(query(collection(db, "newsletterSubscribers"), where("creatorId", "==", creatorId), limit(200)));
  return snapshot.size;
}

export async function createNewsletterIssue(input: { title: string; body: string; subscriberOnly: boolean }) {
  const user = requireUser();
  await addDoc(collection(db!, "newsletterIssues"), {
    creatorId: user.uid,
    title: input.title.trim(),
    body: input.body.trim(),
    subscriberOnly: input.subscriberOnly,
    createdAt: serverTimestamp(),
  });
}

export async function getCreatorNewsletterIssues(creatorId: string) {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "newsletterIssues"), where("creatorId", "==", creatorId), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      creatorId: String(data.creatorId ?? ""),
      title: String(data.title ?? ""),
      body: String(data.body ?? ""),
      subscriberOnly: data.subscriberOnly === true,
      createdAt: mapTime(data.createdAt),
    } satisfies NewsletterIssue;
  });
}

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createBlogPost(input: { title: string; summary: string; body: string }) {
  const user = requireUser();
  await addDoc(collection(db!, "blogPosts"), {
    creatorId: user.uid,
    slug: slugify(input.title),
    title: input.title.trim(),
    summary: input.summary.trim(),
    body: input.body.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getCreatorBlogPosts(creatorId: string) {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, "blogPosts"), where("creatorId", "==", creatorId), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      creatorId: String(data.creatorId ?? ""),
      slug: String(data.slug ?? ""),
      title: String(data.title ?? ""),
      summary: String(data.summary ?? ""),
      body: String(data.body ?? ""),
      createdAt: mapTime(data.createdAt),
    } satisfies BlogPostRecord;
  });
}

export async function getBlogPostBySlug(creatorId: string, slug: string) {
  if (!db) return null;
  const snapshot = await getDocs(query(collection(db, "blogPosts"), where("creatorId", "==", creatorId), where("slug", "==", slugify(slug)), limit(1)));
  const docSnapshot = snapshot.docs[0];
  if (!docSnapshot) return null;
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    creatorId: String(data.creatorId ?? ""),
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    summary: String(data.summary ?? ""),
    body: String(data.body ?? ""),
    createdAt: mapTime(data.createdAt),
  } satisfies BlogPostRecord;
}

export function getProfileEmbedCode(uid: string) {
  return `<iframe src="${typeof window === "undefined" ? "" : window.location.origin}/embed/profile/${uid}" width="420" height="240" style="border:0;border-radius:16px;" loading="lazy"></iframe>`;
}

export function getHighlightCarouselEmbedCode(uid: string) {
  return `<iframe src="${typeof window === "undefined" ? "" : window.location.origin}/embed/highlights/${uid}" width="720" height="420" style="border:0;border-radius:16px;" loading="lazy"></iframe>`;
}

export async function getSeoProfilePageData(uid: string) {
  const [profile, merch, newsletters, blogs] = await Promise.all([
    getUserProfileById(uid),
    getCreatorMerchProducts(uid),
    getCreatorNewsletterIssues(uid),
    getCreatorBlogPosts(uid),
  ]);
  return { profile, merch, newsletters, blogs };
}

export async function getBrandedTeamPageData(teamId: string) {
  const [team, fundraisers] = await Promise.all([
    getTeam(teamId),
    db
      ? getDocs(query(collection(db, "fundraisers"), where("ownerType", "==", "team"), where("ownerRefId", "==", teamId), limit(20)))
      : Promise.resolve(null),
  ]);
  const fundraiserRecords =
    fundraisers?.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ownerId: String(data.ownerId ?? ""),
        ownerType: data.ownerType === "team" ? "team" : "user",
        ownerRefId: String(data.ownerRefId ?? ""),
        title: String(data.title ?? ""),
        description: String(data.description ?? ""),
        goalAmount: Number(data.goalAmount ?? 0),
        raisedAmount: Number(data.raisedAmount ?? 0),
      } satisfies FundraiserRecord;
    }) ?? [];
  return { team, fundraisers: fundraiserRecords };
}

export async function getGrowthHubSnapshot() {
  const [growth, fundraisers, merch, coupons, inviteLeaderboard, quests, rewards, priorityInbox, ownedGroups] =
    await Promise.all([
      getCurrentGrowthProfile(),
      getOwnedFundraisers(),
      getOwnedMerchProducts(),
      getOwnedCoupons(),
      getInviteLeaderboard(),
      getOwnedQuests(),
      getRewardsSnapshot(),
      getIncomingPriorityInbox(),
      getOwnedPremiumGroups().catch(() => []),
    ]);
  return { growth, fundraisers, merch, coupons, inviteLeaderboard, quests, rewards, priorityInbox, ownedGroups };
}
