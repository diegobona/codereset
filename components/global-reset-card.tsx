"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clock3, Radio } from "lucide-react";
import {
  FALLBACK_GLOBAL_RESET,
  GLOBAL_RESET_STATUS_ENDPOINT,
  getElapsedParts,
  normalizeGlobalResetStatus,
} from "@/lib/global-reset";

const timeUnits = [
  ["days", "DAYS"],
  ["hours", "HOURS"],
  ["minutes", "MIN"],
  ["seconds", "SEC"],
] as const;

const todayStatusLabels = {
  confirmed_today: "TODAY / CONFIRMED",
  recorded_today: "TODAY / RECORDED",
  no_verified_reset: "TODAY / NOT CONFIRMED",
  unknown: "TODAY / UNKNOWN",
} as const;

function formatUtcTimestamp(value: string) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  const time = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date);
  return `${day} · ${time} UTC`;
}

export function GlobalResetCard() {
  const [snapshot, setSnapshot] = useState(FALLBACK_GLOBAL_RESET);
  const [now, setNow] = useState(() => new Date(FALLBACK_GLOBAL_RESET.lastChecked));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const initialTick = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), 1_000);

    void fetch(GLOBAL_RESET_STATUS_ENDPOINT, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Reset feed unavailable")))
      .then((payload: unknown) => normalizeGlobalResetStatus(payload))
      .then((nextSnapshot) => {
        if (active && nextSnapshot) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        // Keep the dated, last-known snapshot when the community feed is unavailable.
      });

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, []);

  const elapsed = useMemo(
    () => getElapsedParts(snapshot.effectiveAt, now),
    [now, snapshot.effectiveAt],
  );
  const timerLabel = `${elapsed.days} days, ${elapsed.hours} hours, ${elapsed.minutes} minutes, ${elapsed.seconds} seconds since the latest global reset signal`;
  return (
    <section
      className="global-reset-card"
      aria-label="Latest global reset signal"
    >
      <div className="global-reset-head">
        <span className="global-reset-live"><i /> UPDATED EVERY SECOND</span>
        <span className="global-reset-scope">
          <Radio size={13} /> {todayStatusLabels[snapshot.state]}
        </span>
      </div>

      <div className="global-reset-body">
        <div className="global-reset-primary">
          <div className="global-reset-title-row">
            <h2>Time since the last global reset</h2>
            <span>{snapshot.recordState.toUpperCase()} RECORD</span>
          </div>

          <div className="global-reset-time" aria-label={timerLabel} aria-live="off">
            {timeUnits.map(([key, label]) => (
              <div className="global-reset-unit" data-testid="global-reset-unit" key={key}>
                <strong>{String(elapsed[key]).padStart(2, "0")}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <p className="global-reset-announced">
            <Clock3 size={15} /> Announced {formatUtcTimestamp(snapshot.effectiveAt)}
          </p>
        </div>

        <aside className="global-reset-note">
          <b>Public signal, not your account timer.</b>
          <span>SCOPE / {snapshot.scope}</span>
        </aside>
      </div>

      <div className="global-reset-source">
        <span>LAST CHECKED / {formatUtcTimestamp(snapshot.lastChecked)} · PARTIAL COVERAGE</span>
        <div className="global-reset-links">
          <a href={snapshot.sourceUrl} target="_blank" rel="noopener noreferrer">
            Original post <ArrowUpRight size={14} />
          </a>
          <a href={snapshot.eventUrl} target="_blank" rel="noopener noreferrer">
            Data from codexreset.dev <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
