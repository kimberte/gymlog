"use client";

import { useEffect, useState } from "react";
import { getWorkoutMap } from "@/app/lib/storage";

interface Props {
  onSelectDate: (date: string) => void;
}

export default function WorkoutCalendar({ onSelectDate }: Props) {
  const [workouts, setWorkouts] = useState<Record<string, string>>({});

  useEffect(() => {
    setWorkouts(getWorkoutMap());
  }, []);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "8px",
        marginTop: "16px",
      }}
    >
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const date = new Date(year, month, i + 1)
          .toISOString()
          .split("T")[0];

        return (
          <div
            key={date}
            onClick={() => onSelectDate(date)}
            style={{
              border: "1px solid #ccc",
              padding: "8px",
              cursor: "pointer",
              minHeight: "60px",
            }}
          >
            <strong>{i + 1}</strong>
            {workouts[date] && (
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                {workouts[date]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
