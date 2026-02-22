"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ensureTrialStarted, getProStatus, type ProStatus } from "../lib/entitlements";

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

function daysUntil(iso?: string | null) {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  const now = Date.now();
  if (!isFinite(end)) return null;
  const diff = end - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

function withParams(base: string, params: Record<string, string>) {
  const u = new URL(base);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}

export default function SubscribeClient() {
  const [loading, setLoading] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pro, setPro] = useState<ProStatus | null>(null);

  const monthlyBase =
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY ||
    "https://buy.stripe.com/test_3cI00j8ggfLv9NvghtejK00";
  const yearlyBase =
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY ||
    "https://buy.stripe.com/test_dRm9ATgMMeHr5xf0ivejK01";

  // Stripe Customer Portal login link (Dashboard → Customer portal → Login link)
  const portalLoginUrl =
    process.env.NEXT_PUBLIC_STRIPE_PORTAL_LOGIN_URL ||
    "";

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

  const trialEndsAt = pro?.trialEndsAt ?? null;
  const trialDaysLeft = useMemo(() => daysUntil(trialEndsAt), [trialEndsAt]);
  const trialExpired = useMemo(() => {
    if (!pro) return false;
    if (pro.isPro) return false;
    return pro.reason === "free" && Boolean(pro.trialEndsAt);
  }, [pro]);

  const monthlyUrl = useMemo(() => {
    if (!monthlyBase) return "";
    if (!sessionEmail || !userId) return monthlyBase;
    return withParams(monthlyBase, {
      // Stripe Payment Link URL params
      prefilled_email: sessionEmail,
      client_reference_id: userId,
      // success redirect (also configurable in Stripe dashboard)
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

  const statusLabel = useMemo(() => {
    if (!pro) return "";
    if (pro.isPro) return pro.reason === "active" ? "Pro Active" : "Pro Trial";
    if (trialExpired) return "Trial Ended";
    return pro.reason === "signed_out" ? "Signed Out" : "Lite";
  }, [pro, trialExpired]);

  return (
    <section
      aria-labelledby="subscribe-status"
      className="card cardPad subscribe-hero"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div id="subscribe-status" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="badge">
              <span aria-hidden>⚡</span>
              {loading ? "Checking…" : statusLabel}
            </span>
            {userId ? (
              <span style={{ opacity: 0.8, fontSize: 13 }}>
                Subscription status page for <b>Gym Log Pro</b>
              </span>
            ) : null}
          </div>

          {!loading && userId ? (
            <div style={{ marginTop: 10, opacity: 0.9, fontSize: 13, lineHeight: 1.6 }}>
              {pro?.isPro ? (
                <>
                  Pro features are unlocked on this device.
                  {trialEndsAt ? (
                    <>
                      {" "}Trial ends <b>{fmtDate(trialEndsAt)}</b>.
                    </>
                  ) : null}
                </>
              ) : trialExpired ? (
                <>
                  Your 7‑day trial ended on <b>{fmtDate(trialEndsAt)}</b>. Subscribe to keep cloud backups, CSV tools, and media.
                </>
              ) : (
                <>
                  Start your 7‑day trial (on first sign‑in) and unlock Pro features instantly.
                  {trialEndsAt ? (
                    <>
                      {" "}Trial ends <b>{fmtDate(trialEndsAt)}</b>
                      {typeof trialDaysLeft === "number" ? (
                        <>
                          {" "}({Math.max(trialDaysLeft, 0)} day{Math.max(trialDaysLeft, 0) === 1 ? "" : "s"} left)
                        </>
                      ) : null}
                      .
                    </>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>

        <div style={{ textAlign: "right" }}>
          {!loading && sessionEmail ? (
            <>
              <div style={{ opacity: 0.75, fontSize: 12 }}>Signed in as</div>
              <div style={{ fontWeight: 650 }}>{sessionEmail}</div>
            </>
          ) : null}

          {!loading && userId && portalLoginUrl ? (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <a className="app-link" href={portalLoginUrl} target="_blank" rel="noreferrer">
                Manage subscription / cancel
              </a>
            </div>
          ) : null}
          {!loading && !userId ? (
            <a href="/" className="app-link" style={{ fontSize: 13 }}>
              Back to app
            </a>
          ) : null}
        </div>
      </div>

      {!loading && !userId ? (
        <div
          style={{
            marginTop: 14,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            padding: 12,
          }}
        >
          <p style={{ margin: 0, opacity: 0.9 }}>
            Sign in inside the app to start your trial and subscribe. Your status will appear here automatically.
          </p>
        </div>
      ) : null}

      <div className="subscribe-pricing" style={{ marginTop: 16 }}>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Lite</h3>
            <span style={{ opacity: 0.85, fontSize: 13 }}>Free</span>
          </div>
          <ul style={{ margin: "10px 0 0", paddingLeft: 18, opacity: 0.9 }}>
            <li>Unlimited local logging</li>
            <li>Calendar + workout templates</li>
            <li>Community features (signed‑in)</li>
          </ul>
          <div style={{ marginTop: 12 }}>
            <a href="/" className="btn btnOutline">
              Continue with Lite
            </a>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.07)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -44,
              top: -44,
              width: 120,
              height: 120,
              background: "rgba(255,87,33,0.22)",
              borderRadius: 999,
            }}
            aria-hidden
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Pro</h3>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 650,
                borderRadius: 999,
                padding: "4px 8px",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(0,0,0,0.18)",
                opacity: 0.95,
              }}
            >
              <span aria-hidden>🏆</span> Best value yearly
            </span>
          </div>

          <ul style={{ margin: "10px 0 0", paddingLeft: 18, opacity: 0.95 }}>
            <li>Cloud backups + restore</li>
            <li>CSV upload / download</li>
            <li>Workout media (photos) — shows in Friends feed</li>
            <li>Priority feature updates</li>
          </ul>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <a
              href={monthlyUrl || "#"}
              aria-disabled={!monthlyUrl}
              className={`btn btnPrimary`}
              style={{ pointerEvents: monthlyUrl ? "auto" : "none", opacity: monthlyUrl ? 1 : 0.6 }}
            >
              Subscribe Monthly $4.99 CAD
            </a>

            <a
              href={yearlyUrl || "#"}
              aria-disabled={!yearlyUrl}
              className={`btn btnSoft`}
              style={{ pointerEvents: yearlyUrl ? "auto" : "none", opacity: yearlyUrl ? 1 : 0.6 }}
            >
              Subscribe Yearly $49.99 CAD
            </a>
          </div>

          {!monthlyBase || !yearlyBase ? (
            <p style={{ margin: "10px 0 0", opacity: 0.75, fontSize: 13 }}>
              Payment links are not configured. Set <code>NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY</code> and{" "}
              <code>NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY</code>.
            </p>
          ) : null}
        </div>
      </div>

      <p style={{ marginTop: 14, opacity: 0.8, fontSize: 13 }}>
        If your subscription doesn’t show instantly, refresh — webhooks can take a moment. Contact <a className="app-link" href="mailto:info@gymlogapp.com">info@gymlogapp.com</a> for any issues.
      </p>
    </section>
  );
}
