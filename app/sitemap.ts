import type { MetadataRoute } from "next";
import { SEO_WORKOUT_TEMPLATES, WORKOUT_TEMPLATE_CATEGORIES } from "./lib/seoWorkoutTemplates";
import { PROGRAMS } from "./lib/programs";
import { EXERCISE_CATALOG } from "./lib/exerciseCatalog";
import { ALL_BLOG_POSTS } from "./blog/blogPosts";
import { TRAINER_SEO_PATHS } from "./trainers/seoContent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gymlogapp.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    "","/workouts",...WORKOUT_TEMPLATE_CATEGORIES.map(category=>`/workouts/${category.slug}`),"/workout-programs","/exercises","/privacy","/terms","/subscribe","/community","/trainers","/trainers/demo","/blog",...TRAINER_SEO_PATHS,
  ].map(path=>({url:`${siteUrl}${path||"/"}`,lastModified:now,changeFrequency:path.startsWith("/workouts")||path==="/workout-programs"||path==="/exercises"?"weekly":"monthly",priority:path===""?1:path==="/workouts"?0.9:path==="/workout-programs"?0.95:path==="/exercises"?0.92:path.startsWith("/workouts/")?0.82:0.6}));
  const workoutPages: MetadataRoute.Sitemap = SEO_WORKOUT_TEMPLATES.map(template=>({url:`${siteUrl}/workouts/${template.slug}`,lastModified:now,changeFrequency:"monthly",priority:0.8}));
  const programPages: MetadataRoute.Sitemap = PROGRAMS.map(program=>({url:`${siteUrl}/workout-programs/${program.slug}`,lastModified:now,changeFrequency:"monthly",priority:0.78}));
  const exercisePages: MetadataRoute.Sitemap = EXERCISE_CATALOG.map(exercise=>({url:`${siteUrl}/exercises/${exercise.slug}`,lastModified:now,changeFrequency:"monthly",priority:0.7}));
  const blogPages:MetadataRoute.Sitemap=ALL_BLOG_POSTS.map(post=>{const date=new Date(post.date);return {url:siteUrl+"/blog/"+post.slug,...(Number.isFinite(date.getTime())?{lastModified:date}:{}),changeFrequency:"monthly",priority:0.7};});
  return Array.from(new Map([...staticPages,...workoutPages,...programPages,...exercisePages,...blogPages].map(p=>[p.url,p])).values());
}
