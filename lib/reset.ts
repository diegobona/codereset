export type UsageWindow = {
  remainingPercent: number;
  resetAt: string;
};

export type ParsedUsage = {
  shortWindow?: UsageWindow;
  weeklyWindow?: UsageWindow;
};

export type PaceState = "ahead" | "steady" | "at-risk";

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

const monthIndexes = new Map([
  ["jan", 0], ["feb", 1], ["mar", 2], ["apr", 3], ["may", 4], ["jun", 5],
  ["jul", 6], ["aug", 7], ["sep", 8], ["oct", 9], ["nov", 10], ["dec", 11],
]);

export function parseResetTimestamp(value: string): Date | undefined {
  const normalized = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
    const isoDate = new Date(normalized);
    return Number.isNaN(isoDate.getTime()) ? undefined : isoDate;
  }

  const humanMatch = normalized.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i,
  );
  if (!humanMatch) return undefined;

  const [, monthName, dayText, yearText, hourText, minuteText, meridiem] = humanMatch;
  const month = monthIndexes.get(monthName.slice(0, 3).toLowerCase());
  const day = Number(dayText);
  const year = Number(yearText);
  const minute = Number(minuteText);
  let hour = Number(hourText);
  if (month === undefined || minute > 59 || hour > (meridiem ? 12 : 23)) return undefined;
  if (meridiem) {
    hour %= 12;
    if (meridiem.toLowerCase() === "pm") hour += 12;
  }

  const date = new Date(year, month, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) return undefined;
  return date;
}

function parseWindow(line: string): UsageWindow | undefined {
  const percentMatch = line.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*(?:left|remaining)?/i);
  const resetMatch = line.match(/resets?\s+(?:at\s+)?(.+)$/i);

  if (!percentMatch || !resetMatch) return undefined;

  const remainingPercent = Number(percentMatch[1]);
  const parsedDate = parseResetTimestamp(resetMatch[1]);
  if (!parsedDate || !Number.isFinite(remainingPercent) || remainingPercent < 0 || remainingPercent > 100) return undefined;

  return {
    remainingPercent,
    resetAt: parsedDate.toISOString(),
  };
}

export function parseUsageStatus(input: string): ParsedUsage {
  const result: ParsedUsage = {};

  for (const line of input.split(/\r?\n/).map((item) => item.trim())) {
    if (!line) continue;

    if (/\b(?:5h|5-hour|five-hour)\b/i.test(line)) {
      const window = parseWindow(line);
      if (window) result.shortWindow = window;
    }

    if (/\b(?:weekly|7d|7-day)\b/i.test(line)) {
      const window = parseWindow(line);
      if (window) result.weeklyWindow = window;
    }
  }

  return result;
}

export function formatCountdown(target: Date, now = new Date()) {
  const remainingMs = target.getTime() - now.getTime();

  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return { label: "Check Codex now", expired: true, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(remainingMs / 1_000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const parts = [
    days > 0 ? `${days}d` : null,
    `${hours.toString().padStart(2, "0")}h`,
    `${minutes.toString().padStart(2, "0")}m`,
  ].filter(Boolean);

  return { label: parts.join(" "), expired: false, totalSeconds };
}

export function getPaceState({
  remainingPercent,
  now,
  resetAt,
  windowHours,
}: {
  remainingPercent: number;
  now: Date;
  resetAt: Date;
  windowHours: number;
}): PaceState {
  const windowMs = Math.max(1, windowHours * 60 * 60 * 1_000);
  const remainingTimePercent = clampPercent(
    ((resetAt.getTime() - now.getTime()) / windowMs) * 100,
  );
  const difference = clampPercent(remainingPercent) - remainingTimePercent;

  if (difference >= 15) return "ahead";
  if (difference <= -10) return "at-risk";
  return "steady";
}

function toIcsTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function createCalendarEvent({
  resetAt,
  title,
  reminderMinutes = 5,
}: {
  resetAt: Date;
  title: string;
  reminderMinutes?: number;
}) {
  const timestamp = toIcsTimestamp(resetAt);
  const safeReminder = Math.max(0, Math.round(reminderMinutes));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CodeReset//Quota Reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${timestamp.toLowerCase()}@codereset.dev`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${timestamp}`,
    `DTEND:${toIcsTimestamp(new Date(resetAt.getTime() + 15 * 60 * 1_000))}`,
    `SUMMARY:${escapeIcsText(title)}`,
    "DESCRIPTION:Check your official Codex usage screen to confirm quota recovery.",
    "BEGIN:VALARM",
    `TRIGGER:-PT${safeReminder}M`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
