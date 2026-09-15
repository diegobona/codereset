import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SiteNavigation } from "@/components/article/breadcrumbs";
import { BrandMark } from "@/components/icons";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/corrections",
  title: "Corrections and evidence updates at CodeReset",
  description:
    "Report a CodeReset factual issue with the affected page and supporting evidence, and learn how maintainers review and record corrections.",
  openGraph: {
    type: "website",
    images: [
      {
        url: absoluteUrl("/og-guides.png"),
        width: 1200,
        height: 630,
        alt: "CodeReset corrections and evidence updates",
      },
    ],
  },
  twitter: {
    images: [
      {
        url: absoluteUrl("/og-guides.png"),
        alt: "CodeReset corrections and evidence updates",
      },
    ],
  },
});

export default function CorrectionsPage() {
  return (
    <main className="guide-page trust-page">
      <header className="site-header shell guide-header trust-header">
        <Link className="brand" href="/" aria-label="CodeReset home">
          <BrandMark className="brand-mark" />
          <span>CodeReset</span>
          <span className="brand-suffix">.dev</span>
        </Link>
        <SiteNavigation />
      </header>

      <article>
        <header className="guide-hero shell">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Corrections" }]}
          />
          <span className="section-index">TRUST NOTE / CORRECTIONS</span>
          <h1>Corrections and updates</h1>
          <p>
            Better evidence is welcome. Send enough context for maintainers to
            reproduce the issue and compare it with the cited source.
          </p>
          <div className="guide-meta">
            <span>LAST REVIEWED / 2026-09-15</span>
            <span>PUBLIC PROCESS</span>
          </div>
        </header>

        <div className="trust-document shell">
          <section>
            <h2>Submit a correction</h2>
            <p>
              Email <a href="mailto:hello@codereset.dev?subject=CodeReset%20correction">hello@codereset.dev</a>
              {" "}with the page URL, the exact statement you believe is wrong or
              stale, and supporting evidence. First-party documentation or a
              current account-interface capture is especially useful.
            </p>
          </section>
          <section>
            <h2>What happens next</h2>
            <p>
              We review the cited claim against the submitted and existing
              evidence, update the copy and fact status when warranted, and add a
              correction record when the change materially affects the answer.
            </p>
            <p>
              Review time depends on the evidence and whether the account-specific
              behavior can be reproduced; no fixed response deadline is promised.
            </p>
          </section>
          <section>
            <h2>How records change</h2>
            <p>
              A completed review may update the source, verified date, next review
              date, fact status, visible answer, and matching structured data. We
              do not relabel an unknown or inferred claim as official without
              first-party support.
            </p>
            <p>
              The classification rules are documented in our <Link href="/methodology">Methodology</Link>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
