"use client";
import { useEffect, useRef, useState } from "react";
import WorkoutCalendar from "./components/WorkoutCalendar";
import WorkoutEditor from "./components/WorkoutEditor";
import SettingsModal from "./components/SettingsModal";
import { loadWorkouts, saveWorkouts } from "./lib/storage";
import { supabase } from "./lib/supabaseClient";
import { upsertBackup } from "./lib/backup";
import { shareNodeAsPng } from "./lib/shareImage";

type WeekStart = "sunday" | "monday";

const WEEKSTART_KEY = "gym-log-week-start"; // ✅ separate + safe

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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7 2v3M17 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.5 9h15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5v12A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-12A2.5 2.5 0 0 1 6.5 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7.5 12h3M13.5 12h3M7.5 16h3M13.5 16h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7 7h14M7 12h14M7 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4.5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
      <path d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ShareIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Two overlapping users (community) */}
      <path d="M9 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M17 12a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M2.5 20c0-3.2 3.1-5.8 7-5.8 2.3 0 4.4.9 5.7 2.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.8 16.1c1.1-1.2 2.6-1.9 4.4-1.9 3.0 0 5.3 2.4 5.3 5.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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

  const calendarCaptureRef = useRef<HTMLDivElement | null>(null);

  const [weekStart, setWeekStart] = useState<WeekStart>("sunday");

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [proStatus, setProStatus] = useState<string | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [entitlementsTick, setEntitlementsTick] = useState(0);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  const lastBackupHashRef = useRef<string>("");
  const backupBusyRef = useRef(false);

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

  useEffect(() => {
    let unsub: { data?: { subscription?: { unsubscribe: () => void } } } | null = null;

    async function init() {
      const { data } = await supabase.auth.getSession();
      setIsSignedIn(Boolean(data.session?.user));
      setSessionToken(data.session?.access_token ?? null);

      unsub = supabase.auth.onAuthStateChange((_event, session) => {
        setIsSignedIn(Boolean(session?.user));
        setSessionToken(session?.access_token ?? null);
      });
    }

    init();

    return () => {
      try {
        unsub?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  // Load Pro entitlements (server-truth via Stripe webhooks)
  useEffect(() => {
    async function loadEntitlements() {
      if (!sessionToken) {
        setIsPro(false);
        setProStatus(null);
        setTrialEnd(null);
        return;
      }

      try {
        const res = await fetch("/api/me/entitlements", {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed");
        setIsPro(Boolean(json?.isPro));
        setProStatus(json?.status ?? null);
        setTrialEnd(json?.trialEnd ?? null);
      } catch {
        // If entitlements fail to load, default to free (safe)
        setIsPro(false);
        setProStatus(null);
        setTrialEnd(null);
      }
    }

    loadEntitlements();
  }, [sessionToken, entitlementsTick]);

  // If returning from Stripe Checkout, refresh entitlements once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const checkout = sp.get("checkout");
    if (checkout === "success" || checkout === "cancel") {
      setEntitlementsTick((n) => n + 1);
      // Clean the URL
      sp.delete("checkout");
      const next = `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  function refreshEntitlements() {
    setEntitlementsTick((n) => n + 1);
  }

  async function requestBackup(nextWorkouts: Record<string, any>) {
    if (!isSignedIn) return;
    if (!isPro) return; // ✅ Pro-only
    if (!didLoadRef.current) return;
    if (backupBusyRef.current) return;

    try {
      const hash = JSON.stringify(nextWorkouts ?? {});
      if (hash === lastBackupHashRef.current) return;
      backupBusyRef.current = true;

      const updatedAt = await upsertBackup(nextWorkouts);
      lastBackupHashRef.current = hash;
      setLastBackupAt(updatedAt);
    } catch {
      // quiet
    } finally {
      backupBusyRef.current = false;
    }
  }

  async function onShareCalendar() {
    if (selectedDate) {
      showToast("Close the editor to share");
      return;
    }
    if (showSettings) {
      showToast("Close settings to share");
      return;
    }

    const node = calendarCaptureRef.current;
    if (!node) {
      showToast("Nothing to share");
      return;
    }

    try {
      showToast("Preparing image…");
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");

      await shareNodeAsPng({
        node,
        filename: `gym-log-calendar-${y}-${m}-${d}.png`,
        title: "Gym Log",
      });
    } catch {
      showToast("Share failed");
    }
  }

  return (
    <>
      <header className="top-bar">
        <div className="brand">
          <img
            src="/icons/gym-app-logo-color-40x40.png"
            alt="Gym Log"
            className="brand-logo"
            width={20}
            height={20}
          />
          <h1>Gym Log</h1>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            className="icon-btn"
            title={selectedDate ? "Close the editor to share" : showSettings ? "Close settings to share" : "Share"}
            aria-label="Share calendar"
            onClick={onShareCalendar}
            disabled={Boolean(selectedDate) || Boolean(showSettings)}
          >
            <ShareIcon />
          </button>

          <button className="icon-btn" title="Toggle view" aria-label="Toggle view" onClick={() => setStacked((s) => !s)}>
            {stacked ? <ListIcon /> : <CalendarIcon />}
          </button>

          {/* ✅ Community icon stands out */}
          <button
            className="icon-btn"
            title="Community"
            aria-label="Open community"
            onClick={() => {
              window.location.href = "/community";
            }}
            style={{
              color: "var(--accent)",
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.18)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.10) inset",
            }}
          >
            <PeopleIcon />
          </button>

          <button className="icon-btn" title="Settings" aria-label="Open settings" onClick={() => setShowSettings(true)}>
            <SettingsIcon />
          </button>
        </div>
      </header>

      <div ref={calendarCaptureRef} style={{ position: "relative" }}>
        <WorkoutCalendar
          workouts={workouts}
          onSelectDate={setSelectedDate}
          stacked={stacked}
          weekStart={weekStart}
          selectedDate={selectedDate}
        />
      </div>

      {selectedDate && (
        <WorkoutEditor
          date={selectedDate}
          workouts={workouts}
          setWorkouts={setWorkouts}
          onSaved={(next) => requestBackup(next)}
          onClose={() => setSelectedDate(null)}
          toast={showToast}
          isPro={isPro}
        />
      )}

      {showSettings && (
        <SettingsModal
          workouts={workouts}
          setWorkouts={setWorkouts}
          onDataSaved={(next) => requestBackup(next)}
          onClose={() => setShowSettings(false)}
          toast={showToast}
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          lastBackupAt={lastBackupAt}
          isSignedIn={isSignedIn}
          sessionToken={sessionToken}
          isPro={isPro}
          proStatus={proStatus}
          trialEnd={trialEnd}
          refreshEntitlements={refreshEntitlements}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
