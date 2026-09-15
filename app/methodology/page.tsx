import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SiteNavigation } from "@/components/article/breadcrumbs";
import { BrandMark } from "@/components/icons";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/methodology",
  title: "CodeReset editorial and evidence methodology",
  description:
    "See how CodeReset classifies claims, prioritizes account interfaces and first-party sources, schedules reviews, and handles corrections.",
  openGraph: {
    type: "website",
    images: [
      {
        url: absoluteUrl("/og-guides.png"),
        width: 1200,
        height: 630,
        alt: "CodeReset evidence and review methodology",
      },
    ],
  },
  twitter: {
    images: [
      {
        url: absoluteUrl("/og-guides.png"),
        alt: "CodeReset evidence and review methodology",
      },
    ],
  },
});

export default function MethodologyPage() {
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
            items={[{ label: "Home", href: "/" }, { label: "Methodology" }]}
          />
          <span className="section-index">TRUST NOTE / EVIDENCE</span>
          <h1>Editorial methodology</h1>
          <p>
            Every material claim is labeled by what the available evidence can
            actually support, with a source and a scheduled review date.
          </p>
          <div className="guide-meta">
            <span>LAST REVIEWED / 2026-09-15</span>
            <span>EVIDENCE FIRST</span>
          </div>
        </header>

        <div className="trust-document shell">
          <section>
            <h2>Fact-status labels</h2>
            <dl className="status-definitions">
              <div>
                <dt>official</dt>
                <dd>Directly supported by a first-party product surface or document.</dd>
              </div>
              <div>
                <dt>observed</dt>
                <dd>A reproducible current observation that is not a published rule.</dd>
              </div>
              <div>
                <dt>inference</dt>
                <dd>A conclusion drawn from cited evidence and labeled as interpretation.</dd>
              </div>
              <div>
                <dt>unknown</dt>
                <dd>The evidence does not confirm the answer for every account.</dd>
              </div>
            </dl>
          </section>
          <section>
            <h2>Sources and priority</h2>
            <p>
              For account-specific quota, the current account interface takes
              priority. First-party OpenAI documentation is next. A claim is
              paired with its source, verification date, and next review date so
              readers can evaluate it instead of relying on an unlabeled summary.
            </p>
          </section>
          <section>
            <h2>Review cadence</h2>
            <p>
              Official claims are rechecked within 14 days of verification.
              Observed claims are rechecked within 7 days. Inference and unknown
              claims receive an explicit review date based on how quickly the
              underlying product may change.
            </p>
          </section>
          <section>
            <h2>Publication and corrections</h2>
            <p>
              Maintainers compare the claim with the cited evidence, preserve
              uncertainty, update the reviewed date only after a real check, and
              keep visible FAQ copy and FAQ structured data sourced from the same
              content record.
            </p>
            <p>
              Read the <Link href="/corrections">Corrections process</Link> to
              send a page URL and better evidence.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
