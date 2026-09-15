import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type JsonLd = {
  "@type"?: string;
  "@graph"?: JsonLd[];
  [key: string]: unknown;
};

function renderedDocument(element: ReactNode) {
  document.body.innerHTML = renderToStaticMarkup(element);
  return document;
}

function jsonLdEntities(page: Document) {
  return Array.from(
    page.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
  ).flatMap((script) => {
    const parsed = JSON.parse(script.textContent ?? "null") as JsonLd | JsonLd[];
    const roots = Array.isArray(parsed) ? parsed : [parsed];

    return roots.flatMap((root) => root["@graph"] ?? [root]);
  });
}

function pngDimensions(path: string) {
  const png = readFileSync(path);

  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

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

describe("structured data builders", () => {
  it("builds the site and application entities from canonical site facts", async () => {
    const { softwareApplicationSchema, websiteSchema } = await import(
      "@/lib/seo/schema"
    );

    expect(websiteSchema()).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "CodeReset",
      url: "https://codereset.dev/",
      description:
        "A private Codex quota countdown, reset signal radar, and practical field guide for AI coding limits.",
      inLanguage: "en",
    });
    expect(softwareApplicationSchema()).toMatchObject({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "CodeReset",
      url: "https://codereset.dev/",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
    });
  });

  it("builds article, FAQ, and breadcrumb entities with canonical URLs", async () => {
    const { articleSchema, breadcrumbSchema, faqSchema } = await import(
      "@/lib/seo/schema"
    );
    const pagePath = "/guides/weekly-limit";
    const questions = [
      { question: "Does every account reset on Monday?", answer: "No." },
    ];

    expect(
      articleSchema({
        title: "When does the Codex weekly limit reset?",
        description: "Use the account-specific reset time.",
        path: pagePath,
        dateModified: "2026-09-15",
      }),
    ).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "When does the Codex weekly limit reset?",
      dateModified: "2026-09-15",
      mainEntityOfPage: "https://codereset.dev/guides/weekly-limit",
      author: { "@type": "Organization", name: "CodeReset" },
      publisher: { "@type": "Organization", name: "CodeReset" },
    });
    expect(faqSchema(questions)).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: questions[0].question,
          acceptedAnswer: { "@type": "Answer", text: questions[0].answer },
        },
      ],
    });
    expect(
      breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Field manual", path: "/#field-manual" },
        { name: "Weekly limit", path: pagePath },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://codereset.dev/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Field manual",
          item: "https://codereset.dev/#field-manual",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Weekly limit",
          item: "https://codereset.dev/guides/weekly-limit",
        },
      ],
    });
  });

  it("renders homepage entities from the same FAQ copy visitors can read", async () => {
    const [{ default: HomePage }, { faqs }] = await Promise.all([
      import("@/app/page"),
      import("@/lib/content"),
    ]);
    const page = renderedDocument(HomePage());
    const entities = jsonLdEntities(page);
    const homepageFaq = entities.find((entity) => entity["@type"] === "FAQPage");

    expect(entities.map((entity) => entity["@type"])).toEqual([
      "WebSite",
      "SoftwareApplication",
      "FAQPage",
    ]);
    expect(homepageFaq).toMatchObject({
      mainEntity: faqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    });
    for (const { question, answer } of faqs) {
      expect(page.body.textContent).toContain(question);
      expect(page.body.textContent).toContain(answer);
    }
  });

  it("renders guide entities plus visible breadcrumbs from the current guide", async () => {
    const [{ default: GuidePage }, { getGuide }] = await Promise.all([
      import("@/app/guides/[slug]/page"),
      import("@/lib/content"),
    ]);
    const guide = getGuide("weekly-limit");
    if (!guide) throw new Error("Test guide is missing");

    const page = renderedDocument(
      await GuidePage({ params: Promise.resolve({ slug: guide.slug }) }),
    );
    const entities = jsonLdEntities(page);
    const breadcrumbs = page.querySelector('nav[aria-label="Breadcrumb"]');

    expect(entities.map((entity) => entity["@type"])).toEqual([
      "Article",
      "FAQPage",
      "BreadcrumbList",
    ]);
    expect(entities.find((entity) => entity["@type"] === "Article")).toMatchObject({
      headline: guide.title,
      description: guide.description,
      dateModified: guide.lastReviewed,
      mainEntityOfPage: `https://codereset.dev/guides/${guide.slug}`,
    });
    expect(entities.find((entity) => entity["@type"] === "FAQPage")).toMatchObject({
      mainEntity: guide.faqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    });
    expect(breadcrumbs?.textContent).toContain("Home");
    expect(breadcrumbs?.textContent).toContain("Field manual");
    expect(breadcrumbs?.textContent).toContain(guide.title);
  });

  it("keeps guide breadcrumbs visible when the primary navigation is hidden", () => {
    const styles = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8",
    );

    expect(styles).toMatch(/\.guide-breadcrumb\s*\{[^}]*display:\s*block;/);
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

  it("uses distinct, existing 1200 by 630 social images for home and guides", async () => {
    const homeMetadata = await loadHomeMetadata();
    const { generateMetadata } = await import("@/app/guides/[slug]/page");
    const guideMetadata = await generateMetadata({
      params: Promise.resolve({ slug: "weekly-limit" }),
    });

    expect(homeMetadata.openGraph).toMatchObject({
      images: [
        {
          url: "https://codereset.dev/og-default.png",
          width: 1200,
          height: 630,
          alt: "CodeReset private Codex quota countdown",
        },
      ],
    });
    expect(homeMetadata.twitter).toMatchObject({
      images: [
        {
          url: "https://codereset.dev/og-default.png",
          alt: "CodeReset private Codex quota countdown",
        },
      ],
    });
    expect(guideMetadata.openGraph).toMatchObject({
      images: [
        {
          url: "https://codereset.dev/og-guides.png",
          width: 1200,
          height: 630,
          alt: "CodeReset field manual for Codex usage limits",
        },
      ],
    });
    expect(guideMetadata.twitter).toMatchObject({
      images: [
        {
          url: "https://codereset.dev/og-guides.png",
          alt: "CodeReset field manual for Codex usage limits",
        },
      ],
    });

    expect(pngDimensions(join(process.cwd(), "public", "og-default.png"))).toEqual({
      width: 1200,
      height: 630,
    });
    expect(pngDimensions(join(process.cwd(), "public", "og-guides.png"))).toEqual({
      width: 1200,
      height: 630,
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
