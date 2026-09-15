import type { MetadataRoute } from "next";
import { publishedRoutes } from "@/lib/content/route-manifest";
import { absoluteUrl } from "@/lib/seo/metadata";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return publishedRoutes.map((route) => ({
    url: absoluteUrl(route.pathname),
    lastModified: new Date(`${route.lastModified}T00:00:00.000Z`),
    changeFrequency: route.kind === "home" ? "daily" : "monthly",
    priority:
      route.kind === "home"
        ? 1
        : route.kind === "tool"
          ? 0.85
          : route.kind === "guide"
            ? 0.75
            : 0.5,
  }));
}
