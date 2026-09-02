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
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 56px" }}>
        <Link href="/workout-programs" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>← Back to program library</Link>
        <h1>Program not found</h1>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 940, margin: "0 auto", padding: "28px 20px 56px" }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <Link href={`/workout-programs/${slug}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>← Back to program</Link>
        <Link href="/" style={{ textDecoration: "none", color: "inherit", opacity: 0.8 }}>Gym Log home</Link>
      </div>

      <div className="import-layout">
        <section style={{ borderRadius: 24, padding: "26px 22px", border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))", minWidth: 0 }}>
          <p style={{ margin: 0, color: "var(--accent)", fontWeight: 700 }}>Import program</p>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.08 }}>{name}</h1>
          <p style={{ margin: "14px 0 0", opacity: 0.9, lineHeight: 1.72 }}>{description}</p>

          <div style={{ marginTop: 24 }}>
            <label htmlFor="startDate" style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Choose your start date</label>
            <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: "100%", maxWidth: 280, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
            <p style={{ margin: "12px 0 0", opacity: 0.8, lineHeight: 1.65 }}>Your existing workouts are preserved. New program days are added to open slots on the selected dates.</p>
          </div>

          <button onClick={handleImport} style={{ marginTop: 22, padding: "12px 16px", borderRadius: 14, border: 0, background: "var(--accent)", color: "#111827", fontWeight: 800, cursor: "pointer" }}>Import into Gym Log</button>
          {status ? <p style={{ margin: "14px 0 0", color: "var(--accent)", fontWeight: 600 }}>{status}</p> : null}
        </section>

        <aside style={{ borderRadius: 24, padding: "22px 20px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>What gets imported</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {days.map((day) => (
              <div key={day.name + day.offsetDays} style={{ borderRadius: 16, padding: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontWeight: 700 }}>{day.name}</div>
                <div style={{ marginTop: 4, opacity: 0.78, fontSize: 14, lineHeight: 1.5 }}>{day.focus}</div>
                <div style={{ marginTop: 8, fontSize: 14, opacity: 0.88 }}>{day.exercises.length} exercises • {day.offsetDays === 0 ? "Starts on your chosen date." : `Starts ${day.offsetDays} day${day.offsetDays > 1 ? "s" : ""} later.`}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{` .import-layout { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(280px,.9fr); gap:22px; align-items:start; } @media(max-width:880px){.import-layout{grid-template-columns:1fr;}} `}</style>
    </main>
  );
}
