"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSeoTemplateBySlug } from "../../lib/seoWorkoutTemplates";
import { getProgram } from "../../lib/programs";
import { loadWorkouts, saveWorkouts } from "../../lib/storage";

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateString: string, days: number) {
  const d = new Date(`${dateString}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

function fallbackDays(program: NonNullable<ReturnType<typeof getProgram>>) {
  const days = program.days;
  const offsets = Array.from({ length: days }, (_, i) => Math.round((i * 6) / Math.max(days - 1, 1)));
  const category = program.category.toLowerCase();

  if (category.includes("powerlifting")) {
    return offsets.map((offset, i) => ({
      name: `Day ${i + 1}`,
      focus: "Main lift strength and supporting work",
      offsetDays: offset,
      exercises: [
        i % 3 === 0 ? "Back Squat — 3-5 sets" : i % 3 === 1 ? "Bench Press — 3-5 sets" : "Deadlift — 3-5 sets",
        i % 3 === 0 ? "Bench Press — 3-5 sets" : i % 3 === 1 ? "Deadlift — 3-5 sets" : "Back Squat — 3-5 sets",
        "Secondary compound lift — 3 sets",
        "Accessory work — 2-4 sets",
      ],
    }));
  }

  if (category.includes("hypertrophy") || category.includes("bodybuilding") || category.includes("powerbuilding")) {
    const splits = [
      ["Chest Press — 3-4 sets", "Row — 3-4 sets", "Lateral Raise — 3 sets", "Triceps Extension — 2-3 sets", "Biceps Curl — 2-3 sets"],
      ["Back Squat or Leg Press — 3-4 sets", "Romanian Deadlift — 3 sets", "Leg Curl — 3 sets", "Calf Raise — 3 sets", "Core — 2-3 sets"],
      ["Overhead Press — 3-4 sets", "Pull-Up or Lat Pulldown — 3-4 sets", "Incline Press — 3 sets", "Lateral Raise — 3 sets", "Curl — 2-3 sets"],
      ["Deadlift or Hip Hinge — 3 sets", "Leg Press — 3-4 sets", "Leg Curl — 3 sets", "Calf Raise — 3 sets", "Core — 2-3 sets"],
      ["Bench Press — 3-4 sets", "Row — 3-4 sets", "Shoulder Press — 3 sets", "Triceps — 2-3 sets", "Biceps — 2-3 sets"],
      ["Squat — 3-4 sets", "Romanian Deadlift — 3 sets", "Split Squat — 3 sets", "Leg Curl — 3 sets", "Calves — 3 sets"],
    ];
    return offsets.map((offset, i) => ({ name: `Day ${i + 1}`, focus: "Muscle-building training", offsetDays: offset, exercises: splits[i % splits.length] }));
  }

  if (category.includes("home") || category.includes("bodyweight") || category.includes("kettlebell")) {
    const sessions = [
      ["Squat or Goblet Squat — 3 sets", "Push-Up or Press — 3 sets", "Row or Pull-Up — 3 sets", "Hip Hinge — 3 sets", "Core — 2-3 sets"],
      ["Split Squat — 3 sets", "Overhead Press — 3 sets", "Row or Pull-Up — 3 sets", "Glute Bridge — 3 sets", "Plank — 2-3 sets"],
      ["Squat Variation — 3 sets", "Push-Up Variation — 3 sets", "Pull-Up or Row — 3 sets", "Lunge — 3 sets", "Core — 2-3 sets"],
    ];
    return offsets.map((offset, i) => ({ name: `Day ${i + 1}`, focus: "Home-friendly strength and fitness", offsetDays: offset, exercises: sessions[i % sessions.length] }));
  }

  return offsets.map((offset, i) => ({
    name: `Day ${i + 1}`,
    focus: "Full-body strength and fitness",
    offsetDays: offset,
    exercises: ["Squat or Leg Press — 3 sets", "Bench Press or Push-Up — 3 sets", "Row or Pulldown — 3 sets", "Hip Hinge — 3 sets", "Core or Carry — 2-3 sets"],
  }));
}

export default function ImportTemplatePage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || "");
  const template = useMemo(() => getSeoTemplateBySlug(slug), [slug]);
  const program = useMemo(() => getProgram(slug), [slug]);
  const days = template?.days ?? (program ? fallbackDays(program) : []);
  const name = template?.name ?? program?.name ?? "Workout Program";
  const description = template?.shortDescription ?? program?.description ?? "Import this workout program into Gym Log.";
  const [startDate, setStartDate] = useState(() => toDateInputValue(new Date()));
  const [status, setStatus] = useState<string>("");

  function handleImport() {
    if (!days.length) {
      setStatus("Program not found. Please return to the workout library.");
      return;
    }

    try {
      const existing = loadWorkouts();
      const next = { ...(existing || {}) } as Record<string, any>;
      const now = new Date().toISOString();
      const importedDates: string[] = [];

      days.forEach((day, dayIndex) => {
        const date = addDays(startDate, day.offsetDays);
        const current = next[date] && Array.isArray(next[date].entries) ? next[date] : { entries: [] };
        const available = Math.max(0, 3 - current.entries.length);
        if (available === 0) return;

        const entry = {
          id: `program_${Date.now()}_${dayIndex}_${Math.random().toString(16).slice(2)}`,
          title: day.name,
          notes: `${day.focus}\n\n${day.exercises.join("\n")}\n\nImported from Gym Log workout program: ${name}`,
          createdAt: now,
          updatedAt: now,
        };

        next[date] = { ...current, entries: [...current.entries, entry].slice(0, 3) };
        importedDates.push(date);
      });

      saveWorkouts(next);
      localStorage.setItem("gym-log-workouts", JSON.stringify(next));
      localStorage.removeItem("gym-log-template-import-pending");
      setStatus(`Imported ${importedDates.length} workout day${importedDates.length === 1 ? "" : "s"}. Opening Gym Log…`);

      window.setTimeout(() => {
        window.location.href = `/?imported=1&start=${encodeURIComponent(startDate)}`;
      }, 150);
    } catch {
      setStatus("Import failed. Please try again.");
    }
  }

  if (!days.length) {
    return (
      <main className="program-import-page">
        <nav className="programs-nav">
          <Link href="/workout-programs" className="programs-brand">Gym Log</Link>
          <Link href="/" className="programs-back">Open Workout Log</Link>
        </nav>
        <section className="program-import-shell program-import-empty">
          <Link href="/workout-programs" className="program-breadcrumb">← Back to program library</Link>
          <div className="program-detail-kicker">WORKOUT PROGRAM</div>
          <h1>Program not found</h1>
          <p>We couldn't find that workout program. Return to the library to choose another routine.</p>
          <Link href="/workout-programs" className="program-import-primary">Browse workout programs</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="program-import-page">
      <nav className="programs-nav">
        <Link href="/workout-programs" className="programs-brand">Gym Log</Link>
        <Link href="/" className="programs-back">Open Workout Log</Link>
      </nav>

      <section className="program-import-shell">
        <Link href={`/workout-programs/${slug}`} className="program-breadcrumb">← Back to {name}</Link>

        <div className="program-import-hero">
          <div className="program-detail-kicker">START YOUR PROGRAM</div>
          <h1>Track <span>{name}</span> with Gym Log.</h1>
          <p>{description}</p>
        </div>

        <div className="program-import-layout">
          <section className="program-import-card program-import-main-card">
            <div className="program-import-step">1</div>
            <div>
              <h2>Choose your start date</h2>
              <p className="program-import-muted">We'll place the program into your Gym Log calendar starting on this date.</p>
            </div>

            <label htmlFor="startDate" className="program-import-label">Program start</label>
            <input id="startDate" className="program-import-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

            <div className="program-import-callout">
              <span className="program-import-check">✓</span>
              <div><strong>Your existing workouts stay safe.</strong><span>New sessions are added only where there is an open slot.</span></div>
            </div>

            <button onClick={handleImport} className="program-import-primary">Import into Gym Log <span>→</span></button>
            {status ? <p className="program-import-status">{status}</p> : null}
          </section>

          <aside className="program-import-card program-import-preview">
            <div className="program-import-step">2</div>
            <div>
              <h2>Here's what you'll get</h2>
              <p className="program-import-muted">{days.length} training day{days.length === 1 ? "" : "s"} ready to add to your calendar.</p>
            </div>

            <div className="program-import-days">
              {days.map((day, index) => (
                <div key={day.name + day.offsetDays} className="program-import-day">
                  <div className="program-import-day-number">{index + 1}</div>
                  <div className="program-import-day-copy">
                    <strong>{day.name}</strong>
                    <span>{day.focus}</span>
                    <small>{day.exercises.length} exercises · {day.offsetDays === 0 ? "Starts on your chosen date" : `${day.offsetDays} day${day.offsetDays > 1 ? "s" : ""} later`}</small>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="program-import-footer">
          <span>Gym Log workout library</span>
          <span>•</span>
          <span>Track it. Progress. Repeat.</span>
        </div>
      </section>
    </main>
  );
}
