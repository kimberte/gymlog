"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function getResetContext() {
  if (typeof window === "undefined") {
    return {
      isRecoveryLink: false,
      isSignupLink: false,
      hasAccessToken: false,
    };
  }

  const url = new URL(window.location.href);
  const hash = url.hash || "";
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const queryType = url.searchParams.get("type");
  const hashType = hashParams.get("type");
  const type = queryType || hashType || "";
  const hasAccessToken = hash.includes("access_token=") || Boolean(hashParams.get("access_token"));

  return {
    isRecoveryLink: type === "recovery",
    isSignupLink: type === "signup" || type === "magiclink",
    hasAccessToken,
  };
}

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");

  const context = useMemo(() => getResetContext(), []);

  useEffect(() => {
    let alive = true;

    if (context.isSignupLink && context.hasAccessToken) {
      window.location.replace("/?confirmed=1");
      return;
    }

    if (!context.isRecoveryLink) {
      setStatus("invalid");
      setReady(false);
      setMsg("This password reset link is invalid or has expired. Please request a new one.");
      return;
    }

    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === "PASSWORD_RECOVERY" || session?.user) {
        setReady(true);
        setStatus("ready");
        setMsg(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session?.user) {
        setReady(true);
        setStatus("ready");
        setMsg(null);
      } else {
        setReady(false);
        setStatus("invalid");
        setMsg("This password reset link is invalid or has expired. Please request a new one.");
      }
    });

    return () => {
      alive = false;
      try {
        sub.data.subscription.unsubscribe();
      } catch {}
    };
  }, [context.hasAccessToken, context.isRecoveryLink, context.isSignupLink]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (pw1.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setMsg("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;

      setMsg("Password updated. Redirecting to homepage…");
      window.setTimeout(() => {
        window.location.href = "/?reset=success";
      }, 700);
    } catch (e: any) {
      setMsg(e?.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, minHeight: "100dvh" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: 24 }}>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--text)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Back to homepage
        </button>

        <h1 style={{ margin: "6px 0 10px" }}>Reset password</h1>

        {status === "checking" && (
          <div style={{ opacity: 0.8 }}>Checking your reset link…</div>
        )}

        {status === "invalid" && (
          <div style={{ opacity: 0.9, display: "grid", gap: 12 }}>
            <div>{msg}</div>
            <div style={{ opacity: 0.75 }}>Go back home and request a new reset email from Settings.</div>
          </div>
        )}

        {status === "ready" && ready && (
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <input
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.18)",
                color: "var(--text)",
              }}
            />
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.18)",
                color: "var(--text)",
              }}
            />
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.10)",
                background: "var(--accent)",
                color: "#111",
                fontWeight: 900,
              }}
            >
              {busy ? "Updating…" : "Update password"}
            </button>
            {msg && <div style={{ opacity: 0.9 }}>{msg}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
