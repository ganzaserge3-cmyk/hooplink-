import Link from "next/link";

import { getPublicResumeData } from "@/lib/recruiting-readiness";

export default async function ResumePage({ params }: { params: { uid: string } }) {
  const data = await getPublicResumeData(params.uid);
  const profile = (data?.profile as Record<string, unknown> | null) ?? null;
  const readiness = data?.readiness;
  const role = ((profile?.role as Record<string, unknown> | undefined) ?? {});
  const athleteProfile = ((profile?.athleteProfile as Record<string, unknown> | undefined) ?? {});
  const stats = ((athleteProfile.stats as Record<string, unknown> | undefined) ?? {});

  if (!profile || !readiness) {
    return <div className="mx-auto max-w-3xl py-8">Resume not found.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="rounded-2xl border p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{String(profile.displayName ?? "HoopLink Athlete")}</h1>
            <p className="text-muted-foreground">
              {[String(role.sport ?? ""), String(role.position ?? ""), String(role.team ?? "")].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">@{String(profile.username ?? params.uid.slice(0, 8))}</p>
          </div>
          <Link href={`/media-kit/${params.uid}`} className="rounded-full border px-4 py-2 text-sm hover:bg-muted/40">Open Media Kit</Link>
        </div>
        <p className="mt-4">{String(role.bio ?? "No bio provided.")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h2 className="font-semibold">Academic Profile</h2>
          <p className="mt-3 text-sm">GPA: {readiness.academic.gpa || "Not listed"}</p>
          <p className="text-sm">Graduation Year: {readiness.academic.graduationYear || "Not listed"}</p>
          <p className="text-sm">Eligibility: {readiness.academic.eligibilityStatus || "Not listed"}</p>
          {readiness.academic.academicSummary ? <p className="mt-3 text-sm text-muted-foreground">{readiness.academic.academicSummary}</p> : null}
          {readiness.academic.transcriptUrl ? (
            <a href={readiness.academic.transcriptUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary underline">
              {readiness.academic.transcriptName || "View transcript"}
            </a>
          ) : null}
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="font-semibold">Athlete Snapshot</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted p-4 text-center"><div className="text-xl font-bold">{Number(stats.pointsPerGame ?? 0)}</div><div className="text-xs text-muted-foreground">PPG</div></div>
            <div className="rounded-xl bg-muted p-4 text-center"><div className="text-xl font-bold">{Number(stats.assistsPerGame ?? 0)}</div><div className="text-xs text-muted-foreground">APG</div></div>
            <div className="rounded-xl bg-muted p-4 text-center"><div className="text-xl font-bold">{Number(stats.reboundsPerGame ?? 0)}</div><div className="text-xs text-muted-foreground">RPG</div></div>
          </div>
          {Array.isArray(athleteProfile.skills) ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {(athleteProfile.skills as string[]).map((skill) => (
                <span key={skill} className="rounded-full bg-muted px-3 py-1 text-xs">{skill}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h2 className="font-semibold">Offers and Scholarships</h2>
          <div className="mt-3 space-y-3">
            {readiness.offers.map((offer) => (
              <div key={offer.id} className="rounded-xl border p-3 text-sm">
                <p className="font-semibold">{offer.schoolName}</p>
                <p className="text-muted-foreground">{offer.level} · {offer.packageLabel}</p>
                <p className="mt-1">{offer.status}</p>
              </div>
            ))}
            {readiness.scholarships.map((item) => (
              <div key={item.id} className="rounded-xl border p-3 text-sm">
                <p className="font-semibold">{item.schoolName}</p>
                <p className="text-muted-foreground">{item.amountLabel}</p>
                <p className="mt-1">{item.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="font-semibold">References</h2>
          <div className="mt-3 space-y-3">
            {readiness.referenceLetters.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block rounded-xl border p-3 text-sm hover:bg-muted/40">
                {item.title} · {item.authorName}
              </a>
            ))}
            {readiness.recommendationRequests.map((item) => (
              <div key={item.id} className="rounded-xl border p-3 text-sm">
                {item.coachName} · {item.coachEmail} · {item.status}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
