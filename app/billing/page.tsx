"use client";

import { FormEvent, useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createBrandCampaign,
  createContractRecord,
  createDeliverableRecord,
  createDiscountCodeRecord,
  createInvoiceRecord,
  createMembershipTierRecord,
  createSponsorBadgeRequest,
  createTeamBundleRecord,
  getCurrentAmbassadorStats,
  getCurrentPayoutSnapshot,
  getCurrentUserContracts,
  getCurrentUserDeliverables,
  getCurrentUserDiscountCodes,
  getCurrentUserInvoices,
  getCurrentUserMembershipTiers,
  getCurrentUserSponsorBadgeRequests,
  getCurrentUserTeamBundles,
  getOrgBillingSettings,
  getOwnedBrandCampaigns,
  getOwnedCampaignApplications,
  reviewCampaignApplication,
  updateDeliverableStatus,
  updateInvoiceStatus,
  updateOrgBillingSettings,
  type AmbassadorStats,
  type BrandCampaignRecord,
  type CampaignApplicationRecord,
  type ContractRecord,
  type DeliverableRecord,
  type DiscountCodeRecord,
  type InvoiceRecord,
  type MembershipTierRecord,
  type OrgBillingSettings,
  type PayoutSnapshot,
  type SponsorBadgeRequestRecord,
  type TeamBundleRecord,
} from "@/lib/commerce";

function BillingPageContent() {
  const [payouts, setPayouts] = useState<PayoutSnapshot | null>(null);
  const [ambassador, setAmbassador] = useState<AmbassadorStats | null>(null);
  const [campaigns, setCampaigns] = useState<BrandCampaignRecord[]>([]);
  const [applications, setApplications] = useState<CampaignApplicationRecord[]>([]);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCodeRecord[]>([]);
  const [tiers, setTiers] = useState<MembershipTierRecord[]>([]);
  const [bundles, setBundles] = useState<TeamBundleRecord[]>([]);
  const [deliverables, setDeliverables] = useState<DeliverableRecord[]>([]);
  const [badgeRequests, setBadgeRequests] = useState<SponsorBadgeRequestRecord[]>([]);
  const [orgBilling, setOrgBilling] = useState<OrgBillingSettings | null>(null);
  const [campaignForm, setCampaignForm] = useState({ brandName: "", title: "", budgetLabel: "", summary: "", requirements: "" });
  const [contractForm, setContractForm] = useState({ title: "", counterpartyName: "", summary: "" });
  const [invoiceForm, setInvoiceForm] = useState({ customerName: "", amountLabel: "", description: "", dueDate: "" });
  const [discountForm, setDiscountForm] = useState({ code: "", percentOff: "10", maxUses: "25" });
  const [tierForm, setTierForm] = useState({ name: "", priceLabel: "", benefits: "", checkoutProvider: "stripe" as MembershipTierRecord["checkoutProvider"] });
  const [bundleForm, setBundleForm] = useState({ teamName: "", priceLabel: "", seats: "15", included: "" });
  const [badgeForm, setBadgeForm] = useState({ brandName: "", website: "" });
  const [deliverableForm, setDeliverableForm] = useState({ campaignId: "", title: "" });

  const refresh = async () => {
    const [
      nextPayouts,
      nextAmbassador,
      nextCampaigns,
      nextApplications,
      nextContracts,
      nextInvoices,
      nextDiscountCodes,
      nextTiers,
      nextBundles,
      nextDeliverables,
      nextBadgeRequests,
      nextOrgBilling,
    ] = await Promise.all([
      getCurrentPayoutSnapshot(),
      getCurrentAmbassadorStats(),
      getOwnedBrandCampaigns(),
      getOwnedCampaignApplications(),
      getCurrentUserContracts(),
      getCurrentUserInvoices(),
      getCurrentUserDiscountCodes(),
      getCurrentUserMembershipTiers(),
      getCurrentUserTeamBundles(),
      getCurrentUserDeliverables(),
      getCurrentUserSponsorBadgeRequests(),
      getOrgBillingSettings(),
    ]);

    setPayouts(nextPayouts);
    setAmbassador(nextAmbassador);
    setCampaigns(nextCampaigns);
    setApplications(nextApplications);
    setContracts(nextContracts);
    setInvoices(nextInvoices);
    setDiscountCodes(nextDiscountCodes);
    setTiers(nextTiers);
    setBundles(nextBundles);
    setDeliverables(nextDeliverables);
    setBadgeRequests(nextBadgeRequests);
    setOrgBilling(nextOrgBilling);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Billing and Monetization</h1>
          <p className="text-muted-foreground">
            Manage campaigns, contracts, invoices, discount codes, tiers, bundles, payouts, referrals, and org billing in one place.
          </p>
        </div>

        {payouts && ambassador ? (
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">${payouts.estimatedPayout}</div><div className="text-sm text-muted-foreground">Estimated payout</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{payouts.paidInvoices}</div><div className="text-sm text-muted-foreground">Paid invoices</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">${payouts.bookingRevenue}</div><div className="text-sm text-muted-foreground">Booking revenue</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{ambassador.referralCount}</div><div className="text-sm text-muted-foreground">Referral rewards</div></div>
            <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{ambassador.topInviteCode || "-"}</div><div className="text-sm text-muted-foreground">Top ambassador code</div></div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Brand Campaigns</CardTitle>
              <CardDescription>Create marketplace campaigns and review incoming applications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  await createBrandCampaign(campaignForm);
                  setCampaignForm({ brandName: "", title: "", budgetLabel: "", summary: "", requirements: "" });
                  await refresh();
                }}
              >
                <input value={campaignForm.brandName} onChange={(event) => setCampaignForm((current) => ({ ...current, brandName: event.target.value }))} placeholder="Brand name" className="h-11 rounded-md border border-input px-3 text-sm" />
                <input value={campaignForm.title} onChange={(event) => setCampaignForm((current) => ({ ...current, title: event.target.value }))} placeholder="Campaign title" className="h-11 rounded-md border border-input px-3 text-sm" />
                <input value={campaignForm.budgetLabel} onChange={(event) => setCampaignForm((current) => ({ ...current, budgetLabel: event.target.value }))} placeholder="Budget, e.g. $500/video" className="h-11 rounded-md border border-input px-3 text-sm" />
                <textarea value={campaignForm.summary} onChange={(event) => setCampaignForm((current) => ({ ...current, summary: event.target.value }))} placeholder="What the campaign is about" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm" />
                <textarea value={campaignForm.requirements} onChange={(event) => setCampaignForm((current) => ({ ...current, requirements: event.target.value }))} placeholder="Requirements, deliverables, and timing" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm" />
                <Button type="submit">Launch Campaign</Button>
              </form>
              <div className="space-y-3 border-t pt-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-xl border p-4">
                    <p className="font-semibold">{campaign.title}</p>
                    <p className="text-sm text-muted-foreground">{campaign.brandName} · {campaign.budgetLabel}</p>
                  </div>
                ))}
                {applications.map((application) => (
                  <div key={application.id} className="rounded-xl border p-4">
                    <p className="font-semibold">{application.applicantName}</p>
                    <p className="text-sm text-muted-foreground">{application.campaignTitle}</p>
                    <p className="mt-2 text-sm">{application.note}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => void reviewCampaignApplication(application.id, "approved").then(refresh)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => void reviewCampaignApplication(application.id, "declined").then(refresh)}>Decline</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contracts and Invoices</CardTitle>
              <CardDescription>Keep a simple campaign contract vault and billing queue inside HoopLink.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  await createContractRecord(contractForm);
                  setContractForm({ title: "", counterpartyName: "", summary: "" });
                  await refresh();
                }}
              >
                <input value={contractForm.title} onChange={(event) => setContractForm((current) => ({ ...current, title: event.target.value }))} placeholder="Contract title" className="h-11 rounded-md border border-input px-3 text-sm" />
                <input value={contractForm.counterpartyName} onChange={(event) => setContractForm((current) => ({ ...current, counterpartyName: event.target.value }))} placeholder="Counterparty" className="h-11 rounded-md border border-input px-3 text-sm" />
                <textarea value={contractForm.summary} onChange={(event) => setContractForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Terms, rights, deliverables, approvals" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm" />
                <Button type="submit">Save Contract Draft</Button>
              </form>

              <form
                className="grid gap-3 border-t pt-4"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  await createInvoiceRecord(invoiceForm);
                  setInvoiceForm({ customerName: "", amountLabel: "", description: "", dueDate: "" });
                  await refresh();
                }}
              >
                <input value={invoiceForm.customerName} onChange={(event) => setInvoiceForm((current) => ({ ...current, customerName: event.target.value }))} placeholder="Customer / brand" className="h-11 rounded-md border border-input px-3 text-sm" />
                <input value={invoiceForm.amountLabel} onChange={(event) => setInvoiceForm((current) => ({ ...current, amountLabel: event.target.value }))} placeholder="$250" className="h-11 rounded-md border border-input px-3 text-sm" />
                <input value={invoiceForm.dueDate} onChange={(event) => setInvoiceForm((current) => ({ ...current, dueDate: event.target.value }))} type="date" className="h-11 rounded-md border border-input px-3 text-sm" />
                <textarea value={invoiceForm.description} onChange={(event) => setInvoiceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Deliverable description" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm" />
                <Button type="submit">Create Invoice</Button>
              </form>

              <div className="space-y-3 border-t pt-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-semibold">{contract.title}</p>
                    <p className="text-muted-foreground">{contract.counterpartyName} · {contract.status}</p>
                  </div>
                ))}
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-xl border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{invoice.customerName}</p>
                        <p className="text-muted-foreground">{invoice.amountLabel} · due {invoice.dueDate || "n/a"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => void updateInvoiceStatus(invoice.id, "sent").then(refresh)}>Send</Button>
                        <Button size="sm" onClick={() => void updateInvoiceStatus(invoice.id, "paid").then(refresh)}>Paid</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Discounts and Tiers</CardTitle>
              <CardDescription>Configure discount codes, checkout rails, and membership pricing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  await createDiscountCodeRecord({
                    code: discountForm.code,
                    percentOff: Number(discountForm.percentOff),
                    maxUses: Number(discountForm.maxUses),
                  });
                  setDiscountForm({ code: "", percentOff: "10", maxUses: "25" });
                  await refresh();
                }}
              >
                <input value={discountForm.code} onChange={(event) => setDiscountForm((current) => ({ ...current, code: event.target.value }))} placeholder="Code" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={discountForm.percentOff} onChange={(event) => setDiscountForm((current) => ({ ...current, percentOff: event.target.value }))} type="number" className="h-10 rounded-md border border-input px-3 text-sm" placeholder="% off" />
                <input value={discountForm.maxUses} onChange={(event) => setDiscountForm((current) => ({ ...current, maxUses: event.target.value }))} type="number" className="h-10 rounded-md border border-input px-3 text-sm" placeholder="Max uses" />
                <Button type="submit">Add Discount Code</Button>
              </form>

              <form
                className="grid gap-3 border-t pt-4"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  await createMembershipTierRecord({
                    name: tierForm.name,
                    priceLabel: tierForm.priceLabel,
                    benefits: tierForm.benefits.split(",").map((value) => value.trim()).filter(Boolean),
                    checkoutProvider: tierForm.checkoutProvider,
                  });
                  setTierForm({ name: "", priceLabel: "", benefits: "", checkoutProvider: "stripe" });
                  await refresh();
                }}
              >
                <input value={tierForm.name} onChange={(event) => setTierForm((current) => ({ ...current, name: event.target.value }))} placeholder="Tier name" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={tierForm.priceLabel} onChange={(event) => setTierForm((current) => ({ ...current, priceLabel: event.target.value }))} placeholder="$9/mo" className="h-10 rounded-md border border-input px-3 text-sm" />
                <select value={tierForm.checkoutProvider} onChange={(event) => setTierForm((current) => ({ ...current, checkoutProvider: event.target.value as MembershipTierRecord["checkoutProvider"] }))} className="h-10 rounded-md border border-input px-3 text-sm">
                  <option value="stripe">Stripe</option>
                  <option value="apple_pay">Apple Pay</option>
                  <option value="google_pay">Google Pay</option>
                  <option value="manual">Manual</option>
                </select>
                <input value={tierForm.benefits} onChange={(event) => setTierForm((current) => ({ ...current, benefits: event.target.value }))} placeholder="Benefits, comma separated" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit">Create Tier</Button>
              </form>

              <div className="space-y-2 border-t pt-4 text-sm">
                {discountCodes.map((code) => (
                  <div key={code.id} className="rounded-xl border p-3">{code.code} · {code.percentOff}% off · {code.uses}/{code.maxUses}</div>
                ))}
                {tiers.map((tier) => (
                  <div key={tier.id} className="rounded-xl border p-3">{tier.name} · {tier.priceLabel} · {tier.checkoutProvider}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bundles and Billing Controls</CardTitle>
              <CardDescription>Handle team subscription bundles and org payment settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  await createTeamBundleRecord({
                    teamName: bundleForm.teamName,
                    priceLabel: bundleForm.priceLabel,
                    seats: Number(bundleForm.seats),
                    included: bundleForm.included.split(",").map((value) => value.trim()).filter(Boolean),
                  });
                  setBundleForm({ teamName: "", priceLabel: "", seats: "15", included: "" });
                  await refresh();
                }}
              >
                <input value={bundleForm.teamName} onChange={(event) => setBundleForm((current) => ({ ...current, teamName: event.target.value }))} placeholder="Bundle / org name" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={bundleForm.priceLabel} onChange={(event) => setBundleForm((current) => ({ ...current, priceLabel: event.target.value }))} placeholder="$199/team" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={bundleForm.seats} onChange={(event) => setBundleForm((current) => ({ ...current, seats: event.target.value }))} type="number" className="h-10 rounded-md border border-input px-3 text-sm" placeholder="Seats" />
                <input value={bundleForm.included} onChange={(event) => setBundleForm((current) => ({ ...current, included: event.target.value }))} placeholder="Included features, comma separated" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit">Create Team Bundle</Button>
              </form>

              {orgBilling ? (
                <form
                  className="grid gap-3 border-t pt-4"
                  onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    await updateOrgBillingSettings(orgBilling);
                    await refresh();
                  }}
                >
                  <input value={orgBilling.billingContact} onChange={(event) => setOrgBilling((current) => current ? { ...current, billingContact: event.target.value } : current)} placeholder="Billing contact email" className="h-10 rounded-md border border-input px-3 text-sm" />
                  <select value={orgBilling.checkoutProvider} onChange={(event) => setOrgBilling((current) => current ? { ...current, checkoutProvider: event.target.value as OrgBillingSettings["checkoutProvider"] } : current)} className="h-10 rounded-md border border-input px-3 text-sm">
                    <option value="stripe">Stripe</option>
                    <option value="apple_pay">Apple Pay</option>
                    <option value="google_pay">Google Pay</option>
                    <option value="manual">Manual</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={orgBilling.payoutsEnabled} onChange={(event) => setOrgBilling((current) => current ? { ...current, payoutsEnabled: event.target.checked } : current)} />Payouts enabled</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={orgBilling.giftSubscriptionsEnabled} onChange={(event) => setOrgBilling((current) => current ? { ...current, giftSubscriptionsEnabled: event.target.checked } : current)} />Gift subscriptions enabled</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={orgBilling.teamBundlesEnabled} onChange={(event) => setOrgBilling((current) => current ? { ...current, teamBundlesEnabled: event.target.checked } : current)} />Team bundles enabled</label>
                  <Button type="submit">Save Org Billing Settings</Button>
                </form>
              ) : null}

              <div className="space-y-2 border-t pt-4 text-sm">
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="rounded-xl border p-3">{bundle.teamName} · {bundle.priceLabel} · {bundle.seats} seats</div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges and Deliverables</CardTitle>
              <CardDescription>Sponsor badge requests and content approval queue for campaign work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  await createSponsorBadgeRequest(badgeForm);
                  setBadgeForm({ brandName: "", website: "" });
                  await refresh();
                }}
              >
                <input value={badgeForm.brandName} onChange={(event) => setBadgeForm((current) => ({ ...current, brandName: event.target.value }))} placeholder="Brand name" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={badgeForm.website} onChange={(event) => setBadgeForm((current) => ({ ...current, website: event.target.value }))} placeholder="Website" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit">Request Sponsor Badge</Button>
              </form>

              <form
                className="grid gap-3 border-t pt-4"
                onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  await createDeliverableRecord(deliverableForm);
                  setDeliverableForm({ campaignId: "", title: "" });
                  await refresh();
                }}
              >
                <select value={deliverableForm.campaignId} onChange={(event) => setDeliverableForm((current) => ({ ...current, campaignId: event.target.value }))} className="h-10 rounded-md border border-input px-3 text-sm">
                  <option value="">Choose campaign</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                  ))}
                </select>
                <input value={deliverableForm.title} onChange={(event) => setDeliverableForm((current) => ({ ...current, title: event.target.value }))} placeholder="Deliverable title" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit">Add Deliverable</Button>
              </form>

              <div className="space-y-2 border-t pt-4 text-sm">
                {badgeRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border p-3">{request.brandName} · {request.website} · {request.status}</div>
                ))}
                {deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span>{deliverable.title}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => void updateDeliverableStatus(deliverable.id, "submitted").then(refresh)}>Submit</Button>
                        <Button size="sm" onClick={() => void updateDeliverableStatus(deliverable.id, "approved").then(refresh)}>Approve</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function BillingPage() {
  return (
    <AuthProvider>
      <BillingPageContent />
    </AuthProvider>
  );
}
