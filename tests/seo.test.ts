import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

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

const fixtureDirectories: string[] = [];

afterEach(() => {
  for (const directory of fixtureDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function fixturePage({
  pathname,
  title,
  description,
  canonical = `https://codereset.dev${pathname}`,
  links = [],
  robots,
  ogImage = "https://codereset.dev/og.png",
  h1Count = 1,
  jsonLd = '{"@context":"https://schema.org","@type":"WebPage"}',
  anchors = [],
  namedAnchors = [],
}: {
  pathname: string;
  title: string;
  description: string | null;
  canonical?: string | null;
  links?: string[];
  robots?: string;
  ogImage?: string | null;
  h1Count?: number;
  jsonLd?: string;
  anchors?: string[];
  namedAnchors?: string[];
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <title>${title}</title>
    ${description ? `<meta name="description" content="${description}">` : ""}
    ${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
    ${robots ? `<meta name="robots" content="${robots}">` : ""}
    ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ""}
  </head>
  <body>
    ${Array.from({ length: h1Count }, () => `<h1>${title}</h1>`).join("\n")}
    ${anchors.map((id) => `<section id="${id}"></section>`).join("\n")}
    ${namedAnchors.map((name) => `<a name="${name}"></a>`).join("\n")}
    ${links.map((href) => `<a href="${href}">Link</a>`).join("\n")}
    <script type="application/ld+json">${jsonLd}</script>
  </body>
</html>`;
}

function createExportFixture({
  pages,
  sitemapPaths,
}: {
  pages: Array<{
    file: string;
    pathname: string;
    title: string;
    description: string | null;
    canonical?: string | null;
    links?: string[];
    robots?: string;
    ogImage?: string | null;
    h1Count?: number;
    jsonLd?: string;
    anchors?: string[];
    namedAnchors?: string[];
  }>;
  sitemapPaths: string[];
}) {
  const directory = mkdtempSync(join(tmpdir(), "codereset-seo-"));
  fixtureDirectories.push(directory);
  writeFileSync(join(directory, "og.png"), "fixture");

  for (const page of pages) {
    const path = join(directory, page.file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, fixturePage(page));
  }

  writeFileSync(
    join(directory, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapPaths
      .map((pathname) => `<url><loc>https://codereset.dev${pathname}</loc></url>`)
      .join("")}</urlset>`,
  );
  return directory;
}

function runExportValidator(directory: string) {
  return spawnSync(
    process.execPath,
    [join(process.cwd(), "scripts", "validate-export.mjs"), directory],
    { encoding: "utf8" },
  );
}

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
  it("builds the site entity from canonical site facts", async () => {
    const { websiteSchema } = await import("@/lib/seo/schema");

    expect(websiteSchema()).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "CodeReset",
      url: "https://codereset.dev/",
      description:
        "Paste your Codex Usage details to see five-hour and weekly reset countdowns and add a calendar reminder.",
      inLanguage: "en",
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

  it("does not publish FAQ structured data after removing the homepage FAQ", async () => {
    const { default: HomePage } = await import("@/app/page");
    const page = renderedDocument(HomePage());
    const entities = jsonLdEntities(page);

    expect(entities.map((entity) => entity["@type"])).toEqual(["WebSite"]);
    expect(entities).not.toContainEqual(
      expect.objectContaining({ "@type": "SoftwareApplication" }),
    );
    expect(entities).not.toContainEqual(
      expect.objectContaining({ "@type": "FAQPage" }),
    );
    expect(JSON.stringify(entities)).not.toMatch(
      /"(?:aggregateRating|review)":/,
    );
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
    expect(entities.find((entity) => entity["@type"] === "BreadcrumbList")).toMatchObject({
      itemListElement: [
        expect.objectContaining({ position: 1, name: "Home" }),
        expect.objectContaining({ position: 2, name: guide.title }),
      ],
    });
    expect(breadcrumbs?.textContent).toContain("Home");
    expect(breadcrumbs?.textContent).not.toContain("Field manual");
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

describe("published route manifest", () => {
  it("matches the sitemap in both directions without duplicate URLs", async () => {
    const manifestPath = join(
      process.cwd(),
      "lib",
      "content",
      "route-manifest.ts",
    );
    expect(existsSync(manifestPath)).toBe(true);

    const [{ publishedRoutes }, { default: sitemap }, { absoluteUrl }] =
      await Promise.all([
        import("@/lib/content/route-manifest"),
        import("@/app/sitemap"),
        import("@/lib/seo/metadata"),
      ]);
    const manifestUrls = publishedRoutes.map((route) =>
      absoluteUrl(route.pathname),
    );
    const sitemapUrls = sitemap().map((entry) => entry.url);

    expect(new Set(manifestUrls).size).toBe(manifestUrls.length);
    expect(new Set(sitemapUrls).size).toBe(sitemapUrls.length);
    expect(new Set(sitemapUrls)).toEqual(new Set(manifestUrls));
    expect(publishedRoutes).toContainEqual({
      pathname: "/guides",
      kind: "collection",
      slug: null,
      lastModified: "2026-09-16",
      indexable: true,
    });
  });

  it("is the source of truth for closed guide static params", async () => {
    vi.resetModules();
    vi.doMock("@/lib/content/route-manifest", () => ({
      publishedRoutes: [
        {
          pathname: "/guides/manifest-only",
          kind: "guide",
          slug: "manifest-only",
          lastModified: "2026-09-15",
          indexable: true,
        },
      ],
    }));

    try {
      const guidePage = await import("@/app/guides/[slug]/page");
      expect(guidePage.generateStaticParams()).toEqual([
        { slug: "manifest-only" },
      ]);
      expect(guidePage.dynamicParams).toBe(false);
    } finally {
      vi.doUnmock("@/lib/content/route-manifest");
      vi.resetModules();
    }
  });
});

describe("static export SEO validator", () => {
  const home = {
    file: "index.html",
    pathname: "/",
    title: "CodeReset home",
    description: "Private Codex quota reset tracking from your own usage data.",
    links: [
      "#local%20section",
      "/guides/weekly-limit#answer",
      "/guides/weekly-limit#legacy-answer",
    ],
    anchors: ["local section"],
  };
  const guide = {
    file: "guides/weekly-limit.html",
    pathname: "/guides/weekly-limit",
    title: "Codex weekly reset guide",
    description: "Find the account-specific weekly reset timestamp shown by Codex.",
    links: ["/"],
    anchors: ["answer"],
    namedAnchors: ["legacy-answer"],
  };

  it("accepts index.html and nested path.html exports with local resources", () => {
    const fixture = createExportFixture({
      pages: [home, guide],
      sitemapPaths: ["/", "/guides/weekly-limit"],
    });

    const result = runExportValidator(fixture);

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  it("rejects duplicate page titles", () => {
    const fixture = createExportFixture({
      pages: [home, { ...guide, title: home.title }],
      sitemapPaths: ["/", "/guides/weekly-limit"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/duplicate title/i);
  });

  it("rejects duplicate page descriptions", () => {
    const fixture = createExportFixture({
      pages: [home, { ...guide, description: home.description }],
      sitemapPaths: ["/", "/guides/weekly-limit"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/duplicate description/i);
  });

  it("rejects an indexable page without a canonical URL", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, canonical: null }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/canonical/i);
  });

  it("rejects a canonical URL that does not match the exported route", () => {
    const fixture = createExportFixture({
      pages: [
        {
          ...home,
          canonical: "https://codereset.dev/guides/weekly-limit",
        },
      ],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/canonical.*does not match/i);
  });

  it.each([
    ["https://codereset.dev/index.html", { ...home, links: [] }, "/"],
    [
      "https://codereset.dev/guides/weekly-limit.html",
      { ...guide, links: [] },
      "/guides/weekly-limit",
    ],
  ])("rejects a non-canonical HTML path in canonical URL %s", (
    canonical,
    page,
    sitemapPath,
  ) => {
    const fixture = createExportFixture({
      pages: [{ ...page, canonical }],
      sitemapPaths: [sitemapPath],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(
      /canonical URL.*non-canonical/i,
    );
  });

  it("rejects an indexable page without exactly one H1", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, h1Count: 0 }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/exactly one H1/i);
  });

  it("rejects an indexable page without an Open Graph image", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, ogImage: null }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/Open Graph image/i);
  });

  it("rejects malformed JSON-LD", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, jsonLd: "{" }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/invalid JSON-LD/i);
  });

  it("rejects a broken internal link", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, links: ["/missing-page"] }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/broken internal link/i);
  });

  it("rejects a missing same-page fragment target", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, links: ["#missing-section"] }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/broken fragment/i);
  });

  it("rejects a missing cross-page fragment target", () => {
    const fixture = createExportFixture({
      pages: [
        { ...home, links: ["/guides/weekly-limit#missing-answer"] },
        guide,
      ],
      sitemapPaths: ["/", "/guides/weekly-limit"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/broken fragment/i);
  });

  it("rejects a malformed percent-encoded fragment", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, links: ["#bad%E0%A4%A"] }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/invalid fragment/i);
  });

  it("accepts the special same-page #top fragment without a matching ID", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, links: ["#top"] }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  it("accepts the special cross-page #TOP fragment without a matching ID", () => {
    const fixture = createExportFixture({
      pages: [
        { ...home, links: ["/guides/weekly-limit#TOP"] },
        guide,
      ],
      sitemapPaths: ["/", "/guides/weekly-limit"],
    });

    const result = runExportValidator(fixture);

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  it("does not treat a fragment with whitespace as the special top target", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, links: ["#top%20"] }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/broken fragment/i);
  });

  it("rejects a sitemap URL without a matching static page", () => {
    const fixture = createExportFixture({
      pages: [home],
      sitemapPaths: ["/", "/missing-page"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(
      /sitemap URL has no static HTML/i,
    );
  });

  it("rejects a noindex static page included in the sitemap", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, robots: "noindex, follow" }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/sitemap.*noindex/i);
  });

  it("treats robots none as noindex when validating the sitemap", () => {
    const fixture = createExportFixture({
      pages: [{ ...home, links: [], robots: "none" }],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/sitemap.*noindex/i);
  });

  it("rejects duplicate normalized URLs in the sitemap", () => {
    const fixture = createExportFixture({
      pages: [home],
      sitemapPaths: ["/", "/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/duplicate sitemap URL/i);
  });

  it.each([
    ["/index.html", { ...home, links: [] }],
    ["/guides/weekly-limit.html", { ...guide, links: [] }],
  ])("rejects a non-canonical HTML path in sitemap URL %s", (
    sitemapPath,
    page,
  ) => {
    const fixture = createExportFixture({
      pages: [page],
      sitemapPaths: [sitemapPath],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(
      /sitemap URL.*non-canonical/i,
    );
  });

  it("rejects an indexable static page missing from the sitemap", () => {
    const fixture = createExportFixture({
      pages: [home, guide],
      sitemapPaths: ["/"],
    });

    const result = runExportValidator(fixture);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(
      /indexable HTML is missing from sitemap/i,
    );
  });
});
