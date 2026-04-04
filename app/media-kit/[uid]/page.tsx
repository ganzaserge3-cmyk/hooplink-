import { getPublicResumeData, getSchoolFitScores } from "@/lib/recruiting-readiness";

export default async function MediaKitPage({ params }: { params: { uid: string } }) {
  const data = await getPublicResumeData(params.uid);
  const profile = (data?.profile as Record<string, unknown> | null) ?? null;
  const readiness = data?.readiness;
  const role = ((profile?.role as Record<string, unknown> | undefined) ?? {});
  const athleteProfile = ((profile?.athleteProfile as Record<string, unknown> | undefined) ?? {});

  if (!profile || !readiness) {
    return <div className="mx-auto max-w-4xl py-8">Media kit not found.</div>;
  }

  const fitScores = getSchoolFitScores(readiness, athleteProfile).slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-8 text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">HoopLink Media Kit</p>
        <h1 className="mt-4 text-4xl font-bold">{String(profile.displayName ?? "Athlete")}</h1>
        <p className="mt-2 text-white/80">
          {[String(role.sport ?? ""), String(role.position ?? ""), String(role.team ?? "")].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-4 max-w-2xl text-sm text-white/75">{String(role.bio ?? "No bio available.")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground">Academic</p>
          <p className="mt-2 text-2xl font-bold">{readiness.academic.gpa || "-"}</p>
          <p className="text-sm text-muted-foreground">GPA</p>
          <p className="mt-3 text-sm">Class of {readiness.academic.graduationYear || "TBD"}</p>
          <p className="text-sm">{readiness.academic.eligibilityStatus || "Eligibility not listed"}</p>
        </div>
        <div className="rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground">Interest Heat</p>
          <p className="mt-2 text-2xl font-bold">{readiness.interests.length}</p>
          <p className="text-sm text-muted-foreground">Tracked schools</p>
          <p className="mt-3 text-sm">{readiness.offers.length} offers · {readiness.scholarships.length} scholarships</p>
        </div>
        <div className="rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground">References</p>
          <p className="mt-2 text-2xl font-bold">{readiness.referenceLetters.length}</p>
          <p className="text-sm text-muted-foreground">Letters on file</p>
          <p className="mt-3 text-sm">{readiness.recommendationRequests.length} recommendation requests tracked</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h2 className="font-semibold">School Fit Scores</h2>
          <div className="mt-4 space-y-3">
            {fitScores.map((item) => (
              <div key={item.schoolName} className="rounded-xl bg-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.schoolName}</p>
                  <span className="text-sm text-muted-foreground">{item.fitScore}/99</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.notes || "No notes yet."}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="font-semibold">Offer Comparison</h2>
          <div className="mt-4 space-y-3">
            {readiness.offers.map((offer) => (
              <div key={offer.id} className="rounded-xl bg-muted p-4">
                <p className="font-semibold">{offer.schoolName}</p>
                <p className="text-sm text-muted-foreground">{offer.level} · {offer.packageLabel}</p>
                <p className="mt-2 text-sm">{offer.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
