import type { MetadataRoute } from "next";
import { SEO_WORKOUT_TEMPLATES, WORKOUT_TEMPLATE_CATEGORIES } from "./lib/seoWorkoutTemplates";
import { PROGRAMS } from "./lib/programs";
import { EXERCISE_CATALOG } from "./lib/exerciseCatalog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gymlogapp.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    "","/workouts",...WORKOUT_TEMPLATE_CATEGORIES.map(category=>`/workouts/${category.slug}`),"/workout-programs","/exercises","/privacy","/terms","/subscribe","/community",
  ].map(path=>({url:`${siteUrl}${path||"/"}`,lastModified:now,changeFrequency:path.startsWith("/workouts")||path==="/workout-programs"||path==="/exercises"?"weekly":"monthly",priority:path===""?1:path==="/workouts"?0.9:path==="/workout-programs"?0.95:path==="/exercises"?0.92:path.startsWith("/workouts/")?0.82:0.6}));
  const workoutPages: MetadataRoute.Sitemap = SEO_WORKOUT_TEMPLATES.map(template=>({url:`${siteUrl}/workouts/${template.slug}`,lastModified:now,changeFrequency:"monthly",priority:0.8}));
  const programPages: MetadataRoute.Sitemap = PROGRAMS.map(program=>({url:`${siteUrl}/workout-programs/${program.slug}`,lastModified:now,changeFrequency:"monthly",priority:0.78}));
  const exercisePages: MetadataRoute.Sitemap = EXERCISE_CATALOG.map(exercise=>({url:`${siteUrl}/exercises/${exercise.slug}`,lastModified:now,changeFrequency:"monthly",priority:0.7}));
  return [...staticPages,...workoutPages,...programPages,...exercisePages];
}
