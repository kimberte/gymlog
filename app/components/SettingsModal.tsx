"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { exportCSV, importCSV } from "../lib/csv";
import { supabase } from "../lib/supabaseClient";
import { fetchLatestBackup, formatBackupDate } from "../lib/backup";
import { ensureTrialStarted, getProStatus, type ProStatus } from "../lib/entitlements";
import { event as gaEvent } from "../lib/gtag";

type WeekStart = "sunday" | "monday";

function parseDateKey(key: string) {
  // key: YYYY-MM-DD
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(key);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  // Use a fixed noon time to avoid timezone DST shifts
  return new Date(y, mo - 1, d, 12, 0, 0, 0);
}


type Props = {
  workouts: Record<string, any>;
  setWorkouts: (w: Record<string, any>) => void;
  // Called after explicit data changes (import/restore/delete) so parent can back up once
  onDataSaved?: (nextWorkouts: Record<string, any>) => void;
  onClose: () => void;
  toast: (msg: string) => void;

  // non-pro
  weekStart: WeekStart;
  setWeekStart: (v: WeekStart) => void;

  // from page (kept fresh by auto-backup)
  lastBackupAt: string | null;
};

export default function SettingsModal({
  workouts,
  setWorkouts,
  onDataSaved,
  onClose,
  toast,
  weekStart,
  setWeekStart,
  lastBackupAt,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [closing, setClosing] = useState(false);

  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset" | "updatepw">("signin");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Delete account flow
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Backup UI
  const [serverBackupAt, setServerBackupAt] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  // Restore flow
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);

  const portalLoginUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_STRIPE_PORTAL_LOGIN_URL || "";
  }, []);

  const supabaseConfigured = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }, []);

  const [proStatus, setProStatus] = useState<ProStatus>({ isPro: false, reason: "signed_out" });

  const isPro = Boolean(proStatus?.isPro);
  const trialEndsAt = proStatus?.trialEndsAt ?? null;

  async function refreshProStatus(uid: string | null) {
    if (!uid) {
      setProStatus({ isPro: false, reason: "signed_out" });
      return;
    }
    try {
      await ensureTrialStarted(uid);
      const st = await getProStatus(uid);
      setProStatus(st);
    } catch {
      setProStatus({ isPro: false, reason: "free" });
    }
  }

  useEffect(() => {
    refreshProStatus(sessionUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId]);

  const workoutCount = useMemo(() => {
    let total = 0;
    Object.values(workouts ?? {}).forEach((day: any) => {
      const entries = Array.isArray(day?.entries) ? day.entries : day ? [day] : [];
      entries.forEach((e: any) => {
        const has = Boolean(String(e?.title ?? "").trim() || String(e?.notes ?? "").trim());
        if (has) total += 1;
      });
    });
    return total;
  }, [workouts]);

  // ---- PROGRESS STATS (all-time) ----
  const { bestStreak, totalWorkoutDays } = useMemo(() => {
    // We count a "workout day" if any entry has title or notes.
    const activeKeys = Object.keys(workouts ?? {}).filter((key) => {
      const day: any = (workouts as any)[key];
      const entries = Array.isArray(day?.entries) ? day.entries : day ? [day] : [];
      return entries.some((e: any) =>
        Boolean(String(e?.title ?? "").trim() || String(e?.notes ?? "").trim())
      );
    });


    activeKeys.sort(); // YYYY-MM-DD lex sort works

    let best = 0;
    let run = 0;
    let prev: Date | null = null;

    for (const k of activeKeys) {
      const dt = parseDateKey(k);
      if (!dt) continue;

      if (!prev) {
        run = 1;
      } else {
        const diffDays = Math.round((dt.getTime() - prev.getTime()) / 86400000);
        if (diffDays === 1) {
          run += 1;
        } else {
          best = Math.max(best, run);
          run = 1;
        }
      }

      prev = dt;
    }

    best = Math.max(best, run);

    return {
      bestStreak: best,
      totalWorkoutDays: activeKeys.length,
    };
  }, [workouts]);

  // ---- AUTH: load session + listen for changes ----
  useEffect(() => {
    let unsub: { data?: { subscription?: { unsubscribe: () => void } } } | null =
      null;

    async function init() {
      setAuthError(null);

      if (!supabaseConfigured) {
        setSessionEmail(null);
        setSessionToken(null);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        const userEmail = data.session?.user?.email ?? null;
        const userId = data.session?.user?.id ?? null;
        const token = data.session?.access_token ?? null;
        setSessionEmail(userEmail);
        setSessionToken(token);
        setSessionUserId(userId);

        unsub = supabase.auth.onAuthStateChange((event, newSession) => {
          setSessionEmail(newSession?.user?.email ?? null);
          setSessionToken(newSession?.access_token ?? null);
          setSessionUserId(newSession?.user?.id ?? null);
          if (event === "PASSWORD_RECOVERY") {
            setAuthMode("updatepw");
            setAuthMessage("Set a new password to finish resetting your account.");
          }
        });
      } catch {
        setSessionEmail(null);
        setSessionToken(null);
        setAuthError("Could not load auth session.");
      }
    }

    init();

    return () => {
      try {
        unsub?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, [supabaseConfigured]);

  // ---- load latest backup timestamp from server (when signed in) ----
  useEffect(() => {
    async function loadBackup() {
      if (!isPro) {
        setServerBackupAt(null);
        return;
      }

      setBackupLoading(true);
      try {
        const row = await fetchLatestBackup();
        setServerBackupAt(row?.updated_at ?? null);
      } catch {
        setServerBackupAt(null);
      } finally {
        setBackupLoading(false);
      }
    }

    loadBackup();
  }, [isPro, lastBackupAt]);

  
async function signInPassword() {
  setAuthError(null);
  setAuthMessage(null);

  if (!supabaseConfigured) {
    setAuthError(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return;
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    setAuthError("Enter a valid email.");
    return;
  }
  if (!password || password.length < 6) {
    setAuthError("Enter your password (6+ characters).");
    return;
  }

  setAuthLoading(true);
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    toast("Signed in");
    setPassword("");
    setAuthMode("signin");
  } catch {
    setAuthError("Could not sign in.");
  } finally {
    setAuthLoading(false);
  }
}

async function signUpPassword() {
  setAuthError(null);
  setAuthMessage(null);

  if (!supabaseConfigured) {
    setAuthError(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return;
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    setAuthError("Enter a valid email.");
    return;
  }
  if (!password || password.length < 6) {
    setAuthError("Create a password (6+ characters).");
    return;
  }

  setAuthLoading(true);
  try {
    const { data, error } = await supabase.auth.signUp({
      email: trimmed,
      password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    // GA4 recommended event for account creation
    gaEvent("sign_up", {
      method: "email",
      user_id: data.user?.id || undefined,
    });

    setAuthMessage("Check your email to confirm your account, then sign in.");
    setPassword("");
    setAuthMode("signin");
  } catch {
    setAuthError("Could not create account.");
  } finally {
    setAuthLoading(false);
  }
}

async function sendPasswordReset() {
  setAuthError(null);
  setAuthMessage(null);

  if (!supabaseConfigured) {
    setAuthError(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return;
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    setAuthError("Enter a valid email.");
    return;
  }

  setAuthLoading(true);
  try {
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: origin ? `${origin}/` : undefined,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    setAuthMessage("Password reset email sent. Open the link to set a new password.");
    toast("Reset email sent");
  } catch {
    setAuthError("Could not send password reset email.");
  } finally {
    setAuthLoading(false);
  }
}

async function updatePassword() {
  setAuthError(null);
  setAuthMessage(null);

  if (!supabaseConfigured) return;

  if (!newPassword || newPassword.length < 6) {
    setAuthError("New password must be 6+ characters.");
    return;
  }

  setAuthLoading(true);
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    setAuthMessage("Password updated. You're signed in.");
    setNewPassword("");
    toast("Password updated");
  } catch {
    setAuthError("Could not update password.");
  } finally {
    setAuthLoading(false);
  }
}

  async function signOut() {
    setAuthError(null);
    if (!supabaseConfigured) return;

    try {
      await supabase.auth.signOut();
      toast("Signed out");
    } catch {
      toast("Sign out failed");
    }
  }

  // ---- PRO ACTIONS (gated) ----
  function handleExport() {
    if (!isPro) {
      toast("Pro feature locked. Start Pro in Settings.");
      return;
    }

    exportCSV(workouts);
    toast("Workouts exported");
  }

  function downloadTemplate() {
    if (!isPro) {
      toast("Pro feature locked. Start Pro in Settings.");
      return;
    }

    const template = [
      "date,entry_index,title,notes",
      "2026-01-05,1,Leg Day,Squats 5x5; RDL 3x8",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "gym-log-template.csv";
    a.click();

    URL.revokeObjectURL(url);
    toast("Template downloaded");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isPro) {
      toast("Pro feature locked. Start Pro in Settings.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setConfirming(true);
  }

  async function handleConfirmImport() {
    if (!isPro) {
      toast("Pro feature locked. Start Pro in Settings.");
      return;
    }

    if (!pendingFile) return;

    try {
      const updated = await importCSV(workouts, pendingFile);

      // IMPORTANT: update state so it persists and triggers local save + auto-backup
      setWorkouts(updated);
      onDataSaved?.(updated);

      toast("Workouts imported");
      setConfirming(false);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
      requestClose();
    } catch {
      toast("Import failed");
      setConfirming(false);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function cancelImport() {
    setConfirming(false);
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = "";
    toast("Import cancelled");
  }

  // ---- RESTORE FROM AUTO-BACKUP ----
  async function beginRestore() {
    if (!isPro) {
      toast("Pro feature locked. Start Pro in Settings.");
      return;
    }

    // Only show confirm UI if we have a backup
    const iso = serverBackupAt ?? lastBackupAt;
    if (!iso) {
      toast("No backup available yet");
      return;
    }

    setShowRestoreConfirm(true);
  }

  async function confirmRestore() {
    if (!isPro) {
      toast("Pro feature locked. Start Pro in Settings.");
      return;
    }

    setRestoreBusy(true);
    try {
      const row = await fetchLatestBackup();
      if (!row?.data) {
        toast("No backup found");
        setRestoreBusy(false);
        setShowRestoreConfirm(false);
        return;
      }

      // Overwrite entire calendar
      setWorkouts(row.data);
      onDataSaved?.(row.data);

      toast("Restored from auto-backup");
      setRestoreBusy(false);
      setShowRestoreConfirm(false);
      requestClose();
    } catch {
      toast("Restore failed");
      setRestoreBusy(false);
      setShowRestoreConfirm(false);
    }
  }

  function cancelRestore() {
    setShowRestoreConfirm(false);
    toast("Restore cancelled");
  }

  // ---- DELETE ACCOUNT (server + auth) ----
  function clearLocalData() {
    try {
      localStorage.removeItem("gym-log-workouts");
      localStorage.removeItem("gym-log-settings");
      localStorage.removeItem("gym-log-week-start");

      // Supabase stores session under sb-*-auth-token keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) keys.push(k);
      }
      keys.forEach((k) => {
        if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  }

  async function confirmDeleteAccount() {
    if (!isPro || !sessionToken) {
      toast("Sign in to delete your account");
      return;
    }

    if (deleteText.trim().toUpperCase() !== "DELETE") {
      toast('Type "DELETE" to confirm');
      return;
    }

    setDeleteBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.error || "Delete failed");
        setDeleteBusy(false);
        return;
      }

      // Sign out + clear
      try {
        await supabase.auth.signOut();
      } catch {}

      clearLocalData();

      toast("Account deleted");
      setDeleteBusy(false);
      setShowDeleteConfirm(false);
      setDeleteText("");
      requestClose();
    } catch {
      toast("Delete failed");
      setDeleteBusy(false);
    }
  }

  // ---- UI helpers ----
  const proDisabledStyle: React.CSSProperties = {
    opacity: 0.45,
    pointerEvents: "none",
    filter: "grayscale(0.15)",
  };

  const prettyBackup = useMemo(() => {
    const iso = serverBackupAt ?? lastBackupAt;
    if (!iso) return null;
    return formatBackupDate(iso);
  }, [serverBackupAt, lastBackupAt]);

  const backupIso = serverBackupAt ?? lastBackupAt;

  const planUi = useMemo(() => {
    const ends = trialEndsAt ? new Date(trialEndsAt) : null;
    const endsLabel = ends && isFinite(ends.getTime()) ? ends.toLocaleDateString() : null;

    if (!sessionUserId) {
      return {
        badge: "Signed out",
        detail: "Sign in to start your 7‑day trial and enable Pro features.",
        cta: "Get Pro",
      };
    }

    if (proStatus.isPro) {
      if (proStatus.reason === "active") {
        return {
          badge: "Pro Active",
          detail: "Cloud backup, restore, CSV tools & media are unlocked.",
          cta: "Manage Pro",
        };
      }
      // trialing (Stripe) or app trial
      return {
        badge: "Pro Trial",
        detail: endsLabel ? `Trial ends ${endsLabel}.` : "Trial active.",
        cta: "View Pro",
      };
    }

    if (trialEndsAt) {
      return {
        badge: "Trial ended",
        detail: endsLabel ? `Trial ended ${endsLabel}. Upgrade to keep backups + CSV.` : "Your trial has ended.",
        cta: "Upgrade",
      };
    }

    return {
      badge: "Lite",
      detail: "Unlimited local logging. Upgrade for cloud backups + CSV tools.",
      cta: "Get Pro",
    };
  }, [isPro, proStatus.isPro, proStatus.reason, sessionUserId, trialEndsAt]);

  function requestClose() {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => onClose(), 170);
  }

  return (
    <div className={`overlay ${closing ? "closing" : ""}`}>
      <div className={`settings settings-scroll ${closing ? "closing" : ""}`}>
        <button className="close" onClick={requestClose} aria-label="Close settings">
          ✕
        </button>

        <h3>Settings</h3>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 12,
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.06))",
            margin: "8px 0 14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ minWidth: 220 }}>
              <div className="badge">
                <span aria-hidden>⚡</span>
                {planUi.badge}
              </div>
              <div style={{ marginTop: 8, opacity: 0.85, fontSize: 13, lineHeight: 1.5 }}>{planUi.detail}</div>
            </div>

            <a href="/subscribe" className="btn btnPrimary">
              {planUi.cta}
              <span aria-hidden style={{ opacity: 0.9 }}>
                →
              </span>
            </a>
          </div>

          {sessionUserId && portalLoginUrl ? (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
              <a className="app-link" href={portalLoginUrl} target="_blank" rel="noreferrer">
                Manage subscription / cancel
              </a>
            </div>
          ) : null}
        </div>

        {/* AUTH SECTION */}
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
            <strong>Pro access</strong>
          </div>

          {!supabaseConfigured && (
            <div style={{ marginTop: 8, fontSize: 13, color: "#FFB199" }}>
              Supabase env vars are missing. Add:
              <div style={{ marginTop: 6, opacity: 0.9 }}>
                <div>NEXT_PUBLIC_SUPABASE_URL</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
              </div>
            </div>
          )}

          {sessionEmail ? (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Signed in as <strong>{sessionEmail}</strong>
              <button
                onClick={signOut}
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            
<>
  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
    {authMode === "signup"
      ? "Create an account to unlock Pro features."
      : authMode === "reset"
      ? "Send yourself a password reset email."
      : authMode === "updatepw"
      ? "Set a new password to finish your reset."
      : "Sign in to unlock CSV import/export (and auto-backup)."}
  </div>

  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
    <button
      onClick={() => {
        setAuthError(null);
        setAuthMessage(null);
        setAuthMode("signin");
      }}
      style={{
        flex: 1,
        padding: 10,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        background: authMode === "signin" ? "rgba(255,87,33,0.14)" : "transparent",
        color: "white",
        cursor: "pointer",
      }}
      type="button"
    >
      Sign in
    </button>

    <button
      onClick={() => {
        setAuthError(null);
        setAuthMessage(null);
        setAuthMode("signup");
      }}
      style={{
        flex: 1,
        padding: 10,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        background: authMode === "signup" ? "rgba(255,87,33,0.14)" : "transparent",
        color: "white",
        cursor: "pointer",
      }}
      type="button"
    >
      Create
    </button>

    <button
      onClick={() => {
        setAuthError(null);
        setAuthMessage(null);
        setAuthMode("reset");
      }}
      style={{
        flex: 1,
        padding: 10,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        background: authMode === "reset" ? "rgba(255,87,33,0.14)" : "transparent",
        color: "white",
        cursor: "pointer",
      }}
      type="button"
    >
      Reset
    </button>
  </div>

  <input
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="you@email.com"
    autoComplete="email"
    inputMode="email"
    style={{
      width: "100%",
      marginTop: 12,
      background: "rgba(0,0,0,0.18)",
      border: "1px solid rgba(255,255,255,0.15)",
      color: "white",
      borderRadius: 10,
      padding: 10,
      fontFamily: "inherit",
    }}
  />

  {(authMode === "signin" || authMode === "signup") && (
    <input
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Password"
      type="password"
      autoComplete={authMode === "signup" ? "new-password" : "current-password"}
      style={{
        width: "100%",
        marginTop: 10,
        background: "rgba(0,0,0,0.18)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "white",
        borderRadius: 10,
        padding: 10,
        fontFamily: "inherit",
      }}
    />
  )}

  {authMode === "updatepw" && (
    <input
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      placeholder="New password"
      type="password"
      autoComplete="new-password"
      style={{
        width: "100%",
        marginTop: 10,
        background: "rgba(0,0,0,0.18)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "white",
        borderRadius: 10,
        padding: 10,
        fontFamily: "inherit",
      }}
    />
  )}

  {authMode === "signin" && (
    <button
      onClick={signInPassword}
      disabled={!supabaseConfigured || authLoading}
      style={{
        width: "100%",
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        border: "none",
        background: "#FF5721",
        color: "white",
        cursor: supabaseConfigured ? "pointer" : "not-allowed",
        opacity: !supabaseConfigured ? 0.6 : 1,
      }}
      type="button"
    >
      {authLoading ? "Signing in…" : "Sign in"}
    </button>
  )}

  {authMode === "signup" && (
    <button
      onClick={signUpPassword}
      disabled={!supabaseConfigured || authLoading}
      style={{
        width: "100%",
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        border: "none",
        background: "#FF5721",
        color: "white",
        cursor: supabaseConfigured ? "pointer" : "not-allowed",
        opacity: !supabaseConfigured ? 0.6 : 1,
      }}
      type="button"
    >
      {authLoading ? "Creating…" : "Create account"}
    </button>
  )}

  {authMode === "reset" && (
    <button
      onClick={sendPasswordReset}
      disabled={!supabaseConfigured || authLoading}
      style={{
        width: "100%",
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        border: "none",
        background: "#FF5721",
        color: "white",
        cursor: supabaseConfigured ? "pointer" : "not-allowed",
        opacity: !supabaseConfigured ? 0.6 : 1,
      }}
      type="button"
    >
      {authLoading ? "Sending…" : "Send reset email"}
    </button>
  )}

  {authMode === "updatepw" && (
    <button
      onClick={updatePassword}
      disabled={!supabaseConfigured || authLoading}
      style={{
        width: "100%",
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        border: "none",
        background: "#FF5721",
        color: "white",
        cursor: supabaseConfigured ? "pointer" : "not-allowed",
        opacity: !supabaseConfigured ? 0.6 : 1,
      }}
      type="button"
    >
      {authLoading ? "Updating…" : "Update password"}
    </button>
  )}

  {(authError || authMessage) && (
    <div
      style={{
        marginTop: 10,
        fontSize: 13,
        color: authError ? "#FFB199" : "rgba(255,255,255,0.8)",
      }}
    >
      {authError || authMessage}
    </div>
  )}
</>
          )}
        </div>



        {/* PROGRESS (all-time) */}
        {(workoutCount > 0 || totalWorkoutDays > 0) && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.12)",
              fontSize: 13,
              opacity: 0.95,
            }}
          >
            <strong>Progress</strong>
            <div style={{ marginTop: 6 }}>🏆 Best streak: {bestStreak} days</div>
            <div>📌 Total workouts: {workoutCount}</div>
            <div>📆 Total workout days: {totalWorkoutDays}</div>
          </div>
        )}

        {/* GENERAL (NON-PRO) */}
        <div
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.10)",
          }}
        >
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
            <strong>General</strong>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
            Week starts on
          </div>

          <select
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value as WeekStart)}
            style={{
              width: "100%",
              marginTop: 8,
              background: "rgba(0,0,0,0.18)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              borderRadius: 10,
              padding: 10,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
          </select>

          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Saved on this device.
          </div>
        </div>

        {/* AUTO BACKUP */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.75)",
              marginBottom: 8,
            }}
          >
            Auto-backup
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.10)",
              ...(isPro ? {} : proDisabledStyle),
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.95 }}>
              {backupLoading ? (
                "Loading backup status…"
              ) : prettyBackup ? (
                <>
                  Last Backup {prettyBackup} ({workoutCount} workout logs)
                </>
              ) : (
                "No backup yet"
              )}
            </div>

            <button
              onClick={beginRestore}
              style={{
                width: "100%",
                marginTop: 10,
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "white",
                cursor: "pointer",
                opacity: backupIso ? 1 : 0.6,
              }}
              disabled={!backupIso}
              title={!backupIso ? "No backup available yet" : "Restore from auto-backup"}
            >
              Restore from auto-backup
            </button>

            {!isPro && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Sign in below to enable auto-backup & restore.
              </div>
            )}
          </div>

          {/* RESTORE CONFIRM */}
          {showRestoreConfirm && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,87,33,0.12)",
                fontSize: 13,
                border: "1px solid rgba(255,87,33,0.25)",
              }}
            >
              <strong>Restore from backup?</strong>
              <p style={{ margin: "6px 0" }}>
                This will overwrite your entire calendar with the latest cloud backup{" "}
                {prettyBackup ? (
                  <>
                    from <strong>{prettyBackup}</strong>
                  </>
                ) : (
                  "from your latest backup"
                )}
                . We recommend exporting CSV first.
              </p>

              <button
                onClick={confirmRestore}
                disabled={restoreBusy}
                style={{
                  width: "100%",
                  marginTop: 8,
                  background: "#FF5721",
                  color: "#fff",
                  border: "none",
                  padding: 10,
                  borderRadius: 10,
                  cursor: "pointer",
                  opacity: restoreBusy ? 0.8 : 1,
                }}
              >
                {restoreBusy ? "Restoring…" : "Confirm restore"}
              </button>

              <button
                onClick={cancelRestore}
                disabled={restoreBusy}
                style={{
                  width: "100%",
                  marginTop: 8,
                  background: "transparent",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  padding: 10,
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* PRO FEATURES */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.75)",
              marginBottom: 8,
            }}
          >
            Pro features
          </div>

          <div style={!isPro ? proDisabledStyle : undefined}>
            <button onClick={handleExport}>Export workouts (CSV)</button>
            <button onClick={downloadTemplate}>Download CSV template</button>

            <label style={{ display: "block", marginTop: 14, fontSize: 13 }}>
              Import workouts (CSV)
            </label>

            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
            />
          </div>

          {!isPro && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#B0B3C0" }}>
              Sign in above to unlock these.
            </div>
          )}
        </div>

        {/* CONFIRM IMPORT */}
        {confirming && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              background: "rgba(255,87,33,0.12)",
              fontSize: 13,
              border: "1px solid rgba(255,87,33,0.25)",
            }}
          >
            <strong>Warning</strong>
            <p style={{ margin: "6px 0" }}>
              Importing will overwrite existing workouts for matching dates.
              This cannot be undone.
            </p>

            <button
              style={{
                width: "100%",
                marginTop: 8,
                background: "#FF5721",
                color: "#fff",
                border: "none",
                padding: 10,
                borderRadius: 10,
                cursor: "pointer",
              }}
              onClick={handleConfirmImport}
            >
              Confirm Import
            </button>

            <button
              style={{
                width: "100%",
                marginTop: 8,
                background: "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: 10,
                borderRadius: 10,
                cursor: "pointer",
              }}
              onClick={cancelImport}
            >
              Cancel
            </button>
          </div>
        )}

        {/* DANGER ZONE */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.75)",
              marginBottom: 8,
            }}
          >
            Danger zone
          </div>

          <div style={!isPro ? proDisabledStyle : undefined}>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  width: "100%",
                  marginTop: 0,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid rgba(255,87,33,0.35)",
                  background: "rgba(255,87,33,0.12)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Delete account & server data
              </button>
            ) : (
              <div
                style={{
                  marginTop: 0,
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid rgba(255,87,33,0.35)",
                  background: "rgba(255,87,33,0.10)",
                }}
              >
                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  This permanently deletes your account and server data (cloud
                  backup). Download your CSV first if you want a copy.
                </div>

                <div style={{ fontSize: 13, marginTop: 10, opacity: 0.9 }}>
                  Type <strong>DELETE</strong> to confirm:
                </div>

                <input
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="DELETE"
                  style={{
                    width: "100%",
                    marginTop: 8,
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: 10,
                    padding: 10,
                    fontFamily: "inherit",
                  }}
                />

                <button
                  onClick={confirmDeleteAccount}
                  disabled={deleteBusy}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    background: "#FF5721",
                    color: "#fff",
                    border: "none",
                    padding: 10,
                    borderRadius: 10,
                    cursor: "pointer",
                    opacity: deleteBusy ? 0.8 : 1,
                  }}
                >
                  {deleteBusy ? "Deleting…" : "Confirm delete"}
                </button>

                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteText("");
                  }}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    background: "transparent",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: 10,
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {!isPro && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#B0B3C0" }}>
              Sign in above to manage your account.
            </div>
          )}
        </div>

        {/* Footer links + version */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.10)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <a className="app-link" href="/terms">
              Terms
            </a>
            <a className="app-link" href="/privacy">
              Privacy
            </a>
          </div>

          <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: 0.2 }}>V2.1</div>
        </div>
      </div>
    </div>
  );
}
