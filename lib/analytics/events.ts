export const ALLOWED_EVENTS = [
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
  "reset_time_convert",
  "analytics_probe",
] as const;

export const PAGE_KINDS = ["home", "guide", "privacy", "reset-time"] as const;
export const DEVICE_CLASSES = ["mobile", "tablet", "desktop"] as const;

export type AnalyticsEventName = (typeof ALLOWED_EVENTS)[number];
export type AnalyticsPageKind = (typeof PAGE_KINDS)[number];
export type AnalyticsDeviceClass = (typeof DEVICE_CLASSES)[number];

export type AnalyticsPayload = {
  event: AnalyticsEventName;
  page?: AnalyticsPageKind;
  device?: AnalyticsDeviceClass;
};

type ValidationResult =
  | { ok: true; value: AnalyticsPayload }
  | { ok: false };

export const ANALYTICS_STORAGE_KEYS = {
  optOut: "codereset:analytics:disabled",
  firstSeenDate: "codereset:analytics:v1:first-seen-date",
  return7dSent: "codereset:analytics:v1:return-7d-sent",
  return30dSent: "codereset:analytics:v1:return-30d-sent",
  sessionEvents: "codereset:analytics:v1:session-events",
} as const;

const allowedEventSet = new Set<string>(ALLOWED_EVENTS);
const allowedPageSet = new Set<string>(PAGE_KINDS);
const allowedDeviceSet = new Set<string>(DEVICE_CLASSES);
const payloadKeys = new Set(["event", "page", "device"]);
const OPT_OUT_EVENT = "codereset:analytics-opt-out-change";
const volatileSessionEvents = new Set<string>();
let volatileOptOut = false;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateAnalyticsPayload(value: unknown): ValidationResult {
  if (!isPlainRecord(value)) return { ok: false };
  if (Object.keys(value).some((key) => !payloadKeys.has(key))) return { ok: false };
  if (typeof value.event !== "string" || !allowedEventSet.has(value.event)) {
    return { ok: false };
  }
  if (
    value.page !== undefined &&
    (typeof value.page !== "string" || !allowedPageSet.has(value.page))
  ) {
    return { ok: false };
  }
  if (
    value.device !== undefined &&
    (typeof value.device !== "string" || !allowedDeviceSet.has(value.device))
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      event: value.event as AnalyticsEventName,
      ...(value.page ? { page: value.page as AnalyticsPageKind } : {}),
      ...(value.device
        ? { device: value.device as AnalyticsDeviceClass }
        : {}),
    },
  };
}

function readStorage(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorage(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Storage may be disabled. The in-memory opt-out still applies in this tab.
  }
}

export function isAnalyticsOptedOut() {
  if (typeof window === "undefined") return true;
  return (
    volatileOptOut ||
    readStorage(window.localStorage, ANALYTICS_STORAGE_KEYS.optOut) === "true"
  );
}

export function setAnalyticsOptOut(disabled: boolean) {
  if (typeof window === "undefined") return;
  volatileOptOut = disabled;
  if (disabled) {
    writeStorage(window.localStorage, ANALYTICS_STORAGE_KEYS.optOut, "true");
  } else {
    removeStorage(window.localStorage, ANALYTICS_STORAGE_KEYS.optOut);
  }
  window.dispatchEvent(new Event(OPT_OUT_EVENT));
}

export function subscribeAnalyticsOptOut(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(OPT_OUT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(OPT_OUT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getAnalyticsOptOutSnapshot() {
  return isAnalyticsOptedOut();
}

export function getAnalyticsOptOutServerSnapshot() {
  return false;
}

export function deviceClass(width = typeof window === "undefined" ? 1280 : window.innerWidth) {
  if (width < 768) return "mobile" as const;
  if (width < 1100) return "tablet" as const;
  return "desktop" as const;
}

function sessionEventKey(payload: AnalyticsPayload) {
  return `${payload.event}|${payload.page ?? ""}|${payload.device ?? ""}`;
}

function readSessionEvents() {
  if (typeof window === "undefined") return volatileSessionEvents;
  const raw = readStorage(
    window.sessionStorage,
    ANALYTICS_STORAGE_KEYS.sessionEvents,
  );
  if (!raw) return volatileSessionEvents;
  try {
    const values = JSON.parse(raw) as unknown;
    if (Array.isArray(values)) {
      for (const value of values) {
        if (typeof value === "string") volatileSessionEvents.add(value);
      }
    }
  } catch {
    // Ignore corrupt session state and continue with the in-memory set.
  }
  return volatileSessionEvents;
}

function markSessionEvent(key: string) {
  const events = readSessionEvents();
  events.add(key);
  if (typeof window !== "undefined") {
    writeStorage(
      window.sessionStorage,
      ANALYTICS_STORAGE_KEYS.sessionEvents,
      JSON.stringify([...events]),
    );
  }
}

export function trackEvent(
  event: AnalyticsEventName,
  dimensions: Omit<AnalyticsPayload, "event"> = {},
) {
  if (typeof window === "undefined" || isAnalyticsOptedOut()) return false;
  const validation = validateAnalyticsPayload({ event, ...dimensions });
  if (!validation.ok) return false;
  const key = sessionEventKey(validation.value);
  if (readSessionEvents().has(key)) return false;
  markSessionEvent(key);

  try {
    const body = JSON.stringify(validation.value);
    const blob = new Blob([body], { type: "application/json" });
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/events", blob)) {
      return true;
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function elapsedUtcDays(firstDate: string, now: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDate)) return null;
  const first = new Date(`${firstDate}T00:00:00.000Z`);
  if (Number.isNaN(first.valueOf()) || first > now) return null;
  return Math.floor((now.valueOf() - first.valueOf()) / 86_400_000);
}

export function initializeAnalytics(page: AnalyticsPageKind, now = new Date()) {
  if (typeof window === "undefined" || isAnalyticsOptedOut()) return;
  const dimensions = { page, device: deviceClass() };
  let firstSeen = readStorage(
    window.localStorage,
    ANALYTICS_STORAGE_KEYS.firstSeenDate,
  );

  if (!firstSeen || elapsedUtcDays(firstSeen, now) === null) {
    firstSeen = dateOnly(now);
    writeStorage(
      window.localStorage,
      ANALYTICS_STORAGE_KEYS.firstSeenDate,
      firstSeen,
    );
    trackEvent("first_visit", dimensions);
    return;
  }

  const days = elapsedUtcDays(firstSeen, now);
  if (days === null) return;
  if (
    days >= 7 &&
    readStorage(window.localStorage, ANALYTICS_STORAGE_KEYS.return7dSent) !==
      "true"
  ) {
    if (trackEvent("return_7d", dimensions)) {
      writeStorage(
        window.localStorage,
        ANALYTICS_STORAGE_KEYS.return7dSent,
        "true",
      );
    }
  }
  if (
    days >= 30 &&
    readStorage(window.localStorage, ANALYTICS_STORAGE_KEYS.return30dSent) !==
      "true"
  ) {
    if (trackEvent("return_30d", dimensions)) {
      writeStorage(
        window.localStorage,
        ANALYTICS_STORAGE_KEYS.return30dSent,
        "true",
      );
    }
  }
}
