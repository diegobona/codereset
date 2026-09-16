import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResetTimePage, { metadata } from "@/app/reset-time/page";
import GuidePage from "@/app/guides/[slug]/page";
import HomePage from "@/app/page";
import { ResetTimeConverter } from "@/components/tools/reset-time-converter";
import { publishedRoutes } from "@/lib/content/route-manifest";

function blobText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}

describe("ResetTimePage", () => {
  beforeEach(() => {
    window.localStorage.setItem("codereset:analytics:disabled", "true");
  });

  it("publishes one compact, canonical reset-time tool page", () => {
    render(<ResetTimePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Convert a Codex reset time",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Reset timestamp")).toBeInTheDocument();
    expect(screen.getByLabelText("Display timezone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Convert time" }),
    ).toBeInTheDocument();
    expect(metadata.alternates?.canonical).toBe(
      "https://codereset.dev/reset-time",
    );
    expect(metadata.openGraph).toMatchObject({
      url: "https://codereset.dev/reset-time",
      images: [
        expect.objectContaining({
          url: "https://codereset.dev/og-default.png",
          width: 1200,
          height: 630,
        }),
      ],
    });
  });

  it("initializes anonymous measurement under the reset-time page kind", async () => {
    const { ANALYTICS_STORAGE_KEYS, setAnalyticsOptOut } = await import(
      "@/lib/analytics/events"
    );
    setAnalyticsOptOut(false);
    window.localStorage.removeItem(ANALYTICS_STORAGE_KEYS.firstSeenDate);
    window.sessionStorage.clear();
    const payloads: string[] = [];
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn((_url: string, blob: Blob) => {
        void blobText(blob).then((text) => payloads.push(text));
        return true;
      }),
    });

    render(<ResetTimePage />);

    await vi.waitFor(() => expect(payloads).toHaveLength(1));
    expect(JSON.parse(payloads[0])).toMatchObject({
      event: "first_visit",
      page: "reset-time",
    });
  });

  it("converts an absolute timestamp with daylight-saving rules", () => {
    render(<ResetTimeConverter />);

    fireEvent.change(screen.getByLabelText("Reset timestamp"), {
      target: { value: "2026-07-15T17:00:00Z" },
    });
    fireEvent.change(screen.getByLabelText("Display timezone"), {
      target: { value: "America/New_York" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Convert time" }));

    const result = screen.getByRole("status");
    expect(within(result).getByText("Wednesday, July 15, 2026")).toBeInTheDocument();
    expect(within(result).getByText("1:00 PM")).toBeInTheDocument();
    expect(within(result).getByText(/EDT · UTC-04:00/)).toBeInTheDocument();
    expect(within(result).getByText("Same calendar day as UTC")).toBeInTheDocument();
  });

  it("records only a coarse successful-conversion event", async () => {
    window.localStorage.removeItem("codereset:analytics:disabled");
    window.sessionStorage.clear();
    const payloads: string[] = [];
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn((_url: string, blob: Blob) => {
        void blobText(blob).then((text) => payloads.push(text));
        return true;
      }),
    });
    render(<ResetTimeConverter />);

    fireEvent.change(screen.getByLabelText("Reset timestamp"), {
      target: { value: "2026-07-15T17:00:00Z" },
    });
    fireEvent.change(screen.getByLabelText("Display timezone"), {
      target: { value: "America/New_York" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Convert time" }));

    await vi.waitFor(() => expect(payloads).toHaveLength(1));
    expect(JSON.parse(payloads[0])).toEqual({
      event: "reset_time_convert",
      page: "reset-time",
      device: expect.stringMatching(/^(mobile|tablet|desktop)$/),
    });
    expect(payloads[0]).not.toContain("2026-07-15");
    expect(payloads[0]).not.toContain("America/New_York");
  });

  it("rejects an ambiguous timestamp without a timezone", () => {
    render(<ResetTimeConverter />);

    fireEvent.change(screen.getByLabelText("Reset timestamp"), {
      target: { value: "2026-09-15T18:30:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Convert time" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /include z or an explicit offset/i,
    );
  });

  it("downloads a five-minute calendar reminder for the same instant", () => {
    const createObjectURL = vi.fn(() => "blob:reset-reminder");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    render(<ResetTimeConverter />);

    fireEvent.change(screen.getByLabelText("Reset timestamp"), {
      target: { value: "2026-09-15T18:30:00+08:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Convert time" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Download 5-minute reminder" }),
    );

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:reset-reminder");
  });
});

describe("reset-time discovery", () => {
  it("adds the tool to the homepage and published route manifest", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: /convert a codex reset time/i }),
    ).toHaveAttribute("href", "/reset-time");
    expect(publishedRoutes).toContainEqual(
      expect.objectContaining({ pathname: "/reset-time", kind: "tool" }),
    );
  });

  it.each(["5-hour-limit", "weekly-limit"])(
    "links the %s guide to the converter",
    async (slug) => {
      render(await GuidePage({ params: Promise.resolve({ slug }) }));

      expect(
        screen.getByRole("link", { name: /convert this reset time/i }),
      ).toHaveAttribute("href", "/reset-time");
    },
  );
});
