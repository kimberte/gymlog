"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function getFlowType() {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return hash.get("type") || url.searchParams.get("type") || "";
}

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const flowType = getFlowType();

    async function init() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data } = await supabase.auth.getSession();
        if (!alive) return;

        const hasSession = Boolean(data.session?.user);

        if (flowType && flowType !== "recovery") {
          window.location.replace("/?auth=confirmed");
          return;
        }

        setReady(hasSession && flowType === "recovery");
        if (!hasSession && flowType === "recovery") {
          setMsg("Open the password reset link from your email on this device.");
        }
      } catch (e: any) {
        if (!alive) return;
        setMsg(e?.message || "This reset link is invalid or has expired.");
      } finally {
        if (alive) setChecking(false);
      }
    }

    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      const currentFlowType = getFlowType();

      if (event === "PASSWORD_RECOVERY") {
        setReady(Boolean(session?.user));
        setChecking(false);
        setMsg("Set a new password to finish resetting your account.");
        return;
      }

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && currentFlowType && currentFlowType !== "recovery") {
        window.location.replace("/?auth=confirmed");
        return;
      }
    });

    init();

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

      setMsg("Password updated. Redirecting to home…");
      window.setTimeout(() => {
        window.location.href = "/?auth=password-updated";
      }, 900);
    } catch (e: any) {
      setMsg(e?.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Reset password</h1>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to home
          </button>
        </div>

        {checking ? (
          <div style={{ opacity: 0.8 }}>Checking your reset link…</div>
        ) : !ready ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ opacity: 0.82 }}>
              {msg || "Open the password reset link from your email on this device."}
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <div style={{ opacity: 0.82 }}>Set a new password to finish resetting your account.</div>
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
                cursor: busy ? "progress" : "pointer",
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
