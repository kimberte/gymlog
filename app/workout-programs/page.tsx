import type { Metadata } from "next";
import Link from "next/link";
import ProgramLibrary from "./ProgramLibrary";
import { PROGRAMS } from "../lib/programs";

export const metadata: Metadata = {
  title: "100+ Workout Programs & Training Routines | Gym Log",
  description: "Explore a growing library of strength, hypertrophy, powerlifting, bodybuilding, home and conditioning workout programs. Find a routine and track it with Gym Log.",
};

export default function WorkoutProgramsPage() {
  return (
    <main className="programs-page">
      <nav className="programs-nav"><Link href="/" className="programs-brand">Gym Log</Link><Link href="/" className="programs-back">Open Workout Log</Link></nav>
      <section className="programs-hero"><div className="programs-kicker">THE GYM LOG PROGRAM LIBRARY</div><h1>Find a workout program that fits you.</h1><p>Explore {PROGRAMS.length} popular training programs and practical Gym Log templates. Pick a routine, learn how it works, then track your training.</p><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:22}}><Link href="/workout-programs/find" className="programs-back">Find my workout →</Link><Link href="/workout-programs/goal/muscle" className="programs-back" style={{background:"rgba(255,255,255,.08)",color:"inherit"}}>Browse muscle-building programs</Link></div></section>
      <ProgramLibrary programs={PROGRAMS} />
    </main>
  );
}
