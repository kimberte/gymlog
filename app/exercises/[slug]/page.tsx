import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXERCISE_CATALOG, getCatalogExercise } from "../../lib/exerciseCatalog";
import ExercisePickerActions from "../../components/ExercisePickerActions";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return EXERCISE_CATALOG.map(x => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exercise = getCatalogExercise(slug);
  if (!exercise) return { title: "Exercise not found | Gym Log" };
  return { title: `${exercise.name}: How to Perform, Muscles Worked & Tips | Gym Log`, description: `Learn how to perform the ${exercise.name}, muscles worked, equipment, common mistakes, tips and alternatives.` };
}

function youtubeSearchUrl(exerciseName: string, focus: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} ${focus}`)}`;
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { slug } = await params;
  const exercise = getCatalogExercise(slug);
  if (!exercise) notFound();
  const related = exercise.alternatives.map(slug => getCatalogExercise(slug)).filter(Boolean).slice(0,3);
  const youtubeReferences = [
    { label: "Proper form", query: "proper form" },
    { label: "Technique walkthrough", query: "technique tutorial" },
    { label: "Common mistakes", query: "common mistakes form" },
  ];

  return <main className="exercise-detail-page">
    <style>{`
      .exercise-detail-page{min-height:100vh;background:var(--background,#0b0f14);color:var(--foreground,#f5f7fa);padding-bottom:70px}.exercise-detail-nav,.exercise-detail{max-width:1000px;margin:auto}.exercise-detail-nav{padding:18px 20px;display:flex;justify-content:space-between;align-items:center}.exercise-detail-brand{font-size:20px;font-weight:900;color:inherit;text-decoration:none}.exercise-detail-nav a:last-child{padding:10px 15px;border-radius:12px;background:var(--accent,#ff5722);color:#111827;text-decoration:none;font-size:13px;font-weight:800}.exercise-detail{padding:25px 20px 60px}.exercise-back{color:var(--accent,#ff5722);text-decoration:none;font-weight:750;font-size:13px}.exercise-kicker{margin-top:28px;font-size:12px;letter-spacing:.12em;font-weight:900;color:var(--accent,#ff5722)}.exercise-detail h1{font-size:clamp(38px,7vw,66px);line-height:1.02;letter-spacing:-.045em;margin:9px 0 16px}.exercise-lede{max-width:760px;font-size:18px;line-height:1.65;opacity:.7}.exercise-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:28px 0 38px}.exercise-fact{padding:16px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(255,255,255,.045)}.exercise-fact strong{display:block;font-size:13px}.exercise-fact span{display:block;margin-top:5px;font-size:12px;line-height:1.45;opacity:.6}.exercise-section-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.exercise-card-section{padding:21px;border:1px solid rgba(255,255,255,.1);border-radius:17px;background:rgba(255,255,255,.045);margin-top:14px}.exercise-card-section h2{font-size:21px;margin:0 0 14px}.exercise-card-section ol,.exercise-card-section ul{margin:0;padding-left:22px}.exercise-card-section li{margin:9px 0;line-height:1.55}.exercise-video-section{margin-top:14px;padding:21px;border:1px solid rgba(255,255,255,.1);border-radius:17px;background:rgba(255,255,255,.045)}.exercise-video-section h2{font-size:21px;margin:0 0 7px}.exercise-video-section p{margin:0 0 15px;font-size:13px;line-height:1.5;opacity:.62}.exercise-video-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.exercise-video-link{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.04);color:inherit;text-decoration:none;font-size:13px;font-weight:800}.exercise-video-link:hover{border-color:var(--accent,#ff5722);background:rgba(255,255,255,.065)}.exercise-video-link span{color:var(--accent,#ff5722);font-size:16px}.exercise-cta{margin-top:20px;padding:22px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;align-items:center;gap:20px}.exercise-cta h2{margin:0 0 6px;font-size:20px}.exercise-cta p{margin:0;opacity:.68;font-size:13px;line-height:1.5}.exercise-cta a{padding:12px 16px;border-radius:12px;background:var(--accent,#ff5722);color:#111827;text-decoration:none;font-weight:900;white-space:nowrap}.exercise-related{margin-top:42px;padding-top:30px;border-top:1px solid rgba(255,255,255,.1)}.exercise-related h2{font-size:27px;margin:0 0 15px}.exercise-related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.exercise-related-grid a{padding:16px;border:1px solid rgba(255,255,255,.1);border-radius:14px;color:inherit;text-decoration:none;background:rgba(255,255,255,.04)}.exercise-related-grid a:hover{border-color:var(--accent,#ff5722)}.exercise-related-grid strong{display:block;font-size:14px}.exercise-related-grid span{display:block;font-size:11px;opacity:.55;margin-top:7px}@media(max-width:760px){.exercise-facts{grid-template-columns:1fr 1fr}.exercise-section-grid,.exercise-video-grid,.exercise-related-grid{grid-template-columns:1fr}.exercise-cta{align-items:stretch;flex-direction:column}.exercise-cta a{text-align:center}}@media(max-width:480px){.exercise-detail{padding-top:18px}.exercise-facts{grid-template-columns:1fr 1fr}}
    `}</style>
    <nav className="exercise-detail-nav"><Link href="/" className="exercise-detail-brand">Gym Log</Link><Link href="/exercises">Exercise Database</Link></nav>
    <article className="exercise-detail">
      <Link href="/exercises" className="exercise-back">← Back to exercise database</Link>
      <div className="exercise-kicker">{exercise.category.toUpperCase()} · {exercise.exerciseType.toUpperCase()}</div>
      <h1>{exercise.name}</h1>
      <p className="exercise-lede">{exercise.description}</p>
      <div className="exercise-facts">
        <div className="exercise-fact"><strong>Primary muscles</strong><span>{exercise.primaryMuscles.join(", ")}</span></div>
        <div className="exercise-fact"><strong>Secondary muscles</strong><span>{exercise.secondaryMuscles.length ? exercise.secondaryMuscles.join(", ") : "—"}</span></div>
        <div className="exercise-fact"><strong>Equipment</strong><span>{exercise.equipment.join(", ")}</span></div>
        <div className="exercise-fact"><strong>Difficulty</strong><span>{exercise.difficulty} · {exercise.movementPattern}</span></div>
      </div>
      <div className="exercise-section-grid">
        <section className="exercise-card-section"><h2>How to perform</h2><ol>{exercise.instructions.map(x => <li key={x}>{x}</li>)}</ol></section>
        <section className="exercise-card-section"><h2>Tips</h2><ul>{exercise.tips.map(x => <li key={x}>{x}</li>)}</ul></section>
      </div>
      <section className="exercise-card-section"><h2>Common mistakes</h2><ul>{exercise.commonMistakes.map(x => <li key={x}>{x}</li>)}</ul></section>
      <section className="exercise-video-section">
        <h2>Watch how to perform it</h2>
        <p>Prefer seeing the movement? These YouTube references open in a new tab so you can watch without leaving Gym Log.</p>
        <div className="exercise-video-grid">
          {youtubeReferences.map(reference => <a className="exercise-video-link" href={youtubeSearchUrl(exercise.name, reference.query)} target="_blank" rel="noopener noreferrer" key={reference.label}>{reference.label}<span>↗</span></a>)}
        </div>
      </section>
      <ExercisePickerActions name={exercise.name} slug={exercise.slug} />
      <section className="exercise-cta"><div><h2>Want to log it manually?</h2><p>Gym Log is a notebook first. You can simply open your workout and type the exercise, sets, reps, weight and notes yourself.</p></div><Link href="/">Open Workout Log →</Link></section>
      {related.length ? <section className="exercise-related"><h2>Related exercises</h2><div className="exercise-related-grid">{related.map(x => x ? <Link href={`/exercises/${x.slug}`} key={x.slug}><strong>{x.name}</strong><span>{x.category} · {x.movementPattern}</span></Link> : null)}</div></section> : null}
    </article>
  </main>;
}
