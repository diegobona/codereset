import { render, screen } from "@testing-library/react";
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
