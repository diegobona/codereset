"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Bell,
  CalendarPlus,
  CheckCircle2,
  ClipboardPaste,
  Gauge,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  createCalendarEvent,
  formatCountdown,
  getPaceState,
  parseUsageStatus,
  type ParsedUsage,
  type UsageWindow,
} from "@/lib/reset";

const STORAGE_KEY = "codereset:v1:quota";
const STORAGE_EVENT = "codereset:quota-change";
let volatileQuotaSnapshot = "";
const SAMPLE_STATUS = `5h limit: 73% left · resets 2026-09-15T18:30:00+08:00
Weekly limit: 41% left · resets 2026-09-20T09:00:00+08:00`;

type ManualState = {
  shortRemaining: string;
  shortReset: string;
  weeklyRemaining: string;
  weeklyReset: string;
};

const emptyManual: ManualState = {
  shortRemaining: "",
  shortReset: "",
  weeklyRemaining: "",
  weeklyReset: "",
};

function subscribeToQuota(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(STORAGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
}

function getQuotaSnapshot() {
  try {
    volatileQuotaSnapshot = window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    // Private browsing policies can disable storage; retain an in-memory snapshot.
  }
  return volatileQuotaSnapshot;
}

function getQuotaServerSnapshot() {
  return "";
}

function decodeQuota(snapshot: string): ParsedUsage {
  if (!snapshot) return {};
  try {
    const parsed = JSON.parse(snapshot) as ParsedUsage;
    const normalizeWindow = (candidate: unknown): UsageWindow | undefined => {
      if (!candidate || typeof candidate !== "object") return undefined;
      const value = candidate as Partial<UsageWindow>;
      if (
        typeof value.remainingPercent !== "number" ||
        !Number.isFinite(value.remainingPercent) ||
        value.remainingPercent < 0 ||
        value.remainingPercent > 100 ||
        typeof value.resetAt !== "string" ||
        Number.isNaN(new Date(value.resetAt).getTime())
      ) return undefined;
      return { remainingPercent: value.remainingPercent, resetAt: value.resetAt };
    };
    const nextUsage = {
      shortWindow: normalizeWindow(parsed.shortWindow),
      weeklyWindow: normalizeWindow(parsed.weeklyWindow),
    };
    return nextUsage.shortWindow || nextUsage.weeklyWindow ? nextUsage : {};
  } catch {
    return {};
  }
}

function publishQuota(nextUsage?: ParsedUsage) {
  volatileQuotaSnapshot = nextUsage ? JSON.stringify(nextUsage) : "";
  let persisted = true;
  if (nextUsage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, volatileQuotaSnapshot);
    } catch {
      persisted = false;
    }
  } else {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      persisted = false;
    }
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
  return persisted;
}

function toWindow(remaining: string, reset: string): UsageWindow | undefined {
  if (remaining === "" || !reset) return undefined;
  const remainingPercent = Number(remaining);
  const resetAt = new Date(reset);
  if (
    Number.isNaN(remainingPercent) ||
    remainingPercent < 0 ||
    remainingPercent > 100 ||
    Number.isNaN(resetAt.getTime())
  ) return undefined;
  return { remainingPercent, resetAt: resetAt.toISOString() };
}

function WindowCard({
  kind,
  window,
  now,
  onCalendar,
}: {
  kind: "5-hour" | "weekly";
  window: UsageWindow;
  now: Date;
  onCalendar: () => void;
}) {
  const resetAt = new Date(window.resetAt);
  const countdown = formatCountdown(resetAt, now);
  const pace = getPaceState({
    remainingPercent: window.remainingPercent,
    now,
    resetAt,
    windowHours: kind === "5-hour" ? 5 : 168,
  });
  const readableDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(resetAt);

  return (
    <article className="window-card">
      <div className="window-card-head">
        <span>{kind === "5-hour" ? "SHORT WINDOW" : "WEEKLY RESET"}</span>
        <b data-pace={pace}>{pace.replace("-", " ")}</b>
      </div>
      <div className="window-countdown">
        <span>TIME TO RECOVERY</span>
        <strong>{countdown.label}</strong>
        <small>{readableDate}</small>
      </div>
      <div className="window-usage">
        <div><span>REMAINING</span><strong>{window.remainingPercent}%</strong></div>
        <div className="window-meter"><i style={{ width: `${window.remainingPercent}%` }} /></div>
      </div>
      <button className="calendar-button" type="button" onClick={onCalendar}>
        <CalendarPlus size={15} /> Add 5-minute reminder
      </button>
    </article>
  );
}

export function ResetDesk() {
  const [mode, setMode] = useState<"paste" | "manual">("paste");
  const [statusText, setStatusText] = useState("");
  const [manual, setManual] = useState<ManualState>(emptyManual);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const quotaSnapshot = useSyncExternalStore(
    subscribeToQuota,
    getQuotaSnapshot,
    getQuotaServerSnapshot,
  );
  const usage = useMemo(() => decodeQuota(quotaSnapshot), [quotaSnapshot]);
  const hasUsage = Boolean(usage.shortWindow || usage.weeklyWindow);
  const localZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone",
    [],
  );

  function saveUsage(nextUsage: ParsedUsage) {
    const persisted = publishQuota(nextUsage);
    setMessage(persisted
      ? "Saved on this device. No account data was sent."
      : "Browser storage is unavailable; saved in this tab only.");
    setError("");
  }

  function handleParse() {
    const parsed = parseUsageStatus(statusText);
    if (!parsed.shortWindow && !parsed.weeklyWindow) {
      setError("We could not find a supported quota window. Try the sample or enter it manually.");
      setMessage("");
      return;
    }
    saveUsage(parsed);
  }

  function handleManualSave() {
    const nextUsage: ParsedUsage = {
      shortWindow: toWindow(manual.shortRemaining, manual.shortReset),
      weeklyWindow: toWindow(manual.weeklyRemaining, manual.weeklyReset),
    };
    if (!nextUsage.shortWindow && !nextUsage.weeklyWindow) {
      setError("Add at least one valid percentage and reset time.");
      setMessage("");
      return;
    }
    saveUsage(nextUsage);
  }

  function clearUsage() {
    publishQuota();
    setManual(emptyManual);
    setStatusText("");
    setMessage("Local quota data cleared.");
    setError("");
  }

  function downloadReminder(window: UsageWindow, title: string) {
    const file = new Blob([
      createCalendarEvent({ resetAt: new Date(window.resetAt), title, reminderMinutes: 5 }),
    ], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replaceAll(" ", "-")}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="reset-desk-app">
      <div className="desk-toolbar">
        <div className="desk-tabs" aria-label="Quota setup method">
          <button type="button" aria-pressed={mode === "paste"} onClick={() => setMode("paste")}>
            <ClipboardPaste size={15} /> Paste status
          </button>
          <button type="button" aria-pressed={mode === "manual"} onClick={() => setMode("manual")}>
            <Gauge size={15} /> Manual setup
          </button>
        </div>
        <span><ShieldCheck size={15} /> LOCAL / {localZone}</span>
      </div>

      <div className="desk-input-panel">
        {mode === "paste" ? (
          <div className="paste-panel">
            <label htmlFor="status-input">Paste Codex status</label>
            <textarea
              id="status-input"
              value={statusText}
              onChange={(event) => setStatusText(event.target.value)}
              placeholder="Paste the lines showing your 5h and weekly remaining percentages and reset times…"
              rows={5}
            />
            <div className="desk-form-actions">
              <button className="button button-primary" type="button" onClick={handleParse}>Parse status</button>
              <button className="text-button" type="button" onClick={() => setStatusText(SAMPLE_STATUS)}>Try sample</button>
              <span>Nothing leaves this browser.</span>
            </div>
          </div>
        ) : (
          <div className="manual-panel">
            <div className="manual-window">
              <span>5-HOUR WINDOW</span>
              <label htmlFor="short-remaining">5-hour remaining percentage</label>
              <div className="percent-input"><input id="short-remaining" type="number" min="0" max="100" value={manual.shortRemaining} onChange={(event) => setManual({ ...manual, shortRemaining: event.target.value })} /><b>%</b></div>
              <label htmlFor="short-reset">5-hour reset time</label>
              <input id="short-reset" type="datetime-local" value={manual.shortReset} onChange={(event) => setManual({ ...manual, shortReset: event.target.value })} />
            </div>
            <div className="manual-window">
              <span>WEEKLY WINDOW</span>
              <label htmlFor="weekly-remaining">Weekly remaining percentage</label>
              <div className="percent-input"><input id="weekly-remaining" type="number" min="0" max="100" value={manual.weeklyRemaining} onChange={(event) => setManual({ ...manual, weeklyRemaining: event.target.value })} /><b>%</b></div>
              <label htmlFor="weekly-reset">Weekly reset time</label>
              <input id="weekly-reset" type="datetime-local" value={manual.weeklyReset} onChange={(event) => setManual({ ...manual, weeklyReset: event.target.value })} />
            </div>
            <div className="desk-form-actions manual-actions">
              <button className="button button-primary" type="button" onClick={handleManualSave}>Save manual setup</button>
              <span>Times use your current browser timezone.</span>
            </div>
          </div>
        )}
        {message && <p className="desk-message" role="status"><CheckCircle2 size={15} /> {message}</p>}
        {error && <p className="desk-error" role="alert">{error}</p>}
      </div>

      {hasUsage ? (
        <div className="window-results">
          <div className="results-head">
            <span>YOUR ACTIVE WINDOWS</span>
            <button type="button" onClick={clearUsage}><RotateCcw size={14} /> Clear local data</button>
          </div>
          <div className="window-card-grid">
            {usage.shortWindow && (
              <WindowCard kind="5-hour" window={usage.shortWindow} now={now} onCalendar={() => downloadReminder(usage.shortWindow!, "Codex 5-hour reset")} />
            )}
            {usage.weeklyWindow && (
              <WindowCard kind="weekly" window={usage.weeklyWindow} now={now} onCalendar={() => downloadReminder(usage.weeklyWindow!, "Codex weekly reset")} />
            )}
          </div>
          <p className="result-disclaimer"><Bell size={14} /> A finished countdown is a reminder to check Codex. It cannot confirm that your quota recovered.</p>
        </div>
      ) : (
        <div className="empty-results">
          <span>WAITING FOR YOUR INPUT</span>
          <strong>— — : — — : — —</strong>
          <p>Your five-hour and weekly windows will appear here.</p>
        </div>
      )}
    </div>
  );
}
