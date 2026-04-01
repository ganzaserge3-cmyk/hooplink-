import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getMarketplaceReviews } from "@/lib/commerce";

type FirestoreTimestamp = { seconds?: number; nanoseconds?: number } | null;

export interface MerchPreorderRecord {
  id: string;
  productName: string;
  priceLabel: string;
  quantity: number;
  buyerName: string;
  createdAt?: FirestoreTimestamp;
}

export interface AuctionEventRecord {
  id: string;
  title: string;
  itemName: string;
  currentBidLabel: string;
  endsAt: string;
  createdAt?: FirestoreTimestamp;
}

export interface FanClubMembershipRecord {
  id: string;
  tierName: string;
  memberName: string;
  perks: string[];
  createdAt?: FirestoreTimestamp;
}

export interface VipChatMessageRecord {
  id: string;
  channelName: string;
  authorName: string;
  message: string;
  createdAt?: FirestoreTimestamp;
}

export interface SeasonPassRecord {
  id: string;
  teamName: string;
  passType: string;
  ownerName: string;
  priceLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface SeatReservationRecord {
  id: string;
  eventName: string;
  section: string;
  seatLabel: string;
  holderName: string;
  createdAt?: FirestoreTimestamp;
}

export interface LoyaltyRewardRecord {
  id: string;
  title: string;
  pointsCost: number;
  redeemedByCount: number;
  createdAt?: FirestoreTimestamp;
}

export interface DropRaffleRecord {
  id: string;
  title: string;
  inventoryCount: number;
  entriesCount: number;
  closesAt: string;
  createdAt?: FirestoreTimestamp;
}

export interface FanWallPostRecord {
  id: string;
  authorName: string;
  message: string;
  teamName: string;
  createdAt?: FirestoreTimestamp;
}

export interface MeetAndGreetRecord {
  id: string;
  guestName: string;
  creatorName: string;
  eventDate: string;
  packageLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface BirthdayShoutoutRecord {
  id: string;
  recipientName: string;
  creatorName: string;
  message: string;
  priceLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface SignedMerchRequestRecord {
  id: string;
  itemName: string;
  requesterName: string;
  personalization: string;
  status: "pending" | "signed" | "shipped";
  createdAt?: FirestoreTimestamp;
}

export interface CollectibleRecord {
  id: string;
  title: string;
  rarity: string;
  ownerName: string;
  supply: number;
  createdAt?: FirestoreTimestamp;
}

export interface DonationReceiptRecord {
  id: string;
  donorName: string;
  amountLabel: string;
  email: string;
  campaignTitle: string;
  createdAt?: FirestoreTimestamp;
}

export interface FundraisingCampaignRecord {
  id: string;
  title: string;
  targetAmount: number;
  raisedAmount: number;
  supporterCount: number;
  createdAt?: FirestoreTimestamp;
}

export interface SponsorInvoiceReminderRecord {
  id: string;
  sponsorName: string;
  invoiceLabel: string;
  dueDate: string;
  ownerName: string;
  createdAt?: FirestoreTimestamp;
}

export interface TaxEstimateRecord {
  estimatedIncome: number;
  estimatedTax: number;
  suggestedSetAside: number;
}

export interface ContractRenewalReminderRecord {
  id: string;
  partnerName: string;
  contractTitle: string;
  renewalDate: string;
  createdAt?: FirestoreTimestamp;
}

export interface CreatorCollabRecord {
  id: string;
  creatorName: string;
  askTitle: string;
  audienceGoal: string;
  revenueSplitLabel: string;
  createdAt?: FirestoreTimestamp;
}

export interface FanHubSnapshot {
  merchPreorders: MerchPreorderRecord[];
  auctions: AuctionEventRecord[];
  memberships: FanClubMembershipRecord[];
  vipMessages: VipChatMessageRecord[];
  seasonPasses: SeasonPassRecord[];
  seatReservations: SeatReservationRecord[];
  loyaltyRewards: LoyaltyRewardRecord[];
  raffles: DropRaffleRecord[];
  fanWallPosts: FanWallPostRecord[];
  meetAndGreets: MeetAndGreetRecord[];
  shoutouts: BirthdayShoutoutRecord[];
  signedMerchRequests: SignedMerchRequestRecord[];
  collectibles: CollectibleRecord[];
  donationReceipts: DonationReceiptRecord[];
  fundraisingCampaigns: FundraisingCampaignRecord[];
  invoiceReminders: SponsorInvoiceReminderRecord[];
  contractRenewals: ContractRenewalReminderRecord[];
  creatorCollabs: CreatorCollabRecord[];
}

function requireUser() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
  return auth.currentUser;
}

function mapTimestamp(data: Record<string, unknown>, key: string) {
  return (data[key] as FirestoreTimestamp | undefined) ?? null;
}

async function getCollection<T>(name: string, mapper: (id: string, data: Record<string, unknown>) => T) {
  if (!db) return [] as T[];
  const snapshot = await getDocs(query(collection(db, name), orderBy("createdAt", "desc"), limit(40)));
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapper(docSnapshot.id, docSnapshot.data())
  );
}

export async function getFanHubSnapshot() {
  const [
    merchPreorders,
    auctions,
    memberships,
    vipMessages,
    seasonPasses,
    seatReservations,
    loyaltyRewards,
    raffles,
    fanWallPosts,
    meetAndGreets,
    shoutouts,
    signedMerchRequests,
    collectibles,
    donationReceipts,
    fundraisingCampaigns,
    invoiceReminders,
    contractRenewals,
    creatorCollabs,
  ] = await Promise.all([
    getCollection("phase5MerchPreorders", (id, data) => ({
      id,
      productName: String(data.productName ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      quantity: Number(data.quantity ?? 1),
      buyerName: String(data.buyerName ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5Auctions", (id, data) => ({
      id,
      title: String(data.title ?? ""),
      itemName: String(data.itemName ?? ""),
      currentBidLabel: String(data.currentBidLabel ?? ""),
      endsAt: String(data.endsAt ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5FanMemberships", (id, data) => ({
      id,
      tierName: String(data.tierName ?? ""),
      memberName: String(data.memberName ?? ""),
      perks: Array.isArray(data.perks) ? data.perks.map(String) : [],
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5VipMessages", (id, data) => ({
      id,
      channelName: String(data.channelName ?? ""),
      authorName: String(data.authorName ?? ""),
      message: String(data.message ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5SeasonPasses", (id, data) => ({
      id,
      teamName: String(data.teamName ?? ""),
      passType: String(data.passType ?? ""),
      ownerName: String(data.ownerName ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5SeatReservations", (id, data) => ({
      id,
      eventName: String(data.eventName ?? ""),
      section: String(data.section ?? ""),
      seatLabel: String(data.seatLabel ?? ""),
      holderName: String(data.holderName ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5LoyaltyRewards", (id, data) => ({
      id,
      title: String(data.title ?? ""),
      pointsCost: Number(data.pointsCost ?? 0),
      redeemedByCount: Number(data.redeemedByCount ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5Raffles", (id, data) => ({
      id,
      title: String(data.title ?? ""),
      inventoryCount: Number(data.inventoryCount ?? 0),
      entriesCount: Number(data.entriesCount ?? 0),
      closesAt: String(data.closesAt ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5FanWallPosts", (id, data) => ({
      id,
      authorName: String(data.authorName ?? ""),
      message: String(data.message ?? ""),
      teamName: String(data.teamName ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5MeetAndGreets", (id, data) => ({
      id,
      guestName: String(data.guestName ?? ""),
      creatorName: String(data.creatorName ?? ""),
      eventDate: String(data.eventDate ?? ""),
      packageLabel: String(data.packageLabel ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5Shoutouts", (id, data) => ({
      id,
      recipientName: String(data.recipientName ?? ""),
      creatorName: String(data.creatorName ?? ""),
      message: String(data.message ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5SignedMerchRequests", (id, data) => ({
      id,
      itemName: String(data.itemName ?? ""),
      requesterName: String(data.requesterName ?? ""),
      personalization: String(data.personalization ?? ""),
      status:
        data.status === "signed" || data.status === "shipped" ? data.status : "pending",
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5Collectibles", (id, data) => ({
      id,
      title: String(data.title ?? ""),
      rarity: String(data.rarity ?? ""),
      ownerName: String(data.ownerName ?? ""),
      supply: Number(data.supply ?? 1),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5DonationReceipts", (id, data) => ({
      id,
      donorName: String(data.donorName ?? ""),
      amountLabel: String(data.amountLabel ?? ""),
      email: String(data.email ?? ""),
      campaignTitle: String(data.campaignTitle ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5FundraisingCampaigns", (id, data) => ({
      id,
      title: String(data.title ?? ""),
      targetAmount: Number(data.targetAmount ?? 0),
      raisedAmount: Number(data.raisedAmount ?? 0),
      supporterCount: Number(data.supporterCount ?? 0),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5SponsorInvoiceReminders", (id, data) => ({
      id,
      sponsorName: String(data.sponsorName ?? ""),
      invoiceLabel: String(data.invoiceLabel ?? ""),
      dueDate: String(data.dueDate ?? ""),
      ownerName: String(data.ownerName ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5ContractRenewals", (id, data) => ({
      id,
      partnerName: String(data.partnerName ?? ""),
      contractTitle: String(data.contractTitle ?? ""),
      renewalDate: String(data.renewalDate ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
    getCollection("phase5CreatorCollabs", (id, data) => ({
      id,
      creatorName: String(data.creatorName ?? ""),
      askTitle: String(data.askTitle ?? ""),
      audienceGoal: String(data.audienceGoal ?? ""),
      revenueSplitLabel: String(data.revenueSplitLabel ?? ""),
      createdAt: mapTimestamp(data, "createdAt"),
    })),
  ]);

  return {
    merchPreorders,
    auctions,
    memberships,
    vipMessages,
    seasonPasses,
    seatReservations,
    loyaltyRewards,
    raffles,
    fanWallPosts,
    meetAndGreets,
    shoutouts,
    signedMerchRequests,
    collectibles,
    donationReceipts,
    fundraisingCampaigns,
    invoiceReminders,
    contractRenewals,
    creatorCollabs,
  } satisfies FanHubSnapshot;
}

async function createRecord(collectionName: string, data: Record<string, unknown>) {
  const user = requireUser();
  await addDoc(collection(db!, collectionName), {
    ownerId: user.uid,
    ownerName: user.displayName || user.email || "HoopLink User",
    ...data,
    createdAt: serverTimestamp(),
  });
}

export const createMerchPreorder = (input: { productName: string; priceLabel: string; quantity: number; buyerName: string }) =>
  createRecord("phase5MerchPreorders", input);
export const createAuctionEvent = (input: { title: string; itemName: string; currentBidLabel: string; endsAt: string }) =>
  createRecord("phase5Auctions", input);
export const createFanClubMembership = (input: { tierName: string; memberName: string; perks: string[] }) =>
  createRecord("phase5FanMemberships", input);
export const createVipChatMessage = (input: { channelName: string; authorName: string; message: string }) =>
  createRecord("phase5VipMessages", input);
export const createSeasonPass = (input: { teamName: string; passType: string; ownerName: string; priceLabel: string }) =>
  createRecord("phase5SeasonPasses", input);
export const createSeatReservation = (input: { eventName: string; section: string; seatLabel: string; holderName: string }) =>
  createRecord("phase5SeatReservations", input);
export const createLoyaltyReward = (input: { title: string; pointsCost: number; redeemedByCount: number }) =>
  createRecord("phase5LoyaltyRewards", input);
export const createDropRaffle = (input: { title: string; inventoryCount: number; entriesCount: number; closesAt: string }) =>
  createRecord("phase5Raffles", input);
export const createFanWallPost = (input: { authorName: string; message: string; teamName: string }) =>
  createRecord("phase5FanWallPosts", input);
export const createMeetAndGreet = (input: { guestName: string; creatorName: string; eventDate: string; packageLabel: string }) =>
  createRecord("phase5MeetAndGreets", input);
export const createBirthdayShoutout = (input: { recipientName: string; creatorName: string; message: string; priceLabel: string }) =>
  createRecord("phase5Shoutouts", input);
export const createSignedMerchRequest = (input: { itemName: string; requesterName: string; personalization: string; status: SignedMerchRequestRecord["status"] }) =>
  createRecord("phase5SignedMerchRequests", input);
export const createCollectible = (input: { title: string; rarity: string; ownerName: string; supply: number }) =>
  createRecord("phase5Collectibles", input);
export const createDonationReceipt = (input: { donorName: string; amountLabel: string; email: string; campaignTitle: string }) =>
  createRecord("phase5DonationReceipts", input);
export const createFundraisingCampaign = (input: { title: string; targetAmount: number; raisedAmount: number; supporterCount: number }) =>
  createRecord("phase5FundraisingCampaigns", input);
export const createSponsorInvoiceReminder = (input: { sponsorName: string; invoiceLabel: string; dueDate: string; ownerName: string }) =>
  createRecord("phase5SponsorInvoiceReminders", input);
export const createContractRenewalReminder = (input: { partnerName: string; contractTitle: string; renewalDate: string }) =>
  createRecord("phase5ContractRenewals", input);
export const createCreatorCollab = (input: { creatorName: string; askTitle: string; audienceGoal: string; revenueSplitLabel: string }) =>
  createRecord("phase5CreatorCollabs", input);

export function calculateTaxEstimate(estimatedIncome: number, taxRate = 0.28) {
  const income = Math.max(0, estimatedIncome);
  const estimatedTax = Math.round(income * taxRate);
  return {
    estimatedIncome: income,
    estimatedTax,
    suggestedSetAside: Math.round(estimatedTax * 1.1),
  } satisfies TaxEstimateRecord;
}

export async function getBrandSafeCreatorScore(targetUid?: string) {
  if (!targetUid) {
    return 78;
  }

  const reviews = await getMarketplaceReviews(targetUid).catch(() => []);
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / reviews.length
      : 4;
  const base = Math.round((averageRating / 5) * 85);
  return Math.min(99, base + Math.min(reviews.length, 10));
}
