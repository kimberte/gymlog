import type { Exercise } from "./exerciseDatabase";

export function core(
  name: string,
  category: Exercise["category"],
  movementPattern: string,
  equipment: string[],
  primaryMuscles: string[],
  secondaryMuscles: string[],
  difficulty: Exercise["difficulty"],
  exerciseType: Exercise["exerciseType"],
  description: string,
  instructionText: string,
): Exercise {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const instructions = instructionText.split("|").map(x => x.trim()).filter(Boolean);
  const focus = primaryMuscles[0] || "target muscles";
  return {
    slug,
    name,
    category,
    movementPattern,
    equipment,
    primaryMuscles,
    secondaryMuscles,
    difficulty,
    exerciseType,
    description,
    instructions,
    tips: [`Control the movement and use a range you can repeat consistently.`, `Choose a load or variation that lets you keep the ${focus.toLowerCase()} as the intended focus.`],
    commonMistakes: [`Using more load or speed than you can control.`, `Losing stable body position during the difficult portion.`],
    alternatives: [],
  };
}
