"use client";

import { useState } from "react";
import { toDateKey } from "@/app/lib/date";
import { WorkoutMap } from "@/app/lib/storage";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function WorkoutCalendar({
  workouts,
  onSelectDate,
}: {
  workouts: WorkoutMap;
  onSelectDate: (d: string) => void;
}) {
  const [cursor, setCursor] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const todayKey = toDateKey(new Date());

  function moveMonth(dir: number) {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + dir);
    setCursor(d);
  }

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  return (
    <div className="calendar">
      <header>
        <button onClick={() => moveMonth(-1)}>◀</button>
        <h2>
          {cursor.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button onClick={() => moveMonth(1)}>▶</button>
      </header>

      {/* DAY HEADERS */}
      <div className="grid">
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ opacity: 0.7, fontSize: 13 }}>
            {d}
          </div>
        ))}
      </div>

      {/* DAYS */}
      <div className="grid">
        {days.map((d) => {
          const key = toDateKey(d);
          const workout = workouts[key];
          const isCurrentMonth = d.getMonth() === cursor.getMonth();

          return (
            <div
              key={key}
              className={`cell ${
                key === todayKey ? "today" : ""
              }`}
              style={{ opacity: isCurrentMonth ? 1 : 0.35 }}
              onClick={() => onSelectDate(key)}
            >
              <div className="cell-date">{d.getDate()}</div>
              {workout?.title && (
                <div className="cell-title">{workout.title}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
