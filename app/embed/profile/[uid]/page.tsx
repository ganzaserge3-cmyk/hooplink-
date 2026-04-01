"use client";

import { useEffect, useState } from "react";

import { getUserProfileById } from "@/lib/user-profile";

export default function EmbeddedProfileWidget({ params }: { params: { uid: string } }) {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getUserProfileById>> | null>(null);

  useEffect(() => {
    void getUserProfileById(params.uid).then(setProfile);
  }, [params.uid]);

  const entry = profile as { displayName?: string; photoURL?: string; role?: { sport?: string; position?: string; team?: string }; settings?: { headline?: string } } | null;

  return (
    <div className="h-full w-full rounded-2xl border bg-background p-4">
      <div className="flex items-center gap-3">
        <img src={entry?.photoURL || "https://placehold.co/96x96?text=HL"} alt={entry?.displayName || "Profile"} className="h-16 w-16 rounded-full object-cover" />
        <div>
          <p className="font-semibold">{entry?.displayName || "HoopLink User"}</p>
          <p className="text-sm text-muted-foreground">{[entry?.role?.sport, entry?.role?.position, entry?.role?.team].filter(Boolean).join(" • ")}</p>
          {entry?.settings?.headline ? <p className="text-xs text-primary">{entry.settings.headline}</p> : null}
        </div>
      </div>
    </div>
  );
}
