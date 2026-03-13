import type { MetadataRoute } from "next";
import { SEO_WORKOUT_TEMPLATES, WORKOUT_TEMPLATE_CATEGORIES } from "./lib/seoWorkoutTemplates";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gymlogapp.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/workouts",
    ...WORKOUT_TEMPLATE_CATEGORIES.map((category) => `/workouts/${category.slug}`),
    "/privacy",
    "/terms",
    "/subscribe",
    "/community",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: now,
    changeFrequency: path.startsWith("/workouts") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/workouts" ? 0.9 : path.startsWith("/workouts/") ? 0.82 : 0.6,
  }));

  const workoutPages: MetadataRoute.Sitemap = SEO_WORKOUT_TEMPLATES.map((template) => ({
    url: `${siteUrl}/workouts/${template.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...workoutPages];
}
