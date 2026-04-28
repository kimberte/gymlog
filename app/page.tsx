"use client";
import { useEffect, useRef, useState } from "react";
import WorkoutCalendar from "./components/WorkoutCalendar";
import WorkoutEditor from "./components/WorkoutEditor";
import SettingsModal from "./components/SettingsModal";
import { loadWorkouts, saveWorkouts } from "./lib/storage";
import { supabase } from "./lib/supabaseClient";
import { upsertBackup } from "./lib/backup";
import { shareNodeAsPng } from "./lib/shareImage";
import { ensureTrialStarted, getProStatus, type ProStatus } from "./lib/entitlements";
import { mergeSeoTemplateIntoWorkouts } from "./lib/seoWorkoutTemplates";

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


function ProgramsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="16" r="1.2" fill="currentColor" />
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
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [proStatus, setProStatus] = useState<ProStatus>({ isPro: false, reason: "signed_out" });
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  const lastBackupHashRef = useRef<string>("");
  const backupBusyRef = useRef(false);

  const didLoadRef = useRef(false);

  const handledAuthReturnRef = useRef(false);

  useEffect(() => {
    let initialWorkouts = loadWorkouts();

    const ws = loadWeekStart();
    setWeekStart(ws);

    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        const authIntent = url.searchParams.get("auth");
        const returnTo = url.searchParams.get("returnTo");

        if (authIntent === "signup" || authIntent === "signin") {
          setShowSettings(true);
          try {
            localStorage.setItem("gym-log-auth-intent", authIntent);
            if (returnTo) localStorage.setItem("gym-log-auth-return-to", returnTo);
          } catch {}
        }

        const importedFlag = url.searchParams.get("imported") === "1";
        const importSlug = String(url.searchParams.get("template") || "").trim();
        const importStartDate = String(url.searchParams.get("start") || "").trim();
        const pendingImportRaw = localStorage.getItem("gym-log-template-import-pending");

        let pendingSlug = "";
        let pendingStartDate = "";

        if (pendingImportRaw) {
          try {
            const pending = JSON.parse(pendingImportRaw) as { slug?: string; startDate?: string };
            pendingSlug = String(pending?.slug || "").trim();
            pendingStartDate = String(pending?.startDate || "").trim();
          } catch {}
        }

        const slug = importSlug || pendingSlug;
        const startDate = importStartDate || pendingStartDate;

        if (slug && startDate) {
          const result = mergeSeoTemplateIntoWorkouts(initialWorkouts, slug, startDate);
          initialWorkouts = result.next;
          saveWorkouts(initialWorkouts);
          try {
            localStorage.setItem("gym-log-workouts", JSON.stringify(initialWorkouts));
            localStorage.removeItem("gym-log-template-import-pending");
          } catch {}
          if (result.importedDates[0]) {
            setSelectedDate(result.importedDates[0]);
          }
        }

        if (importedFlag || (slug && startDate)) {
          showToast("Template imported");
        }

        if (importedFlag || importSlug || importStartDate) {
          url.searchParams.delete("imported");
          url.searchParams.delete("template");
          url.searchParams.delete("start");
          window.history.replaceState({}, "", `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}`);
        }
      } catch {}
    }

    setWorkouts(initialWorkouts);
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
    if (handledAuthReturnRef.current) return;
    handledAuthReturnRef.current = true;

    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const hash = url.hash || "";
    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const queryType = url.searchParams.get("type");
    const hashType = hashParams.get("type");
    const type = queryType || hashType || "";
    const hasAccessToken = hash.includes("access_token=") || Boolean(hashParams.get("access_token"));
    const resetSuccess = url.searchParams.get("reset") === "success";
    const confirmed = url.searchParams.get("confirmed") === "1";

    if (resetSuccess) {
      showToast("Password updated successfully");
      url.searchParams.delete("reset");
      window.history.replaceState({}, "", `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}`);
      return;
    }

    if (confirmed || hasAccessToken || type === "signup" || type === "magiclink") {
      showToast("Account confirmed. Welcome!");
      let returnTo = url.searchParams.get("returnTo") || "";
      try {
        returnTo = returnTo || localStorage.getItem("gym-log-auth-return-to") || "";
        localStorage.removeItem("gym-log-auth-return-to");
        localStorage.removeItem("gym-log-auth-intent");
      } catch {}

      if (returnTo && returnTo.startsWith("/")) {
        window.location.replace(returnTo);
      } else {
        window.history.replaceState({}, "", "/");
      }
      return;
    }
  }, []);

  useEffect(() => {
    let unsub: { data?: { subscription?: { unsubscribe: () => void } } } | null = null;

    async function init() {
      const { data } = await supabase.auth.getSession();
      setIsSignedIn(Boolean(data.session?.user));
      setSessionUserId(data.session?.user?.id ?? null);
      if (data.session?.user?.id) {
        try {
          await ensureTrialStarted(data.session.user.id);
          const st = await getProStatus(data.session.user.id);
          setProStatus(st);
        } catch {
          setProStatus({ isPro: false, reason: "free" });
        }
      } else {
        setProStatus({ isPro: false, reason: "signed_out" });
      }

      unsub = supabase.auth.onAuthStateChange(async (_event, session) => {
        setIsSignedIn(Boolean(session?.user));
        const uid = session?.user?.id ?? null;
        setSessionUserId(uid);
        if (uid) {
          try {
            await ensureTrialStarted(uid);
            const st = await getProStatus(uid);
            setProStatus(st);
          } catch {
            setProStatus({ isPro: false, reason: "free" });
          }
        } else {
          setProStatus({ isPro: false, reason: "signed_out" });
        }
      });
    }

    init();

    return () => {
      try {
        unsub?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  async function requestBackup(nextWorkouts: Record<string, any>) {
    if (!isSignedIn) return;
    if (!proStatus.isPro) return;
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
            width={28}
            height={28}
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

          <button
            className="icon-btn nav-tooltip nav-programs-btn"
            title="Programs"
            aria-label="Open workout programs"
            data-tooltip="Workout programs"
            onClick={() => {
              window.location.href = "/workouts";
            }}
          >
            <ProgramsIcon />
            <span className="nav-programs-label">Programs</span>
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

{!isSignedIn && (
  <div style={{
    margin: "10px 16px",
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 13,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  }}>
    <span style={{opacity:0.85}}>Not signed in.</span>
    <button
      style={{
        fontSize:12,
        padding:"4px 8px",
        borderRadius:6,
        border:"1px solid rgba(255,255,255,0.2)",
        background:"rgba(255,255,255,0.08)",
        cursor:"pointer"
      }}
      onClick={() => setShowSettings(true)}
    >
      Open Settings
    </button>
  </div>
)}


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
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
