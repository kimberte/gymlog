"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Plan = {
  slug: string;
  name: string;
  description: string;
  frequency: string;
  level: string;
  equipment: string;
  days: Array<{ name: string; offset: number; focus: string; exercises: string[] }>;
};

const PLANS: Plan[] = [
  {
    slug: "2-day-full-body-strength-muscle",
    name: "2-Day Full Body Strength & Muscle",
    description: "A practical two-day full-body program for busy lifters who want strength and muscle without needing a five-day schedule.",
    frequency: "2 days/week",
    level: "Beginner to Intermediate",
    equipment: "Barbell, dumbbells, bench, basic machines",
    days: [
      { name: "Full Body A", offset: 0, focus: "Squat, horizontal press, row and posterior chain", exercises: ["Back Squat — 3 x 5-8", "Bench Press — 3 x 5-8", "Chest-Supported Row — 3 x 8-12", "Romanian Deadlift — 3 x 8-10", "Lateral Raise — 2 x 12-15", "Dumbbell Curl — 2 x 10-15"] },
      { name: "Full Body B", offset: 3, focus: "Hinge, vertical press, pull and single-leg work", exercises: ["Deadlift — 2 x 4-6", "Overhead Press — 3 x 5-8", "Lat Pulldown or Pull-Up — 3 x 6-10", "Leg Press — 3 x 8-12", "Incline Dumbbell Press — 2 x 8-12", "Cable Triceps Pressdown — 2 x 10-15"] },
    ],
  },
  {
    slug: "3-day-powerbuilding",
    name: "3-Day Powerbuilding",
    description: "Three focused sessions combining heavy compound lifting with enough accessory volume to build muscle.",
    frequency: "3 days/week",
    level: "Intermediate",
    equipment: "Barbell, rack, bench, dumbbells, cable or machines",
    days: [
      { name: "Squat + Chest", offset: 0, focus: "Heavy squat and pressing with upper-body accessories", exercises: ["Back Squat — 4 x 4-6", "Bench Press — 4 x 4-6", "Incline Dumbbell Press — 3 x 8-12", "Leg Curl — 3 x 10-15", "Lateral Raise — 3 x 12-15", "Triceps Pressdown — 2 x 10-15"] },
      { name: "Deadlift + Back", offset: 2, focus: "Heavy hinge and back-building work", exercises: ["Deadlift — 3 x 3-5", "Barbell Row — 4 x 5-8", "Pull-Up or Lat Pulldown — 3 x 6-10", "Romanian Deadlift — 2 x 8-10", "Face Pull — 3 x 12-15", "Dumbbell Curl — 3 x 10-12"] },
      { name: "Bench + Full Body", offset: 4, focus: "Bench priority with moderate lower-body volume", exercises: ["Bench Press — 4 x 3-6", "Front Squat or Leg Press — 3 x 6-10", "Overhead Press — 3 x 6-8", "Chest-Supported Row — 3 x 8-12", "Calf Raise — 3 x 12-20", "Cable Curl — 2 x 10-15"] },
    ],
  },
  {
    slug: "3-day-full-body-hypertrophy",
    name: "3-Day Full Body Hypertrophy",
    description: "An intermediate muscle-building plan that trains every major muscle group three times per week with manageable volume.",
    frequency: "3 days/week",
    level: "Intermediate",
    equipment: "Barbell, dumbbells, cables and machines",
    days: [
      { name: "Full Body A", offset: 0, focus: "Quad and chest emphasis", exercises: ["Hack Squat or Leg Press — 3 x 8-12", "Bench Press — 3 x 6-10", "Lat Pulldown — 3 x 8-12", "Leg Curl — 2 x 10-15", "Lateral Raise — 3 x 12-20", "Cable Curl — 2 x 10-15"] },
      { name: "Full Body B", offset: 2, focus: "Posterior chain and back emphasis", exercises: ["Romanian Deadlift — 3 x 6-10", "Incline Dumbbell Press — 3 x 8-12", "Chest-Supported Row — 3 x 8-12", "Bulgarian Split Squat — 3 x 8-12", "Rear Delt Fly — 3 x 12-20", "Triceps Extension — 2 x 10-15"] },
      { name: "Full Body C", offset: 4, focus: "Balanced hypertrophy with shoulder and arm work", exercises: ["Squat — 3 x 6-10", "Machine Chest Press — 3 x 8-12", "Cable Row — 3 x 8-12", "Leg Extension — 2 x 12-15", "Lateral Raise — 3 x 12-20", "Curl + Pressdown — 2 x 10-15 each"] },
    ],
  },
  {
    slug: "3-day-minimalist-45-minute",
    name: "3-Day Minimalist 45-Minute Workout",
    description: "A time-efficient program built around the highest-value movements for lifters who need to keep sessions short.",
    frequency: "3 days/week",
    level: "Beginner to Intermediate",
    equipment: "Barbell, dumbbells, bench and basic gym equipment",
    days: [
      { name: "45-Minute A", offset: 0, focus: "Squat, press and pull", exercises: ["Squat — 3 x 5-8", "Bench Press — 3 x 5-8", "Row — 3 x 8-10", "Romanian Deadlift — 2 x 8-10", "Lateral Raise — 2 x 12-15"] },
      { name: "45-Minute B", offset: 2, focus: "Hinge, press and pull", exercises: ["Deadlift — 2 x 4-6", "Overhead Press — 3 x 5-8", "Pull-Up or Pulldown — 3 x 6-10", "Leg Press — 3 x 8-12", "Curl — 2 x 10-15"] },
      { name: "45-Minute C", offset: 4, focus: "Full-body repeat with efficient accessories", exercises: ["Front Squat — 3 x 6-8", "Incline Dumbbell Press — 3 x 8-10", "Cable Row — 3 x 8-12", "Leg Curl — 2 x 10-15", "Triceps Pressdown — 2 x 10-15"] },
    ],
  },
  {
    slug: "4-day-strength-hypertrophy",
    name: "4-Day Strength & Hypertrophy",
    description: "A balanced four-day program for lifters who want measurable strength progress without giving up bodybuilding-style volume.",
    frequency: "4 days/week",
    level: "Intermediate",
    equipment: "Full gym or well-equipped home gym",
    days: [
      { name: "Upper Strength", offset: 0, focus: "Heavy bench, row and overhead work", exercises: ["Bench Press — 4 x 4-6", "Barbell Row — 4 x 5-8", "Overhead Press — 3 x 5-8", "Pull-Up — 3 x 6-10", "Curl — 2 x 10-12"] },
      { name: "Lower Strength", offset: 1, focus: "Heavy squat and hinge work", exercises: ["Back Squat — 4 x 4-6", "Romanian Deadlift — 3 x 6-8", "Leg Press — 3 x 8-10", "Leg Curl — 2 x 10-12", "Calf Raise — 3 x 10-15"] },
      { name: "Upper Hypertrophy", offset: 3, focus: "Chest, back, shoulders and arms", exercises: ["Incline Dumbbell Press — 3 x 8-12", "Lat Pulldown — 3 x 8-12", "Machine Chest Press — 3 x 10-12", "Cable Row — 3 x 10-12", "Lateral Raise — 3 x 12-20", "Curl + Pressdown — 2 x 10-15 each"] },
      { name: "Lower Hypertrophy", offset: 4, focus: "Leg volume with manageable fatigue", exercises: ["Hack Squat — 3 x 8-12", "Hip Thrust — 3 x 8-12", "Leg Extension — 3 x 12-15", "Leg Curl — 3 x 10-15", "Calf Raise — 3 x 12-20"] },
    ],
  },
  {
    slug: "4-day-chest-back-focus",
    name: "4-Day Chest & Back Focus",
    description: "A specialization split that prioritizes chest and back while maintaining the rest of the body with efficient lower-body sessions.",
    frequency: "4 days/week",
    level: "Intermediate",
    equipment: "Full gym or well-equipped home gym",
    days: [
      { name: "Chest + Back A", offset: 0, focus: "Heavy horizontal pressing and rowing", exercises: ["Bench Press — 4 x 5-8", "Barbell Row — 4 x 6-8", "Incline Dumbbell Press — 3 x 8-12", "Pull-Up — 3 x 6-10", "Cable Fly — 2 x 12-15", "Face Pull — 2 x 12-20"] },
      { name: "Legs A", offset: 1, focus: "Lower-body maintenance and strength", exercises: ["Back Squat — 4 x 5-8", "Romanian Deadlift — 3 x 8-10", "Leg Press — 3 x 10-12", "Leg Curl — 3 x 10-15", "Calf Raise — 3 x 12-20"] },
      { name: "Chest + Back B", offset: 3, focus: "Hypertrophy-focused upper specialization", exercises: ["Incline Bench Press — 4 x 6-10", "Chest-Supported Row — 4 x 8-12", "Machine Chest Press — 3 x 10-12", "Lat Pulldown — 3 x 8-12", "Cable Fly — 2 x 12-15", "Rear Delt Fly — 2 x 15-20"] },
      { name: "Legs B + Arms", offset: 4, focus: "Lower body plus short arm session", exercises: ["Front Squat — 3 x 6-10", "Hip Thrust — 3 x 8-12", "Leg Extension — 3 x 12-15", "Leg Curl — 3 x 10-15", "Curl — 3 x 10-15", "Triceps Pressdown — 3 x 10-15"] },
    ],
  },
  {
    slug: "5-day-upper-lower-arms",
    name: "5-Day Upper Lower + Arms",
    description: "A five-day hypertrophy split that keeps upper/lower frequency high and gives arms their own dedicated growth session.",
    frequency: "5 days/week",
    level: "Intermediate",
    equipment: "Full gym",
    days: [
      { name: "Upper", offset: 0, focus: "Balanced upper-body compounds", exercises: ["Bench Press — 3 x 5-8", "Row — 3 x 6-10", "Overhead Press — 3 x 6-10", "Lat Pulldown — 3 x 8-12", "Lateral Raise — 3 x 12-20"] },
      { name: "Lower", offset: 1, focus: "Squat and posterior chain", exercises: ["Back Squat — 4 x 5-8", "Romanian Deadlift — 3 x 6-10", "Leg Press — 3 x 8-12", "Leg Curl — 3 x 10-15", "Calf Raise — 3 x 12-20"] },
      { name: "Upper Hypertrophy", offset: 2, focus: "Higher-rep chest and back volume", exercises: ["Incline Dumbbell Press — 3 x 8-12", "Cable Row — 3 x 8-12", "Machine Chest Press — 3 x 10-12", "Lat Pulldown — 3 x 10-12", "Lateral Raise — 3 x 15-20"] },
      { name: "Lower Hypertrophy", offset: 4, focus: "Quad and hamstring volume", exercises: ["Hack Squat — 3 x 8-12", "Hip Thrust — 3 x 8-12", "Leg Extension — 3 x 12-15", "Leg Curl — 3 x 10-15", "Calf Raise — 3 x 12-20"] },
      { name: "Arms + Delts", offset: 5, focus: "Dedicated biceps, triceps and shoulder work", exercises: ["EZ-Bar Curl — 3 x 8-12", "Cable Triceps Extension — 3 x 8-12", "Incline Dumbbell Curl — 3 x 10-15", "Triceps Pressdown — 3 x 10-15", "Lateral Raise — 4 x 12-20", "Rear Delt Fly — 3 x 15-20"] },
    ],
  },
  {
    slug: "6-day-push-pull-legs",
    name: "6-Day Push Pull Legs",
    description: "An advanced PPL split run twice per week, with a heavier first rotation and more hypertrophy-focused second rotation.",
    frequency: "6 days/week",
    level: "Intermediate",
    equipment: "Full gym",
    days: [
      { name: "Push A", offset: 0, focus: "Heavy chest and shoulder pressing", exercises: ["Bench Press — 4 x 4-6", "Overhead Press — 3 x 5-8", "Incline Dumbbell Press — 3 x 8-10", "Lateral Raise — 3 x 12-20", "Triceps Pressdown — 3 x 10-15"] },
      { name: "Pull A", offset: 1, focus: "Heavy back and biceps", exercises: ["Deadlift — 3 x 3-5", "Pull-Up — 3 x 6-10", "Barbell Row — 3 x 6-8", "Face Pull — 3 x 12-15", "Curl — 3 x 10-12"] },
      { name: "Legs A", offset: 2, focus: "Heavy lower body", exercises: ["Back Squat — 4 x 4-6", "Romanian Deadlift — 3 x 6-8", "Leg Press — 3 x 8-10", "Leg Curl — 2 x 10-15", "Calf Raise — 3 x 12-20"] },
      { name: "Push B", offset: 4, focus: "Higher-rep chest, shoulders and triceps", exercises: ["Incline Bench Press — 3 x 6-10", "Machine Chest Press — 3 x 8-12", "Seated Dumbbell Press — 3 x 8-12", "Lateral Raise — 4 x 12-20", "Overhead Triceps Extension — 3 x 10-15"] },
      { name: "Pull B", offset: 5, focus: "Hypertrophy-focused back and arms", exercises: ["Lat Pulldown — 3 x 8-12", "Chest-Supported Row — 3 x 8-12", "Cable Row — 3 x 10-12", "Rear Delt Fly — 3 x 15-20", "Incline Curl — 3 x 10-15"] },
      { name: "Legs B", offset: 6, focus: "Higher-rep leg volume", exercises: ["Hack Squat — 3 x 8-12", "Hip Thrust — 3 x 8-12", "Bulgarian Split Squat — 3 x 8-12", "Leg Extension — 3 x 12-15", "Leg Curl — 3 x 10-15", "Calf Raise — 3 x 12-20"] },
    ],
  },
];

function addDays(startDate: string, offset: number) {
  const date = new Date(`${startDate}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function NewWorkoutPlans() {
  const [startDates, setStartDates] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function importPlan(plan: Plan) {
    const start = startDates[plan.slug] || today;
    try {
      const key = "gym-log-workouts";
      const raw = localStorage.getItem(key);
      const workouts = raw ? JSON.parse(raw) : {};
      for (const day of plan.days) {
        const date = addDays(start, day.offset);
        const existing = workouts[date]?.entries || [];
        const entry = {
          id: `template_${plan.slug}_${Date.now()}_${day.offset}`,
          title: `${plan.name} — ${day.name}`,
          notes: `${day.focus}\n\n${day.exercises.join("\n")}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        workouts[date] = { ...(workouts[date] || {}), entries: [...existing, entry].slice(0, 3) };
      }
      localStorage.setItem(key, JSON.stringify(workouts));
      setStatus(`${plan.name} was added to your calendar starting ${start}.`);
    } catch {
      setStatus("Could not import this plan. Please try again.");
    }
  }

  return (
    <div>
      <div style={{ display: "grid", gap: 18 }}>
        {PLANS.map((plan) => (
          <article key={plan.slug} style={{ borderRadius: 20, padding: 20, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24 }}>{plan.name}</h2>
                <p style={{ margin: "8px 0 0", opacity: 0.86, lineHeight: 1.6 }}>{plan.description}</p>
              </div>
              <span style={{ padding: "7px 11px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", fontSize: 13 }}>{plan.frequency}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, fontSize: 13, opacity: 0.8 }}>
              <span>{plan.level}</span><span>•</span><span>{plan.equipment}</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <button onClick={() => setExpanded(expanded === plan.slug ? null : plan.slug)} style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "inherit", cursor: "pointer", fontWeight: 700 }}>
                {expanded === plan.slug ? "Hide workouts" : "View workouts"}
              </button>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                Start
                <input type="date" value={startDates[plan.slug] || today} onChange={(e) => setStartDates((v) => ({ ...v, [plan.slug]: e.target.value }))} style={{ padding: "9px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
              </label>
              <button onClick={() => importPlan(plan)} style={{ padding: "10px 14px", borderRadius: 12, border: 0, background: "var(--accent)", color: "#111827", cursor: "pointer", fontWeight: 800 }}>
                Add to Gym Log
              </button>
            </div>
            {expanded === plan.slug ? (
              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {plan.days.map((day) => (
                  <div key={day.name} style={{ borderRadius: 16, padding: 16, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <h3 style={{ margin: 0, fontSize: 19 }}>{day.name}</h3>
                    <p style={{ margin: "5px 0 0", opacity: 0.75 }}>{day.focus}</p>
                    <ul style={{ margin: "10px 0 0", paddingLeft: 20, lineHeight: 1.7 }}>{day.exercises.map((exercise) => <li key={exercise}>{exercise}</li>)}</ul>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {status ? <p style={{ marginTop: 18, color: "var(--accent)", fontWeight: 700 }}>{status}</p> : null}
      <div style={{ marginTop: 28 }}><Link href="/" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>Open Gym Log →</Link></div>
    </div>
  );
}
