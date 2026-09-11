import type { Metadata } from "next";
import Link from "next/link";
import ProgramLibraryV2 from "./ProgramLibraryV2";
import ProgramFeaturedStyles from "./ProgramFeaturedStyles";
import ProgramThemeShell from "./ProgramThemeShell";
import { PROGRAMS } from "../lib/programs";

export const metadata: Metadata = {
  title: `${PROGRAMS.length}+ Workout Programs & Training Routines | Gym Log`,
  description: `Explore ${PROGRAMS.length}+ workout programs for strength, muscle building, hypertrophy, powerlifting, bodybuilding, home training and conditioning. Find a routine and track it with Gym Log.`,
};

const featuredSlugs = ["starting-strength","stronglifts-5x5","531","push-pull-legs","upper-lower-split","full-body-3-day","jeff-nippard-ppl","beginner-full-body-3"];

export default function WorkoutProgramsPage() {
  const featured = featuredSlugs.map(slug => PROGRAMS.find(p => p.slug === slug)).filter(Boolean);
  return (
    <ProgramThemeShell>
      <ProgramFeaturedStyles />
      <nav className="programs-nav"><Link href="/" className="programs-brand">Gym Log</Link><Link href="/" className="programs-back">Open Workout Log</Link></nav>
      <section className="programs-hero programs-hero-visual">
        <div className="programs-hero-image" aria-hidden="true" />
        <div className="programs-hero-content">
          <div className="programs-kicker">THE GYM LOG PROGRAM LIBRARY</div>
          <h1>Find a workout program that fits you.</h1>
          <p>Explore {PROGRAMS.length} workout programs and practical Gym Log templates. Pick a routine, learn how it works, then track your training.</p>
          <div className="programs-hero-actions"><Link href="/workout-programs/find" className="programs-back">Find my workout →</Link><a href="#program-library-results" className="programs-back programs-browse-cta">Browse Programs</a></div>
        </div>
      </section>
      <section className="program-featured" aria-labelledby="featured-heading">
        <div className="program-section-heading"><div><div className="program-detail-kicker">GOOD PLACES TO START</div><h2 id="featured-heading">Popular workout program starting points</h2><p>Recognizable routines for strength, muscle building and beginner-friendly training. Swipe through and pick one to explore.</p></div><a href="#program-library-results" className="program-section-link">Browse Programs →</a></div>
        <div className="program-featured-row">{featured.map(program => program ? <Link href={`/workout-programs/${program.slug}`} className="program-featured-card" key={program.slug}><span className="program-featured-image" aria-hidden="true" /><div className="program-featured-card-body"><span>{program.category} · {program.days} days</span><strong>{program.name}</strong><small>{program.goal}</small><b>View &amp; track →</b></div></Link> : null)}</div>
      </section>
      <ProgramLibraryV2 programs={PROGRAMS} />
    </ProgramThemeShell>
  );
}
