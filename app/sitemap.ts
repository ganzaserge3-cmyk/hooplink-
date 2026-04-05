import type { MetadataRoute } from "next";

import { buildSiteUrl, publicRoutes } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const priorities: Record<string, number> = {
    "": 1,
    "/about": 0.9,
    "/athlete": 0.8,
    "/discover": 0.9,
    "/community": 0.8,
    "/events": 0.8,
    "/marketplace": 0.8,
    "/recruiting": 0.8,
    "/search": 0.7,
    "/teams": 0.8,
    "/spotlights": 0.8,
    "/fan-hub": 0.8,
  };

  return publicRoutes.map((route) => ({
    url: buildSiteUrl(route),
    lastModified: now,
    changeFrequency: route === "" ? "daily" : route === "/events" || route === "/discover" ? "daily" : "weekly",
    priority: priorities[route] ?? 0.7,
  }));
}
