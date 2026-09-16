import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnalyticsBootstrap } from "@/components/analytics-client";
import { BrandMark } from "@/components/icons";
import { guides } from "@/lib/content";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

const title = "Codex usage guides";
const description =
  "Source-backed guides for Codex usage limits, reset windows, model choices, and practical steps when your quota runs low.";

export const metadata: Metadata = buildMetadata({
  path: "/guides",
  title,
  description,
  openGraph: {
    type: "website",
    images: [
      {
        url: absoluteUrl("/og-guides.png"),
        width: 1200,
        height: 630,
        alt: "CodeReset guides to Codex usage limits",
      },
    ],
  },
  twitter: {
    images: [
      {
        url: absoluteUrl("/og-guides.png"),
        alt: "CodeReset guides to Codex usage limits",
      },
    ],
  },
});

function GuideCards({ items }: { items: typeof guides }) {
  return (
    <div className="guide-grid">
      {items.map((guide) => (
        <Link className="guide-card" href={`/guides/${guide.slug}`} key={guide.slug}>
          <span>{guide.eyebrow}</span>
          <h3>{guide.title}</h3>
          <p>{guide.description}</p>
          <span className="guide-link">
            Read guide <ArrowRight size={15} />
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function GuidesPage() {
  const ruleGuides = guides.filter((guide) => guide.intent === "rule");
  const operationGuides = guides.filter((guide) => guide.intent === "operation");
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: absoluteUrl("/guides"),
      hasPart: guides.map((guide) => ({
        "@type": "Article",
        name: guide.title,
        url: absoluteUrl(`/guides/${guide.slug}`),
      })),
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: title, path: "/guides" },
    ]),
  ];

  return (
    <main className="guides-index-page">
      <AnalyticsBootstrap page="guide" />
      {structuredData.map((schema) => (
        <script
          key={schema["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}

      <header className="site-header shell guide-header">
        <Link className="brand" href="/" aria-label="CodeReset home">
          <BrandMark className="brand-mark" />
          <span>CodeReset</span>
          <span className="brand-suffix">.dev</span>
        </Link>
        <Link className="guide-back" href="/#reset-desk">
          <ArrowLeft size={15} /> Open my quota tracker
        </Link>
      </header>

      <section className="guides-index-hero shell">
        <span className="section-index">SOURCE-BACKED ANSWERS</span>
        <h1>{title}</h1>
        <p>
          Start with the question you have now. Every guide separates documented facts,
          practical interpretation, and account-specific details you still need to verify.
        </p>
      </section>

      <section
        className="guides-cluster shell"
        aria-label="Codex usage rules"
      >
        <div className="guides-cluster-heading">
          <span>RULES / {String(ruleGuides.length).padStart(2, "0")}</span>
          <h2>Understand the limits</h2>
          <p>How windows, models, and shared allowance behave.</p>
        </div>
        <GuideCards items={ruleGuides} />
      </section>

      <section
        className="guides-cluster shell"
        aria-label="Codex how-to guides"
      >
        <div className="guides-cluster-heading">
          <span>HOW TO / {String(operationGuides.length).padStart(2, "0")}</span>
          <h2>Take the next step</h2>
          <p>Check, preserve, and stretch the quota available to you.</p>
        </div>
        <GuideCards items={operationGuides} />
      </section>

      <footer className="compact-footer">
        <div className="compact-footer-inner shell">
          <Link className="brand footer-brand" href="/" aria-label="CodeReset home">
            <BrandMark className="brand-mark" />
            <span>CodeReset</span>
            <span className="brand-suffix">.dev</span>
          </Link>
          <nav className="compact-footer-nav" aria-label="Footer navigation">
            <Link href="/privacy">Privacy</Link>
            <Link href="/about">About</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
