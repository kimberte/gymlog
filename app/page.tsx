"use client";

import { useEffect, useRef, useState } from "react";
import WorkoutCalendar from "./components/WorkoutCalendar";
import WorkoutEditor from "./components/WorkoutEditor";
import SettingsModal from "./components/SettingsModal";
import { loadWorkouts, saveWorkouts } from "./lib/storage";
import { supabase } from "./lib/supabaseClient";
import { upsertBackup } from "./lib/backup";

type WeekStart = "sunday" | "monday";

const WEEKSTART_KEY = "gym-log-week-start";

function loadWeekStart(): WeekStart {
  if (typeof window === "undefined") return "sunday";
  try {
    const v = localStorage.getItem(WEEKSTART_KEY);
    return v === "monday" ? "monday" : "sunday";
  } catch {
    return "sunday";
  }
}

function saveWeekStart(v: WeekStart) {
  try {
    localStorage.setItem(WEEKSTART_KEY, v);
  } catch {}
}

function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 2v3M17 2v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4.5 9h15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5v12A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-12A2.5 2.5 0 0 1 6.5 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 12h3M13.5 12h3M7.5 16h3M13.5 16h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ListIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 7h14M7 12h14M7 17h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4.5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon({ size = 20 }: { size?: number }) {
  // Clean flat nut/cog icon
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2.75
           13.6 4.35
           15.85 3.95
           17.15 5.9
           19.1 6.2
           19.4 8.45
           21 10.05
           20.1 12
           21 13.95
           19.4 15.55
           19.1 17.8
           17.15 18.1
           15.85 20.05
           13.6 19.65
           12 21.25
           10.4 19.65
           8.15 20.05
           6.85 18.1
           4.9 17.8
           4.6 15.55
           3 13.95
           3.9 12
           3 10.05
           4.6 8.45
           4.9 6.2
           6.85 5.9
           8.15 3.95
           10.4 4.35
           12 2.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function HomePage() {
  const [workouts, setWorkouts] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // week start (non-pro)
  const [weekStart, setWeekStart] = useState<WeekStart>("sunday");

  // backup state
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  const lastBackupHashRef = useRef<string>("");
  const backupTimerRef = useRef<number | null>(null);

  // prevents wipe on first mount
  const didLoadRef = useRef(false);

  useEffect(() => {
    const loaded = loadWorkouts();
    setWorkouts(loaded);

    const ws = loadWeekStart();
    setWeekStart(ws);

    didLoadRef.current = true;
  }, []);

  useEffect(() => {
    if (!didLoadRef.current) return;
    saveWorkouts(workouts);
  }, [workouts]);

  useEffect(() => {
    if (!didLoadRef.current) return;
    saveWeekStart(weekStart);
  }, [weekStart]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  }

  // Track auth state (for backup gating)
  useEffect(() => {
    let unsub: { data?: { subscription?: { unsubscribe: () => void } } } | null =
      null;

    async function init() {
      const { data } = await supabase.auth.getSession();
      setIsSignedIn(Boolean(data.session?.user));

      unsub = supabase.auth.onAuthStateChange((_event, session) => {
        setIsSignedIn(Boolean(session?.user));
      });
    }

    init();

    return () => {
      try {
        unsub?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  // Auto-backup (debounced) when workouts change AND user is signed in
  useEffect(() => {
    if (!isSignedIn) return;
    if (!didLoadRef.current) return;

    if (backupTimerRef.current) window.clearTimeout(backupTimerRef.current);

    backupTimerRef.current = window.setTimeout(async () => {
      try {
        const hash = JSON.stringify(workouts ?? {});
        if (hash === lastBackupHashRef.current) return;

        const updatedAt = await upsertBackup(workouts);
        lastBackupHashRef.current = hash;
        setLastBackupAt(updatedAt);
      } catch {
        // keep quiet
      }
    }, 1200);

    return () => {
      if (backupTimerRef.current) window.clearTimeout(backupTimerRef.current);
    };
  }, [workouts, isSignedIn]);

  return (
    <>
      <header className="top-bar">
        <h1>Gym Log</h1>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Toggle view icon: calendar <-> list */}
          <button
            className="icon-btn"
            title={stacked ? "Stacked view" : "Calendar view"}
            onClick={() => setStacked((s) => !s)}
            aria-label="Toggle view"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {stacked ? <ListIcon /> : <CalendarIcon />}
          </button>

          {/* Flat nut/cog settings icon */}
          <button
            className="icon-btn"
            title="Settings"
            onClick={() => setShowSettings(true)}
            aria-label="Open settings"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <WorkoutCalendar
        workouts={workouts}
        onSelectDate={setSelectedDate}
        stacked={stacked}
        weekStart={weekStart}
      />

      {/* ✅ FIX: WorkoutEditor expects `date` prop */}
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
          setWorkouts={setWorkouts}
          onClose={() => setShowSettings(false)}
          toast={showToast}
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          lastBackupAt={lastBackupAt}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
