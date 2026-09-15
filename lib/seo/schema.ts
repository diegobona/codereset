import { absoluteUrl } from "@/lib/seo/metadata";
import { SITE } from "@/lib/site";

type Faq = Readonly<{
  question: string;
  answer: string;
}>;

type Breadcrumb = Readonly<{
  name: string;
  path: string;
}>;

type ArticleSchemaInput = Readonly<{
  title: string;
  description: string;
  path: string;
  dateModified: string;
}>;

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/"),
    description: SITE.description,
    inLanguage: SITE.language,
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    url: absoluteUrl("/"),
    description: SITE.description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    featureList: [
      "Private Codex quota countdowns",
      "Separate five-hour and weekly quota tracking",
      "Calendar reminder export",
    ],
  };
}

export function articleSchema({
  title,
  description,
  path,
  dateModified,
}: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    dateModified,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: absoluteUrl(path),
    inLanguage: SITE.language,
  };
}

export function faqSchema(faqs: ReadonlyArray<Faq>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function breadcrumbSchema(items: ReadonlyArray<Breadcrumb>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}
