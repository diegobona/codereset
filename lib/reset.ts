export type UsageWindow = {
  remainingPercent?: number;
  resetAt: string;
};

export type ParsedUsage = {
  shortWindow?: UsageWindow;
  weeklyWindow?: UsageWindow;
};

export type UsageParseIssue =
  | "limits-unavailable"
  | "missing-percentage"
  | "missing-reset-time"
  | "unsupported-format";

export type UsageParseResult = {
  usage: ParsedUsage;
  issue?: UsageParseIssue;
};

export type PaceState = "ahead" | "steady" | "at-risk";

export type ResetTimeConversion = {
  date: string;
  time: string;
  timeZoneName: string;
  utcOffset: string;
  dayRelation: "previous-day" | "same-day" | "next-day";
};

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

  const chineseMatch = normalized.match(
    /^(\d{4})年(\d{1,2})月(\d{1,2})日\s+(\d{1,2}):(\d{2})$/,
  );
  if (chineseMatch) {
    const [, yearText, monthText, dayText, hourText, minuteText] = chineseMatch;
    const year = Number(yearText);
    const month = Number(monthText) - 1;
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (month < 0 || month > 11 || hour > 23 || minute > 59) return undefined;

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

export function parseAbsoluteResetTimestamp(value: string): Date | undefined {
  const match = value.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match) return undefined;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = "0", offset] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetMatch = offset.match(/^([+-])(\d{2}):(\d{2})$/);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    (offsetMatch && (Number(offsetMatch[2]) > 23 || Number(offsetMatch[3]) > 59))
  ) {
    return undefined;
  }

  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function convertResetTime(
  resetAt: Date,
  timeZone: string,
): ResetTimeConversion | undefined {
  if (Number.isNaN(resetAt.getTime())) return undefined;

  try {
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
    const offsetFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    });
    const calendarFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    const timeParts = timeFormatter.formatToParts(resetAt);
    const timePart = (type: Intl.DateTimeFormatPartTypes) =>
      timeParts.find((part) => part.type === type)?.value;
    const hour = timePart("hour");
    const minute = timePart("minute");
    const dayPeriod = timePart("dayPeriod");
    const timeZoneName = timePart("timeZoneName");
    const utcOffset = offsetFormatter
      .formatToParts(resetAt)
      .find((part) => part.type === "timeZoneName")
      ?.value.replace(/^GMT/, "UTC");

    const calendarParts = calendarFormatter.formatToParts(resetAt);
    const calendarPart = (type: "year" | "month" | "day") =>
      Number(calendarParts.find((part) => part.type === type)?.value);
    const targetDay = Date.UTC(
      calendarPart("year"),
      calendarPart("month") - 1,
      calendarPart("day"),
    );
    const utcDay = Date.UTC(
      resetAt.getUTCFullYear(),
      resetAt.getUTCMonth(),
      resetAt.getUTCDate(),
    );

    if (!hour || !minute || !dayPeriod || !timeZoneName || !utcOffset) {
      return undefined;
    }

    return {
      date: dateFormatter.format(resetAt),
      time: `${hour}:${minute} ${dayPeriod}`,
      timeZoneName,
      utcOffset,
      dayRelation:
        targetDay < utcDay
          ? "previous-day"
          : targetDay > utcDay
            ? "next-day"
            : "same-day",
    };
  } catch {
    return undefined;
  }
}

const ansiCsiPattern = /\u001B\[[0-?]*[ -/]*[@-~]/g;
const ansiOscPattern = /\u001B\][^\u0007]*(?:\u0007|\u001B\\)/g;
const windowLabelPattern = /(?:\b(?:5h|5-hour|five-hour|weekly|7d|7-day)\b|5\s*小时使用限额|每周使用限额)/i;

function normalizeStatusInput(input: string) {
  return input
    .replace(ansiOscPattern, "")
    .replace(ansiCsiPattern, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/[│┃║]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parseClock(hourText: string, minuteText: string, meridiem?: string) {
  const minute = Number(minuteText);
  let hour = Number(hourText);
  if (minute > 59 || hour > (meridiem ? 12 : 23)) return undefined;
  if (meridiem) {
    hour %= 12;
    if (meridiem.toLowerCase() === "pm") hour += 12;
  }
  return { hour, minute };
}

function parseCompactResetTimestamp(value: string, now: Date) {
  const compact = value
    .trim()
    .replace(/^\(+/, "")
    .replace(/[)\]}.;,]+$/g, "")
    .trim();
  const relative = compact.match(
    /^in\s+(?:(\d+(?:\.\d+)?)\s*d(?:ay(?:s)?)?\s*)?(?:(\d+(?:\.\d+)?)\s*h(?:our(?:s)?)?\s*)?(?:(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?\s*)?$/i,
  );
  if (relative) {
    const durationMs = (
      Number(relative[1] ?? 0) * 24 * 60 +
      Number(relative[2] ?? 0) * 60 +
      Number(relative[3] ?? 0)
    ) * 60 * 1_000;
    if (Number.isFinite(durationMs) && durationMs > 0) {
      return new Date(now.getTime() + durationMs);
    }
  }
  const absolute = parseResetTimestamp(compact);
  if (absolute) return absolute;

  const datedTime = compact.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)?\s+on\s+(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+(\d{4}))?$/i,
  );
  if (datedTime) {
    const [, hourText, minuteText, meridiem, dayText, monthText, yearText] = datedTime;
    const clock = parseClock(hourText, minuteText, meridiem);
    const month = monthIndexes.get(monthText.slice(0, 3).toLowerCase());
    if (!clock || month === undefined) return undefined;

    let year = yearText ? Number(yearText) : now.getFullYear();
    let date = new Date(year, month, Number(dayText), clock.hour, clock.minute, 0, 0);
    if (!yearText && date.getTime() <= now.getTime()) {
      year += 1;
      date = new Date(year, month, Number(dayText), clock.hour, clock.minute, 0, 0);
    }
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== Number(dayText)
    ) return undefined;
    return date;
  }

  const timeOnly = compact.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!timeOnly) return undefined;
  const clock = parseClock(timeOnly[1], timeOnly[2], timeOnly[3]);
  if (!clock) return undefined;
  const date = new Date(now);
  date.setHours(clock.hour, clock.minute, 0, 0);
  if (date.getTime() <= now.getTime()) date.setDate(date.getDate() + 1);
  return date;
}

function parseWindow(block: string, now: Date): UsageWindow | undefined {
  const englishPercent = block.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*(left|remaining|used|consumed)?/i);
  const chinesePercent = block.match(/(剩余|已用|已使用)\s*(\d{1,3}(?:\.\d+)?)\s*%/);
  const resetMatch = block.match(
    /(?:resets?\s*(?:at\s+)?[:=-]?|重置时间\s*[:：]?)\s*(.+?)(?=\s+(?:剩余|已用|已使用)\s*\d{1,3}(?:\.\d+)?\s*%|$)/i,
  );

  if (!resetMatch) return undefined;

  const percentMatch = englishPercent ?? chinesePercent;
  let remainingPercent: number | undefined;
  if (percentMatch) {
    const reportedPercent = Number(englishPercent?.[1] ?? chinesePercent?.[2]);
    const qualifier = (englishPercent?.[2] ?? chinesePercent?.[1])?.toLowerCase();
    remainingPercent = qualifier === "used" ||
      qualifier === "consumed" ||
      qualifier === "已用" ||
      qualifier === "已使用"
      ? 100 - reportedPercent
      : reportedPercent;
    if (!Number.isFinite(remainingPercent) || remainingPercent < 0 || remainingPercent > 100) {
      return undefined;
    }
  }
  const parsedDate = parseCompactResetTimestamp(resetMatch[1], now);
  if (!parsedDate) return undefined;

  return {
    ...(remainingPercent === undefined ? {} : { remainingPercent }),
    resetAt: parsedDate.toISOString(),
  };
}

function detectWindowKind(line: string) {
  if (/(?:\b(?:5h|5-hour|five-hour)\b|5\s*小时使用限额)/i.test(line)) return "short" as const;
  if (/(?:\b(?:weekly|7d|7-day)\b|每周使用限额)/i.test(line)) return "weekly" as const;
  return undefined;
}

function parseUsageBlocks(input: string, now: Date) {
  const result: ParsedUsage = {};
  const blocks: Array<{ kind: "short" | "weekly"; text: string }> = [];
  let active: (typeof blocks)[number] | undefined;

  for (const line of normalizeStatusInput(input)) {
    const kind = detectWindowKind(line);
    if (kind) {
      active = { kind, text: line };
      blocks.push(active);
    } else if (
      active &&
      (!parseWindow(active.text, now) || /(?:\d{1,3}(?:\.\d+)?\s*%|(?:剩余|已用|已使用)\s*\d)/i.test(line))
    ) {
      active.text += ` ${line}`;
    }
  }

  for (const block of blocks) {
    const window = parseWindow(block.text, now);
    if (block.kind === "short" && window) result.shortWindow = window;
    if (block.kind === "weekly" && window) result.weeklyWindow = window;
  }

  return { blocks, result };
}

export function parseUsageStatusDetailed(
  input: string,
  now = new Date(),
): UsageParseResult {
  const normalized = normalizeStatusInput(input).join(" ");
  const { blocks, result: usage } = parseUsageBlocks(input, now);
  if (usage.shortWindow || usage.weeklyWindow) return { usage };

  if (/\blimits?\b[^\n]*(?:data\s+)?(?:not available|unavailable|loading)/i.test(normalized)) {
    return { issue: "limits-unavailable", usage };
  }
  if (blocks.length > 0 && /\d{1,3}(?:\.\d+)?\s*%/.test(normalized)) {
    return { issue: "missing-reset-time", usage };
  }
  if (blocks.length > 0 || windowLabelPattern.test(normalized)) {
    return { issue: "missing-percentage", usage };
  }
  return { issue: "unsupported-format", usage };
}

export function parseUsageStatus(input: string, now = new Date()): ParsedUsage {
  return parseUsageStatusDetailed(input, now).usage;
}

export function formatCountdown(target: Date, now = new Date()) {
  const remainingMs = target.getTime() - now.getTime();

  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return { label: "Reset time reached", expired: true, totalSeconds: 0 };
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
