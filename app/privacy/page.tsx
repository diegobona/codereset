import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  AnalyticsBootstrap,
  PrivacyControls,
} from "@/components/analytics-client";
import { BrandMark } from "@/components/icons";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/privacy",
  title: "Privacy and anonymous analytics",
  description:
    "See exactly what CodeReset stores in your browser, which anonymous product events it may collect, and how to opt out.",
  openGraph: {
    type: "website",
    images: [
      {
        url: absoluteUrl("/og-default.png"),
        width: 1200,
        height: 630,
        alt: "CodeReset privacy-first quota desk",
      },
    ],
  },
  twitter: {
    images: [
      {
        url: absoluteUrl("/og-default.png"),
        alt: "CodeReset privacy-first quota desk",
      },
    ],
  },
});

const productEventNames = [
  "first_visit",
  "desk_start",
  "manual_setup_start",
  "manual_setup_complete",
  "parser_attempt",
  "parser_success",
  "desk_complete",
  "ics_download",
  "share_card_download",
  "guide_pageview",
  "guide_to_desk_click",
  "return_7d",
  "return_30d",
];

export default function PrivacyPage() {
  return (
    <main className="guide-page privacy-page">
      <AnalyticsBootstrap page="privacy" />
      <header className="site-header shell guide-header">
        <Link className="brand" href="/" aria-label="CodeReset home">
          <BrandMark className="brand-mark" />
          <span>CodeReset</span>
          <span className="brand-suffix">.dev</span>
        </Link>
        <Link className="guide-back" href="/">
          <ArrowLeft size={15} /> Home
        </Link>
      </header>

      <article>
        <header className="guide-hero shell">
          <span className="section-index">TRUST NOTE / PRIVACY</span>
          <h1>Privacy and anonymous analytics</h1>
          <p>
            Your pasted Codex status, quota percentages, and reset times stay in
            your browser. Our optional measurement is deliberately limited to
            named product actions and coarse page and device categories.
          </p>
          <div className="guide-meta">
            <span>LAST REVIEWED / 2026-09-15</span>
            <span>NO ACCOUNT CONNECTION</span>
          </div>
        </header>

        <div className="privacy-document shell">
          <aside className="privacy-summary">
            <ShieldCheck size={34} />
            <strong>No pasted text is sent</strong>
            <p>
              The analytics endpoint rejects unknown fields, including pasted
              text, percentages, reset timestamps, IP-derived IDs, and visitor
              identifiers.
            </p>
          </aside>

          <div className="privacy-article">
            <section>
              <h2>Browser storage</h2>
              <p>CodeReset may use these exact keys:</p>
              <ul>
                <li><code>codereset:v1:quota</code> in localStorage stores the reset windows you explicitly save.</li>
                <li><code>codereset:analytics:disabled</code> in localStorage remembers your analytics opt-out.</li>
                <li><code>codereset:analytics:v1:first-seen-date</code> stores a calendar date, not an identifier.</li>
                <li><code>codereset:analytics:v1:return-7d-sent</code> and <code>codereset:analytics:v1:return-30d-sent</code> store only whether each return event was sent.</li>
                <li><code>codereset:analytics:v1:session-events</code> in sessionStorage prevents duplicate events during one browser session.</li>
              </ul>
              <p>
                These values stay until you clear site data or use the product&apos;s
                clear/opt-out controls. sessionStorage normally expires when the
                tab session ends. No stable analytics identifier is created.
              </p>
            </section>

            <section>
              <h2>Anonymous event fields</h2>
              <p>
                A valid event contains an allowlisted event name and may contain
                only <code>page</code> (<code>home</code>, <code>guide</code>, or <code>privacy</code>)
                and a coarse <code>device</code> class (<code>mobile</code>, <code>tablet</code>, or <code>desktop</code>).
              </p>
              <p>Allowed event names: {productEventNames.join(", ")}.</p>
              <p>
                CodeReset does not send pasted status text, quota values, reset
                timestamps, full URLs, account data, IP addresses, user-agent
                strings, or persistent visitor IDs to the custom event dataset.
              </p>
            </section>

            <section>
              <h2>Retention and service status</h2>
              <p>
                Cloudflare documents Analytics Engine retention as three months.
                The deployed dataset and the current policy must still be verified
                before production measurement is treated as active. Cloudflare Web
                Analytics, if enabled, separately provides aggregate pageview and
                Web Vitals measurement under Cloudflare&apos;s published service
                policies.
              </p>
            </section>

            <section>
              <h2>Your choice</h2>
              <p>
                Use this browser-level switch at any time. Opting out stops future
                custom product events from this browser; it does not delete local
                quota data unless you clear that separately on the reset desk.
              </p>
              <PrivacyControls />
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                Questions or deletion requests can be sent to{" "}
                <a href="mailto:privacy@codereset.dev">privacy@codereset.dev</a>.
              </p>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
