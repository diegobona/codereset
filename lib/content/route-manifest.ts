import { guides } from "@/lib/content";

export type PublishedRoute = {
  pathname: string;
  kind: "home" | "guide" | "privacy";
  slug: string | null;
  lastModified: string;
  indexable: boolean;
};

const routeCandidates: PublishedRoute[] = [
  {
    pathname: "/",
    kind: "home",
    slug: null,
    lastModified: "2026-09-15",
    indexable: true,
  },
  {
    pathname: "/privacy",
    kind: "privacy",
    slug: null,
    lastModified: "2026-09-15",
    indexable: true,
  },
  ...guides.map((guide) => ({
    pathname: `/guides/${guide.slug}`,
    kind: "guide" as const,
    slug: guide.slug,
    lastModified: guide.lastReviewed,
    indexable: true,
  })),
];

function validatePublishedRoutes(routes: PublishedRoute[]) {
  const pathnames = new Set<string>();
  const guideSlugs = new Set<string>();

  for (const route of routes) {
    const url = new URL(route.pathname, "https://manifest.invalid");
    if (
      !route.pathname.startsWith("/") ||
      url.origin !== "https://manifest.invalid" ||
      url.pathname !== route.pathname ||
      url.search ||
      url.hash ||
      (route.pathname !== "/" && route.pathname.endsWith("/"))
    ) {
      throw new Error(`Invalid published pathname: ${route.pathname}`);
    }
    if (pathnames.has(route.pathname)) {
      throw new Error(`Duplicate published pathname: ${route.pathname}`);
    }
    pathnames.add(route.pathname);

    const date = new Date(`${route.lastModified}T00:00:00.000Z`);
    const isValidDate =
      /^\d{4}-\d{2}-\d{2}$/.test(route.lastModified) &&
      !Number.isNaN(date.valueOf()) &&
      date.toISOString().slice(0, 10) === route.lastModified;
    if (!isValidDate) {
      throw new Error(`Invalid lastModified for ${route.pathname}`);
    }

    if (route.kind === "home") {
      if (route.pathname !== "/" || route.slug !== null) {
        throw new Error("The home route must use pathname / and a null slug");
      }
      continue;
    }

    if (route.kind === "privacy") {
      if (route.pathname !== "/privacy" || route.slug !== null) {
        throw new Error(
          "The privacy route must use pathname /privacy and a null slug",
        );
      }
      continue;
    }

    if (
      !route.slug ||
      !/^[a-z0-9-]+$/.test(route.slug) ||
      route.pathname !== `/guides/${route.slug}`
    ) {
      throw new Error(`Invalid guide route: ${route.pathname}`);
    }
    if (guideSlugs.has(route.slug)) {
      throw new Error(`Duplicate published guide slug: ${route.slug}`);
    }
    guideSlugs.add(route.slug);
  }

  return routes
    .filter((route) => route.indexable)
    .map((route) => Object.freeze({ ...route }));
}

export const publishedRoutes = Object.freeze(
  validatePublishedRoutes(routeCandidates),
);
