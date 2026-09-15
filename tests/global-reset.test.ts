import { describe, expect, it } from "vitest";
import {
  getElapsedParts,
  normalizeGlobalResetStatus,
} from "@/lib/global-reset";

const statusPayload = {
  status: "unknown",
  generatedAt: "2026-09-15T08:32:09.919Z",
  latestReset: {
    id: "cr-2098685367058612394",
    type: "global_reset",
    status: "recorded",
    announced_at: "2026-09-12T08:09:17Z",
    effective_at: "2026-09-12T08:09:17Z",
    source_url: "https://x.com/thsottiaux/status/2098685367058612394",
    source_author: "@thsottiaux (archived by Codex Resets)",
    time_basis: "announcement",
  },
  events: [
    {
      id: "newest",
      type: "global_reset",
      effective_at: "2026-09-12T08:09:17Z",
    },
    {
      id: "recent",
      type: "global_reset",
      effective_at: "2026-09-08T08:09:17Z",
    },
    {
      id: "older",
      type: "global_reset",
      effective_at: "2026-08-01T08:09:17Z",
    },
    {
      id: "banked",
      type: "banked_reset",
      effective_at: "2026-09-05T08:09:17Z",
    },
  ],
};

describe("global reset data", () => {
  it("keeps an unknown API state distinct from the latest recorded signal", () => {
    const snapshot = normalizeGlobalResetStatus(statusPayload);

    expect(snapshot).toMatchObject({
      state: "unknown",
      eventId: "cr-2098685367058612394",
      effectiveAt: "2026-09-12T08:09:17.000Z",
      sourceUrl: "https://x.com/thsottiaux/status/2098685367058612394",
      scope: "Accounts specified in the original announcement",
      recordState: "archived",
      totalRecorded: 3,
      recordedLast30Days: 2,
    });
    expect(snapshot?.eventUrl).toBe(
      "https://codexreset.dev/events/cr-2098685367058612394",
    );
  });

  it("formats elapsed time as stable day, hour, minute, and second parts", () => {
    expect(getElapsedParts(
      "2026-09-12T08:09:17Z",
      new Date("2026-09-15T10:11:20Z"),
    )).toEqual({ days: 3, hours: 2, minutes: 2, seconds: 3 });
  });

  it("never renders a negative elapsed timer", () => {
    expect(getElapsedParts(
      "2026-09-16T08:09:17Z",
      new Date("2026-09-15T10:11:20Z"),
    )).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("rejects malformed reset records instead of presenting them as facts", () => {
    expect(normalizeGlobalResetStatus({
      status: "recorded_today",
      latestReset: {
        id: "javascript:alert(1)",
        type: "global_reset",
        effective_at: "not-a-date",
        source_url: "javascript:alert(1)",
      },
      events: [],
    })).toBeNull();
  });
});
