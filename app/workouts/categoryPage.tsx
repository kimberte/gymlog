import Link from "next/link";
import {
  type WorkoutTemplateCategory,
  getTemplateCategorySlugs,
  getTemplatesForCategory,
  getWorkoutTemplateCategoryBySlug,
  WORKOUT_TEMPLATE_CATEGORIES,
} from "../lib/seoWorkoutTemplates";

export function buildCategoryMetadata(categorySlug: WorkoutTemplateCategory["slug"]) {
  const category = getWorkoutTemplateCategoryBySlug(categorySlug);
  if (!category) return {};

  return {
    title: `${category.name} | Gym Log`,
    description: category.description,
    alternates: {
      canonical: `/workouts/${category.slug}`,
    },
    keywords: [...category.keywords, "free workout template", "gym log", "workout calendar"],
    openGraph: {
      title: `${category.name} | Gym Log`,
      description: category.description,
      url: `/workouts/${category.slug}`,
    },
  };
}

export default function WorkoutCategoryPage({ categorySlug }: { categorySlug: WorkoutTemplateCategory["slug"] }) {
  const category = getWorkoutTemplateCategoryBySlug(categorySlug);
  if (!category) return null;

  const templates = getTemplatesForCategory(categorySlug);
  const otherCategories = WORKOUT_TEMPLATE_CATEGORIES.filter((item) => item.slug !== categorySlug);

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 20px 56px" }}>
      <div style={{ marginBottom: 18, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Link href="/workouts" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>
          ← All workout templates
        </Link>
        <Link href="/" style={{ color: "inherit", textDecoration: "none", opacity: 0.8 }}>
          Gym Log home
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
          {category.shortName} plans
        </p>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.08 }}>{category.name}</h1>
        <p style={{ margin: "16px 0 0", maxWidth: 820, opacity: 0.92, lineHeight: 1.7 }}>{category.description}</p>
        {category.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 28)} style={{ margin: "14px 0 0", maxWidth: 860, opacity: 0.9, lineHeight: 1.75 }}>
            {paragraph}
          </p>
        ))}
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 28 }}>Browse {templates.length} {category.shortName.toLowerCase()} templates</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          {templates.map((template) => {
            const tags = getTemplateCategorySlugs(template)
              .filter((slug) => slug !== categorySlug)
              .slice(0, 2)
              .map((slug) => getWorkoutTemplateCategoryBySlug(slug)?.shortName)
              .filter(Boolean);

            return (
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
                  minHeight: 290,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 999,
                          fontSize: 12,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.03)",
                          opacity: 0.85,
                          lineHeight: 1.2,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
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
            );
          })}
        </div>
      </section>

      <section
        style={{
          padding: 22,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 24 }}>Explore more template categories</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 16 }}>
          {otherCategories.map((item) => (
            <Link
              key={item.slug}
              href={`/workouts/${item.slug}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                borderRadius: 18,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 700 }}>{item.name}</div>
              <div style={{ marginTop: 8, opacity: 0.82, lineHeight: 1.55, fontSize: 14 }}>{item.description}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
