"use client";

import { FormEvent, useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentUserBusinessProfile,
  updateCurrentUserBusinessProfile,
  type AffiliateLinkRecord,
  type ClassPackageRecord,
  type CreatorBusinessProfile,
  type ProviderRole,
} from "@/lib/business";
import {
  createPremiumGroup,
  getCurrentEarningsSnapshot,
  getOwnedPremiumGroups,
  type EarningsSnapshot,
  type PremiumGroupRecord,
} from "@/lib/creator-hub";

const providerRoleOptions: ProviderRole[] = ["coach", "trainer", "facility", "camp", "tryout"];
const offerKeys = ["training", "consultation", "facility", "camp", "tryout"] as const;
const ADVANCED_COMMERCE_FIELDS = [
  { key: "cancellationPolicies", label: "Booking cancellation policy" },
  { key: "refundHandling", label: "Refund handling" },
  { key: "sessionNotesAfterBooking", label: "Session notes after booking" },
  { key: "rebookingPrompts", label: "Rebooking prompts" },
  { key: "serviceBundles", label: "Service bundles" },
  { key: "giftCards", label: "Gift cards" },
  { key: "giftSubscriptions", label: "Gift subscriptions" },
  { key: "limitedTimeOffers", label: "Limited-time offers" },
  { key: "flashSales", label: "Flash sales" },
  { key: "checkoutLinks", label: "Checkout links" },
  { key: "cartSystem", label: "Cart system" },
  { key: "upsellOffers", label: "Upsell offers" },
  { key: "discountCampaigns", label: "Discount campaigns" },
  { key: "affiliateMarketplace", label: "Affiliate marketplace" },
  { key: "brandPitchInbox", label: "Brand pitch inbox" },
  { key: "proposalTemplates", label: "Proposal templates" },
  { key: "contractVaultNotes", label: "Contract vault" },
  { key: "deliverablesTracker", label: "Deliverables tracker" },
  { key: "invoiceReminders", label: "Invoice reminders" },
  { key: "subscriptionChurnAlerts", label: "Subscription churn alerts" },
  { key: "revenueForecasts", label: "Revenue forecasts" },
  { key: "salesLeaderboard", label: "Sales leaderboard" },
  { key: "marketplaceSearchFilters", label: "Marketplace search filters" },
  { key: "nearbyProvidersMap", label: "Nearby providers map" },
  { key: "providerPortfolios", label: "Provider portfolios" },
  { key: "instantBookMode", label: "Instant book mode" },
  { key: "sessionAvailabilityCalendar", label: "Session availability calendar" },
  { key: "autoConfirmBookings", label: "Auto-confirm bookings" },
  { key: "sessionPrepForms", label: "Session prep forms" },
  { key: "waiversAndAgreements", label: "Waivers and agreements" },
  { key: "venueResourceBooking", label: "Venue resource booking" },
  { key: "equipmentRentalBooking", label: "Equipment rental booking" },
  { key: "tournamentVendorBookings", label: "Tournament vendor bookings" },
  { key: "groupBookingMode", label: "Group booking mode" },
  { key: "teamPackageCheckout", label: "Team package checkout" },
  { key: "schoolPackageCheckout", label: "School package checkout" },
  { key: "fundraiserProductBundles", label: "Fundraiser product bundles" },
  { key: "sponsorDeliverablePricing", label: "Sponsor deliverable pricing" },
  { key: "influencerPackagePricing", label: "Influencer package pricing" },
  { key: "referralRewardsStore", label: "Referral rewards store" },
  { key: "sellerVerification", label: "Seller verification" },
  { key: "buyerProtectionCenter", label: "Buyer protection center" },
  { key: "fraudFlags", label: "Fraud flags" },
  { key: "paymentDisputeTools", label: "Payment dispute tools" },
  { key: "paymentReceiptCenter", label: "Payment receipt center" },
  { key: "taxEstimateAi", label: "Tax estimate AI" },
  { key: "cashFlowCharts", label: "Cash flow charts" },
  { key: "netRevenueCards", label: "Net revenue cards" },
  { key: "payoutScheduleBoard", label: "Payout schedule board" },
  { key: "teamMerchDrops", label: "Team merch drops" },
  { key: "creatorMerchDrops", label: "Creator merch drops" },
  { key: "digitalCourseLibrary", label: "Digital course library" },
  { key: "webinarTicketing", label: "Webinar ticketing" },
  { key: "campAddOns", label: "Camp add-ons" },
  { key: "facilitySlotPricing", label: "Facility slot pricing" },
  { key: "dynamicDemandPricing", label: "Dynamic demand pricing" },
  { key: "promoPerformanceAnalytics", label: "Promo performance analytics" },
  { key: "repeatCustomerTracker", label: "Repeat customer tracker" },
  { key: "customerCrm", label: "Customer CRM" },
  { key: "sessionAttendanceScanner", label: "Session attendance scanner" },
  { key: "qrCheckInBookings", label: "QR check-in for bookings" },
  { key: "providerNoShowTracking", label: "Provider no-show tracking" },
  { key: "sessionReviewFollowUps", label: "Session review follow-ups" },
  { key: "marketplaceBundles", label: "Marketplace bundles" },
  { key: "sponsoredListingBoosts", label: "Sponsored listing boosts" },
  { key: "storeHomepageThemes", label: "Store homepage themes" },
  { key: "productReviewPhotos", label: "Product review photos" },
  { key: "abandonedCartReminders", label: "Abandoned cart reminders" },
] as const;

function BusinessPageContent() {
  const [profile, setProfile] = useState<CreatorBusinessProfile | null>(null);
  const [earnings, setEarnings] = useState<EarningsSnapshot | null>(null);
  const [groups, setGroups] = useState<PremiumGroupRecord[]>([]);
  const [groupForm, setGroupForm] = useState({ name: "", description: "", priceLabel: "" });
  const [packageForm, setPackageForm] = useState<ClassPackageRecord>({
    id: "",
    name: "",
    description: "",
    priceLabel: "",
    sessionCount: 1,
  });
  const [affiliateForm, setAffiliateForm] = useState<AffiliateLinkRecord>({
    id: "",
    label: "",
    url: "",
    commissionLabel: "",
  });
  const [advancedCommerceMeta, setAdvancedCommerceMeta] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const [nextProfile, nextEarnings, nextGroups] = await Promise.all([
      getCurrentUserBusinessProfile(),
      getCurrentEarningsSnapshot(),
      getOwnedPremiumGroups(),
    ]);
    setProfile(nextProfile);
    setAdvancedCommerceMeta(
      Object.fromEntries(
        ADVANCED_COMMERCE_FIELDS.map(({ key }) => [key, (nextProfile.advancedCommerceOps?.[key] ?? []).join("\n")]),
      ),
    );
    setEarnings(nextEarnings);
    setGroups(nextGroups);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) {
      return;
    }

    setSaving(true);
    try {
      await updateCurrentUserBusinessProfile({
        ...profile,
        advancedCommerceOps: Object.fromEntries(
          ADVANCED_COMMERCE_FIELDS.map(({ key }) => [
            key,
            (advancedCommerceMeta[key] ?? "")
              .split("\n")
              .map((value) => value.trim())
              .filter(Boolean),
          ]),
        ),
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Business Hub</h1>
          <p className="text-muted-foreground">
            Set up bookings, packages, discovery, affiliate links, private groups, and business operations from one workspace.
          </p>
        </div>

        {earnings ? (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{earnings.subscribers}</div><div className="text-sm text-muted-foreground">Fan subscriptions</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{earnings.premiumGroupMembers}</div><div className="text-sm text-muted-foreground">Private group members</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{earnings.bookingRequests}</div><div className="text-sm text-muted-foreground">Bookings</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">${earnings.estimatedRevenue}</div><div className="text-sm text-muted-foreground">Estimated revenue</div></div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Provider Setup</CardTitle>
              <CardDescription>
                Activate coach, trainer, facility, camp, and tryout booking profiles with deposits, waitlists, reminders, and local discovery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="Support link"
                    value={profile.supportUrl}
                    onChange={(event) => setProfile((current) => current ? { ...current, supportUrl: event.target.value } : current)}
                  />
                  <input
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="Merch link"
                    value={profile.merchUrl}
                    onChange={(event) => setProfile((current) => current ? { ...current, merchUrl: event.target.value } : current)}
                  />
                  <input
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="Calendar sync URL"
                    value={profile.calendarSyncUrl}
                    onChange={(event) => setProfile((current) => current ? { ...current, calendarSyncUrl: event.target.value } : current)}
                  />
                  <input
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    type="number"
                    min={1}
                    placeholder="Booking reminder hours"
                    value={profile.bookingReminderHours}
                    onChange={(event) => setProfile((current) => current ? { ...current, bookingReminderHours: Number(event.target.value) } : current)}
                  />
                  <input
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="City"
                    value={profile.providerCity}
                    onChange={(event) => setProfile((current) => current ? { ...current, providerCity: event.target.value } : current)}
                  />
                  <input
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="Region / State"
                    value={profile.providerRegion}
                    onChange={(event) => setProfile((current) => current ? { ...current, providerRegion: event.target.value } : current)}
                  />
                  <input
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="Country"
                    value={profile.providerCountry}
                    onChange={(event) => setProfile((current) => current ? { ...current, providerCountry: event.target.value } : current)}
                  />
                  <input
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="Discovery tags, comma separated"
                    value={profile.discoveryTags.join(", ")}
                    onChange={(event) =>
                      setProfile((current) =>
                        current
                          ? {
                              ...current,
                              discoveryTags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                            }
                          : current
                      )
                    }
                  />
                </div>

                <textarea
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Auto reply for booking requests"
                  value={profile.autoReplyMessage}
                  onChange={(event) => setProfile((current) => current ? { ...current, autoReplyMessage: event.target.value } : current)}
                />
                <textarea
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Collaboration pitch for teams, brands, and clients"
                  value={profile.collaborationPitch}
                  onChange={(event) => setProfile((current) => current ? { ...current, collaborationPitch: event.target.value } : current)}
                />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Provider roles</p>
                  <div className="flex flex-wrap gap-2">
                    {providerRoleOptions.map((role) => {
                      const selected = profile.providerRoles.includes(role);
                      return (
                        <Button
                          key={role}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setProfile((current) =>
                              current
                                ? {
                                    ...current,
                                    providerRoles: selected
                                      ? current.providerRoles.filter((entry) => entry !== role)
                                      : [...current.providerRoles, role],
                                  }
                                : current
                            )
                          }
                        >
                          {role}
                        </Button>
                      );
                    })}
                    <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={profile.trustedProvider}
                        onChange={(event) => setProfile((current) => current ? { ...current, trustedProvider: event.target.checked } : current)}
                      />
                      Trusted provider badge
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  {offerKeys.map((offerKey) => {
                    const offer = profile[offerKey];
                    return (
                      <div key={offerKey} className="rounded-2xl border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold capitalize">{offerKey} profile</h3>
                            <p className="text-sm text-muted-foreground">Enable booking, deposits, waitlists, and capacity.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={offer.enabled}
                            onChange={(event) =>
                              setProfile((current) =>
                                current ? { ...current, [offerKey]: { ...current[offerKey], enabled: event.target.checked } } : current
                              )
                            }
                          />
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <input
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                            placeholder="Offer title"
                            value={offer.title}
                            onChange={(event) =>
                              setProfile((current) =>
                                current ? { ...current, [offerKey]: { ...current[offerKey], title: event.target.value } } : current
                              )
                            }
                          />
                          <input
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                            placeholder="Price label"
                            value={offer.priceLabel}
                            onChange={(event) =>
                              setProfile((current) =>
                                current ? { ...current, [offerKey]: { ...current[offerKey], priceLabel: event.target.value } } : current
                              )
                            }
                          />
                          <input
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                            placeholder="Location label"
                            value={offer.locationLabel}
                            onChange={(event) =>
                              setProfile((current) =>
                                current ? { ...current, [offerKey]: { ...current[offerKey], locationLabel: event.target.value } } : current
                              )
                            }
                          />
                          <input
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                            placeholder="Checkout link"
                            value={offer.checkoutUrl}
                            onChange={(event) =>
                              setProfile((current) =>
                                current ? { ...current, [offerKey]: { ...current[offerKey], checkoutUrl: event.target.value } } : current
                              )
                            }
                          />
                          <input
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                            type="number"
                            min={15}
                            placeholder="Duration minutes"
                            value={offer.durationMinutes}
                            onChange={(event) =>
                              setProfile((current) =>
                                current
                                  ? { ...current, [offerKey]: { ...current[offerKey], durationMinutes: Number(event.target.value) } }
                                  : current
                              )
                            }
                          />
                          <input
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                            type="number"
                            min={1}
                            placeholder="Capacity"
                            value={offer.capacity}
                            onChange={(event) =>
                              setProfile((current) =>
                                current ? { ...current, [offerKey]: { ...current[offerKey], capacity: Number(event.target.value) } } : current
                              )
                            }
                          />
                          <input
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
                            placeholder="Secure deposit label, e.g. $20 deposit"
                            value={offer.depositLabel}
                            onChange={(event) =>
                              setProfile((current) =>
                                current ? { ...current, [offerKey]: { ...current[offerKey], depositLabel: event.target.value } } : current
                              )
                            }
                          />
                          <label className="flex items-center gap-2 text-sm md:col-span-2">
                            <input
                              type="checkbox"
                              checked={offer.allowWaitlist}
                              onChange={(event) =>
                                setProfile((current) =>
                                  current
                                    ? { ...current, [offerKey]: { ...current[offerKey], allowWaitlist: event.target.checked } }
                                    : current
                                )
                              }
                            />
                            Allow waitlist when this session fills up
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Business Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Packages</CardTitle>
                <CardDescription>Sell bundles like 5-session plans, camps, and clinic packs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <input className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Package name" value={packageForm.name} onChange={(event) => setPackageForm((current) => ({ ...current, name: event.target.value }))} />
                <input className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Price label" value={packageForm.priceLabel} onChange={(event) => setPackageForm((current) => ({ ...current, priceLabel: event.target.value }))} />
                <input className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" type="number" min={1} placeholder="Session count" value={packageForm.sessionCount} onChange={(event) => setPackageForm((current) => ({ ...current, sessionCount: Number(event.target.value) }))} />
                <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Package description" value={packageForm.description} onChange={(event) => setPackageForm((current) => ({ ...current, description: event.target.value }))} />
                <Button
                  type="button"
                  onClick={() => {
                    setProfile((current) =>
                      current
                        ? {
                            ...current,
                            classPackages: [
                              ...current.classPackages,
                              { ...packageForm, id: `package-${Date.now()}` },
                            ],
                          }
                        : current
                    );
                    setPackageForm({ id: "", name: "", description: "", priceLabel: "", sessionCount: 1 });
                  }}
                  disabled={!packageForm.name.trim()}
                >
                  Add Package
                </Button>
                <div className="space-y-2 border-t pt-3">
                  {profile.classPackages.map((item) => (
                    <div key={item.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-muted-foreground">{item.priceLabel} | {item.sessionCount} sessions</p>
                      <p className="mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Affiliate Links Hub</CardTitle>
                <CardDescription>Track partner links, gear referrals, and sponsor affiliate offers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <input className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Affiliate label" value={affiliateForm.label} onChange={(event) => setAffiliateForm((current) => ({ ...current, label: event.target.value }))} />
                <input className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Affiliate URL" value={affiliateForm.url} onChange={(event) => setAffiliateForm((current) => ({ ...current, url: event.target.value }))} />
                <input className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Commission label" value={affiliateForm.commissionLabel} onChange={(event) => setAffiliateForm((current) => ({ ...current, commissionLabel: event.target.value }))} />
                <Button
                  type="button"
                  onClick={() => {
                    setProfile((current) =>
                      current
                        ? {
                            ...current,
                            affiliateLinks: [
                              ...current.affiliateLinks,
                              { ...affiliateForm, id: `affiliate-${Date.now()}` },
                            ],
                          }
                        : current
                    );
                    setAffiliateForm({ id: "", label: "", url: "", commissionLabel: "" });
                  }}
                  disabled={!affiliateForm.label.trim() || !affiliateForm.url.trim()}
                >
                  Add Affiliate Link
                </Button>
                <div className="space-y-2 border-t pt-3">
                  {profile.affiliateLinks.map((item) => (
                    <div key={item.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-muted-foreground">{item.commissionLabel || "Commission tracked manually"}</p>
                      <p className="mt-1 break-all">{item.url}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paid Private Groups</CardTitle>
                <CardDescription>Create premium groups and subscription-only communities.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <input className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Group name" value={groupForm.name} onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))} />
                <input className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Price label" value={groupForm.priceLabel} onChange={(event) => setGroupForm((current) => ({ ...current, priceLabel: event.target.value }))} />
                <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Group description" value={groupForm.description} onChange={(event) => setGroupForm((current) => ({ ...current, description: event.target.value }))} />
                <Button
                  type="button"
                  onClick={() =>
                    void createPremiumGroup(groupForm).then(async () => {
                      setGroupForm({ name: "", description: "", priceLabel: "" });
                      setGroups(await getOwnedPremiumGroups());
                    })
                  }
                  disabled={!groupForm.name.trim()}
                >
                  Create Premium Group
                </Button>
                <div className="space-y-2 border-t pt-3">
                  {groups.map((group) => (
                    <div key={group.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-semibold">{group.name}</p>
                      <p className="text-muted-foreground">{group.priceLabel} | {group.memberIds.length} members</p>
                      <p className="mt-1">{group.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Full Commerce Operating System</CardTitle>
                <CardDescription>Extended commerce ops for checkout, pricing, fulfillment, trust, finance, retention, and storefront optimization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {earnings ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{profile.classPackages.length}</div><div className="text-sm text-muted-foreground">Bundles and packages</div></div>
                    <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{profile.affiliateLinks.length}</div><div className="text-sm text-muted-foreground">Affiliate and referral links</div></div>
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  {ADVANCED_COMMERCE_FIELDS.map(({ key, label }) => (
                    <div key={key} className="rounded-xl border p-4">
                      <p className="font-semibold">{label}</p>
                      <textarea
                        value={advancedCommerceMeta[key] ?? ""}
                        onChange={(event) => setAdvancedCommerceMeta((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder={`One ${label.toLowerCase()} item per line`}
                        className="mt-3 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      <div className="mt-3 space-y-2">
                        {(profile.advancedCommerceOps?.[key] ?? []).slice(0, 3).map((item) => (
                          <div key={`${key}-${item}`} className="rounded-lg bg-muted p-2 text-sm">{item}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setProfile((current) =>
                      current
                        ? {
                            ...current,
                            advancedCommerceOps: Object.fromEntries(
                              ADVANCED_COMMERCE_FIELDS.map(({ key }) => [
                                key,
                                (advancedCommerceMeta[key] ?? "")
                                  .split("\n")
                                  .map((value) => value.trim())
                                  .filter(Boolean),
                              ]),
                            ),
                          }
                        : current,
                    )
                  }
                >
                  Sync Commerce Ops Into Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function BusinessPage() {
  return (
    <AuthProvider>
      <BusinessPageContent />
    </AuthProvider>
  );
}
