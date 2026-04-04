"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCreatorNewsletterIssues, getCreatorSubscribersCount, getSeoProfilePageData, subscribeToCreatorNewsletter, type NewsletterIssue } from "@/lib/phase6";

export default function NewsletterLandingPage({ params }: { params: { uid: string } }) {
  const [email, setEmail] = useState("");
  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [title, setTitle] = useState("Join my HoopLink updates");
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [creatorName, setCreatorName] = useState("HoopLink Creator");

  useEffect(() => {
    void Promise.all([
      getCreatorNewsletterIssues(params.uid),
      getCreatorSubscribersCount(params.uid),
      getSeoProfilePageData(params.uid),
    ]).then(([nextIssues, nextCount, seo]) => {
      setIssues(nextIssues.filter((issue: NewsletterIssue) => !issue.subscriberOnly).slice(0, 5));
      setSubscriberCount(nextCount);
      setTitle(String((seo.profile as { growth?: { subscriberLandingTitle?: string } } | null)?.growth?.subscriberLandingTitle ?? "Join my HoopLink updates"));
      setCreatorName(String((seo.profile as { displayName?: string } | null)?.displayName ?? "HoopLink Creator"));
    });
  }, [params.uid]);

  return (
    <div className="mx-auto max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{creatorName} has {subscriberCount} newsletter subscriber(s).</p>
          <div className="flex gap-3">
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="h-10 flex-1 rounded-md border border-input px-3 text-sm" />
            <Button onClick={() => void subscribeToCreatorNewsletter(params.uid, email).then(() => setEmail(""))}>Subscribe</Button>
          </div>
          <div className="space-y-3">
            {issues.map((issue) => (
              <div key={issue.id} className="rounded-xl border p-4">
                <p className="font-semibold">{issue.title}</p>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{issue.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
