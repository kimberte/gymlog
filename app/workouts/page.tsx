import { permanentRedirect } from "next/navigation";

/**
 * Canonical workout-program library lives at /workout-programs.
 * Keep /workouts as a permanent redirect so old links and search results
 * consolidate to the single library rather than maintaining two indexes.
 */
export default function WorkoutsIndexPage() {
  permanentRedirect("/workout-programs");
}
