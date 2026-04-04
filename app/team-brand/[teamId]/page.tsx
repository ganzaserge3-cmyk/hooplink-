"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { donateToFundraiser, getBrandedTeamPageData } from "@/lib/phase6";

export default function TeamBrandPage({ params }: { params: { teamId: string } }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getBrandedTeamPageData>> | null>(null);

  useEffect(() => {
    void getBrandedTeamPageData(params.teamId).then(setData);
  }, [params.teamId]);

  if (!data?.team) {
    return <div className="mx-auto max-w-3xl py-10">Team not found.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl py-10">
      <section className="rounded-3xl border bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-8">
        <h1 className="text-4xl font-bold">{data.team.name}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{[data.team.sport, data.team.location].filter(Boolean).join(" • ")}</p>
        <p className="mt-4 max-w-2xl">{data.team.bio}</p>
        <div className="mt-6 flex gap-3">
          <Link href={`/teams/${params.teamId}`} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Team Page</Link>
          <Link href={`/brackets?team=${params.teamId}`} className="rounded-xl border px-5 py-3 font-semibold">Brackets</Link>
        </div>
      </section>
      <section className="mt-8 rounded-2xl border p-5">
        <h2 className="text-xl font-semibold">Fundraising</h2>
        <div className="mt-4 space-y-3">
          {data.fundraisers.map((fundraiser: { id: string; title: string; description: string; goalAmount: number; raisedAmount: number }) => {
            const percent = fundraiser.goalAmount ? Math.min(100, Math.round((fundraiser.raisedAmount / fundraiser.goalAmount) * 100)) : 0;
            return (
              <div key={fundraiser.id} className="rounded-xl border p-4">
                <p className="font-semibold">{fundraiser.title}</p>
                <p className="text-sm text-muted-foreground">{fundraiser.description}</p>
                <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} /></div>
                <p className="mt-2 text-xs text-muted-foreground">${fundraiser.raisedAmount} / ${fundraiser.goalAmount}</p>
                <button className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={() => void donateToFundraiser(fundraiser.id, 25)}>Support Team</button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
