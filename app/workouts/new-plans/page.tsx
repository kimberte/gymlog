import type { Metadata } from "next";
import Link from "next/link";
import NewWorkoutPlans from "./NewWorkoutPlans";

export const metadata: Metadata = {
  title: "New Workout Plans | Gym Log",
  description: "Eight new practical workout plans for 2, 3, 4, 5 and 6 training days per week, with direct Gym Log calendar import.",
  alternates: { canonical: "/workouts/new-plans" },
  openGraph: {
    title: "New Workout Plans | Gym Log",
    description: "New strength, hypertrophy, powerbuilding and schedule-focused workout plans for Gym Log.",
    url: "/workouts/new-plans",
  },
};

export default function NewWorkoutPlansPage() {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 20px 60px" }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <Link href="/workouts" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>← All workout templates</Link>
        <Link href="/" style={{ color: "inherit", textDecoration: "none", opacity: 0.8 }}>Gym Log home</Link>
      </div>
      <section style={{ padding: "30px 24px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))", marginBottom: 26 }}>
        <p style={{ margin: "0 0 10px", color: "var(--accent)", fontWeight: 800 }}>New workout library</p>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.08 }}>More workout plans for real-world schedules</h1>
        <p style={{ margin: "15px 0 0", maxWidth: 820, opacity: 0.9, lineHeight: 1.72 }}>
          Eight new programs focused on practical training schedules, strength plus muscle, time-efficient sessions, specialization, and advanced frequency. Choose a start date and add any plan directly to your Gym Log calendar.
        </p>
      </section>
      <NewWorkoutPlans />
    </main>
  );
}
