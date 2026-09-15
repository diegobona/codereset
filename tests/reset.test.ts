import { describe, expect, it } from "vitest";
import {
  createCalendarEvent,
  formatCountdown,
  getPaceState,
  parseResetTimestamp,
  parseUsageStatus,
} from "@/lib/reset";

describe("parseUsageStatus", () => {
  it("parses a human-readable five-hour limit", () => {
    const result = parseUsageStatus(
      "5h limit: 73% left · resets Sep 15, 2026 18:30",
    );

    expect(result.shortWindow?.remainingPercent).toBe(73);
    expect(result.shortWindow?.resetAt).toContain("2026-09-15");
  });

  it("parses an ISO weekly reset timestamp", () => {
    const result = parseUsageStatus(
      "Weekly limit: 41% left · resets 2026-09-20T09:00:00+08:00",
    );

    expect(result.weeklyWindow).toEqual({
      remainingPercent: 41,
      resetAt: "2026-09-20T01:00:00.000Z",
    });
  });

  it("parses both windows from multiline output", () => {
    const result = parseUsageStatus(`5h limit: 73% left · resets Sep 15, 2026 18:30
Weekly limit: 41% left · resets 2026-09-20T09:00:00+08:00`);

    expect(result.shortWindow?.remainingPercent).toBe(73);
    expect(result.weeklyWindow?.remainingPercent).toBe(41);
  });

  it("does not invent windows from malformed text", () => {
    expect(parseUsageStatus("quota vibes: probably fine")).toEqual({});
  });

  it("rejects percentages outside the valid range", () => {
    expect(
      parseUsageStatus("Weekly limit: 101% left · resets 2026-09-20T09:00:00Z"),
    ).toEqual({});
    expect(
      parseUsageStatus("5h limit: 999% left · resets 2026-09-20T09:00:00Z"),
    ).toEqual({});
  });
});

describe("parseResetTimestamp", () => {
  it("parses the supported human format as an explicit local time", () => {
    const date = parseResetTimestamp("Sep 15, 2026 18:30");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(8);
    expect(date?.getDate()).toBe(15);
    expect(date?.getHours()).toBe(18);
    expect(date?.getMinutes()).toBe(30);
  });
});

describe("formatCountdown", () => {
  it("formats a future timestamp into days, hours, and minutes", () => {
    const now = new Date("2026-09-15T00:00:00.000Z");
    const future = new Date("2026-09-16T03:04:05.000Z");

    expect(formatCountdown(future, now)).toEqual({
      label: "1d 03h 04m",
      expired: false,
      totalSeconds: 97_445,
    });
  });

  it("marks elapsed countdowns as ready", () => {
    const now = new Date("2026-09-15T00:00:00.000Z");

    expect(formatCountdown(new Date("2026-09-14T23:59:00.000Z"), now)).toEqual({
      label: "Check Codex now",
      expired: true,
      totalSeconds: 0,
    });
  });
});

describe("getPaceState", () => {
  const now = new Date("2026-09-15T10:00:00.000Z");

  it("reports ahead when quota exceeds time remaining by a safe margin", () => {
    expect(
      getPaceState({
        remainingPercent: 80,
        now,
        resetAt: new Date("2026-09-15T12:30:00.000Z"),
        windowHours: 5,
      }),
    ).toBe("ahead");
  });

  it("reports at-risk when quota trails time remaining", () => {
    expect(
      getPaceState({
        remainingPercent: 20,
        now,
        resetAt: new Date("2026-09-15T14:00:00.000Z"),
        windowHours: 5,
      }),
    ).toBe("at-risk");
  });
});

describe("createCalendarEvent", () => {
  it("creates a reminder five minutes before the reset", () => {
    const ics = createCalendarEvent({
      resetAt: new Date("2026-09-20T01:00:00.000Z"),
      title: "Codex weekly reset",
      reminderMinutes: 5,
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20260920T010000Z");
    expect(ics).toContain("TRIGGER:-PT5M");
    expect(ics).toContain("SUMMARY:Codex weekly reset");
  });
});
