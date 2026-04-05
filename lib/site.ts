export const siteConfig = {
  name: "HoopLink",
  shortName: "HoopLink",
  description:
    "HoopLink is a sports social platform where athletes, coaches, scouts, creators, teams, and fans connect, share highlights, discover opportunities, and grow together.",
  tagline: "The Sports Network For Athletes, Coaches, Scouts, And Creators",
  domain:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://hooplink.ganzaserge3.workers.dev",
  ogImage: "/icon.svg",
  keywords: [
    "HoopLink",
    "sports social platform",
    "athlete social network",
    "sports app",
    "basketball app",
    "athlete profiles",
    "sports creators",
    "sports community",
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
  "/fan-hub",
  "/leaderboards",
  "/spotlights",
  "/teams",
  "/training",
  "/blog",
] as const;

export function buildSiteUrl(path = "") {
  const base = siteConfig.domain.endsWith("/") ? siteConfig.domain.slice(0, -1) : siteConfig.domain;
  const normalizedPath = path.startsWith("/") || path === "" ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
