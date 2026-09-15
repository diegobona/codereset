import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SiteNavigation } from "@/components/article/breadcrumbs";
import { BrandMark } from "@/components/icons";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/about",
  title: "About CodeReset and the independent project",
  description:
    "Learn who maintains CodeReset, how the independent project relates to OpenAI, and how its commercial disclosures are handled.",
  openGraph: {
    type: "website",
    images: [
      {
        url: absoluteUrl("/og-default.png"),
        width: 1200,
        height: 630,
        alt: "About the independent CodeReset project",
      },
    ],
  },
  twitter: {
    images: [
      {
        url: absoluteUrl("/og-default.png"),
        alt: "About the independent CodeReset project",
      },
    ],
  },
});

export default function AboutPage() {
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
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
          <span className="section-index">TRUST NOTE / ABOUT</span>
          <h1>About CodeReset</h1>
          <p>
            CodeReset is an independent project that helps people interpret and
            plan around Codex quota windows without connecting their account.
          </p>
          <div className="guide-meta">
            <span>LAST REVIEWED / 2026-09-15</span>
            <span>INDEPENDENT PROJECT</span>
          </div>
        </header>

        <div className="trust-document shell">
          <section>
            <h2>Project identity</h2>
            <p>
              CodeReset is not affiliated with OpenAI. Codex and OpenAI are
              trademarks of their respective owners. The only public operator
              identity we can confirm is the CodeReset project and its maintainers;
              this page does not invent a person or legal entity from a repository
              username.
            </p>
          </section>
          <section>
            <h2>Editorial independence</h2>
            <p>
              CodeReset currently has no sponsored placements, affiliate links,
              or paid rankings. Sources and fact-status labels are selected for
              their relevance and evidentiary value, not for payment.
            </p>
            <p>
              Optional paid notifications may be offered in the future. If that
              happens, the commercial relationship will be disclosed without
              changing how factual claims are classified.
            </p>
          </section>
          <section>
            <h2>Contact and policies</h2>
            <p>
              Contact the maintainers at{" "}
              <a href="mailto:hello@codereset.dev">hello@codereset.dev</a>.
            </p>
            <p>
              See how claims are checked in our <Link href="/methodology">Methodology</Link>,
              or submit evidence through <Link href="/corrections">Corrections</Link>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
