import { afterEach, describe, expect, it, vi } from "vitest";

async function loadHomeMetadata() {
  vi.stubEnv("NEXT_PUBLIC_SHOW_ALERT_OFFER", undefined);
  vi.resetModules();

  return (await import("@/app/page")).metadata;
}

afterEach(() => vi.unstubAllEnvs());

describe("absoluteUrl", () => {
  it("normalizes site-relative paths against the canonical origin", async () => {
    const { absoluteUrl } = await import("@/lib/seo/metadata");

    expect(absoluteUrl("/")).toBe("https://codereset.dev/");
    expect(absoluteUrl("guides/weekly-limit")).toBe(
      "https://codereset.dev/guides/weekly-limit",
    );
    expect(absoluteUrl("/guides/../guides/weekly-limit")).toBe(
      "https://codereset.dev/guides/weekly-limit",
    );
  });

  it("rejects URLs on a different origin", async () => {
    const { absoluteUrl } = await import("@/lib/seo/metadata");

    expect(() => absoluteUrl("https://example.com/guides/weekly-limit")).toThrow(
      /canonical origin/i,
    );
    expect(() => absoluteUrl("//example.com/guides/weekly-limit")).toThrow(
      /canonical origin/i,
    );
  });
});

describe("route metadata", () => {
  it("gives the homepage an absolute self-canonical and matching Open Graph URL", async () => {
    const metadata = await loadHomeMetadata();

    expect(metadata.alternates?.canonical).toBe("https://codereset.dev/");
    expect(metadata.openGraph).toMatchObject({
      url: "https://codereset.dev/",
    });
  });

  it("gives each guide an absolute self-canonical and matching Open Graph URL", async () => {
    const { generateMetadata } = await import("@/app/guides/[slug]/page");

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "weekly-limit" }),
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://codereset.dev/guides/weekly-limit",
    );
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "https://codereset.dev/guides/weekly-limit",
    });
  });

  it("does not create metadata for an unknown guide", async () => {
    const { generateMetadata } = await import("@/app/guides/[slug]/page");

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "missing-guide" }) }),
    ).resolves.toEqual({});
  });

  it("keeps the root layout from supplying an inherited canonical", async () => {
    const { metadata } = await import("@/app/layout");

    expect(metadata.metadataBase).toEqual(new URL("https://codereset.dev"));
    expect(metadata).not.toHaveProperty("alternates.canonical");
  });
});
