"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createContext, useContext, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "gym-log-theme";
type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.gymlogTheme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("light");
  const [settingsSlot, setSettingsSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let saved: Theme = "light";
    try {
      saved = localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch {}
    setTheme(saved);
    applyTheme(saved);

    const ensureSettingsSlot = () => {
      const settings = document.querySelector<HTMLElement>(".settings");
      if (!settings) {
        setSettingsSlot(null);
        return;
      }

      let slot = settings.querySelector<HTMLElement>(".settings-appearance-slot");
      if (!slot) {
        const links = Array.from(settings.querySelectorAll<HTMLAnchorElement>("a"));
        const legalLink = links.find((link) => /terms|privacy/i.test(link.textContent || ""));

        slot = document.createElement("div");
        slot.className = "settings-appearance-slot";

        if (legalLink?.parentElement) {
          legalLink.parentElement.insertBefore(slot, legalLink);
        } else {
          settings.appendChild(slot);
        }
      }

      setSettingsSlot(slot);
    };

    ensureSettingsSlot();
    const observer = new MutationObserver(ensureSettingsSlot);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      setSettingsSlot(null);
      document.querySelector(".settings-appearance-slot")?.remove();
    };
  }, []);

  function changeTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    window.dispatchEvent(new CustomEvent("gymlog-theme-change", { detail: next }));
  }

  if (!settingsSlot) return null;

  return createPortal(
    <div className="theme-setting-row">
      <div>
        <strong>Appearance</strong>
        <span>Choose how Gym Log looks across the app.</span>
      </div>
      <div className="theme-setting-options" role="group" aria-label="Appearance">
        <button type="button" className={theme === "light" ? "active" : ""} onClick={() => changeTheme("light")} aria-pressed={theme === "light"}>☀ Light</button>
        <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => changeTheme("dark")} aria-pressed={theme === "dark"}>☾ Dark</button>
      </div>
    </div>,
    settingsSlot
  );
}


type ToolTimerKind = "rest" | "stopwatch" | "interval";
type ToolTimerState = {
  kind: ToolTimerKind;
  running: boolean;
  remaining: number;
  elapsed: number;
  endAt: number | null;
  startedAt: number | null;
  phase: "work" | "rest";
  round: number;
  work: number;
  rest: number;
  rounds: number;
  laps: number[];
};

type ToolTimerContextValue = {
  timer: ToolTimerState | null;
  startRest: (seconds: number) => void;
  startStopwatch: () => void;
  lapStopwatch: () => void;
  startInterval: (work: number, rest: number, rounds: number) => void;
  pause: () => void;
  reset: () => void;
  setRest: (seconds: number) => void;
};

const TIMER_STORAGE_KEY = "gym-log-persistent-timer";
const ToolTimerContext = createContext<ToolTimerContextValue | null>(null);

function emptyToolTimer(kind: ToolTimerKind): ToolTimerState {
  return { kind, running: false, remaining: 0, elapsed: 0, endAt: null, startedAt: null, phase: "work", round: 1, work: 40, rest: 20, rounds: 8, laps: [] };
}

function saveToolTimer(timer: ToolTimerState | null) {
  try {
    if (timer) localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
    else localStorage.removeItem(TIMER_STORAGE_KEY);
  } catch {}
}

function liveRemaining(timer: ToolTimerState) {
  if (!timer.running || !timer.endAt) return timer.remaining;
  return Math.max(0, (timer.endAt - Date.now()) / 1000);
}

function PersistentToolTimer({ timer, pause, reset }: { timer: ToolTimerState | null; pause: () => void; reset: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (!timer?.running) return null;

  const route = timer.kind === "rest" ? "/tools/rest-timer" : timer.kind === "stopwatch" ? "/tools/workout-stopwatch" : "/tools/interval-timer";
  if (pathname === route) return null;

  const label = timer.kind === "rest" ? "Rest" : timer.kind === "stopwatch" ? "Workout" : "Interval";
  const display = timer.kind === "stopwatch"
    ? `${Math.floor(timer.elapsed / 60).toString().padStart(2, "0")}:${Math.floor(timer.elapsed % 60).toString().padStart(2, "0")}`
    : `${Math.floor(timer.remaining / 60).toString().padStart(2, "0")}:${Math.floor(timer.remaining % 60).toString().padStart(2, "0")}`;

  return <div className="persistent-tool-timer" data-open={open}>
    {open && <div className="persistent-tool-timer-panel">
      <div className="persistent-tool-timer-label">{label} Timer</div>
      <div className="persistent-tool-timer-display">{display}</div>
      {timer.kind === "interval" && <div className="persistent-tool-timer-meta">{timer.phase === "work" ? "WORK" : "REST"} · Round {Math.min(timer.round, timer.rounds)} / {timer.rounds}</div>}
      <div className="persistent-tool-timer-actions">
        <button onClick={pause}>Pause</button>
        <Link href={route} onClick={() => setOpen(false)}>Open full tool</Link>
        <button onClick={reset}>Reset</button>
      </div>
    </div>}
    <button className="persistent-tool-timer-tab" onClick={() => setOpen(v => !v)} aria-label={open ? "Close running timer" : "Open running timer"}>
      {open ? "›" : "⏱"} <span>{display}</span>
    </button>
  </div>;
}

export function ToolTimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState<ToolTimerState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ToolTimerState;
        if (parsed?.kind) setTimer(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!timer?.running) return;
    const id = window.setInterval(() => {
      setTimer(prev => {
        if (!prev?.running) return prev;

        if (prev.kind === "stopwatch") {
          const elapsed = prev.startedAt ? (Date.now() - prev.startedAt) / 1000 : prev.elapsed;
          return { ...prev, elapsed };
        }

        const left = liveRemaining(prev);
        if (left > 0) return { ...prev, remaining: left };

        if (prev.kind === "rest") return { ...prev, remaining: 0, running: false, endAt: null };

        if (prev.phase === "work" && prev.rest > 0) {
          return { ...prev, phase: "rest", remaining: prev.rest, endAt: Date.now() + prev.rest * 1000 };
        }

        if (prev.round >= prev.rounds) return { ...prev, remaining: 0, running: false, endAt: null };

        return { ...prev, phase: "work", round: prev.round + 1, remaining: prev.work, endAt: Date.now() + prev.work * 1000 };
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [timer?.running, timer?.kind]);

  useEffect(() => { if (timer) saveToolTimer(timer); }, [timer]);

  const value = useMemo<ToolTimerContextValue>(() => ({
    timer,
    startRest(seconds) {
      const s = Math.max(1, Number(seconds) || 1);
      setTimer({ ...emptyToolTimer("rest"), running: true, remaining: s, endAt: Date.now() + s * 1000 });
    },
    startStopwatch() {
      setTimer(prev => {
        const elapsed = prev?.kind === "stopwatch" ? prev.elapsed : 0;
        return { ...emptyToolTimer("stopwatch"), ...(prev?.kind === "stopwatch" ? prev : {}), running: true, elapsed, startedAt: Date.now() - elapsed * 1000 };
      });
    },
    lapStopwatch() {
      setTimer(prev => prev?.kind === "stopwatch" && prev.running ? { ...prev, laps: [...prev.laps, prev.elapsed] } : prev);
    },
    startInterval(work, rest, rounds) {
      const w = Math.max(1, Number(work) || 1);
      const r = Math.max(0, Number(rest) || 0);
      const rs = Math.max(1, Number(rounds) || 1);
      setTimer({ ...emptyToolTimer("interval"), running: true, work: w, rest: r, rounds: rs, remaining: w, endAt: Date.now() + w * 1000 });
    },
    pause() {
      setTimer(prev => {
        if (!prev?.running) return prev;
        if (prev.kind === "stopwatch") {
          const elapsed = prev.startedAt ? (Date.now() - prev.startedAt) / 1000 : prev.elapsed;
          return { ...prev, running: false, elapsed, startedAt: null };
        }
        return { ...prev, running: false, remaining: liveRemaining(prev), endAt: null };
      });
    },
    reset() { setTimer(null); try { localStorage.removeItem(TIMER_STORAGE_KEY); } catch {} },
    setRest(seconds) {
      const s = Math.max(1, Number(seconds) || 1);
      setTimer(prev => ({ ...(prev?.kind === "rest" ? prev : emptyToolTimer("rest")), running: false, remaining: s, endAt: null }));
    },
  }), [timer]);

  return <ToolTimerContext.Provider value={value}>{children}<PersistentToolTimer timer={timer} pause={value.pause} reset={value.reset} /></ToolTimerContext.Provider>;
}

export function useToolTimer() {
  const value = useContext(ToolTimerContext);
  if (!value) throw new Error("useToolTimer must be used inside ToolTimerProvider");
  return value;
}
