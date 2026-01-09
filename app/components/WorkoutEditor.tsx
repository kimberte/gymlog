"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EXERCISES } from "../lib/exercises";
import { WorkoutEntry, WorkoutMap, getDayEntries } from "../lib/storage";

type Props = {
  date: string; // YYYY-MM-DD
  workouts: WorkoutMap;
  setWorkouts: (w: WorkoutMap) => void;
  // Called after explicit saves (so parent can trigger cloud backup)
  onSaved?: (nextWorkouts: WorkoutMap) => void;
  onClose: () => void;
  toast: (msg: string) => void;
};

function uid() {
  return `w_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function hasContent(e: { title?: string; notes?: string }) {
  return Boolean(String(e?.title ?? "").trim() || String(e?.notes ?? "").trim());
}

function formatDisplayDate(yyyyMMdd: string) {
  // Treat as local date to avoid off-by-one in negative timezones
  const [y, m, d] = yyyyMMdd.split("-").map((v) => parseInt(v, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0); // noon local
  return dt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkoutEditor({
  date,
  workouts,
  setWorkouts,
  onSaved,
  onClose,
  toast,
}: Props) {
  const initialEntries = useMemo<WorkoutEntry[]>(() => {
    const entries = getDayEntries(workouts, date).slice(0, 3).map((e, i) => ({
      id: String(e?.id || `w${i + 1}`),
      title: String(e?.title ?? ""),
      notes: String(e?.notes ?? ""),
    }));
    return entries.length ? entries : [{ id: "w1", title: "", notes: "" }];
  }, [workouts, date]);

  const [entries, setEntries] = useState<WorkoutEntry[]>(initialEntries);
  const [activeIdx, setActiveIdx] = useState(0);

  // exercise helper panel
  const [showHelper, setShowHelper] = useState(false);
  const [exName, setExName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [time, setTime] = useState("");
  const [quick, setQuick] = useState("");
  const exRef = useRef<HTMLInputElement | null>(null);

  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep in sync when date changes (close/reopen)
  useEffect(() => {
    setEntries(initialEntries);
    setActiveIdx(0);
    setShowHelper(false);
    setExName("");
    setSets("");
    setReps("");
    setWeight("");
    setTime("");
    setQuick("");
  }, [initialEntries]);

  const active = entries[activeIdx] ?? entries[0];

  function updateActive(patch: Partial<WorkoutEntry>) {
    setEntries((prev) =>
      prev.map((e, i) => (i === activeIdx ? { ...e, ...patch } : e))
    );
  }

  function addWorkoutTab() {
    if (entries.length >= 3) {
      toast("Max 3 workouts per day");
      return;
    }
    const next = { id: `w${entries.length + 1}`, title: "", notes: "" };
    setEntries((prev) => [...prev, next]);
    setActiveIdx(entries.length);
    setShowHelper(false);
    setTimeout(() => notesRef.current?.focus(), 50);
  }

  function deleteActiveWorkout() {
    const ok = window.confirm("Delete this workout?");
    if (!ok) return;

    if (entries.length === 1) {
      // Clear the day entirely
      const next = { ...(workouts as any) };
      delete (next as any)[date];
      setWorkouts(next as any);
      onSaved?.(next as any);
      toast("Workout deleted");
      onClose();
      return;
    }

    setEntries((prev) => {
      const next = prev.filter((_, i) => i !== activeIdx);
      // re-label ids w1..w3 for consistency
      return next.map((e, i) => ({ ...e, id: `w${i + 1}` }));
    });
    setActiveIdx((i) => Math.max(0, i - 1));
    toast("Workout removed");
  }

  function handleSave() {
    const cleaned = entries
      .slice(0, 3)
      .map((e, i) => ({
        id: `w${i + 1}`,
        title: String(e.title ?? ""),
        notes: String(e.notes ?? ""),
      }))
      .filter(hasContent);

    const next = { ...(workouts as any) };

    if (cleaned.length === 0) {
      delete (next as any)[date];
    } else {
      (next as any)[date] = { entries: cleaned };
    }

    setWorkouts(next as any);
    onSaved?.(next as any);

    toast("Saved");
    onClose();
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(active?.notes ?? "");
      toast("Copied");
    } catch {
      toast("Copy failed");
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const merged = (active?.notes ?? "").trimEnd();
      const next = merged ? merged + "\n" + text : text;
      updateActive({ notes: next });
      toast("Pasted");
    } catch {
      toast("Paste failed");
    }
  }

  function toggleHelper() {
    setShowHelper((v) => {
      const next = !v;
      if (next) {
        setTimeout(() => exRef.current?.focus(), 50);
      }
      return next;
    });
  }

  function resetHelperInputs() {
    setExName("");
    setSets("");
    setReps("");
    setWeight("");
    setTime("");
    setQuick("");
  }

  function buildExerciseLine() {
    const n = exName.trim();
    if (!n) return null;

    const parts: string[] = [];
    if (sets.trim()) parts.push(`${sets.trim()} sets`);
    if (reps.trim()) parts.push(`${reps.trim()} reps`);
    if (weight.trim()) parts.push(`${weight.trim()} weight`);
    if (time.trim()) parts.push(`${time.trim()} time`);
    const meta = parts.length ? ` — ${parts.join(", ")}` : "";
    const q = quick.trim() ? ` — ${quick.trim()}` : "";
    return `${n}${meta}${q}`;
  }

  function addExerciseToNotes() {
    const line = buildExerciseLine();
    if (!line) {
      toast("Pick an exercise name");
      return;
    }

    const base = (active?.notes ?? "").trimEnd();
    const next = base ? base + "\n" + line : line;
    updateActive({ notes: next });

    resetHelperInputs();
    toast("Added");
    setTimeout(() => notesRef.current?.focus(), 50);
  }

  // nice label for tabs
  const tabLabels = useMemo(() => {
    return entries.map((e, i) => {
      const t = String(e.title ?? "").trim();
      return t ? t : `Workout ${i + 1}`;
    });
  }, [entries]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="editor editor-full"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="editor-header">
          <div className="editor-date">{formatDisplayDate(date)}</div>

          <input
            className="editor-title"
            value={active?.title ?? ""}
            onChange={(e) => updateActive({ title: e.target.value })}
            placeholder="Workout title"
          />

          {/* Tabs row */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              overflowX: "auto",
              paddingBottom: 6,
              marginTop: 6,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {tabLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: i === activeIdx ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: i === activeIdx ? "rgba(255,87,33,0.14)" : "transparent",
                  color: "var(--text)",
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                }}
              >
                {label}
              </button>
            ))}

            <button
              onClick={addWorkoutTab}
              title="Add workout"
              aria-label="Add workout"
              style={{
                padding: "8px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
                opacity: entries.length >= 3 ? 0.5 : 1,
              }}
              disabled={entries.length >= 3}
            >
              + Workout
            </button>
          </div>
        </div>

        <div className="editor-content">
          {/* Main notes area */}
          <textarea
            ref={notesRef}
            className="editor-notes"
            value={active?.notes ?? ""}
            onChange={(e) => updateActive({ notes: e.target.value })}
            placeholder="Workout notes"
          />

          {/* Exercise helper panel (compact) */}
          {showHelper && (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.10)",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                Add exercise (appends to notes)
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  ref={exRef}
                  value={exName}
                  onChange={(e) => setExName(e.target.value)}
                  list="exercise-list"
                  placeholder="Exercise name…"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: 10,
                    padding: "8px 10px",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                />

                <button
                  onClick={addExerciseToNotes}
                  style={{
                    flex: "0 0 auto",
                    background: "var(--accent)",
                    border: "none",
                    color: "white",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  Add
                </button>
              </div>

              <datalist id="exercise-list">
                {EXERCISES.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(110px, 1fr))",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <input
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  placeholder="Sets"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: 10,
                    padding: "8px 10px",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                />
                <input
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="Reps"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: 10,
                    padding: "8px 10px",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                />
                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Weight"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: 10,
                    padding: "8px 10px",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                />
                <input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="Time"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: 10,
                    padding: "8px 10px",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                />
              </div>

              <input
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                placeholder="Quick note (optional)"
                style={{
                  width: "100%",
                  marginTop: 8,
                  background: "rgba(0,0,0,0.18)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  borderRadius: 10,
                  padding: "8px 10px",
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
              />
            </div>
          )}
        </div>

        <div className="editor-actions">
          {/* pencil/keyboard toggle on the LEFT */}
          <button
            onClick={toggleHelper}
            className="secondary"
            aria-label={showHelper ? "Hide exercise helper" : "Show exercise helper"}
            title={showHelper ? "Hide exercise helper" : "Show exercise helper"}
            style={{ flex: "0 0 auto", width: 54, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✎
          </button>

          <button onClick={copyToClipboard} className="secondary">
            Copy
          </button>
          <button onClick={pasteFromClipboard} className="secondary">
            Paste
          </button>

          <button onClick={deleteActiveWorkout} className="secondary">
            Delete
          </button>

          <button onClick={handleSave} className="primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
