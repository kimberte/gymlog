import type { Metadata } from "next";
import Link from "next/link";
import WorkoutFinder from "../WorkoutFinder";
import { PROGRAM_METADATA } from "../programMetadata";

export const metadata: Metadata = {
  title: "Find the Best Workout Program for You | Gym Log",
  description: "Answer a few questions about your goal, experience, schedule and equipment to find workout programs that fit you.",
  alternates: { canonical: "/workout-programs/find" },
};

export default function FindWorkoutPage() {
  return <main className="programs-page"><nav className="programs-nav"><Link href="/" className="programs-brand">Gym Log</Link><Link href="/workout-programs" className="programs-back">Browse programs</Link></nav><section className="programs-hero"><div className="programs-kicker">FIND YOUR PROGRAM</div><h1>Which workout program is right for you?</h1><p>Tell us what you're training for, how much experience you have and what your week looks like. We'll rank the best matches from our workout program library.</p></section><WorkoutFinder programs={PROGRAM_METADATA}/></main>;
}
