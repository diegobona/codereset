import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { LoadedGuide } from "@/lib/content/load";
import { Breadcrumbs } from "@/components/article/breadcrumbs";
import { SourceBox } from "@/components/article/source-box";

export function ArticleLayout({
  guide,
  relatedGuides,
}: {
  guide: LoadedGuide;
  relatedGuides: ReadonlyArray<LoadedGuide>;
}) {
  return (
    <>
      <article>
        <header className="guide-hero shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Field manual", href: "/#field-manual" },
              { label: guide.title },
            ]}
          />
          <span className="section-index">{guide.eyebrow}</span>
          <h1>{guide.title}</h1>
          <p>{guide.description}</p>
          <div className="guide-meta">
            <span>LAST REVIEWED / {guide.lastReviewed}</span>
            <span>NEXT REVIEW / {guide.reviewAfter}</span>
            <span>INDEPENDENT GUIDE</span>
          </div>
        </header>

        <div className="guide-body shell">
          <aside aria-label="On this page">
            <span>ON THIS PAGE</span>
            {guide.sections.map((section, index) => (
              <a href={`#section-${index + 1}`} key={section.heading}>
                {String(index + 1).padStart(2, "0")} — {section.heading}
              </a>
            ))}
            <a href="#faq">FAQ</a>
            <a href="#sources">Sources</a>
            <Link href="/methodology">Methodology</Link>
            <Link href="/corrections">Corrections</Link>
          </aside>
          <div className="guide-content">
            <section className="quick-answer">
              <span>QUICK ANSWER</span>
              <p>{guide.answer}</p>
            </section>
            {guide.sections.map((section, index) => (
              <section
                className="article-section"
                id={`section-${index + 1}`}
                key={section.heading}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>
                        <Check size={16} /> {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <section className="guide-faq" id="faq">
              <span className="section-index">FAQ</span>
              {guide.faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>
                    {faq.question}<b>+</b>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </section>
            <SourceBox evidence={guide.evidence} />
          </div>
        </div>
      </article>

      <section className="related-guides shell">
        <span className="section-index">KEEP READING</span>
        <div>
          {relatedGuides.map((related) => (
            <Link href={`/guides/${related.slug}`} key={related.slug}>
              <span>{related.eyebrow}</span>
              <strong>{related.title}</strong>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
