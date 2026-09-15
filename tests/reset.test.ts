import { describe, expect, it } from "vitest";
import {
  createCalendarEvent,
  formatCountdown,
  getPaceState,
  parseResetTimestamp,
  parseUsageStatus,
  parseUsageStatusDetailed,
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

  it("parses copied Codex panels with ANSI styling, borders, and progress bars", () => {
    const result = parseUsageStatus(
      "\u001b[2m│  5h limit: [██████░░] 73% left (resets 2099-09-15T18:30:00Z) │\u001b[22m",
    );

    expect(result.shortWindow).toEqual({
      remainingPercent: 73,
      resetAt: "2099-09-15T18:30:00.000Z",
    });
  });

  it("converts a used percentage into the remaining percentage", () => {
    const result = parseUsageStatus(
      "7-day limit: 63% used · resets 2099-09-20T09:00:00Z",
    );

    expect(result.weeklyWindow?.remainingPercent).toBe(37);
  });

  it("parses a quota window split across multiple copied lines", () => {
    const result = parseUsageStatus(`Weekly limit
[████████░░] 41% remaining
resets at 2099-09-20T09:00:00Z`);

    expect(result.weeklyWindow).toEqual({
      remainingPercent: 41,
      resetAt: "2099-09-20T09:00:00.000Z",
    });
  });

  it("parses the compact time and date shown by Codex", () => {
    const now = new Date(2026, 8, 15, 10, 0, 0);
    const result = parseUsageStatus(
      "Weekly limit: 41% left (resets 7:30 PM on 20 Sep)",
      now,
    );

    expect(result.weeklyWindow?.remainingPercent).toBe(41);
    const resetAt = new Date(result.weeklyWindow!.resetAt);
    expect([
      resetAt.getFullYear(),
      resetAt.getMonth(),
      resetAt.getDate(),
      resetAt.getHours(),
      resetAt.getMinutes(),
    ]).toEqual([2026, 8, 20, 19, 30]);
  });

  it("treats a time-only reset as the next occurrence in local time", () => {
    const now = new Date(2026, 8, 15, 19, 0, 0);
    const result = parseUsageStatus(
      "5h limit: 73% left (resets 6:30 PM)",
      now,
    );

    const resetAt = new Date(result.shortWindow!.resetAt);
    expect([
      resetAt.getFullYear(),
      resetAt.getMonth(),
      resetAt.getDate(),
      resetAt.getHours(),
      resetAt.getMinutes(),
    ]).toEqual([2026, 8, 16, 18, 30]);
  });

  it("parses a relative reset countdown", () => {
    const now = new Date("2026-09-15T10:00:00.000Z");
    const result = parseUsageStatus(
      "5-hour limit: 73% remaining · resets in 2h 30m",
      now,
    );

    expect(result.shortWindow?.resetAt).toBe("2026-09-15T12:30:00.000Z");
  });

  it("reports when Codex has not loaded limit data yet", () => {
    expect(parseUsageStatusDetailed("Limits: data not available yet")).toEqual({
      issue: "limits-unavailable",
      usage: {},
    });
  });

  it("reports a missing reset time after recognizing a quota percentage", () => {
    expect(parseUsageStatusDetailed("5h limit: 73% left")).toEqual({
      issue: "missing-reset-time",
      usage: {},
    });
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
