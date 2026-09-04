import type { Program } from "../lib/programs";

export type ProgramMetadata = Program & {
  goalTags: string[];
  levelTag: "beginner" | "intermediate" | "advanced" | "all-levels";
  equipmentTags: string[];
  styleTags: string[];
  durationMinutes: number;
  programLength: string;
  bestForTags: string[];
};

const levelMap: Record<Program["level"], ProgramMetadata["levelTag"]> = {
  Beginner: "beginner",
  Intermediate: "intermediate",
  Advanced: "advanced",
  "All Levels": "all-levels",
};

function equipmentTags(equipment: string) {
  const value = equipment.toLowerCase();
  const tags = ["gym"];
  if (value.includes("barbell")) tags.push("barbell");
  if (value.includes("dumbbell")) tags.push("dumbbells");
  if (value.includes("machine")) tags.push("machines");
  if (value.includes("home")) tags.push("home");
  if (value.includes("bodyweight") || value.includes("bodyweight /")) tags.push("bodyweight");
  if (value.includes("kettlebell")) tags.push("kettlebell");
  if (value.includes("minimal")) tags.push("minimal-equipment");
  return Array.from(new Set(tags));
}

function goalTags(program: Program) {
  const text = `${program.goal} ${program.category} ${program.name}`.toLowerCase();
  const tags: string[] = [];
  if (/muscle|hypertrophy|bodybuilding|size/.test(text)) tags.push("muscle");
  if (/strength|powerlifting|powerbuilding|squat|bench|deadlift/.test(text)) tags.push("strength");
  if (/fat loss|fitness|conditioning|endurance|athletic|recomposition/.test(text)) tags.push("fitness");
  if (/fat loss|recomposition/.test(text)) tags.push("fat-loss");
  if (/powerlifting|competition/.test(text)) tags.push("powerlifting");
  if (/conditioning|hybrid|athletic|kettlebell|crossfit/.test(text)) tags.push("conditioning");
  return Array.from(new Set(tags));
}

function styleTags(program: Program) {
  const text = `${program.name} ${program.category}`.toLowerCase();
  const tags: string[] = [];
  if (/push pull legs|ppl/.test(text)) tags.push("ppl");
  if (/upper.*lower|lower.*upper/.test(text)) tags.push("upper-lower");
  if (/full body|full-body/.test(text)) tags.push("full-body");
  if (/bro split|arnold|bodybuilding|mountain dog|blood & guts/.test(text)) tags.push("bodybuilding");
  if (/powerbuilding/.test(text)) tags.push("powerbuilding");
  if (/powerlifting/.test(text)) tags.push("powerlifting");
  if (/specialization|squat|bench|deadlift/.test(text)) tags.push("specialization");
  if (/home|dumbbell|bodyweight|calisthenics|pull-up|push-up/.test(text)) tags.push("home-friendly");
  return Array.from(new Set(tags));
}

function durationMinutes(program: Program) {
  if (program.category === "Conditioning" || /30-minute/.test(program.slug)) return 45;
  if (program.category === "Powerlifting" || program.category === "Strength") return 65;
  if (program.category === "Bodybuilding" || program.category === "Hypertrophy") return 60;
  return 55;
}

function programLength(program: Program) {
  if (/6-week|candito|smolov|russian|meet-prep/.test(program.slug)) return "6–12 weeks";
  if (/531|texas|madcow|starting-strength|stronglifts|greyskull|fierce|juggernaut/.test(program.slug)) return "Ongoing / cycle-based";
  return "Flexible / ongoing";
}

export function getProgramMetadata(program: Program): ProgramMetadata {
  const goals = goalTags(program);
  const styles = styleTags(program);
  return {
    ...program,
    goalTags: goals,
    levelTag: levelMap[program.level],
    equipmentTags: equipmentTags(program.equipment),
    styleTags: styles,
    durationMinutes: durationMinutes(program),
    programLength: programLength(program),
    bestForTags: Array.from(new Set([...goals, ...styles, program.level.toLowerCase()])),
  };
}

export const PROGRAM_METADATA: ProgramMetadata[] = [];
