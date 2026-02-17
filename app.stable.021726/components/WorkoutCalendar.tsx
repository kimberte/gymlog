"use client";

import { useEffect, useMemo, useState } from "react";
import { toDateKey } from "../lib/date";
import { getDayEntries, WorkoutEntry, WorkoutMap } from "../lib/storage";

function fromDateKey(key: string) {
  const [y, m, d] = key.split("-").map((n) => Number(n));
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfWeek(d: Date, weekStart: "sunday" | "monday") {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dow = copy.getDay(); // 0 Sun..6 Sat
  const offset = weekStart === "monday" ? (dow + 6) % 7 : dow;
  copy.setDate(copy.getDate() - offset);
  return copy;
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
  const titles = active
    .map((e) => String(e.title ?? "").trim())
    .filter(Boolean);
  const displayTitles = titles.length ? titles : active.length ? ["Notes"] : [];

  const first = displayTitles[0] ?? "";
  const extra = Math.max(0, active.length - 1);
  return { first, extra, activeCount: active.length, titles: displayTitles };
}

function getMediaFlags(workouts: WorkoutMap, dateKey: string) {
  const day: any = (workouts as any)?.[dateKey];

  // Legacy day image support
  const hasLegacyPhoto = Boolean(day?.image?.path);

  // Per-entry media support
  const entries = (day?.entries ?? []) as any[];
  const hasEntryPhoto = entries.some(
    (e) => e?.media?.kind === "image" && e?.media?.path
  );
  const hasEntryVideo = entries.some(
    (e) => e?.media?.kind === "video" && e?.media?.path
  );

  return {
    hasPhoto: hasLegacyPhoto || hasEntryPhoto,
    hasVideo: hasEntryVideo,
  };
}

function hasPb(workouts: WorkoutMap, dateKey: string) {
  return Boolean((workouts as any)?.[dateKey]?.pb);
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

  // Forces a re-render at midnight so "today" stays accurate.
  const [, forceTodayRerender] = useState(0);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const schedule = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 5, 0);
      const ms = Math.max(1000, next.getTime() - now.getTime());

      timeout = setTimeout(() => {
        forceTodayRerender((x) => x + 1);
        schedule();
      }, ms);
    };

    schedule();

    const bump = () => forceTodayRerender((x) => x + 1);

    // If the tab was asleep / backgrounded, force "today" to refresh on return.
    const onFocus = () => bump();
    const onVis = () => {
      if (document.visibilityState === "visible") bump();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    // Lightweight safety net: check occasionally while open.
    interval = setInterval(() => bump(), 60_000);

    return () => {
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const [stackedScope, setStackedScope] = useState<"week" | "month">("week");

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

  const stackedAnchor = useMemo(() => {
    if (selectedDate) {
      const d = fromDateKey(selectedDate);
      if (
        d.getFullYear() === cursor.getFullYear() &&
        d.getMonth() === cursor.getMonth()
      )
        return d;
    }
    const t = new Date();
    if (
      t.getFullYear() === cursor.getFullYear() &&
      t.getMonth() === cursor.getMonth()
    )
      return t;
    return new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  }, [selectedDate, cursor]);

  const weekStartDate = useMemo(
    () => startOfWeek(stackedAnchor, weekStart),
    [stackedAnchor, weekStart]
  );
  const weekEndDate = useMemo(() => {
    const e = new Date(weekStartDate);
    e.setDate(e.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
  }, [weekStartDate]);

  const stackedDays = useMemo(() => {
    if (stackedScope === "month") return monthDays;
    return monthDays.filter((d) => d >= weekStartDate && d <= weekEndDate);
  }, [monthDays, stackedScope, weekStartDate, weekEndDate]);

  function toggleStackedScope() {
    setStackedScope((s) => (s === "week" ? "month" : "week"));
  }

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
            <button
              onClick={jumpToToday}
              aria-label="Jump to current month"
              title="Jump to current month"
            >
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
              if (!d) return <div key={`blank-${idx}`} className="cell blank" />;

              const key = toDateKey(d);
              const entries = getDayEntries(workouts, key).slice(0, 3);
              const markers = entries
                .map(markerType)
                .filter(Boolean) as Array<"full" | "half">;

              const { first, extra, activeCount } = summarizeTitles(entries);
              const isSelected = Boolean(selectedDate && key === selectedDate);

              const { hasPhoto, hasVideo } = getMediaFlags(workouts, key);
              const pb = hasPb(workouts, key);

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
                  style={{ position: "relative" }}
                >
                  {/* ✅ bottom-right media badge(s) */}
                  {(hasPhoto || hasVideo) && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        display: "inline-flex",
                        gap: 6,
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      {hasPhoto && (
                        <span
                          title="Photo attached"
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            background: "rgba(0,0,0,0.28)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            color: "rgba(255,255,255,0.92)",
                          }}
                        >
                          📷
                        </span>
                      )}
                      {hasVideo && (
                        <span
                          title="Video attached"
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            background: "rgba(0,0,0,0.28)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            color: "rgba(255,255,255,0.92)",
                          }}
                        >
                          🎥
                        </span>
                      )}
                    </div>
                  )}

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

                  <div
                    className="cell-date"
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <span>{d.getDate()}</span>
                    {pb && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.16)",
                          background: "rgba(0,0,0,0.20)",
                          lineHeight: 1.2,
                        }}
                      >
                        PB
                      </span>
                    )}
                  </div>

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
        <div className="stacked-wrap">
          <div className="stacked-scope-toggle">
            <button
              type="button"
              className="stacked-toggle-btn"
              onClick={toggleStackedScope}
            >
              {stackedScope === "week" ? "View full month" : "View current week"}
            </button>
          </div>

          <div className="stacked-list">
            {stackedDays.map((d) => {
              const key = toDateKey(d);
              const entries = getDayEntries(workouts, key).slice(0, 3);
              const markers = entries
                .map(markerType)
                .filter(Boolean) as Array<"full" | "half">;

              const titles = entries
                .filter(hasWorkoutContent)
                .map((e) => String(e.title ?? "").trim())
                .filter(Boolean);

              const displayTitles = titles.length
                ? titles
                : entries.some((e) => Boolean(String(e.notes ?? "").trim()))
                ? ["Notes"]
                : [];
              const titleLines = displayTitles.length ? displayTitles : ["—"];

              const isSelected = Boolean(selectedDate && key === selectedDate);
              const { hasPhoto, hasVideo } = getMediaFlags(workouts, key);
              const pb = hasPb(workouts, key);

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
                  {/* ✅ DATE FIRST, icons AFTER */}
                  <div className="stacked-date">
                    <span style={{ marginRight: 10 }}>{formatStackedDate(d)}</span>

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

                    {(hasPhoto || hasVideo) && (
                      <span
                        style={{
                          display: "inline-flex",
                          gap: 6,
                          marginLeft: 8,
                          alignItems: "center",
                        }}
                      >
                        {hasPhoto && (
                          <span
                            title="Photo attached"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 18,
                              height: 18,
                              borderRadius: 999,
                              fontSize: 12,
                              background: "rgba(0,0,0,0.28)",
                              border: "1px solid rgba(255,255,255,0.14)",
                              color: "rgba(255,255,255,0.92)",
                              flex: "0 0 auto",
                            }}
                          >
                            📷
                          </span>
                        )}
                        {hasVideo && (
                          <span
                            title="Video attached"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 18,
                              height: 18,
                              borderRadius: 999,
                              fontSize: 12,
                              background: "rgba(0,0,0,0.28)",
                              border: "1px solid rgba(255,255,255,0.14)",
                              color: "rgba(255,255,255,0.92)",
                              flex: "0 0 auto",
                            }}
                          >
                            🎥
                          </span>
                        )}
                      </span>
                    )}

                    {pb && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.16)",
                          background: "rgba(0,0,0,0.20)",
                          lineHeight: 1.2,
                          marginLeft: 8,
                          flex: "0 0 auto",
                        }}
                        title="Personal Best"
                      >
                        PB
                      </span>
                    )}
                  </div>

                  <div className="stacked-title">
                    {titleLines.slice(0, 3).map((t, i) => (
                      <div key={i} className="stacked-title-line">
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="stacked-scope-toggle bottom">
            <button
              type="button"
              className="stacked-toggle-btn"
              onClick={toggleStackedScope}
            >
              {stackedScope === "week" ? "View full month" : "View current week"}
            </button>
          </div>
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
