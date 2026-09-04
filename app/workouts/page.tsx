import type { Metadata } from "next";
import Link from "next/link";
import ProgramLibrary from "../workout-programs/ProgramLibrary";
import { PROGRAMS } from "../lib/programs";

export const metadata: Metadata = {
  title: "100 Workout Programs & Training Routines | Gym Log",
  description:
    "Explore 100 workout programs for strength, hypertrophy, powerlifting, bodybuilding, home training, conditioning and more. Find a routine and track it with Gym Log.",
  alternates: { canonical: "/workouts" },
  openGraph: {
    title: "100 Workout Programs | Gym Log",
    description: "Browse 100 structured workout programs and import a routine into Gym Log.",
    url: "/workouts",
  },
};

export default function WorkoutsIndexPage() {
  return (
    <main className="programs-page">
      <nav className="programs-nav">
        <Link href="/" className="programs-brand">Gym Log</Link>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
          <Link href="/workout-programs/find" className="programs-back">Find My Program →</Link>
          <Link href="/" className="programs-back">Open Workout Log</Link>
        </div>
      </nav>
      <section className="programs-hero">
        <div className="programs-kicker">THE GYM LOG PROGRAM LIBRARY</div>
        <h1>100 workout programs. One place to find your next routine.</h1>
        <p>
          Browse strength, hypertrophy, powerlifting, bodybuilding, beginner, home, dumbbell, kettlebell and conditioning programs. Search by goal, experience level, equipment or days per week, then open any program and import it into Gym Log.
        </p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:20}}>
          <Link href="/workout-programs/find" className="programs-back">Not sure what to choose? Find my program →</Link>
        </div>
      </section>
      <ProgramLibrary programs={PROGRAMS} />
    </main>
  );
}
