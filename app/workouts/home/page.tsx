import type { Metadata } from "next";
import WorkoutCategoryPage, { buildCategoryMetadata } from "../categoryPage";

export const metadata: Metadata = buildCategoryMetadata("home");

export default function Page() {
  return <WorkoutCategoryPage categorySlug="home" />;
}
