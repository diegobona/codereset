"use client";

import { useState, type FormEvent } from "react";
import { CalendarPlus } from "lucide-react";

import { trackEvent } from "@/lib/analytics/events";
import {
  convertResetTime,
  createCalendarEvent,
  parseAbsoluteResetTimestamp,
  type ResetTimeConversion,
} from "@/lib/reset";

const timeZones = [
  { value: "UTC", label: "UTC" },
  { value: "America/Los_Angeles", label: "Pacific time" },
  { value: "America/New_York", label: "Eastern time" },
  { value: "Europe/London", label: "London time" },
  { value: "Asia/Tokyo", label: "Tokyo time" },
] as const;

const dayRelationLabels: Record<ResetTimeConversion["dayRelation"], string> = {
  "previous-day": "Previous calendar day from UTC",
  "same-day": "Same calendar day as UTC",
  "next-day": "Next calendar day from UTC",
};

type ConversionResult = {
  resetAt: Date;
  value: ResetTimeConversion;
};

export function ResetTimeConverter() {
  const [timestamp, setTimestamp] = useState("");
  const [timeZone, setTimeZone] = useState("UTC");
  const [result, setResult] = useState<ConversionResult>();
  const [error, setError] = useState("");

  function resetOutput() {
    setResult(undefined);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resetAt = parseAbsoluteResetTimestamp(timestamp);
    if (!resetAt) {
      setResult(undefined);
      setError(
        "Use an ISO timestamp and include Z or an explicit offset, for example 2026-09-15T18:30:00+08:00.",
      );
      return;
    }

    const value = convertResetTime(resetAt, timeZone);
    if (!value) {
      setResult(undefined);
      setError("That timezone could not be converted in this browser.");
      return;
    }

    setError("");
    setResult({ resetAt, value });
  }

  function downloadReminder() {
    if (!result) return;
    trackEvent("ics_download");
    const file = new Blob(
      [
        createCalendarEvent({
          resetAt: result.resetAt,
          title: "Codex reset",
          reminderMinutes: 5,
        }),
      ],
      { type: "text/calendar;charset=utf-8" },
    );
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "codex-reset-reminder.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="reset-time-converter">
      <form className="reset-time-form" onSubmit={handleSubmit}>
        <div className="reset-time-field reset-time-timestamp-field">
          <label htmlFor="reset-timestamp">Reset timestamp</label>
          <input
            id="reset-timestamp"
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="2026-09-15T18:30:00+08:00"
            value={timestamp}
            onChange={(event) => {
              setTimestamp(event.target.value);
              resetOutput();
            }}
          />
          <span className="reset-time-hint">
            Paste the timestamp shown by Codex. Keep its Z or ±HH:MM offset.
          </span>
        </div>

        <div className="reset-time-field">
          <label htmlFor="display-timezone">Display timezone</label>
          <select
            id="display-timezone"
            value={timeZone}
            onChange={(event) => {
              setTimeZone(event.target.value);
              resetOutput();
            }}
          >
            {timeZones.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>
        </div>

        <button className="reset-time-submit" type="submit">
          Convert time
        </button>
      </form>

      {error && (
        <p className="reset-time-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <section className="reset-time-result" role="status" aria-live="polite">
          <span className="section-index">YOUR RESET TIME</span>
          <strong>{result.value.time}</strong>
          <p>{result.value.date}</p>
          <div className="reset-time-result-meta">
            <span>
              {result.value.timeZoneName} · {result.value.utcOffset}
            </span>
            <span>{dayRelationLabels[result.value.dayRelation]}</span>
          </div>
          <button type="button" onClick={downloadReminder}>
            <CalendarPlus size={16} /> Download 5-minute reminder
          </button>
        </section>
      )}
    </div>
  );
}
