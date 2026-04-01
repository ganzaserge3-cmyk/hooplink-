"use client";

import { useEffect, useMemo, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addSponsorBooth,
  assignStaffShift,
  awardShowcaseBadge,
  createCampDrillStation,
  createComplianceAlert,
  createJudgePanel,
  createLocalBusinessSponsorship,
  createRosterNeed,
  createSponsorLead,
  getAdvisorDirectory,
  getCampDrillStations,
  getCollegeRosterNeeds,
  getComplianceAlerts,
  getEquipmentSponsorApplications,
  getEventOptions,
  getGrantTrackers,
  getLeadPipelineSummary,
  getLocalBusinessSponsorships,
  getNonprofitCoverage,
  getNonprofitPartners,
  getOutreachCallLogs,
  getPositionDemandHeatmap,
  getRevenueSplits,
  getRosterCapWarnings,
  getScholarshipBudgets,
  getShowcasePerformanceBadges,
  getSponsorBooths,
  getSponsorLeads,
  getStaffShifts,
  getTeamOptions,
  getVendorApplications,
  getVendorPipelineSummary,
  getVolunteerRegistrations,
  logOutreachCall,
  registerVolunteer,
  saveGrantTracker,
  saveNonprofitPartner,
  saveRevenueSplit,
  saveScholarshipBudget,
  submitEquipmentSponsorApplication,
  submitVendorApplication,
  type AdvisorDirectoryEntry,
  type CampDrillStationRecord,
  type ComplianceAlertRecord,
  type EquipmentSponsorApplicationRecord,
  type GrantTrackerRecord,
  type LocalBusinessSponsorshipRecord,
  type NonprofitPartnerRecord,
  type OutreachCallLogRecord,
  type PositionDemandRecord,
  type RevenueSplitRecord,
  type RosterCapWarning,
  type RosterNeedRecord,
  type ScholarshipBudgetRecord,
  type ShowcasePerformanceBadgeRecord,
  type SponsorBoothRecord,
  type SponsorLeadRecord,
  type StaffShiftRecord,
  type VendorApplicationRecord,
  type VolunteerRegistrationRecord,
} from "@/lib/phase4";

function OperationsPageContent() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [advisors, setAdvisors] = useState<AdvisorDirectoryEntry[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlertRecord[]>([]);
  const [rosterWarnings, setRosterWarnings] = useState<RosterCapWarning[]>([]);
  const [budgets, setBudgets] = useState<ScholarshipBudgetRecord[]>([]);
  const [rosterNeeds, setRosterNeeds] = useState<RosterNeedRecord[]>([]);
  const [positionDemand, setPositionDemand] = useState<PositionDemandRecord[]>([]);
  const [badges, setBadges] = useState<ShowcasePerformanceBadgeRecord[]>([]);
  const [drillStations, setDrillStations] = useState<CampDrillStationRecord[]>([]);
  const [staffShifts, setStaffShifts] = useState<StaffShiftRecord[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerRegistrationRecord[]>([]);
  const [sponsorBooths, setSponsorBooths] = useState<SponsorBoothRecord[]>([]);
  const [vendorApplications, setVendorApplications] = useState<VendorApplicationRecord[]>([]);
  const [localSponsorships, setLocalSponsorships] = useState<LocalBusinessSponsorshipRecord[]>([]);
  const [sponsorLeads, setSponsorLeads] = useState<SponsorLeadRecord[]>([]);
  const [equipmentApplications, setEquipmentApplications] = useState<EquipmentSponsorApplicationRecord[]>([]);
  const [grants, setGrants] = useState<GrantTrackerRecord[]>([]);
  const [partners, setPartners] = useState<NonprofitPartnerRecord[]>([]);
  const [callLogs, setCallLogs] = useState<OutreachCallLogRecord[]>([]);
  const [revenueSplits, setRevenueSplits] = useState<RevenueSplitRecord[]>([]);
  const [eventOptions, setEventOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [teamOptions, setTeamOptions] = useState<Array<{ id: string; label: string }>>([]);

  const [complianceForm, setComplianceForm] = useState({ teamId: "", title: "", severity: "medium", details: "" });
  const [budgetForm, setBudgetForm] = useState({ teamId: "", totalBudget: "100000", committedBudget: "45000" });
  const [rosterNeedForm, setRosterNeedForm] = useState({ teamId: "", programName: "", position: "", classYear: "", priority: "high", notes: "" });
  const [badgeForm, setBadgeForm] = useState({ eventId: "", athleteName: "", badge: "", notes: "" });
  const [judgeForm, setJudgeForm] = useState({ eventId: "", title: "", criteria: "" });
  const [drillForm, setDrillForm] = useState({ teamId: "", eventId: "", name: "", focusArea: "", coachName: "" });
  const [shiftForm, setShiftForm] = useState({ eventId: "", role: "", assigneeName: "", startsAt: "", endsAt: "" });
  const [volunteerForm, setVolunteerForm] = useState({ eventId: "", name: "", role: "", availability: "" });
  const [boothForm, setBoothForm] = useState({ eventId: "", sponsorName: "", boothLabel: "", contactName: "" });
  const [vendorForm, setVendorForm] = useState({ eventId: "", businessName: "", category: "", contactEmail: "" });
  const [sponsorshipForm, setSponsorshipForm] = useState({ businessName: "", city: "", offerType: "", budgetLabel: "", status: "lead" });
  const [leadForm, setLeadForm] = useState({ brandName: "", stage: "new", valueLabel: "", ownerName: "" });
  const [callForm, setCallForm] = useState({ contactName: "", organization: "", summary: "", nextStep: "" });
  const [splitForm, setSplitForm] = useState({ campaignTitle: "", creatorName: "", partnerName: "", creatorPercent: "70", partnerPercent: "30" });
  const [equipmentForm, setEquipmentForm] = useState({ brandName: "", equipmentType: "", askSummary: "", status: "submitted" });
  const [grantForm, setGrantForm] = useState({ programName: "", amountLabel: "", dueDate: "", status: "research" });
  const [partnerForm, setPartnerForm] = useState({ name: "", mission: "", city: "", programFocus: "" });

  const refresh = async () => {
    setLoading(true);
    try {
      const [
        nextAdvisors,
        nextCompliance,
        nextWarnings,
        nextBudgets,
        nextNeeds,
        nextBadges,
        nextStations,
        nextShifts,
        nextVolunteers,
        nextBooths,
        nextVendors,
        nextLocalSponsorships,
        nextLeads,
        nextEquipment,
        nextGrants,
        nextPartners,
        nextCalls,
        nextSplits,
        nextEvents,
        nextTeams,
      ] = await Promise.all([
        getAdvisorDirectory(),
        getComplianceAlerts(),
        getRosterCapWarnings(),
        getScholarshipBudgets(),
        getCollegeRosterNeeds(),
        getShowcasePerformanceBadges(),
        getCampDrillStations(),
        getStaffShifts(),
        getVolunteerRegistrations(),
        getSponsorBooths(),
        getVendorApplications(),
        getLocalBusinessSponsorships(),
        getSponsorLeads(),
        getEquipmentSponsorApplications(),
        getGrantTrackers(),
        getNonprofitPartners(),
        getOutreachCallLogs(),
        getRevenueSplits(),
        getEventOptions(),
        getTeamOptions(),
      ]);

      setAdvisors(nextAdvisors);
      setComplianceAlerts(nextCompliance);
      setRosterWarnings(nextWarnings);
      setBudgets(nextBudgets);
      setRosterNeeds(nextNeeds);
      setPositionDemand(getPositionDemandHeatmap(nextNeeds));
      setBadges(nextBadges);
      setDrillStations(nextStations);
      setStaffShifts(nextShifts);
      setVolunteers(nextVolunteers);
      setSponsorBooths(nextBooths);
      setVendorApplications(nextVendors);
      setLocalSponsorships(nextLocalSponsorships);
      setSponsorLeads(nextLeads);
      setEquipmentApplications(nextEquipment);
      setGrants(nextGrants);
      setPartners(nextPartners);
      setCallLogs(nextCalls);
      setRevenueSplits(nextSplits);
      setEventOptions(nextEvents);
      setTeamOptions(nextTeams);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const vendorSummary = useMemo(() => getVendorPipelineSummary(vendorApplications), [vendorApplications]);
  const leadSummary = useMemo(() => getLeadPipelineSummary(sponsorLeads), [sponsorLeads]);
  const nonprofitCoverage = useMemo(() => getNonprofitCoverage(partners), [partners]);

  const submit = async (action: () => Promise<void>, message: string, reset?: () => void) => {
    await action();
    reset?.();
    setStatus(message);
    await refresh();
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Operations and Partnerships</h1>
          <p className="text-muted-foreground">
            Run advisor recruiting, event operations, sponsor workflows, and org funding from one place.
          </p>
          {status ? <p className="mt-2 text-sm text-primary">{status}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{advisors.length}</div><div className="text-sm text-muted-foreground">Agents and advisors</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{complianceAlerts.length}</div><div className="text-sm text-muted-foreground">Compliance alerts</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{leadSummary.open}</div><div className="text-sm text-muted-foreground">Open sponsor leads</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{nonprofitCoverage.partners}</div><div className="text-sm text-muted-foreground">Nonprofit partners</div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Agent and Advisor Directory</CardTitle>
              <CardDescription>Recruiting support contacts for athletes, schools, and programs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {advisors.slice(0, 8).map((advisor) => (
                <div key={advisor.uid} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{advisor.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {[advisor.roleLabel, advisor.sport, advisor.location].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                    {advisor.verified ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Verified</span> : null}
                  </div>
                  {advisor.expertise.length ? <p className="mt-2 text-xs text-muted-foreground">{advisor.expertise.join(" • ")}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance and Roster Health</CardTitle>
              <CardDescription>Track violations, roster pressure, and scholarship exposure before they become bigger problems.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <select value={complianceForm.teamId} onChange={(event) => setComplianceForm((current) => ({ ...current, teamId: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Choose team</option>
                  {teamOptions.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
                </select>
                <select value={complianceForm.severity} onChange={(event) => setComplianceForm((current) => ({ ...current, severity: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="low">Low severity</option>
                  <option value="medium">Medium severity</option>
                  <option value="high">High severity</option>
                </select>
              </div>
              <Input value={complianceForm.title} onChange={(event) => setComplianceForm((current) => ({ ...current, title: event.target.value }))} placeholder="Alert title" />
              <textarea value={complianceForm.details} onChange={(event) => setComplianceForm((current) => ({ ...current, details: event.target.value }))} placeholder="What needs to be reviewed or fixed?" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Button
                onClick={() =>
                  void submit(
                    () => createComplianceAlert({
                      teamId: complianceForm.teamId,
                      title: complianceForm.title,
                      severity: complianceForm.severity as "low" | "medium" | "high",
                      details: complianceForm.details,
                    }),
                    "Compliance alert saved.",
                    () => setComplianceForm({ teamId: "", title: "", severity: "medium", details: "" })
                  )
                }
                disabled={!complianceForm.teamId || !complianceForm.title.trim()}
              >
                Save Alert
              </Button>
              <div className="space-y-2">
                {rosterWarnings.map((warning) => (
                  <div key={warning.teamId} className="rounded-xl border p-3 text-sm">
                    <p className="font-medium">{warning.teamName}</p>
                    <p className="text-muted-foreground">Roster {warning.currentRosterSize}/{warning.rosterCap}</p>
                    <p className={warning.status === "over" ? "text-red-500" : warning.status === "approaching" ? "text-amber-500" : "text-emerald-600"}>{warning.status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Scholarship Budget Dashboard</CardTitle>
              <CardDescription>Plan scholarship spend by program and keep remaining room visible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <select value={budgetForm.teamId} onChange={(event) => setBudgetForm((current) => ({ ...current, teamId: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Choose team</option>
                  {teamOptions.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
                </select>
                <Input value={budgetForm.totalBudget} onChange={(event) => setBudgetForm((current) => ({ ...current, totalBudget: event.target.value }))} placeholder="Total budget" />
                <Input value={budgetForm.committedBudget} onChange={(event) => setBudgetForm((current) => ({ ...current, committedBudget: event.target.value }))} placeholder="Committed budget" />
              </div>
              <Button
                onClick={() =>
                  void submit(
                    () => saveScholarshipBudget({
                      teamId: budgetForm.teamId,
                      totalBudget: Number(budgetForm.totalBudget),
                      committedBudget: Number(budgetForm.committedBudget),
                    }),
                    "Scholarship budget updated."
                  )
                }
                disabled={!budgetForm.teamId}
              >
                Save Budget
              </Button>
              <div className="space-y-2">
                {budgets.map((budget) => (
                  <div key={`${budget.teamId}-${budget.id}`} className="rounded-xl border p-3 text-sm">
                    <p className="font-medium">{budget.teamName}</p>
                    <p className="text-muted-foreground">Committed ${budget.committedBudget.toLocaleString()} of ${budget.totalBudget.toLocaleString()}</p>
                    <p className="text-xs text-primary">Remaining ${budget.remainingBudget.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roster Needs and Position Heatmap</CardTitle>
              <CardDescription>Surface program needs and which positions are hottest across the board.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <select value={rosterNeedForm.teamId} onChange={(event) => setRosterNeedForm((current) => ({ ...current, teamId: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Choose team</option>
                  {teamOptions.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
                </select>
                <Input value={rosterNeedForm.programName} onChange={(event) => setRosterNeedForm((current) => ({ ...current, programName: event.target.value }))} placeholder="Program name" />
                <Input value={rosterNeedForm.position} onChange={(event) => setRosterNeedForm((current) => ({ ...current, position: event.target.value }))} placeholder="Position" />
                <Input value={rosterNeedForm.classYear} onChange={(event) => setRosterNeedForm((current) => ({ ...current, classYear: event.target.value }))} placeholder="Class year" />
              </div>
              <textarea value={rosterNeedForm.notes} onChange={(event) => setRosterNeedForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Need notes, archetype, or recruiting context" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Button
                onClick={() =>
                  void submit(
                    () => createRosterNeed({
                      teamId: rosterNeedForm.teamId,
                      programName: rosterNeedForm.programName,
                      position: rosterNeedForm.position,
                      classYear: rosterNeedForm.classYear,
                      priority: rosterNeedForm.priority as "low" | "medium" | "high",
                      notes: rosterNeedForm.notes,
                    }),
                    "Roster need saved.",
                    () => setRosterNeedForm({ teamId: "", programName: "", position: "", classYear: "", priority: "high", notes: "" })
                  )
                }
                disabled={!rosterNeedForm.teamId || !rosterNeedForm.position.trim()}
              >
                Add Need
              </Button>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  {rosterNeeds.slice(0, 5).map((need) => (
                    <div key={need.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{need.programName}</p>
                      <p className="text-muted-foreground">{[need.position, need.classYear].join(" • ")}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {positionDemand.slice(0, 5).map((row) => (
                    <div key={row.position} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{row.position}</p>
                      <p className="text-muted-foreground">{row.openRoles} openings • {row.highPriorityRoles} high priority</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Showcase Judging and Badges</CardTitle>
              <CardDescription>Run judge panels and award standout badges after camps and showcases.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <select value={badgeForm.eventId} onChange={(event) => { setBadgeForm((current) => ({ ...current, eventId: event.target.value })); setJudgeForm((current) => ({ ...current, eventId: event.target.value })); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Choose event</option>
                  {eventOptions.map((event) => <option key={event.id} value={event.id}>{event.label}</option>)}
                </select>
                <Input value={badgeForm.athleteName} onChange={(event) => setBadgeForm((current) => ({ ...current, athleteName: event.target.value }))} placeholder="Athlete name" />
                <Input value={badgeForm.badge} onChange={(event) => setBadgeForm((current) => ({ ...current, badge: event.target.value }))} placeholder="Badge name" />
                <Input value={judgeForm.title} onChange={(event) => setJudgeForm((current) => ({ ...current, title: event.target.value }))} placeholder="Judge panel title" />
              </div>
              <textarea value={badgeForm.notes} onChange={(event) => setBadgeForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Badge notes" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Input value={judgeForm.criteria} onChange={(event) => setJudgeForm((current) => ({ ...current, criteria: event.target.value }))} placeholder="Criteria, comma separated" />
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    void submit(
                      () => awardShowcaseBadge(badgeForm),
                      "Showcase badge awarded.",
                      () => setBadgeForm({ eventId: "", athleteName: "", badge: "", notes: "" })
                    )
                  }
                  disabled={!badgeForm.eventId || !badgeForm.athleteName.trim()}
                >
                  Award Badge
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    void submit(
                      () => createJudgePanel({
                        eventId: judgeForm.eventId,
                        title: judgeForm.title,
                        criteria: judgeForm.criteria.split(",").map((item) => item.trim()).filter(Boolean),
                      }),
                      "Judge panel saved.",
                      () => setJudgeForm({ eventId: "", title: "", criteria: "" })
                    )
                  }
                  disabled={!judgeForm.eventId || !judgeForm.title.trim()}
                >
                  Save Judge Panel
                </Button>
              </div>
              <div className="space-y-2">
                {badges.slice(0, 5).map((badge) => (
                  <div key={badge.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-medium">{badge.athleteName}</p>
                    <p className="text-muted-foreground">{badge.badge}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Camp Stations, Staff Shifts, and Volunteers</CardTitle>
              <CardDescription>Coordinate drill flow, event staffing, and volunteer coverage in one board.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <select value={drillForm.teamId} onChange={(event) => setDrillForm((current) => ({ ...current, teamId: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Choose team</option>
                  {teamOptions.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
                </select>
                <select value={drillForm.eventId} onChange={(event) => setDrillForm((current) => ({ ...current, eventId: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Choose event</option>
                  {eventOptions.map((event) => <option key={event.id} value={event.id}>{event.label}</option>)}
                </select>
                <Input value={drillForm.name} onChange={(event) => setDrillForm((current) => ({ ...current, name: event.target.value }))} placeholder="Station name" />
                <Input value={drillForm.focusArea} onChange={(event) => setDrillForm((current) => ({ ...current, focusArea: event.target.value }))} placeholder="Focus area" />
                <Input value={drillForm.coachName} onChange={(event) => setDrillForm((current) => ({ ...current, coachName: event.target.value }))} placeholder="Coach name" />
                <Button
                  onClick={() =>
                    void submit(
                      () => createCampDrillStation(drillForm),
                      "Drill station saved.",
                      () => setDrillForm({ teamId: "", eventId: "", name: "", focusArea: "", coachName: "" })
                    )
                  }
                  disabled={!drillForm.teamId || !drillForm.eventId || !drillForm.name.trim()}
                >
                  Add Station
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={shiftForm.role} onChange={(event) => setShiftForm((current) => ({ ...current, role: event.target.value }))} placeholder="Shift role" />
                <Input value={shiftForm.assigneeName} onChange={(event) => setShiftForm((current) => ({ ...current, assigneeName: event.target.value }))} placeholder="Assignee name" />
                <Input value={shiftForm.startsAt} onChange={(event) => setShiftForm((current) => ({ ...current, startsAt: event.target.value }))} placeholder="Starts at" />
                <Input value={shiftForm.endsAt} onChange={(event) => setShiftForm((current) => ({ ...current, endsAt: event.target.value }))} placeholder="Ends at" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input value={volunteerForm.name} onChange={(event) => setVolunteerForm((current) => ({ ...current, name: event.target.value }))} placeholder="Volunteer name" />
                <Input value={volunteerForm.role} onChange={(event) => setVolunteerForm((current) => ({ ...current, role: event.target.value }))} placeholder="Volunteer role" />
                <Input value={volunteerForm.availability} onChange={(event) => setVolunteerForm((current) => ({ ...current, availability: event.target.value }))} placeholder="Availability" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    void submit(
                      () => assignStaffShift({ ...shiftForm, eventId: drillForm.eventId }),
                      "Staff shift assigned.",
                      () => setShiftForm({ eventId: "", role: "", assigneeName: "", startsAt: "", endsAt: "" })
                    )
                  }
                  disabled={!drillForm.eventId || !shiftForm.role.trim()}
                >
                  Assign Shift
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    void submit(
                      () => registerVolunteer({ ...volunteerForm, eventId: drillForm.eventId }),
                      "Volunteer added.",
                      () => setVolunteerForm({ eventId: "", name: "", role: "", availability: "" })
                    )
                  }
                  disabled={!drillForm.eventId || !volunteerForm.name.trim()}
                >
                  Add Volunteer
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{drillStations.length}</p><p className="text-muted-foreground">Stations</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{staffShifts.length}</p><p className="text-muted-foreground">Staff shifts</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">{volunteers.length}</p><p className="text-muted-foreground">Volunteers</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Event Sponsors, Vendors, and Booth Maps</CardTitle>
              <CardDescription>Manage sponsor booth placements, vendor applications, and event-floor operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select value={boothForm.eventId} onChange={(event) => { setBoothForm((current) => ({ ...current, eventId: event.target.value })); setVendorForm((current) => ({ ...current, eventId: event.target.value })); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Choose event</option>
                {eventOptions.map((event) => <option key={event.id} value={event.id}>{event.label}</option>)}
              </select>
              <div className="grid gap-3 md:grid-cols-3">
                <Input value={boothForm.sponsorName} onChange={(event) => setBoothForm((current) => ({ ...current, sponsorName: event.target.value }))} placeholder="Sponsor" />
                <Input value={boothForm.boothLabel} onChange={(event) => setBoothForm((current) => ({ ...current, boothLabel: event.target.value }))} placeholder="Booth label" />
                <Input value={boothForm.contactName} onChange={(event) => setBoothForm((current) => ({ ...current, contactName: event.target.value }))} placeholder="Contact name" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    void submit(
                      () => addSponsorBooth(boothForm),
                      "Sponsor booth mapped.",
                      () => setBoothForm({ eventId: "", sponsorName: "", boothLabel: "", contactName: "" })
                    )
                  }
                  disabled={!boothForm.eventId || !boothForm.sponsorName.trim()}
                >
                  Add Booth
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    void submit(
                      () => submitVendorApplication(vendorForm),
                      "Vendor application submitted.",
                      () => setVendorForm({ eventId: "", businessName: "", category: "", contactEmail: "" })
                    )
                  }
                  disabled={!vendorForm.eventId || !vendorForm.businessName.trim()}
                >
                  Add Vendor
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input value={vendorForm.businessName} onChange={(event) => setVendorForm((current) => ({ ...current, businessName: event.target.value }))} placeholder="Business name" />
                <Input value={vendorForm.category} onChange={(event) => setVendorForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
                <Input value={vendorForm.contactEmail} onChange={(event) => setVendorForm((current) => ({ ...current, contactEmail: event.target.value }))} placeholder="Contact email" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">Vendor pipeline</p>
                  <p className="text-muted-foreground">Pending {vendorSummary.pending} • Approved {vendorSummary.approved}</p>
                </div>
                <div className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">Booth map</p>
                  <p className="text-muted-foreground">{sponsorBooths.length} sponsor booths mapped</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sponsor Marketplace and CRM</CardTitle>
              <CardDescription>Track local sponsors, sales outreach, split-revenue deals, and equipment asks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={sponsorshipForm.businessName} onChange={(event) => setSponsorshipForm((current) => ({ ...current, businessName: event.target.value }))} placeholder="Business name" />
                <Input value={sponsorshipForm.city} onChange={(event) => setSponsorshipForm((current) => ({ ...current, city: event.target.value }))} placeholder="City" />
                <Input value={sponsorshipForm.offerType} onChange={(event) => setSponsorshipForm((current) => ({ ...current, offerType: event.target.value }))} placeholder="Offer type" />
                <Input value={sponsorshipForm.budgetLabel} onChange={(event) => setSponsorshipForm((current) => ({ ...current, budgetLabel: event.target.value }))} placeholder="Budget label" />
              </div>
              <Button
                onClick={() =>
                  void submit(
                    () => createLocalBusinessSponsorship({ ...sponsorshipForm, status: sponsorshipForm.status as "lead" | "active" | "closed" }),
                    "Local sponsorship added.",
                    () => setSponsorshipForm({ businessName: "", city: "", offerType: "", budgetLabel: "", status: "lead" })
                  )
                }
                disabled={!sponsorshipForm.businessName.trim()}
              >
                Add Sponsorship
              </Button>
              <div className="grid gap-3 md:grid-cols-4">
                <Input value={leadForm.brandName} onChange={(event) => setLeadForm((current) => ({ ...current, brandName: event.target.value }))} placeholder="Lead brand" />
                <Input value={leadForm.valueLabel} onChange={(event) => setLeadForm((current) => ({ ...current, valueLabel: event.target.value }))} placeholder="Deal value" />
                <Input value={leadForm.ownerName} onChange={(event) => setLeadForm((current) => ({ ...current, ownerName: event.target.value }))} placeholder="Owner" />
                <Button
                  variant="outline"
                  onClick={() =>
                    void submit(
                      () => createSponsorLead({ ...leadForm, stage: leadForm.stage as "new" | "contacted" | "proposal" | "won" | "lost" }),
                      "Sponsor lead saved.",
                      () => setLeadForm({ brandName: "", stage: "new", valueLabel: "", ownerName: "" })
                    )
                  }
                  disabled={!leadForm.brandName.trim()}
                >
                  Add Lead
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Input value={callForm.contactName} onChange={(event) => setCallForm((current) => ({ ...current, contactName: event.target.value }))} placeholder="Call contact" />
                <Input value={callForm.organization} onChange={(event) => setCallForm((current) => ({ ...current, organization: event.target.value }))} placeholder="Organization" />
                <Input value={callForm.summary} onChange={(event) => setCallForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Call summary" />
                <Input value={callForm.nextStep} onChange={(event) => setCallForm((current) => ({ ...current, nextStep: event.target.value }))} placeholder="Next step" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    void submit(
                      () => logOutreachCall(callForm),
                      "Outreach call logged.",
                      () => setCallForm({ contactName: "", organization: "", summary: "", nextStep: "" })
                    )
                  }
                  disabled={!callForm.contactName.trim()}
                >
                  Log Call
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    void submit(
                      () => saveRevenueSplit({
                        campaignTitle: splitForm.campaignTitle,
                        creatorName: splitForm.creatorName,
                        partnerName: splitForm.partnerName,
                        creatorPercent: Number(splitForm.creatorPercent),
                        partnerPercent: Number(splitForm.partnerPercent),
                      }),
                      "Revenue split saved.",
                      () => setSplitForm({ campaignTitle: "", creatorName: "", partnerName: "", creatorPercent: "70", partnerPercent: "30" })
                    )
                  }
                  disabled={!splitForm.campaignTitle.trim()}
                >
                  Save Revenue Split
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    void submit(
                      () => submitEquipmentSponsorApplication({
                        brandName: equipmentForm.brandName,
                        equipmentType: equipmentForm.equipmentType,
                        askSummary: equipmentForm.askSummary,
                        status: equipmentForm.status as "draft" | "submitted" | "review" | "approved",
                      }),
                      "Equipment sponsor application saved.",
                      () => setEquipmentForm({ brandName: "", equipmentType: "", askSummary: "", status: "submitted" })
                    )
                  }
                  disabled={!equipmentForm.brandName.trim()}
                >
                  Save Equipment Ask
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input value={splitForm.campaignTitle} onChange={(event) => setSplitForm((current) => ({ ...current, campaignTitle: event.target.value }))} placeholder="Campaign title" />
                <Input value={splitForm.creatorName} onChange={(event) => setSplitForm((current) => ({ ...current, creatorName: event.target.value }))} placeholder="Creator" />
                <Input value={splitForm.partnerName} onChange={(event) => setSplitForm((current) => ({ ...current, partnerName: event.target.value }))} placeholder="Partner" />
                <Input value={splitForm.creatorPercent} onChange={(event) => setSplitForm((current) => ({ ...current, creatorPercent: event.target.value }))} placeholder="Creator %" />
                <Input value={splitForm.partnerPercent} onChange={(event) => setSplitForm((current) => ({ ...current, partnerPercent: event.target.value }))} placeholder="Partner %" />
                <Input value={equipmentForm.brandName} onChange={(event) => setEquipmentForm((current) => ({ ...current, brandName: event.target.value }))} placeholder="Equipment brand" />
                <Input value={equipmentForm.equipmentType} onChange={(event) => setEquipmentForm((current) => ({ ...current, equipmentType: event.target.value }))} placeholder="Equipment type" />
                <Input value={equipmentForm.askSummary} onChange={(event) => setEquipmentForm((current) => ({ ...current, askSummary: event.target.value }))} placeholder="Ask summary" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">Lead CRM</p><p className="text-muted-foreground">Open {leadSummary.open} • Won {leadSummary.won}</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">Outreach calls</p><p className="text-muted-foreground">{callLogs.length} logged conversations</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="font-medium">Equipment asks</p><p className="text-muted-foreground">{equipmentApplications.length} active requests</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Grant Tracker and Nonprofit Partner Dashboard</CardTitle>
            <CardDescription>Keep grant deadlines, community partnerships, and mission-aligned programs visible for the whole org.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input value={grantForm.programName} onChange={(event) => setGrantForm((current) => ({ ...current, programName: event.target.value }))} placeholder="Grant program" />
              <Input value={grantForm.amountLabel} onChange={(event) => setGrantForm((current) => ({ ...current, amountLabel: event.target.value }))} placeholder="Amount label" />
              <Input value={grantForm.dueDate} onChange={(event) => setGrantForm((current) => ({ ...current, dueDate: event.target.value }))} placeholder="Due date" />
              <Button
                onClick={() =>
                  void submit(
                    () => saveGrantTracker({ ...grantForm, status: grantForm.status as "research" | "drafting" | "submitted" | "awarded" }),
                    "Grant tracker updated.",
                    () => setGrantForm({ programName: "", amountLabel: "", dueDate: "", status: "research" })
                  )
                }
                disabled={!grantForm.programName.trim()}
              >
                Save Grant
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Input value={partnerForm.name} onChange={(event) => setPartnerForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nonprofit name" />
              <Input value={partnerForm.city} onChange={(event) => setPartnerForm((current) => ({ ...current, city: event.target.value }))} placeholder="City" />
              <Input value={partnerForm.programFocus} onChange={(event) => setPartnerForm((current) => ({ ...current, programFocus: event.target.value }))} placeholder="Program focus" />
              <Button
                variant="outline"
                onClick={() =>
                  void submit(
                    () => saveNonprofitPartner(partnerForm),
                    "Nonprofit partner saved.",
                    () => setPartnerForm({ name: "", mission: "", city: "", programFocus: "" })
                  )
                }
                disabled={!partnerForm.name.trim()}
              >
                Add Partner
              </Button>
            </div>
            <textarea value={partnerForm.mission} onChange={(event) => setPartnerForm((current) => ({ ...current, mission: event.target.value }))} placeholder="Mission or partnership goals" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border p-3 text-sm"><p className="font-medium">Grant pipeline</p><p className="text-muted-foreground">{grants.length} tracked opportunities</p></div>
              <div className="rounded-xl border p-3 text-sm"><p className="font-medium">Community coverage</p><p className="text-muted-foreground">{nonprofitCoverage.partners} partners in {nonprofitCoverage.cities} cities</p></div>
              <div className="rounded-xl border p-3 text-sm"><p className="font-medium">Marketplace footprint</p><p className="text-muted-foreground">{localSponsorships.length} local sponsorship listings</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function OperationsPage() {
  return (
    <AuthProvider>
      <OperationsPageContent />
    </AuthProvider>
  );
}
