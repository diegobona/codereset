import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://codereset.dev/sitemap.xml",
    host: "https://codereset.dev",
  };
}
