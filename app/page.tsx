"use client";

import { useState } from "react";
import WorkoutCalendar from "@/app/components/WorkoutCalendar";
import WorkoutEditor from "@/app/components/WorkoutEditor";
import { WorkoutEntry } from "@/app/lib/storage";

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <main style={{ padding: "16px" }}>
      <h1>Gym Log</h1>

      <WorkoutCalendar onSelectDate={setSelectedDate} />

      {selectedDate && (
        <WorkoutEditor
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </main>
  );
}
