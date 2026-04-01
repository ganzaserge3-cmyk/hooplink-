"use client";

import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createAcademyRegistration,
  createAnniversaryPage,
  createApartmentPartner,
  createArchiveTimelineEntry,
  createAwardNomination,
  createBusSeatPlan,
  createCarpool,
  createCityAmbassador,
  createHallOfFameEntry,
  createLegacyImport,
  createLocalChapter,
  createParentRosterContact,
  createPhotoDaySchedule,
  createRelocationChecklist,
  createRoommateAssignment,
  createSnackSignup,
  createTradition,
  createTravelReimbursement,
  createVisaAlert,
  createVolunteerHours,
  getTravelLegacySnapshot,
} from "@/lib/phase8-travel";

function TravelLegacyPageContent() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getTravelLegacySnapshot>> | null>(null);
  const [teamId, setTeamId] = useState("");

  const [busForm, setBusForm] = useState({ tripLabel: "", athleteName: "", seatLabel: "" });
  const [roomForm, setRoomForm] = useState({ tripLabel: "", athleteName: "", roommateName: "" });
  const [reimburseForm, setReimburseForm] = useState({ requesterName: "", expenseLabel: "", amountLabel: "", status: "pending" });
  const [visaForm, setVisaForm] = useState({ athleteName: "", documentType: "", expiresOn: "", country: "" });
  const [relocationForm, setRelocationForm] = useState({ athleteName: "", city: "", checklistTitle: "", completedSteps: "1", totalSteps: "6" });
  const [apartmentForm, setApartmentForm] = useState({ city: "", partnerName: "", offerSummary: "", contactLabel: "" });
  const [academyForm, setAcademyForm] = useState({ academyName: "", athleteName: "", ageGroup: "", status: "pending" });
  const [parentForm, setParentForm] = useState({ athleteName: "", parentName: "", phone: "" });
  const [carpoolForm, setCarpoolForm] = useState({ driverName: "", routeLabel: "", seatsAvailable: "3" });
  const [snackForm, setSnackForm] = useState({ eventLabel: "", parentName: "", itemLabel: "" });
  const [photoForm, setPhotoForm] = useState({ athleteName: "", slotTime: "", lookLabel: "" });
  const [awardForm, setAwardForm] = useState({ nomineeName: "", awardTitle: "", justification: "" });
  const [hallForm, setHallForm] = useState({ honoreeName: "", classYear: "", legacyNote: "" });
  const [archiveForm, setArchiveForm] = useState({ yearLabel: "", title: "", summary: "" });
  const [importForm, setImportForm] = useState({ sourceLabel: "", statsSummary: "", importedCount: "25" });
  const [anniversaryForm, setAnniversaryForm] = useState({ title: "", milestoneYear: "", summary: "" });
  const [traditionForm, setTraditionForm] = useState({ title: "", description: "" });
  const [chapterForm, setChapterForm] = useState({ city: "", chapterName: "", focus: "" });
  const [ambassadorForm, setAmbassadorForm] = useState({ city: "", ambassadorName: "", chapterName: "" });
  const [hoursForm, setHoursForm] = useState({ participantName: "", programName: "", hours: "5" });

  const refresh = async () => {
    setLoading(true);
    try {
      const nextSnapshot = await getTravelLegacySnapshot();
      setSnapshot(nextSnapshot);
      if (!teamId && nextSnapshot.teamOptions[0]) {
        setTeamId(nextSnapshot.teamOptions[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const submit = async (action: () => Promise<void>, message: string, reset?: () => void) => {
    await action();
    reset?.();
    setStatus(message);
    await refresh();
  };

  if (loading || !snapshot) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Travel and Legacy Hub</h1>
          <p className="text-muted-foreground">Travel logistics, family coordination, academy pathways, local chapters, and long-term program history in one workspace.</p>
          {status ? <p className="mt-2 text-sm text-primary">{status}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.busPlans.length}</div><div className="text-sm text-muted-foreground">Bus seats</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.reimbursements.length}</div><div className="text-sm text-muted-foreground">Travel forms</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.academyRegistrations.length}</div><div className="text-sm text-muted-foreground">Academy registrations</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.localChapters.length}</div><div className="text-sm text-muted-foreground">Local chapters</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.hallOfFame.length}</div><div className="text-sm text-muted-foreground">Hall of fame entries</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Team Context</CardTitle></CardHeader>
          <CardContent>
            <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Choose team</option>
              {snapshot.teamOptions.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
            </select>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Travel Logistics</CardTitle><CardDescription>Bus seating, roommate assignments, reimbursements, visa alerts, relocation, and housing partners.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={busForm.tripLabel} onChange={(e) => setBusForm((c) => ({ ...c, tripLabel: e.target.value }))} placeholder="Trip label" />
                <Input value={busForm.athleteName} onChange={(e) => setBusForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Athlete" />
                <Input value={busForm.seatLabel} onChange={(e) => setBusForm((c) => ({ ...c, seatLabel: e.target.value }))} placeholder="Seat" />
                <Input value={roomForm.tripLabel} onChange={(e) => setRoomForm((c) => ({ ...c, tripLabel: e.target.value }))} placeholder="Room trip" />
                <Input value={roomForm.athleteName} onChange={(e) => setRoomForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Athlete" />
                <Input value={roomForm.roommateName} onChange={(e) => setRoomForm((c) => ({ ...c, roommateName: e.target.value }))} placeholder="Roommate" />
                <Input value={reimburseForm.requesterName} onChange={(e) => setReimburseForm((c) => ({ ...c, requesterName: e.target.value }))} placeholder="Requester" />
                <Input value={reimburseForm.expenseLabel} onChange={(e) => setReimburseForm((c) => ({ ...c, expenseLabel: e.target.value }))} placeholder="Expense label" />
                <Input value={reimburseForm.amountLabel} onChange={(e) => setReimburseForm((c) => ({ ...c, amountLabel: e.target.value }))} placeholder="$ amount" />
                <Input value={visaForm.athleteName} onChange={(e) => setVisaForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Visa athlete" />
                <Input value={visaForm.documentType} onChange={(e) => setVisaForm((c) => ({ ...c, documentType: e.target.value }))} placeholder="Document type" />
                <Input value={visaForm.expiresOn} onChange={(e) => setVisaForm((c) => ({ ...c, expiresOn: e.target.value }))} placeholder="Expires on" />
                <Input value={visaForm.country} onChange={(e) => setVisaForm((c) => ({ ...c, country: e.target.value }))} placeholder="Country" />
                <Input value={relocationForm.athleteName} onChange={(e) => setRelocationForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Relocating athlete" />
                <Input value={relocationForm.city} onChange={(e) => setRelocationForm((c) => ({ ...c, city: e.target.value }))} placeholder="Destination city" />
                <Input value={relocationForm.checklistTitle} onChange={(e) => setRelocationForm((c) => ({ ...c, checklistTitle: e.target.value }))} placeholder="Checklist title" />
                <Input value={apartmentForm.city} onChange={(e) => setApartmentForm((c) => ({ ...c, city: e.target.value }))} placeholder="Apartment city" />
                <Input value={apartmentForm.partnerName} onChange={(e) => setApartmentForm((c) => ({ ...c, partnerName: e.target.value }))} placeholder="Partner name" />
                <Input value={apartmentForm.contactLabel} onChange={(e) => setApartmentForm((c) => ({ ...c, contactLabel: e.target.value }))} placeholder="Contact label" />
              </div>
              <textarea value={apartmentForm.offerSummary} onChange={(e) => setApartmentForm((c) => ({ ...c, offerSummary: e.target.value }))} placeholder="Housing offer summary" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createBusSeatPlan({ teamId, ...busForm }), "Bus seating saved.", () => setBusForm({ tripLabel: "", athleteName: "", seatLabel: "" }))} disabled={!teamId || !busForm.athleteName.trim()}>Save Bus Seat</Button>
                <Button variant="outline" onClick={() => void submit(() => createRoommateAssignment({ teamId, ...roomForm }), "Roommate assignment saved.", () => setRoomForm({ tripLabel: "", athleteName: "", roommateName: "" }))} disabled={!teamId || !roomForm.athleteName.trim()}>Save Roommate</Button>
                <Button variant="outline" onClick={() => void submit(() => createTravelReimbursement({ teamId, ...reimburseForm, status: reimburseForm.status as "pending" | "approved" | "paid" }), "Travel reimbursement saved.", () => setReimburseForm({ requesterName: "", expenseLabel: "", amountLabel: "", status: "pending" }))} disabled={!teamId || !reimburseForm.requesterName.trim()}>Save Reimbursement</Button>
                <Button variant="outline" onClick={() => void submit(() => createVisaAlert(visaForm), "Visa alert saved.", () => setVisaForm({ athleteName: "", documentType: "", expiresOn: "", country: "" }))} disabled={!visaForm.athleteName.trim()}>Save Visa Alert</Button>
                <Button variant="outline" onClick={() => void submit(() => createRelocationChecklist({ athleteName: relocationForm.athleteName, city: relocationForm.city, checklistTitle: relocationForm.checklistTitle, completedSteps: Number(relocationForm.completedSteps), totalSteps: Number(relocationForm.totalSteps) }), "Relocation checklist saved.", () => setRelocationForm({ athleteName: "", city: "", checklistTitle: "", completedSteps: "1", totalSteps: "6" }))} disabled={!relocationForm.athleteName.trim()}>Save Relocation</Button>
                <Button variant="outline" onClick={() => void submit(() => createApartmentPartner(apartmentForm), "Apartment partner saved.", () => setApartmentForm({ city: "", partnerName: "", offerSummary: "", contactLabel: "" }))} disabled={!apartmentForm.partnerName.trim()}>Save Apartment Partner</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Family and Youth Operations</CardTitle><CardDescription>Youth academy intake, parent contacts, carpools, snack signups, and photo day scheduling.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={academyForm.academyName} onChange={(e) => setAcademyForm((c) => ({ ...c, academyName: e.target.value }))} placeholder="Academy name" />
                <Input value={academyForm.athleteName} onChange={(e) => setAcademyForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Athlete name" />
                <Input value={academyForm.ageGroup} onChange={(e) => setAcademyForm((c) => ({ ...c, ageGroup: e.target.value }))} placeholder="Age group" />
                <Input value={parentForm.athleteName} onChange={(e) => setParentForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Athlete for contact" />
                <Input value={parentForm.parentName} onChange={(e) => setParentForm((c) => ({ ...c, parentName: e.target.value }))} placeholder="Parent name" />
                <Input value={parentForm.phone} onChange={(e) => setParentForm((c) => ({ ...c, phone: e.target.value }))} placeholder="Phone" />
                <Input value={carpoolForm.driverName} onChange={(e) => setCarpoolForm((c) => ({ ...c, driverName: e.target.value }))} placeholder="Driver name" />
                <Input value={carpoolForm.routeLabel} onChange={(e) => setCarpoolForm((c) => ({ ...c, routeLabel: e.target.value }))} placeholder="Route label" />
                <Input value={carpoolForm.seatsAvailable} onChange={(e) => setCarpoolForm((c) => ({ ...c, seatsAvailable: e.target.value }))} placeholder="Seats" />
                <Input value={snackForm.eventLabel} onChange={(e) => setSnackForm((c) => ({ ...c, eventLabel: e.target.value }))} placeholder="Snack event" />
                <Input value={snackForm.parentName} onChange={(e) => setSnackForm((c) => ({ ...c, parentName: e.target.value }))} placeholder="Parent volunteer" />
                <Input value={snackForm.itemLabel} onChange={(e) => setSnackForm((c) => ({ ...c, itemLabel: e.target.value }))} placeholder="Snack item" />
                <Input value={photoForm.athleteName} onChange={(e) => setPhotoForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Photo athlete" />
                <Input value={photoForm.slotTime} onChange={(e) => setPhotoForm((c) => ({ ...c, slotTime: e.target.value }))} placeholder="Slot time" />
                <Input value={photoForm.lookLabel} onChange={(e) => setPhotoForm((c) => ({ ...c, lookLabel: e.target.value }))} placeholder="Look label" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createAcademyRegistration({ ...academyForm, status: academyForm.status as "pending" | "accepted" | "waitlist" }), "Academy registration saved.", () => setAcademyForm({ academyName: "", athleteName: "", ageGroup: "", status: "pending" }))} disabled={!academyForm.academyName.trim()}>Save Academy Registration</Button>
                <Button variant="outline" onClick={() => void submit(() => createParentRosterContact({ teamId, ...parentForm }), "Parent contact saved.", () => setParentForm({ athleteName: "", parentName: "", phone: "" }))} disabled={!teamId || !parentForm.parentName.trim()}>Save Parent Contact</Button>
                <Button variant="outline" onClick={() => void submit(() => createCarpool({ teamId, driverName: carpoolForm.driverName, routeLabel: carpoolForm.routeLabel, seatsAvailable: Number(carpoolForm.seatsAvailable) }), "Carpool saved.", () => setCarpoolForm({ driverName: "", routeLabel: "", seatsAvailable: "3" }))} disabled={!teamId || !carpoolForm.driverName.trim()}>Save Carpool</Button>
                <Button variant="outline" onClick={() => void submit(() => createSnackSignup({ teamId, ...snackForm }), "Snack signup saved.", () => setSnackForm({ eventLabel: "", parentName: "", itemLabel: "" }))} disabled={!teamId || !snackForm.eventLabel.trim()}>Save Snack Signup</Button>
                <Button variant="outline" onClick={() => void submit(() => createPhotoDaySchedule({ teamId, ...photoForm }), "Photo day schedule saved.", () => setPhotoForm({ athleteName: "", slotTime: "", lookLabel: "" }))} disabled={!teamId || !photoForm.athleteName.trim()}>Save Photo Slot</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Awards, Legacy, and Traditions</CardTitle><CardDescription>Award nominations, hall of fame, archives, imports, anniversaries, and team traditions.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={awardForm.nomineeName} onChange={(e) => setAwardForm((c) => ({ ...c, nomineeName: e.target.value }))} placeholder="Award nominee" />
                <Input value={awardForm.awardTitle} onChange={(e) => setAwardForm((c) => ({ ...c, awardTitle: e.target.value }))} placeholder="Award title" />
                <Input value={hallForm.honoreeName} onChange={(e) => setHallForm((c) => ({ ...c, honoreeName: e.target.value }))} placeholder="Hall of fame honoree" />
                <Input value={hallForm.classYear} onChange={(e) => setHallForm((c) => ({ ...c, classYear: e.target.value }))} placeholder="Class year" />
                <Input value={archiveForm.yearLabel} onChange={(e) => setArchiveForm((c) => ({ ...c, yearLabel: e.target.value }))} placeholder="Archive year" />
                <Input value={archiveForm.title} onChange={(e) => setArchiveForm((c) => ({ ...c, title: e.target.value }))} placeholder="Archive title" />
                <Input value={importForm.sourceLabel} onChange={(e) => setImportForm((c) => ({ ...c, sourceLabel: e.target.value }))} placeholder="Legacy import source" />
                <Input value={importForm.importedCount} onChange={(e) => setImportForm((c) => ({ ...c, importedCount: e.target.value }))} placeholder="Imported count" />
                <Input value={anniversaryForm.title} onChange={(e) => setAnniversaryForm((c) => ({ ...c, title: e.target.value }))} placeholder="Anniversary title" />
                <Input value={anniversaryForm.milestoneYear} onChange={(e) => setAnniversaryForm((c) => ({ ...c, milestoneYear: e.target.value }))} placeholder="Milestone year" />
                <Input value={traditionForm.title} onChange={(e) => setTraditionForm((c) => ({ ...c, title: e.target.value }))} placeholder="Tradition title" />
              </div>
              <textarea value={awardForm.justification} onChange={(e) => setAwardForm((c) => ({ ...c, justification: e.target.value }))} placeholder="Award justification" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={hallForm.legacyNote} onChange={(e) => setHallForm((c) => ({ ...c, legacyNote: e.target.value }))} placeholder="Legacy note" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={archiveForm.summary} onChange={(e) => setArchiveForm((c) => ({ ...c, summary: e.target.value }))} placeholder="Archive summary" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={importForm.statsSummary} onChange={(e) => setImportForm((c) => ({ ...c, statsSummary: e.target.value }))} placeholder="Legacy stats summary" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={anniversaryForm.summary} onChange={(e) => setAnniversaryForm((c) => ({ ...c, summary: e.target.value }))} placeholder="Anniversary summary" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={traditionForm.description} onChange={(e) => setTraditionForm((c) => ({ ...c, description: e.target.value }))} placeholder="Tradition description" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createAwardNomination({ teamId, ...awardForm }), "Award nomination saved.", () => setAwardForm({ nomineeName: "", awardTitle: "", justification: "" }))} disabled={!teamId || !awardForm.nomineeName.trim()}>Save Nomination</Button>
                <Button variant="outline" onClick={() => void submit(() => createHallOfFameEntry(hallForm), "Hall of fame entry saved.", () => setHallForm({ honoreeName: "", classYear: "", legacyNote: "" }))} disabled={!hallForm.honoreeName.trim()}>Save Hall Entry</Button>
                <Button variant="outline" onClick={() => void submit(() => createArchiveTimelineEntry(archiveForm), "Archive timeline entry saved.", () => setArchiveForm({ yearLabel: "", title: "", summary: "" }))} disabled={!archiveForm.title.trim()}>Save Archive</Button>
                <Button variant="outline" onClick={() => void submit(() => createLegacyImport({ sourceLabel: importForm.sourceLabel, statsSummary: importForm.statsSummary, importedCount: Number(importForm.importedCount) }), "Legacy stats import logged.", () => setImportForm({ sourceLabel: "", statsSummary: "", importedCount: "25" }))} disabled={!importForm.sourceLabel.trim()}>Save Import</Button>
                <Button variant="outline" onClick={() => void submit(() => createAnniversaryPage(anniversaryForm), "Anniversary page saved.", () => setAnniversaryForm({ title: "", milestoneYear: "", summary: "" }))} disabled={!anniversaryForm.title.trim()}>Save Anniversary</Button>
                <Button variant="outline" onClick={() => void submit(() => createTradition({ teamId, ...traditionForm }), "Team tradition saved.", () => setTraditionForm({ title: "", description: "" }))} disabled={!teamId || !traditionForm.title.trim()}>Save Tradition</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Local Chapters and Community Reach</CardTitle><CardDescription>Local chapters, city ambassadors, and volunteer-hour tracking for community programs.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={chapterForm.city} onChange={(e) => setChapterForm((c) => ({ ...c, city: e.target.value }))} placeholder="Chapter city" />
                <Input value={chapterForm.chapterName} onChange={(e) => setChapterForm((c) => ({ ...c, chapterName: e.target.value }))} placeholder="Chapter name" />
                <Input value={ambassadorForm.city} onChange={(e) => setAmbassadorForm((c) => ({ ...c, city: e.target.value }))} placeholder="Ambassador city" />
                <Input value={ambassadorForm.ambassadorName} onChange={(e) => setAmbassadorForm((c) => ({ ...c, ambassadorName: e.target.value }))} placeholder="Ambassador name" />
                <Input value={ambassadorForm.chapterName} onChange={(e) => setAmbassadorForm((c) => ({ ...c, chapterName: e.target.value }))} placeholder="Chapter" />
                <Input value={hoursForm.participantName} onChange={(e) => setHoursForm((c) => ({ ...c, participantName: e.target.value }))} placeholder="Volunteer name" />
                <Input value={hoursForm.programName} onChange={(e) => setHoursForm((c) => ({ ...c, programName: e.target.value }))} placeholder="Program" />
                <Input value={hoursForm.hours} onChange={(e) => setHoursForm((c) => ({ ...c, hours: e.target.value }))} placeholder="Hours" />
              </div>
              <textarea value={chapterForm.focus} onChange={(e) => setChapterForm((c) => ({ ...c, focus: e.target.value }))} placeholder="Chapter focus" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createLocalChapter(chapterForm), "Local chapter saved.", () => setChapterForm({ city: "", chapterName: "", focus: "" }))} disabled={!chapterForm.chapterName.trim()}>Save Chapter</Button>
                <Button variant="outline" onClick={() => void submit(() => createCityAmbassador(ambassadorForm), "City ambassador saved.", () => setAmbassadorForm({ city: "", ambassadorName: "", chapterName: "" }))} disabled={!ambassadorForm.ambassadorName.trim()}>Save Ambassador</Button>
                <Button variant="outline" onClick={() => void submit(() => createVolunteerHours({ participantName: hoursForm.participantName, programName: hoursForm.programName, hours: Number(hoursForm.hours) }), "Volunteer hours logged.", () => setHoursForm({ participantName: "", programName: "", hours: "5" }))} disabled={!hoursForm.participantName.trim()}>Save Hours</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{snapshot.localChapters.length}</p><p className="text-muted-foreground">Chapters</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{snapshot.cityAmbassadors.length}</p><p className="text-muted-foreground">Ambassadors</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{snapshot.volunteerHours.reduce((sum, item) => sum + item.hours, 0)}</p><p className="text-muted-foreground">Volunteer hours</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function TravelLegacyPage() {
  return (
    <AuthProvider>
      <TravelLegacyPageContent />
    </AuthProvider>
  );
}
