"use client";

import { useEffect, useState } from "react";
import WorkoutCalendar from "./components/WorkoutCalendar";
import WorkoutEditor from "./components/WorkoutEditor";
import SettingsModal from "./components/SettingsModal";
import { loadWorkouts, saveWorkouts } from "./lib/storage";

export default function HomePage() {
  const [workouts, setWorkouts] = useState({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setWorkouts(loadWorkouts());
  }, []);

  useEffect(() => {
    saveWorkouts(workouts);
  }, [workouts]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  }

  return (
    <>
      <header className="top-bar" style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Gym Log</h1>
        <button className="icon-btn" onClick={() => setShowSettings(true)}>
          ⚙︎
        </button>
      </header>

      <WorkoutCalendar
        workouts={workouts}
        onSelectDate={setSelectedDate}
      />

      {selectedDate && (
        <WorkoutEditor
          date={selectedDate}
          workouts={workouts}
          setWorkouts={setWorkouts}
          onClose={() => setSelectedDate(null)}
          toast={showToast}
        />
      )}

      {showSettings && (
        <SettingsModal
          workouts={workouts}
          onClose={() => setShowSettings(false)}
          toast={showToast}
        />
      )}

      {toast && (
        <div className="toast">{toast}</div>
      )}
    </>
  );
}
