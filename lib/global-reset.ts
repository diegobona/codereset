export const GLOBAL_RESET_STATUS_ENDPOINT =
  "https://codexreset.dev/api/status?lang=en";

export type GlobalResetSnapshot = {
  state: "confirmed_today" | "recorded_today" | "no_verified_reset" | "unknown";
  recordState: "announced" | "archived" | "verified";
  eventId: string;
  eventUrl: string;
  effectiveAt: string;
  sourceUrl: string;
  scope: string;
  totalRecorded: number;
  recordedLast30Days: number;
  averageIntervalDays: number;
  longestIntervalDays: number;
  lastChecked: string;
};

export const FALLBACK_GLOBAL_RESET: GlobalResetSnapshot = {
  state: "unknown",
  recordState: "archived",
  eventId: "cr-2098685367058612394",
  eventUrl: "https://codexreset.dev/events/cr-2098685367058612394",
  effectiveAt: "2026-09-12T08:09:17.000Z",
  sourceUrl: "https://x.com/thsottiaux/status/2098685367058612394",
  scope: "Accounts specified in the original announcement",
  totalRecorded: 48,
  recordedLast30Days: 7,
  averageIntervalDays: 7.7,
  longestIntervalDays: 67.7,
  lastChecked: "2026-09-15T08:32:09.919Z",
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toIsoDate(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isSafeSourceUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && [
      "x.com",
      "www.x.com",
      "twitter.com",
      "www.twitter.com",
    ].includes(url.hostname);
  } catch {
    return false;
  }
}

function roundToOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function normalizeGlobalResetStatus(payload: unknown): GlobalResetSnapshot | null {
  if (!isRecord(payload) || !isRecord(payload.latestReset)) return null;

  const latest = payload.latestReset;
  const effectiveAt = toIsoDate(latest.effective_at);
  const lastChecked = toIsoDate(payload.generatedAt ?? payload.lastChecked);
  const eventId = typeof latest.id === "string" && /^cr-[a-z0-9-]+$/i.test(latest.id)
    ? latest.id
    : null;

  if (
    latest.type !== "global_reset" ||
    !effectiveAt ||
    !lastChecked ||
    !eventId ||
    !isSafeSourceUrl(latest.source_url)
  ) return null;

  const allowedStates = new Set<GlobalResetSnapshot["state"]>([
    "confirmed_today",
    "recorded_today",
    "no_verified_reset",
    "unknown",
  ]);
  const state = typeof payload.status === "string" &&
    allowedStates.has(payload.status as GlobalResetSnapshot["state"])
    ? payload.status as GlobalResetSnapshot["state"]
    : "unknown";
  const scope = typeof latest.scope === "string" && latest.scope.trim()
    ? latest.scope.trim().slice(0, 180)
    : "Accounts specified in the original announcement";
  const verifiedAt = toIsoDate(latest.verified_at);
  const recordState: GlobalResetSnapshot["recordState"] =
    latest.status === "verified" || verifiedAt
      ? "verified"
      : latest.status === "announced"
        ? "announced"
        : "archived";

  const eventTimes = Array.isArray(payload.events)
    ? payload.events.flatMap((event) => {
      if (!isRecord(event) || event.type !== "global_reset") return [];
      const date = toIsoDate(event.effective_at);
      return date ? [new Date(date).getTime()] : [];
    }).sort((a, b) => a - b)
    : [];

  const generatedAt = new Date(lastChecked).getTime();
  const thirtyDaysAgo = generatedAt - 30 * 24 * 60 * 60 * 1_000;
  const intervals = eventTimes.slice(1).map((time, index) =>
    (time - eventTimes[index]) / (24 * 60 * 60 * 1_000));
  const averageIntervalDays = intervals.length
    ? roundToOne(intervals.reduce((sum, days) => sum + days, 0) / intervals.length)
    : 0;
  const longestIntervalDays = intervals.length
    ? roundToOne(Math.max(...intervals))
    : 0;

  return {
    state,
    recordState,
    eventId,
    eventUrl: `https://codexreset.dev/events/${eventId}`,
    effectiveAt,
    sourceUrl: latest.source_url,
    scope,
    totalRecorded: eventTimes.length,
    recordedLast30Days: eventTimes.filter((time) => time >= thirtyDaysAgo).length,
    averageIntervalDays,
    longestIntervalDays,
    lastChecked,
  };
}

export function getElapsedParts(from: string, now = new Date()) {
  const start = new Date(from).getTime();
  const elapsedSeconds = Number.isNaN(start)
    ? 0
    : Math.max(0, Math.floor((now.getTime() - start) / 1_000));

  return {
    days: Math.floor(elapsedSeconds / 86_400),
    hours: Math.floor((elapsedSeconds % 86_400) / 3_600),
    minutes: Math.floor((elapsedSeconds % 3_600) / 60),
    seconds: elapsedSeconds % 60,
  };
}
