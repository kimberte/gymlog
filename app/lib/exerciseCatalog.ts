import { EXERCISE_DATABASE } from "./exerciseDatabase";
import { CORE_EXERCISES } from "./exerciseCore";
import { CORE_EXERCISES_2 } from "./exerciseCore2";
import type { Exercise } from "./exerciseDatabase";

/** Canonical public exercise catalog. New original Gym Log records take precedence. */
export const EXERCISE_CATALOG: Exercise[] = Array.from(
  new Map([...EXERCISE_DATABASE, ...CORE_EXERCISES, ...CORE_EXERCISES_2].map(exercise => [exercise.slug, exercise])).values()
);

/**
 * Give every exercise useful internal links even when an entry does not have
 * hand-written alternatives yet. This keeps the library connected as it grows.
 */
for (const exercise of EXERCISE_CATALOG) {
  if (exercise.alternatives.length >= 3) continue;
  const candidates = EXERCISE_CATALOG
    .filter(candidate => candidate.slug !== exercise.slug)
    .map(candidate => {
      const sharedPrimary = candidate.primaryMuscles.filter(muscle => exercise.primaryMuscles.includes(muscle)).length;
      const samePattern = candidate.movementPattern === exercise.movementPattern ? 4 : 0;
      const sameCategory = candidate.category === exercise.category ? 2 : 0;
      const sameType = candidate.exerciseType === exercise.exerciseType ? 1 : 0;
      return { slug: candidate.slug, score: samePattern + sameCategory + sharedPrimary * 2 + sameType };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(candidate => candidate.slug);

  exercise.alternatives = Array.from(new Set([...exercise.alternatives, ...candidates])).slice(0, 3);
}

export const EXERCISE_CATEGORIES = ["All", ...Array.from(new Set(EXERCISE_CATALOG.map(x => x.category))).sort()];
export const EXERCISE_EQUIPMENT = ["All", ...Array.from(new Set(EXERCISE_CATALOG.flatMap(x => x.equipment))).sort()];

export function getCatalogExercise(slug: string) {
  return EXERCISE_CATALOG.find(exercise => exercise.slug === slug);
}
