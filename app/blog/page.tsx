import type { Metadata } from "next";
import Link from "next/link";
import { ALL_BLOG_POSTS } from "./blogPosts";
import "./blog.css";

export const metadata: Metadata = { title: "Gym & Workout Advice | Gym Log Blog", description: "Practical workout tracking, training program, home gym and fitness advice from Gym Log." };

export default function BlogPage() {
  return <main className="blog-shell"><section className="blog-hero"><span>THE GYM LOG BLOG</span><h1>Train smarter. Track it. Keep going.</h1><p>Practical guides for choosing programs, training at home, making progress and fitting fitness into a busy life.</p></section><section className="blog-grid" aria-label="Gym Log articles">{ALL_BLOG_POSTS.map(post => <Link href={`/blog/${post.slug}`} className="blog-card" key={post.slug}><div className="blog-card-image"><img src={post.image} alt={post.imageAlt} loading="lazy" /></div><div className="blog-card-body"><span>{post.keyword}</span><h2>{post.title}</h2><p>{post.description}</p><strong>Read article →</strong></div></Link>)}</section><section className="blog-cta"><span>READY TO TRAIN?</span><h2>Find a workout program that fits you.</h2><p>Browse the Gym Log library, choose a routine and start tracking your training.</p><Link href="/workout-programs">Browse workout programs →</Link></section></main>;
}
