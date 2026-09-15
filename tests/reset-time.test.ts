import { describe, expect, it } from "vitest";

import {
  convertResetTime,
  parseAbsoluteResetTimestamp,
} from "@/lib/reset";

describe("parseAbsoluteResetTimestamp", () => {
  it("accepts ISO timestamps with Z or an explicit offset", () => {
    expect(
      parseAbsoluteResetTimestamp("2026-09-15T18:30:00+08:00")?.toISOString(),
    ).toBe("2026-09-15T10:30:00.000Z");
    expect(
      parseAbsoluteResetTimestamp("2026-09-15T10:30:00Z")?.toISOString(),
    ).toBe("2026-09-15T10:30:00.000Z");
  });

  it.each([
    "2026-09-15T18:30:00",
    "2026-02-30T10:00:00Z",
    "not a time",
  ])("rejects ambiguous or invalid timestamp %s", (value) => {
    expect(parseAbsoluteResetTimestamp(value)).toBeUndefined();
  });
});

describe("convertResetTime", () => {
  it("uses IANA daylight-saving rules", () => {
    expect(
      convertResetTime(
        new Date("2026-01-15T17:00:00Z"),
        "America/New_York",
      ),
    ).toMatchObject({
      time: "12:00 PM",
      timeZoneName: "EST",
      utcOffset: "UTC-05:00",
    });
    expect(
      convertResetTime(
        new Date("2026-07-15T17:00:00Z"),
        "America/New_York",
      ),
    ).toMatchObject({
      time: "1:00 PM",
      timeZoneName: "EDT",
      utcOffset: "UTC-04:00",
    });
  });

  it("supports non-hour UTC offsets", () => {
    expect(
      convertResetTime(new Date("2026-01-01T00:00:00Z"), "Asia/Kathmandu"),
    ).toMatchObject({
      time: "5:45 AM",
      utcOffset: "UTC+05:45",
    });
  });

  it("reports cross-day conversions", () => {
    expect(
      convertResetTime(
        new Date("2026-01-01T01:00:00Z"),
        "America/Los_Angeles",
      ),
    ).toMatchObject({
      date: "Wednesday, December 31, 2025",
      dayRelation: "previous-day",
    });
  });

  it("rejects invalid dates and IANA zones", () => {
    expect(convertResetTime(new Date("invalid"), "UTC")).toBeUndefined();
    expect(
      convertResetTime(new Date("2026-01-01T00:00:00Z"), "Mars/Olympus"),
    ).toBeUndefined();
  });
});
