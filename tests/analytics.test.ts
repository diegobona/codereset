import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const validRequest = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://codereset.dev/api/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://codereset.dev",
      ...headers,
    },
    body,
  });

function blobText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}

describe("analytics payload validation", () => {
  it("accepts only the documented event allowlist and coarse dimensions", async () => {
    const { ALLOWED_EVENTS, validateAnalyticsPayload } = await import(
      "@/lib/analytics/events"
    );

    expect(ALLOWED_EVENTS).toEqual([
      "first_visit",
      "desk_start",
      "manual_setup_start",
      "manual_setup_complete",
      "parser_attempt",
      "parser_success",
      "desk_complete",
      "ics_download",
      "share_card_download",
      "guide_pageview",
      "guide_to_desk_click",
      "return_7d",
      "return_30d",
    ]);
    expect(
      validateAnalyticsPayload({
        event: "parser_success",
        page: "home",
        device: "desktop",
      }),
    ).toEqual({
      ok: true,
      value: { event: "parser_success", page: "home", device: "desktop" },
    });
    expect(validateAnalyticsPayload({ event: "made_up" })).toEqual({ ok: false });
    expect(
      validateAnalyticsPayload({ event: "parser_success", page: "pricing" }),
    ).toEqual({ ok: false });
    expect(
      validateAnalyticsPayload({ event: "parser_success", device: "phone-xl" }),
    ).toEqual({ ok: false });
  });

  it.each([
    ["pasted text", { statusText: "Weekly limit: 41% left" }],
    ["usage percentage", { usagePercent: 41 }],
    ["remaining percentage", { remainingPercent: 41 }],
    ["reset timestamp", { resetAt: "2026-09-20T09:00:00Z" }],
    ["visitor id", { visitorId: "visitor-123" }],
    ["stable id", { distinctId: "stable-123" }],
    ["arbitrary unknown field", { campaign: "launch" }],
  ])("rejects %s", async (_label, forbidden) => {
    const { validateAnalyticsPayload } = await import("@/lib/analytics/events");

    expect(
      validateAnalyticsPayload({ event: "parser_attempt", ...forbidden }),
    ).toEqual({ ok: false });
  });
});

describe("Cloudflare Pages analytics endpoint", () => {
  beforeEach(() => vi.resetModules());

  it.each([
    [
      "unknown events",
      JSON.stringify({ event: "made_up", page: "home", device: "desktop" }),
    ],
    [
      "pasted text",
      JSON.stringify({
        event: "parser_attempt",
        page: "home",
        device: "desktop",
        statusText: "Weekly limit: 41% left",
      }),
    ],
    [
      "usage percentages",
      JSON.stringify({ event: "desk_complete", remainingPercent: 41 }),
    ],
    [
      "reset timestamps",
      JSON.stringify({
        event: "desk_complete",
        resetAt: "2026-09-20T09:00:00Z",
      }),
    ],
    [
      "visitor identifiers",
      JSON.stringify({ event: "first_visit", visitorId: "visitor-123" }),
    ],
    [
      "stable identifiers",
      JSON.stringify({ event: "first_visit", anonymousId: "stable-123" }),
    ],
    [
      "oversize payloads",
      `${JSON.stringify({ event: "first_visit" })}${" ".repeat(1_100)}`,
    ],
  ])("rejects %s without writing a data point", async (_label, body) => {
    const { onRequest } = await import("@/functions/api/events");
    const writeDataPoint = vi.fn();

    const response = await onRequest({
      request: validRequest(body),
      env: { SEO_EVENTS: { writeDataPoint } },
    });

    expect(response.status).toBe(400);
    expect(writeDataPoint).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it.each([
    ["non-POST requests", new Request("https://codereset.dev/api/events")],
    [
      "non-JSON requests",
      validRequest(JSON.stringify({ event: "first_visit" }), {
        "content-type": "text/plain",
      }),
    ],
    [
      "cross-origin requests",
      validRequest(JSON.stringify({ event: "first_visit" }), {
        origin: "https://example.com",
      }),
    ],
  ])("rejects %s", async (_label, request) => {
    const { onRequest } = await import("@/functions/api/events");
    const writeDataPoint = vi.fn();

    const response = await onRequest({
      request,
      env: { SEO_EVENTS: { writeDataPoint } },
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it("writes only event name and approved dimensions", async () => {
    const { onRequest } = await import("@/functions/api/events");
    const writeDataPoint = vi.fn();

    const response = await onRequest({
      request: validRequest(
        JSON.stringify({
          event: "guide_pageview",
          page: "guide",
          device: "mobile",
        }),
      ),
      env: { SEO_EVENTS: { writeDataPoint } },
    });

    expect(response.status).toBe(204);
    expect(writeDataPoint).toHaveBeenCalledWith({
      blobs: ["guide_pageview", "guide", "mobile"],
    });
    expect(writeDataPoint).toHaveBeenCalledTimes(1);
  });

  it("fails closed with an explicit status when the binding is unavailable", async () => {
    const { onRequest } = await import("@/functions/api/events");

    const response = await onRequest({
      request: validRequest(JSON.stringify({ event: "first_visit" })),
      env: {},
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      status: "analytics_unavailable",
    });
  });
});

describe("privacy-safe browser analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("prefers sendBeacon and deduplicates the same event within a session", async () => {
    const sendBeacon = vi.fn((url: string, blob: Blob) => Boolean(url && blob));
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });
    const { trackEvent } = await import("@/lib/analytics/events");

    expect(trackEvent("parser_attempt", { page: "home", device: "desktop" })).toBe(
      true,
    );
    expect(trackEvent("parser_attempt", { page: "home", device: "desktop" })).toBe(
      false,
    );

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeacon.mock.calls[0];
    expect(url).toBe("/api/events");
    await expect(blobText(blob as Blob)).resolves.toBe(
      JSON.stringify({
        event: "parser_attempt",
        page: "home",
        device: "desktop",
      }),
    );
  });

  it("does not send after the visitor opts out", async () => {
    const sendBeacon = vi.fn((url: string, blob: Blob) => Boolean(url && blob));
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });
    const { setAnalyticsOptOut, trackEvent } = await import(
      "@/lib/analytics/events"
    );

    setAnalyticsOptOut(true);
    expect(trackEvent("desk_start", { page: "home" })).toBe(false);
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("sends 7/30-day return booleans once without creating a stable id", async () => {
    const captured: string[] = [];
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn((_url: string, blob: Blob) => {
        void blobText(blob).then((text) => captured.push(text));
        return true;
      }),
    });
    window.localStorage.setItem(
      "codereset:analytics:v1:first-seen-date",
      "2026-08-01",
    );
    const { initializeAnalytics } = await import("@/lib/analytics/events");

    initializeAnalytics("home", new Date("2026-09-15T09:00:00Z"));
    initializeAnalytics("home", new Date("2026-09-15T09:01:00Z"));
    await vi.waitFor(() => expect(captured).toHaveLength(2));

    expect(captured.map((item) => JSON.parse(item).event).sort()).toEqual([
      "return_30d",
      "return_7d",
    ]);
    expect(Object.keys(window.localStorage).sort()).toEqual([
      "codereset:analytics:v1:first-seen-date",
      "codereset:analytics:v1:return-30d-sent",
      "codereset:analytics:v1:return-7d-sent",
    ]);
    expect(window.localStorage.getItem("codereset:analytics:v1:return-7d-sent")).toBe(
      "true",
    );
  });

  it("initializes anonymous visits and guide pageviews when mounted", async () => {
    const payloads: string[] = [];
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn((_url: string, blob: Blob) => {
        void blobText(blob).then((text) => payloads.push(text));
        return true;
      }),
    });
    const { AnalyticsBootstrap } = await import("@/components/analytics-client");

    render(createElement(AnalyticsBootstrap, { page: "guide", guidePageview: true }));
    await vi.waitFor(() => expect(payloads).toHaveLength(2));

    expect(payloads.map((payload) => JSON.parse(payload).event).sort()).toEqual([
      "first_visit",
      "guide_pageview",
    ]);
  });

  it("mounts measurement on the published home and guide pages", async () => {
    const payloads: string[] = [];
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn((_url: string, blob: Blob) => {
        void blobText(blob).then((text) => payloads.push(text));
        return true;
      }),
    });
    const [{ default: HomePage }, { default: GuidePage }] = await Promise.all([
      import("@/app/page"),
      import("@/app/guides/[slug]/page"),
    ]);
    const home = render(createElement(HomePage));
    await vi.waitFor(() => expect(payloads).toHaveLength(1));
    home.unmount();
    const guide = await GuidePage({
      params: Promise.resolve({ slug: "weekly-limit" }),
    });

    render(guide);
    await vi.waitFor(() => expect(payloads).toHaveLength(2));

    expect(payloads.map((payload) => JSON.parse(payload).event).sort()).toEqual([
      "first_visit",
      "guide_pageview",
    ]);
  });
});

describe("privacy route", () => {
  it("is indexable, self-canonical, and describes storage plus opt-out", async () => {
    const [{ default: PrivacyPage, metadata }, { publishedRoutes }, { default: sitemap }] =
      await Promise.all([
        import("@/app/privacy/page"),
        import("@/lib/content/route-manifest"),
        import("@/app/sitemap"),
      ]);
    const html = renderToStaticMarkup(createElement(PrivacyPage));

    expect(metadata.alternates?.canonical).toBe("https://codereset.dev/privacy");
    expect(metadata.robots).not.toMatchObject({ index: false });
    expect((html.match(/<h1/g) ?? [])).toHaveLength(1);
    expect(html).toContain("codereset:v1:quota");
    expect(html).toContain("codereset:analytics:v1:first-seen-date");
    expect(html).toContain("sessionStorage");
    expect(html).toContain("page");
    expect(html).toContain("device");
    expect(html).toMatch(/retention/i);
    expect(screen.queryByText("Disable anonymous analytics")).not.toBeInTheDocument();
    render(createElement(PrivacyPage));
    fireEvent.click(
      screen.getByRole("button", { name: "Disable anonymous analytics" }),
    );
    expect(window.localStorage.getItem("codereset:analytics:disabled")).toBe(
      "true",
    );
    expect(publishedRoutes).toContainEqual(
      expect.objectContaining({ pathname: "/privacy", kind: "privacy" }),
    );
    expect(sitemap().map((entry) => entry.url)).toContain(
      "https://codereset.dev/privacy",
    );
  });
});
