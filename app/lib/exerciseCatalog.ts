import { EXERCISE_DATABASE } from "./exerciseDatabase";
import { CORE_EXERCISES } from "./exerciseCore";
import { CORE_EXERCISES_2 } from "./exerciseCore2";
import type { Exercise } from "./exerciseDatabase";

/** Canonical public exercise catalog. New original Gym Log records take precedence. */
export const EXERCISE_CATALOG: Exercise[] = Array.from(
  new Map([...EXERCISE_DATABASE, ...CORE_EXERCISES, ...CORE_EXERCISES_2].map(exercise => [exercise.slug, exercise])).values()
);

export const EXERCISE_CATEGORIES = ["All", ...Array.from(new Set(EXERCISE_CATALOG.map(x => x.category))).sort()];
export const EXERCISE_EQUIPMENT = ["All", ...Array.from(new Set(EXERCISE_CATALOG.flatMap(x => x.equipment))).sort()];

export function getCatalogExercise(slug: string) {
  return EXERCISE_CATALOG.find(exercise => exercise.slug === slug);
}
