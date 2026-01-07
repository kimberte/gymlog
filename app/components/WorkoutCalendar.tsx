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

  const today = useMemo(() => new Date(), []);
  const isCurrentMonth =
    cursor.getFullYear() === today.getFullYear() &&
    cursor.getMonth() === today.getMonth();

  function jumpToToday() {
    const t = new Date();
    setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
  }

  // ---- WEEKDAY LABELS ----
  const labels = useMemo(() => {
    return weekStart === "monday"
      ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  }, [weekStart]);

  // ---- DAYS IN MONTH ----
  const monthDays = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const days: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [cursor]);

  // ---- GRID WITH LEADING/TRAILING BLANKS ----
  const gridCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const firstDow = first.getDay();
    const offset = weekStart === "monday" ? (firstDow + 6) % 7 : firstDow;

    const blanks = Array.from({ length: offset }, () => null as Date | null);
    const total = blanks.length + monthDays.length;
    const tail = (7 - (total % 7)) % 7;
    const trailing = Array.from({ length: tail }, () => null as Date | null);

    return [...blanks, ...monthDays, ...trailing];
  }, [cursor, monthDays, weekStart]);

  // ---- MONTH WORKOUT COUNT (title or notes) ----
  const monthWorkoutCount = useMemo(() => {
    let count = 0;
    for (const d of monthDays) {
      const key = d.toISOString().slice(0, 10);
      const w = workouts?.[key] ?? {};
      const hasWorkout = Boolean(
        (w?.title && String(w.title).trim()) ||
          (w?.notes && String(w.notes).trim())
      );
      if (hasWorkout) count += 1;
    }
    return count;
  }, [monthDays, workouts]);

  const monthWorkoutLabel =
    monthWorkoutCount === 1
      ? "1 workout this month"
      : `${monthWorkoutCount} workouts this month`;

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

        <div className="month-title" style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0 }}>{formatMonthYear(cursor)}</h2>

          {monthWorkoutCount > 0 && (
            <div className="month-subtitle">{monthWorkoutLabel}</div>
          )}

          {/* ✅ Jump to Today */}
          <button
            onClick={jumpToToday}
            disabled={isCurrentMonth}
            aria-label="Jump to current month"
            style={{
              marginTop: 8,
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.12)",
              color: "var(--text)",
              cursor: isCurrentMonth ? "default" : "pointer",
              opacity: isCurrentMonth ? 0.5 : 1,
              fontSize: 12,
              lineHeight: "12px",
            }}
          >
            Today
          </button>
        </div>

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
              const w = workouts[key] ?? {};
              const hasTitle = Boolean(w?.title && String(w.title).trim());
              const hasNotesOnly = Boolean(
                !hasTitle && w?.notes && String(w.notes).trim()
              );
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
                  {/* ● full dot for workout title days */}
                  {hasTitle && (
                    <div className="workout-dot" aria-hidden="true" />
                  )}

                  {/* ◐ half dot for notes-only days */}
                  {hasNotesOnly && (
                    <div className="workout-half-dot" aria-hidden="true" />
                  )}

                  <div className="cell-date">{d.getDate()}</div>
                  {w?.title && <div className="cell-title">{w.title}</div>}

                  {/* optional 1-line notes preview */}
                  {!hasNotesOnly && w?.notes && (
                    <div className="cell-notes-preview">
                      {String(w.notes).split("\n")[0]}
                    </div>
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
            const key = d.toISOString().slice(0, 10);
            const w = workouts[key] ?? {};
            const hasTitle = Boolean(w?.title && String(w.title).trim());
            const hasNotesOnly = Boolean(
              !hasTitle && w?.notes && String(w.notes).trim()
            );
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
                  {hasTitle && (
                    <span className="workout-dot-inline" aria-hidden="true" />
                  )}
                  {hasNotesOnly && (
                    <span
                      className="workout-half-dot-inline"
                      aria-hidden="true"
                    />
                  )}
                  {formatStackedDate(d)}
                </div>
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
