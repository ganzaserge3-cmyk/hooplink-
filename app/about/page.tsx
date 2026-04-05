import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn what HoopLink is building for athletes, coaches, scouts, creators, and sports communities.",
  alternates: {
    canonical: buildSiteUrl("/about"),
  },
};

const pillars = [
  {
    title: "Show your game",
    description: "Post clips, practice work, and milestones so coaches and scouts can see your progress.",
  },
  {
    title: "Find your people",
    description: "Connect athletes, coaches, scouts, and fans around the same sport ecosystem.",
  },
  {
    title: "Train smarter",
    description: "Use the AI Coach experience as a guided first step for drills, mindset, and recovery.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl py-10">
      <div className="mb-10 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">About HoopLink</p>
        <h1 className="mb-4 text-4xl font-bold">A sports network built around growth, not noise.</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          HoopLink is designed to help athletes build visibility, help coaches discover talent, and give every sports community a cleaner place to share progress.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title}>
            <CardHeader>
              <CardTitle className="text-xl">{pillar.title}</CardTitle>
              <CardDescription>{pillar.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-10 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Ready to build your profile?</h2>
            <p className="text-muted-foreground">
              Join the network and start shaping your athletic story.
            </p>
          </div>
          <Button asChild>
            <Link href="/signup">Create your account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
