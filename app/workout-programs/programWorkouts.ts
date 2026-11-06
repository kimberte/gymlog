import type { Program } from "../lib/programs";
import { SPECIFIC_PROGRAMS } from "./specificPrograms";
import { SPECIFIC_PROGRAMS_2 } from "./specificPrograms2";
import { SPECIFIC_PROGRAMS_3 } from "./specificPrograms3";
import { SPECIFIC_PROGRAMS_4 } from "./specificPrograms4";
import { SPECIFIC_PROGRAMS_5 } from "./specificPrograms5";
import { SPECIFIC_PROGRAMS_6 } from "./specificPrograms6";
import { SPECIFIC_PROGRAMS_7 } from "./specificPrograms7";
import { SPECIFIC_PROGRAMS_8 } from "./specificPrograms8";
import { SPECIFIC_PROGRAMS_9 } from "./specificPrograms9";
import { SPECIFIC_PROGRAMS_10 } from "./specificPrograms10";
import { FOUNDER_SPECIAL_V2_WORKOUTS, FOUNDER_SPECIAL_V2_PROGRESSION, FOUNDER_SPECIAL_V2_DURATION, FOUNDER_SPECIAL_V2_ACCURACY_NOTE } from "./founderSpecialV2";
import { FOUNDER_SPECIAL_WORKOUTS, FOUNDER_SPECIAL_PROGRESSION, FOUNDER_SPECIAL_DURATION, FOUNDER_SPECIAL_ACCURACY_NOTE } from "./founderSpecial";

export type ProgramWorkout = { day: string; focus: string; exercises: string[]; guidance: string };
const ALL_SPECIFIC_PROGRAMS = { ...SPECIFIC_PROGRAMS, ...SPECIFIC_PROGRAMS_2, ...SPECIFIC_PROGRAMS_3, ...SPECIFIC_PROGRAMS_4, ...SPECIFIC_PROGRAMS_5, ...SPECIFIC_PROGRAMS_6, ...SPECIFIC_PROGRAMS_7, ...SPECIFIC_PROGRAMS_8, ...SPECIFIC_PROGRAMS_9, ...SPECIFIC_PROGRAMS_10 };
const strength = [["Squat", "Bench Press", "Barbell Row", "Romanian Deadlift", "Plank"],["Deadlift", "Overhead Press", "Pull-Up or Lat Pulldown", "Bulgarian Split Squat", "Curl"],["Front Squat", "Incline Bench Press", "Seated Cable Row", "Leg Curl", "Triceps Pressdown"],["Squat", "Bench Press", "Barbell Row", "Hip Thrust", "Lateral Raise"],["Deadlift", "Overhead Press", "Chin-Up", "Leg Press", "Calf Raise"],["Bench Press", "Squat", "Chest-Supported Row", "Leg Curl", "Ab Wheel"]];
const hypertrophy = [["Bench Press", "Incline Dumbbell Press", "Cable Fly", "Lateral Raise", "Triceps Pressdown"],["Lat Pulldown", "Chest-Supported Row", "Seated Cable Row", "Dumbbell Curl", "Hammer Curl"],["Back Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raise"],["Overhead Press", "Machine Chest Press", "Dumbbell Lateral Raise", "Rear Delt Fly", "Overhead Triceps Extension"],["Pull-Up", "One-Arm Dumbbell Row", "Lat Pulldown", "Preacher Curl", "Face Pull"],["Hack Squat", "Hip Thrust", "Leg Extension", "Seated Leg Curl", "Calf Raise"]];
const home = [["Goblet Squat", "Dumbbell Bench Press", "One-Arm Dumbbell Row", "Romanian Deadlift", "Plank"],["Dumbbell Split Squat", "Dumbbell Overhead Press", "Dumbbell Row", "Dumbbell Curl", "Push-Up"],["Reverse Lunge", "Dumbbell Floor Press", "Band Row", "Dumbbell RDL", "Dead Bug"],["Goblet Squat", "Push-Up", "Dumbbell Row", "Hip Thrust", "Lateral Raise"],["Step-Up", "Dumbbell Shoulder Press", "Band Pulldown", "Single-Leg RDL", "Curl"],["Split Squat", "Dumbbell Press", "Dumbbell Row", "Glute Bridge", "Side Plank"]];
const bodyweight = [["Push-Up", "Bodyweight Squat", "Inverted Row", "Reverse Lunge", "Plank"],["Pull-Up or Assisted Pull-Up", "Pike Push-Up", "Split Squat", "Glute Bridge", "Hollow Hold"],["Push-Up", "Walking Lunge", "Chin-Up or Row", "Single-Leg Glute Bridge", "Dead Bug"],["Decline Push-Up", "Step-Up", "Pull-Up", "Single-Leg Squat Progression", "Side Plank"],["Dip or Bench Dip", "Bodyweight Row", "Bulgarian Split Squat", "Hip Hinge", "Hanging Knee Raise"],["Push-Up", "Squat", "Pull-Up", "Lunge", "Plank"]];
// Gym Log-original structured adaptations for catalog entries without a verified named prescription.
// The workouts below are tailored to the program's training split, equipment and primary goal.
// Named third-party programs must still be checked against the original source.
function originalAdaptation(program: Program): ProgramWorkout[] {
  const name = program.name.toLowerCase();
  const equipment = program.equipment.toLowerCase();
  const isBodyweight = /bodyweight|calisthenics/.test(name + " " + equipment);
  const isDumbbell = /dumbbell/.test(equipment) && !/barbell|full gym/.test(equipment);
  const isMachine = /machines/.test(equipment);
  const isHome = /home|minimal/.test(equipment);
  const isConditioning = /conditioning|athletic|hybrid|crossfit|endurance/.test(name + " " + program.category);
  const isStrength = /strength|powerlifting|squat|deadlift|bench|5\/3\/1|531|gzcl|sheiko|smolov|texas method|madcow/.test(name + " " + program.category);
  const push = isBodyweight ? ["Push-Up — 3×8–15", "Pike Push-Up — 3×6–12", "Close-Grip Push-Up — 2×8–15", "Side Plank — 3×30–45 sec/side"] : isDumbbell || isHome ? ["Dumbbell Bench Press — 3×8–12", "Dumbbell Overhead Press — 3×8–12", "Incline Dumbbell Press — 3×10–12", "Dumbbell Lateral Raise — 3×12–20", "Overhead Dumbbell Triceps Extension — 2×10–15"] : isMachine ? ["Machine Chest Press — 3×8–12", "Machine Shoulder Press — 3×8–12", "Pec Deck — 3×10–15", "Machine Lateral Raise — 3×12–20", "Cable Triceps Pressdown — 3×10–15"] : ["Bench Press — 4×5–8", "Incline Dumbbell Press — 3×8–12", "Overhead Press — 3×6–10", "Dumbbell Lateral Raise — 3×12–20", "Triceps Pressdown — 3×10–15"];
  const pull = isBodyweight ? ["Pull-Up or Assisted Pull-Up — 4×5–10", "Inverted Row — 3×8–15", "Scapular Pull-Up — 3×8–12", "Prone Reverse Fly — 3×12–15", "Hollow Hold — 3×20–40 sec"] : isDumbbell || isHome ? ["One-Arm Dumbbell Row — 4×8–12/side", "Dumbbell Pullover — 3×10–12", "Chest-Supported Dumbbell Row — 3×10–15", "Dumbbell Rear Delt Fly — 3×12–20", "Hammer Curl — 3×10–15"] : isMachine ? ["Lat Pulldown — 4×8–12", "Seated Machine Row — 3×8–12", "Chest-Supported Machine Row — 3×10–15", "Reverse Pec Deck — 3×12–20", "Machine Preacher Curl — 3×10–15"] : ["Pull-Up or Lat Pulldown — 4×6–10", "Barbell Row — 3×6–10", "Chest-Supported Row — 3×8–12", "Face Pull — 3×12–20", "Dumbbell Curl — 3×10–15"];
  const legs = isBodyweight ? ["Bodyweight Squat — 4×12–20", "Reverse Lunge — 3×10–15/leg", "Single-Leg Glute Bridge — 3×10–15/leg", "Step-Up — 3×10/leg", "Single-Leg Calf Raise — 3×12–20"] : isDumbbell || isHome ? ["Goblet Squat — 4×8–12", "Dumbbell Romanian Deadlift — 3×8–12", "Dumbbell Reverse Lunge — 3×10/leg", "Dumbbell Step-Up — 3×10/leg", "Standing Calf Raise — 3×12–20"] : isMachine ? ["Leg Press — 4×8–12", "Seated Leg Curl — 3×10–15", "Hack Squat — 3×8–12", "Leg Extension — 3×12–15", "Seated Calf Raise — 4×12–20"] : ["Back Squat — 4×5–8", "Romanian Deadlift — 3×6–10", "Leg Press — 3×10–12", "Leg Curl — 3×10–15", "Calf Raise — 4×12–20"];
  const upper = [...push.slice(0,2), ...pull.slice(0,2), push[push.length-2], pull[pull.length-1]];
  const lower = [...legs, "Plank — 3×30–60 sec"];
  const fullA = [legs[0], push[0], pull[0], legs[1], "Plank — 3×30–60 sec"];
  const fullB = [legs[2], push[1], pull[1], legs[3], "Dead Bug — 3×10/side"];
  const fullC = [legs[1], push[2] || push[0], pull[2] || pull[0], legs[0], "Side Plank — 3×30 sec/side"];
  const strengthA = ["Back Squat — 4×4–6", "Bench Press — 4×4–6", "Barbell Row — 3×6–8", "Leg Curl — 3×10–12", "Plank — 3×45 sec"];
  const strengthB = ["Deadlift — 3×3–5", "Overhead Press — 4×5–7", "Pull-Up or Lat Pulldown — 3×6–10", "Split Squat — 3×8/leg", "Hanging Knee Raise — 3×10–15"];
  const strengthC = ["Paused Squat — 3×5–6", "Close-Grip Bench Press — 4×6–8", "Romanian Deadlift — 3×6–8", "Chest-Supported Row — 3×8–12", "Face Pull — 3×15"];
  const specialty = /bench|squat|deadlift/.test(name) ? (/bench/.test(name) ? "Bench Press" : /deadlift/.test(name) ? "Deadlift" : "Back Squat") : null;
  const sessions: [string,string[]][] = [];
  for (let i=0; i<program.days; i++) {
    let focus: string; let exercises: string[];
    if (specialty) {
      focus = i % 3 === 0 ? "Primary lift — strength" : i % 3 === 1 ? "Secondary lift — volume" : "Technique and accessories";
      exercises = i % 3 === 0 ? [`${specialty} — 4×3–6`, ...strengthA.filter(e=>!e.startsWith(specialty)).slice(0,4)] : i % 3 === 1 ? [`${specialty} — 4×6–8 (lighter)`, ...strengthB.filter(e=>!e.startsWith(specialty)).slice(1,5)] : [`${specialty} — 3×5 (technique)`, ...strengthC.filter(e=>!e.startsWith(specialty)).slice(1,5)];
    } else if (/push.pull.legs|\bppl\b/.test(name)) {
      const rotation: [string,string[]][] = [["Push",push],["Pull",pull],["Legs",legs]];
      [focus,exercises] = rotation[i%3];
    } else if (/upper.lower|upper \/ lower/.test(name)) {
      [focus,exercises] = i%2===0 ? ["Upper body",upper] : ["Lower body",lower];
    } else if (/bro.split|bodybuilding split|chest.back.legs/.test(name)) {
      const rotation: [string,string[]][] = [["Chest and triceps",push],["Back and biceps",pull],["Quads and calves",legs],["Shoulders and arms",[push[1],push[3],pull[3],push[4],pull[4]]],["Posterior chain",[legs[1],legs[2],legs[3],pull[1],"Plank — 3×45 sec"]]];
      [focus,exercises] = rotation[i%5];
    } else if (isConditioning) {
      const rotation: [string,string[]][] = [["Strength and movement",fullA],["Conditioning intervals",["Bike or Row Erg — 6×2 min moderate-hard / 2 min easy","Walking Lunge — 3×12/leg","Push-Up — 3×10–15","Farmer Carry — 4×30 m","Dead Bug — 3×10/side"]],["Strength and capacity",fullB],["Aerobic base and mobility",["Zone 2 Cardio — 25–40 min conversational pace","Step-Up — 3×12/leg","Band Pull-Apart — 3×15–20","Hip Mobility — 8 min","Side Plank — 3×30 sec/side"]]];
      [focus,exercises] = rotation[i%4];
    } else if (isStrength && !isBodyweight && !isDumbbell && !isHome && !isMachine) {
      const rotation: [string,string[]][] = [["Squat and bench strength",strengthA],["Deadlift and press strength",strengthB],["Technique and volume",strengthC],["Upper strength",["Bench Press — 4×4–6","Overhead Press — 3×6–8","Weighted Pull-Up — 3×5–8","Barbell Row — 3×8","Triceps Pressdown — 3×12"]],["Lower strength",["Back Squat — 4×5","Deadlift — 3×4","Front Squat — 3×6","Leg Curl — 3×10","Ab Wheel — 3×10"]]];
      [focus,exercises] = rotation[i%5];
    } else {
      const rotation: [string,string[]][] = [["Full body A",fullA],["Full body B",fullB],["Full body C",fullC],["Upper body",upper],["Lower body",lower],["Full body volume",[...fullB.slice(0,3),...fullA.slice(3)]]];
      [focus,exercises] = rotation[i%6];
    }
    sessions.push([focus,exercises]);
  }
  const guidance = isStrength ? "Gym Log adaptation: rest 2–4 minutes for primary lifts, 60–120 seconds for accessories. Begin with 2–3 reps in reserve, and reduce load if technique deteriorates." : "Gym Log adaptation: rest 90–150 seconds for compounds and 45–90 seconds for accessories. Start with 2–3 reps in reserve and prioritize controlled form.";
  return sessions.map(([focus,exercises],i)=>({day:`Day ${i+1}`,focus,exercises:[...exercises],guidance}));
}
function poolFor(program: Program) { const text = `${program.name} ${program.category} ${program.equipment}`.toLowerCase(); if (text.includes("bodyweight") || text.includes("calisthenics") || text.includes("pull-up progression") || text.includes("push-up progression")) return bodyweight; if (text.includes("dumbbell") || text.includes("home") || text.includes("minimal equipment") || text.includes("machine")) return text.includes("machine") ? hypertrophy : home; if (program.category === "Hypertrophy" || program.category === "Bodybuilding" || program.category === "Powerbuilding") return hypertrophy; return strength; }
function focusFor(program: Program, index: number) { const name = program.name.toLowerCase(); if (name.includes("bench")) return ["Bench strength", "Upper-body volume", "Bench accessories"][index % 3]; if (name.includes("squat")) return ["Squat strength", "Lower-body volume", "Squat accessories"][index % 3]; if (name.includes("deadlift") || name.includes("coan") || name.includes("mag/ort")) return ["Deadlift strength", "Posterior chain", "Deadlift accessories"][index % 3]; if (name.includes("ppl") || name.includes("push pull legs")) return ["Push", "Pull", "Legs", "Upper", "Lower", "Arms"][index % 6]; if (name.includes("upper") || name.includes("lower")) return index % 2 === 0 ? "Upper body" : "Lower body"; if (name.includes("bro split") || name.includes("bodybuilding") || name.includes("golden six")) return ["Chest & triceps", "Back & biceps", "Legs", "Shoulders", "Arms"][index % 5]; if (program.category === "Conditioning") return ["Strength", "Conditioning", "Strength + conditioning", "Athletic work"][index % 4]; return ["Full body strength", "Upper emphasis", "Lower emphasis", "Full body volume", "Conditioning"][index % 5]; }
export function getProgramWorkouts(program: Program): ProgramWorkout[] { if (program.slug === "gym-log-founder-special-v2") return FOUNDER_SPECIAL_V2_WORKOUTS; if (program.slug === "gym-log-founder-special") return FOUNDER_SPECIAL_WORKOUTS; const specific = ALL_SPECIFIC_PROGRAMS[program.slug]; if (specific) return specific.workouts; return originalAdaptation(program); }
export function getProgramProgression(program: Program) { if (program.slug === "gym-log-founder-special-v2") return FOUNDER_SPECIAL_V2_PROGRESSION; if (program.slug === "gym-log-founder-special") return FOUNDER_SPECIAL_PROGRESSION; return ALL_SPECIFIC_PROGRAMS[program.slug]?.progression ?? "Gym Log adaptation: use double progression. When all working sets reach the top of the prescribed rep range with clean technique and 1–3 reps in reserve, increase the load by the smallest practical increment (typically 2–5%). If performance stalls for two consecutive exposures, reduce load by 5–10% and rebuild. Schedule an easier week after 4–6 hard weeks as needed. For named programs, consult the original author for official loading rules."; }
export function getProgramDuration(program: Program) { if (program.slug === "gym-log-founder-special-v2") return FOUNDER_SPECIAL_V2_DURATION; if (program.slug === "gym-log-founder-special") return FOUNDER_SPECIAL_DURATION; const specific = ALL_SPECIFIC_PROGRAMS[program.slug]; return specific && "duration" in specific ? specific.duration : undefined; }
export function isSpecificProgram(program: Program) { return true; }
export function getProgramAccuracyNote(program: Program) { if (program.slug === "gym-log-founder-special-v2") return FOUNDER_SPECIAL_V2_ACCURACY_NOTE; if (program.slug === "gym-log-founder-special") return FOUNDER_SPECIAL_ACCURACY_NOTE; return ALL_SPECIFIC_PROGRAMS[program.slug]?.accuracyNote ?? "This is a Gym Log-original adaptation with specified exercises, sets and reps. It is not the official plan of a named coach or brand; consult the original source for exact programming."; }
