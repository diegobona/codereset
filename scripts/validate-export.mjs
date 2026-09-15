#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const CANONICAL_ORIGIN = "https://codereset.dev";

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function normalizePagePathname(input) {
  const url = new URL(input, `${CANONICAL_ORIGIN}/`);
  let pathname = url.pathname.replace(/\/{2,}/g, "/");

  if (pathname === "/index.html") {
    pathname = "/";
  } else if (pathname.endsWith("/index.html")) {
    pathname = pathname.slice(0, -"/index.html".length) || "/";
  } else if (pathname.endsWith(".html")) {
    pathname = pathname.slice(0, -".html".length) || "/";
  }

  if (pathname !== "/") pathname = pathname.replace(/\/+$/, "");
  return pathname || "/";
}

function routeForHtml(exportDirectory, file) {
  const relativePath = relative(exportDirectory, file).split(sep);
  const encodedPath = relativePath.map(encodeURIComponent).join("/");
  return normalizePagePathname(`/${encodedPath}`);
}

function canonicalRoute(rawUrl, label, errors) {
  try {
    const url = new URL(rawUrl, `${CANONICAL_ORIGIN}/`);
    if (url.origin !== CANONICAL_ORIGIN) {
      errors.push(`${label} must use ${CANONICAL_ORIGIN}: ${rawUrl}`);
      return null;
    }
    if (url.search || url.hash) {
      errors.push(`${label} must not contain a query or fragment: ${rawUrl}`);
      return null;
    }
    return normalizePagePathname(url.pathname);
  } catch {
    errors.push(`${label} is not a valid URL: ${rawUrl}`);
    return null;
  }
}

function normalizedText(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

function hasNoindex(document) {
  return Array.from(document.querySelectorAll("meta[name]")).some((meta) => {
    const name = meta.getAttribute("name")?.toLowerCase();
    if (name !== "robots" && name !== "googlebot") return false;
    return (meta.getAttribute("content") ?? "")
      .toLowerCase()
      .split(/[\s,]+/)
      .includes("noindex");
  });
}

function localResourcePath(exportDirectory, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const resourcePath = resolve(
    exportDirectory,
    decodedPath.replace(/^[/\\]+/, ""),
  );
  const rootWithSeparator = `${resolve(exportDirectory)}${sep}`;
  if (
    resourcePath !== resolve(exportDirectory) &&
    !resourcePath.startsWith(rootWithSeparator)
  ) {
    return null;
  }
  return resourcePath;
}

function validateLocalResource({
  exportDirectory,
  rawUrl,
  pageRoute,
  label,
  errors,
}) {
  let url;
  try {
    url = new URL(rawUrl, `${CANONICAL_ORIGIN}${pageRoute}`);
  } catch {
    errors.push(`${label} is not a valid URL on ${pageRoute}: ${rawUrl}`);
    return;
  }
  if (url.origin !== CANONICAL_ORIGIN) return;

  const resourcePath = localResourcePath(exportDirectory, url.pathname);
  if (!resourcePath || !existsSync(resourcePath) || !statSync(resourcePath).isFile()) {
    errors.push(`${label} is missing on ${pageRoute}: ${url.pathname}`);
  }
}

function validateDocument({ exportDirectory, file, route, document, errors }) {
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    try {
      JSON.parse(script.textContent ?? "");
    } catch {
      errors.push(`Invalid JSON-LD on ${route}`);
    }
  }

  const indexable = !hasNoindex(document);
  if (!indexable) return { file, route, indexable };

  const titles = document.querySelectorAll("title");
  const title = titles.length === 1 ? titles[0].textContent?.trim() ?? "" : "";
  if (titles.length !== 1 || !title) {
    errors.push(`Indexable page must have exactly one non-empty title: ${route}`);
  }

  const descriptions = document.querySelectorAll('meta[name="description"]');
  const description =
    descriptions.length === 1
      ? descriptions[0].getAttribute("content")?.trim() ?? ""
      : "";
  if (descriptions.length !== 1 || !description) {
    errors.push(
      `Indexable page must have exactly one non-empty description: ${route}`,
    );
  }

  const canonicals = document.querySelectorAll('link[rel~="canonical"]');
  if (canonicals.length !== 1) {
    errors.push(`Indexable page must have exactly one canonical URL: ${route}`);
  } else {
    const canonical = canonicals[0].getAttribute("href")?.trim() ?? "";
    const canonicalPath = canonicalRoute(
      canonical,
      `Canonical URL on ${route}`,
      errors,
    );
    if (canonicalPath && canonicalPath !== route) {
      errors.push(
        `Canonical URL on ${route} does not match exported route: ${canonical}`,
      );
    }
  }

  if (document.querySelectorAll("h1").length !== 1) {
    errors.push(`Indexable page must have exactly one H1: ${route}`);
  }

  const ogImages = document.querySelectorAll('meta[property="og:image"]');
  if (ogImages.length !== 1 || !ogImages[0].getAttribute("content")?.trim()) {
    errors.push(`Indexable page must have exactly one Open Graph image: ${route}`);
  } else {
    validateLocalResource({
      exportDirectory,
      rawUrl: ogImages[0].getAttribute("content"),
      pageRoute: route,
      label: "Open Graph image",
      errors,
    });
  }

  for (const resource of document.querySelectorAll(
    "img[src], script[src], link[href]",
  )) {
    if (
      resource.matches('link[rel~="canonical"], link[rel~="alternate"]')
    ) {
      continue;
    }
    const rawUrl = resource.getAttribute("src") ?? resource.getAttribute("href");
    if (!rawUrl) continue;
    validateLocalResource({
      exportDirectory,
      rawUrl,
      pageRoute: route,
      label: "Local resource",
      errors,
    });
  }

  return { file, route, indexable, title, description, document };
}

function validateUniqueMetadata(pages, errors) {
  const titles = new Map();
  const descriptions = new Map();

  for (const page of pages.filter((candidate) => candidate.indexable)) {
    if (page.title) {
      const key = normalizedText(page.title);
      if (titles.has(key)) {
        errors.push(
          `Duplicate title on ${titles.get(key)} and ${page.route}: ${page.title}`,
        );
      } else {
        titles.set(key, page.route);
      }
    }
    if (page.description) {
      const key = normalizedText(page.description);
      if (descriptions.has(key)) {
        errors.push(
          `Duplicate description on ${descriptions.get(key)} and ${page.route}: ${page.description}`,
        );
      } else {
        descriptions.set(key, page.route);
      }
    }
  }
}

function validateInternalLinks(pages, pageByRoute, exportDirectory, errors) {
  for (const page of pages.filter((candidate) => candidate.indexable)) {
    for (const anchor of page.document.querySelectorAll("a[href]")) {
      const rawHref = anchor.getAttribute("href")?.trim();
      if (!rawHref || /^(?:mailto:|tel:|javascript:|data:)/i.test(rawHref)) {
        continue;
      }

      let url;
      try {
        url = new URL(rawHref, `${CANONICAL_ORIGIN}${page.route}`);
      } catch {
        errors.push(`Broken internal link on ${page.route}: ${rawHref}`);
        continue;
      }
      if (url.origin !== CANONICAL_ORIGIN) continue;

      const extension = extname(url.pathname).toLowerCase();
      if (extension && extension !== ".html") {
        validateLocalResource({
          exportDirectory,
          rawUrl: url.toString(),
          pageRoute: page.route,
          label: "Broken internal resource link",
          errors,
        });
        continue;
      }

      const targetRoute = normalizePagePathname(url.pathname);
      if (!pageByRoute.get(targetRoute)?.indexable) {
        errors.push(
          `Broken internal link on ${page.route}: ${rawHref} -> ${targetRoute}`,
        );
      }
    }
  }
}

function readSitemap(exportDirectory, errors) {
  const path = resolve(exportDirectory, "sitemap.xml");
  if (!existsSync(path)) {
    errors.push("Missing sitemap.xml in static export");
    return [];
  }

  let document;
  try {
    document = new JSDOM(readFileSync(path, "utf8"), {
      contentType: "text/xml",
    }).window.document;
  } catch {
    errors.push("sitemap.xml is not valid XML");
    return [];
  }

  const routes = [];
  const seen = new Set();
  for (const loc of document.querySelectorAll("url > loc")) {
    const rawUrl = loc.textContent?.trim() ?? "";
    const route = canonicalRoute(rawUrl, "Sitemap URL", errors);
    if (!route) continue;
    if (seen.has(route)) {
      errors.push(`Duplicate sitemap URL after normalization: ${rawUrl}`);
    } else {
      seen.add(route);
    }
    routes.push(route);
  }
  if (routes.length === 0) errors.push("sitemap.xml contains no URLs");
  return routes;
}

export function validateExport(exportDirectoryInput = "out") {
  const exportDirectory = resolve(exportDirectoryInput);
  const errors = [];
  if (!existsSync(exportDirectory) || !statSync(exportDirectory).isDirectory()) {
    return { errors: [`Static export directory not found: ${exportDirectory}`] };
  }

  const htmlFiles = walk(exportDirectory).filter((file) => file.endsWith(".html"));
  if (htmlFiles.length === 0) {
    errors.push(`No HTML files found in ${exportDirectory}`);
  }

  const pages = htmlFiles.map((file) => {
    const route = routeForHtml(exportDirectory, file);
    const document = new JSDOM(readFileSync(file, "utf8")).window.document;
    return validateDocument({ exportDirectory, file, route, document, errors });
  });

  const pageByRoute = new Map();
  for (const page of pages) {
    if (pageByRoute.has(page.route)) {
      errors.push(`Duplicate static HTML route: ${page.route}`);
    } else {
      pageByRoute.set(page.route, page);
    }
  }

  validateUniqueMetadata(pages, errors);
  validateInternalLinks(pages, pageByRoute, exportDirectory, errors);

  const sitemapRoutes = readSitemap(exportDirectory, errors);
  const sitemapRouteSet = new Set(sitemapRoutes);
  for (const route of sitemapRouteSet) {
    const page = pageByRoute.get(route);
    if (!page) {
      errors.push(`Sitemap URL has no static HTML: ${route}`);
    } else if (!page.indexable) {
      errors.push(`Sitemap URL points to noindex HTML: ${route}`);
    }
  }
  for (const page of pages.filter((candidate) => candidate.indexable)) {
    if (!sitemapRouteSet.has(page.route)) {
      errors.push(`Indexable HTML is missing from sitemap: ${page.route}`);
    }
  }

  return {
    errors,
    indexablePageCount: pages.filter((page) => page.indexable).length,
    sitemapUrlCount: sitemapRoutes.length,
  };
}

const isCli =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const result = validateExport(process.argv[2] ?? "out");
  if (result.errors.length > 0) {
    console.error(
      `SEO export check failed with ${result.errors.length} error(s):\n${result.errors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `SEO export check passed: ${result.indexablePageCount} indexable pages, ${result.sitemapUrlCount} sitemap URLs.`,
    );
  }
}
