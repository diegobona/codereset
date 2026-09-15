import type { MetadataRoute } from "next";
import { guides } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-15T00:00:00.000Z");
  return [
    { url: "https://codereset.dev", lastModified, changeFrequency: "daily", priority: 1 },
    ...guides.map((guide) => ({
      url: `https://codereset.dev/guides/${guide.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
