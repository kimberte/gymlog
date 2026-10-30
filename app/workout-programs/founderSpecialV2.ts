import type { ProgramWorkout } from "./programWorkouts";
export type FounderV2ImportDay = ProgramWorkout & { offsetDays: number };
/** Four-week advanced powerbuilding block; 4 sessions/week, 60-minute cap. */
export const FOUNDER_SPECIAL_V2_WORKOUTS: FounderV2ImportDay[] = [
  {
    "day": "Week 1 — Day 1",
    "focus": "Upper Power — Bench + back",
    "exercises": [
      "Barbell Bench Press — 4×5 @ RPE 7–8",
      "Weighted Pull-Up / Lat Pulldown — 3×6–10",
      "Incline Dumbbell Press — 2×8–12",
      "Chest-Supported Dumbbell Row — 2×8–12",
      "Cable Lateral Raise — 2×12–20",
      "Rope Triceps Pushdown — 2×10–15"
    ],
    "guidance": "5–7 min ramp-up; 2–3 min bench rests, 60–90 sec accessories. Superset incline press with rows and lateral raises with pushdowns. Stop heavy sets with 1–2 reps in reserve. Target 55–60 min.",
    "offsetDays": 0
  },
  {
    "day": "Week 1 — Day 2",
    "focus": "Lower Power — Squat week",
    "exercises": [
      "Back Squat — 4×5 @ RPE 7–8",
      "Hack Squat / Leg Press — 3×8–12",
      "Leg Curl Attachment — 3×10–15",
      "Leg Extension Attachment — 2×12–15",
      "Standing Calf Raise — 2×10–20",
      "Hanging Knee / Leg Raise — 2×8–15"
    ],
    "guidance": "Only barbell squats this week; no other heavy barbell squat/deadlift exposure. Warm up 6–8 min, rest 2–3 min on primary lift, 60–90 sec elsewhere. Superset leg extension with calves. Target 55–60 min.",
    "offsetDays": 1
  },
  {
    "day": "Week 1 — Day 3",
    "focus": "Upper Hypertrophy — Chest, back, delts + arms",
    "exercises": [
      "Flat Dumbbell Bench Press — 3×8–12",
      "One-Arm Dumbbell Row — 3×8–12/side",
      "Seated Dumbbell Shoulder Press — 2×8–12",
      "Lat Pulldown — 2×10–15",
      "Cable Lateral Raise — 3×12–20",
      "Cable Curl — 3×10–15",
      "Overhead Cable Triceps Extension — 3×10–15"
    ],
    "guidance": "Hypertrophy only; 1–2 reps in reserve, final isolation set optionally 0–1. Superset press/row, pulldown/lateral raise, and curls/triceps. 60–75 sec accessory rests. Target 50–60 min.",
    "offsetDays": 3
  },
  {
    "day": "Week 1 — Day 4",
    "focus": "Full-Body Hypertrophy — Legs + vanity pump",
    "exercises": [
      "Leg Press / Hack Squat — 3×10–15",
      "Romanian Deadlift (moderate dumbbells) — 2×8–12",
      "Leg Curl Attachment — 2×12–15",
      "Cable Chest Fly — 2×12–15",
      "Cable Rear-Delt Fly / Face Pull — 2×15–20",
      "Dumbbell Hammer Curl — 2×10–15",
      "Rope Triceps Pushdown — 2×10–15",
      "Plank — 2×30–60 sec"
    ],
    "guidance": "No heavy barbell squat or deadlift. Moderate RDLs are accessory work; omit if posterior-chain recovery is limited. Superset chest fly/rear delts, curls/pushdowns. Keep transitions tight; 50–60 min.",
    "offsetDays": 5
  },
  {
    "day": "Week 2 — Day 1",
    "focus": "Upper Power — Bench + back",
    "exercises": [
      "Barbell Bench Press — 4×4 @ RPE 7.5–8",
      "Weighted Pull-Up / Lat Pulldown — 3×6–10",
      "Incline Dumbbell Press — 2×8–12",
      "Chest-Supported Dumbbell Row — 2×8–12",
      "Cable Lateral Raise — 2×12–20",
      "Rope Triceps Pushdown — 2×10–15"
    ],
    "guidance": "5–7 min ramp-up; 2–3 min bench rests, 60–90 sec accessories. Superset incline press with rows and lateral raises with pushdowns. Stop heavy sets with 1–2 reps in reserve. Target 55–60 min.",
    "offsetDays": 7
  },
  {
    "day": "Week 2 — Day 2",
    "focus": "Lower Power — Deadlift week",
    "exercises": [
      "Conventional Deadlift — 3×4 @ RPE 7–8",
      "Hack Squat / Leg Press — 3×8–12",
      "Leg Curl Attachment — 3×10–15",
      "Leg Extension Attachment — 2×12–15",
      "Standing Calf Raise — 2×10–20",
      "Hanging Knee / Leg Raise — 2×8–15"
    ],
    "guidance": "Only conventional deadlifts this week; no other heavy barbell squat/deadlift exposure. Warm up 6–8 min, rest 2–3 min on primary lift, 60–90 sec elsewhere. Superset leg extension with calves. Target 55–60 min.",
    "offsetDays": 8
  },
  {
    "day": "Week 2 — Day 3",
    "focus": "Upper Hypertrophy — Chest, back, delts + arms",
    "exercises": [
      "Flat Dumbbell Bench Press — 3×8–12",
      "One-Arm Dumbbell Row — 3×8–12/side",
      "Seated Dumbbell Shoulder Press — 2×8–12",
      "Lat Pulldown — 2×10–15",
      "Cable Lateral Raise — 3×12–20",
      "Cable Curl — 3×10–15",
      "Overhead Cable Triceps Extension — 3×10–15"
    ],
    "guidance": "Hypertrophy only; 1–2 reps in reserve, final isolation set optionally 0–1. Superset press/row, pulldown/lateral raise, and curls/triceps. 60–75 sec accessory rests. Target 50–60 min.",
    "offsetDays": 10
  },
  {
    "day": "Week 2 — Day 4",
    "focus": "Full-Body Hypertrophy — Legs + vanity pump",
    "exercises": [
      "Leg Press / Hack Squat — 3×10–15",
      "Romanian Deadlift (moderate dumbbells) — 2×8–12",
      "Leg Curl Attachment — 2×12–15",
      "Cable Chest Fly — 2×12–15",
      "Cable Rear-Delt Fly / Face Pull — 2×15–20",
      "Dumbbell Hammer Curl — 2×10–15",
      "Rope Triceps Pushdown — 2×10–15",
      "Plank — 2×30–60 sec"
    ],
    "guidance": "No heavy barbell squat or deadlift. Moderate RDLs are accessory work; omit if posterior-chain recovery is limited. Superset chest fly/rear delts, curls/pushdowns. Keep transitions tight; 50–60 min.",
    "offsetDays": 12
  },
  {
    "day": "Week 3 — Day 1",
    "focus": "Upper Power — Bench + back",
    "exercises": [
      "Barbell Bench Press — 5×3 @ RPE 8",
      "Weighted Pull-Up / Lat Pulldown — 3×6–10",
      "Incline Dumbbell Press — 2×8–12",
      "Chest-Supported Dumbbell Row — 2×8–12",
      "Cable Lateral Raise — 2×12–20",
      "Rope Triceps Pushdown — 2×10–15"
    ],
    "guidance": "5–7 min ramp-up; 2–3 min bench rests, 60–90 sec accessories. Superset incline press with rows and lateral raises with pushdowns. Stop heavy sets with 1–2 reps in reserve. Target 55–60 min.",
    "offsetDays": 14
  },
  {
    "day": "Week 3 — Day 2",
    "focus": "Lower Power — Squat week",
    "exercises": [
      "Back Squat — 4×3–4 @ RPE 8",
      "Hack Squat / Leg Press — 3×8–12",
      "Leg Curl Attachment — 3×10–15",
      "Leg Extension Attachment — 2×12–15",
      "Standing Calf Raise — 2×10–20",
      "Hanging Knee / Leg Raise — 2×8–15"
    ],
    "guidance": "Only barbell squats this week; no other heavy barbell squat/deadlift exposure. Warm up 6–8 min, rest 2–3 min on primary lift, 60–90 sec elsewhere. Superset leg extension with calves. Target 55–60 min.",
    "offsetDays": 15
  },
  {
    "day": "Week 3 — Day 3",
    "focus": "Upper Hypertrophy — Chest, back, delts + arms",
    "exercises": [
      "Flat Dumbbell Bench Press — 3×8–12",
      "One-Arm Dumbbell Row — 3×8–12/side",
      "Seated Dumbbell Shoulder Press — 2×8–12",
      "Lat Pulldown — 2×10–15",
      "Cable Lateral Raise — 3×12–20",
      "Cable Curl — 3×10–15",
      "Overhead Cable Triceps Extension — 3×10–15"
    ],
    "guidance": "Hypertrophy only; 1–2 reps in reserve, final isolation set optionally 0–1. Superset press/row, pulldown/lateral raise, and curls/triceps. 60–75 sec accessory rests. Target 50–60 min.",
    "offsetDays": 17
  },
  {
    "day": "Week 3 — Day 4",
    "focus": "Full-Body Hypertrophy — Legs + vanity pump",
    "exercises": [
      "Leg Press / Hack Squat — 3×10–15",
      "Romanian Deadlift (moderate dumbbells) — 2×8–12",
      "Leg Curl Attachment — 2×12–15",
      "Cable Chest Fly — 2×12–15",
      "Cable Rear-Delt Fly / Face Pull — 2×15–20",
      "Dumbbell Hammer Curl — 2×10–15",
      "Rope Triceps Pushdown — 2×10–15",
      "Plank — 2×30–60 sec"
    ],
    "guidance": "No heavy barbell squat or deadlift. Moderate RDLs are accessory work; omit if posterior-chain recovery is limited. Superset chest fly/rear delts, curls/pushdowns. Keep transitions tight; 50–60 min.",
    "offsetDays": 19
  },
  {
    "day": "Week 4 — Day 1",
    "focus": "Upper Power — Bench + back",
    "exercises": [
      "Barbell Bench Press — 3×4 @ RPE 7",
      "Weighted Pull-Up / Lat Pulldown — 3×6–10",
      "Incline Dumbbell Press — 2×8–12",
      "Chest-Supported Dumbbell Row — 2×8–12",
      "Cable Lateral Raise — 2×12–20",
      "Rope Triceps Pushdown — 2×10–15"
    ],
    "guidance": "5–7 min ramp-up; 2–3 min bench rests, 60–90 sec accessories. Superset incline press with rows and lateral raises with pushdowns. Stop heavy sets with 1–2 reps in reserve. Target 55–60 min.",
    "offsetDays": 21
  },
  {
    "day": "Week 4 — Day 2",
    "focus": "Lower Power — Deadlift week",
    "exercises": [
      "Conventional Deadlift — 3×3 @ RPE 8",
      "Hack Squat / Leg Press — 3×8–12",
      "Leg Curl Attachment — 3×10–15",
      "Leg Extension Attachment — 2×12–15",
      "Standing Calf Raise — 2×10–20",
      "Hanging Knee / Leg Raise — 2×8–15"
    ],
    "guidance": "Only conventional deadlifts this week; no other heavy barbell squat/deadlift exposure. Warm up 6–8 min, rest 2–3 min on primary lift, 60–90 sec elsewhere. Superset leg extension with calves. Target 55–60 min.",
    "offsetDays": 22
  },
  {
    "day": "Week 4 — Day 3",
    "focus": "Upper Hypertrophy — Chest, back, delts + arms",
    "exercises": [
      "Flat Dumbbell Bench Press — 3×8–12",
      "One-Arm Dumbbell Row — 3×8–12/side",
      "Seated Dumbbell Shoulder Press — 2×8–12",
      "Lat Pulldown — 2×10–15",
      "Cable Lateral Raise — 3×12–20",
      "Cable Curl — 3×10–15",
      "Overhead Cable Triceps Extension — 3×10–15"
    ],
    "guidance": "Hypertrophy only; 1–2 reps in reserve, final isolation set optionally 0–1. Superset press/row, pulldown/lateral raise, and curls/triceps. 60–75 sec accessory rests. Target 50–60 min.",
    "offsetDays": 24
  },
  {
    "day": "Week 4 — Day 4",
    "focus": "Full-Body Hypertrophy — Legs + vanity pump",
    "exercises": [
      "Leg Press / Hack Squat — 3×10–15",
      "Romanian Deadlift (moderate dumbbells) — 2×8–12",
      "Leg Curl Attachment — 2×12–15",
      "Cable Chest Fly — 2×12–15",
      "Cable Rear-Delt Fly / Face Pull — 2×15–20",
      "Dumbbell Hammer Curl — 2×10–15",
      "Rope Triceps Pushdown — 2×10–15",
      "Plank — 2×30–60 sec"
    ],
    "guidance": "No heavy barbell squat or deadlift. Moderate RDLs are accessory work; omit if posterior-chain recovery is limited. Superset chest fly/rear delts, curls/pushdowns. Keep transitions tight; 50–60 min.",
    "offsetDays": 26
  }
];
export const FOUNDER_SPECIAL_V2_PROGRESSION = "Four-week hypertrophy-first powerbuilding block. Bench twice weekly (one heavy barbell session and one dumbbell volume session). Alternate barbell squat on Weeks 1 and 3 with conventional deadlift on Weeks 2 and 4; never both in the same week. Main lift: keep 1–3 reps in reserve, never grind or test a max. Accessories: double progression, add reps until the top of the range across sets, then add the smallest practical load. Keep most accessory sets at 1–2 reps in reserve, with optional near-failure on the last isolation set. Weeks 1–3 build quality volume/intensity; Week 4 reduces bench volume and maintains deadlift practice. After Week 4 take a lighter week (roughly half accessory sets and lighter main lifts) before repeating with modest load increases. Sessions have a strict 60-minute cap: drop the final optional core/isolation set rather than rush main-lift technique.";
export const FOUNDER_SPECIAL_V2_DURATION = "4 weeks · 4 days/week · 16 sessions · 50–60 minutes/session";
export const FOUNDER_SPECIAL_V2_ACCURACY_NOTE = "Original Gym Log advanced home-gym program. Built around rack, barbell, adjustable dumbbells/bench, pull-up bar, cable station, leg extension/curl attachment, and hack squat/leg press. Alternates heavy squat and deadlift weeks; prioritizes muscle growth while maintaining strength. Session times are targets, not guarantees.";
