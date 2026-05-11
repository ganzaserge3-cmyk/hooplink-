"use client";

import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getCurrentSecurityPreferences,
  getCurrentTrustSnapshot,
  getGuardianLinks,
  getLoginHistory,
  getManagedDevices,
  getMyBanAppeals,
  linkGuardianAccount,
  nominateTrustedReporter,
  registerManagedDevice,
  submitBanAppeal,
  updateCurrentSecurityPreferences,
  type BanAppealRecord,
  type GuardianLinkRecord,
  type LoginHistoryRecord,
  type ManagedDeviceRecord,
  type SecurityPreferences,
} from "@/lib/phase8";

function SecurityPageContent() {
  const [preferences, setPreferences] = useState<SecurityPreferences | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>([]);
  const [devices, setDevices] = useState<ManagedDeviceRecord[]>([]);
  const [guardians, setGuardians] = useState<GuardianLinkRecord[]>([]);
  const [appeals, setAppeals] = useState<BanAppealRecord[]>([]);
  const [trust, setTrust] = useState({ reputationScore: 50, trustedReporter: false });
  const [deviceForm, setDeviceForm] = useState({ label: "", platform: "" });
  const [guardianForm, setGuardianForm] = useState({ guardianName: "", guardianEmail: "", relationship: "" });
  const [banAppeal, setBanAppeal] = useState("");
  const [reporterNomination, setReporterNomination] = useState("");

  const refresh = async () => {
    const [nextPreferences, nextHistory, nextDevices, nextGuardians, nextAppeals, nextTrust] =
      await Promise.all([
        getCurrentSecurityPreferences(),
        getLoginHistory(),
        getManagedDevices(),
        getGuardianLinks(),
        getMyBanAppeals(),
        getCurrentTrustSnapshot(),
      ]);
    setPreferences(nextPreferences);
    setLoginHistory(nextHistory);
    setDevices(nextDevices);
    setGuardians(nextGuardians);
    setAppeals(nextAppeals);
    setTrust(nextTrust);
  };

  useEffect(() => {
    void refresh();
  }, []);

  if (!preferences) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Security & Trust</h1>
          <p className="text-muted-foreground">Two-factor and magic-link preferences, login history, device management, guardian links, privacy controls, ban appeals, and trust reputation.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Security Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span>Two-factor enabled</span>
                <input type="checkbox" checked={preferences.twoFactorEnabled} onChange={(event) => setPreferences((current) => current ? { ...current, twoFactorEnabled: event.target.checked } : current)} />
              </label>
              <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span>Magic link sign-in</span>
                <input type="checkbox" checked={preferences.magicLinkEnabled} onChange={(event) => setPreferences((current) => current ? { ...current, magicLinkEnabled: event.target.checked } : current)} />
              </label>
              <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span>Age-gated privacy</span>
                <input type="checkbox" checked={preferences.agePrivacyEnabled} onChange={(event) => setPreferences((current) => current ? { ...current, agePrivacyEnabled: event.target.checked } : current)} />
              </label>
              <Input value={preferences.activeAccountLabel} onChange={(event) => setPreferences((current) => current ? { ...current, activeAccountLabel: event.target.value } : current)} placeholder="Active account label" />
              <Button onClick={() => void updateCurrentSecurityPreferences(preferences).then(refresh)}>Save Security Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Devices</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={deviceForm.label} onChange={(event) => setDeviceForm((current) => ({ ...current, label: event.target.value }))} placeholder="Device label" />
              <Input value={deviceForm.platform} onChange={(event) => setDeviceForm((current) => ({ ...current, platform: event.target.value }))} placeholder="Platform" />
              <Button onClick={() => void registerManagedDevice(deviceForm).then(() => { setDeviceForm({ label: "", platform: "" }); refresh(); })}>Register Device</Button>
              {devices.map((device) => (
                <div key={device.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-semibold">{device.label}</p>
                  <p className="text-muted-foreground">{device.platform}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Login History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {loginHistory.map((entry) => (
                <div key={entry.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-semibold">{entry.email}</p>
                  <p className="text-muted-foreground">{entry.method} ΓÇó {entry.deviceLabel}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Guardian Links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={guardianForm.guardianName} onChange={(event) => setGuardianForm((current) => ({ ...current, guardianName: event.target.value }))} placeholder="Guardian name" />
              <Input value={guardianForm.guardianEmail} onChange={(event) => setGuardianForm((current) => ({ ...current, guardianEmail: event.target.value }))} placeholder="Guardian email" />
              <Input value={guardianForm.relationship} onChange={(event) => setGuardianForm((current) => ({ ...current, relationship: event.target.value }))} placeholder="Relationship" />
              <Button onClick={() => void linkGuardianAccount(guardianForm).then(() => { setGuardianForm({ guardianName: "", guardianEmail: "", relationship: "" }); refresh(); })}>Link Guardian</Button>
              {guardians.map((guardian) => (
                <div key={guardian.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-semibold">{guardian.guardianName}</p>
                  <p className="text-muted-foreground">{guardian.guardianEmail} ΓÇó {guardian.relationship}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ban Appeals</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <textarea value={banAppeal} onChange={(event) => setBanAppeal(event.target.value)} placeholder="Explain your appeal" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Button onClick={() => void submitBanAppeal(banAppeal).then(() => { setBanAppeal(""); refresh(); })}>Submit Appeal</Button>
              {appeals.map((appeal) => (
                <div key={appeal.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-semibold">{appeal.status}</p>
                  <p>{appeal.message}</p>
                  {appeal.reviewNote ? <p className="mt-1 text-muted-foreground">{appeal.reviewNote}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Community Trust</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border p-3 text-sm">
                <p className="font-semibold">{trust.reputationScore}</p>
                <p className="text-muted-foreground">Reputation score</p>
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <p className="font-semibold">{trust.trustedReporter ? "Trusted reporter" : "Standard member"}</p>
              </div>
              <textarea value={reporterNomination} onChange={(event) => setReporterNomination(event.target.value)} placeholder="Why should you be a trusted reporter?" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Button onClick={() => void nominateTrustedReporter(reporterNomination).then(() => setReporterNomination(""))}>Nominate Me</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function SecurityPage() {
  return (
    <AuthProvider>
      <SecurityPageContent />
    </AuthProvider>
  );
}
