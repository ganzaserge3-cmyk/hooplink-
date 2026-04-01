"use client";

import { useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { importStatsCsv } from "@/lib/phase5";

function StatsImportContent() {
  const [csvText, setCsvText] = useState("date,opponent,points,assists,rebounds,result\n2026-03-01,Tigers,24,6,8,W");
  const [status, setStatus] = useState("");

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Stats Import</CardTitle>
            <CardDescription>Paste a CSV to import game logs and update your public stat lines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              className="min-h-72 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button
              onClick={() =>
                void importStatsCsv(csvText).then(() => setStatus("Stats imported into your profile."))
              }
            >
              Import CSV
            </Button>
            {status ? <p className="text-sm text-primary">{status}</p> : null}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function StatsImportPage() {
  return (
    <AuthProvider>
      <StatsImportContent />
    </AuthProvider>
  );
}
