import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "../blogData";

export function generateStaticParams() { return BLOG_POSTS.map(post => ({ slug: post.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return { title: `${post.title} | Gym Log`, description: post.description, keywords: [post.keyword, "workout tracker", "Gym Log"] };
}

const workoutProgramHero = "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Gym_workout_session_focusing_on_strength_training_with_a_female_athlete_using_gym_equipment_in_a_fitness_studio.jpg/1920px-Gym_workout_session_focusing_on_strength_training_with_a_female_athlete_using_gym_equipment_in_a_fitness_studio.jpg";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const related = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 3);
  const heroImage = post.slug === "how-to-pick-the-right-workout-program" ? workoutProgramHero : post.image;
  const heroAlt = post.slug === "how-to-pick-the-right-workout-program" ? "Athlete strength training in a gym" : post.imageAlt;
  return <main className="blog-article-shell"><article className="blog-article"><header className="article-header"><Link href="/blog" className="article-back">← Gym Log Blog</Link><span>{post.keyword}</span><h1>{post.title}</h1><p>{post.description}</p><small>{post.date}</small></header><figure className="article-hero"><img src={heroImage} alt={heroAlt} /><figcaption>{post.slug === "how-to-pick-the-right-workout-program" ? "Training should fit your goals, equipment and schedule. Photo: Shixart1985 / Wikimedia Commons, CC BY 2.0." : "Training should fit your goals, equipment and schedule."}</figcaption></figure><div className="article-layout"><div className="article-content">{post.sections.map((section, index) => <section key={`${post.slug}-${index}`}>{section.heading && <h2>{section.heading}</h2>}{section.paragraphs?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>}</section>)}<div className="article-cta"><strong>Ready to put it into practice?</strong><p>Choose a routine from the Gym Log program library and start tracking your training.</p><Link href="/workout-programs">Browse workout programs →</Link></div></div><aside className="article-links"><h2>Keep exploring</h2>{post.links.map(link => <Link href={link.href} key={link.href}>{link.label} →</Link>)}</aside></div></article><section className="related"><span>MORE FROM GYM LOG</span><h2>Keep reading</h2><div className="related-grid">{related.map(item => <Link href={`/blog/${item.slug}`} key={item.slug}><span>{item.keyword}</span><h3>{item.title}</h3><p>{item.description}</p>Read article →</Link>)}</div></section></main>;
}
