"use client";

import { useEffect, useMemo, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addPathwaysItem,
  getBoardingSchoolOptions,
  getCurrentPathwaysProfile,
  getInternationalRecruiterMatches,
  getOfferExpirationWarnings,
  saveCurrentPathwaysProfile,
  toggleChecklistItem,
  toggleHomeworkItem,
  uploadLanguageCertificate,
  type PathwaysProfile,
} from "@/lib/phase3";

function PathwaysPageContent() {
  const [profile, setProfile] = useState<PathwaysProfile | null>(null);
  const [languageFile, setLanguageFile] = useState<File | null>(null);
  const [timelineForm, setTimelineForm] = useState({ date: "", title: "", type: "interest" as PathwaysProfile["timeline"][number]["type"], note: "" });
  const [offerForm, setOfferForm] = useState({ schoolName: "", status: "watching" as PathwaysProfile["offers"][number]["status"], expiresOn: "", packageLabel: "" });
  const [pipelineForm, setPipelineForm] = useState({ schoolName: "", stage: "discovered" as PathwaysProfile["pipeline"][number]["stage"], notes: "" });
  const [paymentForm, setPaymentForm] = useState({ label: "", amountLabel: "", status: "pending" as PathwaysProfile["payments"][number]["status"] });
  const [consentForm, setConsentForm] = useState({ eventName: "", travelDate: "", guardianName: "", status: "pending" as PathwaysProfile["travelConsents"][number]["status"] });
  const [tutorForm, setTutorForm] = useState({ subject: "", tutorName: "", scheduledFor: "", status: "requested" as PathwaysProfile["tutorBookings"][number]["status"] });
  const [classForm, setClassForm] = useState({ course: "", day: "", time: "" });
  const [attendanceForm, setAttendanceForm] = useState({ course: "", riskLevel: "low" as PathwaysProfile["attendanceAlerts"][number]["riskLevel"], note: "" });
  const [homeworkForm, setHomeworkForm] = useState({ course: "", task: "", dueDate: "" });
  const [studyHallForm, setStudyHallForm] = useState({ date: "", durationMinutes: "60", focus: "" });
  const [testPrepForm, setTestPrepForm] = useState({ exam: "SAT" as PathwaysProfile["testPrep"][number]["exam"], targetScore: "", examDate: "", status: "planning" as PathwaysProfile["testPrep"][number]["status"] });
  const [languageForm, setLanguageForm] = useState({ label: "", issuer: "" });
  const [portalForm, setPortalForm] = useState({ schoolName: "", status: "monitoring" as PathwaysProfile["transferPortal"][number]["status"], note: "" });
  const [boardForm, setBoardForm] = useState({ athleteName: "", currentSchool: "", interestLevel: "medium" as PathwaysProfile["transferBoard"][number]["interestLevel"], note: "" });

  const refresh = async () => {
    setProfile(await getCurrentPathwaysProfile());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const offerWarnings = useMemo(() => (profile ? getOfferExpirationWarnings(profile) : []), [profile]);
  const internationalMatches = getInternationalRecruiterMatches();
  const boardingSchools = getBoardingSchoolOptions();

  if (!profile) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Pathways Hub</h1>
          <p className="text-muted-foreground">Prospect timeline, family recruiting workspace, academics, travel planning, test prep, international pathways, and transfer tracking.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{profile.timeline.length}</div><div className="text-sm text-muted-foreground">Timeline items</div></div>
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{profile.pipeline.length}</div><div className="text-sm text-muted-foreground">Pipeline schools</div></div>
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{profile.homework.filter((item) => !item.done).length}</div><div className="text-sm text-muted-foreground">Open homework</div></div>
          <div className="rounded-xl border p-4 text-center"><div className="text-2xl font-bold">{offerWarnings.filter((item) => (item.daysRemaining ?? 999) <= 14).length}</div><div className="text-sm text-muted-foreground">Offer warnings</div></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Family Recruiting Workspace</CardTitle>
              <CardDescription>Guardian links, shared calendar access, parent approvals, travel consent, and advisor notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={profile.family.guardianName} onChange={(event) => setProfile((current) => current ? { ...current, family: { ...current.family, guardianName: event.target.value } } : current)} placeholder="Guardian name" />
                <Input value={profile.family.guardianEmail} onChange={(event) => setProfile((current) => current ? { ...current, family: { ...current.family, guardianEmail: event.target.value } } : current)} placeholder="Guardian email" />
                <Input value={profile.family.sharedCalendarEmail} onChange={(event) => setProfile((current) => current ? { ...current, family: { ...current.family, sharedCalendarEmail: event.target.value } } : current)} placeholder="Shared calendar email" />
                <Input value={profile.family.advisorName} onChange={(event) => setProfile((current) => current ? { ...current, family: { ...current.family, advisorName: event.target.value } } : current)} placeholder="Academic advisor" />
                <textarea value={profile.family.recruitingNotes} onChange={(event) => setProfile((current) => current ? { ...current, family: { ...current.family, recruitingNotes: event.target.value } } : current)} className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Family recruiting notes" />
                <textarea value={profile.family.advisorNotes} onChange={(event) => setProfile((current) => current ? { ...current, family: { ...current.family, advisorNotes: event.target.value } } : current)} className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Advisor dashboard notes" />
              </div>
              <Button onClick={() => void saveCurrentPathwaysProfile(profile)}>Save Family Workspace</Button>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-3">
                <Input value={paymentForm.label} onChange={(event) => setPaymentForm((current) => ({ ...current, label: event.target.value }))} placeholder="Payment item" />
                <Input value={paymentForm.amountLabel} onChange={(event) => setPaymentForm((current) => ({ ...current, amountLabel: event.target.value }))} placeholder="Amount" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={paymentForm.status} onChange={(event) => setPaymentForm((current) => ({ ...current, status: event.target.value as typeof current.status }))}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("payments", { id: crypto.randomUUID(), ...paymentForm }).then(() => { setPaymentForm({ label: "", amountLabel: "", status: "pending" }); return refresh(); })}>Add Parent Payment Approval</Button>
              <div className="space-y-2 text-sm">
                {profile.payments.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3">{item.label} • {item.amountLabel} • {item.status}</div>)}
              </div>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-4">
                <Input value={consentForm.eventName} onChange={(event) => setConsentForm((current) => ({ ...current, eventName: event.target.value }))} placeholder="Travel event" />
                <Input value={consentForm.travelDate} onChange={(event) => setConsentForm((current) => ({ ...current, travelDate: event.target.value }))} type="date" placeholder="Date" />
                <Input value={consentForm.guardianName} onChange={(event) => setConsentForm((current) => ({ ...current, guardianName: event.target.value }))} placeholder="Guardian" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={consentForm.status} onChange={(event) => setConsentForm((current) => ({ ...current, status: event.target.value as typeof current.status }))}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("travelConsents", { id: crypto.randomUUID(), ...consentForm }).then(() => { setConsentForm({ eventName: "", travelDate: "", guardianName: "", status: "pending" }); return refresh(); })}>Add Travel Consent</Button>
              <div className="space-y-2 text-sm">
                {profile.travelConsents.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3">{item.eventName} • {item.travelDate} • {item.guardianName} • {item.status}</div>)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prospect Timeline and Pipeline</CardTitle>
              <CardDescription>Track key milestones, interest stages, and offer expiration reminders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Input value={timelineForm.date} onChange={(event) => setTimelineForm((current) => ({ ...current, date: event.target.value }))} type="date" />
                <Input value={timelineForm.title} onChange={(event) => setTimelineForm((current) => ({ ...current, title: event.target.value }))} placeholder="Timeline title" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={timelineForm.type} onChange={(event) => setTimelineForm((current) => ({ ...current, type: event.target.value as typeof current.type }))}>
                  <option value="interest">Interest</option>
                  <option value="offer">Offer</option>
                  <option value="visit">Visit</option>
                  <option value="academic">Academic</option>
                  <option value="family">Family</option>
                  <option value="transfer">Transfer</option>
                </select>
                <Input value={timelineForm.note} onChange={(event) => setTimelineForm((current) => ({ ...current, note: event.target.value }))} placeholder="Note" />
              </div>
              <Button onClick={() => void addPathwaysItem("timeline", { id: crypto.randomUUID(), ...timelineForm }).then(() => { setTimelineForm({ date: "", title: "", type: "interest", note: "" }); return refresh(); })}>Add Timeline Item</Button>
              <div className="space-y-2 text-sm">
                {profile.timeline.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3">{item.date} • {item.title} • {item.type} • {item.note}</div>)}
              </div>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-4">
                <Input value={pipelineForm.schoolName} onChange={(event) => setPipelineForm((current) => ({ ...current, schoolName: event.target.value }))} placeholder="School" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={pipelineForm.stage} onChange={(event) => setPipelineForm((current) => ({ ...current, stage: event.target.value as typeof current.stage }))}>
                  <option value="discovered">Discovered</option>
                  <option value="contacted">Contacted</option>
                  <option value="warm">Warm</option>
                  <option value="serious">Serious</option>
                  <option value="offer">Offer</option>
                </select>
                <Input value={pipelineForm.notes} onChange={(event) => setPipelineForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" />
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("pipeline", { id: crypto.randomUUID(), ...pipelineForm }).then(() => { setPipelineForm({ schoolName: "", stage: "discovered", notes: "" }); return refresh(); })}>Add Pipeline School</Button>
              <div className="space-y-2 text-sm">
                {profile.pipeline.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3">{item.schoolName} • {item.stage} • {item.notes}</div>)}
              </div>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-4">
                <Input value={offerForm.schoolName} onChange={(event) => setOfferForm((current) => ({ ...current, schoolName: event.target.value }))} placeholder="Offer school" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={offerForm.status} onChange={(event) => setOfferForm((current) => ({ ...current, status: event.target.value as typeof current.status }))}>
                  <option value="watching">Watching</option>
                  <option value="offered">Offered</option>
                  <option value="accepted">Accepted</option>
                  <option value="expired">Expired</option>
                </select>
                <Input value={offerForm.expiresOn} onChange={(event) => setOfferForm((current) => ({ ...current, expiresOn: event.target.value }))} type="date" />
                <Input value={offerForm.packageLabel} onChange={(event) => setOfferForm((current) => ({ ...current, packageLabel: event.target.value }))} placeholder="Package" />
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("offers", { id: crypto.randomUUID(), ...offerForm }).then(() => { setOfferForm({ schoolName: "", status: "watching", expiresOn: "", packageLabel: "" }); return refresh(); })}>Add Offer Reminder</Button>
              <div className="space-y-2 text-sm">
                {offerWarnings.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3">{item.schoolName} • {item.packageLabel} • {item.status} • {item.daysRemaining ?? "?"} day(s) left</div>)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Academic Support</CardTitle>
              <CardDescription>Tutor requests, class schedule sync, attendance warnings, homework, study hall, and SAT/ACT prep.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Input value={tutorForm.subject} onChange={(event) => setTutorForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Subject" />
                <Input value={tutorForm.tutorName} onChange={(event) => setTutorForm((current) => ({ ...current, tutorName: event.target.value }))} placeholder="Tutor" />
                <Input value={tutorForm.scheduledFor} onChange={(event) => setTutorForm((current) => ({ ...current, scheduledFor: event.target.value }))} type="date" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={tutorForm.status} onChange={(event) => setTutorForm((current) => ({ ...current, status: event.target.value as typeof current.status }))}>
                  <option value="requested">Requested</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
              <Button onClick={() => void addPathwaysItem("tutorBookings", { id: crypto.randomUUID(), ...tutorForm }).then(() => { setTutorForm({ subject: "", tutorName: "", scheduledFor: "", status: "requested" }); return refresh(); })}>Add Tutor Booking</Button>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-3">
                <Input value={classForm.course} onChange={(event) => setClassForm((current) => ({ ...current, course: event.target.value }))} placeholder="Course" />
                <Input value={classForm.day} onChange={(event) => setClassForm((current) => ({ ...current, day: event.target.value }))} placeholder="Day" />
                <Input value={classForm.time} onChange={(event) => setClassForm((current) => ({ ...current, time: event.target.value }))} placeholder="Time" />
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("classSchedule", { id: crypto.randomUUID(), ...classForm }).then(() => { setClassForm({ course: "", day: "", time: "" }); return refresh(); })}>Add Class Schedule Item</Button>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-3">
                <Input value={attendanceForm.course} onChange={(event) => setAttendanceForm((current) => ({ ...current, course: event.target.value }))} placeholder="Course" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={attendanceForm.riskLevel} onChange={(event) => setAttendanceForm((current) => ({ ...current, riskLevel: event.target.value as typeof current.riskLevel }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <Input value={attendanceForm.note} onChange={(event) => setAttendanceForm((current) => ({ ...current, note: event.target.value }))} placeholder="Warning note" />
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("attendanceAlerts", { id: crypto.randomUUID(), ...attendanceForm }).then(() => { setAttendanceForm({ course: "", riskLevel: "low", note: "" }); return refresh(); })}>Add Attendance Warning</Button>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-3">
                <Input value={homeworkForm.course} onChange={(event) => setHomeworkForm((current) => ({ ...current, course: event.target.value }))} placeholder="Course" />
                <Input value={homeworkForm.task} onChange={(event) => setHomeworkForm((current) => ({ ...current, task: event.target.value }))} placeholder="Homework task" />
                <Input value={homeworkForm.dueDate} onChange={(event) => setHomeworkForm((current) => ({ ...current, dueDate: event.target.value }))} type="date" />
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("homework", { id: crypto.randomUUID(), ...homeworkForm, done: false }).then(() => { setHomeworkForm({ course: "", task: "", dueDate: "" }); return refresh(); })}>Add Homework</Button>
              <div className="space-y-2 text-sm">
                {profile.homework.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 rounded-lg bg-muted p-3">
                    <input type="checkbox" checked={item.done} onChange={(event) => void toggleHomeworkItem(item.id, event.target.checked).then(refresh)} />
                    <span>{item.course} • {item.task} • {item.dueDate}</span>
                  </label>
                ))}
              </div>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-3">
                <Input value={studyHallForm.date} onChange={(event) => setStudyHallForm((current) => ({ ...current, date: event.target.value }))} type="date" />
                <Input value={studyHallForm.durationMinutes} onChange={(event) => setStudyHallForm((current) => ({ ...current, durationMinutes: event.target.value }))} placeholder="Minutes" />
                <Input value={studyHallForm.focus} onChange={(event) => setStudyHallForm((current) => ({ ...current, focus: event.target.value }))} placeholder="Focus" />
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("studyHall", { id: crypto.randomUUID(), date: studyHallForm.date, durationMinutes: Number(studyHallForm.durationMinutes), focus: studyHallForm.focus }).then(() => { setStudyHallForm({ date: "", durationMinutes: "60", focus: "" }); return refresh(); })}>Log Study Hall</Button>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-4">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={testPrepForm.exam} onChange={(event) => setTestPrepForm((current) => ({ ...current, exam: event.target.value as typeof current.exam }))}>
                  <option value="SAT">SAT</option>
                  <option value="ACT">ACT</option>
                </select>
                <Input value={testPrepForm.targetScore} onChange={(event) => setTestPrepForm((current) => ({ ...current, targetScore: event.target.value }))} placeholder="Target score" />
                <Input value={testPrepForm.examDate} onChange={(event) => setTestPrepForm((current) => ({ ...current, examDate: event.target.value }))} type="date" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={testPrepForm.status} onChange={(event) => setTestPrepForm((current) => ({ ...current, status: event.target.value as typeof current.status }))}>
                  <option value="planning">Planning</option>
                  <option value="registered">Registered</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("testPrep", { id: crypto.randomUUID(), ...testPrepForm }).then(() => { setTestPrepForm({ exam: "SAT", targetScore: "", examDate: "", status: "planning" }); return refresh(); })}>Add Test Prep Tracker</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>International and Transfer Pathways</CardTitle>
              <CardDescription>Language certificates, international recruiter matching, boarding school discovery, transfer portal tracking, and transfer interest board.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,auto]">
                <Input value={languageForm.label} onChange={(event) => setLanguageForm((current) => ({ ...current, label: event.target.value }))} placeholder="Certificate label" />
                <Input value={languageForm.issuer} onChange={(event) => setLanguageForm((current) => ({ ...current, issuer: event.target.value }))} placeholder="Issuer" />
                <input type="file" onChange={(event) => setLanguageFile(event.target.files?.[0] ?? null)} className="h-10 rounded-md border border-input px-3 text-sm" />
                <Button onClick={() => languageFile ? void uploadLanguageCertificate(languageFile, languageForm.label, languageForm.issuer).then(async () => { setLanguageFile(null); setLanguageForm({ label: "", issuer: "" }); await refresh(); }) : undefined}>Upload</Button>
              </div>
              <div className="space-y-2 text-sm">
                {profile.languageCertificates.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block rounded-lg bg-muted p-3 hover:bg-muted/80">{item.label} • {item.issuer}</a>)}
              </div>

              <div className="rounded-xl border p-4 text-sm">
                <p className="font-semibold">International Recruiter Matching</p>
                <div className="mt-3 space-y-2">
                  {internationalMatches.map((match) => <div key={match.id} className="rounded-lg bg-muted p-3">{match.region} • {match.org} • {match.note}</div>)}
                </div>
              </div>

              <div className="rounded-xl border p-4 text-sm">
                <p className="font-semibold">Boarding School Discovery</p>
                <div className="mt-3 space-y-2">
                  {boardingSchools.map((school) => <div key={school.id} className="rounded-lg bg-muted p-3">{school.name} • {school.focus} • {school.region}</div>)}
                </div>
              </div>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-3">
                <Input value={portalForm.schoolName} onChange={(event) => setPortalForm((current) => ({ ...current, schoolName: event.target.value }))} placeholder="School" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={portalForm.status} onChange={(event) => setPortalForm((current) => ({ ...current, status: event.target.value as typeof current.status }))}>
                  <option value="monitoring">Monitoring</option>
                  <option value="entered">Entered</option>
                  <option value="committed">Committed</option>
                </select>
                <Input value={portalForm.note} onChange={(event) => setPortalForm((current) => ({ ...current, note: event.target.value }))} placeholder="Portal note" />
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("transferPortal", { id: crypto.randomUUID(), ...portalForm }).then(() => { setPortalForm({ schoolName: "", status: "monitoring", note: "" }); return refresh(); })}>Add Transfer Portal Tracker</Button>
              <div className="space-y-2 text-sm">
                {profile.transferPortal.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3">{item.schoolName} • {item.status} • {item.note}</div>)}
              </div>

              <div className="grid gap-3 border-t pt-4 md:grid-cols-4">
                <Input value={boardForm.athleteName} onChange={(event) => setBoardForm((current) => ({ ...current, athleteName: event.target.value }))} placeholder="Athlete" />
                <Input value={boardForm.currentSchool} onChange={(event) => setBoardForm((current) => ({ ...current, currentSchool: event.target.value }))} placeholder="Current school" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={boardForm.interestLevel} onChange={(event) => setBoardForm((current) => ({ ...current, interestLevel: event.target.value as typeof current.interestLevel }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <Input value={boardForm.note} onChange={(event) => setBoardForm((current) => ({ ...current, note: event.target.value }))} placeholder="Interest note" />
              </div>
              <Button variant="outline" onClick={() => void addPathwaysItem("transferBoard", { id: crypto.randomUUID(), ...boardForm }).then(() => { setBoardForm({ athleteName: "", currentSchool: "", interestLevel: "medium", note: "" }); return refresh(); })}>Add Transfer Interest Board Item</Button>
              <div className="space-y-2 text-sm">
                {profile.transferBoard.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3">{item.athleteName} • {item.currentSchool} • {item.interestLevel} • {item.note}</div>)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dorm and Housing Checklist</CardTitle>
            <CardDescription>Track the move-in side of the journey alongside your recruiting timeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.housingChecklist.map((item) => (
              <label key={item.id} className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                <input type="checkbox" checked={item.done} onChange={(event) => void toggleChecklistItem(item.id, event.target.checked).then(refresh)} />
                <span>{item.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function PathwaysPage() {
  return (
    <AuthProvider>
      <PathwaysPageContent />
    </AuthProvider>
  );
}
