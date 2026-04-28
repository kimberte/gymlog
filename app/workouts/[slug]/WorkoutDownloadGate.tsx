"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

type DownloadFormat = "pdf" | "excel";

type Props = {
  slug: string;
  templateName: string;
};

function formatLabel(format: DownloadFormat) {
  return format === "pdf" ? "PDF" : "Excel";
}

export default function WorkoutDownloadGate({ slug, templateName }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null);
  const [message, setMessage] = useState("");

  const returnTo = useMemo(() => {
    if (typeof window === "undefined") return `/workouts/${slug}#download`;
    return `${window.location.pathname}${window.location.search || ""}#download`;
  }, [slug]);

  const signupHref = `/?auth=signup&returnTo=${encodeURIComponent(returnTo)}`;
  const signinHref = `/?auth=signin&returnTo=${encodeURIComponent(returnTo)}`;

  useEffect(() => {
    let mounted = true;
    let unsub: { data?: { subscription?: { unsubscribe: () => void } } } | null = null;

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) setSession(data.session ?? null);

        unsub = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession ?? null);
        });
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    init();

    return () => {
      mounted = false;
      try {
        unsub?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  async function recordLead(downloadType: DownloadFormat) {
    const email = session?.user?.email?.trim().toLowerCase();
    if (!email) return;

    const { error } = await supabase.from("workout_download_leads").insert({
      email,
      workout_slug: slug,
      workout_name: templateName,
      download_type: downloadType,
      source_path: typeof window !== "undefined" ? window.location.pathname : `/workouts/${slug}`,
    });

    // Do not block downloads if the tracking table has not been created yet.
    if (error) console.warn("Workout download lead was not saved:", error.message);
  }

  async function handleDownload(format: DownloadFormat) {
    if (!session?.access_token) {
      setMessage("Create a free account or sign in first to unlock instant downloads.");
      return;
    }

    setDownloading(format);
    setMessage("");

    try {
      await recordLead(format);

      const response = await fetch(`/api/workout-download/${slug}/${format}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const fallbackName = `${slug}.${format === "excel" ? "xls" : "pdf"}`;
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      const filename = match?.[1] || fallbackName;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setMessage(`${formatLabel(format)} download started.`);
    } catch (error) {
      console.warn(error);
      setMessage("Could not download this file. Please refresh and try again.");
    } finally {
      setDownloading(null);
    }
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
      {checkingSession ? (
        <p style={{ margin: 0, fontSize: 14, opacity: 0.78 }}>Checking your login…</p>
      ) : session?.user ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 800 }}>Downloads unlocked</div>
            <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.55, opacity: 0.78 }}>
              Signed in as {session.user.email}. Download the files instantly or import the plan into your Gym Log calendar.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleDownload("pdf")}
              disabled={Boolean(downloading)}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: 0,
                background: "rgba(255,255,255,0.94)",
                color: "#111827",
                fontWeight: 800,
                cursor: downloading ? "default" : "pointer",
                opacity: downloading ? 0.72 : 1,
              }}
            >
              {downloading === "pdf" ? "Downloading…" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={() => handleDownload("excel")}
              disabled={Boolean(downloading)}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.08)",
                color: "inherit",
                fontWeight: 800,
                cursor: downloading ? "default" : "pointer",
                opacity: downloading ? 0.72 : 1,
              }}
            >
              {downloading === "excel" ? "Downloading…" : "Download Excel"}
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
      ) : (
        <>
          <div style={{ fontWeight: 800 }}>Create a free account to download</div>
          <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.65, opacity: 0.82 }}>
            Free signup unlocks instant PDF and Excel downloads for this workout. After you sign in, come back here and the download buttons will appear automatically.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link
              href={signupHref}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "var(--accent)",
                color: "#111827",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Free sign up to download
            </Link>
            <Link
              href={signinHref}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.16)",
                color: "inherit",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Already have an account? Sign in
            </Link>
          </div>
        </>
      )}

      {message ? <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.55, opacity: 0.82 }}>{message}</p> : null}
    </div>
  );
}
