"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRolePermissionMatrix, updateRolePermissionMatrix, type StaffPermissionMatrix } from "@/lib/phase8";
import {
  getOrganizationTeams,
  getTeamEvents,
  getTeamTryouts,
  updateOrganizationPermissions,
  type TeamRecord,
} from "@/lib/teams";

function OrgPageContent() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [tryoutCount, setTryoutCount] = useState(0);
  const [matrices, setMatrices] = useState<Record<string, StaffPermissionMatrix>>({});

  const refreshTeams = async () => {
    const managedTeams = await getOrganizationTeams();
    setTeams(managedTeams);

    const eventResults = await Promise.all(managedTeams.map((team: TeamRecord) => getTeamEvents(team.id)));
    const tryoutResults = await Promise.all(managedTeams.map((team: TeamRecord) => getTeamTryouts(team.id)));
    const matrixResults = await Promise.all(managedTeams.map((team: TeamRecord) => getRolePermissionMatrix(team.id)));

    setEventCount(eventResults.flat().length);
    setTryoutCount(tryoutResults.flat().length);
    setMatrices(Object.fromEntries(matrixResults.map((matrix) => [matrix.teamId, matrix])));
  };

  useEffect(() => {
    void refreshTeams();
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Organization Dashboard</h1>
          <p className="text-muted-foreground">Manage multiple team spaces, events, announcements, tryout demand, and member permissions from one place.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{teams.length}</div><div className="text-sm text-muted-foreground">Managed teams</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{eventCount}</div><div className="text-sm text-muted-foreground">Upcoming events</div></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{tryoutCount}</div><div className="text-sm text-muted-foreground">Tryout applications</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Managed Teams</CardTitle>
            <CardDescription>Jump into each team workspace, or manage org permission badges for each member here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teams.map((team) => (
              <div key={team.id} className="rounded-xl border p-4">
                <Link href={`/teams/${team.id}`} className="block hover:bg-muted/40">
                  <p className="font-semibold">{team.name}</p>
                  <p className="text-sm text-muted-foreground">{[team.sport, team.location].filter(Boolean).join(" • ")}</p>
                  <p className="mt-2 text-sm">{team.bio}</p>
                </Link>
                <div className="mt-4 space-y-2 border-t pt-3">
                  {team.members.map((member) => (
                    <div key={member.uid} className="rounded-lg bg-muted p-3">
                      <p className="font-medium">{member.displayName}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(["manage_roster", "manage_events", "manage_content", "manage_recruiting"] as const).map((permission) => {
                          const active = member.orgPermissions?.includes(permission) ?? false;
                          return (
                            <button
                              key={permission}
                              type="button"
                              className={`rounded-full border px-2 py-1 text-xs ${active ? "border-primary bg-primary/5 text-primary" : ""}`}
                              onClick={() =>
                                void updateOrganizationPermissions(
                                  team.id,
                                  member.uid,
                                  active
                                    ? (member.orgPermissions ?? []).filter((item) => item !== permission)
                                    : [...(member.orgPermissions ?? []), permission]
                                ).then(async () => setTeams(await getOrganizationTeams()))
                              }
                            >
                              {permission}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Permissions Matrix</CardTitle>
            <CardDescription>Set default capabilities by role so staff management is consistent across each team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teams.map((team) => {
              const matrix = matrices[team.id];
              const roleEntries = Object.entries(matrix?.roles ?? {});

              return (
                <div key={team.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{team.name}</p>
                      <p className="text-sm text-muted-foreground">Role-based staff permissions</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => matrix ? void updateRolePermissionMatrix(team.id, matrix.roles) : undefined}
                    >
                      Save Matrix
                    </Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {roleEntries.map(([role, permissions]) => (
                      <div key={`${team.id}-${role}`} className="rounded-lg bg-muted p-3">
                        <p className="font-medium capitalize">{role}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(["manage_roster", "manage_events", "manage_content", "manage_recruiting"] as const).map((permission) => {
                            const enabled = permissions.includes(permission) || permissions.includes("all");
                            return (
                              <button
                                key={`${team.id}-${role}-${permission}`}
                                type="button"
                                className={`rounded-full border px-2 py-1 text-xs ${enabled ? "border-primary bg-primary/5 text-primary" : ""}`}
                                onClick={() =>
                                  setMatrices((current) => {
                                    const nextMatrix = current[team.id];
                                    if (!nextMatrix) {
                                      return current;
                                    }

                                    const nextPermissions = nextMatrix.roles[role] ?? [];
                                    const canToggle = nextPermissions.includes(permission);
                                    return {
                                      ...current,
                                      [team.id]: {
                                        ...nextMatrix,
                                        roles: {
                                          ...nextMatrix.roles,
                                          [role]: canToggle
                                            ? nextPermissions.filter((item) => item !== permission)
                                            : [...nextPermissions.filter((item) => item !== "all"), permission],
                                        },
                                      },
                                    };
                                  })
                                }
                              >
                                {permission}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function OrgPage() {
  return (
    <AuthProvider>
      <OrgPageContent />
    </AuthProvider>
  );
}
