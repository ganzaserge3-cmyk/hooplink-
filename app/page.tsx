import type { Metadata } from "next";
import HomePageClient from "@/app/HomePageClient";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Where Basketball Connects",
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <HomePageClient />;
}
