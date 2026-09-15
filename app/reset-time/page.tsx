import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/icons";
import { ResetTimeConverter } from "@/components/tools/reset-time-converter";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/reset-time",
  title: "Convert a Codex reset time",
  description:
    "Paste an absolute Codex reset timestamp and convert it to UTC, Pacific, Eastern, London, or Tokyo time without uploading account data.",
  openGraph: {
    type: "website",
    images: [
      {
        url: absoluteUrl("/og-default.png"),
        width: 1200,
        height: 630,
        alt: "CodeReset timezone converter",
      },
    ],
  },
  twitter: {
    images: [
      {
        url: absoluteUrl("/og-default.png"),
        alt: "CodeReset timezone converter",
      },
    ],
  },
});

export default function ResetTimePage() {
  return (
    <main className="reset-time-page">
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

      <section className="reset-time-hero shell" aria-labelledby="reset-time-title">
        <span className="section-index">TIMEZONE TOOL</span>
        <h1 id="reset-time-title">Convert a Codex reset time</h1>
        <p>
          Paste the absolute reset timestamp shown by Codex, then choose where
          you want to see it.
        </p>
      </section>

      <section className="reset-time-shell shell" aria-label="Reset time converter">
        <ResetTimeConverter />
        <p className="reset-time-privacy">
          <ShieldCheck size={16} /> Processed in this browser. No timestamp or
          account data is uploaded.
        </p>
      </section>
    </main>
  );
}
