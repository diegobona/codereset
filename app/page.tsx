import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { AlertOffer } from "@/components/alert-offer";
import { AnalyticsBootstrap } from "@/components/analytics-client";
import { BrandMark } from "@/components/icons";
import { GlobalResetCard } from "@/components/global-reset-card";
import { ResetDesk } from "@/components/reset-desk";
import { SHOW_ALERT_OFFER } from "@/lib/features";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";
import { websiteSchema } from "@/lib/seo/schema";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  path: "/",
  title: SITE.title,
  description: SITE.description,
  absoluteTitle: true,
  openGraph: {
    type: "website",
    title: SITE.openGraphTitle,
    description: SITE.openGraphDescription,
    images: [
      {
        url: absoluteUrl("/og-default.png"),
        width: 1200,
        height: 630,
        alt: "CodeReset private Codex quota countdown",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.twitterTitle,
    description: SITE.twitterDescription,
    images: [
      {
        url: absoluteUrl("/og-default.png"),
        alt: "CodeReset private Codex quota countdown",
      },
    ],
  },
});

export default function HomePage() {
  const structuredData = websiteSchema();

  return (
    <main>
      <AnalyticsBootstrap page="home" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <header className="site-header home-header shell">
        <Link className="brand" href="/" aria-label="CodeReset home">
          <BrandMark className="brand-mark" />
          <span>CodeReset</span>
          <span className="brand-suffix">.dev</span>
        </Link>
      </header>

      <div className="home-intro shell">
        <div className="home-intro-copy">
          <span className="home-kicker">PERSONAL QUOTA TRACKER</span>
          <h1 id="hero-title">My Codex quota</h1>
          <p>Track your 5-hour and weekly reset times with a private countdown.</p>
        </div>
        <div className="home-privacy-badge">
          <ShieldCheck size={18} />
          <span>Stored only in this browser</span>
        </div>
      </div>

      <section className="home-desk shell" id="reset-desk" aria-label="My Codex quota">
        <ResetDesk />
      </section>

      <section className="home-global-reset shell" aria-label="Public reset signal">
        <div className="home-section-heading">
          <div>
            <span>PUBLIC SIGNAL</span>
            <h2>Global reset status</h2>
          </div>
          <p>Community-wide reset announcements are separate from your personal quota timer.</p>
        </div>
        <GlobalResetCard />
      </section>

      <section className="home-guides shell" aria-labelledby="common-questions-title">
        <h2 id="common-questions-title">Common questions</h2>
        <nav className="home-help" aria-label="Common questions">
          <Link href="/guides/check-codex-usage">
            How to check Codex usage <ArrowRight size={16} />
          </Link>
          <Link href="/guides/5-hour-limit">
            When does the 5-hour limit reset? <ArrowRight size={16} />
          </Link>
          <Link href="/guides/weekly-limit">
            When does the weekly limit reset? <ArrowRight size={16} />
          </Link>
          <Link href="/guides/banked-resets">
            What are banked resets? <ArrowRight size={16} />
          </Link>
          <Link href="/reset-time">
            Convert a Codex reset time <ArrowRight size={16} />
          </Link>
        </nav>
      </section>

      {SHOW_ALERT_OFFER && <AlertOffer enabled />}

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
