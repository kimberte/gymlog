"use client";

import { useMemo, useState } from "react";

function isToday(d: Date) {
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatStackedDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type Props = {
  workouts: any;
  onSelectDate: (d: string) => void;
  stacked: boolean;
  weekStart: "sunday" | "monday";
};

export default function WorkoutCalendar({
  workouts,
  onSelectDate,
  stacked,
  weekStart,
}: Props) {
  const [cursor, setCursor] = useState(new Date());

  const labels = useMemo(() => {
    return weekStart === "monday"
      ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  }, [weekStart]);

  const monthDays = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

    const days: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [cursor]);

  const gridCells = useMemo(() => {
    // Leading blanks so day 1 lands under correct weekday column.
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const firstDow = first.getDay(); // 0 Sun .. 6 Sat

    const offset =
      weekStart === "monday"
        ? (firstDow + 6) % 7 // shift so Monday=0
        : firstDow; // Sunday=0

    const blanks = Array.from({ length: offset }, () => null as Date | null);

    // Trailing blanks to complete last row
    const total = blanks.length + monthDays.length;
    const tail = (7 - (total % 7)) % 7;
    const trailing = Array.from({ length: tail }, () => null as Date | null);

    return [...blanks, ...monthDays, ...trailing];
  }, [cursor, monthDays, weekStart]);

  return (
    <div className="calendar">
      <header>
        <button
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
          }
          aria-label="Previous month"
        >
          ‹
        </button>

        <h2>{formatMonthYear(cursor)}</h2>

        <button
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
          }
          aria-label="Next month"
        >
          ›
        </button>
      </header>

      {!stacked && (
        <>
          <div className="dow">
            {labels.map((l) => (
              <div key={l} className="dow-cell">
                {l}
              </div>
            ))}
          </div>

          <div className="grid">
            {gridCells.map((d, idx) => {
              if (!d) {
                return <div key={`blank-${idx}`} className="cell blank" />;
              }

              const key = d.toISOString().slice(0, 10);
              const w = workouts[key];

              return (
                <div
                  key={key}
                  className={`cell ${isToday(d) ? "today" : ""}`}
                  onClick={() => onSelectDate(key)}
                >
                  <div className="cell-date">{d.getDate()}</div>
                  {w?.title && <div className="cell-title">{w.title}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {stacked && (
        <div className="stacked-list">
          {monthDays.map((d) => {
            const key = d.toISOString().slice(0, 10);
            const w = workouts[key];

            return (
              <div
                key={key}
                className={`stacked-row ${isToday(d) ? "today" : ""}`}
                onClick={() => onSelectDate(key)}
              >
                <div className="stacked-date">{formatStackedDate(d)}</div>
                <div className="stacked-title">{w?.title || "—"}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer links */}
      <div
        style={{
          padding: "14px 16px 18px",
          textAlign: "center",
          opacity: 0.85,
          fontSize: 13,
          display: "flex",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <a
          href="/privacy"
          style={{
            color: "var(--text)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Privacy
        </a>
        <a
          href="/terms"
          style={{
            color: "var(--text)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Terms
        </a>
      </div>
    </div>
  );
}
