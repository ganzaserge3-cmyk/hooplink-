"use client";

import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createAdmissionsChecklist,
  createArrivalReminder,
  createBankSetup,
  createCampusPrep,
  createFamilyTransition,
  createHousingDeposit,
  createInternationalArrival,
  createLockerVault,
  createMealSwipeBudget,
  createPrivatePrepPage,
  createRoleOnboarding,
  getPhase10Snapshot,
  savePhase10Preferences,
} from "@/lib/phase10-onboarding";

function TransitionHubContent() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getPhase10Snapshot>> | null>(null);

  const [admissionsForm, setAdmissionsForm] = useState({ schoolName: "", applicantName: "", completedSteps: "2", totalSteps: "8" });
  const [housingForm, setHousingForm] = useState({ athleteName: "", housingName: "", amountLabel: "", dueDate: "" });
  const [mealForm, setMealForm] = useState({ athleteName: "", monthlyBudget: "450", currentBalance: "300" });
  const [bankForm, setBankForm] = useState({ athleteName: "", bankName: "", checklistStatus: "pending" });
  const [arrivalForm, setArrivalForm] = useState({ athleteName: "", airport: "", arrivalDate: "", status: "planned" });
  const [lockerForm, setLockerForm] = useState({ athleteName: "", lockerLabel: "", codeHint: "" });
  const [roleForm, setRoleForm] = useState({ roleName: "", title: "", checklist: "Profile, Documents, Schedule" });
  const [campusForm, setCampusForm] = useState({ athleteName: "", topic: "", summary: "" });
  const [familyForm, setFamilyForm] = useState({ athleteName: "", guardianName: "", planTitle: "", summary: "" });
  const [prepForm, setPrepForm] = useState({ title: "", accessGroup: "", summary: "" });
  const [reminderForm, setReminderForm] = useState({ athleteName: "", reminderTitle: "", reminderDate: "" });

  const refresh = async () => {
    setLoading(true);
    try {
      setSnapshot(await getPhase10Snapshot());
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
          <h1 className="text-3xl font-bold">Transition and Accessibility Hub</h1>
          <p className="text-muted-foreground">Campus setup, onboarding automation, family transition planning, and accessibility preferences in one workspace.</p>
          {status ? <p className="mt-2 text-sm text-primary">{status}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.admissions.length}</div><div className="text-sm text-muted-foreground">Admissions checklists</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.arrivals.length}</div><div className="text-sm text-muted-foreground">Arrival plans</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.familyTransitions.length}</div><div className="text-sm text-muted-foreground">Family plans</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.roleOnboarding.length}</div><div className="text-sm text-muted-foreground">Role onboarding kits</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{snapshot.prepPages.length}</div><div className="text-sm text-muted-foreground">Private prep pages</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Accessibility Preferences</CardTitle><CardDescription>Adaptive accessibility controls, dyslexia-friendly mode, and voice-navigation readiness.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <select value={snapshot.preferences.accessibilityMode} onChange={(e) => setSnapshot((current) => current ? { ...current, preferences: { ...current.preferences, accessibilityMode: e.target.value as "default" | "high_visibility" | "voice_ready" } } : current)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="default">Default</option>
                <option value="high_visibility">High visibility</option>
                <option value="voice_ready">Voice ready</option>
              </select>
              <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span>Dyslexia-friendly mode</span>
                <input type="checkbox" checked={snapshot.preferences.dyslexiaFriendly} onChange={(e) => setSnapshot((current) => current ? { ...current, preferences: { ...current.preferences, dyslexiaFriendly: e.target.checked } } : current)} />
              </label>
              <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span>Voice navigation</span>
                <input type="checkbox" checked={snapshot.preferences.voiceNavigationEnabled} onChange={(e) => setSnapshot((current) => current ? { ...current, preferences: { ...current.preferences, voiceNavigationEnabled: e.target.checked } } : current)} />
              </label>
            </div>
            <Button onClick={() => void submit(() => savePhase10Preferences(snapshot.preferences), "Accessibility preferences saved.")}>Save Accessibility Preferences</Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Admissions, Housing, and Life Admin</CardTitle><CardDescription>Admissions checklists, housing deposits, meal swipes, bank setup, arrival planning, and locker vaults.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={admissionsForm.schoolName} onChange={(e) => setAdmissionsForm((c) => ({ ...c, schoolName: e.target.value }))} placeholder="School name" />
                <Input value={admissionsForm.applicantName} onChange={(e) => setAdmissionsForm((c) => ({ ...c, applicantName: e.target.value }))} placeholder="Applicant" />
                <Input value={admissionsForm.completedSteps} onChange={(e) => setAdmissionsForm((c) => ({ ...c, completedSteps: e.target.value }))} placeholder="Completed steps" />
                <Input value={admissionsForm.totalSteps} onChange={(e) => setAdmissionsForm((c) => ({ ...c, totalSteps: e.target.value }))} placeholder="Total steps" />
                <Input value={housingForm.athleteName} onChange={(e) => setHousingForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Athlete for housing" />
                <Input value={housingForm.housingName} onChange={(e) => setHousingForm((c) => ({ ...c, housingName: e.target.value }))} placeholder="Housing name" />
                <Input value={housingForm.amountLabel} onChange={(e) => setHousingForm((c) => ({ ...c, amountLabel: e.target.value }))} placeholder="Deposit amount" />
                <Input value={housingForm.dueDate} onChange={(e) => setHousingForm((c) => ({ ...c, dueDate: e.target.value }))} placeholder="Due date" />
                <Input value={mealForm.athleteName} onChange={(e) => setMealForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Meal budget athlete" />
                <Input value={mealForm.monthlyBudget} onChange={(e) => setMealForm((c) => ({ ...c, monthlyBudget: e.target.value }))} placeholder="Monthly budget" />
                <Input value={mealForm.currentBalance} onChange={(e) => setMealForm((c) => ({ ...c, currentBalance: e.target.value }))} placeholder="Current balance" />
                <Input value={bankForm.athleteName} onChange={(e) => setBankForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Bank setup athlete" />
                <Input value={bankForm.bankName} onChange={(e) => setBankForm((c) => ({ ...c, bankName: e.target.value }))} placeholder="Bank name" />
                <Input value={arrivalForm.athleteName} onChange={(e) => setArrivalForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Arriving athlete" />
                <Input value={arrivalForm.airport} onChange={(e) => setArrivalForm((c) => ({ ...c, airport: e.target.value }))} placeholder="Arrival airport" />
                <Input value={arrivalForm.arrivalDate} onChange={(e) => setArrivalForm((c) => ({ ...c, arrivalDate: e.target.value }))} placeholder="Arrival date" />
                <Input value={lockerForm.athleteName} onChange={(e) => setLockerForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Locker athlete" />
                <Input value={lockerForm.lockerLabel} onChange={(e) => setLockerForm((c) => ({ ...c, lockerLabel: e.target.value }))} placeholder="Locker label" />
                <Input value={lockerForm.codeHint} onChange={(e) => setLockerForm((c) => ({ ...c, codeHint: e.target.value }))} placeholder="Code hint" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createAdmissionsChecklist({ schoolName: admissionsForm.schoolName, applicantName: admissionsForm.applicantName, completedSteps: Number(admissionsForm.completedSteps), totalSteps: Number(admissionsForm.totalSteps) }), "Admissions checklist saved.", () => setAdmissionsForm({ schoolName: "", applicantName: "", completedSteps: "2", totalSteps: "8" }))} disabled={!admissionsForm.schoolName.trim()}>Save Admissions</Button>
                <Button variant="outline" onClick={() => void submit(() => createHousingDeposit(housingForm), "Housing deposit saved.", () => setHousingForm({ athleteName: "", housingName: "", amountLabel: "", dueDate: "" }))} disabled={!housingForm.athleteName.trim()}>Save Housing</Button>
                <Button variant="outline" onClick={() => void submit(() => createMealSwipeBudget({ athleteName: mealForm.athleteName, monthlyBudget: Number(mealForm.monthlyBudget), currentBalance: Number(mealForm.currentBalance) }), "Meal swipe budget saved.", () => setMealForm({ athleteName: "", monthlyBudget: "450", currentBalance: "300" }))} disabled={!mealForm.athleteName.trim()}>Save Meal Budget</Button>
                <Button variant="outline" onClick={() => void submit(() => createBankSetup({ ...bankForm, checklistStatus: bankForm.checklistStatus as "pending" | "complete" }), "Bank setup saved.", () => setBankForm({ athleteName: "", bankName: "", checklistStatus: "pending" }))} disabled={!bankForm.athleteName.trim()}>Save Bank Setup</Button>
                <Button variant="outline" onClick={() => void submit(() => createInternationalArrival({ ...arrivalForm, status: arrivalForm.status as "planned" | "arrived" }), "International arrival saved.", () => setArrivalForm({ athleteName: "", airport: "", arrivalDate: "", status: "planned" }))} disabled={!arrivalForm.athleteName.trim()}>Save Arrival</Button>
                <Button variant="outline" onClick={() => void submit(() => createLockerVault(lockerForm), "Locker vault saved.", () => setLockerForm({ athleteName: "", lockerLabel: "", codeHint: "" }))} disabled={!lockerForm.athleteName.trim()}>Save Locker</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Role Onboarding and Campus Transition</CardTitle><CardDescription>Smart onboarding by role, campus prep, family transition plans, private prep pages, and arrival reminders.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={roleForm.roleName} onChange={(e) => setRoleForm((c) => ({ ...c, roleName: e.target.value }))} placeholder="Role name" />
                <Input value={roleForm.title} onChange={(e) => setRoleForm((c) => ({ ...c, title: e.target.value }))} placeholder="Onboarding title" />
                <Input value={campusForm.athleteName} onChange={(e) => setCampusForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Campus prep athlete" />
                <Input value={campusForm.topic} onChange={(e) => setCampusForm((c) => ({ ...c, topic: e.target.value }))} placeholder="Campus prep topic" />
                <Input value={familyForm.athleteName} onChange={(e) => setFamilyForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Transition athlete" />
                <Input value={familyForm.guardianName} onChange={(e) => setFamilyForm((c) => ({ ...c, guardianName: e.target.value }))} placeholder="Guardian name" />
                <Input value={familyForm.planTitle} onChange={(e) => setFamilyForm((c) => ({ ...c, planTitle: e.target.value }))} placeholder="Plan title" />
                <Input value={prepForm.title} onChange={(e) => setPrepForm((c) => ({ ...c, title: e.target.value }))} placeholder="Private prep page" />
                <Input value={prepForm.accessGroup} onChange={(e) => setPrepForm((c) => ({ ...c, accessGroup: e.target.value }))} placeholder="Access group" />
                <Input value={reminderForm.athleteName} onChange={(e) => setReminderForm((c) => ({ ...c, athleteName: e.target.value }))} placeholder="Reminder athlete" />
                <Input value={reminderForm.reminderTitle} onChange={(e) => setReminderForm((c) => ({ ...c, reminderTitle: e.target.value }))} placeholder="Reminder title" />
                <Input value={reminderForm.reminderDate} onChange={(e) => setReminderForm((c) => ({ ...c, reminderDate: e.target.value }))} placeholder="Reminder date" />
              </div>
              <textarea value={campusForm.summary} onChange={(e) => setCampusForm((c) => ({ ...c, summary: e.target.value }))} placeholder="Campus prep summary" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={familyForm.summary} onChange={(e) => setFamilyForm((c) => ({ ...c, summary: e.target.value }))} placeholder="Family transition summary" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea value={prepForm.summary} onChange={(e) => setPrepForm((c) => ({ ...c, summary: e.target.value }))} placeholder="Private prep page summary" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void submit(() => createRoleOnboarding({ roleName: roleForm.roleName, title: roleForm.title, checklist: roleForm.checklist.split(",").map((item) => item.trim()).filter(Boolean) }), "Role onboarding kit saved.", () => setRoleForm({ roleName: "", title: "", checklist: "Profile, Documents, Schedule" }))} disabled={!roleForm.roleName.trim()}>Save Onboarding Kit</Button>
                <Button variant="outline" onClick={() => void submit(() => createCampusPrep(campusForm), "Campus prep page saved.", () => setCampusForm({ athleteName: "", topic: "", summary: "" }))} disabled={!campusForm.athleteName.trim()}>Save Campus Prep</Button>
                <Button variant="outline" onClick={() => void submit(() => createFamilyTransition(familyForm), "Family transition plan saved.", () => setFamilyForm({ athleteName: "", guardianName: "", planTitle: "", summary: "" }))} disabled={!familyForm.athleteName.trim()}>Save Family Plan</Button>
                <Button variant="outline" onClick={() => void submit(() => createPrivatePrepPage(prepForm), "Private prep page saved.", () => setPrepForm({ title: "", accessGroup: "", summary: "" }))} disabled={!prepForm.title.trim()}>Save Prep Page</Button>
                <Button variant="outline" onClick={() => void submit(() => createArrivalReminder(reminderForm), "Arrival reminder saved.", () => setReminderForm({ athleteName: "", reminderTitle: "", reminderDate: "" }))} disabled={!reminderForm.athleteName.trim()}>Save Reminder</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function TransitionHubPage() {
  return (
    <AuthProvider>
      <TransitionHubContent />
    </AuthProvider>
  );
}
