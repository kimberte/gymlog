import type { Metadata } from "next";
import Link from "next/link";
import ProgramLibrary from "./ProgramLibrary";
import { PROGRAMS } from "../lib/programs";

export const metadata: Metadata = {
  title: "100+ Workout Programs & Training Routines | Gym Log",
  description: "Explore 100+ workout programs for strength, muscle building, hypertrophy, powerlifting, bodybuilding, home training and conditioning. Find a routine and track it with Gym Log.",
};

const browseLinks = [
  ["/workout-programs/goal/muscle", "Muscle building"],
  ["/workout-programs/goal/strength", "Strength"],
  ["/workout-programs/goal/beginners", "Beginner programs"],
  ["/workout-programs/goal/powerlifting", "Powerlifting"],
  ["/workout-programs/goal/home", "Home workouts"],
  ["/workout-programs/goal/3-day", "3-day programs"],
  ["/workout-programs/goal/4-day", "4-day programs"],
  ["/workout-programs/goal/5-day", "5-day programs"],
  ["/workout-programs/goal/6-day", "6-day programs"],
  ["/workout-programs/goal/dumbbells", "Dumbbell programs"],
  ["/workout-programs/goal/full-body", "Full-body programs"],
  ["/workout-programs/goal/hypertrophy", "Hypertrophy programs"],
];

const featuredSlugs = [
  "starting-strength",
  "stronglifts-5x5",
  "531",
  "push-pull-legs",
  "upper-lower-split",
  "full-body-3-day",
  "jeff-nippard-ppl",
  "beginner-full-body-3",
];

export default function WorkoutProgramsPage() {
  const featured = featuredSlugs.map(slug => PROGRAMS.find(p => p.slug === slug)).filter(Boolean);

  return (
    <main className="programs-page">
      <nav className="programs-nav"><Link href="/" className="programs-brand">Gym Log</Link><Link href="/" className="programs-back">Open Workout Log</Link></nav>
      <section className="programs-hero">
        <div className="programs-kicker">THE GYM LOG PROGRAM LIBRARY</div>
        <h1>Find a workout program that fits you.</h1>
        <p>Explore {PROGRAMS.length} workout programs and practical Gym Log templates. Pick a routine, learn how it works, then track your training.</p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:22}}><Link href="/workout-programs/find" className="programs-back">Find my workout →</Link><Link href="/workout-programs/goal/muscle" className="programs-back" style={{background:"rgba(255,255,255,.08)",color:"inherit"}}>Browse muscle-building programs</Link></div>
      </section>

      <section className="program-featured" aria-labelledby="featured-heading">
        <div className="program-detail-kicker">GOOD PLACES TO START</div>
        <h2 id="featured-heading">Popular workout program starting points</h2>
        <p>Not sure where to begin? These recognizable routines cover strength, muscle building and beginner-friendly training schedules.</p>
        <div className="program-featured-grid">
          {featured.map(program => program ? (
            <Link href={`/workout-programs/${program.slug}`} className="program-featured-card" key={program.slug}>
              <span>{program.category} · {program.days} days</span>
              <strong>{program.name}</strong>
              <small>{program.goal}</small>
              <b>View program →</b>
            </Link>
          ) : null)}
        </div>
      </section>

      <section className="program-browse-links" aria-labelledby="browse-heading"><div className="program-detail-kicker">BROWSE BY GOAL & TRAINING STYLE</div><h2 id="browse-heading">Workout program guides</h2><p>Jump directly to programs for a specific goal, schedule or equipment setup.</p><div className="program-browse-grid">{browseLinks.map(([href,label]) => <Link href={href} key={href}>{label}<span>→</span></Link>)}</div></section>
      <ProgramLibrary programs={PROGRAMS} />
      <style jsx global>{`
        .program-featured{max-width:1100px;margin:0 auto;padding:24px 20px 12px}
        .program-featured h2{font-size:28px;margin:7px 0}
        .program-featured>p{max-width:700px;line-height:1.6;opacity:.68;margin:0}
        .program-featured-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px}
        .program-featured-card{display:flex;flex-direction:column;gap:8px;min-height:142px;padding:16px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(255,255,255,.04);color:inherit;text-decoration:none;transition:transform .15s ease,border-color .15s ease,background .15s ease}
        .program-featured-card:hover{transform:translateY(-2px);border-color:var(--accent,#ff5722);background:rgba(255,255,255,.07)}
        .program-featured-card:focus-visible{outline:2px solid var(--accent,#ff5722);outline-offset:3px}
        .program-featured-card>span,.program-featured-card>small{font-size:11px;opacity:.58}
        .program-featured-card>strong{font-size:16px;line-height:1.25;flex:1}
        .program-featured-card>b{font-size:12px;color:var(--accent,#ff5722)}
        @media(max-width:800px){.program-featured-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:520px){.program-featured{padding-top:20px}.program-featured h2{font-size:24px}.program-featured-grid{grid-template-columns:1fr}.program-featured-card{min-height:0}}
      `}</style>
    </main>
  );
}
