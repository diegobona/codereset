import { render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import type { Metadata } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AlertOffer } from "@/components/alert-offer";

async function loadHomePage(showAlertOffer = false) {
  vi.stubEnv(
    "NEXT_PUBLIC_SHOW_ALERT_OFFER",
    showAlertOffer ? "true" : undefined,
  );
  vi.resetModules();

  return (await import("@/app/page")).default;
}

afterEach(() => vi.unstubAllEnvs());

type TrustPageModule = {
  default: ComponentType;
  metadata: Metadata;
};

function loadTrustPage(moduleName: string): Promise<TrustPageModule> {
  return import(
    /* @vite-ignore */ `../app/${moduleName}/page.tsx`
  ) as Promise<TrustPageModule>;
}

describe("HomePage", () => {
  it("leads with a clear quota reset promise", async () => {
    const HomePage = await loadHomePage();
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /know exactly when you can ship again/i }),
    ).toBeInTheDocument();
  });

  it("explains the private local tracking model", async () => {
    const HomePage = await loadHomePage();
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /your quota stays on your device/i }),
    ).toBeInTheDocument();
  });

  it("distinguishes personal windows from public reset events", async () => {
    const HomePage = await loadHomePage();
    render(<HomePage />);

    expect(screen.getByText("Your quota window", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("Public reset event", { exact: true })).toBeInTheDocument();
  });

  it("discloses that the product is independent", async () => {
    const HomePage = await loadHomePage();
    render(<HomePage />);

    expect(screen.getByText(/not affiliated with openai/i)).toBeInTheDocument();
  });

  it("keeps the unvalidated alert offer out of the default homepage", async () => {
    const HomePage = await loadHomePage();
    const { container } = render(<HomePage />);

    expect(container.querySelector("#alerts")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /alerts are planned for later/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alert roadmap/i })).toHaveAttribute(
      "href",
      "#alerts",
    );
    expect(container).not.toHaveTextContent("$9");
    expect(container).not.toHaveTextContent(/\bSMS\b/i);
    expect(container).not.toHaveTextContent(/get reset alerts/i);
    expect(container).not.toHaveTextContent(/verified global reset alerts/i);
    expect(container.querySelector('a[href^="mailto:"], form')).toBeNull();
    expect(screen.getByText("PRODUCT PREVIEW", { exact: true })).toBeInTheDocument();
  });

  it("renders the early-access offer when the build flag is enabled", async () => {
    const HomePage = await loadHomePage(true);
    render(<HomePage />);

    expect(screen.getByRole("link", { name: /get reset alerts/i })).toHaveAttribute(
      "href",
      "#alerts",
    );
    expect(screen.getByText("$9", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("Email + SMS delivery", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join early access/i })).toBeInTheDocument();
  });
});

describe("AlertOffer", () => {
  it("renders a non-collecting roadmap when explicitly disabled", () => {
    const { container } = render(<AlertOffer enabled={false} />);

    expect(
      screen.getByRole("heading", { name: /alerts are planned for later/i }),
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent("$9");
    expect(container).not.toHaveTextContent(/\bSMS\b/i);
    expect(container.querySelector('a[href^="mailto:"], form')).toBeNull();
  });

  it("renders the preserved early-access offer when explicitly enabled", () => {
    render(<AlertOffer enabled />);

    expect(screen.getByText("$9", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("/ month", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("Email + SMS delivery", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join early access/i })).toHaveAttribute(
      "href",
      "mailto:hello@codereset.dev?subject=CodeReset%20Pro%20early%20access",
    );
  });
});

describe("evidence-first guide template", () => {
  it("renders the answer, review cycle, evidence, breadcrumbs, related guides, and trust links for every guide", async () => {
    const [{ default: GuidePage }, { guides, getGuide }] = await Promise.all([
      import("@/app/guides/[slug]/page"),
      import("@/lib/content"),
    ]);

    for (const guide of guides) {
      const { container, unmount } = render(
        await GuidePage({ params: Promise.resolve({ slug: guide.slug }) }),
      );

      expect(screen.getByRole("heading", { level: 1, name: guide.title })).toBeInTheDocument();
      expect(screen.getByText("QUICK ANSWER", { exact: true })).toBeInTheDocument();
      const quickAnswer = container.querySelector(".quick-answer");
      expect(quickAnswer).not.toBeNull();
      expect(quickAnswer?.querySelector("p")?.textContent?.replace(/\s+/g, " ").trim()).toBe(
        guide.answer.replace(/\s+/g, " ").trim(),
      );
      expect(container).toHaveTextContent(`LAST REVIEWED / ${guide.lastReviewed}`);
      expect(container).toHaveTextContent(`NEXT REVIEW / ${guide.reviewAfter}`);

      const breadcrumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(within(breadcrumbs).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
      expect(within(breadcrumbs).getByText(guide.title)).toHaveAttribute(
        "aria-current",
        "page",
      );

      const sources = screen.getByRole("region", { name: "Sources and claim status" });
      for (const claim of guide.evidence) {
        const claimRow = sources.querySelector(`[data-claim-id="${claim.id}"]`);
        expect(claimRow).not.toBeNull();
        expect(claimRow).toHaveTextContent(claim.statement);
        expect(claimRow).toHaveTextContent(claim.factStatus);
        expect(claimRow).toHaveTextContent(`Verified ${claim.verifiedAt}`);
        expect(claimRow).toHaveTextContent(`Review by ${claim.reviewAfter}`);

        for (const source of claim.sources) {
          expect(claimRow).toHaveTextContent(source.publisher);
          if (source.evidenceType === "web-page") {
            const link = within(claimRow as HTMLElement)
              .getAllByRole("link", { name: source.publisher })
              .find((candidate) => candidate.getAttribute("href") === source.url);
            expect(link).toBeDefined();
            expect(link).toHaveAttribute("href", source.url);
            expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
            expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
          }
        }
      }

      for (const slug of guide.related) {
        const related = getGuide(slug);
        if (!related) throw new Error(`Missing related guide ${slug}`);
        expect(screen.getByRole("link", { name: new RegExp(related.title, "i") })).toHaveAttribute(
          "href",
          `/guides/${slug}`,
        );
      }
      expect(
        screen
          .getAllByRole("link", { name: "Methodology" })
          .some((link) => link.getAttribute("href") === "/methodology"),
      ).toBe(true);
      expect(
        screen
          .getAllByRole("link", { name: "Corrections" })
          .some((link) => link.getAttribute("href") === "/corrections"),
      ).toBe(true);

      unmount();
    }
  });
});

describe("trust pages", () => {
  it.each([
    ["about", "/about", /about codereset/i],
    ["methodology", "/methodology", /methodology/i],
    ["corrections", "/corrections", /corrections/i],
  ] as const)("publishes a self-canonical %s page with unique social metadata", async (
    moduleName,
    pathname,
    heading,
  ) => {
    const pageModule = await loadTrustPage(moduleName);
    const { container } = render(<pageModule.default />);

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(pageModule.metadata.alternates?.canonical).toBe(`https://codereset.dev${pathname}`);
    expect(pageModule.metadata.title).toBeTruthy();
    expect(pageModule.metadata.description).toBeTruthy();
    expect(pageModule.metadata.openGraph).toMatchObject({
      url: `https://codereset.dev${pathname}`,
      images: [
        expect.objectContaining({
          width: 1200,
          height: 630,
        }),
      ],
    });
    expect(screen.getByRole("navigation", { name: "Site" })).toBeInTheDocument();
    expect(container).not.toHaveTextContent("$9");
    expect(container).not.toHaveTextContent(/\bSMS\b/i);
  });

  it("states ownership, independence, contact, and commercial disclosures without inventing an operator", async () => {
    const { default: AboutPage } = await loadTrustPage("about");
    render(<AboutPage />);

    expect(screen.getAllByText(/independent project/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/not affiliated with openai/i)).toBeInTheDocument();
    expect(screen.getByText(/codereset project and its maintainers/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hello@codereset.dev" })).toHaveAttribute(
      "href",
      "mailto:hello@codereset.dev",
    );
    expect(screen.getByText(/no sponsored placements, affiliate links, or paid rankings/i)).toBeInTheDocument();
  });

  it("documents fact status, review cadence, source priority, citations, and corrections", async () => {
    const { default: MethodologyPage } = await loadTrustPage("methodology");
    const { container } = render(<MethodologyPage />);

    for (const status of ["official", "observed", "inference", "unknown"]) {
      expect(container).toHaveTextContent(status);
    }
    expect(container).toHaveTextContent(/official claims.*14 days/i);
    expect(container).toHaveTextContent(/observed claims.*7 days/i);
    expect(container).toHaveTextContent(/account interface.*takes priority/i);
    expect(container).toHaveTextContent(/claim.*source/i);
    expect(screen.getByRole("link", { name: /corrections process/i })).toHaveAttribute(
      "href",
      "/corrections",
    );
  });

  it("provides an evidence-based correction channel without a response-time promise", async () => {
    const { default: CorrectionsPage } = await loadTrustPage("corrections");
    const { container } = render(<CorrectionsPage />);

    expect(screen.getByRole("link", { name: "hello@codereset.dev" })).toHaveAttribute(
      "href",
      "mailto:hello@codereset.dev?subject=CodeReset%20correction",
    );
    expect(container).toHaveTextContent(/page URL/i);
    expect(container).toHaveTextContent(/supporting evidence/i);
    expect(container).toHaveTextContent(/review.*update.*correction record/i);
    expect(container).not.toHaveTextContent(/within \d+ (?:hours?|days?)/i);
  });

  it("includes all three trust pages in the published route manifest", async () => {
    const { publishedRoutes } = await import("@/lib/content/route-manifest");

    expect(publishedRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pathname: "/about", kind: "trust", lastModified: "2026-09-15" }),
        expect.objectContaining({ pathname: "/methodology", kind: "trust", lastModified: "2026-09-15" }),
        expect.objectContaining({ pathname: "/corrections", kind: "trust", lastModified: "2026-09-15" }),
      ]),
    );
  });
});
