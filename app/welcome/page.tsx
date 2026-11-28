"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDayEntries, loadWorkouts } from "../lib/storage";
import { PROGRAMS } from "../lib/programs";
import { ALL_BLOG_POSTS } from "../blog/blogPosts";
import "./welcome-homepage.css";

const programCount=new Set(PROGRAMS.map(p=>p.slug)).size;
const WELCOME_SEEN_DATE_KEY = "gym-log-welcome-seen-date";

function dateKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function formatToday(d = new Date()) { return new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(d); }

export default function WelcomePage() {
  const [workouts, setWorkouts] = useState<Record<string, any>>({});
  const [featured, setFeatured] = useState(PROGRAMS[0]);
  const latestBlogs = ALL_BLOG_POSTS.slice(0, 3);

  useEffect(() => {
    setWorkouts(loadWorkouts());
    try {
      localStorage.setItem(WELCOME_SEEN_DATE_KEY, dateKey());
    } catch {}
    if (PROGRAMS.length) setFeatured(PROGRAMS[Math.floor(Math.random() * PROGRAMS.length)]);
  }, []);

  const today = useMemo(() => dateKey(), []);
  const todayWorkouts = getDayEntries(workouts as any, today);
  const workoutNames = todayWorkouts.map((w: any) => String(w?.title || "").trim()).filter(Boolean);
  const primaryWorkout = workoutNames[0] || "No workout logged yet";
  const workoutCount = todayWorkouts.length;

  return <main className="welcome-homepage">
    <div className="welcome-home-shell">
      <Link href="/" className="welcome-today-card">
        <div className="welcome-today-top"><span className="welcome-section-kicker">TODAY</span><span className="welcome-open-link">Open calendar →</span></div>
        <div className="welcome-today-date">{formatToday()}</div>
        <div className="welcome-today-workout">{primaryWorkout}</div>
        {workoutCount > 1 && <div className="welcome-today-extra">+ {workoutCount - 1} more workout{workoutCount - 1 === 1 ? "" : "s"}</div>}
        {!workoutCount && <div className="welcome-today-extra">Tap to log today's training</div>}
      </Link>

      <Link href="/trainers/client" className="welcome-today-card" style={{marginTop:14}}><div className="welcome-today-top"><span className="welcome-section-kicker">MY COACHING</span><span className="welcome-open-link">Open coaching →</span></div><div className="welcome-today-workout">Training with a coach?</div><div className="welcome-today-extra">Review assigned workouts, messages and progress.</div></Link>

      <Link href="/workout-programs" className="welcome-today-card welcome-program-library"><div className="welcome-today-top"><span className="welcome-section-kicker">WORKOUT PROGRAM LIBRARY</span><span className="welcome-open-link">Browse programs →</span></div><div className="welcome-library-count">{programCount} <span>workout programs</span></div><h2>Choose a plan. Start training.</h2><p>Find a routine for your goals, schedule and equipment. Pick a start date and import directly into your calendar in Structured or Notes format.</p><div className="welcome-featured-meta"><span>Strength</span><span>Muscle building</span><span>Glutes</span><span>Home workouts</span><span>Beginner</span></div><strong>Explore the program library →</strong></Link>

      {latestBlogs.length > 0 && <section aria-label="Latest from the Gym Log blog">
        {latestBlogs.map((post, index) => <Link key={post.slug} href={`/blog/${post.slug}`} className="welcome-blog-card">
          <div className="welcome-blog-image"><img src={post.image} alt={post.imageAlt} /></div>
          <div className="welcome-blog-content">
            <div className="welcome-blog-top"><span className="welcome-section-kicker">{index === 0 ? "LATEST FROM THE BLOG" : "FROM THE BLOG"}</span><span className="welcome-open-link">Read article →</span></div>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
          </div>
        </Link>)}
      </section>}

      {featured && <Link href={`/workout-programs/${featured.slug}`} className="welcome-featured-card">
        <div className="welcome-featured-visual"><span>TRY<br/>SOMETHING NEW</span><div className="welcome-featured-mark">GL</div></div>
        <div className="welcome-featured-content"><span className="welcome-section-kicker">TRY SOMETHING NEW</span><h2>{featured.name}</h2><p>{featured.description}</p><div className="welcome-featured-meta"><span>{featured.goal}</span><span>{featured.days} days/week</span><span>{featured.level}</span></div><strong>View program →</strong></div>
      </Link>}

      <p className="welcome-home-footer">Gym Log · Train consistently. Track everything.</p>
    </div>

  </main>;
}
