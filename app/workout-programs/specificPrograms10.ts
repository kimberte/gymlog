import type { ProgramWorkout } from "./programWorkouts";

export type SpecificProgram10 = {
  workouts: ProgramWorkout[];
  progression: string;
  duration?: string;
  accuracyNote: string;
};

const w = (day: string, focus: string, exercises: string[], guidance: string): ProgramWorkout => ({ day, focus, exercises, guidance });

/** High-value program summaries. These describe the recognizable structure without reproducing complete paid/copyrighted program materials. */
export const SPECIFIC_PROGRAMS_10: Record<string, SpecificProgram10> = {
  "phat": {
    duration: "5 training days per week; run as an ongoing split",
    workouts: [
      w("Day 1", "Upper Power", ["Barbell Bench Press — 3–4×3–5", "Bent-Over Row — 3–4×3–5", "Overhead Press — 3×5–8", "Weighted Pull-Up or Pulldown — 3×6–10", "Curl + Triceps — 2–3×8–12"], "Keep the first movements relatively heavy and use controlled accessory work."),
      w("Day 2", "Lower Power", ["Back Squat — 3–4×3–5", "Romanian Deadlift — 3×5–8", "Leg Press — 3×6–10", "Leg Curl — 3×8–12", "Calf Raise — 3×8–15"], "Power work comes first; avoid turning accessory work into another max-effort session."),
      w("Day 3", "Back / Shoulders Hypertrophy", ["Pull-Up or Pulldown — 3–4×8–12", "Cable or Chest-Supported Row — 3–4×8–12", "Dumbbell Shoulder Press — 3×8–12", "Lateral Raise — 3–4×10–20", "Rear Delt Fly — 3×10–20"], "Use moderate loads and accumulate quality volume through a full range of motion."),
      w("Day 4", "Lower Hypertrophy", ["Front Squat or Hack Squat — 3–4×8–12", "Leg Press — 3×10–15", "Romanian Deadlift — 3×8–12", "Leg Curl — 3×10–15", "Calf Raise — 4×10–20"], "This session emphasizes higher-rep lower-body volume after the power days."),
      w("Day 5", "Chest / Arms Hypertrophy", ["Incline Dumbbell Press — 3–4×8–12", "Machine or Cable Press — 3×8–12", "Cable Fly — 3×10–15", "Lateral Raise — 3×10–20", "Curl — 3×8–15", "Triceps Extension — 3×8–15"], "Prioritize weekly volume and recovery rather than taking every set to failure."),
    ],
    progression: "PHAT combines heavier power work with higher-volume hypertrophy sessions. Progress by adding reps or load while maintaining technique, then manage volume when recovery or performance declines.",
    accuracyNote: "This is a practical PHAT structure summary. Exercise selection and progression can vary by the version and author guidance; use the original PHAT source for exact programming."
  },
  "531-bbb": {
    duration: "4-week cycles; repeat with updated Training Maxes",
    workouts: [
      w("Day 1", "Squat + press", ["Squat — 5/3/1 main work", "Overhead Press — 5/3/1 main work", "Squat — 5×10 BBB supplemental work", "Press assistance"], "BBB adds substantial supplemental volume after the primary 5/3/1 work."),
      w("Day 2", "Bench + pull", ["Bench Press — 5/3/1 main work", "Deadlift — 5/3/1 main work", "Bench or related lift — 5×10 BBB supplemental work", "Pull assistance"], "Use the Training Max for the main 5/3/1 work; supplemental loading is deliberately submaximal."),
      w("Day 3", "Press + squat", ["Overhead Press — 5/3/1 main work", "Squat — 5/3/1 main work", "Press — 5×10 BBB supplemental work", "Single-leg / core work"], "Keep supplemental volume recoverable so the next cycle remains productive."),
      w("Day 4", "Deadlift + bench", ["Deadlift — 5/3/1 main work", "Bench Press — 5/3/1 main work", "Deadlift or bench — 5×10 BBB supplemental work", "Pull / arm assistance"], "The exact BBB pairing varies by template; this page is a representative structure."),
    ],
    progression: "Run the 5s, 3s and 5/3/1 waves across the cycle, followed by a deload or recovery week. Update the Training Max conservatively between cycles.",
    accuracyNote: "BBB is one of many 5/3/1 templates. This page summarizes the classic 5×10 supplemental concept without claiming one universal pairing or loading prescription."
  },
  "nsuns-531": {
    duration: "Usually run as repeating weekly progression; 4-day variants are common",
    workouts: [
      w("Day 1", "Bench / squat volume", ["Bench Press — main nSuns T1/T2 work", "Squat — secondary work", "Row — high-volume work", "Triceps / upper-back assistance"], "nSuns is built around high volume and percentage-based top-set/back-off work."),
      w("Day 2", "Squat / overhead press", ["Squat — main work", "Overhead Press — secondary work", "Pulling assistance", "Leg accessories"], "Keep fatigue under control; the program's volume can become demanding quickly."),
      w("Day 3", "Deadlift / bench", ["Deadlift — main work", "Bench Press — secondary work", "Row or Pulldown", "Hamstring / arm assistance"], "Use the prescribed percentage progression rather than turning every top set into a true max."),
      w("Day 4", "Overhead press / deadlift", ["Overhead Press — main work", "Deadlift — secondary work", "Upper-back work", "Optional arms or core"], "The exact T1/T2 ordering differs among nSuns variants; select the intended template before importing."),
    ],
    progression: "nSuns combines a 5/3/1-inspired primary progression with high-volume secondary work and percentage-based increases. Progression is generally planned week to week rather than based on daily max attempts.",
    accuracyNote: "nSuns has multiple templates and community variants. This is a structural summary, not a reproduction of a specific spreadsheet."
  },
  "push-pull-legs": {
    duration: "6-day rotating split; can be adapted to fewer days",
    workouts: [
      w("Day 1", "Push", ["Bench Press — 3–4×5–10", "Incline Press — 3×8–12", "Overhead Press — 2–4×6–12", "Lateral Raise — 3×10–20", "Triceps Extension — 3×8–15"], "Train chest, shoulders and triceps with a mix of compound and isolation work."),
      w("Day 2", "Pull", ["Pull-Up or Lat Pulldown — 3–4×6–12", "Row — 3–4×6–12", "Rear Delt Fly — 3×10–20", "Curl — 3×8–15", "Hammer Curl — 2–3×8–15"], "Balance vertical and horizontal pulling and progress the movements gradually."),
      w("Day 3", "Legs", ["Back Squat — 3–4×5–10", "Romanian Deadlift — 3×6–12", "Leg Press — 3×8–15", "Leg Curl — 3×8–15", "Calf Raise — 3–4×10–20"], "Use the leg day to cover quads, posterior chain and calves without excessive junk volume."),
      w("Day 4", "Push", ["Incline or Flat Press — 3–4×6–10", "Machine Press — 3×8–12", "Shoulder Press — 2–3×8–12", "Lateral Raise — 3×12–20", "Triceps — 3×10–15"], "Second exposure can emphasize different angles and moderate-rep work."),
      w("Day 5", "Pull", ["Pulldown or Pull-Up — 3–4×6–12", "Chest-Supported Row — 3–4×8–12", "Cable Row — 2–3×8–15", "Rear Delt — 3×12–20", "Curl — 3×8–15"], "Use the second pull session to accumulate quality volume without sacrificing recovery."),
      w("Day 6", "Legs", ["Hack Squat or Front Squat — 3–4×6–12", "Hip Hinge — 3×6–12", "Leg Extension — 3×10–15", "Leg Curl — 3×10–15", "Calf Raise — 3–4×10–20"], "A second leg exposure allows exercise variation while maintaining weekly frequency."),
    ],
    progression: "Use double progression or another consistent method: add reps within the target range, then increase load once the upper end is achieved with good technique. Reduce volume when recovery falls behind.",
    accuracyNote: "PPL is a training split rather than one single official program. This page provides a Gym Log template that can be customized to the user's preferred PPL version."
  },
  "upper-lower-split": {
    duration: "4 training days per week; ongoing split",
    workouts: [
      w("Day 1", "Upper", ["Bench Press — 3–4×5–8", "Row — 3–4×6–10", "Overhead Press — 3×6–10", "Pulldown — 3×8–12", "Curl + Triceps — 2–3×8–15"], "Keep the main upper-body lifts challenging but repeatable."),
      w("Day 2", "Lower", ["Squat — 3–4×5–8", "Romanian Deadlift — 3×6–10", "Leg Press — 3×8–12", "Leg Curl — 3×8–15", "Calf Raise — 3×10–20"], "Use one heavy knee-dominant lift and one hip-dominant lift, then add targeted volume."),
      w("Day 3", "Upper", ["Incline Press — 3–4×6–10", "Chest-Supported Row — 3–4×8–12", "Pulldown — 3×8–12", "Lateral Raise — 3×10–20", "Curl + Triceps — 3×8–15"], "Change angles or rep ranges while maintaining the same movement patterns."),
      w("Day 4", "Lower", ["Front Squat or Hack Squat — 3–4×6–10", "Deadlift or Hip Hinge — 2–3×5–8", "Split Squat — 3×8–12", "Leg Curl — 3×10–15", "Calf Raise — 3×10–20"], "Avoid excessive overlap between the heavy hinge and squat work."),
    ],
    progression: "Progress the main lifts through small load or rep increases. Accessories can use double progression while weekly volume is adjusted to recovery.",
    accuracyNote: "Upper/lower is a general split with many valid implementations; this is a Gym Log starter template rather than a single named author's prescription."
  },
  "arnold-split": {
    duration: "6-day split; often organized as chest/back, shoulders/arms, legs",
    workouts: [
      w("Day 1", "Chest + Back", ["Bench Press — 3–4×6–10", "Incline Press — 3×8–12", "Row — 3–4×6–12", "Pulldown — 3×8–12", "Fly + Pullover — 2–3×10–15"], "The defining feature is high-volume chest and back training in the same session."),
      w("Day 2", "Shoulders + Arms", ["Overhead Press — 3–4×6–10", "Lateral Raise — 3–4×10–20", "Rear Delt Fly — 3×10–20", "Curl — 3×8–15", "Triceps Extension — 3×8–15"], "Use controlled isolation work after the primary shoulder movement."),
      w("Day 3", "Legs", ["Back Squat — 3–4×5–10", "Romanian Deadlift — 3×6–12", "Leg Press — 3×8–15", "Leg Curl — 3×8–15", "Calf Raise — 4×10–20"], "Keep lower-body volume high enough to progress but recoverable across the six-day rotation."),
      w("Day 4", "Chest + Back", ["Incline Press — 3–4×6–10", "Dumbbell Press — 3×8–12", "Chest-Supported Row — 3–4×8–12", "Pull-Up — 3×6–12", "Fly + Pulldown — 2–3×10–15"], "Second exposure can use different angles and moderate-to-high reps."),
      w("Day 5", "Shoulders + Arms", ["Press — 3×6–10", "Lateral Raise — 4×10–20", "Rear Delt — 3×12–20", "Curl variation — 3×8–15", "Triceps variation — 3×8–15"], "Prioritize execution and recovery when repeating high weekly volume."),
      w("Day 6", "Legs", ["Squat or Hack Squat — 3–4×6–12", "Hip Hinge — 3×6–12", "Leg Extension — 3×10–15", "Leg Curl — 3×10–15", "Calves — 4×10–20"], "Finish the rotation with a second leg exposure and then recover before repeating."),
    ],
    progression: "Progress through a combination of added reps, load and improved execution. Because the split can generate substantial volume, recovery and exercise selection matter as much as adding weight.",
    accuracyNote: "The Arnold split has historical variations. This is a practical modernized structure inspired by the classic split, not a claim to reproduce one original routine exactly."
  },
  "531-triumvirate": {
    duration: "4-week 5/3/1 cycle",
    workouts: [
      w("Day 1", "Squat + assistance", ["Squat — 5/3/1 main work", "Assistance 1 — 5×10", "Assistance 2 — 5×10"], "Triumvirate emphasizes a small number of assistance movements rather than a large menu of accessories."),
      w("Day 2", "Bench + assistance", ["Bench Press — 5/3/1 main work", "Assistance 1 — 5×10", "Assistance 2 — 5×10"], "Keep assistance focused on movements that support the main lift."),
      w("Day 3", "Deadlift + assistance", ["Deadlift — 5/3/1 main work", "Assistance 1 — 5×10", "Assistance 2 — 5×10"], "Avoid turning assistance into additional maximal strength work."),
      w("Day 4", "Press + assistance", ["Overhead Press — 5/3/1 main work", "Assistance 1 — 5×10", "Assistance 2 — 5×10"], "The exact assistance exercises depend on the selected Triumvirate template."),
    ],
    progression: "Use the standard 5/3/1 percentage waves based on a Training Max, then make conservative Training Max increases for the next cycle.",
    accuracyNote: "Triumvirate is a specific 5/3/1 assistance template; this summary intentionally leaves assistance choices flexible rather than reproducing a complete copyrighted template."
  },
  "juggernaut-method": {
    duration: "Multi-week strength cycles using percentage waves",
    workouts: [
      w("Day 1", "Lower / squat focus", ["Squat — programmed wave", "Supplemental lower-body work", "Hamstring / posterior-chain work", "Core"], "Use the current Juggernaut Method template for exact percentages and rep targets."),
      w("Day 2", "Upper / bench focus", ["Bench Press — programmed wave", "Upper-back work", "Pressing assistance", "Arms"], "The primary lift is progressed through planned volume and intensity waves."),
      w("Day 3", "Lower / deadlift focus", ["Deadlift — programmed wave", "Squat or supplemental lift", "Posterior-chain assistance", "Core"], "Manage fatigue because the deadlift session can overlap with lower-body recovery demands."),
      w("Day 4", "Upper / press focus", ["Overhead Press — programmed wave", "Row or Pulldown", "Secondary press", "Arms / shoulders"], "Use the program's prescribed wave rather than inventing weekly maxes."),
    ],
    progression: "The Juggernaut Method uses planned waves that move through volume and intensity phases. Progress is assessed over blocks rather than relying on daily PRs.",
    accuracyNote: "This is a structural summary of the Juggernaut Method family; exact cycles, percentages and assistance work depend on the edition or template being followed."
  },
  "german-volume-training": {
    duration: "Commonly used as a short high-volume block, often around 4–6 weeks",
    workouts: [
      w("Day 1", "Chest + Back", ["Primary chest movement — 10×10", "Primary back movement — 10×10", "Optional small accessory"], "GVT's defining feature is repeated sets of the same movement at a controlled load; do not add large amounts of extra volume."),
      w("Day 2", "Legs + Core", ["Squat or Leg Press — 10×10", "Leg Curl — 10×10 or paired posterior-chain work", "Calf Raise", "Core"], "High set counts create substantial fatigue; recovery should guide exercise selection."),
      w("Day 3", "Recovery", ["Walking / mobility", "Optional light conditioning"], "A recovery day is useful between high-volume sessions."),
      w("Day 4", "Shoulders + Arms", ["Primary shoulder movement — high-volume work", "Curl — high-volume work", "Triceps movement — high-volume work", "Optional lateral raise"], "Keep the session focused and avoid adding unnecessary exercises."),
      w("Day 5", "Lower / posterior chain", ["Lower-body primary movement — high-volume work", "Hip hinge or leg curl — supplemental volume", "Calves", "Core"], "Use conservative loads and stop short of technique breakdown."),
    ],
    progression: "GVT is typically progressed by gradually increasing load while keeping the high set/rep structure consistent. It is better treated as a short volume block than an indefinite high-volume plan.",
    accuracyNote: "German Volume Training has multiple published variants. This page captures the classic high-volume concept rather than one exact prescription."
  },
  "easy-strength": {
    duration: "Often run for a focused block of several weeks",
    workouts: [
      w("Day 1", "Frequent full-body practice", ["Squat or Front Squat — moderate practice", "Press — moderate practice", "Deadlift or Power Pull — low-volume practice", "Weighted Carry"], "The defining idea is frequent practice of a small number of fundamental movements without routinely exhausting the lifter."),
      w("Day 2", "Repeatable strength", ["Squat variation — moderate practice", "Press variation — moderate practice", "Pull variation — moderate practice", "Carry or simple assistance"], "Keep the session short and repeatable rather than chasing fatigue."),
      w("Day 3", "Frequent full-body practice", ["Squat or Front Squat — moderate practice", "Press — moderate practice", "Deadlift or Power Pull — low-volume practice", "Weighted Carry"], "Use conservative loading and emphasize crisp repetitions."),
      w("Day 4", "Repeatable strength", ["Squat variation — moderate practice", "Press variation — moderate practice", "Pull variation — moderate practice", "Carry or simple assistance"], "The approach is intentionally minimalist."),
      w("Day 5", "Weekly consolidation", ["Squat — moderate practice", "Press — moderate practice", "Pull / hinge — moderate practice", "Carry"], "Finish the week with quality work rather than a test session."),
    ],
    progression: "Progression is deliberately conservative: improve repetition quality and gradually add load while keeping sessions comfortably repeatable. The method is built around consistency rather than frequent failure.",
    accuracyNote: "Easy Strength has multiple implementations. This page summarizes the core frequent-practice philosophy without reproducing a particular book's complete prescription."
  }
};
