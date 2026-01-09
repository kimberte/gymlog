"use client";

import { useMemo, useState } from "react";
import { toDateKey } from "../lib/date";
import { getDayEntries, WorkoutEntry, WorkoutMap } from "../lib/storage";

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

function hasWorkoutContent(e: WorkoutEntry) {
  return Boolean(String(e?.title ?? "").trim() || String(e?.notes ?? "").trim());
}

function markerType(e: WorkoutEntry): "full" | "half" | null {
  const hasTitle = Boolean(String(e?.title ?? "").trim());
  const hasNotes = Boolean(String(e?.notes ?? "").trim());
  if (hasTitle) return "full";
  if (!hasTitle && hasNotes) return "half";
  return null;
}

function summarizeTitles(entries: WorkoutEntry[]) {
  const active = entries.filter(hasWorkoutContent);
  const titles = active.map((e) => String(e.title ?? "").trim()).filter(Boolean);

  // If no titles but there are note-only entries, show a friendly placeholder.
  const displayTitles = titles.length
    ? titles
    : active.length
      ? ["Notes"]
      : [];

  const first = displayTitles[0] ?? "";
  const extra = Math.max(0, active.length - 1);
  return { first, extra, activeCount: active.length, titles: displayTitles };
}

type Props = {
  workouts: WorkoutMap;
  onSelectDate: (d: string) => void;
  stacked: boolean;
  weekStart: "sunday" | "monday";
  selectedDate?: string | null;
};

export default function WorkoutCalendar({
  workouts,
  onSelectDate,
  stacked,
  weekStart,
  selectedDate,
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
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const firstDow = first.getDay(); // 0 Sun .. 6 Sat
    const offset = weekStart === "monday" ? (firstDow + 6) % 7 : firstDow;

    const blanks = Array.from({ length: offset }, () => null as Date | null);

    const total = blanks.length + monthDays.length;
    const tail = (7 - (total % 7)) % 7;
    const trailing = Array.from({ length: tail }, () => null as Date | null);

    return [...blanks, ...monthDays, ...trailing];
  }, [cursor, monthDays, weekStart]);

  const monthWorkoutCount = useMemo(() => {
    let count = 0;
    for (const d of monthDays) {
      const key = toDateKey(d);
      const entries = getDayEntries(workouts, key);
      count += entries.filter(hasWorkoutContent).length;
    }
    return count;
  }, [monthDays, workouts]);

  const monthWorkoutLabel =
    monthWorkoutCount === 1
      ? "1 workout this month"
      : `${monthWorkoutCount} workouts this month`;

  // Jump-to-today (month) button
  const today = useMemo(() => new Date(), []);
  const isCurrentMonth =
    cursor.getFullYear() === today.getFullYear() &&
    cursor.getMonth() === today.getMonth();

  function jumpToToday() {
    const t = new Date();
    setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
  }

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

        <div className="month-title">
          <h2>{formatMonthYear(cursor)}</h2>

          {monthWorkoutCount > 0 && (
            <div className="month-subtitle">{monthWorkoutLabel}</div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isCurrentMonth && (
            <button onClick={jumpToToday} aria-label="Jump to current month" title="Jump to current month">
              Today
            </button>
          )}

          <button
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            aria-label="Next month"
          >
            ›
          </button>
        </div>
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

              const key = toDateKey(d);
              const entries = getDayEntries(workouts, key).slice(0, 3);
              const markers = entries.map(markerType).filter(Boolean) as Array<"full" | "half">;

              const { first, extra, activeCount } = summarizeTitles(entries);
              const isSelected = Boolean(selectedDate && key === selectedDate);

              return (
                <div
                  key={key}
                  className={`cell ${isToday(d) ? "today" : ""} ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => onSelectDate(key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelectDate(key);
                  }}
                >
                  {markers.length > 0 && (
                    <div className="workout-dots" aria-hidden="true">
                      {markers.slice(0, 3).map((m, i) =>
                        m === "half" ? (
                          <span key={i} className="workout-half-dot" />
                        ) : (
                          <span key={i} className="workout-dot" />
                        )
                      )}
                    </div>
                  )}

                  <div className="cell-date">{d.getDate()}</div>

                  {activeCount > 0 && (
                    <>
                      <div className="cell-title">{first}</div>
                      {extra > 0 && <div className="cell-more">+{extra}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {stacked && (
        <div className="stacked-list">
          {monthDays.map((d) => {
            const key = toDateKey(d);
            const entries = getDayEntries(workouts, key).slice(0, 3);
            const markers = entries.map(markerType).filter(Boolean) as Array<"full" | "half">;

            const titles = entries.filter(hasWorkoutContent).map((e) => String(e.title ?? "").trim()).filter(Boolean);
            const displayTitles =
              titles.length ? titles : entries.some((e) => Boolean(String(e.notes ?? "").trim())) ? ["Notes"] : [];

            const first = displayTitles[0] ?? "—";
            const extra = Math.max(0, displayTitles.length - 1);
            const rightLabel = extra > 0 ? `${first} +${extra}` : first;

            const isSelected = Boolean(selectedDate && key === selectedDate);

            return (
              <div
                key={key}
                className={`stacked-row ${isToday(d) ? "today" : ""} ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => onSelectDate(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectDate(key);
                }}
              >
                <div className="stacked-date">
                  {markers.length > 0 && (
                    <span className="workout-dots-inline" aria-hidden="true">
                      {markers.slice(0, 3).map((m, i) =>
                        m === "half" ? (
                          <span key={i} className="workout-half-dot" />
                        ) : (
                          <span key={i} className="workout-dot" />
                        )
                      )}
                    </span>
                  )}
                  {formatStackedDate(d)}
                </div>

                <div className="stacked-title">{rightLabel}</div>
              </div>
            );
          })}
        </div>
      )}

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
