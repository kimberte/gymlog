"use client";

import { useMemo, useState } from "react";

function getMonthDays(cursor: Date) {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

  // Normalize to local midnight to avoid DST weirdness
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    days.push(copy);
  }
  return days;
}

function isToday(d: Date) {
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatStackedDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * IMPORTANT: Avoid d.toISOString().slice(0,10) because that uses UTC
 * and can shift the date depending on timezone.
 * This returns a local-date key like "2026-01-04".
 */
function toLocalDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WorkoutCalendar({
  workouts,
  onSelectDate,
  stacked,
}: {
  workouts: Record<string, any>;
  onSelectDate: (d: string) => void;
  stacked: boolean;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const days = useMemo(() => getMonthDays(cursor), [cursor]);

  return (
    <div className="calendar">
      <header>
        <button
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
          }
          aria-label="Previous month"
          title="Previous month"
        >
          ‹
        </button>

        <h2>{formatMonthYear(cursor)}</h2>

        <button
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
          }
          aria-label="Next month"
          title="Next month"
        >
          ›
        </button>
      </header>

      {!stacked && (
        <div className="grid">
          {days.map((d) => {
            const key = toLocalDateKey(d);
            const w = workouts?.[key];

            return (
              <div
                key={key}
                className={`cell ${isToday(d) ? "today" : ""}`}
                onClick={() => onSelectDate(key)}
                role="button"
                tabIndex={0}
              >
                <div className="cell-date">{d.getDate()}</div>
                {w?.title && <div className="cell-title">{w.title}</div>}
              </div>
            );
          })}
        </div>
      )}

      {stacked && (
        <div className="stacked-list">
          {days.map((d) => {
            const key = toLocalDateKey(d);
            const w = workouts?.[key];

            return (
              <div
                key={key}
                className={`stacked-row ${isToday(d) ? "today" : ""}`}
                onClick={() => onSelectDate(key)}
                role="button"
                tabIndex={0}
              >
                <div className="stacked-date">{formatStackedDate(d)}</div>
                <div className="stacked-title">{w?.title || "—"}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
