"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ensureTrialStarted, getProStatus } from "../lib/entitlements";
import { event as gaEvent } from "../lib/gtag";

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  textDecoration: "none",
  color: "rgba(255,255,255,0.95)",
};

export default function ProConfirmedPage() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>("Confirming your subscription…");
  const [isPro, setIsPro] = useState<boolean>(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [conversionSent, setConversionSent] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!user?.id) {
        setMsg("Please sign in to confirm your subscription.");
        setIsPro(false);
        return;
      }

      await ensureTrialStarted(user.id);
      const st = await getProStatus(user.id);
      setIsPro(Boolean(st.isPro));
      setTrialEndsAt(st.trialEndsAt ?? null);

      // Fire conversion events once.
      // - Paid (active/trialing): purchase + subscribe
      // - Trial-only: trial_start (optional to mark as a conversion in GA4/Ads)
      if (!conversionSent && st.isPro) {
        if (st.reason === "active" || st.reason === "trialing") {
          gaEvent("purchase", {
            currency: "CAD",
            // value is optional; keeping it unset avoids incorrect reporting if price changes by region
            items: [{ item_name: "Gym Log Pro" }],
            user_id: user.id,
          });
          gaEvent("subscribe", { user_id: user.id });
          setConversionSent(true);
        } else if (st.reason === "trial") {
          gaEvent("trial_start", { user_id: user.id });
          setConversionSent(true);
        }
      }

      if (st.isPro && (st.reason === "active" || st.reason === "trialing")) {
        setMsg("✅ Subscription confirmed. Pro is now unlocked.");
      } else if (st.isPro && st.reason === "trial") {
        setMsg("✅ You’re in your 7‑day trial. Pro is unlocked.");
      } else {
        setMsg("We didn’t see an active Pro subscription yet. If you just paid, click refresh in a moment.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      style={{
        padding: 18,
        maxWidth: 760,
        margin: "0 auto",
        lineHeight: 1.65,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Pro confirmed</h1>
      <p style={{ margin: "10px 0 0", opacity: 0.92 }}>{msg}</p>

      {trialEndsAt ? (
        <p style={{ margin: "10px 0 0", opacity: 0.85, fontSize: 13 }}>
          Trial ends: <b>{fmtDate(trialEndsAt)}</b>
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <a href="/" style={linkStyle}>
          Back to app
        </a>

        <a href="/subscribe" style={linkStyle}>
          Manage Pro
        </a>

        <button
          onClick={refresh}
          disabled={loading}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.95)",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Refreshing…" : "Refresh status"}
        </button>
      </div>

      {!isPro ? (
        <p style={{ marginTop: 14, opacity: 0.82, fontSize: 13 }}>
          If your subscription doesn’t show instantly, refresh — webhooks can take a moment. Contact{' '}
          <strong>info@gymlogapp.com</strong> for any issues.
        </p>
      ) : null}
    </main>
  );
}
