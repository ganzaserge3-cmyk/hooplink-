import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HoopLink",
    short_name: "HoopLink",
    description: "Sports social platform for athletes, coaches, scouts, creators, teams, and fans.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c1220",
    theme_color: "#22d3ee",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/maskable-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
