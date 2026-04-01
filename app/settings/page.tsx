"use client";

import { FormEvent, useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  getCurrentUserSettings,
  requestPushNotificationPermission,
  syncPushNotificationPreference,
  updateCurrentUserSettings,
  type UserSettings,
} from "@/lib/settings";
import {
  getNotificationDigest,
  getPushDevices,
  registerPushDevice,
  sendTestEmailDigest,
  sendTestPushAlert,
  type PushDeviceRecord,
} from "@/lib/notifications";
import { auth } from "@/lib/firebase";

function SettingsPageContent() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [devices, setDevices] = useState<PushDeviceRecord[]>([]);
  const [deviceForm, setDeviceForm] = useState({ label: "", token: "" });

  useEffect(() => {
    void getCurrentUserSettings().then(setSettings);
    void getPushDevices().then(setDevices);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) {
      return;
    }

    setSaving(true);
    try {
      await updateCurrentUserSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage notification preferences, profile availability, and the vibe of your public presence.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <h3 className="font-semibold">Availability</h3>
                <select
                  value={settings.availabilityStatus}
                  onChange={(event) =>
                    setSettings((current) =>
                      current ? { ...current, availabilityStatus: event.target.value as UserSettings["availabilityStatus"] } : current
                    )
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="available">Available</option>
                  <option value="locked_in">Locked In</option>
                  <option value="recovering">Recovering</option>
                </select>
                <input
                  value={settings.headline}
                  onChange={(event) =>
                    setSettings((current) => (current ? { ...current, headline: event.target.value } : current))
                  }
                  placeholder="Short public headline"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Notifications</h3>
                {Object.entries(settings.notificationPreferences).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                    <span className="capitalize">{key}</span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(event) =>
                        setSettings((current) =>
                          current
                            ? {
                                ...current,
                                notificationPreferences: {
                                  ...current.notificationPreferences,
                                  [key]: event.target.checked,
                                },
                              }
                            : current
                        )
                      }
                    />
                  </label>
                ))}
                <div className="rounded-xl border p-3">
                  <p className="mb-2 text-sm font-medium">Email Digest</p>
                  <select
                    value={settings.emailDigestFrequency}
                    onChange={(event) =>
                      setSettings((current) =>
                        current
                          ? {
                              ...current,
                              emailDigestFrequency: event.target.value as UserSettings["emailDigestFrequency"],
                            }
                          : current
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="off">Off</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Browser Alerts</p>
                      <p className="text-xs text-muted-foreground">
                        Permission: {settings.pushPermission}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.pushNotificationsEnabled}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSettings((current) =>
                          current
                            ? { ...current, pushNotificationsEnabled: checked }
                            : current
                        );
                        if (!checked) {
                          void syncPushNotificationPreference(false);
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      void requestPushNotificationPermission().then((permission) =>
                        setSettings((current) =>
                          current
                            ? {
                                ...current,
                                pushPermission: permission === "default" ? "default" : permission,
                                pushNotificationsEnabled: permission === "granted",
                              }
                            : current
                        )
                      )
                    }
                  >
                    Request Browser Permission
                  </Button>
                </div>
                <div className="rounded-xl border p-3 space-y-3">
                  <p className="text-sm font-medium">Delivery Backends</p>
                  <div className="flex gap-2">
                    <input
                      className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                      placeholder="Device label"
                      value={deviceForm.label}
                      onChange={(event) => setDeviceForm((current) => ({ ...current, label: event.target.value }))}
                    />
                    <input
                      className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                      placeholder="Push token / endpoint"
                      value={deviceForm.token}
                      onChange={(event) => setDeviceForm((current) => ({ ...current, token: event.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        void registerPushDevice({ label: deviceForm.label, token: deviceForm.token }).then(async () => {
                          setDeviceForm({ label: "", token: "" });
                          setDevices(await getPushDevices());
                        })
                      }
                    >
                      Save
                    </Button>
                  </div>
                  {devices.map((device) => (
                    <div key={device.id} className="rounded-lg bg-muted p-3 text-sm">
                      <p className="font-medium">{device.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{device.token}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() =>
                          void sendTestPushAlert({
                            token: device.token,
                            title: "HoopLink Test Push",
                            body: "Your push backend is wired correctly.",
                          })
                        }
                      >
                        Send Test Push
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const digest = await getNotificationDigest();
                      if (auth?.currentUser?.email) {
                        await sendTestEmailDigest(auth.currentUser.email, digest);
                      }
                    }}
                  >
                    Send Test Email Digest
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save settings"}
              </Button>
              <div className="flex flex-wrap gap-2">
                <Link href="/platform" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">Platform Ops</Link>
                <Link href="/intelligence" className="rounded-full border px-3 py-2 text-sm hover:bg-muted/40">AI & Intelligence</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function SettingsPage() {
  return (
    <AuthProvider>
      <SettingsPageContent />
    </AuthProvider>
  );
}
