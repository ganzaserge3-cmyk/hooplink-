"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applyToBrandCampaign,
  createMarketplaceListing,
  createMarketplaceReview,
  getMarketplaceListings,
  getMarketplaceReviews,
  getOpenBrandCampaigns,
  recordCreatorTip,
  type BrandCampaignRecord,
  type MarketplaceListingRecord,
  type MarketplaceListingType,
  type MarketplaceReviewRecord,
} from "@/lib/commerce";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";

const listingTabs: Array<{ id: MarketplaceListingType | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "gear", label: "Gear" },
  { id: "digital_product", label: "Digital" },
  { id: "training_plan", label: "Training Plans" },
  { id: "private_group", label: "Private Groups" },
  { id: "fan_subscription", label: "Subscriptions" },
  { id: "sponsorship", label: "Sponsorships" },
  { id: "fundraising", label: "Fundraising" },
  { id: "affiliate", label: "Affiliate" },
];

function MarketplacePageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const [campaigns, setCampaigns] = useState<BrandCampaignRecord[]>([]);
  const [creators, setCreators] = useState<SearchProfile[]>([]);
  const [listings, setListings] = useState<MarketplaceListingRecord[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [campaignNote, setCampaignNote] = useState("");
  const [selectedCreatorUid, setSelectedCreatorUid] = useState("");
  const [tipAmount, setTipAmount] = useState("$10");
  const [tipNote, setTipNote] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviews, setReviews] = useState<MarketplaceReviewRecord[]>([]);
  const [activeTab, setActiveTab] = useState<MarketplaceListingType | "all">("all");
  const [listingForm, setListingForm] = useState({
    type: "gear" as MarketplaceListingType,
    title: "",
    summary: "",
    priceLabel: "",
    location: "",
    checkoutUrl: "",
    tags: "",
  });

  const refresh = async (tab: MarketplaceListingType | "all" = activeTab) => {
    const [nextCampaigns, nextCreators, nextListings] = await Promise.all([
      getOpenBrandCampaigns(),
      searchProfiles(""),
      getMarketplaceListings(tab),
    ]);
    setCampaigns(nextCampaigns);
    setCreators(nextCreators);
    setListings(nextListings);
  };

  useEffect(() => {
    const creatorFromQuery = searchParams.get("creator") ?? "";
    setSelectedCreatorUid(creatorFromQuery);
    void refresh();
  }, [searchParams]);

  useEffect(() => {
    void getMarketplaceListings(activeTab).then(setListings);
  }, [activeTab]);

  useEffect(() => {
    if (!selectedCreatorUid) {
      setReviews([]);
      return;
    }
    void getMarketplaceReviews(selectedCreatorUid).then(setReviews);
  }, [selectedCreatorUid]);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId]
  );

  const selectedCreator = useMemo(
    () => creators.find((creator) => creator.uid === selectedCreatorUid) ?? null,
    [creators, selectedCreatorUid]
  );

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            Explore gear, digital products, paid training plans, private groups, fan subscriptions, sponsorships, fundraising, and affiliate offers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {listingTabs.map((tab) => (
            <Button key={tab.id} type="button" variant={activeTab === tab.id ? "default" : "outline"} size="sm" onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Listings</CardTitle>
              <CardDescription>Public storefront for gear, products, training plans, subscriptions, sponsorship deals, and fundraising items.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {listings.map((listing) => (
                  <div key={listing.id} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{listing.type.replaceAll("_", " ")}</p>
                        <h3 className="font-semibold">{listing.title}</h3>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs">{listing.priceLabel || "Request pricing"}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{listing.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[listing.ownerName, listing.location].filter(Boolean).join(" | ")}
                    </p>
                    {listing.tags.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {listing.tags.map((tag) => <span key={`${listing.id}-${tag}`} className="rounded-full bg-muted px-3 py-1 text-xs">{tag}</span>)}
                      </div>
                    ) : null}
                    {listing.checkoutUrl ? (
                      <div className="mt-3">
                        <Button variant="outline" size="sm" asChild>
                          <a href={listing.checkoutUrl} target="_blank" rel="noreferrer">Open Checkout</a>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {listings.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No listings for this category yet.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Listing</CardTitle>
                <CardDescription>Add gear, digital products, training plans, fan subscriptions, fundraising items, or sponsor offers.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-3"
                  onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    await createMarketplaceListing({
                      type: listingForm.type,
                      title: listingForm.title,
                      summary: listingForm.summary,
                      priceLabel: listingForm.priceLabel,
                      location: listingForm.location,
                      checkoutUrl: listingForm.checkoutUrl,
                      tags: listingForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
                    });
                    setListingForm({
                      type: "gear",
                      title: "",
                      summary: "",
                      priceLabel: "",
                      location: "",
                      checkoutUrl: "",
                      tags: "",
                    });
                    await refresh(activeTab);
                  }}
                >
                  <select value={listingForm.type} onChange={(event) => setListingForm((current) => ({ ...current, type: event.target.value as MarketplaceListingType }))} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {listingTabs.filter((tab) => tab.id !== "all").map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                  </select>
                  <input value={listingForm.title} onChange={(event) => setListingForm((current) => ({ ...current, title: event.target.value }))} placeholder="Listing title" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
                  <input value={listingForm.priceLabel} onChange={(event) => setListingForm((current) => ({ ...current, priceLabel: event.target.value }))} placeholder="$49 or Free" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
                  <input value={listingForm.location} onChange={(event) => setListingForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location or audience" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
                  <input value={listingForm.checkoutUrl} onChange={(event) => setListingForm((current) => ({ ...current, checkoutUrl: event.target.value }))} placeholder="Checkout URL" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
                  <input value={listingForm.tags} onChange={(event) => setListingForm((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags, comma separated" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
                  <textarea value={listingForm.summary} onChange={(event) => setListingForm((current) => ({ ...current, summary: event.target.value }))} placeholder="What buyers or partners get from this offer" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <Button type="submit" disabled={!listingForm.title.trim()}>Publish Listing</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open Campaigns</CardTitle>
                <CardDescription>Apply to sponsorship marketplace opportunities and brand partnership briefs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    No campaigns are open right now.
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => setSelectedCampaignId(campaign.id)}
                      className={`w-full rounded-2xl border p-4 text-left ${selectedCampaignId === campaign.id ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">{campaign.brandName}</p>
                          <h3 className="font-semibold">{campaign.title}</h3>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs">{campaign.budgetLabel || "Budget on request"}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{campaign.summary}</p>
                    </button>
                  ))
                )}

                <form
                  className="space-y-3 rounded-2xl border p-4"
                  onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    if (!selectedCampaign) {
                      return;
                    }
                    await applyToBrandCampaign(selectedCampaign, campaignNote);
                    setCampaignNote("");
                  }}
                >
                  <p className="font-medium">Campaign application</p>
                  <textarea
                    value={campaignNote}
                    onChange={(event) => setCampaignNote(event.target.value)}
                    placeholder="Share why you're a fit, your audience angle, and the content you would deliver."
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button type="submit" disabled={!selectedCampaignId || !campaignNote.trim()}>
                    Apply to Campaign
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support A Creator</CardTitle>
                <CardDescription>Tip creators, then leave reviews after bookings, sponsorships, or product purchases.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={selectedCreatorUid}
                  onChange={(event) => setSelectedCreatorUid(event.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Choose creator</option>
                  {creators
                    .filter((creator) => creator.uid !== user?.uid)
                    .map((creator) => (
                      <option key={creator.uid} value={creator.uid}>
                        {creator.displayName}
                      </option>
                    ))}
                </select>
                {selectedCreator ? (
                  <div className="rounded-xl bg-muted p-4 text-sm">
                    <p className="font-semibold">{selectedCreator.displayName}</p>
                    <p className="text-muted-foreground">
                      {[selectedCreator.role?.type, selectedCreator.role?.sport, selectedCreator.location].filter(Boolean).join(" | ")}
                    </p>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/profile/${selectedCreator.uid}`}>View Profile</Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
                <input value={tipAmount} onChange={(event) => setTipAmount(event.target.value)} placeholder="$10" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
                <textarea value={tipNote} onChange={(event) => setTipNote(event.target.value)} placeholder="Great session, loved the breakdown, thanks for the help." className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <Button
                  onClick={() =>
                    void recordCreatorTip({
                      targetUid: selectedCreatorUid,
                      amountLabel: tipAmount,
                      note: tipNote,
                    }).then(() => setTipNote(""))
                  }
                  disabled={!selectedCreatorUid || !tipAmount.trim()}
                >
                  Send Tip
                </Button>
                <div className="grid gap-3 sm:grid-cols-[120px,1fr] border-t pt-3">
                  <select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
                    {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
                  </select>
                  <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Fast turnaround, clear communication, and strong delivery." className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <Button
                  onClick={() =>
                    void createMarketplaceReview({
                      targetUid: selectedCreatorUid,
                      rating: Number(reviewRating),
                      comment: reviewComment,
                    }).then(async () => {
                      setReviewComment("");
                      if (selectedCreatorUid) {
                        setReviews(await getMarketplaceReviews(selectedCreatorUid));
                      }
                    })
                  }
                  disabled={!selectedCreatorUid || !reviewComment.trim()}
                >
                  Submit Review
                </Button>

                <div className="space-y-3 border-t pt-3">
                  {reviews.length === 0 ? (
                    <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                      No reviews for this creator yet.
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{review.authorName}</p>
                          <span className="text-sm text-muted-foreground">{review.rating}/5</span>
                        </div>
                        <p className="mt-2 text-sm">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function MarketplacePage() {
  return (
    <AuthProvider>
      <MarketplacePageContent />
    </AuthProvider>
  );
}
