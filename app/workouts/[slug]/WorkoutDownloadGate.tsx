"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type DownloadFormat = "pdf" | "excel";

type Props = {
  slug: string;
  templateName: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function WorkoutDownloadGate({ slug, templateName }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");

  async function recordLead(downloadType: DownloadFormat | "email_capture") {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    const { error } = await supabase.from("workout_download_leads").insert({
      email: cleanEmail,
      workout_slug: slug,
      workout_name: templateName,
      download_type: downloadType,
      source_path: typeof window !== "undefined" ? window.location.pathname : `/workouts/${slug}`,
    });

    // Do not block the user if the tracking table has not been created yet.
    if (error) console.warn("Workout download lead was not saved:", error.message);
  }

  async function unlockDownloads() {
    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      setMessage("Enter a valid email to unlock the downloads.");
      return;
    }

    setLoading(true);
    setMessage("");

    await recordLead("email_capture");

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/import-template/${slug}`,
      },
    });

    setLoading(false);
    setUnlocked(true);

    if (error) {
      setMessage("Downloads unlocked. The login email could not be sent, but you can still download the files below.");
      console.warn("Magic link could not be sent:", error.message);
      return;
    }

    setMessage("Downloads unlocked. I also sent you a login link so you can import this workout into Gym Log free.");
  }

  async function handleDownload(format: DownloadFormat) {
    await recordLead(format);
    window.location.href = `/api/workout-download/${slug}/${format}?email=${encodeURIComponent(email.trim().toLowerCase())}`;
  }

  return (
    <div
      style={{
        marginTop: 14,
        padding: 18,
        borderRadius: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {!unlocked ? (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter email to unlock downloads"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") unlockDownloads();
              }}
              style={{
                flex: "1 1 260px",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.18)",
                color: "inherit",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={unlockDownloads}
              disabled={loading}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: 0,
                background: "var(--accent)",
                color: "#111827",
                fontWeight: 800,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Unlocking..." : "Unlock downloads"}
            </button>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.55, opacity: 0.72 }}>
            Free download. You’ll also get a Gym Log login link so you can import and track the workout if you want.
          </p>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleDownload("pdf")}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: 0,
                background: "rgba(255,255,255,0.94)",
                color: "#111827",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => handleDownload("excel")}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.08)",
                color: "inherit",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Download Excel
            </button>
            <Link
              href={`/import-template/${slug}`}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.16)",
                color: "inherit",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Import into Gym Log
            </Link>
          </div>
        </>
      )}

      {message ? <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.55, opacity: 0.82 }}>{message}</p> : null}
    </div>
  );
}
