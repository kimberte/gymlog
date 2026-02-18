"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    // Some flows fire PASSWORD_RECOVERY; others just create a session.
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (session?.user) setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setReady(Boolean(data.session?.user));
    });

    return () => {
      alive = false;
      try {
        sub.data.subscription.unsubscribe();
      } catch {}
    };
  }, []);

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

      setMsg("Password updated. Redirecting…");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 900);
    } catch (e: any) {
      setMsg(e?.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ margin: "6px 0 10px" }}>Reset password</h1>

        {!ready ? (
          <div style={{ opacity: 0.8 }}>
            Open the password reset link from your email on this device.
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <input
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              placeholder="New password"
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
