"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { donateToFundraiser, getSeoProfilePageData, type FundraiserRecord, type MerchProductRecord } from "@/lib/phase6";
import { type FeedPost, subscribeToUserPosts } from "@/lib/posts";

export default function AthleteLandingPage({ params }: { params: { uid: string } }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getSeoProfilePageData>> | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [fundraisers, setFundraisers] = useState<FundraiserRecord[]>([]);

  useEffect(() => {
    void getSeoProfilePageData(params.uid).then((next) => setData(next));
    return subscribeToUserPosts(params.uid, setPosts);
  }, [params.uid]);

  useEffect(() => {
    void import("@/lib/phase6").then(async (mod) => {
      const all = await mod.getOwnedFundraisers();
      setFundraisers(all.filter((item: FundraiserRecord) => item.ownerRefId === params.uid || item.ownerId === params.uid));
    });
  }, [params.uid]);

  const profile = data?.profile as { displayName?: string; role?: { sport?: string; position?: string; bio?: string }; growth?: { storefrontHeadline?: string }; business?: { supportUrl?: string } } | null;
  const merch = (data?.merch ?? []) as MerchProductRecord[];

  return (
    <div className="mx-auto max-w-5xl py-10">
      <section className="rounded-3xl border bg-gradient-to-r from-primary/10 to-secondary/10 p-8">
        <h1 className="text-4xl font-bold">{profile?.displayName || "Athlete"}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{[profile?.role?.sport, profile?.role?.position].filter(Boolean).join(" • ")}</p>
        <p className="mt-4 max-w-2xl">{profile?.role?.bio || "Discover highlights, stats, merch drops, newsletters, and recruiting updates."}</p>
        {profile?.growth?.storefrontHeadline ? <p className="mt-4 text-primary font-medium">{profile.growth.storefrontHeadline}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/profile/${params.uid}`} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Open Profile</Link>
          <Link href={`/newsletter/${params.uid}`} className="rounded-xl border px-5 py-3 font-semibold">Newsletter</Link>
          <Link href={`/blog/${params.uid}`} className="rounded-xl border px-5 py-3 font-semibold">Blog</Link>
        </div>
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <h2 className="text-xl font-semibold">Fundraising</h2>
          <div className="mt-4 space-y-3">
            {fundraisers.map((fundraiser) => {
              const percent = fundraiser.goalAmount ? Math.min(100, Math.round((fundraiser.raisedAmount / fundraiser.goalAmount) * 100)) : 0;
              return (
                <div key={fundraiser.id} className="rounded-xl border p-4">
                  <p className="font-semibold">{fundraiser.title}</p>
                  <p className="text-sm text-muted-foreground">{fundraiser.description}</p>
                  <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} /></div>
                  <p className="mt-2 text-xs text-muted-foreground">${fundraiser.raisedAmount} / ${fundraiser.goalAmount}</p>
                  <button className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={() => void donateToFundraiser(fundraiser.id, 25)}>Donate $25</button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border p-5">
          <h2 className="text-xl font-semibold">Storefront</h2>
          <div className="mt-4 space-y-3">
            {merch.map((product) => (
              <div key={product.id} className="rounded-xl border p-4">
                <p className="font-semibold">{product.title}</p>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{product.priceLabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-8 rounded-2xl border p-5">
        <h2 className="text-xl font-semibold">Latest Highlights</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {posts.slice(0, 6).map((post) => (
            <div key={post.id} className="overflow-hidden rounded-xl border">
              {post.mediaType === "video" ? (
                <video src={post.mediaUrl} controls className="aspect-video w-full bg-black object-cover" />
              ) : (
                <img src={post.mediaUrl} alt={post.caption || "Highlight"} className="aspect-video w-full object-cover" />
              )}
              <div className="p-3 text-sm">{post.caption}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
