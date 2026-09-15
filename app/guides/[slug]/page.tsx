import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { BrandMark } from "@/components/icons";
import { getGuide } from "@/lib/content";
import { publishedRoutes } from "@/lib/content/route-manifest";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema, faqSchema } from "@/lib/seo/schema";

type GuidePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publishedRoutes.flatMap((route) =>
    route.kind === "guide" && route.slug ? [{ slug: route.slug }] : [],
  );
}

export const dynamicParams = false;

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  return buildMetadata({
    path: `/guides/${guide.slug}`,
    title: guide.title,
    description: guide.description,
    openGraph: {
      type: "article",
      images: [
        {
          url: absoluteUrl("/og-guides.png"),
          width: 1200,
          height: 630,
          alt: "CodeReset field manual for Codex usage limits",
        },
      ],
    },
    twitter: {
      images: [
        {
          url: absoluteUrl("/og-guides.png"),
          alt: "CodeReset field manual for Codex usage limits",
        },
      ],
    },
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const relatedGuides = guide.related.map((relatedSlug) => getGuide(relatedSlug)).filter(Boolean);
  const guidePath = `/guides/${guide.slug}`;
  const structuredData = [
    articleSchema({
      title: guide.title,
      description: guide.description,
      path: guidePath,
      dateModified: guide.lastReviewed,
    }),
    faqSchema(guide.faqs),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Field manual", path: "/#field-manual" },
      { name: guide.title, path: guidePath },
    ]),
  ];

  return (
    <main className="guide-page">
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
          <BrandMark className="brand-mark" /><span>CodeReset</span><span className="brand-suffix">.dev</span>
        </Link>
        <Link className="guide-back" href="/#field-manual"><ArrowLeft size={15} /> All field notes</Link>
      </header>

      <article>
        <header className="guide-hero shell">
          <nav className="guide-breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/#field-manual">Field manual</Link></li>
              <li><span aria-current="page">{guide.title}</span></li>
            </ol>
          </nav>
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
