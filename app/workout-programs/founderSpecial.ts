import type { ProgramWorkout } from "./programWorkouts";

export type FounderImportDay = ProgramWorkout & { offsetDays: number };

const w = (week: number, day: number, focus: string, exercises: string[], guidance: string, offsetDays: number): FounderImportDay => ({
  day: `Week ${week} — Day ${day}`,
  focus,
  exercises,
  guidance,
  offsetDays,
});

/**
 * Gym Log Founder Special
 * 4 weeks × 4 training days = 16 planned sessions.
 *
 * Rules:
 * - Bench every week, with a heavier strength exposure plus a lower-stress volume exposure.
 * - Squat only in Weeks 1 and 3.
 * - Deadlift only in Week 4, with no barbell squat anywhere in Week 4.
 * - Hypertrophy/accessory work fills the remainder of each session.
 * - Designed for an experienced lifter, 45–60 minutes per session.
 * - Uses the available home-gym leg press / reverse hack squat machine.
 */
export const FOUNDER_SPECIAL_WORKOUTS: FounderImportDay[] = [
  w(1, 1, "Upper A — Bench strength", [
    "Bench Press — 4×5 @ RPE 7",
    "Chest-Supported Dumbbell Row — 3×8–12",
    "Incline Dumbbell Press — 3×8–12",
    "Lat Pulldown — 3×8–12",
    "Cable Lateral Raise — 2×12–20",
    "Triceps Pressdown — 2×10–15",
  ], "Start with the bench work. Rest 2–3 minutes on bench and 60–90 seconds on accessories. Keep 1–3 reps in reserve on most accessory sets.", 0),

  w(1, 2, "Lower A — Squat + hypertrophy", [
    "Back Squat — 3×5 @ RPE 7",
    "Romanian Deadlift — 3×6–10",
    "Reverse Hack Squat / Leg Press — 3×8–12",
    "Leg Curl — 3×10–15",
    "Calf Raise — 2×10–20",
  ], "Squat is the only heavy knee-dominant barbell lift. Keep the reverse hack squat controlled and use it for efficient quad volume.", 1),

  w(1, 3, "Upper B — Bench volume", [
    "Bench Press — 3×6 @ RPE 7",
    "Seated Cable Row — 3×8–12",
    "Dumbbell Shoulder Press — 3×8–12",
    "Lat Pulldown — 3×8–12",
    "Cable Lateral Raise — 2×12–20",
    "Dumbbell Curl — 2×8–15",
  ], "This second bench exposure should feel easier than Day 1. Superset rows/pulldowns with delt or arm work to stay inside the time limit.", 3),

  w(1, 4, "Lower B — Posterior chain + machine legs", [
    "Barbell Hip Thrust — 3×6–10",
    "Reverse Hack Squat / Leg Press — 3×10–15",
    "Bulgarian Split Squat — 2×8–12/leg",
    "Cable Leg Curl — 3×10–15",
    "Cable Crunch or Plank — 2×10–15 or 30–60 sec",
  ], "No additional squat or deadlift is needed. Keep this session productive but leave enough recovery for the next week.", 5),

  w(2, 1, "Upper A — Bench strength progression", [
    "Bench Press — 5×4 @ RPE 7.5",
    "Chest-Supported Dumbbell Row — 3×8–12",
    "Incline Dumbbell Press — 3×8–12",
    "Lat Pulldown — 3×8–12",
    "Cable Lateral Raise — 2×12–20",
    "Triceps Pressdown — 2×10–15",
  ], "Add a small amount of load to bench only if Week 1 was crisp. Do not force the increase if RPE runs high.", 7),

  w(2, 2, "Lower A — No squat, quad volume", [
    "Reverse Hack Squat / Leg Press — 4×8–12",
    "Romanian Deadlift — 3×6–10",
    "Walking Reverse Lunge — 2×8–12/leg",
    "Leg Curl — 3×10–15",
    "Calf Raise — 2×10–20",
  ], "Week 2 deliberately removes barbell squatting. Use the reverse hack squat / leg press as the primary quad movement and keep it 1–3 reps shy of failure.", 8),

  w(2, 3, "Upper B — Bench volume progression", [
    "Bench Press — 4×5 @ RPE 7–7.5",
    "Seated Cable Row — 3×8–12",
    "Dumbbell Shoulder Press — 2×8–12",
    "Lat Pulldown — 3×8–12",
    "Cable Lateral Raise — 2×12–20",
    "Dumbbell/Cable Curl — 2×8–15",
  ], "Use the same technique and setup as the first bench exposure. Progress reps or load only while bar speed and form remain consistent.", 10),

  w(2, 4, "Lower B — Glutes, hamstrings + machine legs", [
    "Barbell Hip Thrust — 3×8–10",
    "Reverse Hack Squat / Leg Press — 3×10–15",
    "Dumbbell Step-Up — 2×8–12/leg",
    "Cable Leg Curl — 3×10–15",
    "Ab Wheel or Cable Crunch — 2×8–15",
  ], "Keep this lower session moderate. The goal is muscle maintenance and growth without creating unnecessary fatigue before the next bench week.", 12),

  w(3, 1, "Upper A — Bench strength", [
    "Bench Press — 5×3 @ RPE 8",
    "Chest-Supported Dumbbell Row — 3×8–12",
    "Incline Dumbbell Press — 3×8–12",
    "Lat Pulldown — 3×8–12",
    "Cable Lateral Raise — 2×12–20",
    "Triceps Pressdown — 2×10–15",
  ], "This is the heaviest planned bench work of the block. Keep every rep technically clean and stop short of a grinder.", 14),

  w(3, 2, "Lower A — Squat progression", [
    "Back Squat — 4×4 @ RPE 7.5–8",
    "Romanian Deadlift — 3×6–10",
    "Reverse Hack Squat / Leg Press — 3×8–12",
    "Leg Curl — 3×10–15",
    "Calf Raise — 2×10–20",
  ], "Week 3 is the second and final squat exposure. The reverse hack squat / leg press supplies additional quad volume without needing more barbell work.", 15),

  w(3, 3, "Upper B — Bench volume", [
    "Bench Press — 3×5 @ RPE 7.5",
    "Seated Cable Row — 3×8–12",
    "Dumbbell Shoulder Press — 3×8–12",
    "Lat Pulldown — 3×8–12",
    "Cable Lateral Raise — 2×12–20",
    "Dumbbell Curl — 2×8–15",
  ], "Keep this bench exposure submaximal after the heavier Day 1. Use supersets for the final accessories if needed.", 17),

  w(3, 4, "Lower B — Hypertrophy + posterior chain", [
    "Barbell Hip Thrust — 3×6–10",
    "Reverse Hack Squat / Leg Press — 3×10–15",
    "Bulgarian Split Squat — 2×8–12/leg",
    "Cable Leg Curl — 3×10–15",
    "Cable Crunch or Plank — 2×10–15 or 30–60 sec",
  ], "No deadlift this week. Keep the session focused on recoverable hypertrophy so Week 4 can introduce the single deadlift exposure.", 19),

  w(4, 1, "Upper A — Bench intensity", [
    "Bench Press — 4×2 @ RPE 8 + optional single @ RPE 8",
    "Chest-Supported Dumbbell Row — 3×8–12",
    "Incline Dumbbell Press — 2×8–12",
    "Lat Pulldown — 3×8–12",
    "Cable Lateral Raise — 2×12–20",
    "Triceps Pressdown — 2×10–15",
  ], "Week 4 peaks bench intensity without testing a true max. Skip the optional single if the doubles are already near RPE 8.", 21),

  w(4, 2, "Lower A — No squat, deadlift exposure", [
    "Deadlift — 3×3 @ RPE 7.5–8",
    "Reverse Hack Squat / Leg Press — 3×8–12",
    "Dumbbell Reverse Lunge — 2×8–12/leg",
    "Leg Curl — 3×10–15",
    "Calf Raise — 2×10–20",
  ], "This is the only conventional deadlift exposure in the four-week block, and there is no barbell squat in Week 4. Keep the deadlift submaximal and technically clean; use 2×3 if recovery is poor.", 22),

  w(4, 3, "Upper B — Bench volume consolidation", [
    "Bench Press — 3×4 @ RPE 7.5",
    "Seated Cable Row — 3×8–12",
    "Dumbbell Shoulder Press — 2×8–12",
    "Lat Pulldown — 3×8–12",
    "Cable Lateral Raise — 2×12–20",
    "Dumbbell/Cable Curl — 2×8–15",
  ], "Keep this final bench session controlled. The goal is quality volume and consolidation, not another peak effort.", 24),

  w(4, 4, "Lower B — Hypertrophy + recovery-friendly finish", [
    "Barbell Hip Thrust — 3×8–10",
    "Reverse Hack Squat / Leg Press — 3×10–15",
    "Dumbbell Step-Up — 2×8–12/leg",
    "Cable Leg Curl — 3×10–15",
    "Cable Crunch or Plank — 2×10–15 or 30–60 sec",
  ], "Finish the block without another heavy hinge or squat. Keep 2–3 reps in reserve and use this session to accumulate useful hypertrophy work.", 26),
];

export const FOUNDER_SPECIAL_PROGRESSION =
  "Bench is trained twice each week: one primary strength exposure and one lower-stress volume exposure. The primary bench work progresses from 4×5 in Week 1 to 5×4, 5×3 and 4×2 in Week 4, using RPE as the guardrail rather than forcing fixed percentages. Squat appears only in Weeks 1 and 3. Deadlift appears only in Week 4, and Week 4 contains no barbell squat. Accessories use double progression: add reps within the listed range before adding a small amount of load, while keeping most sets 1–3 reps in reserve. After Week 4, take several easier sessions or reduce load/volume before beginning another block.";

export const FOUNDER_SPECIAL_DURATION = "4 weeks · 4 training days per week · 16 sessions · 45–60 minutes per session";

export const FOUNDER_SPECIAL_ACCURACY_NOTE =
  "Gym Log original program built for an experienced lifter training in a well-equipped home gym. It follows the requested four-week structure, weekly bench practice, alternating squat exposure, one deadlift week with no squat, and efficient hypertrophy work. The reverse hack squat / leg press is used for lower-body volume to make the plan fit the available home-gym equipment.";
