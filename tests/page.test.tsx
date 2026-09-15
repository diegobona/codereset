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
  it("leads with the visitor's reset question and the real reset desk", async () => {
    const HomePage = await loadHomePage();
    const { container } = render(<HomePage />);

    expect(screen.getByRole("heading", {
      level: 1,
      name: /when does my codex limit reset/i,
    })).toBeInTheDocument();
    expect(screen.getByLabelText("Paste Codex status")).toBeInTheDocument();
    expect(container.querySelector(".console-wrap")).toBeNull();
  });

  it("clearly labels the personal quota workspace", async () => {
    const HomePage = await loadHomePage();
    render(<HomePage />);

    const personalQuota = screen.getByRole("region", { name: "My personal quota" });
    expect(within(personalQuota).getByRole("heading", {
      level: 2,
      name: "My personal quota",
    })).toBeInTheDocument();
  });

  it("shows a compact public global reset signal without confusing it with account quota", async () => {
    const HomePage = await loadHomePage();
    render(<HomePage />);

    const signal = screen.getByRole("region", { name: /latest global reset signal/i });
    expect(within(signal).getByRole("heading", {
      level: 2,
      name: /time since the last global reset/i,
    })).toBeInTheDocument();
    expect(within(signal).getByText(/public signal, not your account timer/i)).toBeInTheDocument();
    expect(within(signal).getAllByTestId("global-reset-unit")).toHaveLength(4);
    expect(within(signal).getByText("48", { exact: true })).toBeInTheDocument();
    expect(within(signal).getByText("7", { exact: true })).toBeInTheDocument();
    expect(within(signal).getByText("7.7d", { exact: true })).toBeInTheDocument();
    expect(within(signal).getByText("67.7d", { exact: true })).toBeInTheDocument();
    expect(within(signal).getByRole("link", { name: /data from codexreset.dev/i })).toHaveAttribute(
      "href",
      "https://codexreset.dev/events/cr-2098685367058612394",
    );
  });

  it("shows today's signal state and when the source feed was last checked", async () => {
    const HomePage = await loadHomePage();
    render(<HomePage />);

    const signal = screen.getByRole("region", { name: /latest global reset signal/i });
    expect(within(signal).getByText("TODAY / UNKNOWN", { exact: true })).toBeInTheDocument();
    expect(within(signal).getByText(/last checked.*sep 15, 2026.*08:32 utc/i)).toBeInTheDocument();
  });

  it("shows the latest event scope and links to both the record and original evidence", async () => {
    const HomePage = await loadHomePage();
    render(<HomePage />);

    const signal = screen.getByRole("region", { name: /latest global reset signal/i });
    expect(within(signal).getByText(/scope.*accounts specified in the original announcement/i))
      .toBeInTheDocument();
    expect(within(signal).getByText("ARCHIVED RECORD", { exact: true })).toBeInTheDocument();
    expect(within(signal).getByRole("link", { name: /original post/i })).toHaveAttribute(
      "href",
      "https://x.com/thsottiaux/status/2098685367058612394",
    );
    expect(within(signal).getByRole("link", { name: /data from codexreset.dev/i })).toHaveAttribute(
      "href",
      "https://codexreset.dev/events/cr-2098685367058612394",
    );
  });

  it("removes nonessential previews, explainers, alerts, and FAQ from the default homepage", async () => {
    const HomePage = await loadHomePage();
    const { container } = render(<HomePage />);

    expect(container.querySelector(".ticker")).toBeNull();
    expect(container.querySelector("#how-it-works")).toBeNull();
    expect(container.querySelector(".privacy-section")).toBeNull();
    expect(container.querySelector("#signal-log")).toBeNull();
    expect(container.querySelector("#field-manual")).toBeNull();
    expect(container.querySelector(".faq-section")).toBeNull();
    expect(container.querySelector("#alerts")).toBeNull();
    expect(container).not.toHaveTextContent("$9");
    expect(container).not.toHaveTextContent(/\bSMS\b/i);
    expect(screen.getByRole("heading", { level: 2, name: "Common questions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /how to check codex usage/i })).toHaveAttribute(
      "href",
      "/guides/check-codex-usage",
    );
    expect(screen.getByRole("link", { name: /when does the 5-hour limit reset/i })).toHaveAttribute(
      "href",
      "/guides/5-hour-limit",
    );
    expect(screen.getByRole("link", { name: /when does the weekly limit reset/i })).toHaveAttribute(
      "href",
      "/guides/weekly-limit",
    );
    expect(screen.getByRole("link", { name: /what are banked resets/i })).toHaveAttribute(
      "href",
      "/guides/banked-resets",
    );
  });

  it("uses a compact footer without affiliation, trademark, or marketing copy", async () => {
    const HomePage = await loadHomePage();
    const { container } = render(<HomePage />);

    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
    expect(container).not.toHaveTextContent(/independent project/i);
    expect(container).not.toHaveTextContent(/not affiliated with openai/i);
    expect(container).not.toHaveTextContent(/trademarks of their respective owners/i);
    expect(container).not.toHaveTextContent(/people who ship with ai/i);
  });

  it("renders the early-access offer when the build flag is enabled", async () => {
    const HomePage = await loadHomePage(true);
    render(<HomePage />);

    expect(screen.getByText("$9", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("Email + SMS delivery", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join early access/i })).toBeInTheDocument();
  });
});

describe("AlertOffer", () => {
  it("renders nothing when explicitly disabled", () => {
    const { container } = render(<AlertOffer enabled={false} />);

    expect(container).toBeEmptyDOMElement();
    expect(container).not.toHaveTextContent("$9");
    expect(container).not.toHaveTextContent(/\bSMS\b/i);
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
      expect(within(breadcrumbs).queryByText("Field manual")).not.toBeInTheDocument();
      expect(within(breadcrumbs).getByText(guide.title)).toHaveAttribute(
        "aria-current",
        "page",
      );
      const headerBackLink = container.querySelector(".guide-back");
      expect(headerBackLink).toHaveAttribute("href", "/#reset-desk");
      expect(headerBackLink).toHaveTextContent("Reset desk");
      expect(container).not.toHaveTextContent("All field notes");
      expect(container.querySelector(".guide-footer")).not.toHaveTextContent(
        /not affiliated with openai/i,
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
