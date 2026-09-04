import type { Metadata } from "next";
import Link from "next/link";
import ProgramLibrary from "./ProgramLibrary";
import { PROGRAMS } from "../lib/programs";

export const metadata: Metadata = {
  title: "100+ Workout Programs & Training Routines | Gym Log",
  description: "Explore 100+ workout programs for strength, muscle building, hypertrophy, powerlifting, bodybuilding, home training and conditioning. Find a routine and track it with Gym Log.",
};

const browseLinks = [
  ["/workout-programs/goal/muscle", "Muscle building"],
  ["/workout-programs/goal/strength", "Strength"],
  ["/workout-programs/goal/beginners", "Beginner programs"],
  ["/workout-programs/goal/powerlifting", "Powerlifting"],
  ["/workout-programs/goal/home", "Home workouts"],
  ["/workout-programs/goal/3-day", "3-day programs"],
  ["/workout-programs/goal/4-day", "4-day programs"],
  ["/workout-programs/goal/5-day", "5-day programs"],
  ["/workout-programs/goal/6-day", "6-day programs"],
  ["/workout-programs/goal/dumbbells", "Dumbbell programs"],
  ["/workout-programs/goal/full-body", "Full-body programs"],
  ["/workout-programs/goal/hypertrophy", "Hypertrophy programs"],
];

export default function WorkoutProgramsPage() {
  return (
    <main className="programs-page">
      <nav className="programs-nav"><Link href="/" className="programs-brand">Gym Log</Link><Link href="/" className="programs-back">Open Workout Log</Link></nav>
      <section className="programs-hero">
        <div className="programs-kicker">THE GYM LOG PROGRAM LIBRARY</div>
        <h1>Find a workout program that fits you.</h1>
        <p>Explore {PROGRAMS.length} workout programs and practical Gym Log templates. Pick a routine, learn how it works, then track your training.</p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:22}}><Link href="/workout-programs/find" className="programs-back">Find my workout →</Link><Link href="/workout-programs/goal/muscle" className="programs-back" style={{background:"rgba(255,255,255,.08)",color:"inherit"}}>Browse muscle-building programs</Link></div>
      </section>
      <section className="program-browse-links" aria-labelledby="browse-heading"><div className="program-detail-kicker">BROWSE BY GOAL & TRAINING STYLE</div><h2 id="browse-heading">Workout program guides</h2><p>Jump directly to programs for a specific goal, schedule or equipment setup.</p><div className="program-browse-grid">{browseLinks.map(([href,label]) => <Link href={href} key={href}>{label}<span>→</span></Link>)}</div></section>
      <ProgramLibrary programs={PROGRAMS} />
    </main>
  );
}
