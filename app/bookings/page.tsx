"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createBookingRequest,
  getCurrentUserBusinessProfile,
  getDiscoverableProviders,
  getIncomingBookingWaitlist,
  joinBookingWaitlist,
  rescheduleBookingRequest,
  subscribeToIncomingBookings,
  subscribeToOutgoingBookings,
  updateBookingStatus,
  type BookingRequestRecord,
  type BookingServiceType,
  type BookingWaitlistEntryRecord,
  type DiscoverableProviderRecord,
} from "@/lib/business";
import { getUserProfileById } from "@/lib/user-profile";

const bookingTypes: BookingServiceType[] = ["training", "consultation", "facility", "camp", "tryout"];

function BookingsPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const [incoming, setIncoming] = useState<BookingRequestRecord[]>([]);
  const [outgoing, setOutgoing] = useState<BookingRequestRecord[]>([]);
  const [waitlist, setWaitlist] = useState<BookingWaitlistEntryRecord[]>([]);
  const [providers, setProviders] = useState<DiscoverableProviderRecord[]>([]);
  const [hostName, setHostName] = useState("");
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [myProfilePackages, setMyProfilePackages] = useState<string[]>([]);
  const [rescheduleMap, setRescheduleMap] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    hostId: "",
    type: "training" as BookingServiceType,
    scheduledFor: "",
    note: "",
    packageName: "",
    promoCode: "",
  });

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.uid === form.hostId) ?? null,
    [providers, form.hostId]
  );

  useEffect(() => {
    void getDiscoverableProviders("", "").then(setProviders);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const hostId = searchParams.get("host") ?? "";
    const type = searchParams.get("type");
    if (hostId) {
      setForm((current) => ({
        ...current,
        hostId,
        type: bookingTypes.includes(type as BookingServiceType) ? (type as BookingServiceType) : "training",
      }));
      void getUserProfileById(hostId).then((profile) =>
        setHostName(String((profile as { displayName?: string } | null)?.displayName ?? "Provider"))
      );
    }

    const unsubscribeIncoming = subscribeToIncomingBookings(user.uid, setIncoming);
    const unsubscribeOutgoing = subscribeToOutgoingBookings(user.uid, setOutgoing);
    void getIncomingBookingWaitlist(user.uid).then(setWaitlist);
    void getCurrentUserBusinessProfile().then((profile) => setMyProfilePackages(profile.classPackages.map((entry) => entry.name)));

    return () => {
      unsubscribeIncoming();
      unsubscribeOutgoing();
    };
  }, [searchParams, user]);

  useEffect(() => {
    void getDiscoverableProviders(search, locationFilter).then(setProviders);
  }, [search, locationFilter]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createBookingRequest(form);
    setForm((current) => ({ ...current, note: "", scheduledFor: "", packageName: "", promoCode: "" }));
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">
            Request coach sessions, trainer work, facility time, camps, and tryouts with deposits, waitlists, and reschedules.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Local Provider Discovery</CardTitle>
              <CardDescription>Find coaches, trainers, facilities, camps, and tryouts near you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input className="h-11 rounded-md border border-input bg-background px-3 text-sm" placeholder="Search provider, sport, or tag" value={search} onChange={(event) => setSearch(event.target.value)} />
                <input className="h-11 rounded-md border border-input bg-background px-3 text-sm" placeholder="Location filter" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} />
              </div>
              <div className="space-y-3">
                {providers.length === 0 ? (
                  <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No matching providers yet.</div>
                ) : (
                  providers.map((provider) => (
                    <button
                      key={provider.uid}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, hostId: provider.uid, type: provider.offers[0]?.type ?? current.type }))}
                      className={`w-full rounded-xl border p-4 text-left ${form.hostId === provider.uid ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{provider.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {[provider.roleLabel, provider.sport, provider.location].filter(Boolean).join(" | ")}
                          </p>
                        </div>
                        {provider.trustedProvider ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Trusted</span> : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {provider.providerRoles.map((role) => (
                          <span key={role} className="rounded-full bg-muted px-3 py-1 text-xs">{role}</span>
                        ))}
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        {provider.offers.map((offer) => (
                          <div key={`${provider.uid}-${offer.type}`} className="rounded-lg bg-muted/60 px-3 py-2">
                            {offer.title} | {offer.priceLabel || "Price on request"} {offer.depositLabel ? `| ${offer.depositLabel}` : ""}
                          </div>
                        ))}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Booking</CardTitle>
              <CardDescription>Send booking requests with package selection, promo codes, reminder support, and fallback waitlists.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
                <input
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Host UID"
                  value={form.hostId}
                  onChange={(event) => setForm((current) => ({ ...current, hostId: event.target.value }))}
                  required
                />
                <select
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as BookingServiceType }))}
                >
                  {bookingTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={(event) => setForm((current) => ({ ...current, scheduledFor: event.target.value }))}
                  required
                />
                <input
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Package name"
                  value={form.packageName}
                  onChange={(event) => setForm((current) => ({ ...current, packageName: event.target.value }))}
                />
                <input
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Promo code"
                  value={form.promoCode}
                  onChange={(event) => setForm((current) => ({ ...current, promoCode: event.target.value.toUpperCase() }))}
                />
                <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                  {selectedProvider
                    ? `${selectedProvider.displayName} | ${selectedProvider.location || "Remote or listed on profile"}`
                    : hostName
                      ? `Booking with ${hostName}`
                      : "Choose a provider from discovery to prefill this form."}
                </div>
                <textarea
                  className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2"
                  placeholder="Share your goals, age group, team context, or questions"
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                />
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground md:col-span-2">
                  {selectedProvider?.offers.find((offer) => offer.type === form.type)?.depositLabel
                    ? `Deposit due: ${selectedProvider.offers.find((offer) => offer.type === form.type)?.depositLabel}`
                    : "Deposits, reminder timing, and waitlist support depend on the provider setup."}
                </div>
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <Button type="submit" disabled={!form.hostId}>Send Booking Request</Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!form.hostId || !form.scheduledFor}
                    onClick={() => void joinBookingWaitlist({
                      hostId: form.hostId,
                      type: form.type,
                      requestedFor: form.scheduledFor,
                      note: form.note,
                    })}
                  >
                    Join Waitlist Instead
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Bookings</CardTitle>
              <CardDescription>Requests other members have sent to you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {incoming.length === 0 ? (
                <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No incoming bookings yet.</div>
              ) : (
                incoming.map((booking) => (
                  <div key={booking.id} className="rounded-xl border p-4">
                    <p className="font-semibold">{booking.requesterName}</p>
                    <p className="text-sm text-muted-foreground">
                      {[booking.type, booking.priceLabel || "Price on profile", booking.scheduledFor].filter(Boolean).join(" | ")}
                    </p>
                    <p className="mt-2 text-sm">{booking.note || "No extra note."}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[booking.packageName && `Package: ${booking.packageName}`, booking.promoCode && `Promo: ${booking.promoCode}`, booking.depositLabel && `Deposit: ${booking.depositLabel}`, booking.reminderScheduled ? "Reminder scheduled" : ""].filter(Boolean).join(" | ")}
                    </p>
                    {booking.status === "reschedule_requested" && booking.rescheduleRequestedFor ? (
                      <p className="mt-2 text-xs text-primary">Requested new time: {booking.rescheduleRequestedFor}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void updateBookingStatus(booking.id, "accepted")}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => void updateBookingStatus(booking.id, "waitlisted")}>Waitlist</Button>
                      <Button size="sm" variant="outline" onClick={() => void updateBookingStatus(booking.id, "declined")}>Decline</Button>
                      <Button size="sm" variant="outline" onClick={() => void updateBookingStatus(booking.id, "completed")}>Complete</Button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                        type="datetime-local"
                        value={rescheduleMap[booking.id] ?? ""}
                        onChange={(event) => setRescheduleMap((current) => ({ ...current, [booking.id]: event.target.value }))}
                      />
                      <Button size="sm" variant="outline" onClick={() => void rescheduleBookingRequest(booking.id, rescheduleMap[booking.id] ?? "")}>
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outgoing Bookings</CardTitle>
              <CardDescription>Track your requests, reminders, and reschedules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {outgoing.length === 0 ? (
                <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No outgoing bookings yet.</div>
              ) : (
                outgoing.map((booking) => (
                  <div key={booking.id} className="rounded-xl border p-4">
                    <p className="font-semibold">{booking.hostName}</p>
                    <p className="text-sm text-muted-foreground">
                      {[booking.type, booking.priceLabel || "Price on profile", booking.scheduledFor].filter(Boolean).join(" | ")}
                    </p>
                    <p className="mt-2 text-sm">Status: {booking.status}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[booking.packageName && `Package: ${booking.packageName}`, booking.promoCode && `Promo: ${booking.promoCode}`, booking.depositLabel && `Deposit: ${booking.depositLabel}`, booking.reminderScheduled ? "Reminder active" : ""].filter(Boolean).join(" | ")}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <input
                        className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                        type="datetime-local"
                        value={rescheduleMap[booking.id] ?? ""}
                        onChange={(event) => setRescheduleMap((current) => ({ ...current, [booking.id]: event.target.value }))}
                      />
                      <Button size="sm" variant="outline" onClick={() => void rescheduleBookingRequest(booking.id, rescheduleMap[booking.id] ?? "")}>
                        Request Reschedule
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waitlist And Reminders</CardTitle>
              <CardDescription>See overflow demand and quick package shortcuts for your own booking business.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                Your business profile package names: {myProfilePackages.length ? myProfilePackages.join(", ") : "No class packages yet."}
              </div>
              {waitlist.length === 0 ? (
                <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No waitlist entries yet.</div>
              ) : (
                waitlist.map((entry) => (
                  <div key={entry.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold">{entry.requesterName}</p>
                    <p className="text-muted-foreground">{[entry.type, entry.requestedFor, entry.status].filter(Boolean).join(" | ")}</p>
                    <p className="mt-2">{entry.note || "No note."}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function BookingsPage() {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <BookingsPageContent />
      </Suspense>
    </AuthProvider>
  );
}
