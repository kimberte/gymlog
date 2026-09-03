import type { ProgramWorkout } from "./programWorkouts";

export type SpecificProgram6 = { workouts: ProgramWorkout[]; progression: string; accuracyNote: string };
const w = (day: string, focus: string, exercises: string[], guidance: string): ProgramWorkout => ({ day, focus, exercises, guidance });

export const SPECIFIC_PROGRAMS_6: Record<string, SpecificProgram6> = {
  "home-upper-lower": { workouts: [
    w("Day 1", "Home upper", ["Dumbbell Bench Press", "One-Arm Dumbbell Row", "Dumbbell Shoulder Press", "Band Pulldown", "Lateral Raise", "Curl"], "Use the equipment available and keep pressing and pulling balanced."),
    w("Day 2", "Home lower", ["Goblet Squat", "Dumbbell RDL", "Bulgarian Split Squat", "Hip Thrust", "Calf Raise", "Plank"], "Use controlled unilateral work when load is limited."),
    w("Day 3", "Home upper", ["Incline Dumbbell Press", "Chest-Supported Row", "Dumbbell Floor Press", "Band Row", "Rear Delt Fly", "Triceps Extension"], "Progress reps or load while maintaining stable positions."),
    w("Day 4", "Home lower", ["Dumbbell Front Squat", "Single-Leg RDL", "Reverse Lunge", "Dumbbell Hip Thrust", "Calf Raise", "Dead Bug"], "Build gradually and keep the final sets technically clean."),
  ], progression: "Progress reps first and add resistance when practical. When equipment is limited, harder unilateral variations can provide progression.", accuracyNote: "Gym Log original home upper/lower template; it is not a canonical published routine." },
  "home-ppl": { workouts: [
    w("Day 1", "Push", ["Dumbbell Bench Press", "Incline Dumbbell Press", "Dumbbell Shoulder Press", "Lateral Raise", "Triceps Extension"], "Keep pressing volume manageable and use controlled reps."),
    w("Day 2", "Pull", ["Band Pulldown", "One-Arm Dumbbell Row", "Chest-Supported Row", "Band Face Pull", "Dumbbell Curl"], "Use full ranges of motion and stable pulling positions."),
    w("Day 3", "Legs", ["Goblet Squat", "Dumbbell RDL", "Bulgarian Split Squat", "Hip Thrust", "Calf Raise", "Plank"], "Use unilateral movements when heavier loading is unavailable."),
    w("Day 4", "Push", ["Dumbbell Floor Press", "Arnold Press", "Push-Up", "Lateral Raise", "Overhead Triceps Extension"], "Use a different pressing angle while keeping effort recoverable."),
    w("Day 5", "Pull", ["Band Row", "One-Arm Row", "Band Pulldown", "Rear Delt Fly", "Hammer Curl"], "Prioritize controlled contractions rather than momentum."),
    w("Day 6", "Legs", ["Dumbbell Front Squat", "Single-Leg RDL", "Reverse Lunge", "Dumbbell Hip Thrust", "Calf Raise", "Side Plank"], "Adjust volume if six sessions are difficult to recover from."),
  ], progression: "Add repetitions within a sensible range before increasing resistance. A six-day schedule is optional; recovery should determine frequency.", accuracyNote: "Gym Log original home PPL template; it is not an official published routine." },
  "home-full-body-3": { workouts: [
    w("Day 1", "Home full body", ["Goblet Squat", "Dumbbell Bench Press", "One-Arm Row", "Dumbbell RDL", "Plank"], "Choose loads that allow repeatable technique."),
    w("Day 2", "Home full body", ["Reverse Lunge", "Dumbbell Shoulder Press", "Band Row", "Hip Thrust", "Dead Bug"], "Keep setup simple and consistent from week to week."),
    w("Day 3", "Home full body", ["Bulgarian Split Squat", "Dumbbell Floor Press", "One-Arm Row", "Single-Leg RDL", "Side Plank"], "Progress gradually rather than adding unnecessary exercise variety."),
  ], progression: "Increase reps first, then resistance where available. Progress bodyweight movements through harder variations when appropriate.", accuracyNote: "Gym Log original three-day home full-body template." },
  "bodyweight-full-body": { workouts: [
    w("Day 1", "Full body", ["Push-Up", "Bodyweight Squat", "Inverted Row", "Reverse Lunge", "Plank"], "Use variations that make the target repetitions challenging with clean form."),
    w("Day 2", "Full body", ["Pike Push-Up", "Split Squat", "Pull-Up or Assisted Pull-Up", "Glute Bridge", "Hollow Hold"], "Use assistance or easier variations as needed."),
    w("Day 3", "Full body", ["Decline or Standard Push-Up", "Walking Lunge", "Chin-Up or Row", "Single-Leg Glute Bridge", "Dead Bug"], "Control tempo and range before increasing difficulty."),
    w("Day 4", "Full body", ["Dip or Bench Dip", "Step-Up", "Pull-Up", "Bulgarian Split Squat", "Hanging Knee Raise"], "Choose safe equipment and regress movements when necessary."),
  ], progression: "Add reps, improve range of motion, slow the eccentric, or move to a harder variation as current variations become easy.", accuracyNote: "Gym Log original bodyweight template; exercise availability and difficulty vary by individual." },
  "calisthenics-beginner": { workouts: [
    w("Day 1", "Push + legs", ["Incline Push-Up", "Bodyweight Squat", "Pike Push-Up", "Reverse Lunge", "Plank"], "Start with regressions that allow consistent technique."),
    w("Day 2", "Pull + core", ["Assisted Pull-Up", "Inverted Row", "Glute Bridge", "Dead Bug", "Hollow Hold"], "Use assistance rather than forcing incomplete pulling repetitions."),
    w("Day 3", "Full body", ["Push-Up", "Split Squat", "Inverted Row", "Step-Up", "Side Plank"], "Gradually reduce assistance or increase movement difficulty."),
  ], progression: "Progress through repetitions, range of motion, reduced assistance and harder variations. Skill quality takes priority over fatigue.", accuracyNote: "Gym Log original beginner calisthenics template inspired by common bodyweight progressions." },
  "pullup-progression": { workouts: [
    w("Day 1", "Vertical pull strength", ["Dead Hang", "Scapular Pull-Up", "Assisted Pull-Up", "Inverted Row", "Hammer Curl"], "Use assistance that permits smooth full-range repetitions."),
    w("Day 2", "Pull-up volume", ["Band-Assisted Pull-Up", "Eccentric Pull-Up", "Inverted Row", "Lat Pulldown", "Dead Hang"], "Keep eccentric repetitions controlled rather than dropping quickly."),
    w("Day 3", "Pull-up practice", ["Assisted Pull-Up", "Scapular Pull-Up", "Inverted Row", "Lat Pulldown", "Hanging Knee Raise"], "Stop before grip or technique deteriorates significantly."),
  ], progression: "Gradually reduce assistance, increase quality repetitions, and build controlled eccentric strength. Avoid testing a maximal pull-up every session.", accuracyNote: "Gym Log original pull-up progression template; individual progression speed varies." },
  "pushup-progression": { workouts: [
    w("Day 1", "Push-up practice", ["Wall or Incline Push-Up", "Knee Push-Up", "Bodyweight Squat", "Plank"], "Choose the hardest variation that allows clean repetitions."),
    w("Day 2", "Push strength", ["Incline Push-Up", "Standard Push-Up", "Pike Push-Up", "Split Squat", "Dead Bug"], "Keep shoulder position controlled throughout each repetition."),
    w("Day 3", "Push-up volume", ["Standard or Incline Push-Up", "Close-Grip Push-Up", "Pike Push-Up", "Reverse Lunge", "Side Plank"], "Accumulate quality volume without repeatedly training to failure."),
  ], progression: "Build repetitions at each variation before moving to a harder angle or variation. Reduce assistance gradually as strength improves.", accuracyNote: "Gym Log original push-up progression template." },
  "crossfit-beginner": { workouts: [
    w("Day 1", "Strength + conditioning", ["Goblet Squat", "Push-Up", "Ring Row or Cable Row", "Kettlebell Swing", "Easy Intervals"], "Keep intensity moderate while learning movement patterns and scaling options."),
    w("Day 2", "Skill + conditioning", ["Deadlift Technique", "Dumbbell Press", "Step-Up", "Rowing or Bike", "Short AMRAP"], "Prioritize movement quality and sustainable pacing over competition speed."),
    w("Day 3", "Full-body WOD", ["Front Squat or Goblet Squat", "Pull-Up or Pulldown", "Dumbbell Push Press", "Kettlebell Deadlift", "Short Conditioning Circuit"], "Scale load and repetitions so technique remains consistent."),
  ], progression: "Increase skill quality and gradually improve work capacity. CrossFit workouts are highly scalable; use an appropriate beginner class or coach for unfamiliar movements.", accuracyNote: "Gym Log original beginner template inspired by the common CrossFit class structure; it is not an official CrossFit program." },
  "hybrid-athlete": { workouts: [
    w("Day 1", "Lower strength", ["Squat", "Romanian Deadlift", "Split Squat", "Calf Raise", "Easy Run"], "Keep endurance work easy enough to preserve strength quality."),
    w("Day 2", "Upper strength", ["Bench Press", "Pull-Up or Pulldown", "Overhead Press", "Cable Row", "Easy Bike"], "Progress the primary lifts while keeping conditioning controlled."),
    w("Day 3", "Endurance", ["Easy Run", "Bike or Row", "Mobility", "Core Work"], "Build aerobic volume gradually and keep most work sustainable."),
    w("Day 4", "Full body + power", ["Deadlift", "Dumbbell Press", "Row", "Kettlebell Swing", "Intervals"], "Separate hard endurance work from heavy lifting when possible."),
  ], progression: "Progress strength and endurance independently, manage interference by controlling intensity and recovery, and increase total workload gradually.", accuracyNote: "Gym Log original hybrid template based on the general concept of combining resistance training with endurance work." },
  "strength-conditioning-4": { workouts: [
    w("Day 1", "Lower strength", ["Squat", "Romanian Deadlift", "Split Squat", "Calf Raise", "Sled or Carry"], "Use the strength work as the main progression anchor."),
    w("Day 2", "Upper strength", ["Bench Press", "Pull-Up", "Overhead Press", "Row", "Loaded Carry"], "Keep compound lifts technically consistent."),
    w("Day 3", "Power + conditioning", ["Jump Variation", "Kettlebell Swing", "Medicine Ball Throw", "Bike or Row Intervals", "Core"], "Keep explosive movements crisp and stop before power drops substantially."),
    w("Day 4", "Full body conditioning", ["Trap-Bar Deadlift", "Dumbbell Press", "Cable Row", "Step-Up", "Conditioning Circuit"], "Scale conditioning to support rather than overwhelm strength training."),
  ], progression: "Progress strength lifts gradually and increase conditioning duration, pace or density in small steps while protecting recovery.", accuracyNote: "Gym Log original four-day strength and conditioning template." },
  "athletic-performance": { workouts: [
    w("Day 1", "Lower strength + power", ["Squat", "Jump", "Romanian Deadlift", "Split Squat", "Calf Raise"], "Perform explosive work fresh and keep repetitions crisp."),
    w("Day 2", "Upper strength", ["Bench Press", "Pull-Up", "Overhead Press", "Row", "Farmer Carry"], "Build general strength without excessive fatigue."),
    w("Day 3", "Speed + conditioning", ["Acceleration Drill", "Lateral Movement", "Medicine Ball Throw", "Bike or Run Intervals", "Core"], "Quality of movement matters more than maximal conditioning volume."),
    w("Day 4", "Full body", ["Trap-Bar Deadlift", "Dumbbell Press", "Row", "Step-Up", "Kettlebell Swing"], "Use moderate volume to support performance and recovery."),
  ], progression: "Develop strength, power, movement quality and conditioning progressively. Sport-specific coaching should determine technical drills where applicable.", accuracyNote: "Gym Log original athletic-performance template; it is not a sport-specific performance prescription." },
  "kettlebell-3-day": { workouts: [
    w("Day 1", "Kettlebell strength", ["Two-Hand Swing", "Goblet Squat", "One-Arm Press", "One-Arm Row", "Farmer Carry"], "Master the swing and bracing mechanics before adding load or complexity."),
    w("Day 2", "Kettlebell full body", ["Clean", "Front-Rack Squat", "One-Arm Press", "Deadlift", "Suitcase Carry"], "Use manageable loads and controlled transitions."),
    w("Day 3", "Conditioning", ["Swing", "Reverse Lunge", "Clean and Press", "Row Variation", "Loaded Carry"], "Keep conditioning repeatable and stop when technique degrades."),
  ], progression: "Increase repetitions, load or density gradually while maintaining technique. Learn unfamiliar kettlebell movements from a qualified instructor when possible.", accuracyNote: "Gym Log original three-day kettlebell template; it is not an official StrongFirst or other branded prescription." },
  "2-day-full-body": { workouts: [
    w("Day 1", "Full body A", ["Squat", "Bench Press", "Lat Pulldown", "Romanian Deadlift", "Lateral Raise", "Plank"], "Use the limited weekly frequency to emphasize efficient compound movements."),
    w("Day 2", "Full body B", ["Deadlift or Trap-Bar Deadlift", "Overhead Press", "Cable Row", "Split Squat", "Curl", "Triceps Pressdown"], "Leave enough recovery between sessions and progress gradually."),
  ], progression: "Track reps and load and aim for small improvements while keeping total volume recoverable. Two well-executed sessions can provide a practical minimum-dose structure.", accuracyNote: "Gym Log original two-day full-body template." },
  "5-day-upper-lower": { workouts: [
    w("Day 1", "Upper A", ["Bench Press", "Row", "Overhead Press", "Lat Pulldown", "Lateral Raise", "Triceps Pressdown"], "Use the main presses and rows as progression anchors."),
    w("Day 2", "Lower A", ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raise", "Abs"], "Keep lower-body volume challenging but recoverable."),
    w("Day 3", "Upper B", ["Incline Press", "Pull-Up", "Chest-Supported Row", "Machine Press", "Rear Delt Fly", "Curl"], "Use different angles while balancing weekly pushing and pulling volume."),
    w("Day 4", "Lower B", ["Deadlift", "Bulgarian Split Squat", "Hack Squat", "Leg Extension", "Leg Curl", "Calf Raise"], "Avoid making every lower-body movement maximal effort."),
    w("Day 5", "Upper C", ["Dumbbell Bench Press", "Seated Cable Row", "Lat Pulldown", "Lateral Raise", "Curl", "Triceps Extension"], "Use this lighter upper session to add useful volume without excessive fatigue."),
  ], progression: "Progress repetitions and load over time while monitoring weekly fatigue. The fifth day can be reduced or skipped if recovery is poor.", accuracyNote: "Gym Log original five-day upper/lower template; it is not a named published routine." },
};
