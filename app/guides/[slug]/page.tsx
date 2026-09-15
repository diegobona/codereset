import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArticleLayout } from "@/components/article/article-layout";
import { AnalyticsBootstrap, GuideDeskLink } from "@/components/analytics-client";
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

  const relatedGuides = guide.related.flatMap((relatedSlug) => {
    const relatedGuide = getGuide(relatedSlug);
    return relatedGuide ? [relatedGuide] : [];
  });
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
      { name: guide.title, path: guidePath },
    ]),
  ];

  return (
    <main className="guide-page">
      <AnalyticsBootstrap page="guide" guidePageview />
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
        <Link className="guide-back" href="/#reset-desk"><ArrowLeft size={15} /> Reset desk</Link>
      </header>

      <ArticleLayout guide={guide} relatedGuides={relatedGuides} />
      <footer className="guide-footer"><div className="shell"><GuideDeskLink /></div></footer>
    </main>
  );
}
