import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import WorkoutDownloadGate from "./WorkoutDownloadGate";
import {
  SEO_WORKOUT_TEMPLATES,
  getRelatedTemplates,
  getSeoTemplateBySlug,
  getTemplateCategorySlugs,
  getWorkoutTemplateCategoryBySlug,
} from "../../lib/seoWorkoutTemplates";

export async function generateStaticParams() {
  return SEO_WORKOUT_TEMPLATES.map((template) => ({ slug: template.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const template = getSeoTemplateBySlug(slug);
  if (!template) return {};

  return {
    title: template.seoTitle,
    description: template.metaDescription,
    alternates: {
      canonical: `/workouts/${template.slug}`,
    },
    keywords: [
      template.searchIntent,
      template.name.toLowerCase(),
      "free workout template",
      "workout tracker",
      "gym log",
      "workout calendar",
    ],
    openGraph: {
      title: `${template.seoTitle} | Gym Log`,
      description: template.metaDescription,
      url: `/workouts/${template.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${template.seoTitle} | Gym Log`,
      description: template.metaDescription,
    },
  };
}

export default async function WorkoutTemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getSeoTemplateBySlug(slug);
  if (!template) notFound();

  const related = getRelatedTemplates(template.relatedSlugs);
  const categoryLinks = getTemplateCategorySlugs(template)
    .map((slug) => getWorkoutTemplateCategoryBySlug(slug))
    .filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: template.seoTitle,
    description: template.metaDescription,
    mainEntityOfPage: `/workouts/${template.slug}`,
    about: {
      "@type": "ExercisePlan",
      name: template.name,
      category: template.goal,
      activityFrequency: template.frequency,
    },
    publisher: {
      "@type": "Organization",
      name: "Gym Log",
    },
  };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 60px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
          padding: "14px",
          borderRadius: 18,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ minWidth: 240 }}>
          <div style={{ fontWeight: 800 }}>Want the offline version?</div>
          <div style={{ marginTop: 4, fontSize: 14, opacity: 0.82 }}>Download this workout as PDF or Excel, or import it into Gym Log to track your progress.</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="#download"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.96)",
              color: "#111827",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Download PDF / Excel
          </a>
          <Link
            href={`/import-template/${template.slug}`}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "var(--accent)",
              color: "#111827",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Track this workout automatically
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: 18, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Link href="/workouts" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>
          ← All workout templates
        </Link>
        <Link href="/" style={{ color: "inherit", textDecoration: "none", opacity: 0.8 }}>
          Gym Log home
        </Link>
      </div>

      <div className="template-layout">
        <article
          style={{
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            padding: "28px 24px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
            minWidth: 0,
          }}
        >
          <p style={{ margin: 0, color: "var(--accent)", fontWeight: 700 }}>{template.searchIntent}</p>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(2rem, 4vw, 3.1rem)", lineHeight: 1.05 }}>{template.name}</h1>
          <p style={{ margin: "16px 0 0", opacity: 0.9, lineHeight: 1.72, maxWidth: 820 }}>{template.metaDescription}</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 22,
            }}
          >
            {[
              ["Level", template.level],
              ["Goal", template.goal],
              ["Frequency", template.frequency],
              ["Equipment", template.equipment],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: "14px 14px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.65 }}>{label}</div>
                <div style={{ marginTop: 6, fontWeight: 600, lineHeight: 1.45 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            {categoryLinks.map((category) => (
              <Link
                key={category!.slug}
                href={`/workouts/${category!.slug}`}
                style={{
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  color: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {category!.shortName}
              </Link>
            ))}
          </div>

          {template.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} style={{ margin: "18px 0 0", lineHeight: 1.82, opacity: 0.94 }}>
              {paragraph}
            </p>
          ))}

          <section style={{ marginTop: 30 }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Weekly schedule</h2>
            <p style={{ lineHeight: 1.75, opacity: 0.9 }}>
              This {template.name.toLowerCase()} is organized as a {template.frequency.toLowerCase()} plan. After import,
              the workout days are spaced out on your calendar so you can start with a realistic week instead of adding
              everything manually.
            </p>
            <div style={{ display: "grid", gap: 14 }}>
              {template.days.map((day) => (
                <div
                  key={day.name + day.offsetDays}
                  style={{
                    borderRadius: 18,
                    padding: 18,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 22 }}>{day.name}</h3>
                    <span style={{ opacity: 0.72, fontSize: 14 }}>
                      {day.offsetDays === 0 ? "Starts on your chosen date" : `${day.offsetDays} day${day.offsetDays > 1 ? "s" : ""} later`}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", opacity: 0.86 }}>{day.focus}</p>
                  <ul style={{ margin: "14px 0 0", paddingLeft: 18, lineHeight: 1.8 }}>
                    {day.exercises.map((exercise) => (
                      <li key={exercise}>{exercise}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 30 }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Why this template works</h2>
            <ul style={{ margin: "14px 0 0", paddingLeft: 18, lineHeight: 1.8 }}>
              {template.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>

          <section style={{ marginTop: 30 }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Who should use this workout</h2>
            <p style={{ lineHeight: 1.75, opacity: 0.9 }}>
              This routine is best for people who want a clear structure they can follow right away. It is especially useful for:
            </p>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.8 }}>
              {template.whoFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section style={{ marginTop: 30 }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Track this workout properly</h2>
            <p style={{ lineHeight: 1.78, opacity: 0.92 }}>
              You can follow this workout manually, but tracking your sets, reps, and progression is what actually drives results.
              Gym Log automatically places each session on your calendar so you can focus on lifting instead of remembering what you did last time.
            </p>
            <ol style={{ margin: "12px 0 0", paddingLeft: 18, lineHeight: 1.85 }}>
              <li>Import the workout in one click.</li>
              <li>Log your sets and reps as you train.</li>
              <li>Track progression week over week.</li>
              <li>Never lose your workout history again.</li>
            </ol>
            <div style={{ marginTop: 16 }}>
              <Link
                href={`/import-template/${template.slug}`}
                style={{
                  display: "inline-block",
                  padding: "12px 18px",
                  borderRadius: 14,
                  background: "var(--accent)",
                  color: "#111827",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Start tracking this workout →
              </Link>
            </div>
          </section>

          <section id="download" style={{ marginTop: 34 }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Download this workout</h2>
            <p style={{ margin: "10px 0 0", lineHeight: 1.72, opacity: 0.9 }}>
              Prefer to use the plan offline? Create a free Gym Log account or sign in to unlock instant PDF and Excel downloads.
            </p>
            <WorkoutDownloadGate slug={template.slug} templateName={template.name} />
          </section>

          <section style={{ marginTop: 30 }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Coaching notes</h2>
            <ul style={{ margin: "14px 0 0", paddingLeft: 18, lineHeight: 1.8 }}>
              {template.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          <section style={{ marginTop: 30 }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Frequently asked questions</h2>
            <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
              {template.faqs.map((faq) => (
                <div
                  key={faq.question}
                  style={{
                    borderRadius: 18,
                    padding: 18,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 18 }}>{faq.question}</h3>
                  <p style={{ margin: "8px 0 0", lineHeight: 1.72, opacity: 0.9 }}>{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </article>

        <aside style={{ display: "grid", gap: 16, alignContent: "start", minWidth: 0 }}>
          <div
            style={{
              borderRadius: 22,
              padding: 22,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24 }}>Import this template</h2>
            <p style={{ margin: "12px 0 0", lineHeight: 1.72, opacity: 0.9 }}>
              Add this routine to your Gym Log calendar. After import you can open each day, edit the exercises, and make it your own.
            </p>
            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              <Link
                href={`/import-template/${template.slug}`}
                style={{
                  textDecoration: "none",
                  textAlign: "center",
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: "var(--accent)",
                  color: "#111827",
                  fontWeight: 800,
                }}
              >
                Import into Gym Log
              </Link>
              <Link
                href="/"
                style={{
                  textDecoration: "none",
                  textAlign: "center",
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "inherit",
                  fontWeight: 600,
                }}
              >
                Open app home
              </Link>
            </div>
          </div>

          <div
            style={{
              borderRadius: 22,
              padding: 22,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 22 }}>Related templates</h2>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/workouts/${item.slug}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    borderRadius: 16,
                    padding: 14,
                    border: "1px solid rgba(255,255,255,0.09)",
                    background: "rgba(255,255,255,0.03)",
                    minWidth: 0,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ marginTop: 6, fontSize: 14, opacity: 0.8, lineHeight: 1.55 }}>{item.shortDescription}</div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .template-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
          gap: 22px;
          align-items: start;
        }

        @media (max-width: 920px) {
          .template-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
