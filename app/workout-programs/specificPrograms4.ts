import type { ProgramWorkout } from "./programWorkouts";

export type SpecificProgram4 = { workouts: ProgramWorkout[]; progression: string; accuracyNote: string };
const w = (day: string, focus: string, exercises: string[], guidance: string): ProgramWorkout => ({ day, focus, exercises, guidance });

export const SPECIFIC_PROGRAMS_4: Record<string, SpecificProgram4> = {
  "jeff-nippard-fundamentals": {
    workouts: [
      w("Day 1", "Full body #1", ["Squat Pattern — primary work", "Horizontal Press — primary work", "Vertical Pull — moderate volume", "Hip Hinge — moderate volume", "Arms / delts — accessory work"], "Jeff Nippard's current Fundamentals program offers a full-body option with three sessions per week; this page summarizes the split without reproducing the paid exercise sheet."),
      w("Day 2", "Full body #2", ["Hinge Pattern — primary work", "Vertical Press — primary work", "Horizontal Pull — moderate volume", "Single-Leg Work — accessory", "Arms / delts — accessory work"], "Use the official program for exact exercises, sets, reps and progression."),
      w("Day 3", "Full body #3", ["Squat Pattern — primary work", "Horizontal Press — primary work", "Horizontal Pull — moderate volume", "Leg Isolation — accessory", "Arms / delts — accessory work"], "The Fundamentals program is designed for beginner-to-intermediate lifters and uses straightforward progression."),
    ],
    progression: "The current Fundamentals Hypertrophy Program offers three 8-week routines and uses simple linear progression, with full-body, upper/lower and modified body-part options. The selected routine determines the weekly schedule.",
    accuracyNote: "Based on Jeff Nippard's current official Fundamentals Hypertrophy Program page. Exercise-level details are intentionally summarized rather than reproducing the paid program."
  },
  "jeff-nippard-ppl": {
    workouts: [
      w("Day 1", "Push", ["Chest Press — primary work", "Incline Press — hypertrophy work", "Shoulder Press — moderate volume", "Lateral Raise — accessory", "Triceps — accessory"], "The official Push/Pull/Legs Hypertrophy Program uses structured progression across two 8-week training blocks."),
      w("Day 2", "Pull", ["Vertical Pull — primary work", "Row — primary work", "Rear Delt Work — accessory", "Biceps Curl — accessory", "Additional back work"], "Use the official program for exact exercise selection, RPE/%1RM prescriptions and rest periods."),
      w("Day 3", "Legs", ["Squat Pattern — primary work", "Hip Hinge — primary work", "Leg Press or similar — volume work", "Leg Curl — accessory", "Calves — accessory"], "The program is intended for intermediate-advanced trainees rather than first-year lifters."),
      w("Day 4", "Push", ["Horizontal Press — primary work", "Incline or Machine Press — volume", "Shoulder / lateral delt work", "Triceps — accessory"], "Progression and exercise order vary by training block."),
      w("Day 5", "Pull", ["Vertical Pull — primary work", "Row — primary work", "Rear Delts — accessory", "Biceps — accessory"], "Keep the selected version consistent through the block."),
      w("Day 6", "Legs", ["Squat or Leg Press — primary work", "Hip Hinge — primary work", "Leg Extension — accessory", "Leg Curl — accessory", "Calves — accessory"], "A six-day PPL schedule is shown here as the practical tracking structure."),
    ],
    progression: "Jeff Nippard's official PPL Hypertrophy Program is organized into two eight-week blocks with different goals, including a deload between blocks and more advanced RPE/%1RM progression in the later phase.",
    accuracyNote: "Based on Jeff Nippard's official current PPL Hypertrophy Program description. This is a high-level tracking template, not a reproduction of the paid program's exercise spreadsheet."
  },
  "jeff-nippard-upper-lower": {
    workouts: [
      w("Day 1", "Upper #1", ["Horizontal Press — primary work", "Row — primary work", "Vertical Press — moderate work", "Vertical Pull — moderate work", "Arms / delts — accessories"], "Use the official Upper/Lower Size & Strength program for exact exercises and progression."),
      w("Day 2", "Lower #1", ["Squat Pattern — primary work", "Hip Hinge — primary work", "Single-Leg Work — accessory", "Leg Curl — accessory", "Calves / abs — accessories"], "Keep the main lifts technically consistent and follow the official block progression."),
      w("Day 3", "Upper #2", ["Incline or Horizontal Press — primary work", "Vertical Pull — primary work", "Row — moderate work", "Lateral Raise — accessory", "Arms — accessories"], "The exact exercise menu is version-specific and should come from the official program."),
      w("Day 4", "Lower #2", ["Deadlift or Hinge — primary work", "Squat Variation — primary work", "Leg Press or similar — volume", "Leg Curl — accessory", "Calves / abs — accessories"], "This four-day upper/lower structure is intended for repeatable strength and hypertrophy progress."),
    ],
    progression: "The current Jeff Nippard Upper/Lower Size & Strength program is a four-day option designed around both strength and hypertrophy. Follow its current block-specific progression rather than substituting a generic percentage scheme.",
    accuracyNote: "Based on Jeff Nippard's current official program catalog. Exercise-level details are summarized to avoid reproducing paid program materials."
  }
};
