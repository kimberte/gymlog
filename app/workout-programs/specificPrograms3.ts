import type { ProgramWorkout } from "./programWorkouts";

export type SpecificProgram3 = { workouts: ProgramWorkout[]; progression: string; accuracyNote: string };
const w = (day: string, focus: string, exercises: string[], guidance: string): ProgramWorkout => ({ day, focus, exercises, guidance });

export const SPECIFIC_PROGRAMS_3: Record<string, SpecificProgram3> = {
  "powerbuilding-4-day": {
    workouts: [
      w("Day 1", "Lower strength", ["Back Squat — primary strength work", "Romanian Deadlift — 3–4 sets", "Leg Press — 3–4 sets", "Leg Curl — 3–4 sets", "Abs — 3 sets"], "A Gym Log powerbuilding template combining a heavy compound with moderate hypertrophy volume."),
      w("Day 2", "Upper strength", ["Bench Press — primary strength work", "Barbell Row — 3–4 sets", "Overhead Press — 3 sets", "Lat Pulldown or Pull-Up — 3–4 sets", "Triceps — 2–3 sets"], "Keep the first movement strength-focused and use accessories for additional volume."),
      w("Day 3", "Lower hypertrophy", ["Deadlift — controlled heavy work", "Front Squat or Hack Squat — 3–4 sets", "Leg Extension — 3 sets", "Leg Curl — 3 sets", "Calves — 3–4 sets"], "Use enough volume to build muscle without turning every accessory into maximal effort."),
      w("Day 4", "Upper hypertrophy", ["Incline Press — 3–4 sets", "Chest-Supported Row — 3–4 sets", "Machine or Dumbbell Press — 3 sets", "Lateral Raise — 3–4 sets", "Curl + Triceps — 2–3 sets each"], "This is a Gym Log template rather than a single author's official prescription."),
    ],
    progression: "Use progressive overload on the primary lifts while adding reps or load on accessory work when the target range is completed with good technique.",
    accuracyNote: "Powerbuilding 4-Day is a broad program category rather than one universally standardized routine, so this page is intentionally presented as a Gym Log template."
  },
  "powerbuilding-5-day": {
    workouts: [
      w("Day 1", "Squat strength", ["Back Squat — primary strength work", "Paused Squat — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Abs — 3 sets"], "Start the week with a competition-style lower-body strength emphasis."),
      w("Day 2", "Bench strength", ["Bench Press — primary strength work", "Close-Grip Bench — 3 sets", "Row — 4 sets", "Pulldown — 3 sets", "Triceps — 3 sets"], "Keep pressing technique consistent and use assistance to build volume."),
      w("Day 3", "Back + posterior chain", ["Deadlift — primary strength work", "Romanian Deadlift — 3 sets", "Chest-Supported Row — 4 sets", "Lat Pulldown — 3 sets", "Curl — 3 sets"], "Manage fatigue because the deadlift is the main strength stressor."),
      w("Day 4", "Upper hypertrophy", ["Incline Dumbbell Press — 3–4 sets", "Machine Press — 3 sets", "Cable Row — 3–4 sets", "Lateral Raise — 4 sets", "Arms — 3 sets each"], "Use moderate reps and controlled execution."),
      w("Day 5", "Lower hypertrophy", ["Front Squat or Hack Squat — 3–4 sets", "Hip Hinge — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Calves — 4 sets"], "Finish the week with muscle-building volume rather than another maximal strength day."),
    ],
    progression: "Progress the main powerlifting movements through planned load increases and progress accessories with double progression or small load jumps.",
    accuracyNote: "Powerbuilding 5-Day is a Gym Log template category, not a single canonical published program."
  },
  "bench-specialization": {
    workouts: [
      w("Day 1", "Heavy bench", ["Bench Press — heavy top work", "Paused Bench — 3–4 sets", "Row — 4 sets", "Triceps — 3–4 sets"], "Keep the heavy bench work technically repeatable; assistance supports pressing strength."),
      w("Day 2", "Lower body", ["Squat — 3–5 sets", "Romanian Deadlift — 3 sets", "Leg Press — 3 sets", "Core — 3 sets"], "Maintain lower-body strength without letting it interfere with bench recovery."),
      w("Day 3", "Bench volume", ["Bench Press — moderate-volume work", "Incline Press — 3 sets", "Lat Pulldown — 3–4 sets", "Lateral Raise — 3 sets", "Triceps — 3 sets"], "Use a lighter load than Day 1 and accumulate quality repetitions."),
    ],
    progression: "Increase bench volume or load gradually while retaining at least one heavier exposure and managing fatigue. The exact percentage scheme depends on the specialization method selected.",
    accuracyNote: "Bench Press Specialization is a generic specialization template; it is not attributed to one author's proprietary program."
  },
  "squat-specialization": {
    workouts: [
      w("Day 1", "Heavy squat", ["Back Squat — heavy primary work", "Paused Squat — 3 sets", "Leg Curl — 3 sets", "Abs — 3 sets"], "Prioritize squat technique and recovery."),
      w("Day 2", "Upper maintenance", ["Bench Press — 3–4 sets", "Row — 4 sets", "Overhead Press — 3 sets", "Pulldown — 3 sets", "Arms — 2–3 sets"], "Maintain upper-body progress while squat volume is prioritized."),
      w("Day 3", "Squat volume", ["Back Squat — moderate-volume work", "Front Squat — 3 sets", "Romanian Deadlift — 3 sets", "Leg Extension — 3 sets", "Calves — 3 sets"], "Use the second squat exposure for productive volume rather than constant maxing."),
    ],
    progression: "Progress the squat through a planned heavy/volume structure, increasing load or reducing repetitions as the block advances while keeping assistance recoverable.",
    accuracyNote: "Squat Specialization is a Gym Log specialization template rather than a single canonical published routine."
  },
  "deadlift-specialization": {
    workouts: [
      w("Day 1", "Heavy deadlift", ["Deadlift — heavy primary work", "Romanian Deadlift — 3 sets", "Row — 4 sets", "Abs — 3 sets"], "Use strict technique and avoid unnecessary grinding."),
      w("Day 2", "Upper maintenance", ["Bench Press — 3–4 sets", "Overhead Press — 3 sets", "Pulldown — 3–4 sets", "Lateral Raise — 3 sets", "Triceps — 3 sets"], "Keep upper-body work productive but secondary to deadlift recovery."),
      w("Day 3", "Deadlift volume + posterior chain", ["Deadlift Variation — moderate volume", "Front Squat — 3 sets", "Leg Curl — 3–4 sets", "Back Extension — 3 sets", "Core — 3 sets"], "Choose a variation that reinforces the weak point without excessive fatigue."),
    ],
    progression: "Use one heavy exposure and one controlled volume/variation exposure, adding load gradually while managing posterior-chain fatigue.",
    accuracyNote: "Deadlift Specialization is a Gym Log template rather than a single canonical published program."
  },
  "powerlifting-3-day": {
    workouts: [
      w("Day 1", "Squat + bench", ["Squat — primary competition lift", "Bench Press — primary competition lift", "Row — 3–4 sets", "Hamstring Work — 3 sets", "Abs — 3 sets"], "A general three-day powerlifting template built around the competition lifts."),
      w("Day 2", "Deadlift + bench", ["Deadlift — primary competition lift", "Bench Press — volume or variation", "Lat Pulldown — 3–4 sets", "Single-Leg Work — 3 sets", "Triceps — 3 sets"], "Keep deadlift volume recoverable and use the bench exposure for additional practice."),
      w("Day 3", "Squat + bench volume", ["Squat — volume or variation", "Bench Press — primary/volume work", "Row — 3–4 sets", "Leg Curl — 3 sets", "Core — 3 sets"], "A simple weekly frequency of two squat/bench exposures and one deadlift exposure."),
    ],
    progression: "Use a periodized strength block with increasing specificity and intensity as a meet approaches. Exact percentages should be selected for the lifter and training phase.",
    accuracyNote: "Powerlifting 3-Day is a Gym Log template category, not one universally standardized program."
  },
  "powerlifting-5-day": {
    workouts: [
      w("Day 1", "Squat strength", ["Squat — heavy work", "Paused Squat — 3 sets", "Leg Curl — 3 sets", "Abs — 3 sets"], "Competition-lift priority with targeted lower-body assistance."),
      w("Day 2", "Bench strength", ["Bench Press — heavy work", "Close-Grip Bench — 3 sets", "Row — 4 sets", "Triceps — 3 sets"], "Use the second press movement to build bench-specific volume."),
      w("Day 3", "Deadlift", ["Deadlift — heavy/moderate work", "Romanian Deadlift — 3 sets", "Pulldown — 3 sets", "Core — 3 sets"], "Keep the deadlift day focused and recoverable."),
      w("Day 4", "Bench volume", ["Bench Press — volume work", "Incline Press — 3 sets", "Chest-Supported Row — 4 sets", "Lateral Raise — 3 sets", "Triceps — 3 sets"], "Additional bench practice without duplicating the heaviest exposure."),
      w("Day 5", "Squat volume + accessories", ["Squat Variation — volume work", "Front Squat or Leg Press — 3 sets", "Leg Curl — 3 sets", "Back Extension — 3 sets", "Abs — 3 sets"], "Use this session to accumulate quality lower-body volume before the recovery days."),
    ],
    progression: "A five-day powerlifting template can use separate strength and volume exposures, then shift toward higher specificity and lower fatigue as competition approaches.",
    accuracyNote: "Powerlifting 5-Day is a Gym Log template category, not one universally standardized routine."
  },
  "6-day-bodybuilding": {
    workouts: [
      w("Day 1", "Chest + triceps", ["Press — 3–4 sets", "Incline Press — 3–4 sets", "Fly — 3 sets", "Lateral Raise — 3 sets", "Triceps — 3–4 sets"], "High-frequency bodybuilding template; distribute volume so recovery remains manageable."),
      w("Day 2", "Back + biceps", ["Pulldown or Pull-Up — 3–4 sets", "Row — 4 sets", "Chest-Supported Row — 3 sets", "Rear Delt Fly — 3 sets", "Curl — 3–4 sets"], "Use multiple pulling angles to cover the back musculature."),
      w("Day 3", "Legs", ["Squat or Hack Squat — 3–4 sets", "Romanian Deadlift — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Calves — 4 sets"], "Keep effort high but manage weekly fatigue."),
      w("Day 4", "Shoulders + arms", ["Overhead Press — 3 sets", "Lateral Raise — 4 sets", "Rear Delt Fly — 3 sets", "Curl — 3 sets", "Triceps Extension — 3 sets"], "Emphasize delts and arms with controlled hypertrophy work."),
      w("Day 5", "Chest + back", ["Incline Press — 3 sets", "Machine Press — 3 sets", "Row — 3–4 sets", "Pulldown — 3 sets", "Arms — 2–3 sets each"], "Pair upper-body muscle groups while keeping total volume sustainable."),
      w("Day 6", "Legs + weak points", ["Front Squat or Hack Squat — 3 sets", "Hip Hinge — 3 sets", "Leg Extension — 3 sets", "Leg Curl — 3 sets", "Calves + Weak Point — 3 sets"], "Finish with lower-body volume and a small amount of individualized weak-point work."),
    ],
    progression: "Progress exercises through rep targets and gradual load increases, using planned volume and occasional deloads when performance or recovery declines.",
    accuracyNote: "6-Day Bodybuilding Split is a Gym Log template category rather than one canonical bodybuilding program."
  },
  "german-volume-training": {
    workouts: [
      w("Day 1", "Chest + back", ["Bench Press — 10×10", "Row — 10×10", "Optional small accessory"], "Classic GVT centers on high-volume 10×10 work; use conservative loads and controlled rest."),
      w("Day 2", "Legs", ["Squat — 10×10", "Leg Curl — 3×10", "Calf Raise — 3×10"], "The defining work is the repeated 10-set movement; avoid adding excessive extra volume."),
      w("Day 3", "Rest", ["Recovery / mobility"], "GVT is demanding; recovery is part of the method."),
      w("Day 4", "Shoulders + arms", ["Overhead Press — 10×10", "Curl — 3×10", "Triceps Extension — 3×10", "Lateral Raise — 3×10"], "Keep the main 10×10 movement submaximal and technically consistent."),
      w("Day 5", "Posterior chain + upper", ["Deadlift or Romanian Deadlift — controlled volume", "Incline Press — 3×10", "Pulldown — 3×10", "Abs — 3×10"], "Variations of GVT differ; use the version you selected consistently."),
    ],
    progression: "Traditional GVT uses 10 sets of 10 at a relatively light percentage with the same load across sets. Progress by completing all prescribed reps before making a small load increase.",
    accuracyNote: "GVT has multiple versions. The hallmark 10×10 method is represented here; the exact exercise split varies by source and era."
  },
  "mountain-dog-training": {
    workouts: [
      w("Day 1", "Chest", ["Chest Press — controlled heavy/moderate work", "Incline Press — 3–4 sets", "Fly — 3–4 sets", "Pump / stretch-focused chest work"], "Mountain Dog programming is known for varied exercise selection, controlled execution and targeted muscle-building volume."),
      w("Day 2", "Back", ["Pulldown — 3–4 sets", "Row — 3–4 sets", "Chest-Supported Row — 3 sets", "Pullover — 3 sets", "Rear Delt Work — 3 sets"], "Use deliberate execution and choose movements that load the target tissue without unnecessary joint stress."),
      w("Day 3", "Legs", ["Squat or Leg Press — 3–4 sets", "Hip Hinge — 3 sets", "Leg Extension — 3 sets", "Leg Curl — 3 sets", "Calves — 4 sets"], "Leg sessions often combine heavier work with high-rep pump work."),
      w("Day 4", "Shoulders + arms", ["Press — 3 sets", "Lateral Raise — 4 sets", "Rear Delt Work — 3 sets", "Curl — 3–4 sets", "Triceps — 3–4 sets"], "Exercise selection and intensity techniques should be adjusted to the individual."),
      w("Day 5", "Weak points / hypertrophy", ["Priority Muscle — 3–4 sets", "Secondary Compound — 3 sets", "Isolation Work — 3–4 sets", "Pump Finisher — 2–3 sets"], "Use this day to bring up lagging areas rather than simply adding more fatigue everywhere."),
    ],
    progression: "Mountain Dog-style training emphasizes progressive overload, exercise rotation, muscle-specific execution and strategic high-rep work. Exact weekly programming varies across John Meadows' routines.",
    accuracyNote: "Mountain Dog Training refers to a family of John Meadows bodybuilding methods and programs, not one fixed routine; this page summarizes the approach rather than reproducing a proprietary program."
  },
  "rp-male-physique": {
    workouts: [
      w("Day 1", "Chest + back", ["Press — 3–4 sets", "Incline Press — 3 sets", "Pulldown — 3–4 sets", "Row — 3–4 sets", "Rear Delts — 2–3 sets"], "Use moderate-to-high hypertrophy volume and track performance across the mesocycle."),
      w("Day 2", "Shoulders + arms", ["Overhead Press — 3 sets", "Lateral Raise — 4 sets", "Curl — 3–4 sets", "Triceps Extension — 3–4 sets", "Rear Delts — 2–3 sets"], "Prioritize target-muscle stimulus and keep technique consistent."),
      w("Day 3", "Legs", ["Squat or Hack Squat — 3–4 sets", "Romanian Deadlift — 3 sets", "Leg Press — 3 sets", "Leg Curl — 3 sets", "Calves — 4 sets"], "Adjust volume to recovery and progression rather than chasing fatigue."),
      w("Day 4", "Upper", ["Bench or Incline Press — 3 sets", "Row — 3–4 sets", "Pulldown — 3 sets", "Lateral Raise — 3 sets", "Arms — 2–3 sets each"], "Use a balanced upper-body session to reinforce weekly frequency."),
      w("Day 5", "Lower + weak points", ["Squat Variation — 3 sets", "Hip Hinge — 3 sets", "Leg Extension — 3 sets", "Leg Curl — 3 sets", "Weak Point Work — 2–4 sets"], "RP-style volume should be adjusted according to stimulus, fatigue and recovery."),
    ],
    progression: "Renaissance Periodization programming generally uses planned volume, rep progression and fatigue management within mesocycles, with volume adjusted according to individual response.",
    accuracyNote: "This is a high-level Gym Log template inspired by RP hypertrophy principles, not a reproduction of a specific paid RP male physique template."
  }
};
