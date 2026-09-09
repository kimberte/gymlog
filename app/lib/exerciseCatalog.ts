import { EXERCISE_DATABASE } from "./exerciseDatabase";
import { CORE_EXERCISES } from "./exerciseCore";
import type { Exercise } from "./exerciseDatabase";

/**
 * Canonical exercise catalog for the public exercise library.
 * Core Gym Log entries take precedence over legacy entries with the same slug.
 */
export const EXERCISE_CATALOG: Exercise[] = Array.from(
  new Map([...CORE_EXERCISES, ...EXERCISE_DATABASE].map(exercise => [exercise.slug, exercise])).values()
);

export const EXERCISE_CATEGORIES = [
  "All",
  ...Array.from(new Set(EXERCISE_CATALOG.map(exercise => exercise.category))).sort(),
];

export function getCatalogExercise(slug: string) {
  return EXERCISE_CATALOG.find(exercise => exercise.slug === slug);
}
