"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SettingsModal from "../components/SettingsModal";
import { getDayEntries, loadWorkouts } from "../lib/storage";
import { PROGRAMS } from "../lib/programs";
import "./welcome-homepage.css";

type WeekStart = "sunday" | "monday";

function CalendarIcon({ size = 28 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 2v3M17 2v3M4.5 9h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5v12A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-12A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M7.5 13h3M13.5 13h3M7.5 17h3M13.5 17h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function ProgramsIcon({ size = 28 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="16" r="1.1" fill="currentColor"/></svg>; }
function FinderIcon({ size = 28 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.8"/><path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8.5 10.8h4.6M10.8 8.5v4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function ExerciseIcon({ size = 28 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9v6M3.8 10.2v3.6M18 9v6M20.2 10.2v3.6M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function SettingsIcon({ size = 28 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="2" fill="var(--surface,#fff)" stroke="currentColor" strokeWidth="1.8"/><circle cx="15" cy="17" r="2" fill="var(--surface,#fff)" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function BlogIcon({ size = 28 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4.5h14v15H5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }

const actions = [
  { label: "Calendar", href: "/", Icon: CalendarIcon },
  { label: "Workout Programs", href: "/workout-programs", Icon: ProgramsIcon },
  { label: "Workout Finder", href: "/workout-programs/find", Icon: FinderIcon },
  { label: "Exercise List", href: "/exercises", Icon: ExerciseIcon },
  { label: "Settings", Icon: SettingsIcon },
  { label: "Blog", Icon: BlogIcon, soon: true },
];

function dateKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function formatToday(d = new Date()) { return new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(d); }

export default function WelcomePage() {
  const [workouts, setWorkouts] = useState<Record<string, any>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [weekStart, setWeekStart] = useState<WeekStart>("sunday");
  const [toast, setToast] = useState("");
  const [featured, setFeatured] = useState(PROGRAMS[0]);

  useEffect(() => {
    setWorkouts(loadWorkouts());
    try { setWeekStart(localStorage.getItem("gym-log-week-start") === "monday" ? "monday" : "sunday"); } catch {}
    if (PROGRAMS.length) setFeatured(PROGRAMS[Math.floor(Math.random() * PROGRAMS.length)]);
  }, []);

  const today = useMemo(() => dateKey(), []);
  const todayWorkouts = getDayEntries(workouts as any, today);
  const workoutNames = todayWorkouts.map((w: any) => String(w?.title || "").trim()).filter(Boolean);
  const primaryWorkout = workoutNames[0] || "No workout logged yet";
  const workoutCount = todayWorkouts.length;

  function showToast(message: string) { setToast(message); window.setTimeout(() => setToast(""), 1800); }
  function handleSettings() { setSettingsOpen(true); }
  function saveWeekStart(next: WeekStart) { setWeekStart(next); try { localStorage.setItem("gym-log-week-start", next); } catch {} }

  return <main className="welcome-homepage">
    <div className="welcome-home-shell">
      <header className="welcome-home-header">
        <div className="welcome-home-brand"><Image className="welcome-home-logo" src="/icon-192.png" alt="Gym Log" width={42} height={42} priority /><div><strong>Gym Log</strong><span>Your training, organized.</span></div></div>
      </header>

      <section className="welcome-home-actions" aria-label="Gym Log navigation">
        {actions.map(({ label, href, Icon, soon }) => {
          const content = <><span className="welcome-action-icon"><Icon size={29} /></span><span className="welcome-action-label">{label}</span>{soon && <span className="welcome-action-soon">Coming soon</span>}</>;
          if (label === "Settings") return <button key={label} type="button" className="welcome-action-card" onClick={handleSettings}>{content}</button>;
          if (soon) return <button key={label} type="button" className="welcome-action-card welcome-action-disabled" onClick={() => showToast("Blog is coming soon")}>{content}</button>;
          return <Link key={label} href={href!} className="welcome-action-card">{content}</Link>;
        })}
      </section>

      <Link href="/" className="welcome-today-card">
        <div className="welcome-today-top"><span className="welcome-section-kicker">TODAY</span><span className="welcome-open-link">Open calendar →</span></div>
        <div className="welcome-today-date">{formatToday()}</div>
        <div className="welcome-today-workout">{primaryWorkout}</div>
        {workoutCount > 1 && <div className="welcome-today-extra">+ {workoutCount - 1} more workout{workoutCount - 1 === 1 ? "" : "s"}</div>}
        {!workoutCount && <div className="welcome-today-extra">Tap to log today's training</div>}
      </Link>

      {featured && <Link href={`/workout-programs/${featured.slug}`} className="welcome-featured-card">
        <div className="welcome-featured-visual"><span>TRY<br/>SOMETHING NEW</span><div className="welcome-featured-mark">GYM<br/>LOG</div></div>
        <div className="welcome-featured-content"><span className="welcome-section-kicker">TRY SOMETHING NEW</span><h2>{featured.name}</h2><p>{featured.description}</p><div className="welcome-featured-meta"><span>{featured.goal}</span><span>{featured.days} days/week</span><span>{featured.level}</span></div><strong>View program →</strong></div>
      </Link>}

      <p className="welcome-home-footer">Gym Log · Train consistently. Track everything.</p>
    </div>

    {settingsOpen && <SettingsModal workouts={workouts} setWorkouts={setWorkouts} onDataSaved={setWorkouts} onClose={() => setSettingsOpen(false)} toast={showToast} weekStart={weekStart} setWeekStart={saveWeekStart} lastBackupAt={null} />}
    {toast && <div className="welcome-home-toast" role="status">{toast}</div>}
  </main>;
}
