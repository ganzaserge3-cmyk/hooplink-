"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteUploadDraft, getUploadDrafts, type UploadDraft } from "@/lib/drafts";
import { formatTimeAgo } from "@/lib/posts";

function DraftsPageContent() {
  const [drafts, setDrafts] = useState<UploadDraft[]>([]);

  const refreshDrafts = async () => {
    setDrafts(await getUploadDrafts());
  };

  useEffect(() => {
    void refreshDrafts();
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Drafts</CardTitle>
            <CardDescription>Saved upload ideas you can come back to before publishing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {drafts.length === 0 ? (
              <div className="rounded-xl bg-muted p-6 text-sm text-muted-foreground">No drafts yet. Save one from the upload page.</div>
            ) : (
              drafts.map((draft) => (
                <div key={draft.id} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="font-medium">{draft.caption || "Untitled draft"}</p>
                    <p className="text-sm text-muted-foreground">
                      {[draft.contentType, draft.sport, formatTimeAgo(draft.createdAt)].filter(Boolean).join(" • ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[draft.postType, draft.scheduledFor ? `Scheduled ${draft.scheduledFor}` : "", draft.remixPostId ? "Remix" : ""]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link href={`/upload?draft=${draft.id}`}>Open</Link>
                    </Button>
                    <Button variant="outline" onClick={() => void deleteUploadDraft(draft.id).then(refreshDrafts)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function DraftsPage() {
  return (
    <AuthProvider>
      <DraftsPageContent />
    </AuthProvider>
  );
}
