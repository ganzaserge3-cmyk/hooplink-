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
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";

type FirestoreDocSnapshot = {
  id: string;
  data: () => Record<string, unknown>;
};

export interface BrandCampaignRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  brandName: string;
  title: string;
  budgetLabel: string;
  summary: string;
  requirements: string;
  active: boolean;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface CampaignApplicationRecord {
  id: string;
  campaignId: string;
  campaignTitle: string;
  ownerId: string;
  applicantId: string;
  applicantName: string;
  note: string;
  status: "pending" | "approved" | "declined";
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface ContractRecord {
  id: string;
  ownerId: string;
  title: string;
  counterpartyName: string;
  status: "draft" | "sent" | "signed";
  summary: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface InvoiceRecord {
  id: string;
  ownerId: string;
  customerName: string;
  amountLabel: string;
  description: string;
  dueDate: string;
  status: "draft" | "sent" | "paid";
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface DiscountCodeRecord {
  id: string;
  ownerId: string;
  code: string;
  percentOff: number;
  maxUses: number;
  uses: number;
  active: boolean;
}

export interface MembershipTierRecord {
  id: string;
  ownerId: string;
  name: string;
  priceLabel: string;
  benefits: string[];
  checkoutProvider: "stripe" | "apple_pay" | "google_pay" | "manual";
}

export interface TeamBundleRecord {
  id: string;
  ownerId: string;
  teamName: string;
  priceLabel: string;
  seats: number;
  included: string[];
}

export interface SponsorBadgeRequestRecord {
  id: string;
  ownerId: string;
  brandName: string;
  website: string;
  status: "pending" | "verified";
}

export interface DeliverableRecord {
  id: string;
  ownerId: string;
  campaignId: string;
  title: string;
  status: "todo" | "submitted" | "approved";
}

export interface MarketplaceReviewRecord {
  id: string;
  targetUid: string;
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
}

export type MarketplaceListingType =
  | "gear"
  | "digital_product"
  | "training_plan"
  | "private_group"
  | "fan_subscription"
  | "sponsorship"
  | "fundraising"
  | "affiliate";

export interface MarketplaceListingRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  type: MarketplaceListingType;
  title: string;
  summary: string;
  priceLabel: string;
  location: string;
  checkoutUrl: string;
  tags: string[];
  active: boolean;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface CommissionRecord {
  id: string;
  ownerId: string;
  partnerName: string;
  source: string;
  amountLabel: string;
  status: "tracked" | "paid";
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface PartnerReferralRecord {
  id: string;
  ownerId: string;
  partnerName: string;
  referralCode: string;
  rewardLabel: string;
  active: boolean;
}

export interface TaxExportReport {
  estimatedTaxableRevenue: number;
  bookingRevenue: number;
  invoiceRevenue: number;
  tipRevenue: number;
  listingRevenue: number;
  suggestedSetAside: number;
  exportLabel: string;
}

export interface PayoutSnapshot {
  estimatedPayout: number;
  paidInvoices: number;
  bookingRevenue: number;
  tipRevenue: number;
  referralCount: number;
}

export interface AmbassadorStats {
  invitesCreated: number;
  referralCount: number;
  topInviteCode: string;
}

export interface OrgBillingSettings {
  billingContact: string;
  checkoutProvider: "stripe" | "apple_pay" | "google_pay" | "manual";
  payoutsEnabled: boolean;
  giftSubscriptionsEnabled: boolean;
  teamBundlesEnabled: boolean;
}

const defaultOrgBillingSettings: OrgBillingSettings = {
  billingContact: "",
  checkoutProvider: "stripe",
  payoutsEnabled: true,
  giftSubscriptionsEnabled: true,
  teamBundlesEnabled: true,
};

function assertAuth() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
}

function mapTimestamp(data: Record<string, unknown>, key: string) {
  return (data[key] as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null;
}

function parseAmount(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function isMissingIndexError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  const message = "message" in error ? String(error.message ?? "") : "";
  return code === "failed-precondition" && message.toLowerCase().includes("requires an index");
}

function compareCreatedAtDescending<
  T extends {
    createdAt?: { seconds?: number; nanoseconds?: number } | null;
  },
>(left: T, right: T) {
  const leftSeconds = left.createdAt?.seconds ?? 0;
  const rightSeconds = right.createdAt?.seconds ?? 0;
  if (leftSeconds !== rightSeconds) {
    return rightSeconds - leftSeconds;
  }

  const leftNanos = left.createdAt?.nanoseconds ?? 0;
  const rightNanos = right.createdAt?.nanoseconds ?? 0;
  return rightNanos - leftNanos;
}

export async function createBrandCampaign(input: {
  brandName: string;
  title: string;
  budgetLabel: string;
  summary: string;
  requirements: string;
}) {
  assertAuth();

  await addDoc(collection(db!, "brandCampaigns"), {
    ownerId: auth!.currentUser!.uid,
    ownerName: auth!.currentUser!.displayName || "HoopLink Creator",
    brandName: input.brandName.trim(),
    title: input.title.trim(),
    budgetLabel: input.budgetLabel.trim(),
    summary: input.summary.trim(),
    requirements: input.requirements.trim(),
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function getOpenBrandCampaigns() {
  if (!db) {
    return [];
  }

  let snapshot;

  try {
    snapshot = await getDocs(
      query(collection(db, "brandCampaigns"), where("active", "==", true), limit(30))
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db, "brandCampaigns"), limit(50)));
  }

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        ownerId: String(data.ownerId ?? ""),
        ownerName: String(data.ownerName ?? "HoopLink Creator"),
        brandName: String(data.brandName ?? ""),
        title: String(data.title ?? ""),
        budgetLabel: String(data.budgetLabel ?? ""),
        summary: String(data.summary ?? ""),
        requirements: String(data.requirements ?? ""),
        active: data.active !== false,
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies BrandCampaignRecord;
    })
    .filter((campaign: BrandCampaignRecord) => campaign.active)
    .sort(compareCreatedAtDescending);
}

export async function getOwnedBrandCampaigns() {
  assertAuth();

  const snapshot = await getDocs(
    query(collection(db!, "brandCampaigns"), where("ownerId", "==", auth!.currentUser!.uid), limit(30))
  );

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        ownerId: String(data.ownerId ?? ""),
        ownerName: String(data.ownerName ?? "HoopLink Creator"),
        brandName: String(data.brandName ?? ""),
        title: String(data.title ?? ""),
        budgetLabel: String(data.budgetLabel ?? ""),
        summary: String(data.summary ?? ""),
        requirements: String(data.requirements ?? ""),
        active: data.active !== false,
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies BrandCampaignRecord;
    })
    .sort(compareCreatedAtDescending);
}

export async function applyToBrandCampaign(campaign: BrandCampaignRecord, note: string) {
  assertAuth();

  await addDoc(collection(db!, "campaignApplications"), {
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    ownerId: campaign.ownerId,
    applicantId: auth!.currentUser!.uid,
    applicantName: auth!.currentUser!.displayName || "HoopLink User",
    note: note.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });

  await createNotification({
    type: "campaign_application",
    recipientId: campaign.ownerId,
    actorId: auth!.currentUser!.uid,
    actorName: auth!.currentUser!.displayName || "HoopLink User",
    actorAvatar: auth!.currentUser!.photoURL || "",
    message: `${auth!.currentUser!.displayName || "Someone"} applied to ${campaign.title}.`,
  });
}

export async function getOwnedCampaignApplications() {
  assertAuth();

  let snapshot;

  try {
    snapshot = await getDocs(
      query(
        collection(db!, "campaignApplications"),
        where("ownerId", "==", auth!.currentUser!.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      )
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db!, "campaignApplications"), limit(100)));
  }

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        campaignId: String(data.campaignId ?? ""),
        campaignTitle: String(data.campaignTitle ?? ""),
        ownerId: String(data.ownerId ?? ""),
        applicantId: String(data.applicantId ?? ""),
        applicantName: String(data.applicantName ?? "HoopLink User"),
        note: String(data.note ?? ""),
        status: data.status === "approved" || data.status === "declined" ? data.status : "pending",
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies CampaignApplicationRecord;
    })
    .filter(
      (application: CampaignApplicationRecord) => application.ownerId === auth!.currentUser!.uid
    )
    .sort(compareCreatedAtDescending)
    .slice(0, 50);
}

export async function reviewCampaignApplication(applicationId: string, status: "approved" | "declined") {
  assertAuth();

  const snapshot = await getDoc(doc(db!, "campaignApplications", applicationId));
  if (!snapshot.exists()) {
    throw new Error("Application not found.");
  }

  const data = snapshot.data() as Record<string, unknown>;
  await updateDoc(doc(db!, "campaignApplications", applicationId), { status });

  await createNotification({
    type: "campaign_review",
    recipientId: String(data.applicantId ?? ""),
    actorId: auth!.currentUser!.uid,
    actorName: auth!.currentUser!.displayName || "Brand",
    actorAvatar: auth!.currentUser!.photoURL || "",
    message: `${String(data.campaignTitle ?? "Campaign")} application ${status}.`,
  });
}

export async function createContractRecord(input: {
  title: string;
  counterpartyName: string;
  summary: string;
}) {
  assertAuth();

  await addDoc(collection(db!, "contracts"), {
    ownerId: auth!.currentUser!.uid,
    title: input.title.trim(),
    counterpartyName: input.counterpartyName.trim(),
    summary: input.summary.trim(),
    status: "draft",
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserContracts() {
  assertAuth();

  let snapshot;

  try {
    snapshot = await getDocs(
      query(collection(db!, "contracts"), where("ownerId", "==", auth!.currentUser!.uid), orderBy("createdAt", "desc"), limit(30))
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db!, "contracts"), limit(100)));
  }

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        ownerId: String(data.ownerId ?? ""),
        title: String(data.title ?? ""),
        counterpartyName: String(data.counterpartyName ?? ""),
        summary: String(data.summary ?? ""),
        status: data.status === "sent" || data.status === "signed" ? data.status : "draft",
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies ContractRecord;
    })
    .filter((contract: ContractRecord) => contract.ownerId === auth!.currentUser!.uid)
    .sort(compareCreatedAtDescending)
    .slice(0, 30);
}

export async function createInvoiceRecord(input: {
  customerName: string;
  amountLabel: string;
  description: string;
  dueDate: string;
}) {
  assertAuth();

  await addDoc(collection(db!, "invoices"), {
    ownerId: auth!.currentUser!.uid,
    customerName: input.customerName.trim(),
    amountLabel: input.amountLabel.trim(),
    description: input.description.trim(),
    dueDate: input.dueDate.trim(),
    status: "draft",
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserInvoices() {
  assertAuth();

  let snapshot;

  try {
    snapshot = await getDocs(
      query(collection(db!, "invoices"), where("ownerId", "==", auth!.currentUser!.uid), orderBy("createdAt", "desc"), limit(50))
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db!, "invoices"), limit(100)));
  }

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        ownerId: String(data.ownerId ?? ""),
        customerName: String(data.customerName ?? ""),
        amountLabel: String(data.amountLabel ?? ""),
        description: String(data.description ?? ""),
        dueDate: String(data.dueDate ?? ""),
        status: data.status === "sent" || data.status === "paid" ? data.status : "draft",
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies InvoiceRecord;
    })
    .filter((invoice: InvoiceRecord) => invoice.ownerId === auth!.currentUser!.uid)
    .sort(compareCreatedAtDescending)
    .slice(0, 50);
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceRecord["status"]) {
  assertAuth();
  await updateDoc(doc(db!, "invoices", invoiceId), { status });
}

export async function createDiscountCodeRecord(input: {
  code: string;
  percentOff: number;
  maxUses: number;
}) {
  assertAuth();

  await setDoc(
    doc(db!, "discountCodes", `${auth!.currentUser!.uid}__${input.code.trim().toUpperCase()}`),
    {
      ownerId: auth!.currentUser!.uid,
      code: input.code.trim().toUpperCase(),
      percentOff: Math.max(1, Math.min(100, Number(input.percentOff))),
      maxUses: Math.max(1, Number(input.maxUses)),
      uses: 0,
      active: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getCurrentUserDiscountCodes() {
  assertAuth();

  const snapshot = await getDocs(
    query(collection(db!, "discountCodes"), where("ownerId", "==", auth!.currentUser!.uid), limit(50))
  );

  return snapshot.docs.map((docSnapshot: FirestoreDocSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      code: String(data.code ?? ""),
      percentOff: Number(data.percentOff ?? 0),
      maxUses: Number(data.maxUses ?? 1),
      uses: Number(data.uses ?? 0),
      active: data.active !== false,
    } satisfies DiscountCodeRecord;
  });
}

export async function createMembershipTierRecord(input: {
  name: string;
  priceLabel: string;
  benefits: string[];
  checkoutProvider: MembershipTierRecord["checkoutProvider"];
}) {
  assertAuth();

  await addDoc(collection(db!, "membershipTiers"), {
    ownerId: auth!.currentUser!.uid,
    name: input.name.trim(),
    priceLabel: input.priceLabel.trim(),
    benefits: input.benefits,
    checkoutProvider: input.checkoutProvider,
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserMembershipTiers() {
  assertAuth();
  const snapshot = await getDocs(
    query(collection(db!, "membershipTiers"), where("ownerId", "==", auth!.currentUser!.uid), limit(20))
  );
  return snapshot.docs.map((docSnapshot: FirestoreDocSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      name: String(data.name ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      benefits: Array.isArray(data.benefits) ? (data.benefits as string[]) : [],
      checkoutProvider:
        data.checkoutProvider === "apple_pay" ||
        data.checkoutProvider === "google_pay" ||
        data.checkoutProvider === "manual"
          ? data.checkoutProvider
          : "stripe",
    } satisfies MembershipTierRecord;
  });
}

export async function createTeamBundleRecord(input: {
  teamName: string;
  priceLabel: string;
  seats: number;
  included: string[];
}) {
  assertAuth();

  await addDoc(collection(db!, "teamBundles"), {
    ownerId: auth!.currentUser!.uid,
    teamName: input.teamName.trim(),
    priceLabel: input.priceLabel.trim(),
    seats: Math.max(1, Number(input.seats)),
    included: input.included,
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserTeamBundles() {
  assertAuth();
  const snapshot = await getDocs(
    query(collection(db!, "teamBundles"), where("ownerId", "==", auth!.currentUser!.uid), limit(20))
  );
  return snapshot.docs.map((docSnapshot: FirestoreDocSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      teamName: String(data.teamName ?? ""),
      priceLabel: String(data.priceLabel ?? ""),
      seats: Number(data.seats ?? 1),
      included: Array.isArray(data.included) ? (data.included as string[]) : [],
    } satisfies TeamBundleRecord;
  });
}

export async function createSponsorBadgeRequest(input: { brandName: string; website: string }) {
  assertAuth();

  await addDoc(collection(db!, "sponsorBadgeRequests"), {
    ownerId: auth!.currentUser!.uid,
    brandName: input.brandName.trim(),
    website: input.website.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserSponsorBadgeRequests() {
  assertAuth();
  const snapshot = await getDocs(
    query(collection(db!, "sponsorBadgeRequests"), where("ownerId", "==", auth!.currentUser!.uid), limit(20))
  );
  return snapshot.docs.map((docSnapshot: FirestoreDocSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      brandName: String(data.brandName ?? ""),
      website: String(data.website ?? ""),
      status: data.status === "verified" ? "verified" : "pending",
    } satisfies SponsorBadgeRequestRecord;
  });
}

export async function createDeliverableRecord(input: { campaignId: string; title: string }) {
  assertAuth();
  await addDoc(collection(db!, "campaignDeliverables"), {
    ownerId: auth!.currentUser!.uid,
    campaignId: input.campaignId,
    title: input.title.trim(),
    status: "todo",
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserDeliverables() {
  assertAuth();
  const snapshot = await getDocs(
    query(collection(db!, "campaignDeliverables"), where("ownerId", "==", auth!.currentUser!.uid), limit(50))
  );
  return snapshot.docs.map((docSnapshot: FirestoreDocSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      ownerId: String(data.ownerId ?? ""),
      campaignId: String(data.campaignId ?? ""),
      title: String(data.title ?? ""),
      status: data.status === "submitted" || data.status === "approved" ? data.status : "todo",
    } satisfies DeliverableRecord;
  });
}

export async function updateDeliverableStatus(deliverableId: string, status: DeliverableRecord["status"]) {
  assertAuth();
  await updateDoc(doc(db!, "campaignDeliverables", deliverableId), { status });
}

export async function recordCreatorTip(input: { targetUid: string; amountLabel: string; note: string }) {
  assertAuth();
  if (input.targetUid === auth!.currentUser!.uid) {
    return;
  }

  await addDoc(collection(db!, "tips"), {
    targetUid: input.targetUid,
    senderId: auth!.currentUser!.uid,
    senderName: auth!.currentUser!.displayName || "HoopLink Supporter",
    amountLabel: input.amountLabel.trim(),
    note: input.note.trim(),
    createdAt: serverTimestamp(),
  });

  await createNotification({
    type: "tip",
    recipientId: input.targetUid,
    actorId: auth!.currentUser!.uid,
    actorName: auth!.currentUser!.displayName || "HoopLink Supporter",
    actorAvatar: auth!.currentUser!.photoURL || "",
    message: `${auth!.currentUser!.displayName || "Someone"} sent you a tip ${input.amountLabel.trim()}.`,
  });
}

export async function createMarketplaceReview(input: { targetUid: string; rating: number; comment: string }) {
  assertAuth();
  await addDoc(collection(db!, "marketplaceReviews"), {
    targetUid: input.targetUid,
    authorId: auth!.currentUser!.uid,
    authorName: auth!.currentUser!.displayName || "HoopLink User",
    rating: Math.max(1, Math.min(5, Number(input.rating))),
    comment: input.comment.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getMarketplaceReviews(targetUid: string) {
  if (!db) {
    return [];
  }
  const snapshot = await getDocs(
    query(collection(db, "marketplaceReviews"), where("targetUid", "==", targetUid), limit(30))
  );
  return snapshot.docs.map((docSnapshot: FirestoreDocSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      targetUid: String(data.targetUid ?? ""),
      authorId: String(data.authorId ?? ""),
      authorName: String(data.authorName ?? "HoopLink User"),
      rating: Number(data.rating ?? 0),
      comment: String(data.comment ?? ""),
    } satisfies MarketplaceReviewRecord;
  });
}

export async function createMarketplaceListing(input: {
  type: MarketplaceListingType;
  title: string;
  summary: string;
  priceLabel: string;
  location?: string;
  checkoutUrl?: string;
  tags?: string[];
}) {
  assertAuth();

  await addDoc(collection(db!, "marketplaceListings"), {
    ownerId: auth!.currentUser!.uid,
    ownerName: auth!.currentUser!.displayName || "HoopLink Seller",
    type: input.type,
    title: input.title.trim(),
    summary: input.summary.trim(),
    priceLabel: input.priceLabel.trim(),
    location: String(input.location ?? "").trim(),
    checkoutUrl: String(input.checkoutUrl ?? "").trim(),
    tags: (input.tags ?? []).map((tag: string) => tag.trim()).filter(Boolean),
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function getMarketplaceListings(type?: MarketplaceListingType | "all") {
  if (!db) {
    return [];
  }

  let snapshot;

  try {
    snapshot = await getDocs(
      query(collection(db, "marketplaceListings"), where("active", "==", true), limit(50))
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db, "marketplaceListings"), limit(75)));
  }

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        ownerId: String(data.ownerId ?? ""),
        ownerName: String(data.ownerName ?? "HoopLink Seller"),
        type:
          data.type === "digital_product" ||
          data.type === "training_plan" ||
          data.type === "private_group" ||
          data.type === "fan_subscription" ||
          data.type === "sponsorship" ||
          data.type === "fundraising" ||
          data.type === "affiliate"
            ? data.type
            : "gear",
        title: String(data.title ?? ""),
        summary: String(data.summary ?? ""),
        priceLabel: String(data.priceLabel ?? ""),
        location: String(data.location ?? ""),
        checkoutUrl: String(data.checkoutUrl ?? ""),
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        active: data.active !== false,
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies MarketplaceListingRecord;
    })
    .filter((listing: MarketplaceListingRecord) => listing.active)
    .filter(
      (listing: MarketplaceListingRecord) => !type || type === "all" || listing.type === type
    )
    .sort(compareCreatedAtDescending);
}

export async function getCurrentUserMarketplaceListings() {
  assertAuth();
  let snapshot;

  try {
    snapshot = await getDocs(
      query(collection(db!, "marketplaceListings"), where("ownerId", "==", auth!.currentUser!.uid), limit(50))
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db!, "marketplaceListings"), limit(100)));
  }

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        ownerId: String(data.ownerId ?? ""),
        ownerName: String(data.ownerName ?? "HoopLink Seller"),
        type:
          data.type === "digital_product" ||
          data.type === "training_plan" ||
          data.type === "private_group" ||
          data.type === "fan_subscription" ||
          data.type === "sponsorship" ||
          data.type === "fundraising" ||
          data.type === "affiliate"
            ? data.type
            : "gear",
        title: String(data.title ?? ""),
        summary: String(data.summary ?? ""),
        priceLabel: String(data.priceLabel ?? ""),
        location: String(data.location ?? ""),
        checkoutUrl: String(data.checkoutUrl ?? ""),
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        active: data.active !== false,
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies MarketplaceListingRecord;
    })
    .filter((listing: MarketplaceListingRecord) => listing.ownerId === auth!.currentUser!.uid)
    .sort(compareCreatedAtDescending)
    .slice(0, 50);
}

export async function createCommissionRecord(input: {
  partnerName: string;
  source: string;
  amountLabel: string;
}) {
  assertAuth();

  await addDoc(collection(db!, "commissionRecords"), {
    ownerId: auth!.currentUser!.uid,
    partnerName: input.partnerName.trim(),
    source: input.source.trim(),
    amountLabel: input.amountLabel.trim(),
    status: "tracked",
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserCommissionRecords() {
  assertAuth();
  let snapshot;

  try {
    snapshot = await getDocs(
      query(collection(db!, "commissionRecords"), where("ownerId", "==", auth!.currentUser!.uid), orderBy("createdAt", "desc"), limit(50))
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db!, "commissionRecords"), limit(100)));
  }

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        ownerId: String(data.ownerId ?? ""),
        partnerName: String(data.partnerName ?? ""),
        source: String(data.source ?? ""),
        amountLabel: String(data.amountLabel ?? ""),
        status: data.status === "paid" ? "paid" : "tracked",
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies CommissionRecord;
    })
    .filter((entry: CommissionRecord) => entry.ownerId === auth!.currentUser!.uid)
    .sort(compareCreatedAtDescending)
    .slice(0, 50);
}

export async function createPartnerReferralRecord(input: {
  partnerName: string;
  referralCode: string;
  rewardLabel: string;
}) {
  assertAuth();
  await addDoc(collection(db!, "partnerReferrals"), {
    ownerId: auth!.currentUser!.uid,
    partnerName: input.partnerName.trim(),
    referralCode: input.referralCode.trim().toUpperCase(),
    rewardLabel: input.rewardLabel.trim(),
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserPartnerReferralRecords() {
  assertAuth();
  let snapshot;

  try {
    snapshot = await getDocs(
      query(collection(db!, "partnerReferrals"), where("ownerId", "==", auth!.currentUser!.uid), orderBy("createdAt", "desc"), limit(30))
    );
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    snapshot = await getDocs(query(collection(db!, "partnerReferrals"), limit(100)));
  }

  return snapshot.docs
    .map((docSnapshot: FirestoreDocSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        id: docSnapshot.id,
        ownerId: String(data.ownerId ?? ""),
        partnerName: String(data.partnerName ?? ""),
        referralCode: String(data.referralCode ?? ""),
        rewardLabel: String(data.rewardLabel ?? ""),
        active: data.active !== false,
        createdAt: mapTimestamp(data, "createdAt"),
      } satisfies PartnerReferralRecord & {
        createdAt?: { seconds?: number; nanoseconds?: number } | null;
      };
    })
    .filter((entry: PartnerReferralRecord) => entry.ownerId === auth!.currentUser!.uid)
    .sort(compareCreatedAtDescending)
    .slice(0, 30)
    .map(
      (
        entry: PartnerReferralRecord & {
          createdAt?: { seconds?: number; nanoseconds?: number } | null;
        }
      ) => {
        const { createdAt: _createdAt, ...rest } = entry;
        return rest;
      }
    );
}

export async function getCurrentAmbassadorStats(): Promise<AmbassadorStats> {
  assertAuth();
  const snapshot = await getDocs(
    query(collection(db!, "inviteCodes"), where("createdBy", "==", auth!.currentUser!.uid), limit(50))
  );

  const invites = snapshot.docs.map(
    (docSnapshot: FirestoreDocSnapshot) => docSnapshot.data() as Record<string, unknown>
  );
  const topEntry = invites
    .map((entry: Record<string, unknown>) => ({
      code: String(entry.code ?? ""),
      referralCount: Number(entry.referralCount ?? entry.uses ?? 0),
    }))
    .sort(
      (
        left: { referralCount: number; code: string },
        right: { referralCount: number; code: string }
      ) => right.referralCount - left.referralCount
    )[0];

  return {
    invitesCreated: invites.length,
    referralCount: invites.reduce((sum, entry) => sum + Number(entry.referralCount ?? entry.uses ?? 0), 0),
    topInviteCode: topEntry?.code ?? "",
  };
}

export async function getCurrentPayoutSnapshot(): Promise<PayoutSnapshot> {
  assertAuth();

  const [invoices, bookings, tips, ambassador, commissions] = await Promise.all([
    getCurrentUserInvoices(),
    getDocs(query(collection(db!, "bookings"), where("hostId", "==", auth!.currentUser!.uid), limit(100))),
    getDocs(query(collection(db!, "tips"), where("targetUid", "==", auth!.currentUser!.uid), limit(100))),
    getCurrentAmbassadorStats(),
    getCurrentUserCommissionRecords(),
  ]);

  const paidInvoices = invoices.filter((invoice: InvoiceRecord) => invoice.status === "paid");
  const paidInvoiceRevenue = paidInvoices.reduce((sum, invoice) => sum + parseAmount(invoice.amountLabel), 0);
  const bookingRevenue = bookings.docs.reduce((sum, docSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    if (data.status !== "accepted" && data.status !== "completed") {
      return sum;
    }
    return sum + parseAmount(String(data.priceLabel ?? "")) + parseAmount(String(data.depositLabel ?? ""));
  }, 0);
  const tipRevenue = tips.docs.reduce((sum, docSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return sum + parseAmount(String(data.amountLabel ?? ""));
  }, 0);
  const commissionRevenue = commissions.reduce((sum, entry) => sum + parseAmount(entry.amountLabel), 0);

  return {
    estimatedPayout: paidInvoiceRevenue + bookingRevenue + tipRevenue + commissionRevenue,
    paidInvoices: paidInvoices.length,
    bookingRevenue,
    tipRevenue,
    referralCount: ambassador.referralCount,
  };
}

export async function getCurrentTaxExportReport(): Promise<TaxExportReport> {
  assertAuth();

  const [payouts, invoices, listings] = await Promise.all([
    getCurrentPayoutSnapshot(),
    getCurrentUserInvoices(),
    getCurrentUserMarketplaceListings(),
  ]);

  const invoiceRevenue = invoices
    .filter((invoice: InvoiceRecord) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + parseAmount(invoice.amountLabel), 0);
  const listingRevenue = listings.reduce((sum, listing) => sum + parseAmount(listing.priceLabel), 0);
  const estimatedTaxableRevenue = payouts.bookingRevenue + invoiceRevenue + payouts.tipRevenue + listingRevenue;

  return {
    estimatedTaxableRevenue,
    bookingRevenue: payouts.bookingRevenue,
    invoiceRevenue,
    tipRevenue: payouts.tipRevenue,
    listingRevenue,
    suggestedSetAside: Math.round(estimatedTaxableRevenue * 0.28),
    exportLabel: `HoopLink-export-${new Date().toISOString().slice(0, 10)}`,
  };
}

export async function getOrgBillingSettings() {
  if (!auth?.currentUser || !db) {
    return defaultOrgBillingSettings;
  }

  const snapshot = await getDoc(doc(db, "orgBilling", auth.currentUser.uid));
  if (!snapshot.exists()) {
    return defaultOrgBillingSettings;
  }

  const data = snapshot.data() as Record<string, unknown>;
  return {
    billingContact: String(data.billingContact ?? ""),
    checkoutProvider:
      data.checkoutProvider === "apple_pay" ||
      data.checkoutProvider === "google_pay" ||
      data.checkoutProvider === "manual"
        ? data.checkoutProvider
        : "stripe",
    payoutsEnabled: data.payoutsEnabled !== false,
    giftSubscriptionsEnabled: data.giftSubscriptionsEnabled !== false,
    teamBundlesEnabled: data.teamBundlesEnabled !== false,
  } satisfies OrgBillingSettings;
}

export async function updateOrgBillingSettings(input: OrgBillingSettings) {
  assertAuth();
  await setDoc(
    doc(db!, "orgBilling", auth!.currentUser!.uid),
    {
      ...input,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
