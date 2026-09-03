import type { ProgramWorkout } from "./programWorkouts";

export type SpecificProgram7 = { workouts: ProgramWorkout[]; progression: string; accuracyNote: string };
const w = (day: string, focus: string, exercises: string[], guidance: string): ProgramWorkout => ({ day, focus, exercises, guidance });

export const SPECIFIC_PROGRAMS_7: Record<string, SpecificProgram7> = {
  "6-day-ppl-hypertrophy": {
    workouts: [
      w("Day 1", "Push A", ["Bench Press — 3–4 sets", "Incline Dumbbell Press — 3 sets", "Cable Fly — 2–3 sets", "Lateral Raise — 3–4 sets", "Triceps Pressdown — 3 sets"], "Moderate-to-high hypertrophy volume with controlled reps."),
      w("Day 2", "Pull A", ["Pull-Up or Lat Pulldown — 3–4 sets", "Chest-Supported Row — 3–4 sets", "Cable Row — 2–3 sets", "Rear Delt Fly — 3 sets", "Curl — 3 sets"], "Use stable pulling movements and accumulate quality back volume."),
      w("Day 3", "Legs A", ["Back Squat — 3–4 sets", "Romanian Deadlift — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Calf Raise — 3–4 sets"], "Balance compound work with direct hamstring and calf volume."),
      w("Day 4", "Push B", ["Incline Press — 3–4 sets", "Machine Chest Press — 3 sets", "Cable Fly — 2–3 sets", "Lateral Raise — 4 sets", "Overhead Triceps Extension — 3 sets"], "Use different angles from Push A while keeping total weekly volume recoverable."),
      w("Day 5", "Pull B", ["Lat Pulldown — 3–4 sets", "One-Arm Row — 3 sets", "Chest-Supported Row — 3 sets", "Face Pull or Rear Delt Fly — 3 sets", "Hammer Curl — 3 sets"], "Emphasize a full range of vertical and horizontal pulling patterns."),
      w("Day 6", "Legs B", ["Hack Squat or Front Squat — 3–4 sets", "Hip Thrust — 3 sets", "Leg Extension — 3 sets", "Seated Leg Curl — 3 sets", "Calf Raise — 4 sets"], "Finish the week with quad, glute and hamstring hypertrophy work."),
    ],
    progression: "Use rep-range progression: add repetitions within the target range, then make a small load increase while preserving technique. Adjust volume when recovery or performance declines.",
    accuracyNote: "This is a Gym Log 6-day PPL hypertrophy template, not a single author's canonical prescription."
  },
  "4-day-upper-lower-hypertrophy": {
    workouts: [
      w("Day 1", "Upper A", ["Bench Press — 3–4 sets", "Chest-Supported Row — 3–4 sets", "Incline Dumbbell Press — 3 sets", "Lat Pulldown — 3 sets", "Lateral Raise — 3 sets", "Arms — 2–3 sets each"], "Combine major push and pull patterns with moderate accessory volume."),
      w("Day 2", "Lower A", ["Back Squat — 3–4 sets", "Romanian Deadlift — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Calves — 3–4 sets"], "Prioritize compounds early, then use stable machines for additional volume."),
      w("Day 3", "Upper B", ["Overhead Press — 3 sets", "Pull-Up or Pulldown — 3–4 sets", "Machine Chest Press — 3 sets", "Cable Row — 3–4 sets", "Lateral Raise — 3–4 sets", "Arms — 3 sets each"], "Change exercise angles while keeping weekly muscle exposure consistent."),
      w("Day 4", "Lower B", ["Hack Squat — 3–4 sets", "Hip Thrust — 3 sets", "Leg Extension — 3 sets", "Seated Leg Curl — 3 sets", "Calves — 4 sets", "Abs — 3 sets"], "Use the second lower session to complement rather than duplicate Day 2."),
    ],
    progression: "Progress most exercises through a rep range, adding load after the top of the range is reached with good form. Keep weekly volume appropriate to recovery.",
    accuracyNote: "Upper/Lower Hypertrophy is a broad training category; this is a Gym Log template rather than one canonical routine."
  },
  "full-body-hypertrophy-3-day": {
    workouts: [
      w("Day 1", "Full body A", ["Squat — 3 sets", "Bench Press — 3 sets", "Lat Pulldown — 3 sets", "Romanian Deadlift — 2–3 sets", "Lateral Raise — 3 sets", "Curl — 2 sets"], "Train each major movement pattern without excessive single-session volume."),
      w("Day 2", "Full body B", ["Leg Press — 3 sets", "Incline Dumbbell Press — 3 sets", "Cable Row — 3 sets", "Leg Curl — 3 sets", "Overhead Press — 2–3 sets", "Triceps — 2 sets"], "Use different movements while maintaining full-body frequency."),
      w("Day 3", "Full body C", ["Hack Squat — 3 sets", "Machine Chest Press — 3 sets", "Pull-Up or Pulldown — 3 sets", "Hip Thrust — 3 sets", "Lateral Raise — 3 sets", "Curl + Triceps — 2 sets each"], "Finish the week with balanced hypertrophy volume and manageable fatigue."),
    ],
    progression: "Add reps within practical hypertrophy ranges before adding load. Keep 1–3 quality reps in reserve on most work and adjust volume to recovery.",
    accuracyNote: "Full Body Hypertrophy 3-Day is a Gym Log category template, not a single standardized published program."
  },
  "full-body-hypertrophy-4-day": {
    workouts: [
      w("Day 1", "Full body A", ["Squat — 3 sets", "Bench Press — 3 sets", "Row — 3 sets", "Leg Curl — 3 sets", "Lateral Raise — 3 sets"], "Moderate volume across the whole body."),
      w("Day 2", "Full body B", ["Romanian Deadlift — 3 sets", "Incline Press — 3 sets", "Pulldown — 3 sets", "Leg Extension — 3 sets", "Curl — 3 sets"], "Use a posterior-chain emphasis while still training the upper body."),
      w("Day 3", "Full body C", ["Hack Squat — 3 sets", "Overhead Press — 3 sets", "Chest-Supported Row — 3 sets", "Hip Thrust — 3 sets", "Triceps — 3 sets"], "Keep exercise selection stable enough to measure progression."),
      w("Day 4", "Full body D", ["Leg Press — 3 sets", "Machine Chest Press — 3 sets", "Lat Pulldown — 3 sets", "Seated Leg Curl — 3 sets", "Lateral Raise — 3 sets", "Arms — 2 sets each"], "Use stable machine and cable work to accumulate quality volume."),
    ],
    progression: "Progress via rep-range or double progression, then make small load increases. A four-day schedule allows frequent exposures without requiring extreme per-session volume.",
    accuracyNote: "Full Body Hypertrophy 4-Day is a Gym Log template category rather than one canonical routine."
  },
  "dumbbell-hypertrophy": {
    workouts: [
      w("Day 1", "Upper A", ["Dumbbell Bench Press — 3–4 sets", "One-Arm Dumbbell Row — 3–4 sets", "Incline Dumbbell Press — 3 sets", "Dumbbell Lateral Raise — 3 sets", "Dumbbell Curl — 3 sets", "Overhead Triceps Extension — 3 sets"], "Use dumbbell stability demands to your advantage while keeping reps controlled."),
      w("Day 2", "Lower A", ["Goblet or Double-Dumbbell Squat — 3–4 sets", "Dumbbell Romanian Deadlift — 3 sets", "Bulgarian Split Squat — 3 sets", "Dumbbell Step-Up — 2–3 sets", "Calf Raise — 3 sets"], "Unilateral work helps create sufficient lower-body stimulus with dumbbells."),
      w("Day 3", "Upper B", ["Dumbbell Shoulder Press — 3 sets", "Chest-Supported Dumbbell Row — 3–4 sets", "Dumbbell Floor or Incline Press — 3 sets", "Rear Delt Raise — 3 sets", "Hammer Curl — 3 sets", "Triceps Extension — 3 sets"], "Choose angles that remain comfortable as loads progress."),
      w("Day 4", "Lower B", ["Dumbbell Front-Foot Elevated Split Squat — 3 sets", "Dumbbell RDL — 3 sets", "Reverse Lunge — 3 sets", "Dumbbell Hip Thrust — 3 sets", "Calf Raise — 4 sets"], "Use controlled unilateral and hinge work to make limited loading productive."),
    ],
    progression: "Progress by adding reps, then load when available. If dumbbell jumps are large, use tempo, pauses or additional reps before increasing weight.",
    accuracyNote: "Dumbbell Hypertrophy Program is a Gym Log template for dumbbell-only training, not a canonical published routine."
  },
  "machine-hypertrophy": {
    workouts: [
      w("Day 1", "Upper A", ["Machine Chest Press — 3–4 sets", "Lat Pulldown — 3–4 sets", "Machine Row — 3 sets", "Machine Shoulder Press — 3 sets", "Lateral Raise Machine — 3 sets", "Curl Machine — 3 sets"], "Stable machines can make it easier to focus on the target muscle and track load."),
      w("Day 2", "Lower A", ["Hack Squat — 3–4 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Leg Extension — 3 sets", "Calf Machine — 4 sets"], "Use controlled ranges and avoid turning every set into a maximal effort."),
      w("Day 3", "Upper B", ["Incline Machine Press — 3 sets", "Chest-Supported Row Machine — 3–4 sets", "Pullover Machine — 3 sets", "Reverse Pec Deck — 3 sets", "Lateral Raise — 3 sets", "Triceps Machine — 3 sets"], "Use machine variations to complement Day 1 movement patterns."),
      w("Day 4", "Lower B", ["Pendulum or Hack Squat — 3 sets", "Hip Thrust Machine — 3 sets", "Leg Extension — 3 sets", "Seated Leg Curl — 3 sets", "Calf Machine — 4 sets", "Abs Machine — 3 sets"], "Prioritize stable execution and a repeatable range of motion."),
    ],
    progression: "Track load and reps for each machine. Add reps within the chosen range before increasing the stack or plate load; machines differ, so prioritize repeatability.",
    accuracyNote: "Machine Hypertrophy Program is a Gym Log equipment-based template, not one canonical published program."
  },
  "minimalist-hypertrophy": {
    workouts: [
      w("Day 1", "Full body A", ["Squat — 3 sets", "Bench Press — 3 sets", "Row — 3 sets", "Romanian Deadlift — 2 sets", "Lateral Raise — 2 sets"], "Keep exercise count low and focus on high-quality work."),
      w("Day 2", "Full body B", ["Deadlift — 2–3 sets", "Overhead Press — 3 sets", "Pull-Up or Pulldown — 3 sets", "Split Squat — 3 sets", "Curl or Triceps — 2 sets"], "Use a small number of movements that cover the major patterns."),
      w("Day 3", "Full body C", ["Front Squat or Leg Press — 3 sets", "Incline Press — 3 sets", "Chest-Supported Row — 3 sets", "Hip Thrust — 2–3 sets", "Lateral Raise — 2 sets"], "Minimalist training succeeds through consistency and progression rather than exercise variety."),
    ],
    progression: "Prioritize progression on a small exercise menu. Add reps or small load increases while avoiding unnecessary volume that compromises recovery.",
    accuracyNote: "Minimalist Hypertrophy is a Gym Log category template; there is no single universally accepted minimalist hypertrophy prescription."
  },
  "5-day-bro-split": {
    workouts: [
      w("Day 1", "Chest", ["Bench Press — 3–4 sets", "Incline Dumbbell Press — 3 sets", "Machine Press — 3 sets", "Cable Fly — 3 sets", "Optional Triceps — 2 sets"], "Chest-focused volume with a mix of presses and isolation."),
      w("Day 2", "Back", ["Pull-Up or Pulldown — 3–4 sets", "Barbell or Machine Row — 3–4 sets", "Chest-Supported Row — 3 sets", "Pullover — 2–3 sets", "Curl — 2–3 sets"], "Combine vertical and horizontal pulling."),
      w("Day 3", "Legs", ["Squat or Hack Squat — 3–4 sets", "Romanian Deadlift — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Calves — 4 sets"], "Build the session around one major knee-dominant and one hip-dominant movement."),
      w("Day 4", "Shoulders", ["Overhead Press — 3 sets", "Lateral Raise — 4 sets", "Rear Delt Fly — 3 sets", "Cable Lateral Raise — 3 sets", "Optional Shrug — 3 sets"], "Keep direct delt work productive without excessive joint fatigue."),
      w("Day 5", "Arms", ["Close-Grip Press or Dip — 3 sets", "Curl — 3 sets", "Triceps Pressdown — 3 sets", "Hammer Curl — 3 sets", "Overhead Triceps Extension — 3 sets", "Preacher Curl — 2–3 sets"], "Use multiple elbow-friendly angles and controlled repetitions."),
    ],
    progression: "Progress individual exercises through rep ranges and gradual load increases. Weekly volume can be adjusted based on recovery and muscle response.",
    accuracyNote: "5-Day Bro Split is a broad bodybuilding split category, so this page presents a Gym Log template rather than a canonical routine."
  },
  "chest-back-legs-shoulders-arms": {
    workouts: [
      w("Day 1", "Chest", ["Bench Press — 3–4 sets", "Incline Press — 3 sets", "Machine Press — 3 sets", "Cable Fly — 3 sets", "Triceps — 2–3 sets"], "Chest-first specialization with enough triceps support."),
      w("Day 2", "Back", ["Pull-Up or Pulldown — 3–4 sets", "Row — 4 sets", "Chest-Supported Row — 3 sets", "Pullover — 2–3 sets", "Curl — 2–3 sets"], "Cover vertical pulling, horizontal rowing and lat-focused work."),
      w("Day 3", "Legs", ["Squat — 3–4 sets", "Romanian Deadlift — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Calves — 4 sets"], "Balance quads, hamstrings and glutes."),
      w("Day 4", "Shoulders", ["Overhead Press — 3 sets", "Lateral Raise — 4 sets", "Rear Delt Fly — 3 sets", "Machine Press — 2–3 sets", "Shrug — 3 sets"], "Use direct lateral and rear-delt volume alongside pressing."),
      w("Day 5", "Arms", ["EZ-Bar Curl — 3 sets", "Close-Grip Bench — 3 sets", "Hammer Curl — 3 sets", "Triceps Pressdown — 3 sets", "Preacher Curl — 2–3 sets", "Overhead Triceps Extension — 2–3 sets"], "Keep arm work controlled and progressively overloadable."),
    ],
    progression: "Progress exercises by adding reps and then small load increases. Adjust total sets to match the lifter's recovery and the goal of each block.",
    accuracyNote: "Chest/Back/Legs/Shoulders/Arms is a split structure rather than one canonical program; this is a Gym Log template."
  },
  "arnold-split": {
    workouts: [
      w("Day 1", "Chest + back", ["Bench Press — 3–4 sets", "Incline Press — 3 sets", "Fly — 3 sets", "Pull-Up or Pulldown — 3–4 sets", "Row — 3–4 sets", "Pullover — 2–3 sets"], "Classic chest/back pairing with substantial upper-body volume."),
      w("Day 2", "Shoulders + arms", ["Overhead Press — 3 sets", "Lateral Raise — 4 sets", "Rear Delt Fly — 3 sets", "Curl — 3 sets", "Triceps Extension — 3 sets", "Hammer Curl — 2–3 sets"], "Keep the session focused on delts and arms."),
      w("Day 3", "Legs", ["Squat — 3–4 sets", "Romanian Deadlift — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Calves — 4 sets", "Abs — 3 sets"], "Full lower-body session with direct hamstring and calf work."),
      w("Day 4", "Chest + back", ["Incline Press — 3 sets", "Machine Press — 3 sets", "Cable Fly — 2–3 sets", "Row — 3–4 sets", "Pulldown — 3 sets", "Rear Delt / Pullover — 2–3 sets"], "Second upper pairing uses different angles to distribute stress."),
      w("Day 5", "Shoulders + arms", ["Shoulder Press — 3 sets", "Lateral Raise — 4 sets", "Rear Delt Fly — 3 sets", "Preacher Curl — 3 sets", "Triceps Pressdown — 3 sets", "Hammer Curl — 2 sets"], "Use controlled isolation work and avoid excessive overlap fatigue."),
      w("Day 6", "Legs", ["Front Squat or Hack Squat — 3 sets", "Hip Hinge — 3 sets", "Leg Extension — 3 sets", "Seated Leg Curl — 3 sets", "Calves — 4 sets", "Abs — 3 sets"], "Second leg exposure complements the first with different exercise choices."),
    ],
    progression: "Progress through repeatable rep ranges and gradual loading while monitoring the high weekly volume. Rest days are important when using a six-day schedule.",
    accuracyNote: "The Arnold Split has multiple historical variants. This page represents a Gym Log six-day interpretation, not one definitive historical prescription."
  },
  "reddit-ppl": {
    workouts: [
      w("Day 1", "Push", ["Bench Press — 3–4 sets", "Overhead Press — 3 sets", "Incline Dumbbell Press — 3 sets", "Lateral Raise — 3 sets", "Triceps Pressdown — 3 sets"], "A practical PPL template with compounds first and accessories after."),
      w("Day 2", "Pull", ["Deadlift or Hip Hinge — 2–3 sets", "Pull-Up or Lat Pulldown — 3–4 sets", "Barbell or Cable Row — 3–4 sets", "Face Pull — 3 sets", "Curl — 3 sets"], "Manage deadlift fatigue and prioritize quality pulling volume."),
      w("Day 3", "Legs", ["Squat — 3–4 sets", "Romanian Deadlift — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Calves — 3–4 sets"], "Cover both knee- and hip-dominant patterns."),
      w("Day 4", "Push", ["Incline Press — 3–4 sets", "Dumbbell Shoulder Press — 3 sets", "Machine Chest Press — 3 sets", "Lateral Raise — 3–4 sets", "Triceps Extension — 3 sets"], "Second push exposure emphasizes different angles."),
      w("Day 5", "Pull", ["Pull-Up or Pulldown — 3–4 sets", "Chest-Supported Row — 3–4 sets", "Cable Row — 3 sets", "Rear Delt Fly — 3 sets", "Hammer Curl — 3 sets"], "Keep pulling volume balanced across lats and upper back."),
      w("Day 6", "Legs", ["Front Squat or Hack Squat — 3–4 sets", "Hip Thrust — 3 sets", "Leg Extension — 3 sets", "Seated Leg Curl — 3 sets", "Calves — 4 sets", "Abs — 3 sets"], "Use the second leg day for complementary hypertrophy work."),
    ],
    progression: "Use progressive overload with rep ranges, adding weight after completing the upper end with sound technique. Deload or reduce volume when fatigue accumulates.",
    accuracyNote: "Reddit PPL refers to a community-popular family of routines with multiple variants. This is a Gym Log interpretation, not an official single prescription."
  }
};
