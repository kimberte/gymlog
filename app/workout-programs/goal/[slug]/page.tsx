import type { Metadata } from "next";
import Link from "next/link";
import { PROGRAM_METADATA } from "../../programMetadata";

type Landing = { title: string; description: string; intro: string; tag: string; heading: string; body: string };

const LANDINGS: Record<string, Landing> = {
  muscle: { title: "Best Workout Programs for Building Muscle", description: "Compare workout programs for muscle growth, hypertrophy and bodybuilding across different experience levels and training schedules.", intro: "Find structured programs for building muscle and compare training frequency, experience level, equipment and style before choosing a routine.", tag: "muscle", heading: "How to choose a muscle-building program", body: "The best routine is one you can perform consistently and recover from. Compare weekly frequency, available equipment and training experience, then choose a program whose structure fits your schedule." },
  strength: { title: "Best Strength Workout Programs", description: "Compare strength workout programs for beginners, intermediate lifters and advanced athletes, including barbell and powerbuilding routines.", intro: "Explore strength-focused routines by training frequency, experience level, equipment and training style.", tag: "strength", heading: "How to choose a strength program", body: "Strength programs differ in frequency, exercise selection and progression. Beginners often benefit from simple repeatable structures, while experienced lifters may prefer more specialized programming." },
  beginners: { title: "Best Beginner Workout Programs", description: "Find beginner-friendly workout programs for building strength, muscle and fitness with manageable weekly schedules.", intro: "Starting out? Compare beginner routines built around simple structures, repeatable training and sustainable progression.", tag: "beginner", heading: "What makes a good beginner workout program?", body: "A useful beginner plan is simple enough to learn, frequent enough to practice key movements and realistic enough to follow every week. Start with a manageable schedule and progress gradually." },
  powerlifting: { title: "Best Powerlifting Programs", description: "Compare powerlifting workout programs for squat, bench press and deadlift strength, including structured cycles and meet preparation.", intro: "Explore powerlifting-focused routines and compare frequency, experience level and training emphasis.", tag: "powerlifting", heading: "Choosing a powerlifting program", body: "Powerlifting programs organize training around the squat, bench press and deadlift. Consider your experience, competition timeline and recovery capacity when choosing between higher-frequency and lower-frequency approaches." },
  home: { title: "Best Home Workout Programs", description: "Find workout programs for home gyms, dumbbells, bodyweight and minimal equipment, with options for strength, muscle and fitness.", intro: "You do not need a commercial gym to follow a structured plan. Compare home-friendly programs by goal, equipment and training frequency.", tag: "home-friendly", heading: "Choosing a home workout program", body: "Start with the equipment you actually have and select a schedule you can repeat. Home programs can use dumbbells, bodyweight, kettlebells or minimal equipment while still providing structured progression." },
  "3-day": { title: "Best 3-Day Workout Programs", description: "Explore 3-day workout programs for strength, muscle building and general fitness, including full-body and beginner routines.", intro: "Three training days can provide a practical balance between training stimulus, recovery and a busy schedule.", tag: "3-day", heading: "Why choose a 3-day workout split?", body: "Three days per week is a versatile schedule for people who want consistent training without being in the gym most days. Full-body and strength-focused programs are especially common at this frequency." },
  "4-day": { title: "Best 4-Day Workout Programs", description: "Compare 4-day workout programs for strength, hypertrophy, powerbuilding and general fitness.", intro: "Four training days provide more room for weekly volume while remaining manageable for many lifters.", tag: "4-day", heading: "Why choose a 4-day workout split?", body: "Four days can provide enough training frequency to distribute volume across more sessions. Upper/lower, hypertrophy and powerbuilding structures are common choices at this frequency." },
  "5-day": { title: "Best 5-Day Workout Programs", description: "Compare 5-day workout programs for muscle building, bodybuilding, strength and upper/lower training.", intro: "Five-day routines can work well for lifters who enjoy frequent training and can consistently recover between sessions.", tag: "5-day", heading: "Is a 5-day workout program right for you?", body: "A five-day schedule gives you plenty of room to distribute weekly work, but the extra sessions should fit your recovery and lifestyle. Compare bodybuilding, upper/lower and strength-oriented options." },
  "6-day": { title: "Best 6-Day Workout Programs", description: "Explore 6-day workout programs including push pull legs, bodybuilding and high-frequency hypertrophy routines.", intro: "Compare higher-frequency programs for experienced lifters who prefer training most days of the week.", tag: "6-day", heading: "Who should use a 6-day workout program?", body: "Six-day routines can distribute training volume across shorter sessions and are common in bodybuilding and push-pull-legs formats. They require a schedule and recovery strategy that can support frequent training." },
  dumbbells: { title: "Best Dumbbell Workout Programs", description: "Find dumbbell workout programs for building muscle, strength and fitness at home or in a gym.", intro: "Compare dumbbell-focused routines when your equipment is limited or you prefer the flexibility of dumbbell training.", tag: "dumbbells", heading: "Why train with dumbbells?", body: "Dumbbells can support full-body, upper/lower and push-pull-legs routines while requiring less specialized equipment. Choose a program that matches the weights and space you have available." },
  "full-body": { title: "Best Full-Body Workout Programs", description: "Compare full-body workout programs for beginners, strength, muscle building and efficient training schedules.", intro: "Full-body programs train multiple major movement patterns in each session and can work especially well with two to four weekly workouts.", tag: "full-body", heading: "Who benefits from full-body training?", body: "Full-body routines are useful when you want to train major muscle groups multiple times per week or have fewer days available. They can be adapted for beginners, strength and hypertrophy goals." },
  hypertrophy: { title: "Best Hypertrophy Workout Programs", description: "Explore hypertrophy and muscle-building workout programs across full-body, upper/lower, push-pull-legs and bodybuilding formats.", intro: "Compare muscle-building routines by training frequency, experience level, equipment and split style.", tag: "hypertrophy", heading: "What to look for in a hypertrophy program", body: "A hypertrophy routine should organize enough productive weekly work while allowing recovery. Compare exercise selection, frequency and total training volume alongside the schedule you can sustain." },
};

export function generateStaticParams() { return Object.keys(LANDINGS).map(slug => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = LANDINGS[slug];
  return page ? { title: `${page.title} | Gym Log`, description: page.description, alternates: { canonical: `/workout-programs/goal/${slug}` } } : { title: "Workout Programs | Gym Log" };
}

function matchesFor(tag: string) {
  return PROGRAM_METADATA.filter(p => {
    if (tag === "beginner") return p.levelTag === "beginner";
    if (/^[3-6]-day$/.test(tag)) return p.days === Number(tag[0]);
    if (tag === "dumbbells") return p.equipmentTags.includes("dumbbells");
    return p.goalTags.includes(tag) || p.styleTags.includes(tag) || p.equipmentTags.includes(tag);
  }).slice(0, 12);
}

export default async function GoalLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = LANDINGS[slug];
  if (!page) return null;
  const matches = matchesFor(page.tag);
  const faq = [
    { q: "How do I choose a workout program?", a: "Start with your primary goal, experience level, available training days and equipment. A sustainable program is usually more useful than a theoretically ideal plan you cannot follow consistently." },
    { q: "Can I track these programs in Gym Log?", a: "Yes. Open an individual program from this page to review its structure and use the import option to add the plan to your Gym Log calendar." },
    { q: "Can I change a program to fit my schedule?", a: "Many templates can be adapted, but changes should preserve the program's intended training structure. Use the individual program notes as a starting point and adjust around your recovery and available days." },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: page.description,
    url: `https://www.gymlogapp.com/workout-programs/goal/${slug}`,
    mainEntity: { "@type": "ItemList", numberOfItems: matches.length, itemListElement: matches.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: `https://www.gymlogapp.com/workout-programs/${p.slug}` })) },
  };
  const faqData = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(x => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) };

  return <main className="program-detail-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
    <nav className="programs-nav"><Link href="/" className="programs-brand">Gym Log</Link><Link href="/workout-programs/find" className="programs-back">Find my workout</Link></nav>
    <article className="program-detail">
      <Link href="/workout-programs" className="program-breadcrumb">← All programs</Link>
      <div className="program-detail-kicker">WORKOUT PROGRAM GUIDE</div>
      <h1>{page.title}</h1>
      <p className="program-lede">{page.intro}</p>
      <section className="program-content-card"><h2>Programs to compare</h2><p>Review the options below, open any program for its weekly structure and progression notes, then import the routine into Gym Log when you are ready to track it.</p><div className="program-related-grid">{matches.map(p => <Link className="program-related-card" href={`/workout-programs/${p.slug}`} key={p.slug}><strong>{p.name}</strong><span>{p.category} · {p.days} days · {p.level}</span></Link>)}</div></section>
      <section className="program-content-card"><h2>{page.heading}</h2><p>{page.body}</p></section>
      <section className="program-content-card"><h2>Track your chosen program</h2><p>Gym Log turns a program into a practical workout calendar. Review the plan, choose a start date and import it into your log so you can record your training as you go.</p><Link href="/workout-programs/find" className="program-cta-button">Use the Workout Finder →</Link></section>
      <section className="program-content-card"><h2>Frequently asked questions</h2>{faq.map(x => <div key={x.q} className="program-faq"><h3>{x.q}</h3><p>{x.a}</p></div>)}</section>
      <section className="program-related"><div className="program-detail-kicker">MORE WAYS TO BROWSE</div><h2>Explore other workout guides</h2><div className="program-related-grid">{Object.entries(LANDINGS).filter(([key]) => key !== slug).slice(0, 6).map(([key, x]) => <Link className="program-related-card" href={`/workout-programs/goal/${key}`} key={key}><strong>{x.title}</strong><span>Compare related programs →</span></Link>)}</div></section>
    </article>
  </main>;
}
