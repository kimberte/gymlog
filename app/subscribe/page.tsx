"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ensureTrialStarted, getProStatus, type ProStatus } from "../lib/entitlements";

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function withParams(base: string, params: Record<string, string>) {
  const u = new URL(base);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}

export default function SubscribePage() {
  const [loading, setLoading] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pro, setPro] = useState<ProStatus | null>(null);

  const monthlyBase = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY || "https://buy.stripe.com/test_3cI00j8ggfLv9NvghtejK00";
  const yearlyBase = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY || "https://buy.stripe.com/test_dRm9ATgMMeHr5xf0ivejK01";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user ?? null;
        if (cancelled) return;

        setSessionEmail(user?.email ?? null);
        setUserId(user?.id ?? null);

        if (user?.id) {
          await ensureTrialStarted(user.id);
          const st = await getProStatus(user.id);
          if (!cancelled) setPro(st);
        } else {
          setPro({ isPro: false, reason: "signed_out" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const expired = useMemo(() => {
    if (!pro) return false;
    return pro.reason === "free" && Boolean(pro.trialEndsAt);
  }, [pro]);

  const monthlyUrl = useMemo(() => {
    if (!monthlyBase) return "";
    if (!sessionEmail || !userId) return monthlyBase;
    return withParams(monthlyBase, {
      // Stripe Payment Link URL params
      prefilled_email: sessionEmail,
      client_reference_id: userId,
      // return path (Stripe may ignore for some configs; you can set success redirect in dashboard too)
      redirect_url: "https://gymlogapp.com/pro-confirmed",
    });
  }, [monthlyBase, sessionEmail, userId]);

  const yearlyUrl = useMemo(() => {
    if (!yearlyBase) return "";
    if (!sessionEmail || !userId) return yearlyBase;
    return withParams(yearlyBase, {
      prefilled_email: sessionEmail,
      client_reference_id: userId,
      redirect_url: "https://gymlogapp.com/pro-confirmed",
    });
  }, [yearlyBase, sessionEmail, userId]);

  return (
    <main
      style={{
        padding: 18,
        maxWidth: 880,
        margin: "0 auto",
        lineHeight: 1.65,
      }}
    >
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Gym Log Pro</h1>
        <p style={{ margin: "6px 0 0", opacity: 0.85 }}>
          Unlock backups, CSV tools, and workout media.
        </p>
      </header>

      {loading ? (
        <p style={{ opacity: 0.8 }}>Loading…</p>
      ) : !userId ? (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 14,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <p style={{ margin: 0 }}>
            Please sign in first to start your 7‑day trial or subscribe.
          </p>
          <p style={{ margin: "10px 0 0" }}>
            <a href="/" style={{ textDecoration: "underline" }}>
              Back to app
            </a>
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: 14,
              background: "rgba(255,255,255,0.04)",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 650 }}>
                  Status:{" "}
                  {pro?.isPro ? (
                    <span>Pro</span>
                  ) : expired ? (
                    <span>Trial expired</span>
                  ) : (
                    <span>Lite</span>
                  )}
                </div>
                {pro?.trialEndsAt ? (
                  <div style={{ opacity: 0.85 }}>
                    Trial ends: <b>{fmtDate(pro.trialEndsAt)}</b>
                  </div>
                ) : (
                  <div style={{ opacity: 0.85 }}>7‑day trial starts on first sign‑in.</div>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ opacity: 0.85, fontSize: 13 }}>Signed in as</div>
                <div style={{ fontWeight: 600 }}>{sessionEmail}</div>
              </div>
            </div>
          </div>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: 14,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16 }}>Lite (Free)</h2>
              <ul style={{ margin: "10px 0 0", paddingLeft: 18, opacity: 0.9 }}>
                <li>Local notebook + calendar</li>
                <li>Community page (signed-in users)</li>
                <li>Unlimited local logging</li>
              </ul>
              <div style={{ marginTop: 12 }}>
                <a
                  href="/"
                  style={{
                    display: "inline-block",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    textDecoration: "none",
                  }}
                >
                  Continue with Lite
                </a>
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: 14,
                background: "rgba(255,255,255,0.06)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16 }}>Pro</h2>
              <ul style={{ margin: "10px 0 0", paddingLeft: 18, opacity: 0.95 }}>
                <li>Cloud backups + restore</li>
                <li>CSV upload/download</li>
                <li>Add workout media</li>
              </ul>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <a
                  href={monthlyUrl || "#"}
                  style={{
                    display: "inline-block",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.22)",
                    background: "rgba(255,255,255,0.10)",
                    textDecoration: "none",
                    pointerEvents: monthlyUrl ? "auto" : "none",
                    opacity: monthlyUrl ? 1 : 0.6,
                  }}
                >
                  Get Pro Monthly
                </a>

                <a
                  href={yearlyUrl || "#"}
                  style={{
                    display: "inline-block",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.22)",
                    background: "rgba(255,255,255,0.10)",
                    textDecoration: "none",
                    pointerEvents: yearlyUrl ? "auto" : "none",
                    opacity: yearlyUrl ? 1 : 0.6,
                  }}
                >
                  Get Pro Yearly
                </a>
              </div>

              {!monthlyBase || !yearlyBase ? (
                <p style={{ margin: "10px 0 0", opacity: 0.75, fontSize: 13 }}>
                  Payment links are not configured. Set{" "}
                  <code>NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY</code> and{" "}
                  <code>NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY</code>.
                </p>
              ) : null}
            </div>
          </section>

          <p style={{ marginTop: 14, opacity: 0.85, fontSize: 13 }}>
            After purchase you’ll be redirected to <code>/pro-confirmed</code>. If your subscription doesn’t show
            instantly, refresh — webhooks can take a moment.
          </p>
        </>
      )}
    </main>
  );
}
