export const siteConfig = {
  name: "HoopLink",
  shortName: "HoopLink",
  description:
    "HoopLink is a basketball community app where players, coaches, scouts, and fans connect, share highlights, discover opportunities, and grow together on and off the court.",
  tagline: "Where Basketball Connects",
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hooplink.app",
  ogImage: "/icon.svg",
  keywords: [
    "HoopLink",
    "basketball app",
    "basketball community",
    "athlete network",
    "coach scouting platform",
    "basketball highlights",
    "sports social app",
    "basketball recruiting",
  ],
} as const;

export const publicRoutes = [
  "",
  "/about",
  "/community",
  "/discover",
  "/events",
  "/leaderboards",
  "/teams",
  "/training",
  "/blog",
  "/fan-hub",
] as const;

export function buildSiteUrl(path = "") {
  const base = siteConfig.domain.endsWith("/") ? siteConfig.domain.slice(0, -1) : siteConfig.domain;
  const normalizedPath = path.startsWith("/") || path === "" ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
