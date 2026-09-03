import type { ProgramWorkout } from "./programWorkouts";

export type SpecificProgram2 = {
  workouts: ProgramWorkout[];
  progression: string;
  accuracyNote: string;
};

const w = (day: string, focus: string, exercises: string[], guidance: string): ProgramWorkout => ({ day, focus, exercises, guidance });

export const SPECIFIC_PROGRAMS_2: Record<string, SpecificProgram2> = {
  "nsuns-531": {
    workouts: [
      w("Day 1", "Squat + bench volume", ["Squat — nSuns 5/3/1 ladder", "Bench Press — high-volume ladder", "Row — 4×8–12", "Lat work — 4×8–12"], "Use the selected nSuns spreadsheet for the exact daily percentages and AMRAP target."),
      w("Day 2", "Deadlift + overhead press", ["Deadlift — nSuns 5/3/1 ladder", "Overhead Press — high-volume ladder", "Pull-Up or Lat Pulldown — 4×8–12", "Leg accessory — 3×8–12"], "The high volume is a defining feature; manage accessories around recovery."),
      w("Day 3", "Bench + squat", ["Bench Press — nSuns ladder", "Squat — volume ladder", "Row — 4×8–12", "Arms or delts — 3×8–15"], "Different nSuns spreadsheets use different lift orders; keep the chosen template consistent."),
      w("Day 4", "Overhead press + deadlift", ["Overhead Press — nSuns ladder", "Deadlift — volume ladder", "Pulling accessory — 4×8–12", "Core — 3–5 sets"], "AMRAP performance drives weekly progression in many nSuns variants."),
    ],
    progression: "nSuns is a high-volume 5/3/1-derived system with several 4-, 5- and 6-day templates. Progression is built into the chosen spreadsheet and commonly uses AMRAP performance to increase training weights weekly.",
    accuracyNote: "This summarizes the common nSuns 4-day structure; nSuns has multiple templates, so exact percentages and lift order should come from the specific version selected."
  },
  "531-bbb": {
    workouts: [
      w("Day 1", "Overhead Press + volume", ["Overhead Press — 5/3/1", "Overhead Press — 5×10 @ 50% TM", "Rows or Chin-Ups — 25–50 total reps", "Abs — 25–50 total reps"], "The classic BBB template uses a Training Max; the 5×10 work is deliberately submaximal."),
      w("Day 2", "Deadlift + volume", ["Deadlift — 5/3/1", "Deadlift — 5×10 @ 50% TM", "Face Pulls — 25–50 total reps", "Abs — 25–50 total reps"], "Keep assistance work limited so the supplemental volume remains recoverable."),
      w("Day 3", "Bench + volume", ["Bench Press — 5/3/1", "Bench Press — 5×10 @ 50% TM", "Rows or Chin-Ups — 25–50 total reps", "Abs — 25–50 total reps"], "The classic same-lift version is shown here; Wendler also publishes an opposite-lift option."),
      w("Day 4", "Squat + volume", ["Squat — 5/3/1", "Squat — 5×10 @ 50% TM", "Face Pulls — 25–50 total reps", "Abs — 25–50 total reps"], "Run four sessions across the week with recovery between lower-body sessions."),
    ],
    progression: "Use the standard 5/3/1 percentage wave against a Training Max, then perform 5×10 supplemental work. Wendler's BBB challenge can progress the supplemental 5×10 from 50% to 60% to 70% TM across three months; the base BBB template is commonly kept at 50%.",
    accuracyNote: "Based on Jim Wendler's published Boring But Big templates; this page intentionally distinguishes the classic 50% version from the separate three-month BBB challenge."
  },
  "gzcl-jacked-tan": {
    workouts: [
      w("Day 1", "Lower / squat T1", ["Squat — T1 rep-max work", "Front Squat — T2 volume", "Barbell Row — T3 high-rep work", "Leg Extension — T3", "Leg Curl — T3"], "T1 uses a descending rep-max progression; T2 and T3 add volume at higher rep ranges."),
      w("Day 2", "Upper / bench T1", ["Bench Press — T1 rep-max work", "Overhead Press — T2 volume", "Lat Pulldown — T2/T3 volume", "Lateral Raise — T3", "Triceps Pressdown — T3"], "Keep the final high-rep sets controlled; the program is intentionally high volume."),
      w("Day 3", "Lower / deadlift T1", ["Deadlift — T1 rep-max work", "Squat or Front Squat — T2 volume", "Row — T2/T3 volume", "Leg Curl — T3", "Calf Raise — T3"], "Rep-max targets descend across the block while supplemental work builds volume."),
      w("Day 4", "Upper / press T1", ["Overhead Press — T1 rep-max work", "Bench Press — T2 volume", "Pull-Up or Pulldown — T2/T3", "Curl — T3", "Rear Delt Work — T3"], "Use the exact spreadsheet for weekly percentages, rep targets and exercise substitutions."),
    ],
    progression: "Jacked & Tan 2.0 uses T1 rep-max work, T2 supplemental work and T3 high-rep work. T1 target reps descend through the block while loads are adjusted from training maxes; AMRAP-style work helps drive progression.",
    accuracyNote: "The tier structure and progression model are represented here, but the complete Jacked & Tan spreadsheet contains many week-by-week percentage details that are better followed from the original template."
  },
  "arnold-golden-six": {
    workouts: [
      w("Workout A", "Full body", ["Back Squat — 4×10", "Bench Press — 3×10", "Chin-Up or Pulldown — 3×10", "Overhead Press — 4×10", "Barbell Curl — 3×10", "Sit-Up — 3×10"], "Train three days per week with a rest day between sessions when possible."),
      w("Workout B", "Full body", ["Back Squat — 4×10", "Bench Press — 3×10", "Chin-Up or Pulldown — 3×10", "Overhead Press — 4×10", "Barbell Curl — 3×10", "Sit-Up — 3×10"], "The Golden Six is deliberately simple; focus on consistent technique and gradual load increases."),
      w("Workout A", "Full body", ["Back Squat — 4×10", "Bench Press — 3×10", "Chin-Up or Pulldown — 3×10", "Overhead Press — 4×10", "Barbell Curl — 3×10", "Sit-Up — 3×10"], "Keep sessions separated by recovery days and progress conservatively."),
    ],
    progression: "The classic Golden Six is a three-day full-body routine built around six movements and mostly 3–4 sets of 10. Progress by adding small amounts of weight while maintaining the target reps.",
    accuracyNote: "Template reflects the commonly published Arnold Golden Six routine; chin-ups may be substituted with a pulldown when needed."
  },
  "dorian-yates-blood-and-guts": {
    workouts: [
      w("Day 1", "Shoulders + triceps + abs", ["Shoulder Press — warm-up + 1 all-out working set", "Lateral Raise — 1 hard working set", "Rear Delt Fly — 1 hard working set", "Triceps Pressdown — 1 hard working set", "Skull Crusher — 1 hard working set", "Abs — 2–3 sets"], "Blood & Guts is a high-intensity, low-volume bodybuilding approach; warm-ups are not counted as the single hard work set."),
      w("Day 2", "Back + rear delts", ["Pulldown or Pull-Up — 1 hard working set", "Barbell or Machine Row — 1 hard working set", "Cable Row — 1 hard working set", "Pullover — 1 hard working set", "Rear Delt Fly — 1 hard working set"], "Use controlled reps and an appropriate warm-up before the intense work sets."),
      w("Day 3", "Chest + biceps", ["Incline Press — 1 hard working set", "Machine or Dumbbell Press — 1 hard working set", "Fly — 1 hard working set", "Barbell Curl — 1 hard working set", "Preacher Curl — 1 hard working set"], "The defining feature is effort and low working-set volume rather than accumulating many sets."),
      w("Day 4", "Legs", ["Leg Extension — 1 hard working set", "Leg Press — 1 hard working set", "Squat or Hack Squat — 1 hard working set", "Leg Curl — 1 hard working set", "Stiff-Leg Deadlift — 1 hard working set", "Calf Raise — 1–2 hard working sets"], "Allow substantial recovery after the high-intensity leg session."),
    ],
    progression: "Dorian Yates' Blood & Guts style emphasizes progressive overload using very hard working sets after thorough warm-ups. Exact exercise order and intensity techniques vary by edition and routine phase.",
    accuracyNote: "This is a faithful high-level representation of the Blood & Guts high-intensity philosophy, not a claim to reproduce every exercise or intensity technique from the original video/book."
  },
  "russian-squat-routine": {
    workouts: [
      w("Week 1", "Squat volume", ["Back Squat — 80% 1RM × 6×2", "Optional upper-body assistance"], "The classic six-week Russian Squat Routine uses three squat sessions per week."),
      w("Week 2", "Squat volume", ["Back Squat — 80% × 6×3", "Optional assistance"], "Increase squat volume while keeping the prescribed percentage controlled."),
      w("Week 3", "Squat volume", ["Back Squat — 80% × 6×4", "Optional assistance"], "This is a demanding accumulation phase; prioritize recovery."),
      w("Week 4", "Intensity", ["Back Squat — 85% × 5×5", "Optional assistance"], "The program shifts toward heavier work as volume begins to fall."),
      w("Week 5", "Intensity", ["Back Squat — 85% × 4×4", "Optional assistance"], "Keep the prescribed percentage rather than turning every set into a max effort."),
      w("Week 6", "Peak / test", ["Back Squat — 95% × 3×2", "Back Squat — test new max after recovery"], "The classic cycle culminates in heavy work and a max test rather than normal high-volume training."),
    ],
    progression: "The classic Russian Squat Routine is a six-week, three-day-per-week squat cycle progressing from 6×2 through 6×4, then reducing volume while increasing intensity before a test.",
    accuracyNote: "Percentages shown are the commonly published classic six-week template; assistance work is intentionally left flexible because the squat cycle is the core prescription."
  },
  "mag-ort-deadlift": {
    workouts: [
      w("Day 1", "Deadlift volume", ["Deadlift — prescribed percentage/reps", "Back Raise — moderate volume", "Abdominal Work — 3–4 sets"], "The Mag/Ort cycle is a specialized deadlift program; use the original table for the exact percentage and rep prescription for each week."),
      w("Day 2", "Deadlift assistance", ["Deadlift or Speed Pull — prescribed work", "Row — 3–4×8–12", "Leg Curl — 3×8–12"], "Keep assistance subordinate to the deadlift progression."),
      w("Day 3", "Deadlift intensity", ["Deadlift — prescribed heavy work", "Upper-back Work — 3–4 sets", "Core — 3–4 sets"], "Recovery is a major part of the program because deadlift frequency and volume can be demanding."),
    ],
    progression: "The Mag/Ort program is a percentage-based deadlift specialization cycle. Exact loads and reps are calculated from a starting max and increase through the prescribed progression table.",
    accuracyNote: "The program exists in several circulated versions; this page identifies the defining deadlift-specialization structure without inventing a universal percentage table."
  },
  "westside-conjugate": {
    workouts: [
      w("Day 1", "Max Effort Lower", ["Max-Effort Squat or Deadlift Variation — work to a heavy single/triple", "Posterior Chain Accessory — 3–5 sets", "Abs — 3–5 sets"], "Rotate the main variation regularly rather than testing the competition lift every week."),
      w("Day 2", "Max Effort Upper", ["Max-Effort Bench Variation — heavy single/triple", "Upper-Back Work — 3–5 sets", "Triceps — 3–5 sets", "Rear Delts — 3–5 sets"], "The max-effort movement is followed by substantial upper-body assistance."),
      w("Day 3", "Dynamic Effort Lower", ["Speed Squat — multiple fast sets", "Speed Deadlift — multiple fast sets", "Hamstring / Glute Work — 3–5 sets", "Abs — 3–5 sets"], "Use submaximal loads with maximal bar speed rather than grinding."),
      w("Day 4", "Dynamic Effort Upper", ["Speed Bench — multiple fast sets", "Row — 3–5 sets", "Triceps — 3–5 sets", "Rear Delts — 3–5 sets"], "Dynamic work is performed explosively with controlled fatigue."),
    ],
    progression: "The Westside conjugate approach rotates max-effort variations and uses dynamic-effort work plus targeted accessories. Exact percentages, accommodating resistance and exercise rotation are individualized within the system.",
    accuracyNote: "This page represents the classic four-day Westside conjugate framework, not one fixed Westside spreadsheet. Modern Westside programming varies by lifter and equipment."
  },
  "sheiko-beginner": {
    workouts: [
      w("Session 1", "Competition-lift volume", ["Squat — multiple submaximal sets", "Bench Press — multiple submaximal sets", "Accessory / back work — moderate volume"], "Sheiko programming is characterized by repeated competition lifts and substantial submaximal volume."),
      w("Session 2", "Bench + squat/deadlift", ["Bench Press — multiple sets", "Deadlift — multiple sets", "Squat variation — multiple sets", "Accessories"], "Use the exact Sheiko template for the session's percentage and set prescriptions."),
      w("Session 3", "Competition-lift volume", ["Squat — multiple sets", "Bench Press — multiple sets", "Deadlift or pull variation — multiple sets", "Accessories"], "The beginner templates emphasize practice and volume rather than frequent maximal attempts."),
    ],
    progression: "Sheiko beginner programming uses percentage-based, high-frequency practice of the squat, bench and deadlift with substantial submaximal volume. Progression is driven by the planned training block rather than session-to-session maxing.",
    accuracyNote: "Sheiko has multiple beginner templates and editions; exact sets, reps and percentages should come from the specific template being run."
  },
  "candito-linear": {
    workouts: [
      w("Day 1", "Strength", ["Squat — 4×6", "Bench Press — 4×6", "Barbell Row — 4×6", "Accessory work"], "The Candito Linear Program uses a simple strength-focused progression before transitioning to heavier work."),
      w("Day 2", "Upper / posterior", ["Deadlift — prescribed sets", "Overhead Press — prescribed sets", "Pull-Up or Row — 3–4 sets", "Accessory work"], "Keep the deadlift work technically clean and recover before the next lower-body session."),
      w("Day 3", "Strength", ["Squat — prescribed sets", "Bench Press — prescribed sets", "Row — prescribed sets", "Accessory work"], "The exact weekly loading should follow the current Candito template rather than a fixed generic percentage."),
    ],
    progression: "Candito's linear program progresses training loads through planned weekly increases and uses different rep ranges across the week. It is distinct from the six-week Candito program and should not be treated as the same template.",
    accuracyNote: "This page distinguishes Candito Linear from Candito's Six Week Program; exact loading should follow the author's current published template."
  },
  "easy-strength": {
    workouts: [
      w("Day A", "Frequent submaximal practice", ["Squat — 2×5", "Bench Press or Press — 2×5", "Deadlift — 2×5 or 5/3/1 style work", "Pull-Up — 2×5"], "Easy Strength is built around frequent, submaximal practice rather than exhaustive sessions."),
      w("Day B", "Frequent submaximal practice", ["Squat — 2×5", "Press or Bench — 2×5", "Deadlift — 2×5 or variation", "Row or Pull-Up — 2×5"], "Keep the work comfortably submaximal and finish feeling capable of doing more."),
      w("Day A", "Repeat", ["Squat — 2×5", "Press / Bench — 2×5", "Deadlift — 2×5", "Pull — 2×5"], "The original concept is typically performed five days per week for a limited block, with exercise variations rotated as appropriate."),
      w("Day B", "Repeat", ["Squat — 2×5", "Press / Bench — 2×5", "Deadlift — 2×5", "Row / Pull-Up — 2×5"], "Avoid turning the program into a daily max-out; the low fatigue is the point."),
      w("Day A", "Repeat", ["Squat — 2×5", "Press / Bench — 2×5", "Deadlift — 2×5", "Pull — 2×5"], "Use a conservative load that allows consistent practice across the block."),
    ],
    progression: "Easy Strength emphasizes consistency and submaximal performance over aggressive load increases. The classic approach uses frequent practice for roughly 40 sessions, with variations and loads adjusted to stay easy enough to repeat.",
    accuracyNote: "This is a practical summary of the Easy Strength concept associated with Dan John and Pavel Tsatsouline; exercise selection and exact loading vary by version."
  }
};
