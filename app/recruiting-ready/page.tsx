"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addRecruitingCollectionItem,
  addReferenceLetter,
  generateRecruitingFitSummary,
  getCurrentRecruitingReadiness,
  getRecruitingInterestHeatmap,
  getSchoolFitScores,
  saveCurrentRecruitingReadiness,
  updateFollowUpStatus,
  updateRecruitingChecklist,
  uploadTranscript,
  type RecruitingReadinessProfile,
} from "@/lib/recruiting-readiness";
import { getCurrentUserProfile } from "@/lib/user-profile";

function RecruitingReadyPageContent() {
  const [profile, setProfile] = useState<RecruitingReadinessProfile | null>(null);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceMeta, setReferenceMeta] = useState({ title: "", authorName: "" });
  const [deadlineForm, setDeadlineForm] = useState({ title: "", dueDate: "", category: "" });
  const [interestForm, setInterestForm] = useState({ schoolName: "", level: "medium" as "low" | "medium" | "high", notes: "" });
  const [visitForm, setVisitForm] = useState({ schoolName: "", date: "", notes: "" });
  const [recommendationForm, setRecommendationForm] = useState({ coachName: "", coachEmail: "", status: "draft" as "draft" | "sent" | "received", note: "" });
  const [scholarshipForm, setScholarshipForm] = useState({ schoolName: "", amountLabel: "", status: "target" as "target" | "offered" | "accepted" });
  const [offerForm, setOfferForm] = useState({ schoolName: "", level: "", packageLabel: "", status: "interested" as "interested" | "offered" | "committed" });
  const [contactForm, setContactForm] = useState({ schoolName: "", contactName: "", channel: "", date: "", summary: "" });
  const [templateForm, setTemplateForm] = useState({ name: "", subject: "", body: "" });
  const [followUpForm, setFollowUpForm] = useState({ schoolName: "", dueDate: "", note: "" });
  const [fitSchool, setFitSchool] = useState("");
  const [fitSummary, setFitSummary] = useState("");

  const refresh = async () => {
    const [nextProfile, nextUserProfile] = await Promise.all([
      getCurrentRecruitingReadiness(),
      getCurrentUserProfile(),
    ]);
    setProfile(nextProfile);
    setUserProfile((nextUserProfile as Record<string, unknown> | null) ?? null);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const heatmap = useMemo(
    () => (profile ? getRecruitingInterestHeatmap(profile) : []),
    [profile]
  );
  const fitScores = useMemo(
    () => (profile ? getSchoolFitScores(profile, (userProfile?.athleteProfile as Record<string, unknown> | undefined) ?? null) : []),
    [profile, userProfile]
  );

  if (!profile) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  const athleteProfile = (userProfile?.athleteProfile as Record<string, unknown> | undefined) ?? {};
  const role = (userProfile?.role as Record<string, unknown> | undefined) ?? {};

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Recruiting Readiness</h1>
          <p className="text-muted-foreground">
            Track academics, deadlines, offers, outreach, references, and compliance from one recruiting command center.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{profile.interests.length}</div><div className="text-sm text-muted-foreground">Schools tracked</div></div>
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{profile.offers.length}</div><div className="text-sm text-muted-foreground">Offers logged</div></div>
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{profile.followUps.filter((item) => !item.done).length}</div><div className="text-sm text-muted-foreground">Open follow-ups</div></div>
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{profile.academic.gpa || "-"}</div><div className="text-sm text-muted-foreground">GPA</div></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Academic and Eligibility</CardTitle>
              <CardDescription>GPA, transcript, graduation year, eligibility status, and recruiting summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input value={profile.academic.gpa} onChange={(event) => setProfile((current) => current ? { ...current, academic: { ...current.academic, gpa: event.target.value } } : current)} placeholder="GPA" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={profile.academic.graduationYear} onChange={(event) => setProfile((current) => current ? { ...current, academic: { ...current.academic, graduationYear: event.target.value } } : current)} placeholder="Graduation year" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={profile.academic.eligibilityStatus} onChange={(event) => setProfile((current) => current ? { ...current, academic: { ...current.academic, eligibilityStatus: event.target.value } } : current)} placeholder="Eligibility status" className="h-10 rounded-md border border-input px-3 text-sm md:col-span-2" />
                <textarea value={profile.academic.academicSummary} onChange={(event) => setProfile((current) => current ? { ...current, academic: { ...current.academic, academicSummary: event.target.value } } : current)} placeholder="Academic summary, coursework, intended major, class rank context..." className="min-h-24 rounded-md border border-input px-3 py-2 text-sm md:col-span-2" />
              </div>
              <div className="flex flex-wrap gap-3">
                <input type="file" onChange={(event) => setTranscriptFile(event.target.files?.[0] ?? null)} className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="button" onClick={() => transcriptFile ? void uploadTranscript(transcriptFile, transcriptFile.name).then(refresh) : undefined}>Upload Transcript</Button>
                <Button type="button" variant="outline" onClick={() => void saveCurrentRecruitingReadiness(profile)}>Save Academic Profile</Button>
              </div>
              {profile.academic.transcriptUrl ? (
                <a href={profile.academic.transcriptUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                  {profile.academic.transcriptName || "View transcript"}
                </a>
              ) : null}
              <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
                {([
                  ["ncaaChecklist", "NCAA Checklist"],
                  ["naiaChecklist", "NAIA Checklist"],
                  ["internationalDocs", "International Docs"],
                  ["visaChecklist", "Visa Checklist"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="rounded-xl border p-4">
                    <p className="mb-3 font-semibold">{label}</p>
                    <div className="space-y-2">
                      {profile.compliance[key].map((item, index) => (
                        <label key={`${key}-${item.label}-${index}`} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={item.done} onChange={(event) => void updateRecruitingChecklist(key, index, event.target.checked).then(refresh)} />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resume and Media Kit</CardTitle>
              <CardDescription>Generate scout-facing links from the data you keep up to date here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border p-4 text-sm">
                <p className="font-semibold">Public Resume</p>
                <p className="mt-1 text-muted-foreground">A clean resume-style profile with academics, stats, offers, and references.</p>
                <Button className="mt-3" variant="outline" asChild>
                  <Link href={`/resume/${String(userProfile?.uid ?? "")}`}>Open Resume</Link>
                </Button>
              </div>
              <div className="rounded-xl border p-4 text-sm">
                <p className="font-semibold">Media Kit</p>
                <p className="mt-1 text-muted-foreground">A one-click sharing page for your headline, stat card, achievements, and recruiting snapshot.</p>
                <Button className="mt-3" variant="outline" asChild>
                  <Link href={`/media-kit/${String(userProfile?.uid ?? "")}`}>Open Media Kit</Link>
                </Button>
              </div>
              <div className="rounded-xl border p-4 text-sm">
                <p className="font-semibold">Fit Summary</p>
                <div className="mt-3 flex gap-2">
                  <input value={fitSchool} onChange={(event) => setFitSchool(event.target.value)} placeholder="School name" className="h-10 flex-1 rounded-md border border-input px-3 text-sm" />
                  <Button
                    type="button"
                    onClick={async () => {
                      const summary = await generateRecruitingFitSummary({
                        schoolName: fitSchool,
                        athleteBio: String(role.bio ?? ""),
                        sport: String(role.sport ?? ""),
                        position: String(role.position ?? ""),
                        achievements: Array.isArray(athleteProfile.achievements) ? (athleteProfile.achievements as string[]) : [],
                      });
                      setFitSummary(summary);
                    }}
                  >
                    Generate
                  </Button>
                </div>
                {fitSummary ? <p className="mt-3 text-muted-foreground">{fitSummary}</p> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Deadlines, Interests, and Visits</CardTitle>
              <CardDescription>Keep your school list, visit plan, and deadline calendar moving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3 md:grid-cols-3" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                await addRecruitingCollectionItem("deadlines", { id: crypto.randomUUID(), ...deadlineForm });
                setDeadlineForm({ title: "", dueDate: "", category: "" });
                await refresh();
              }}>
                <input value={deadlineForm.title} onChange={(event) => setDeadlineForm((current) => ({ ...current, title: event.target.value }))} placeholder="Deadline title" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={deadlineForm.dueDate} onChange={(event) => setDeadlineForm((current) => ({ ...current, dueDate: event.target.value }))} type="date" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={deadlineForm.category} onChange={(event) => setDeadlineForm((current) => ({ ...current, category: event.target.value }))} placeholder="Visit / app / transcript" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-3">Add Deadline</Button>
              </form>

              <form className="grid gap-3 border-t pt-4 md:grid-cols-3" onSubmit={async (event) => {
                event.preventDefault();
                await addRecruitingCollectionItem("interests", { id: crypto.randomUUID(), ...interestForm });
                setInterestForm({ schoolName: "", level: "medium", notes: "" });
                await refresh();
              }}>
                <input value={interestForm.schoolName} onChange={(event) => setInterestForm((current) => ({ ...current, schoolName: event.target.value }))} placeholder="School name" className="h-10 rounded-md border border-input px-3 text-sm" />
                <select value={interestForm.level} onChange={(event) => setInterestForm((current) => ({ ...current, level: event.target.value as "low" | "medium" | "high" }))} className="h-10 rounded-md border border-input px-3 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input value={interestForm.notes} onChange={(event) => setInterestForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Fit notes" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-3">Track School Interest</Button>
              </form>

              <form className="grid gap-3 border-t pt-4 md:grid-cols-3" onSubmit={async (event) => {
                event.preventDefault();
                await addRecruitingCollectionItem("campusVisits", { id: crypto.randomUUID(), ...visitForm });
                setVisitForm({ schoolName: "", date: "", notes: "" });
                await refresh();
              }}>
                <input value={visitForm.schoolName} onChange={(event) => setVisitForm((current) => ({ ...current, schoolName: event.target.value }))} placeholder="School name" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={visitForm.date} onChange={(event) => setVisitForm((current) => ({ ...current, date: event.target.value }))} type="date" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={visitForm.notes} onChange={(event) => setVisitForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Coach, tour, event notes" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-3">Plan Campus Visit</Button>
              </form>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                {profile.deadlines.map((item) => (
                  <div key={item.id} className="rounded-xl border p-3 text-sm">{item.title} · {item.dueDate} · {item.category}</div>
                ))}
                {profile.campusVisits.map((item) => (
                  <div key={item.id} className="rounded-xl border p-3 text-sm">{item.schoolName} · {item.date} · {item.notes}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offers, Scholarships, Contacts, and Outreach</CardTitle>
              <CardDescription>Track the communication and decision side of recruiting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
                event.preventDefault();
                await addRecruitingCollectionItem("scholarships", { id: crypto.randomUUID(), ...scholarshipForm });
                setScholarshipForm({ schoolName: "", amountLabel: "", status: "target" });
                await refresh();
              }}>
                <input value={scholarshipForm.schoolName} onChange={(event) => setScholarshipForm((current) => ({ ...current, schoolName: event.target.value }))} placeholder="School" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={scholarshipForm.amountLabel} onChange={(event) => setScholarshipForm((current) => ({ ...current, amountLabel: event.target.value }))} placeholder="$20k / full ride" className="h-10 rounded-md border border-input px-3 text-sm" />
                <select value={scholarshipForm.status} onChange={(event) => setScholarshipForm((current) => ({ ...current, status: event.target.value as "target" | "offered" | "accepted" }))} className="h-10 rounded-md border border-input px-3 text-sm">
                  <option value="target">Target</option>
                  <option value="offered">Offered</option>
                  <option value="accepted">Accepted</option>
                </select>
                <Button type="submit" className="md:col-span-3">Add Scholarship</Button>
              </form>

              <form className="grid gap-3 border-t pt-4 md:grid-cols-4" onSubmit={async (event) => {
                event.preventDefault();
                await addRecruitingCollectionItem("offers", { id: crypto.randomUUID(), ...offerForm });
                setOfferForm({ schoolName: "", level: "", packageLabel: "", status: "interested" });
                await refresh();
              }}>
                <input value={offerForm.schoolName} onChange={(event) => setOfferForm((current) => ({ ...current, schoolName: event.target.value }))} placeholder="School" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={offerForm.level} onChange={(event) => setOfferForm((current) => ({ ...current, level: event.target.value }))} placeholder="D1 / D2 / JUCO / NAIA" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={offerForm.packageLabel} onChange={(event) => setOfferForm((current) => ({ ...current, packageLabel: event.target.value }))} placeholder="Offer package" className="h-10 rounded-md border border-input px-3 text-sm" />
                <select value={offerForm.status} onChange={(event) => setOfferForm((current) => ({ ...current, status: event.target.value as "interested" | "offered" | "committed" }))} className="h-10 rounded-md border border-input px-3 text-sm">
                  <option value="interested">Interested</option>
                  <option value="offered">Offered</option>
                  <option value="committed">Committed</option>
                </select>
                <Button type="submit" className="md:col-span-4">Log Offer</Button>
              </form>

              <form className="grid gap-3 border-t pt-4 md:grid-cols-5" onSubmit={async (event) => {
                event.preventDefault();
                await addRecruitingCollectionItem("contacts", { id: crypto.randomUUID(), ...contactForm });
                setContactForm({ schoolName: "", contactName: "", channel: "", date: "", summary: "" });
                await refresh();
              }}>
                <input value={contactForm.schoolName} onChange={(event) => setContactForm((current) => ({ ...current, schoolName: event.target.value }))} placeholder="School" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={contactForm.contactName} onChange={(event) => setContactForm((current) => ({ ...current, contactName: event.target.value }))} placeholder="Coach / recruiter" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={contactForm.channel} onChange={(event) => setContactForm((current) => ({ ...current, channel: event.target.value }))} placeholder="Email / DM / call" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={contactForm.date} onChange={(event) => setContactForm((current) => ({ ...current, date: event.target.value }))} type="date" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={contactForm.summary} onChange={(event) => setContactForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Summary" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-5">Add Contact Log</Button>
              </form>

              <form className="grid gap-3 border-t pt-4 md:grid-cols-3" onSubmit={async (event) => {
                event.preventDefault();
                await addRecruitingCollectionItem("outreachTemplates", { id: crypto.randomUUID(), ...templateForm });
                setTemplateForm({ name: "", subject: "", body: "" });
                await refresh();
              }}>
                <input value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} placeholder="Template name" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={templateForm.subject} onChange={(event) => setTemplateForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Email subject" className="h-10 rounded-md border border-input px-3 text-sm" />
                <textarea value={templateForm.body} onChange={(event) => setTemplateForm((current) => ({ ...current, body: event.target.value }))} placeholder="Outreach message body" className="min-h-20 rounded-md border border-input px-3 py-2 text-sm md:col-span-3" />
                <Button type="submit" className="md:col-span-3">Save Outreach Template</Button>
              </form>

              <form className="grid gap-3 border-t pt-4 md:grid-cols-3" onSubmit={async (event) => {
                event.preventDefault();
                await addRecruitingCollectionItem("followUps", { id: crypto.randomUUID(), ...followUpForm, done: false });
                setFollowUpForm({ schoolName: "", dueDate: "", note: "" });
                await refresh();
              }}>
                <input value={followUpForm.schoolName} onChange={(event) => setFollowUpForm((current) => ({ ...current, schoolName: event.target.value }))} placeholder="School" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={followUpForm.dueDate} onChange={(event) => setFollowUpForm((current) => ({ ...current, dueDate: event.target.value }))} type="date" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={followUpForm.note} onChange={(event) => setFollowUpForm((current) => ({ ...current, note: event.target.value }))} placeholder="Follow-up note" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-3">Add Follow-up Reminder</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations and Reference Vault</CardTitle>
              <CardDescription>Request letters, store references, and keep your supporting documents ready.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3 md:grid-cols-4" onSubmit={async (event) => {
                event.preventDefault();
                await addRecruitingCollectionItem("recommendationRequests", { id: crypto.randomUUID(), ...recommendationForm });
                setRecommendationForm({ coachName: "", coachEmail: "", status: "draft", note: "" });
                await refresh();
              }}>
                <input value={recommendationForm.coachName} onChange={(event) => setRecommendationForm((current) => ({ ...current, coachName: event.target.value }))} placeholder="Coach / teacher" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={recommendationForm.coachEmail} onChange={(event) => setRecommendationForm((current) => ({ ...current, coachEmail: event.target.value }))} placeholder="Email" className="h-10 rounded-md border border-input px-3 text-sm" />
                <select value={recommendationForm.status} onChange={(event) => setRecommendationForm((current) => ({ ...current, status: event.target.value as "draft" | "sent" | "received" }))} className="h-10 rounded-md border border-input px-3 text-sm">
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                </select>
                <input value={recommendationForm.note} onChange={(event) => setRecommendationForm((current) => ({ ...current, note: event.target.value }))} placeholder="Context for letter" className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="submit" className="md:col-span-4">Save Recommendation Request</Button>
              </form>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-[1fr,1fr,1fr,auto]">
                <input value={referenceMeta.title} onChange={(event) => setReferenceMeta((current) => ({ ...current, title: event.target.value }))} placeholder="Reference title" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input value={referenceMeta.authorName} onChange={(event) => setReferenceMeta((current) => ({ ...current, authorName: event.target.value }))} placeholder="Author" className="h-10 rounded-md border border-input px-3 text-sm" />
                <input type="file" onChange={(event) => setReferenceFile(event.target.files?.[0] ?? null)} className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button type="button" onClick={() => referenceFile ? void addReferenceLetter(referenceFile, referenceMeta.title, referenceMeta.authorName).then(async () => { setReferenceMeta({ title: "", authorName: "" }); setReferenceFile(null); await refresh(); }) : undefined}>Upload</Button>
              </div>

              <div className="space-y-3 border-t pt-4">
                {profile.recommendationRequests.map((item) => (
                  <div key={item.id} className="rounded-xl border p-3 text-sm">{item.coachName} · {item.coachEmail} · {item.status} · {item.note}</div>
                ))}
                {profile.referenceLetters.map((item) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block rounded-xl border p-3 text-sm hover:bg-muted/40">
                    {item.title} · {item.authorName}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Heatmap and Offer Comparison</CardTitle>
              <CardDescription>See where interest is strongest and compare school paths side by side.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {heatmap.map((item) => (
                  <div key={item.schoolName} className="flex items-center gap-3">
                    <span className="w-40 text-sm">{item.schoolName}</span>
                    <div className="h-3 flex-1 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.score * 30}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{item.score}/3</span>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                {fitScores.map((item) => (
                  <div key={item.schoolName} className="rounded-xl border p-4">
                    <p className="font-semibold">{item.schoolName}</p>
                    <p className="text-sm text-muted-foreground">Fit score: {item.fitScore}/99</p>
                    <p className="mt-2 text-sm">{item.notes || "No extra notes."}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                {profile.offers.map((offer) => (
                  <div key={offer.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold">{offer.schoolName}</p>
                    <p className="text-muted-foreground">{offer.level} · {offer.packageLabel}</p>
                    <p className="mt-2">{offer.status}</p>
                  </div>
                ))}
                {profile.scholarships.map((scholarship) => (
                  <div key={scholarship.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold">{scholarship.schoolName}</p>
                    <p className="text-muted-foreground">{scholarship.amountLabel}</p>
                    <p className="mt-2">{scholarship.status}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-4">
                {profile.followUps.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                    <input type="checkbox" checked={item.done} onChange={(event) => void updateFollowUpStatus(item.id, event.target.checked).then(refresh)} />
                    <span>{item.schoolName} · {item.dueDate} · {item.note}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function RecruitingReadyPage() {
  return (
    <AuthProvider>
      <RecruitingReadyPageContent />
    </AuthProvider>
  );
}
