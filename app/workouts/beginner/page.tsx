import type { Metadata } from "next";
import WorkoutCategoryPage, { buildCategoryMetadata } from "../categoryPage";

export const metadata: Metadata = buildCategoryMetadata("beginner");

export default function Page() {
  return <WorkoutCategoryPage categorySlug="beginner" />;
}
