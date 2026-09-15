import type { Metadata } from "next";
import { SITE } from "@/lib/site";

type BuildMetadataInput = Omit<
  Metadata,
  "alternates" | "description" | "openGraph" | "title" | "twitter"
> & {
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
  openGraph?: Metadata["openGraph"];
  twitter?: Metadata["twitter"];
};

export function absoluteUrl(path: string) {
  const url = new URL(path, `${SITE.origin}/`);

  if (url.origin !== SITE.origin) {
    throw new TypeError(`URL must use the canonical origin: ${SITE.origin}`);
  }

  return url.toString();
}

export function buildMetadata({
  path,
  title,
  description,
  absoluteTitle = false,
  openGraph,
  twitter,
  ...metadata
}: BuildMetadataInput): Metadata {
  const canonical = absoluteUrl(path);

  return {
    ...metadata,
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      siteName: SITE.name,
      locale: SITE.locale,
      ...openGraph,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...twitter,
    },
  };
}
