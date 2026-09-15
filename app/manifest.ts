import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CodeReset — Codex quota desk",
    short_name: "CodeReset",
    description: "Private Codex quota countdowns and public reset signal tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1efe8",
    theme_color: "#10120f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
