export const siteConfig = {
  name: "HoopLink",
  shortName: "HoopLink",
  description:
    "HoopLink is a sports social platform for athletes, coaches, scouts, teams, creators, and fans to build profiles, share highlights, grow audiences, and discover recruiting opportunities.",
  tagline: "Athlete Profiles, Highlights, Recruiting, And Sports Networking",
  domain:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://hooperlink.vercel.app",
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
    "athlete profile website",
    "sports recruiting platform",
    "basketball recruiting profile",
    "player highlights website",
    "sports creator platform",
    "scout athlete search",
    "sports social app",
    "basketball recruiting",
  ],
} as const;

export const publicRoutes = [
  "",
  "/about",
  "/athlete",
  "/community",
  "/discover",
  "/events",
  "/fan-hub",
  "/leaderboards",
  "/marketplace",
  "/recruiting",
  "/search",
  "/spotlights",
  "/training",
  "/blog",
] as const;

export function buildSiteUrl(path = "") {
  const base = siteConfig.domain.endsWith("/") ? siteConfig.domain.slice(0, -1) : siteConfig.domain;
  const normalizedPath = path.startsWith("/") || path === "" ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
