import type { ProgramWorkout } from "./programWorkouts";

export type SpecificProgram5 = { workouts: ProgramWorkout[]; progression: string; accuracyNote: string };
const w = (day: string, focus: string, exercises: string[], guidance: string): ProgramWorkout => ({ day, focus, exercises, guidance });

export const SPECIFIC_PROGRAMS_5: Record<string, SpecificProgram5> = {
  "beginner-full-body-3": {
    workouts: [
      w("Day 1", "Full body", ["Squat", "Bench Press", "Lat Pulldown", "Romanian Deadlift", "Plank"], "Start conservatively and prioritize repeatable technique."),
      w("Day 2", "Full body", ["Deadlift", "Overhead Press", "Cable Row", "Split Squat", "Curl"], "Build consistency before chasing heavier loads."),
      w("Day 3", "Full body", ["Goblet Squat", "Incline Dumbbell Press", "Chest-Supported Row", "Leg Curl", "Triceps Pressdown"], "Use moderate volume and controlled reps."),
    ],
    progression: "Add small amounts of load when all work is completed with solid technique; hold the load steady when recovery or form suffers.",
    accuracyNote: "Gym Log original beginner full-body template based on established novice training principles; not a named published program."
  },
  "beginner-upper-lower": {
    workouts: [
      w("Day 1", "Upper", ["Bench Press", "Lat Pulldown", "Dumbbell Row", "Overhead Press", "Curl", "Triceps Pressdown"], "Keep most work moderate while learning technique."),
      w("Day 2", "Lower", ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raise", "Plank"], "Build consistency before adding aggressive load."),
      w("Day 3", "Upper", ["Incline Dumbbell Press", "Cable Row", "Machine Chest Press", "Lat Pulldown", "Lateral Raise", "Curl"], "Use controlled reps and manageable volume."),
      w("Day 4", "Lower", ["Trap-Bar Deadlift", "Split Squat", "Leg Extension", "Leg Curl", "Calf Raise", "Dead Bug"], "Progress gradually and protect technique."),
    ],
    progression: "Increase reps or load gradually once technique is consistent. Use an easier week when accumulated fatigue warrants it.",
    accuracyNote: "Gym Log original beginner upper/lower template."
  },
  "beginner-ppl": {
    workouts: [
      w("Day 1", "Push", ["Machine or Dumbbell Press", "Incline Dumbbell Press", "Machine Shoulder Press", "Lateral Raise", "Triceps Pressdown"], "Learn stable pressing mechanics before increasing load."),
      w("Day 2", "Pull", ["Lat Pulldown", "Seated Cable Row", "Chest-Supported Row", "Face Pull", "Dumbbell Curl"], "Use controlled full-range pulling."),
      w("Day 3", "Legs", ["Squat or Leg Press", "Romanian Deadlift", "Leg Extension", "Leg Curl", "Calf Raise", "Plank"], "Keep volume recoverable and repeatable."),
    ],
    progression: "Add reps within a target range before increasing weight. Beginners should prioritize technique and recovery.",
    accuracyNote: "Gym Log original beginner PPL template; not a canonical published prescription."
  },
  "beginner-dumbbell": {
    workouts: [
      w("Day 1", "Full body", ["Goblet Squat", "Dumbbell Bench Press", "One-Arm Row", "Dumbbell RDL", "Curl"], "Choose loads that allow controlled reps."),
      w("Day 2", "Full body", ["Dumbbell Split Squat", "Dumbbell Shoulder Press", "Chest-Supported Row", "Dumbbell Hip Thrust", "Lateral Raise"], "Use stable positions and avoid rushing."),
      w("Day 3", "Full body", ["Goblet Squat", "Incline Dumbbell Press", "One-Arm Row", "Dumbbell RDL", "Triceps Extension"], "Progress one variable at a time."),
    ],
    progression: "Increase reps within a sensible range before moving to the next dumbbell size.",
    accuracyNote: "Gym Log original beginner dumbbell template."
  },
  "beginner-machine": {
    workouts: [
      w("Day 1", "Full body", ["Leg Press", "Chest Press", "Lat Pulldown", "Seated Leg Curl", "Cable Row", "Machine Crunch"], "Machines simplify setup while beginners learn effort and range."),
      w("Day 2", "Full body", ["Hack Squat", "Shoulder Press", "Seated Cable Row", "Leg Extension", "Chest Fly", "Cable Curl"], "Use consistent machine settings and controlled reps."),
      w("Day 3", "Full body", ["Leg Press", "Incline Chest Press", "Lat Pulldown", "Leg Curl", "Lateral Raise", "Triceps Pressdown"], "Progress slowly and prioritize comfortable technique."),
    ],
    progression: "When work is completed with controlled technique, add a small amount of resistance or reps.",
    accuracyNote: "Gym Log original beginner machine template; equipment varies by gym."
  },
  "beginner-home": {
    workouts: [
      w("Day 1", "Home full body", ["Goblet or Bodyweight Squat", "Push-Up", "Dumbbell or Band Row", "Romanian Deadlift", "Plank"], "Choose variations that allow clean repetitions."),
      w("Day 2", "Home full body", ["Reverse Lunge", "Dumbbell Overhead Press", "Band Row", "Hip Thrust", "Dead Bug"], "Keep the session simple enough to repeat weekly."),
      w("Day 3", "Home full body", ["Split Squat", "Dumbbell Floor Press or Push-Up", "One-Arm Row", "Single-Leg RDL", "Side Plank"], "Increase reps or resistance gradually."),
    ],
    progression: "Progress through reps, resistance or harder bodyweight variations while keeping recovery manageable.",
    accuracyNote: "Gym Log original beginner home template with flexible equipment substitutions."
  },
  "3-day-muscle-building": {
    workouts: [
      w("Day 1", "Upper", ["Bench Press", "Lat Pulldown", "Incline Dumbbell Press", "Cable Row", "Lateral Raise", "Triceps Pressdown"], "Accumulate quality weekly volume."),
      w("Day 2", "Lower", ["Back Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raise", "Cable Crunch"], "Use controlled compound and isolation work."),
      w("Day 3", "Full body", ["Leg Press", "Overhead Press", "Chest-Supported Row", "Hip Thrust", "Curl", "Triceps Extension"], "Aim for steady progress without excessive fatigue."),
    ],
    progression: "Progress reps and load gradually while keeping working sets challenging but repeatable.",
    accuracyNote: "Gym Log original three-day muscle-building template."
  },
  "4-day-muscle-building": {
    workouts: [
      w("Day 1", "Upper A", ["Bench Press", "Lat Pulldown", "Incline Dumbbell Press", "Cable Row", "Lateral Raise", "Triceps Pressdown"], "Use compounds for progressive overload and accessories for volume."),
      w("Day 2", "Lower A", ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raise", "Abs"], "Keep lower-body volume recoverable."),
      w("Day 3", "Upper B", ["Incline Press", "Chest-Supported Row", "Machine Chest Press", "Pulldown", "Rear Delt Fly", "Curl"], "Balance pressing and pulling volume."),
      w("Day 4", "Lower B", ["Trap-Bar Deadlift", "Leg Press", "Bulgarian Split Squat", "Leg Extension", "Leg Curl", "Calves"], "Avoid making every movement maximal effort."),
    ],
    progression: "Track reps and load and make small improvements over time; reduce volume temporarily when recovery declines.",
    accuracyNote: "Gym Log original four-day muscle-building template."
  },
  "5-day-muscle-building": {
    workouts: [
      w("Day 1", "Chest + triceps", ["Bench Press", "Incline Dumbbell Press", "Machine Chest Press", "Cable Fly", "Lateral Raise", "Triceps Pressdown"], "Combine compounds with controlled isolation work."),
      w("Day 2", "Back + biceps", ["Lat Pulldown", "Chest-Supported Row", "Seated Cable Row", "One-Arm Row", "Curl", "Hammer Curl"], "Prioritize stable pulling mechanics."),
      w("Day 3", "Legs", ["Back Squat", "Romanian Deadlift", "Leg Press", "Leg Extension", "Leg Curl", "Calf Raise"], "Keep main lifts technically consistent."),
      w("Day 4", "Shoulders + arms", ["Overhead Press", "Lateral Raise", "Rear Delt Fly", "Curl", "Triceps Extension", "Hammer Curl"], "Use controlled isolation work."),
      w("Day 5", "Full body / weak points", ["Incline Press", "Pull-Up or Pulldown", "Hack Squat", "Hip Thrust", "Lateral Raise", "Weak-Point Accessory"], "Add useful volume rather than simply repeating the hardest work."),
    ],
    progression: "Use double progression where practical: add reps, then load, while managing fatigue across the week.",
    accuracyNote: "Gym Log original five-day muscle-building template."
  },
  "fat-loss-strength": {
    workouts: [
      w("Day 1", "Strength + full body", ["Squat", "Bench Press", "Lat Pulldown", "Romanian Deadlift", "Farmer Carry"], "Keep strength work challenging with sustainable volume."),
      w("Day 2", "Strength + conditioning", ["Deadlift", "Overhead Press", "Cable Row", "Split Squat", "Short Conditioning Finisher"], "Conditioning should not compromise strength recovery."),
      w("Day 3", "Full body + conditioning", ["Leg Press", "Incline Dumbbell Press", "Chest-Supported Row", "Leg Curl", "Intervals or Brisk Cardio"], "During a deficit, prioritize recovery and strength retention."),
    ],
    progression: "Aim to maintain or gradually improve strength while managing fatigue. Fat loss primarily depends on sustained energy balance.",
    accuracyNote: "Gym Log original strength-and-fat-loss template, not individualized nutrition advice."
  },
  "recomposition": {
    workouts: [
      w("Day 1", "Upper strength", ["Bench Press", "Row", "Overhead Press", "Lat Pulldown", "Curl", "Triceps Pressdown"], "Use progressive resistance as the weekly anchor."),
      w("Day 2", "Lower strength", ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raise", "Abs"], "Allow enough recovery for the next lower session."),
      w("Day 3", "Upper hypertrophy", ["Incline Dumbbell Press", "Chest-Supported Row", "Machine Chest Press", "Pulldown", "Lateral Raise", "Arms"], "Accumulate moderate volume with controlled reps."),
      w("Day 4", "Lower hypertrophy", ["Hack Squat", "Hip Thrust", "Leg Extension", "Leg Curl", "Calf Raise", "Abs"], "Build volume without excessive systemic fatigue."),
    ],
    progression: "Track training and body-composition trends over several weeks; prioritize adequate protein, recovery and sustainable nutrition.",
    accuracyNote: "Gym Log original recomposition template; results vary with training status and nutrition."
  },
  "30-minute-full-body": {
    workouts: [
      w("Day 1", "Efficient full body", ["Squat", "Bench Press", "Lat Pulldown", "Romanian Deadlift"], "Keep setup efficient and compound technique solid."),
      w("Day 2", "Efficient full body", ["Trap-Bar Deadlift", "Overhead Press", "Cable Row", "Split Squat"], "Organize transitions so time is spent training."),
      w("Day 3", "Efficient full body", ["Leg Press", "Incline Dumbbell Press", "Chest-Supported Row", "Leg Curl"], "Use controlled supersets when they help maintain the time limit."),
    ],
    progression: "Log performance and aim for gradual improvements in reps or load. The format emphasizes consistency over exercise variety.",
    accuracyNote: "Gym Log original 30-minute full-body template."
  },
  "dumbbell-full-body": {
    workouts: [
      w("Day 1", "Dumbbell full body", ["Goblet Squat", "Dumbbell Bench Press", "One-Arm Row", "Dumbbell RDL", "Lateral Raise"], "Choose stable positions and consistent loads."),
      w("Day 2", "Dumbbell full body", ["Bulgarian Split Squat", "Incline Dumbbell Press", "Chest-Supported Row", "Dumbbell Hip Thrust", "Curl"], "Use unilateral work when equipment is limited."),
      w("Day 3", "Dumbbell full body", ["Dumbbell Front Squat", "Dumbbell Shoulder Press", "One-Arm Row", "Dumbbell RDL", "Triceps Extension"], "Keep movement balance consistent while progressing."),
    ],
    progression: "Increase reps within a chosen range before moving to the next dumbbell size; use control or extra reps when weight jumps are large.",
    accuracyNote: "Gym Log original dumbbell-only full-body template."
  },
  "dumbbell-upper-lower": {
    workouts: [
      w("Day 1", "Upper A", ["Dumbbell Bench Press", "One-Arm Row", "Dumbbell Shoulder Press", "Incline Dumbbell Press", "Lateral Raise", "Curl"], "Keep pressing and pulling balanced."),
      w("Day 2", "Lower A", ["Goblet Squat", "Dumbbell RDL", "Bulgarian Split Squat", "Dumbbell Step-Up", "Calf Raise", "Abs"], "Use unilateral work when load is limited."),
      w("Day 3", "Upper B", ["Incline Dumbbell Press", "Chest-Supported Row", "Dumbbell Floor Press", "One-Arm Row", "Rear Delt Fly", "Triceps Extension"], "Progress reps and load while maintaining stable positions."),
      w("Day 4", "Lower B", ["Dumbbell Front Squat", "Dumbbell Hip Thrust", "Reverse Lunge", "Single-Leg RDL", "Calf Raise", "Plank"], "Challenge the lower body without sacrificing recovery."),
    ],
    progression: "Use rep progression first, then increase dumbbell load where practical. Unilateral variations help when equipment is constrained.",
    accuracyNote: "Gym Log original dumbbell upper/lower template."
  }
};
