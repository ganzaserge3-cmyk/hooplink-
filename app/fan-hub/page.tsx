"use client";

import { useEffect, useMemo, useState } from "react";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  calculateTaxEstimate,
  createAuctionEvent,
  createBirthdayShoutout,
  createCollectible,
  createContractRenewalReminder,
  createCreatorCollab,
  createDonationReceipt,
  createDropRaffle,
  createFanClubMembership,
  createFanWallPost,
  createFundraisingCampaign,
  createLoyaltyReward,
  createMeetAndGreet,
  createMerchPreorder,
  createSeasonPass,
  createSeatReservation,
  createSignedMerchRequest,
  createSponsorInvoiceReminder,
  createVipChatMessage,
  getBrandSafeCreatorScore,
  getFanOpsProfile,
  getFanHubSnapshot,
  saveFanOpsProfile,
} from "@/lib/phase5-fan";

const ADVANCED_FAN_FIELDS = [
  { key: "fanClubMemberships", label: "Fan club memberships" },
  { key: "vipCommunities", label: "VIP communities" },
  { key: "privateFanBadgeTiers", label: "Private fan badge tiers" },
  { key: "loyaltyRewardsProgram", label: "Loyalty rewards" },
  { key: "collectiblesDrops", label: "Collectibles" },
  { key: "rafflesQueue", label: "Raffles" },
  { key: "signedMerchRequestsBoard", label: "Signed merch requests" },
  { key: "meetAndGreetBookings", label: "Meet-and-greet bookings" },
  { key: "birthdayShoutouts", label: "Birthday shoutouts" },
  { key: "donationCampaigns", label: "Donations and fundraising" },
  { key: "auctionEvents", label: "Auction events" },
  { key: "seasonPassesProgram", label: "Season passes and seat reservations" },
  { key: "fanWallPostsBoard", label: "Fan wall posts" },
  { key: "predictionContests", label: "Prediction contests" },
  { key: "triviaChallenges", label: "Trivia challenges" },
  { key: "watchParties", label: "Watch parties" },
  { key: "fanLeaderboards", label: "Fan leaderboards" },
  { key: "fanBadges", label: "Fan badges" },
  { key: "communityChallengeLeaderboard", label: "Community challenge leaderboard" },
  { key: "communityStreaks", label: "Community streaks" },
  { key: "pollingCenter", label: "Polling and voting center" },
  { key: "fanClipSubmissions", label: "Fan clip submissions" },
  { key: "fanMerchWishlists", label: "Fan merch wishlists" },
  { key: "creatorSupportGoals", label: "Creator support goals" },
  { key: "clubPointsEconomy", label: "Club points economy" },
  { key: "tippingGoals", label: "In-app tipping goals" },
  { key: "donationReceiptsCenter", label: "Donation receipts" },
  { key: "loyaltyTiers", label: "Loyalty tiers" },
  { key: "fanGiftSubscriptions", label: "Fan gift subscriptions" },
] as const;

function FanHubContent() {
  const { user } = useAuthContext();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getFanHubSnapshot>> | null>(null);
  const [brandSafeScore, setBrandSafeScore] = useState(78);

  const [merchForm, setMerchForm] = useState({ productName: "", priceLabel: "", quantity: "1", buyerName: "" });
  const [auctionForm, setAuctionForm] = useState({ title: "", itemName: "", currentBidLabel: "", endsAt: "" });
  const [membershipForm, setMembershipForm] = useState({ tierName: "", memberName: "", perks: "" });
  const [vipForm, setVipForm] = useState({ channelName: "VIP Locker Room", authorName: "", message: "" });
  const [passForm, setPassForm] = useState({ teamName: "", passType: "", ownerName: "", priceLabel: "" });
  const [seatForm, setSeatForm] = useState({ eventName: "", section: "", seatLabel: "", holderName: "" });
  const [rewardForm, setRewardForm] = useState({ title: "", pointsCost: "250" });
  const [raffleForm, setRaffleForm] = useState({ title: "", inventoryCount: "10", entriesCount: "0", closesAt: "" });
  const [wallForm, setWallForm] = useState({ authorName: "", message: "", teamName: "" });
  const [meetForm, setMeetForm] = useState({ guestName: "", creatorName: "", eventDate: "", packageLabel: "" });
  const [shoutoutForm, setShoutoutForm] = useState({ recipientName: "", creatorName: "", message: "", priceLabel: "" });
  const [signedForm, setSignedForm] = useState({ itemName: "", requesterName: "", personalization: "" });
  const [collectibleForm, setCollectibleForm] = useState({ title: "", rarity: "rare", ownerName: "", supply: "50" });
  const [receiptForm, setReceiptForm] = useState({ donorName: "", amountLabel: "", email: "", campaignTitle: "" });
  const [fundraiserForm, setFundraiserForm] = useState({ title: "", targetAmount: "5000", raisedAmount: "0", supporterCount: "0" });
  const [invoiceForm, setInvoiceForm] = useState({ sponsorName: "", invoiceLabel: "", dueDate: "", ownerName: "" });
  const [renewalForm, setRenewalForm] = useState({ partnerName: "", contractTitle: "", renewalDate: "" });
  const [collabForm, setCollabForm] = useState({ creatorName: "", askTitle: "", audienceGoal: "", revenueSplitLabel: "" });
  const [estimatedIncome, setEstimatedIncome] = useState("10000");
  const [advancedFanMeta, setAdvancedFanMeta] = useState<Record<string, string[]>>({});

  const refresh = async () => {
    setLoading(true);
    try {
      const [nextSnapshot, nextScore, fanOpsProfile] = await Promise.all([
        getFanHubSnapshot(),
        getBrandSafeCreatorScore(user?.uid),
        getFanOpsProfile(),
      ]);
      setSnapshot(nextSnapshot);
      setBrandSafeScore(nextScore);
      setAdvancedFanMeta(fanOpsProfile.advancedFanMeta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user]);

  const taxEstimate = useMemo(() => calculateTaxEstimate(Number(estimatedIncome)), [estimatedIncome]);

  const submit = async (action: () => Promise<void>, message: string, reset?: () => void) => {
    await action();
    reset?.();
    setStatus(message);
    await refresh();
  };

  if (!user || loading || !snapshot) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Fan and Revenue Hub</h1>
          <p className="text-muted-foreground">Fan commerce, loyalty, premium experiences, creator collabs, and revenue operations in one place.</p>
          {status ? <p className="mt-2 text-sm text-primary">{status}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.memberships.length}</div><div className="text-sm text-muted-foreground">Fan club members</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.seasonPasses.length}</div><div className="text-sm text-muted-foreground">Season passes</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.loyaltyRewards.length}</div><div className="text-sm text-muted-foreground">Rewards catalog</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.creatorCollabs.length}</div><div className="text-sm text-muted-foreground">Creator collabs</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{brandSafeScore}</div><div className="text-sm text-muted-foreground">Brand-safe score</div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Merch, Auctions, and Collectibles</CardTitle><CardDescription>Run pre-orders, auction events, signed merch requests, and digital collectible drops.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={merchForm.productName} onChange={(e) => setMerchForm((c) => ({ ...c, productName: e.target.value }))} placeholder="Pre-order product" />
                <Input value={merchForm.priceLabel} onChange={(e) => setMerchForm((c) => ({ ...c, priceLabel: e.target.value }))} placeholder="$45" />
                <Input value={merchForm.quantity} onChange={(e) => setMerchForm((c) => ({ ...c, quantity: e.target.value }))} placeholder="Quantity" />
                <Input value={merchForm.buyerName} onChange={(e) => setMerchForm((c) => ({ ...c, buyerName: e.target.value }))} placeholder="Buyer name" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createMerchPreorder({ ...merchForm, quantity: Number(merchForm.quantity) }), "Merch pre-order created.", () => setMerchForm({ productName: "", priceLabel: "", quantity: "1", buyerName: "" }))} disabled={!merchForm.productName.trim()}>Create Pre-order</Button>
                <Button variant="outline" onClick={() => void submit(() => createAuctionEvent(auctionForm), "Auction event created.", () => setAuctionForm({ title: "", itemName: "", currentBidLabel: "", endsAt: "" }))} disabled={!auctionForm.title.trim()}>Create Auction</Button>
                <Button variant="outline" onClick={() => void submit(() => createSignedMerchRequest({ ...signedForm, status: "pending" }), "Signed merch request added.", () => setSignedForm({ itemName: "", requesterName: "", personalization: "" }))} disabled={!signedForm.itemName.trim()}>Add Signed Request</Button>
                <Button variant="outline" onClick={() => void submit(() => createCollectible({ ...collectibleForm, supply: Number(collectibleForm.supply) }), "Collectible drop saved.", () => setCollectibleForm({ title: "", rarity: "rare", ownerName: "", supply: "50" }))} disabled={!collectibleForm.title.trim()}>Create Collectible</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={auctionForm.title} onChange={(e) => setAuctionForm((c) => ({ ...c, title: e.target.value }))} placeholder="Auction title" />
                <Input value={auctionForm.itemName} onChange={(e) => setAuctionForm((c) => ({ ...c, itemName: e.target.value }))} placeholder="Auction item" />
                <Input value={auctionForm.currentBidLabel} onChange={(e) => setAuctionForm((c) => ({ ...c, currentBidLabel: e.target.value }))} placeholder="Current bid" />
                <Input value={auctionForm.endsAt} onChange={(e) => setAuctionForm((c) => ({ ...c, endsAt: e.target.value }))} placeholder="Ends at" />
                <Input value={signedForm.itemName} onChange={(e) => setSignedForm((c) => ({ ...c, itemName: e.target.value }))} placeholder="Signed item" />
                <Input value={signedForm.requesterName} onChange={(e) => setSignedForm((c) => ({ ...c, requesterName: e.target.value }))} placeholder="Requester" />
                <Input value={signedForm.personalization} onChange={(e) => setSignedForm((c) => ({ ...c, personalization: e.target.value }))} placeholder="Personalization" />
                <Input value={collectibleForm.title} onChange={(e) => setCollectibleForm((c) => ({ ...c, title: e.target.value }))} placeholder="Collectible title" />
                <Input value={collectibleForm.ownerName} onChange={(e) => setCollectibleForm((c) => ({ ...c, ownerName: e.target.value }))} placeholder="Owner/creator" />
                <Input value={collectibleForm.supply} onChange={(e) => setCollectibleForm((c) => ({ ...c, supply: e.target.value }))} placeholder="Supply" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Memberships, VIP Access, and Fan Experiences</CardTitle><CardDescription>Build a fan club, VIP chat, season passes, seat checkout, meet-and-greets, and birthday shoutouts.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={membershipForm.tierName} onChange={(e) => setMembershipForm((c) => ({ ...c, tierName: e.target.value }))} placeholder="Membership tier" />
                <Input value={membershipForm.memberName} onChange={(e) => setMembershipForm((c) => ({ ...c, memberName: e.target.value }))} placeholder="Member name" />
                <Input value={vipForm.channelName} onChange={(e) => setVipForm((c) => ({ ...c, channelName: e.target.value }))} placeholder="VIP channel" />
                <Input value={vipForm.authorName} onChange={(e) => setVipForm((c) => ({ ...c, authorName: e.target.value }))} placeholder="Author name" />
                <Input value={passForm.teamName} onChange={(e) => setPassForm((c) => ({ ...c, teamName: e.target.value }))} placeholder="Team name" />
                <Input value={passForm.passType} onChange={(e) => setPassForm((c) => ({ ...c, passType: e.target.value }))} placeholder="Season pass type" />
                <Input value={seatForm.eventName} onChange={(e) => setSeatForm((c) => ({ ...c, eventName: e.target.value }))} placeholder="Event name" />
                <Input value={seatForm.seatLabel} onChange={(e) => setSeatForm((c) => ({ ...c, seatLabel: e.target.value }))} placeholder="Seat label" />
              </div>
              <textarea value={vipForm.message} onChange={(e) => setVipForm((c) => ({ ...c, message: e.target.value }))} placeholder="VIP supporter message" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createFanClubMembership({ ...membershipForm, perks: membershipForm.perks.split(",").map((item) => item.trim()).filter(Boolean) }), "Fan club member added.", () => setMembershipForm({ tierName: "", memberName: "", perks: "" }))} disabled={!membershipForm.tierName.trim()}>Add Membership</Button>
                <Button variant="outline" onClick={() => void submit(() => createVipChatMessage(vipForm), "VIP chat message posted.", () => setVipForm({ channelName: "VIP Locker Room", authorName: "", message: "" }))} disabled={!vipForm.message.trim()}>Post VIP Message</Button>
                <Button variant="outline" onClick={() => void submit(() => createSeasonPass(passForm), "Season pass issued.", () => setPassForm({ teamName: "", passType: "", ownerName: "", priceLabel: "" }))} disabled={!passForm.teamName.trim()}>Create Season Pass</Button>
                <Button variant="outline" onClick={() => void submit(() => createSeatReservation(seatForm), "Seat reservation saved.", () => setSeatForm({ eventName: "", section: "", seatLabel: "", holderName: "" }))} disabled={!seatForm.eventName.trim()}>Reserve Seat</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={membershipForm.perks} onChange={(e) => setMembershipForm((c) => ({ ...c, perks: e.target.value }))} placeholder="Perks, comma separated" />
                <Input value={passForm.ownerName} onChange={(e) => setPassForm((c) => ({ ...c, ownerName: e.target.value }))} placeholder="Pass owner" />
                <Input value={passForm.priceLabel} onChange={(e) => setPassForm((c) => ({ ...c, priceLabel: e.target.value }))} placeholder="$199 season" />
                <Input value={seatForm.section} onChange={(e) => setSeatForm((c) => ({ ...c, section: e.target.value }))} placeholder="Section" />
                <Input value={seatForm.holderName} onChange={(e) => setSeatForm((c) => ({ ...c, holderName: e.target.value }))} placeholder="Holder name" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={meetForm.guestName} onChange={(e) => setMeetForm((c) => ({ ...c, guestName: e.target.value }))} placeholder="Guest name" />
                <Input value={meetForm.creatorName} onChange={(e) => setMeetForm((c) => ({ ...c, creatorName: e.target.value }))} placeholder="Creator name" />
                <Input value={meetForm.eventDate} onChange={(e) => setMeetForm((c) => ({ ...c, eventDate: e.target.value }))} placeholder="Meet date" />
                <Input value={meetForm.packageLabel} onChange={(e) => setMeetForm((c) => ({ ...c, packageLabel: e.target.value }))} placeholder="Package" />
                <Input value={shoutoutForm.recipientName} onChange={(e) => setShoutoutForm((c) => ({ ...c, recipientName: e.target.value }))} placeholder="Birthday recipient" />
                <Input value={shoutoutForm.creatorName} onChange={(e) => setShoutoutForm((c) => ({ ...c, creatorName: e.target.value }))} placeholder="Creator" />
                <Input value={shoutoutForm.priceLabel} onChange={(e) => setShoutoutForm((c) => ({ ...c, priceLabel: e.target.value }))} placeholder="$25 shoutout" />
              </div>
              <textarea value={shoutoutForm.message} onChange={(e) => setShoutoutForm((c) => ({ ...c, message: e.target.value }))} placeholder="Birthday message brief" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => void submit(() => createMeetAndGreet(meetForm), "Meet-and-greet booked.", () => setMeetForm({ guestName: "", creatorName: "", eventDate: "", packageLabel: "" }))} disabled={!meetForm.guestName.trim()}>Book Meet-and-Greet</Button>
                <Button variant="outline" onClick={() => void submit(() => createBirthdayShoutout(shoutoutForm), "Birthday shoutout order created.", () => setShoutoutForm({ recipientName: "", creatorName: "", message: "", priceLabel: "" }))} disabled={!shoutoutForm.recipientName.trim()}>Create Shoutout</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Loyalty, Raffles, and Community</CardTitle><CardDescription>Offer rewards marketplace redemptions, limited-access raffles, and fan wall posts.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={rewardForm.title} onChange={(e) => setRewardForm((c) => ({ ...c, title: e.target.value }))} placeholder="Reward title" />
                <Input value={rewardForm.pointsCost} onChange={(e) => setRewardForm((c) => ({ ...c, pointsCost: e.target.value }))} placeholder="Points cost" />
                <Input value={raffleForm.title} onChange={(e) => setRaffleForm((c) => ({ ...c, title: e.target.value }))} placeholder="Raffle title" />
                <Input value={raffleForm.inventoryCount} onChange={(e) => setRaffleForm((c) => ({ ...c, inventoryCount: e.target.value }))} placeholder="Inventory count" />
                <Input value={raffleForm.closesAt} onChange={(e) => setRaffleForm((c) => ({ ...c, closesAt: e.target.value }))} placeholder="Closes at" />
                <Input value={wallForm.authorName} onChange={(e) => setWallForm((c) => ({ ...c, authorName: e.target.value }))} placeholder="Fan name" />
                <Input value={wallForm.teamName} onChange={(e) => setWallForm((c) => ({ ...c, teamName: e.target.value }))} placeholder="Team name" />
              </div>
              <textarea value={wallForm.message} onChange={(e) => setWallForm((c) => ({ ...c, message: e.target.value }))} placeholder="Fan wall post" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createLoyaltyReward({ title: rewardForm.title, pointsCost: Number(rewardForm.pointsCost), redeemedByCount: 0 }), "Loyalty reward created.", () => setRewardForm({ title: "", pointsCost: "250" }))} disabled={!rewardForm.title.trim()}>Create Reward</Button>
                <Button variant="outline" onClick={() => void submit(() => createDropRaffle({ title: raffleForm.title, inventoryCount: Number(raffleForm.inventoryCount), entriesCount: Number(raffleForm.entriesCount), closesAt: raffleForm.closesAt }), "Drop raffle created.", () => setRaffleForm({ title: "", inventoryCount: "10", entriesCount: "0", closesAt: "" }))} disabled={!raffleForm.title.trim()}>Create Raffle</Button>
                <Button variant="outline" onClick={() => void submit(() => createFanWallPost(wallForm), "Fan wall post published.", () => setWallForm({ authorName: "", message: "", teamName: "" }))} disabled={!wallForm.message.trim()}>Post to Fan Wall</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{snapshot.loyaltyRewards.length}</p><p className="text-muted-foreground">Rewards</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{snapshot.raffles.length}</p><p className="text-muted-foreground">Active raffles</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{snapshot.fanWallPosts.length}</p><p className="text-muted-foreground">Fan wall posts</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Finance Ops and Creator Partnerships</CardTitle><CardDescription>Handle donation receipts, fundraising 2.0, sponsor reminders, tax planning, renewal reminders, and creator collabs.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={receiptForm.donorName} onChange={(e) => setReceiptForm((c) => ({ ...c, donorName: e.target.value }))} placeholder="Donor name" />
                <Input value={receiptForm.amountLabel} onChange={(e) => setReceiptForm((c) => ({ ...c, amountLabel: e.target.value }))} placeholder="$100" />
                <Input value={receiptForm.email} onChange={(e) => setReceiptForm((c) => ({ ...c, email: e.target.value }))} placeholder="Receipt email" />
                <Input value={receiptForm.campaignTitle} onChange={(e) => setReceiptForm((c) => ({ ...c, campaignTitle: e.target.value }))} placeholder="Campaign title" />
                <Input value={fundraiserForm.title} onChange={(e) => setFundraiserForm((c) => ({ ...c, title: e.target.value }))} placeholder="Fundraiser title" />
                <Input value={fundraiserForm.targetAmount} onChange={(e) => setFundraiserForm((c) => ({ ...c, targetAmount: e.target.value }))} placeholder="Target amount" />
                <Input value={invoiceForm.sponsorName} onChange={(e) => setInvoiceForm((c) => ({ ...c, sponsorName: e.target.value }))} placeholder="Sponsor name" />
                <Input value={invoiceForm.invoiceLabel} onChange={(e) => setInvoiceForm((c) => ({ ...c, invoiceLabel: e.target.value }))} placeholder="Invoice label" />
                <Input value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((c) => ({ ...c, dueDate: e.target.value }))} placeholder="Due date" />
                <Input value={invoiceForm.ownerName} onChange={(e) => setInvoiceForm((c) => ({ ...c, ownerName: e.target.value }))} placeholder="Owner name" />
                <Input value={renewalForm.partnerName} onChange={(e) => setRenewalForm((c) => ({ ...c, partnerName: e.target.value }))} placeholder="Renewal partner" />
                <Input value={renewalForm.contractTitle} onChange={(e) => setRenewalForm((c) => ({ ...c, contractTitle: e.target.value }))} placeholder="Contract title" />
                <Input value={renewalForm.renewalDate} onChange={(e) => setRenewalForm((c) => ({ ...c, renewalDate: e.target.value }))} placeholder="Renewal date" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createDonationReceipt(receiptForm), "Donation receipt email record created.", () => setReceiptForm({ donorName: "", amountLabel: "", email: "", campaignTitle: "" }))} disabled={!receiptForm.email.trim()}>Create Receipt</Button>
                <Button variant="outline" onClick={() => void submit(() => createFundraisingCampaign({ title: fundraiserForm.title, targetAmount: Number(fundraiserForm.targetAmount), raisedAmount: Number(fundraiserForm.raisedAmount), supporterCount: Number(fundraiserForm.supporterCount) }), "Fundraising campaign created.", () => setFundraiserForm({ title: "", targetAmount: "5000", raisedAmount: "0", supporterCount: "0" }))} disabled={!fundraiserForm.title.trim()}>Create Fundraiser</Button>
                <Button variant="outline" onClick={() => void submit(() => createSponsorInvoiceReminder(invoiceForm), "Sponsor invoice reminder saved.", () => setInvoiceForm({ sponsorName: "", invoiceLabel: "", dueDate: "", ownerName: "" }))} disabled={!invoiceForm.sponsorName.trim()}>Save Invoice Reminder</Button>
                <Button variant="outline" onClick={() => void submit(() => createContractRenewalReminder(renewalForm), "Contract renewal reminder saved.", () => setRenewalForm({ partnerName: "", contractTitle: "", renewalDate: "" }))} disabled={!renewalForm.partnerName.trim()}>Save Renewal</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={collabForm.creatorName} onChange={(e) => setCollabForm((c) => ({ ...c, creatorName: e.target.value }))} placeholder="Creator name" />
                <Input value={collabForm.askTitle} onChange={(e) => setCollabForm((c) => ({ ...c, askTitle: e.target.value }))} placeholder="Collab ask" />
                <Input value={collabForm.audienceGoal} onChange={(e) => setCollabForm((c) => ({ ...c, audienceGoal: e.target.value }))} placeholder="Audience goal" />
                <Input value={collabForm.revenueSplitLabel} onChange={(e) => setCollabForm((c) => ({ ...c, revenueSplitLabel: e.target.value }))} placeholder="Revenue split" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void submit(() => createCreatorCollab(collabForm), "Creator collab listing created.", () => setCollabForm({ creatorName: "", askTitle: "", audienceGoal: "", revenueSplitLabel: "" }))} disabled={!collabForm.creatorName.trim()}>Create Collab</Button>
              </div>
              <div className="rounded-xl border p-4 text-sm">
                <p className="font-medium">Tax estimate calculator</p>
                <Input className="mt-3" value={estimatedIncome} onChange={(e) => setEstimatedIncome(e.target.value)} placeholder="Estimated annual income" />
                <p className="mt-3 text-muted-foreground">Estimated tax: ${taxEstimate.estimatedTax.toLocaleString()} • Suggested set-aside: ${taxEstimate.suggestedSetAside.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fan Loyalty and Platform Community Ops</CardTitle>
            <CardDescription>Manage memberships, VIP spaces, fan challenges, gifting, support goals, and the broader community program in one workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{snapshot.memberships.length}</div><div className="text-sm text-muted-foreground">Memberships</div></div>
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{snapshot.vipMessages.length}</div><div className="text-sm text-muted-foreground">VIP updates</div></div>
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{snapshot.collectibles.length}</div><div className="text-sm text-muted-foreground">Collectibles</div></div>
              <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{Object.values(advancedFanMeta).reduce((sum, items) => sum + items.length, 0)}</div><div className="text-sm text-muted-foreground">Advanced fan ops notes</div></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {ADVANCED_FAN_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2 rounded-xl border p-4">
                  <p className="font-medium">{field.label}</p>
                  <textarea
                    value={(advancedFanMeta[field.key] ?? []).join("\n")}
                    onChange={(event) => setAdvancedFanMeta((current) => ({
                      ...current,
                      [field.key]: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                    }))}
                    placeholder={`${field.label} notes, one item per line`}
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {(advancedFanMeta[field.key] ?? []).length > 0 ? (
                    <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      {(advancedFanMeta[field.key] ?? []).slice(0, 3).join(" • ")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => void saveFanOpsProfile({ advancedFanMeta }).then(() => setStatus("Advanced fan community tools saved."))}
            >
              Save Fan Ops Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function FanHubPage() {
  return (
    <AuthProvider>
      <FanHubContent />
    </AuthProvider>
  );
}
