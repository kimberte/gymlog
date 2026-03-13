import type { Metadata } from "next";
import WorkoutCategoryPage, { buildCategoryMetadata } from "../categoryPage";

export const metadata: Metadata = buildCategoryMetadata("hypertrophy");

export default function Page() {
  return <WorkoutCategoryPage categorySlug="hypertrophy" />;
}
