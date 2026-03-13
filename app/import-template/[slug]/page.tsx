"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSeoTemplateBySlug } from "../../lib/seoWorkoutTemplates";

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ImportTemplatePage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || "");
  const template = useMemo(() => getSeoTemplateBySlug(slug), [slug]);
  const [startDate, setStartDate] = useState(() => toDateInputValue(new Date()));
  const [status, setStatus] = useState<string>("");

  if (!template) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 56px" }}>
        <Link href="/workouts" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>
          ← Back to templates
        </Link>
        <h1>Template not found</h1>
      </main>
    );
  }

  function handleImport() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "gym-log-template-import-pending",
          JSON.stringify({ slug: template.slug, startDate, queuedAt: Date.now() })
        );
      }

      setStatus(`Importing ${template.days.length} workout day${template.days.length > 1 ? "s" : ""}. Opening Gym Log…`);
      window.setTimeout(() => {
        window.location.href = `/?imported=1&template=${encodeURIComponent(template.slug)}&start=${encodeURIComponent(startDate)}`;
      }, 150);
    } catch {
      setStatus("Import failed. Please try again.");
    }
  }

  return (
    <main style={{ maxWidth: 940, margin: "0 auto", padding: "28px 20px 56px" }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <Link href={`/workouts/${template.slug}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>
          ← Back to template page
        </Link>
        <Link href="/" style={{ textDecoration: "none", color: "inherit", opacity: 0.8 }}>
          Gym Log home
        </Link>
      </div>

      <div className="import-layout">
        <section
          style={{
            borderRadius: 24,
            padding: "26px 22px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            minWidth: 0,
          }}
        >
          <p style={{ margin: 0, color: "var(--accent)", fontWeight: 700 }}>Import template</p>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.08 }}>{template.name}</h1>
          <p style={{ margin: "14px 0 0", opacity: 0.9, lineHeight: 1.72 }}>{template.shortDescription}</p>

          <div style={{ marginTop: 24 }}>
            <label htmlFor="startDate" style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
              Choose your start date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: "100%",
                maxWidth: 280,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
              }}
            />
            <p style={{ margin: "12px 0 0", opacity: 0.8, lineHeight: 1.65 }}>
              The workouts will be added to your calendar without removing anything you already have logged.
            </p>
          </div>

          <button
            onClick={handleImport}
            style={{
              marginTop: 22,
              padding: "12px 16px",
              borderRadius: 14,
              border: 0,
              background: "var(--accent)",
              color: "#111827",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Import into Gym Log
          </button>

          {status ? <p style={{ margin: "14px 0 0", color: "var(--accent)", fontWeight: 600 }}>{status}</p> : null}
        </section>

        <aside
          style={{
            borderRadius: 24,
            padding: "22px 20px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            minWidth: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24 }}>What gets imported</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {template.days.map((day) => (
              <div
                key={day.name + day.offsetDays}
                style={{
                  borderRadius: 16,
                  padding: 14,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontWeight: 700 }}>{day.name}</div>
                <div style={{ marginTop: 4, opacity: 0.78, fontSize: 14, lineHeight: 1.5 }}>{day.focus}</div>
                <div style={{ marginTop: 8, fontSize: 14, opacity: 0.88 }}>
                  {day.offsetDays === 0 ? "Placed on your chosen date." : `Placed ${day.offsetDays} day${day.offsetDays > 1 ? "s" : ""} later.`}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        .import-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.9fr);
          gap: 22px;
          align-items: start;
        }

        @media (max-width: 880px) {
          .import-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
