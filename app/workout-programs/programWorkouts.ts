import type { Program } from "../lib/programs";
import { SPECIFIC_PROGRAMS } from "./specificPrograms";
import { SPECIFIC_PROGRAMS_2 } from "./specificPrograms2";
import { SPECIFIC_PROGRAMS_3 } from "./specificPrograms3";
import { SPECIFIC_PROGRAMS_4 } from "./specificPrograms4";
import { SPECIFIC_PROGRAMS_5 } from "./specificPrograms5";

export type ProgramWorkout = { day: string; focus: string; exercises: string[]; guidance: string };

const ALL_SPECIFIC_PROGRAMS = { ...SPECIFIC_PROGRAMS, ...SPECIFIC_PROGRAMS_2, ...SPECIFIC_PROGRAMS_3, ...SPECIFIC_PROGRAMS_4, ...SPECIFIC_PROGRAMS_5 };

const strength = [
  ["Squat", "Bench Press", "Barbell Row", "Romanian Deadlift", "Plank"],
  ["Deadlift", "Overhead Press", "Pull-Up or Lat Pulldown", "Bulgarian Split Squat", "Curl"],
  ["Front Squat", "Incline Bench Press", "Seated Cable Row", "Leg Curl", "Triceps Pressdown"],
  ["Squat", "Bench Press", "Barbell Row", "Hip Thrust", "Lateral Raise"],
  ["Deadlift", "Overhead Press", "Chin-Up", "Leg Press", "Calf Raise"],
  ["Bench Press", "Squat", "Chest-Supported Row", "Leg Curl", "Ab Wheel"],
];

const hypertrophy = [
  ["Bench Press", "Incline Dumbbell Press", "Cable Fly", "Lateral Raise", "Triceps Pressdown"],
  ["Lat Pulldown", "Chest-Supported Row", "Seated Cable Row", "Dumbbell Curl", "Hammer Curl"],
  ["Back Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raise"],
  ["Overhead Press", "Machine Chest Press", "Cable Lateral Raise", "Rear Delt Fly", "Overhead Triceps Extension"],
  ["Pull-Up", "One-Arm Dumbbell Row", "Lat Pulldown", "Preacher Curl", "Face Pull"],
  ["Hack Squat", "Hip Thrust", "Leg Extension", "Seated Leg Curl", "Calf Raise"],
];

const home = [
  ["Goblet Squat", "Dumbbell Bench Press", "One-Arm Dumbbell Row", "Romanian Deadlift", "Plank"],
  ["Dumbbell Split Squat", "Dumbbell Overhead Press", "Dumbbell Row", "Dumbbell Curl", "Push-Up"],
  ["Reverse Lunge", "Dumbbell Floor Press", "Band Row", "Dumbbell RDL", "Dead Bug"],
  ["Goblet Squat", "Push-Up", "Dumbbell Row", "Hip Thrust", "Lateral Raise"],
  ["Step-Up", "Dumbbell Shoulder Press", "Band Pulldown", "Single-Leg RDL", "Curl"],
  ["Split Squat", "Dumbbell Press", "Dumbbell Row", "Glute Bridge", "Side Plank"],
];

const bodyweight = [
  ["Push-Up", "Bodyweight Squat", "Inverted Row", "Reverse Lunge", "Plank"],
  ["Pull-Up or Assisted Pull-Up", "Pike Push-Up", "Split Squat", "Glute Bridge", "Hollow Hold"],
  ["Push-Up", "Walking Lunge", "Chin-Up or Row", "Single-Leg Glute Bridge", "Dead Bug"],
  ["Decline Push-Up", "Step-Up", "Pull-Up", "Single-Leg Squat Progression", "Side Plank"],
  ["Dip or Bench Dip", "Bodyweight Row", "Bulgarian Split Squat", "Hip Hinge", "Hanging Knee Raise"],
  ["Push-Up", "Squat", "Pull-Up", "Lunge", "Plank"],
];

function poolFor(program: Program) {
  const text = `${program.name} ${program.category} ${program.equipment}`.toLowerCase();
  if (text.includes("bodyweight") || text.includes("calisthenics") || text.includes("pull-up progression") || text.includes("push-up progression")) return bodyweight;
  if (text.includes("dumbbell") || text.includes("home") || text.includes("minimal equipment") || text.includes("machine")) return text.includes("machine") ? hypertrophy : home;
  if (program.category === "Hypertrophy" || program.category === "Bodybuilding" || program.category === "Powerbuilding") return hypertrophy;
  return strength;
}

function focusFor(program: Program, index: number) {
  const name = program.name.toLowerCase();
  if (name.includes("bench")) return ["Bench strength", "Upper-body volume", "Bench accessories"][index % 3];
  if (name.includes("squat")) return ["Squat strength", "Lower-body volume", "Squat accessories"][index % 3];
  if (name.includes("deadlift") || name.includes("coan") || name.includes("mag/ort")) return ["Deadlift strength", "Posterior chain", "Deadlift accessories"][index % 3];
  if (name.includes("ppl") || name.includes("push pull legs")) return ["Push", "Pull", "Legs", "Upper", "Lower", "Arms"][index % 6];
  if (name.includes("upper") || name.includes("lower")) return index % 2 === 0 ? "Upper body" : "Lower body";
  if (name.includes("bro split") || name.includes("bodybuilding") || name.includes("golden six")) return ["Chest & triceps", "Back & biceps", "Legs", "Shoulders", "Arms"][index % 5];
  if (program.category === "Conditioning") return ["Strength", "Conditioning", "Strength + conditioning", "Athletic work"][index % 4];
  return ["Full body strength", "Upper emphasis", "Lower emphasis", "Full body volume", "Conditioning"][index % 5];
}

export function getProgramWorkouts(program: Program): ProgramWorkout[] {
  const specific = ALL_SPECIFIC_PROGRAMS[program.slug];
  if (specific) return specific.workouts;
  const pool = poolFor(program);
  return Array.from({ length: program.days }, (_, i) => ({
    day: `Day ${i + 1}`,
    focus: focusFor(program, i),
    exercises: pool[i % pool.length],
    guidance: "This is a Gym Log starter template, not an official prescription. Use the original program source for exact sets, reps and progression rules.",
  }));
}

export function getProgramProgression(program: Program) {
  return ALL_SPECIFIC_PROGRAMS[program.slug]?.progression ?? "Use the original program source for exact progression rules. Gym Log provides a practical starter structure for tracking the program.";
}

export function isSpecificProgram(program: Program) {
  return Boolean(ALL_SPECIFIC_PROGRAMS[program.slug]);
}

export function getProgramAccuracyNote(program: Program) {
  return ALL_SPECIFIC_PROGRAMS[program.slug]?.accuracyNote ?? "This is a Gym Log starter template rather than an official program prescription.";
}
