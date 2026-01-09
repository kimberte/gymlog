"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { exportCSV, importCSV } from "../lib/csv";
import { supabase } from "../lib/supabaseClient";
import { fetchLatestBackup, formatBackupDate } from "../lib/backup";

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

function formatKeyForDisplay(key: string | null) {
  if (!key) return "—";
  const dt = parseDateKey(key);
  if (!dt) return "—";
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

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

  const supabaseConfigured = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }, []);

  const isPro = Boolean(sessionEmail);
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
  const { bestStreak, totalWorkoutDays, lastWorkoutKey } = useMemo(() => {
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

    const lastKey = activeKeys.length ? activeKeys[activeKeys.length - 1] : null;

    return {
      bestStreak: best,
      totalWorkoutDays: activeKeys.length,
      lastWorkoutKey: lastKey,
    };
  }, [workouts]);

  const lastWorkoutDisplay = formatKeyForDisplay(lastWorkoutKey);

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
        const token = data.session?.access_token ?? null;
        setSessionEmail(userEmail);
        setSessionToken(token);

        unsub = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSessionEmail(newSession?.user?.email ?? null);
          setSessionToken(newSession?.access_token ?? null);
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

  async function sendMagicLink() {
    setAuthError(null);

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
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      toast("Check your email for the sign-in link");
    } catch {
      setAuthError("Could not send login email.");
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
      toast("Sign in to unlock Pro features");
      return;
    }

    exportCSV(workouts);
    toast("Workouts exported");
  }

  function downloadTemplate() {
    if (!isPro) {
      toast("Sign in to unlock Pro features");
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
      toast("Sign in to unlock Pro features");
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
      toast("Sign in to unlock Pro features");
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
      toast("Sign in to unlock Pro features");
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
      toast("Sign in to unlock Pro features");
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
            <div>⏱ Last workout: {lastWorkoutDisplay}</div>
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
                Sign in to unlock CSV import/export (and auto-backup).
              </div>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
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

              <button
                onClick={sendMagicLink}
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
              >
                {authLoading ? "Sending…" : "Send sign-in link"}
              </button>

              {authError && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#FFB199" }}>
                  {authError}
                </div>
              )}
            </>
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
      </div>
    </div>
  );
}
