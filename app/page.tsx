import type { Metadata } from "next";
import Script from "next/script";

import HomePageClient from "@/app/HomePageClient";
import { buildSiteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Athlete Profiles, Basketball Highlights, Recruiting, And Sports Networking",
  description:
    "Build an athlete profile, share basketball highlights and reels, connect with coaches and scouts, and grow your sports brand on HoopLink.",
  alternates: {
    canonical: buildSiteUrl("/"),
  },
  openGraph: {
    title: "HoopLink | Athlete Profiles, Highlights, And Recruiting",
    description:
      "Create a sports profile, post highlights, grow your audience, and get discovered by coaches, scouts, and teams.",
    url: buildSiteUrl("/"),
  },
  twitter: {
    title: "HoopLink | Athlete Profiles, Highlights, And Recruiting",
    description:
      "Create a sports profile, post highlights, grow your audience, and get discovered by coaches, scouts, and teams.",
  },
};

const homePageStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "HoopLink Home",
  url: buildSiteUrl("/"),
  description:
    "HoopLink helps athletes create profiles, publish highlights, connect with coaches and scouts, and grow in sports.",
  isPartOf: {
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.domain,
  },
  about: [
    "athlete profiles",
    "basketball highlights",
    "sports recruiting",
    "sports creators",
    "coach and scout discovery",
  ],
};

export default function HomePage() {
  return (
    <>
      <Script
        id="homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageStructuredData) }}
      />
      <HomePageClient />
    </>
  );
}
