import type { ProgramWorkout } from "./programWorkouts";

export type SpecificProgram = {
  workouts: ProgramWorkout[];
  progression: string;
  duration?: string;
  accuracyNote: string;
};

const w = (day: string, focus: string, exercises: string[], guidance: string): ProgramWorkout => ({ day, focus, exercises, guidance });

export const SPECIFIC_PROGRAMS: Record<string, SpecificProgram> = {
  "starting-strength": {
    duration: "Novice progression; phases change as the lifter advances",
    workouts: [
      w("Day A", "Squat / press / pull", ["Squat — 3×5", "Press or Bench Press — 3×5", "Deadlift — 1×5"], "Train three non-consecutive days per week. Alternate the press and bench press between sessions."),
      w("Day B", "Squat / press / pull", ["Squat — 3×5", "Press or Bench Press — 3×5", "Deadlift — 1×5"], "In the later novice phase, the pulling slot can rotate to Power Clean 5×3 or Chin-Ups as prescribed by the program."),
      w("Day A", "Repeat the A/B rotation", ["Squat — 3×5", "Press or Bench Press — 3×5", "Deadlift — 1×5"], "Add weight when the prescribed work is completed with sound technique; use smaller jumps as progress slows."),
    ],
    progression: "The novice model uses session-to-session increases. Starting Strength's published guidance recommends larger early jumps followed by smaller increments as the novice adapts.",
    accuracyNote: "Template based on the published Starting Strength novice program; later phases modify the pulling movement as the lifter advances."
  },
  "stronglifts-5x5": {
    duration: "Run until session-to-session linear progression stalls",
    workouts: [
      w("Workout A", "Full body", ["Squat — 5×5", "Bench Press — 5×5", "Barbell Row — 5×5"], "Use warm-up sets in addition to the five work sets."),
      w("Workout B", "Full body", ["Squat — 5×5", "Overhead Press — 5×5", "Deadlift — 1×5"], "Alternate A and B on three non-consecutive training days."),
      w("Workout A", "Full body", ["Squat — 5×5", "Bench Press — 5×5", "Barbell Row — 5×5"], "The following session is B, continuing the A/B rotation."),
    ],
    progression: "Add weight when all prescribed work is completed. The classic recommendation is roughly 5 lb/2.5 kg per session for most lifts, with a larger deadlift jump early on; use smaller increments when needed.",
    accuracyNote: "Template reflects the classic StrongLifts 5×5 A/B structure and its linear progression model."
  },
  "531": {
    duration: "4-week cycles repeated with updated Training Maxes",
    workouts: [
      w("Day 1", "Squat + press", ["Squat — 5/5/5+ @ 65/75/85% TM", "Overhead Press — 5/5/5+ @ 65/75/85% TM", "Push / Pull / Single-leg or Core — 50–100 total reps"], "The final main-lift set is an AMRAP set, performed without grinding."),
      w("Day 2", "Deadlift + bench", ["Deadlift — 5/5/5+ @ 65/75/85% TM", "Bench Press — 5/5/5+ @ 65/75/85% TM", "Push / Pull / Single-leg or Core — 50–100 total reps"], "Percentages are based on the Training Max, not a true 1RM."),
      w("Day 3", "Press + squat", ["Overhead Press — 5/5/5+ @ 65/75/85% TM", "Squat — 5/5/5+ @ 65/75/85% TM", "Push / Pull / Single-leg or Core — 50–100 total reps"], "Rotate the three-week 5s, 3s and 5/3/1 waves before the deload week."),
      w("Day 4", "Optional fourth-day structure", ["Deadlift or Bench Press — 5/5/5+ wave", "Assistance — 50–100 total reps"], "Classic 5/3/1 has many templates; do not assume every 4-day variant is the same prescription."),
    ],
    progression: "Use a Training Max, commonly 90% of a true or estimated 1RM. After each cycle, increase the Training Max conservatively and repeat the wave; the deload week reduces intensity and volume.",
    accuracyNote: "This is a representative classic 5/3/1 structure. 5/3/1 has many official templates, so users should select the exact Wendler template they intend to run."
  },
  "gzclp": {
    duration: "Novice linear progression with stall adjustments",
    workouts: [
      w("A1", "T1 squat / T2 bench / T3 back", ["Squat T1 — 5×3+", "Bench Press T2 — 3×10", "Lat Pulldown or Row T3 — 3×15+"], "The T1 final set is AMRAP; keep reps technically sound."),
      w("B1", "T1 press / T2 deadlift / T3 row", ["Overhead Press T1 — 5×3+", "Deadlift T2 — 3×10", "Dumbbell Row T3 — 3×15+"], "T2 and T3 slots provide higher-rep volume around the primary lift."),
      w("A2", "T1 bench / T2 squat / T3 back", ["Bench Press T1 — 5×3+", "Squat T2 — 3×10", "Lat Pulldown or Row T3 — 3×15+"], "A2/B2 rotate the main lifts so each primary movement receives focused work."),
      w("B2", "T1 deadlift / T2 press / T3 back", ["Deadlift T1 — 5×3+", "Overhead Press T2 — 3×10", "Dumbbell Row T3 — 3×15+"], "Run the A1/B1/A2/B2 sequence across the week rather than repeating one session."),
    ],
    progression: "T1 and T2 use linear progression with AMRAP sets. When a lift stalls, the program changes the rep/set scheme before eventually resetting the load.",
    accuracyNote: "Template captures the defining GZCLP tier structure; exercise substitutions and stall protocols can vary by the chosen GZCLP version."
  },
  "greyskull-lp": {
    duration: "Open-ended beginner linear progression",
    workouts: [
      w("Workout A", "Press + squat", ["Bench Press or Overhead Press — 2×5 + 1×5+", "Squat — 2×5 + 1×5+"], "The final set of each main lift is AMRAP with good form."),
      w("Workout B", "Press + deadlift", ["Bench Press or Overhead Press — 2×5 + 1×5+", "Deadlift — 1×5+"], "Alternate the pressing movement as prescribed and keep the AMRAP controlled."),
      w("Workout A", "Press + squat", ["Bench Press or Overhead Press — 2×5 + 1×5+", "Squat — 2×5 + 1×5+"], "Add weight session to session while recovery and technique remain strong."),
    ],
    progression: "The defining feature is the AMRAP final set. A common progression is small upper-body and lower-body load increases, with a reset when progress stalls.",
    accuracyNote: "Template reflects the core Greyskull LP structure; optional accessory variants are intentionally not treated as part of the base program."
  },
  "fierce-5": {
    duration: "Open-ended novice progression",
    workouts: [
      w("Workout A", "Full body", ["Squat — 3×5", "Bench Press — 3×5", "Pendlay Row — 3×8", "Face Pull — 3×10", "Calf Raise — 2×15", "Triceps Pressdown — 2×10"], "Use non-consecutive training days and alternate A/B."),
      w("Workout B", "Full body", ["Front Squat — 3×5", "Overhead Press — 3×5", "Romanian Deadlift — 3×8", "Lat Pulldown — 3×8", "Abdominals — 2×15", "Biceps Curl — 2×10"], "Keep the accessory work consistent while the main lifts progress."),
      w("Workout A", "Full body", ["Squat — 3×5", "Bench Press — 3×5", "Pendlay Row — 3×8", "Face Pull — 3×10", "Calf Raise — 2×15", "Triceps Pressdown — 2×10"], "Continue alternating A and B three days per week."),
    ],
    progression: "The novice version uses linear increases on the main lifts. If the prescribed weight cannot be completed, repeat or use the program's reset strategy rather than forcing poor reps.",
    accuracyNote: "Template reflects the commonly published Fierce 5 novice A/B routine."
  },
  "candito-6-week": {
    duration: "6 weeks",
    workouts: [
      w("Week 1", "Volume / muscular conditioning", ["Squat — high-rep volume work", "Bench Press — volume work", "Deadlift — volume work", "Optional accessories"], "Week 1 builds work capacity; exact loading is percentage- and template-dependent."),
      w("Week 2", "Volume → strength", ["Squat — 4×6 @ ~80%", "Bench Press — prescribed volume sets", "Deadlift — 2×6 @ ~80%", "Upper-back / shoulder accessories"], "Use the published six-week spreadsheet/template for the exact exercise order and loading."),
      w("Weeks 3–4", "Strength", ["Squat — lower-rep strength work", "Bench Press — strength work", "Deadlift — strength work", "Optional accessories"], "Volume and intensity shift toward heavier strength work."),
      w("Week 5", "Peak preparation", ["Squat — low-volume heavy work", "Bench Press — low-volume heavy work", "Deadlift — low-volume heavy work"], "Fatigue is reduced as the cycle approaches testing."),
      w("Week 6", "Test / realization", ["Squat — test or light option", "Bench Press — test or light option", "Deadlift — test or light option"], "Choose the testing/light-week option appropriate to the goal, then reload the cycle from updated maxes."),
    ],
    progression: "Candito's six-week cycle moves from volume to strength to a peak/test. Loading is percentage-based and changes by week; use the current spreadsheet/template for exact numbers.",
    accuracyNote: "The page intentionally summarizes the six-week architecture rather than reproducing the complete copyrighted spreadsheet line-for-line."
  },
  "texas-method": {
    duration: "Open-ended intermediate progression",
    workouts: [
      w("Volume Day", "High-volume base", ["Squat — 5×5", "Bench Press or Overhead Press — 5×5", "Row or Pull — supplemental volume"], "The volume day is deliberately demanding and is followed by recovery before the intensity day."),
      w("Recovery / Light Day", "Reduce fatigue", ["Light Squat — 2–3×5", "Press or Bench — light work", "Chin-Up / Row — moderate work"], "Keep this session substantially easier than the volume day."),
      w("Intensity Day", "Weekly PR", ["Squat — work up to 1×5 or 1×3/1×1", "Bench Press or Overhead Press — heavy top set", "Power Clean or Pull — low-volume strength work"], "The intensity day expresses the week's adaptation. The exact lift and rep target changes as the lifter advances."),
    ],
    progression: "Texas Method uses weekly volume, recovery and intensity exposure. The goal is generally to establish a new intensity-day performance while managing the previous week's fatigue.",
    accuracyNote: "The Texas Method has multiple legitimate templates and evolves as progress stalls; this page shows the classic 3-day framework rather than claiming one universal prescription."
  },
  "madcow-5x5": {
    duration: "Typically run as an intermediate weekly progression block",
    workouts: [
      w("Workout A", "Heavy 5×5", ["Squat — 5×5 ramp", "Bench Press — 5×5 ramp", "Barbell Row — 5×5 ramp", "Optional assistance"], "Ramp toward a top set rather than using five identical loads."),
      w("Workout B", "Light / medium", ["Squat — 4×5", "Incline Bench Press — 4×5", "Deadlift — 4×5", "Optional assistance"], "The middle workout provides recovery while maintaining practice."),
      w("Workout C", "Medium / heavy", ["Squat — 4×5, 1×3, 1×8", "Bench Press — 4×5, 1×3, 1×8", "Barbell Row — 4×5, 1×3, 1×8", "Optional assistance"], "The final set structure includes a heavier triple and a back-off set."),
    ],
    progression: "Madcow uses heavy/light/medium loading and weekly progression. Top sets generally increase week to week, while ramp sets are calculated from the target top set.",
    accuracyNote: "Template follows the classic Madcow 5×5 A/B/C structure documented by StrongLifts."
  },
  "phul": {
    duration: "Open-ended 4-day split",
    workouts: [
      w("Day 1", "Upper Power", ["Bench Press — 3–4×3–5", "Barbell Row — 3–4×3–5", "Incline Dumbbell Press — 3–4×6–10", "Lat Pulldown — 3–4×6–10", "Overhead Press — 2–3×5–8", "Curl + Triceps — 2–3×6–12"], "Rest before repeating the upper-body musculature on the hypertrophy day."),
      w("Day 2", "Lower Power", ["Squat — 3–4×3–5", "Deadlift — 3–4×3–5", "Bulgarian Split Squat — 3–4×6–10", "Leg Curl — 3–4×6–10", "Calf Raise — 3–4×6–10"], "Keep the heavy work controlled and reserve the higher-rep work for accessories."),
      w("Day 3", "Upper Hypertrophy", ["Incline Bench Press — 3–4×8–12", "Seated Cable Row — 3–4×8–12", "Dumbbell Fly — 3–4×8–12", "Dumbbell Row — 3–4×8–12", "Lateral Raise — 3–4×8–12", "Curl + Triceps — 3–4×8–15"], "Use moderate loads and accumulate quality volume."),
      w("Day 4", "Lower Hypertrophy", ["Front Squat — 3–4×8–12", "Barbell Lunge — 3–4×8–12", "Leg Extension — 3–4×10–15", "Leg Curl — 3–4×10–15", "Calf Work — 3–4×8–12"], "The hypertrophy days are higher-rep and lower-intensity than the power days."),
    ],
    progression: "Progress the power lifts primarily through load and the hypertrophy work through reps and then load within the prescribed ranges.",
    accuracyNote: "Template follows the commonly published PHUL four-day structure; exact accessory selection can vary by version."
  },
  "phat": {
    duration: "Open-ended 5-day split",
    workouts: [
      w("Day 1", "Upper Power", ["Bent-Over Row — 3×3–5", "Bench Press — 3×3–5", "Weighted Pull-Up — 2×6–10", "Overhead Press — 2×6–10", "Arm Work — 3×6–10"], "Power work uses heavier loads and longer rest periods."),
      w("Day 2", "Lower Power", ["Squat — 3×3–5", "Hack Squat or Leg Press — 2×6–10", "Romanian Deadlift — 3×5–8", "Leg Curl — 2×6–10", "Calves — 3–4×6–10"], "Keep the primary lifts performance-focused."),
      w("Day 3", "Rest", ["Recovery", "Mobility / easy activity"], "Take a full recovery day before the hypertrophy block."),
      w("Day 4", "Back & Shoulders Hypertrophy", ["Back / Shoulder Speed Work — 6×3", "Rows and Pulldowns — 3–4×8–12", "Rear / Lateral Delts — 3–4×8–15", "Optional arms"], "The classic PHAT structure combines speed-strength work with bodybuilding volume."),
      w("Day 5", "Lower Hypertrophy", ["Lower-body Speed Work — 6×3", "Squat / Leg Press — 3–4×8–12", "Hamstring Work — 3–4×8–15", "Calves — 3–4×8–15"], "Keep the hypertrophy work controlled and accumulate quality volume."),
      w("Day 6", "Chest & Arms Hypertrophy", ["Chest Speed Work — 6×3", "Chest Press / Fly — 3–4×8–12", "Biceps — 3–4×8–15", "Triceps — 3–4×8–15"], "This completes the five-training-day PHAT week."),
    ],
    progression: "PHAT combines heavier 3–5-rep power work with higher-rep hypertrophy work. Progress the main lifts through load while adding reps or load to accessory work as performance improves.",
    accuracyNote: "Template follows the recognizable five-day PHAT structure associated with Layne Norton; exact exercise variations can differ by version."
  },
  "simple-and-sinister": {
    duration: "Daily practice / long-term progression",
    workouts: [
      w("Daily Practice", "Kettlebell strength & conditioning", ["Warm-up — 3 rounds of prying goblet squat ×5, hip bridge ×5, halo ×5/side", "One-Arm Kettlebell Swing — 10×10", "Turkish Get-Up — 10×1, alternating sides"], "The classic practice is 100 one-arm swings followed by 10 get-ups. Build technique and conditioning before chasing the benchmark pace."),
      w("Daily Practice", "Repeat the same core session", ["One-Arm Kettlebell Swing — 100 total reps", "Turkish Get-Up — 10 total reps"], "StrongFirst's Sinister benchmark is 100 one-arm swings in 5 minutes, then 10 get-ups in 10 minutes."),
      w("Daily Practice", "Quality over fatigue", ["One-Arm Kettlebell Swing — 10×10", "Turkish Get-Up — 10×1"], "The program is a practice, not a race to failure. Increase bell size only when the current workload is owned."),
    ],
    progression: "Progress primarily by improving technique, density and eventually kettlebell load. The well-known Simple benchmark for men is 32 kg for both movements; the Sinister challenge uses 48 kg for both.",
    accuracyNote: "Core structure and benchmarks are based on StrongFirst's published Simple & Sinister description."
  },
  "smolov-jr": {
    duration: "3-week specialization block",
    workouts: [
      w("Monday", "Specialization", ["Target Lift — 6×6 @ 70%"], "Use the same target lift throughout the block unless following a specific Smolov Jr variation."),
      w("Wednesday", "Specialization", ["Target Lift — 7×5 @ 75%"], "Keep recovery high; this is a deliberately high-frequency specialization block."),
      w("Friday", "Specialization", ["Target Lift — 8×4 @ 80%"], "Add the planned weekly increment when the full workload is completed."),
      w("Saturday", "Specialization", ["Target Lift — 10×3 @ 85%"], "The final session is the highest-volume set count at the highest prescribed intensity."),
    ],
    progression: "The classic Smolov Jr. uses four sessions per week with 6×6, 7×5, 8×4 and 10×3. The working weight typically rises each week by a fixed increment.",
    accuracyNote: "Template captures the standard three-week Smolov Jr. set/rep/intensity pattern; exercise selection is commonly adapted to squat, bench or another main lift."
  },
  "coan-phillipi-deadlift": {
    duration: "10 weeks",
    workouts: [
      w("Weekly Deadlift Day", "Deadlift peak", ["Deadlift — heavy top work using the week's prescribed percentage", "Speed / back-off deadlifts — prescribed triples", "Barbell Shrugs — assistance"], "The routine is one deadlift-focused day per week and assumes the lifter handles squat and bench work separately."),
      w("Weeks 1–5", "Build", ["Deadlift — prescribed percentage progression", "Speed Deadlift — multiple triples", "Shrugs — assistance"], "The program ramps toward heavier top work while retaining speed-volume backoffs."),
      w("Weeks 6–10", "Peak", ["Deadlift — progressively heavier top work", "Reduced back-off volume", "Final week — planned max attempt"], "Treat the final week as a peak/test rather than normal training volume."),
    ],
    progression: "The classic Coan-Phillipi routine is a 10-week deadlift peak with weekly percentage progression toward a planned PR attempt. It is not a general full-body program.",
    accuracyNote: "The page intentionally summarizes the 10-week structure without reproducing every percentage and accessory prescription from the full spreadsheet."
  },
  "juggernaut-method": {
    duration: "16 weeks across four waves",
    workouts: [
      w("10s Wave", "Accumulation → realization", ["Main lift — 60% TM for 5×10, final set 10+", "Later week — 67.5% for 3×10, final set 10+", "Realization — 75% × 10+"], "Use the same wave structure for the major lifts, with the final set driving the training response."),
      w("8s Wave", "Accumulation → realization", ["Main lift — 65% TM for 5×8, final set 8+", "Later week — 72.5% for 3×8, final set 8+", "Realization — 80% × 8+"], "The target rep range drops as intensity rises."),
      w("5s Wave", "Strength", ["Main lift — 70% TM for 6×5, final set 5+", "Later week — 77.5% for 4×5, final set 5+", "Realization — 85% × 5+"], "Keep the AMRAP controlled rather than turning every session into a max test."),
      w("3s Wave", "Peak", ["Main lift — 75% TM for 7×3, final set 3+", "Later week — 82.5% for 5×3, final set 3+", "Realization — 90% × 3+"], "Finish the wave, then use the deload before beginning the next block."),
    ],
    progression: "Juggernaut progresses through 10s, 8s, 5s and 3s waves. Each wave uses accumulation, intensification, realization and deload phases, with AMRAP performance informing future Training Max adjustments.",
    accuracyNote: "Template reflects the widely documented four-wave Juggernaut structure; accessory programming is intentionally summarized."
  }
};
