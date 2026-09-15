import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { BrandMark } from "@/components/icons";
import { getGuide, guides } from "@/lib/content";

type GuidePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { title: guide.title, description: guide.description, type: "article" },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const relatedGuides = guide.related.map((relatedSlug) => getGuide(relatedSlug)).filter(Boolean);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        dateModified: guide.lastReviewed,
        author: { "@type": "Organization", name: "CodeReset" },
        publisher: { "@type": "Organization", name: "CodeReset" },
        mainEntityOfPage: `https://codereset.dev/guides/${guide.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <main className="guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="site-header shell guide-header">
        <Link className="brand" href="/" aria-label="CodeReset home">
          <BrandMark className="brand-mark" /><span>CodeReset</span><span className="brand-suffix">.dev</span>
        </Link>
        <Link className="guide-back" href="/#field-manual"><ArrowLeft size={15} /> All field notes</Link>
      </header>

      <article>
        <header className="guide-hero shell">
          <span className="section-index">{guide.eyebrow}</span>
          <h1>{guide.title}</h1>
          <p>{guide.description}</p>
          <div className="guide-meta"><span>LAST REVIEWED / {guide.lastReviewed}</span><span>INDEPENDENT GUIDE</span></div>
        </header>

        <div className="guide-body shell">
          <aside>
            <span>ON THIS PAGE</span>
            {guide.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.heading}>{String(index + 1).padStart(2, "0")} — {section.heading}</a>)}
            <a href="#faq">FAQ</a>
          </aside>
          <div className="guide-content">
            <section className="quick-answer">
              <span>QUICK ANSWER</span>
              <p>{guide.answer}</p>
            </section>
            {guide.sections.map((section, index) => (
              <section className="article-section" id={`section-${index + 1}`} key={section.heading}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}><Check size={16} /> {bullet}</li>)}</ul>}
              </section>
            ))}
            <section className="guide-faq" id="faq">
              <span className="section-index">FAQ</span>
              {guide.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<b>+</b></summary><p>{faq.answer}</p></details>)}
            </section>
          </div>
        </div>
      </article>

      <section className="related-guides shell">
        <span className="section-index">KEEP READING</span>
        <div>{relatedGuides.map((related) => related && <Link href={`/guides/${related.slug}`} key={related.slug}><span>{related.eyebrow}</span><strong>{related.title}</strong><ArrowRight size={18} /></Link>)}</div>
      </section>
      <footer className="guide-footer"><div className="shell"><p>CodeReset is not affiliated with OpenAI. Always verify account-specific quota information in Codex.</p><Link href="/">Back to reset desk <ArrowRight size={15} /></Link></div></footer>
    </main>
  );
}
