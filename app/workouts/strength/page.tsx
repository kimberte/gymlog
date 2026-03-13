import type { Metadata } from "next";
import WorkoutCategoryPage, { buildCategoryMetadata } from "../categoryPage";

export const metadata: Metadata = buildCategoryMetadata("strength");

export default function Page() {
  return <WorkoutCategoryPage categorySlug="strength" />;
}
