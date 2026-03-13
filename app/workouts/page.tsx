import Link from "next/link";
import type { Metadata } from "next";
import { SEO_WORKOUT_TEMPLATES, WORKOUT_TEMPLATE_CATEGORIES, getTemplatesForCategory } from "../lib/seoWorkoutTemplates";

export const metadata: Metadata = {
  title: "Workout Templates",
  description:
    "Free workout templates for push pull legs, 5x5, upper lower, full body, hypertrophy, home dumbbell training, and more. Import any plan into Gym Log.",
  alternates: {
    canonical: "/workouts",
  },
  openGraph: {
    title: "Workout Templates | Gym Log",
    description: "Free workout templates with weekly schedules and one-click Gym Log import.",
    url: "/workouts",
  },
};

export default function WorkoutsIndexPage() {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 20px 56px" }}>
      <div style={{ marginBottom: 18 }}>
        <Link href="/" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
          ← Back to Gym Log
        </Link>
      </div>

      <section
        style={{
          padding: "30px 24px",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
          boxShadow: "0 18px 40px rgba(0,0,0,0.2)",
          marginBottom: 28,
        }}
      >
        <p style={{ margin: "0 0 10px", color: "var(--accent)", fontWeight: 700, letterSpacing: 0.2 }}>
          Free workout plans
        </p>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.08 }}>
          Find a workout template you can actually start this week
        </h1>
        <p style={{ margin: "16px 0 0", maxWidth: 780, opacity: 0.9, lineHeight: 1.7 }}>
          Browse simple, practical workout plans for strength, muscle building, and beginner training. Each template
          includes a weekly layout, exercise ideas, and a fast way to add it straight into your Gym Log calendar.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 28 }}>Browse by category</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
            alignItems: "stretch",
          }}
        >
          {WORKOUT_TEMPLATE_CATEGORIES.map((category) => {
            const count = getTemplatesForCategory(category.slug).length;
            return (
              <Link
                key={category.slug}
                href={`/workouts/${category.slug}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  borderRadius: 20,
                  padding: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  display: "block",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <h3 style={{ margin: 0, fontSize: 20 }}>{category.shortName}</h3>
                  <span style={{ fontSize: 12, opacity: 0.72 }}>{count} templates</span>
                </div>
                <p style={{ margin: "10px 0 0", opacity: 0.85, lineHeight: 1.6, fontSize: 14 }}>{category.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 style={{ margin: "0 0 14px", fontSize: 28 }}>All workout templates</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
            alignItems: "stretch",
          }}
        >
        {SEO_WORKOUT_TEMPLATES.map((template) => (
          <article
            key={template.slug}
            style={{
              borderRadius: 20,
              padding: 20,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              minHeight: 280,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  opacity: 0.9,
                  lineHeight: 1.2,
                }}
              >
                {template.frequency}
              </span>
              <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.15 }}>{template.name}</h2>
            </div>

            <p style={{ margin: 0, opacity: 0.88, lineHeight: 1.65 }}>{template.shortDescription}</p>

            <div style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, display: "grid", gap: 4 }}>
              <div>
                <strong>Goal:</strong> {template.goal}
              </div>
              <div>
                <strong>Equipment:</strong> {template.equipment}
              </div>
              <div>
                <strong>Level:</strong> {template.level}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: "auto", paddingTop: 6 }}>
              <Link
                href={`/workouts/${template.slug}`}
                style={{
                  textDecoration: "none",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "var(--accent)",
                  color: "#111827",
                  fontWeight: 700,
                }}
              >
                View template
              </Link>
              <Link
                href={`/import-template/${template.slug}`}
                style={{
                  textDecoration: "none",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "inherit",
                  fontWeight: 600,
                }}
              >
                Import into Gym Log
              </Link>
            </div>
          </article>
        ))}
        </div>
      </section>
    </main>
  );
}
