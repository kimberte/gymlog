import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgram, PROGRAMS } from "../../lib/programs";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROGRAMS.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const p = getProgram(slug);
  return p
    ? {
        title: `${p.name} Workout Program | Gym Log`,
        description: `${p.name}: overview, training structure, goals, experience level and how to track the program with Gym Log.`,
      }
    : { title: "Workout Program | Gym Log" };
}

export default async function ProgramPage({ params }: PageProps) {
  const { slug } = await params;
  const p = getProgram(slug);
  if (!p) notFound();

  return (
    <main className="program-detail-page">
      <nav className="programs-nav">
        <Link href="/workout-programs" className="programs-brand">Gym Log</Link>
        <Link href="/" className="programs-back">Open Workout Log</Link>
      </nav>
      <article className="program-detail">
        <Link href="/workout-programs" className="program-breadcrumb">← Back to program library</Link>
        <div className="program-detail-kicker">{p.category}</div>
        <h1>{p.name}</h1>
        <p className="program-lede">{p.description}</p>
        <div className="program-facts">
          <div><strong>{p.days}</strong><span>days / week</span></div>
          <div><strong>{p.level}</strong><span>experience</span></div>
          <div><strong>{p.goal}</strong><span>primary goal</span></div>
          <div><strong>{p.equipment}</strong><span>equipment</span></div>
        </div>
        <div className="program-detail-grid">
          <section className="program-content-card">
            <h2>How it is structured</h2>
            <ul>{p.structure.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="program-content-card">
            <h2>Who it is best for</h2>
            <p>{p.bestFor}</p>
          </section>
        </div>
        <section className="program-content-card program-note">
          <h2>Before you start</h2>
          <p>{p.notes}</p>
          <p>Gym Log is a workout tracking tool, not a substitute for individualized medical or coaching advice. Choose loads and training frequency that are appropriate for you.</p>
        </section>
        <section className="program-cta">
          <div><h2>Ready to track it?</h2><p>Open Gym Log and start recording your workouts.</p></div>
          <Link href="/" className="program-cta-button">Start logging →</Link>
        </section>
      </article>
    </main>
  );
}
