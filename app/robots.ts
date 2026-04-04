import type { MetadataRoute } from "next";

import { buildSiteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/community", "/discover", "/events", "/teams", "/training", "/blog", "/fan-hub"],
        disallow: [
          "/admin",
          "/analytics",
          "/api",
          "/billing",
          "/bookings",
          "/complete-profile",
          "/drafts",
          "/edit-profile",
          "/feed",
          "/history",
          "/login",
          "/messages",
          "/notifications",
          "/profile",
          "/saved",
          "/search",
          "/settings",
          "/signup",
          "/upload",
          "/verify",
        ],
      },
    ],
    host: siteConfig.domain,
    sitemap: buildSiteUrl("/sitemap.xml"),
  };
}
