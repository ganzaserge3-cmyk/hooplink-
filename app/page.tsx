import type { Metadata } from "next";

import HomePageClient from "@/app/HomePageClient";
import { buildSiteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sports Social Platform For Athletes, Coaches, Scouts, And Creators",
  description:
    "Join HoopLink to build your athlete profile, share highlights, discover talent, connect with coaches and scouts, and grow your sports brand.",
  alternates: {
    canonical: buildSiteUrl("/"),
  },
  openGraph: {
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description:
      "Build your profile, share highlights, and connect with athletes, coaches, scouts, and creators on HoopLink.",
    url: buildSiteUrl("/"),
  },
  twitter: {
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description:
      "Build your profile, share highlights, and connect with athletes, coaches, scouts, and creators on HoopLink.",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
