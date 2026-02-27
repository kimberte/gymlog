"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { WorkoutEntry, WorkoutMap, getDayEntries } from "../lib/storage";
import { getSessionUser } from "../lib/backup";
import { compressImageToWebp } from "../lib/imageCompress";
import { shareWorkoutVerticalImage } from "../lib/shareImage";
import { ensureTrialStarted, getProStatus, type ProStatus } from "../lib/entitlements";
import {
  compileStructuredBlock,
  parseStructuredFromNotes,
  removeStructuredBlock,
  upsertStructuredBlock,
  type StructuredWorkout,
  type StructuredExerciseRow,
} from "../lib/structuredNotes";

// NEW: per-workout media (image OR video)
import {
  getWorkoutMediaSignedUrl,
  removeWorkoutMedia,
  uploadWorkoutMedia,
} from "../lib/workoutMedia";

// Community sharing (siloed; best-effort)
import { deleteWorkoutDay, publishWorkoutDay } from "../lib/communityShare";

// (Optional legacy date-photo imports can be removed if you’re fully migrated)
// If you still have these in your project and want to keep backward compat, leave them.
// import { getWorkoutImageSignedUrl, removeWorkoutImage, uploadWorkoutImage } from "../lib/workoutImages";

type WorkoutMediaMeta =
  | null
  | {
      kind: "image" | "video";
      path: string;
      updatedAt: number;
      sizeBytes?: number;
      durationSec?: number;
      width?: number;
      height?: number;
    };

type EntryWithMedia = WorkoutEntry & { media?: WorkoutMediaMeta };

type Props = {
  date: string; // YYYY-MM-DD
  workouts: WorkoutMap;
  setWorkouts: (w: WorkoutMap) => void;
  // Called after explicit saves (so parent can trigger cloud backup)
  onSaved?: (nextWorkouts: WorkoutMap) => void;
  onClose: () => void;
  toast: (msg: string) => void;
};

function hasContent(e: { title?: string; notes?: string }) {
  return Boolean(String(e?.title ?? "").trim() || String(e?.notes ?? "").trim());
}


function structuredToNotebookText(data: StructuredWorkout, extraNotes?: string): string {
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const cleaned = rows
    .map((r: any) => ({
      name: String(r?.name ?? "").trim(),
      reps: String(r?.reps ?? "").trim(),
      weight: String(r?.weight ?? "").trim(),
      completed: Boolean(r?.completed),
    }))
    .filter((r) => r.name || r.reps || r.weight || r.completed);

  // Group rows by exercise name, preserving order of first appearance.
  const order: string[] = [];
  const groups = new Map<string, typeof cleaned>();
  cleaned.forEach((r) => {
    const key = r.name || "(Exercise)";
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(r);
  });

  const lines: string[] = [];
  order.forEach((exName) => {
    lines.push(`${exName}`);
    const sets = groups.get(exName) || [];
    sets.forEach((s, idx) => {
      const repPart = s.reps ? `${s.reps}` : "";
      const wtPart = s.weight ? `${s.weight}` : "";

      let mid = "";
      if (repPart && wtPart) mid = `${repPart} x ${wtPart}`;
      else if (repPart) mid = `${repPart}`;
      else if (wtPart) mid = `${wtPart}`;

      const doneLabel = s.completed ? "Done" : "Not Done";
      const main = mid ? `: ${mid}` : ":";
      lines.push(`- Set ${idx + 1}${main} (${doneLabel})`);
    });
    lines.push("");
  });

  const cleanedExtra = String(extraNotes ?? "").trim();
  if (cleanedExtra) {
    lines.push("Notes:");
    lines.push(cleanedExtra);
  }

  return lines.join("\n").trim();
}

function formatCompactNumber(n: number): string {
  const v = Math.round(n);
  if (!Number.isFinite(v) || v <= 0) return "0";
  if (v < 1000) return v.toLocaleString();
  if (v < 10000) return `${(Math.round((v / 1000) * 10) / 10).toString()}k`; // 1.2k
  return `${Math.round(v / 1000).toLocaleString()}k`;
}

function sanitizeIntInput(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

function sanitizeDecimalInput(raw: string): string {
  // Allow digits and a single dot
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

function parseFirstNumber(s: string): number | null {
  const m = String(s || "").match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function weightUnitFromString(s: string): string {
  const t = String(s || "").toLowerCase();
  if (t.includes("kg")) return "kg";
  if (t.includes("lb")) return "lb";
  return "";
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

// ✅ Clipboard payloads
const CLIPBOARD_WORKOUT_KIND = "gym-log-workout-v1";
const CLIPBOARD_DAY_KIND = "gym-log-day-v1";

type ClipboardWorkout = {
  kind: typeof CLIPBOARD_WORKOUT_KIND;
  title: string;
  notes: string;
};

type ClipboardDay = {
  kind: typeof CLIPBOARD_DAY_KIND;
  entries: Array<{ title: string; notes: string }>; // up to 3
};

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function readVideoMeta(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;

    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => resolve();
      const onErr = () => reject(new Error("Could not read video metadata"));
      v.addEventListener("loadedmetadata", onLoaded, { once: true });
      v.addEventListener("error", onErr, { once: true });
    });

    return {
      duration: Number(v.duration || 0),
      width: Number(v.videoWidth || 0),
      height: Number(v.videoHeight || 0),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function WorkoutEditor({
  date,
  workouts,
  setWorkouts,
  onSaved,
  onClose,
  toast,
}: Props) {
  const initialPb = useMemo(() => Boolean((workouts as any)?.[date]?.pb), [workouts, date]);

  const initialEntries = useMemo<EntryWithMedia[]>(() => {
    const entries = getDayEntries(workouts, date)
      .slice(0, 3)
      .map((e, i) => ({
        id: String(e?.id || `w${i + 1}`),
        title: String(e?.title ?? ""),
        notes: String(e?.notes ?? ""),
        media: (e as any)?.media ?? null,
      }));
    return entries.length ? entries : [{ id: "w1", title: "", notes: "", media: null }];
  }, [workouts, date]);

  const [entries, setEntries] = useState<EntryWithMedia[]>(initialEntries);
  const [activeIdx, setActiveIdx] = useState(0);

  // Structured editor (stored inside notes string via structuredNotes helpers)
  type EditorMode = "notebook" | "structured";
  const [modeByEntryId, setModeByEntryId] = useState<Record<string, EditorMode>>({});
  const [structuredByEntryId, setStructuredByEntryId] = useState<Record<string, StructuredWorkout>>({});
  const [extraNotesByEntryId, setExtraNotesByEntryId] = useState<Record<string, string>>({});
  const [collapsedByEntryId, setCollapsedByEntryId] = useState<Record<string, Record<string, boolean>>>({});
  const lastNotesSeenRef = useRef<Record<string, string>>({});

  // Initialize structured drafts from existing notes (without mutating entries)
  useEffect(() => {
    setModeByEntryId((prevModes) => {
      const nextModes = { ...prevModes };
      const nextStructured: Record<string, StructuredWorkout> = {};
      const nextExtra: Record<string, string> = {};

      entries.forEach((e) => {
        const id = String(e.id);
        const notes = String(e.notes ?? "");
        const last = lastNotesSeenRef.current[id];

        // Only parse when we haven't seen these notes for this entry yet
        if (last !== notes) {
          lastNotesSeenRef.current[id] = notes;

          const parsed = parseStructuredFromNotes(notes);
          if (parsed) {
            nextModes[id] = "structured";
            nextStructured[id] = parsed;
            nextExtra[id] = removeStructuredBlock(notes);
          } else {
            // Keep existing mode unless it doesn't exist yet
            if (!nextModes[id]) nextModes[id] = "notebook";
            if (nextModes[id] === "structured") {
              // If someone manually removed the block, fall back
              nextModes[id] = "notebook";
            }
            if (nextExtra[id] == null) nextExtra[id] = notes;
            if (!nextStructured[id]) {
              nextStructured[id] = {
                workoutName: String(e.title ?? "").trim(),
                rows: [],
              };
            }
          }
        }
      });

      // Apply structured/extra drafts updates in one go (best-effort; only for entries we parsed above)
      if (Object.keys(nextStructured).length) {
        setStructuredByEntryId((prev) => ({ ...prev, ...nextStructured }));
      }
      if (Object.keys(nextExtra).length) {
        setExtraNotesByEntryId((prev) => ({ ...prev, ...nextExtra }));
      }

      return nextModes;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // Personal Best marker (per-day)
  const [isPb, setIsPb] = useState(initialPb);
  useEffect(() => {
    setIsPb(Boolean((workouts as any)?.[date]?.pb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, workouts]);

  // Pro gating
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [proStatus, setProStatus] = useState<ProStatus>({ isPro: false, reason: "signed_out" });

  // Media UI state (per active workout)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [pickKind, setPickKind] = useState<"image" | "video">("image");
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const editorContentRef = useRef<HTMLDivElement | null>(null);

  // Keyboard-safe bottom padding (mobile)
  const [keyboardPad, setKeyboardPad] = useState(0);

  // Lock background scroll while editor is open
  useEffect(() => {
    const scrollY = window.scrollY || 0;

    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevOverscroll = (document.body.style as any).overscrollBehaviorY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    (document.body.style as any).overscrollBehaviorY = "contain";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      (document.body.style as any).overscrollBehaviorY = prevOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Visual viewport / keyboard pad
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardPad(covered);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // Load signed-in user (Pro gating)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getSessionUser();
      if (cancelled) return;
      setSessionUserId(user?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionUserId) {
      setProStatus({ isPro: false, reason: "signed_out" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await ensureTrialStarted(sessionUserId);
        const st = await getProStatus(sessionUserId);
        if (!cancelled) setProStatus(st);
      } catch {
        if (!cancelled) setProStatus({ isPro: false, reason: "free" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);


  // Keep in sync when DATE changes (close/reopen).
  // IMPORTANT: Don't reset local editor state just because `workouts` changed
  // (e.g., after pressing Save). That would wipe UI state like the media preview.
  useEffect(() => {
    setEntries(initialEntries);
    setActiveIdx(0);
    setMediaUrl(null);
    setMediaOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const active = entries[activeIdx] ?? entries[0];

  const activeId = String(active?.id ?? "w1");
  const activeMode: "notebook" | "structured" = modeByEntryId[activeId] ?? "notebook";

  const activeStructured: StructuredWorkout =
    structuredByEntryId[activeId] ?? {
      workoutName: String(active?.title ?? "").trim(),
      rows: [],
    };

  const activeExtraNotes: string = extraNotesByEntryId[activeId] ?? String(active?.notes ?? "");
const activeRowVolumes = useMemo(
  () => (activeStructured.rows || []).map((r) => computeRowVolume(r)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [activeStructured.rows]
);
const activeTotalVolume = useMemo(
  () => activeRowVolumes.reduce((sum, v) => sum + (Number(v) || 0), 0),
  [activeRowVolumes]
);

  type PrevExerciseStats = {
    date: string;
    summary: string;
    maxWeightNum: number | null;
    unit: string;
  };

  function computeMaxWeightForIndices(rows: StructuredExerciseRow[], indices: number[]) {
    let bestNum: number | null = null;
    let bestRaw = "";
    indices.forEach((idx) => {
      const wRaw = String((rows[idx] as any)?.weight ?? "").trim();
      const n = parseFirstNumber(wRaw);
      if (n == null) return;
      if (bestNum == null || n > bestNum) {
        bestNum = n;
        bestRaw = wRaw;
      }
    });
    return { bestNum, bestRaw };
  }

  function computeCommonReps(rows: StructuredExerciseRow[], indices: number[]) {
    // Use first non-empty reps as a simple, predictable summary.
    for (const idx of indices) {
      const r = String((rows[idx] as any)?.reps ?? "").trim();
      if (r) return r;
    }
    return "";
  }

  const prevStatsByExerciseKey: Record<string, PrevExerciseStats> = useMemo(() => {
    const neededGroups = groupRowsByExercise(activeStructured.rows || []);
    const neededKeys = new Set(neededGroups.map((g) => g.key));
    if (!neededKeys.size) return {};

    const out: Record<string, PrevExerciseStats> = {};

    const allDates = Object.keys(workouts || {})
      .filter((k) => typeof k === "string" && k < date)
      .sort()
      .reverse();

    for (const d of allDates) {
      const dayEntries = getDayEntries(workouts, d);
      for (const e of dayEntries) {
        const parsed = parseStructuredFromNotes(String((e as any)?.notes ?? ""));
        if (!parsed?.rows?.length) continue;
        const groups = groupRowsByExercise(parsed.rows);
        for (const g of groups) {
          if (!neededKeys.has(g.key)) continue;
          if (out[g.key]) continue;

          const { bestNum, bestRaw } = computeMaxWeightForIndices(parsed.rows, g.indices);
          const reps = computeCommonReps(parsed.rows, g.indices);
          const setCount = g.indices.length;
          const unit = weightUnitFromString(bestRaw);

          // Summary like: 3×8 @225
          const parts: string[] = [];
          if (setCount) {
            if (reps) parts.push(`${setCount}×${reps}`);
            else parts.push(`${setCount} set${setCount === 1 ? "" : "s"}`);
          }
          if (bestRaw) parts.push(`@${bestRaw}`);

          out[g.key] = {
            date: d,
            summary: parts.join(" ").trim(),
            maxWeightNum: bestNum,
            unit,
          };

          if (Object.keys(out).length === neededKeys.size) return out;
        }
      }
    }

    return out;
  }, [workouts, date, activeStructured.rows]);


  function setActiveMode(nextMode: "notebook" | "structured") {
    setModeByEntryId((prev) => ({ ...prev, [activeId]: nextMode }));
  }

  function updateActiveStructured(patch: Partial<StructuredWorkout>) {
    setStructuredByEntryId((prev) => ({
      ...prev,
      [activeId]: { ...activeStructured, ...patch },
    }));
  }

  function updateActiveStructuredRow(idx: number, patch: Partial<StructuredExerciseRow>) {
    const nextRows = (activeStructured.rows || []).map((r, i) =>
      i === idx ? ({ ...r, ...patch } as any) : r
    );
    updateActiveStructured({ rows: nextRows });
  }

  function addActiveStructuredRow() {
  const nextRows = [...(activeStructured.rows || [])];
  nextRows.push({ name: "", sets: "", reps: "", weight: "", completed: false } as any);
  updateActiveStructured({ rows: nextRows });
}

function duplicateLastStructuredRow() {
  const rows = activeStructured.rows || [];
  if (!rows.length) {
    addActiveStructuredRow();
    return;
  }
  const last = rows[rows.length - 1] || ({} as any);
  const nextRows = [...rows, { ...last }];
  updateActiveStructured({ rows: nextRows });
}

// "Add set" = duplicate last row's exercise name (and optionally reps/weight),
// defaulting sets to 1 and clearing the note. This mimics typical trackers where each row can be a set.
function addNextSetFromLastRow() {
  const rows = activeStructured.rows || [];
  if (!rows.length) {
    addActiveStructuredRow();
    return;
  }
  const last = rows[rows.length - 1] || ({} as any);
  const next: StructuredExerciseRow = {
    name: String((last as any)?.name ?? ""),
    sets: "",
    reps: String((last as any)?.reps ?? ""),
    weight: String((last as any)?.weight ?? ""),
    completed: false,
  } as any;

  updateActiveStructured({ rows: [...rows, next] });
}

function toggleRowCompleted(idx: number) {
  const row = (activeStructured.rows || [])[idx] as any;
  if (!row) return;
  updateActiveStructuredRow(idx, { completed: !row.completed } as any);
}

function parseNumeric(val: any): number {
  const s = String(val ?? "").replace(/,/g, "").trim();
  const m = s.match(/-?\d*\.?\d+/);
  return m ? Number(m[0]) : 0;
}

function computeRowVolume(r: StructuredExerciseRow): number {
  const reps = parseNumeric((r as any)?.reps);
  const weight = parseNumeric((r as any)?.weight);
  const setsRaw = parseNumeric((r as any)?.sets);
  const sets = setsRaw > 0 ? setsRaw : 1;
  if (!reps || !weight) return 0;
  return sets * reps * weight;
}

function normalizeExerciseKey(name: string) {
  const base = String(name || "").trim().toLowerCase();
  return base || "exercise";
}

type ExerciseGroup = { key: string; name: string; indices: number[] };

function groupRowsByExercise(rows: StructuredExerciseRow[]): ExerciseGroup[] {
  const order: string[] = [];
  const map = new Map<string, { name: string; indices: number[] }>();

  rows.forEach((r, idx) => {
    const name = String((r as any)?.name ?? "").trim();
    const key = normalizeExerciseKey(name);
    if (!map.has(key)) {
      map.set(key, { name: name || "Exercise", indices: [] });
      order.push(key);
    }
    map.get(key)!.indices.push(idx);
    // Keep latest non-empty display name
    if (name) map.get(key)!.name = name;
  });

  return order.map((key) => ({ key, name: map.get(key)!.name, indices: map.get(key)!.indices }));
}

const activeCollapsed = collapsedByEntryId[activeId] ?? {};

function setCollapsed(key: string, next: boolean) {
  setCollapsedByEntryId((prev) => ({
    ...prev,
    [activeId]: { ...(prev[activeId] ?? {}), [key]: next },
  }));
}

function renameExerciseInGroup(groupKey: string, nextName: string) {
  const rows = activeStructured.rows || [];
  const nextRows = rows.map((r) => {
    const key = normalizeExerciseKey(String((r as any)?.name ?? ""));
    if (key !== groupKey) return r as any;
    return { ...(r as any), name: nextName } as any;
  });
  updateActiveStructured({ rows: nextRows });
}

function addExercisePrompt() {
  const name = window.prompt("Exercise name?", "");
  if (name == null) return;
  const clean = String(name).trim();
  if (!clean) return;

  const setsStr = window.prompt("How many sets?", "3");
  const setsN = Math.max(1, Math.min(20, parseInt(String(setsStr || "1"), 10) || 1));

  const nextRows = [...(activeStructured.rows || [])];
  for (let i = 0; i < setsN; i++) {
    nextRows.push({ name: clean, sets: "", reps: "", weight: "", completed: false } as any);
  }
  updateActiveStructured({ rows: nextRows });
}

function addSetToExercise(groupKey: string) {
  const rows = activeStructured.rows || [];
  // Find last row for this exercise to copy reps/weight
  let lastIdx = -1;
  rows.forEach((r, idx) => {
    const key = normalizeExerciseKey(String((r as any)?.name ?? ""));
    if (key === groupKey) lastIdx = idx;
  });

  const last = lastIdx >= 0 ? (rows[lastIdx] as any) : null;
  const nextRow: StructuredExerciseRow = {
    name: last?.name ? String(last.name) : "Exercise",
    sets: "",
    reps: last?.reps != null ? String(last.reps) : "",
    weight: last?.weight != null ? String(last.weight) : "",
    completed: false,
  } as any;

  // Insert after the last row of that exercise (so sets stay grouped)
  if (lastIdx >= 0) {
    const nextRows = [...rows];
    nextRows.splice(lastIdx + 1, 0, nextRow as any);
    updateActiveStructured({ rows: nextRows });
  } else {
    updateActiveStructured({ rows: [...rows, nextRow as any] });
  }
}

function exerciseGroupVolume(indices: number[]) {
  const rows = activeStructured.rows || [];
  return indices.reduce((sum, idx) => sum + (computeRowVolume(rows[idx] as any) || 0), 0);
}

  function removeActiveStructuredRow(idx: number) {
    const nextRows = (activeStructured.rows || []).filter((_, i) => i !== idx);
    updateActiveStructured({ rows: nextRows });
  }

  function updateActiveExtraNotes(next: string) {
    setExtraNotesByEntryId((prev) => ({ ...prev, [activeId]: next }));
  }

  function canSwitchToStructured(): boolean {
    const notes = String(active?.notes ?? "");
    const hasStructured = Boolean(parseStructuredFromNotes(notes));
    const stripped = removeStructuredBlock(notes).trim();
    // Allow if already structured OR the free-text part is empty
    return hasStructured || stripped.length === 0;
  }

  function handleConvertStructuredToNotebook() {
    const parsed = parseStructuredFromNotes(String(active?.notes ?? ""));
    const data = parsed || activeStructured;
    const extra = String(extraNotesByEntryId?.[activeId] ?? "");
    const notebook = structuredToNotebookText(data, extra);

    // Remove structured block, then replace with plain notebook text (one-way)
    updateActive({ notes: notebook });
    lastNotesSeenRef.current[activeId] = notebook;

    setModeByEntryId((prev) => ({ ...prev, [activeId]: "notebook" }));
    setStructuredByEntryId((prev) => {
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
    setExtraNotesByEntryId((prev) => ({ ...prev, [activeId]: notebook }));
    toast("Converted to notebook style");
  }


  // When active workout changes, refresh media signed URL
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMediaUrl(null);
      setMediaOpen(false);

      const media = (active as any)?.media as WorkoutMediaMeta;
      if (!sessionUserId || !media?.path) return;

      try {
        const url = await getWorkoutMediaSignedUrl(String(media.path), 3600);
        if (cancelled) return;
        setMediaUrl(url);
      } catch {
        if (cancelled) return;
        setMediaUrl(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId, activeIdx, date]);

  function updateActive(patch: Partial<EntryWithMedia>) {
    setEntries((prev) =>
      prev.map((e, i) => (i === activeIdx ? ({ ...e, ...patch } as any) : e))
    );
  }

  function addWorkoutTab() {
    if (entries.length >= 3) {
      toast("Max 3 workouts per day");
      return;
    }
    const next: EntryWithMedia = { id: `w${entries.length + 1}`, title: "", notes: "", media: null };
    setEntries((prev) => [...prev, next]);
    setActiveIdx(entries.length);
    setTimeout(() => notesRef.current?.focus(), 50);
  }

  function deleteActiveWorkout() {
    const ok = window.confirm("Delete this workout?");
    if (!ok) return;

    if (entries.length === 1) {
      const next = { ...(workouts as any) };

      const existing = (next as any)?.[date];
      const existingImage = existing?.image;
      const keepPb = Boolean(isPb);

      if (keepPb || existingImage?.path) {
        (next as any)[date] = {
          entries: [],
          pb: keepPb,
          image: existingImage?.path ? existingImage : undefined,
        };
      } else {
        delete (next as any)[date];
      }
      setWorkouts(next as any);
      onSaved?.(next as any);
      // Best-effort: remove from community snapshot if enabled
      void deleteWorkoutDay({ dateKey: date });
      toast("Workout deleted");
      onClose();
      return;
    }

    setEntries((prev) => {
      const next = prev.filter((_, i) => i !== activeIdx);
      return next.map((e, i) => ({ ...e, id: `w${i + 1}` }));
    });
    setActiveIdx((i) => Math.max(0, i - 1));
    toast("Workout removed");
  }

  function persistEntriesToWorkouts(nextEntries: EntryWithMedia[]) {
    const next = { ...(workouts as any) };
    const day =
      (next as any)[date] && typeof (next as any)[date] === "object"
        ? { ...(next as any)[date] }
        : { entries: [] };

    // Keep any legacy day-level image meta if you still have it
    const existingImage = day?.image;

    const buildNotes = (e: EntryWithMedia) => {
      const id = String(e.id);
      const mode = modeByEntryId[id] ?? "notebook";
      if (mode !== "structured") return String(e.notes ?? "");

      // Only exercises are shown in the UI, but we still store a structured payload
      // inside notes to preserve round-trip without changing storage schema.
      const draft = structuredByEntryId[id] ?? {
        workoutName: "",
        rows: [],
      };

      const extra = extraNotesByEntryId[id] ?? removeStructuredBlock(String(e.notes ?? ""));
      const compiled = compileStructuredBlock(draft);
      return upsertStructuredBlock(String(extra ?? ""), compiled);
    };

    // Persist up to 3
    const merged = nextEntries.slice(0, 3).map((e, i) => ({
      id: `w${i + 1}`,
      title: String(e.title ?? ""),
      notes: buildNotes(e),
      media: (e as any)?.media ?? null,
    }));

    day.entries = merged;
    day.pb = Boolean(isPb);
    if (existingImage?.path) day.image = existingImage;

    (next as any)[date] = day;
    setWorkouts(next as any);
    onSaved?.(next as any);
  }

  function handleSave() {
    const buildNotes = (e: EntryWithMedia) => {
      const id = String(e.id);
      const mode = modeByEntryId[id] ?? "notebook";
      if (mode !== "structured") return String(e.notes ?? "");

      const draft = structuredByEntryId[id] ?? {
        workoutName: "",
        rows: [],
      };

      const extra = extraNotesByEntryId[id] ?? removeStructuredBlock(String(e.notes ?? ""));
      const compiled = compileStructuredBlock(draft);
      return upsertStructuredBlock(String(extra ?? ""), compiled);
    };

    const merged = entries
      .slice(0, 3)
      .map((e, i) => ({
        id: `w${i + 1}`,
        title: String(e.title ?? ""),
        notes: buildNotes(e),
        media: (e as any)?.media ?? null,
      }));

    const cleaned = merged.filter((e) => hasContent(e) || (e as any)?.media?.path);

    const next = { ...(workouts as any) };
    const existingImage = (next as any)?.[date]?.image; // legacy day image meta
    const keepPb = Boolean(isPb);

    if (cleaned.length === 0) {
      if (keepPb || existingImage?.path) {
        (next as any)[date] = {
          entries: [],
          pb: keepPb,
          image: existingImage?.path ? existingImage : undefined,
        };
      } else {
        delete (next as any)[date];
      }
    } else {
      (next as any)[date] = {
        entries: cleaned,
        pb: keepPb,
        image: existingImage?.path ? existingImage : undefined,
      };
    }

    setWorkouts(next as any);
    onSaved?.(next as any);
    // Best-effort: publish/remove community snapshot if enabled
    void publishWorkoutDay({ dateKey: date, workouts: next as any });
    toast("Saved");
  }

  function togglePb() {
    const nextPb = !isPb;
    setIsPb(nextPb);

    const next = { ...(workouts as any) };
    const day =
      (next as any)[date] && typeof (next as any)[date] === "object"
        ? { ...(next as any)[date] }
        : { entries: [] };

    const existingImage = (day as any)?.image;
    day.pb = nextPb;
    if (!Array.isArray(day.entries)) day.entries = [];
    if (existingImage?.path) day.image = existingImage;

    // If toggling off AND no content + no media + no legacy image, remove the day entirely.
    if (!nextPb) {
      const hasEntries = Array.isArray(day.entries) && day.entries.some((e: any) => hasContent(e) || e?.media?.path);
      const hasLegacyImage = Boolean(existingImage?.path);
      if (!hasEntries && !hasLegacyImage) {
        delete (next as any)[date];
      } else {
        (next as any)[date] = day;
      }
    } else {
      (next as any)[date] = day;
    }

    setWorkouts(next as any);
    onSaved?.(next as any);
    // Best-effort: update community snapshot if enabled
    void publishWorkoutDay({ dateKey: date, workouts: next as any });
    toast(nextPb ? "Marked PB" : "PB cleared");
  }

  async function handlePickFile(file: File) {
    if (!sessionUserId) {
      toast("Sign in to upload");
      return;
    }
    if (!file) return;

    const activeEntryId = String(active?.id || `w${activeIdx + 1}`);
    const existing = (active as any)?.media as WorkoutMediaMeta;

    // If switching kind while one exists, confirm + remove old first
    if (existing?.path && existing?.kind && existing.kind !== pickKind) {
      const ok = window.confirm(
        `Replace existing ${existing.kind} with a ${pickKind}?`
      );
      if (!ok) {
        if (mediaInputRef.current) mediaInputRef.current.value = "";
        return;
      }
      try {
        setMediaBusy(true);
        await removeWorkoutMedia(String(existing.path));
      } catch {
        // ignore
      } finally {
        setMediaBusy(false);
      }
    }

    if (pickKind === "image") {
      if (!file.type.startsWith("image/")) {
        toast("Please select an image");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast("Image too large (max 10MB)");
        return;
      }

      setMediaBusy(true);
      try {
        // compress to webp under hard cap
        const hardCap = 1.5 * 1024 * 1024;
        let blob = await compressImageToWebp(file, { maxLongEdge: 1800, quality: 0.78 });
        if (blob.size > hardCap) blob = await compressImageToWebp(file, { maxLongEdge: 1800, quality: 0.7 });
        if (blob.size > hardCap) blob = await compressImageToWebp(file, { maxLongEdge: 1800, quality: 0.62 });
        if (blob.size > hardCap) {
          toast("Image too large after compression");
          return;
        }

        const path = await uploadWorkoutMedia({
          userId: sessionUserId,
          date,
          entryId: activeEntryId,
          blob,
          kind: "image",
          ext: "webp",
        });

        const url = await getWorkoutMediaSignedUrl(path, 3600);
        setMediaUrl(url);
        setMediaOpen(false);

        const nextMedia: WorkoutMediaMeta = {
          kind: "image",
          path,
          updatedAt: Date.now(),
          sizeBytes: blob.size,
        };

        const nextEntries = entries.map((e, i) =>
          i === activeIdx ? ({ ...e, media: nextMedia } as any) : e
        );
        setEntries(nextEntries);
        persistEntriesToWorkouts(nextEntries);

        toast("Image uploaded");
      } catch (err: any) {
        console.error("Image upload failed:", err);
        const msg = err?.message || err?.error_description || err?.error || "";
        toast(msg ? `Upload failed: ${msg}` : "Upload failed");
      } finally {
        setMediaBusy(false);
        if (mediaInputRef.current) mediaInputRef.current.value = "";
      }
      return;
    }

    // Video rules (Supabase-only; no transcoding)
    const isMp4 = file.type === "video/mp4";
    const isMov = file.type === "video/quicktime";
    if (!isMp4 && !isMov) {
      toast("Video must be MP4 or MOV");
      return;
    }

    const maxBytes = 25 * 1024 * 1024; // 25MB
    if (file.size > maxBytes) {
      toast("Video too large (max 25MB)");
      return;
    }

    setMediaBusy(true);
    try {
      const meta = await readVideoMeta(file);
      const duration = Number(meta.duration || 0);
      if (!duration || duration <= 0) {
        toast("Could not read video duration");
        return;
      }
      if (duration > 30.5) {
        toast("Video too long (max 30 seconds)");
        return;
      }

      const ext = isMov ? "mov" : "mp4";

      const path = await uploadWorkoutMedia({
        userId: sessionUserId,
        date,
        entryId: activeEntryId,
        blob: file,
        kind: "video",
        ext,
      });

      const url = await getWorkoutMediaSignedUrl(path, 3600);
      setMediaUrl(url);
      setMediaOpen(false);

      const nextMedia: WorkoutMediaMeta = {
        kind: "video",
        path,
        updatedAt: Date.now(),
        sizeBytes: file.size,
        durationSec: Math.round(duration * 10) / 10,
        width: meta.width,
        height: meta.height,
      };

      const nextEntries = entries.map((e, i) =>
        i === activeIdx ? ({ ...e, media: nextMedia } as any) : e
      );
      setEntries(nextEntries);
      persistEntriesToWorkouts(nextEntries);

      toast("Video uploaded");
    } catch (err: any) {
      console.error("Video upload failed:", err);
      const msg = err?.message || err?.error_description || err?.error || "";
      toast(msg ? `Upload failed: ${msg}` : "Upload failed");
    } finally {
      setMediaBusy(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  }

  async function handleRemoveMedia() {
    if (!sessionUserId) {
      toast("Sign in to manage media");
      return;
    }
    if (!proStatus.isPro) {
      toast("Pro feature locked. Get Pro in Settings.");
      try { window.location.href = "/subscribe"; } catch {}
      return;
    }
    const media = (active as any)?.media as WorkoutMediaMeta;
    if (!media?.path) return;

    const ok = window.confirm("Remove this media?");
    if (!ok) return;

    setMediaBusy(true);
    try {
      await removeWorkoutMedia(String(media.path));
      setMediaUrl(null);
      setMediaOpen(false);

      const nextEntries = entries.map((e, i) =>
        i === activeIdx ? ({ ...e, media: null } as any) : e
      );
      setEntries(nextEntries);
      persistEntriesToWorkouts(nextEntries);

      toast("Removed");
    } catch (err: any) {
      console.error("Remove media failed:", err);
      const msg = err?.message || err?.error_description || err?.error || "";
      toast(msg ? `Failed: ${msg}` : "Failed to remove");
    } finally {
      setMediaBusy(false);
    }
  }

  // ✅ Copy ALL workouts (up to 3) for this day: title + notes (media NOT copied)
  async function copyToClipboard() {
    try {
      const cleaned = entries
        .slice(0, 3)
        .map((e) => ({
          title: String(e?.title ?? ""),
          notes: String(e?.notes ?? ""),
        }))
        .filter(hasContent);

      if (cleaned.length === 0) {
        toast("Nothing to copy");
        return;
      }

      const payload: ClipboardDay = {
        kind: CLIPBOARD_DAY_KIND,
        entries: cleaned.slice(0, 3),
      };

      await navigator.clipboard.writeText(JSON.stringify(payload));
      toast(`Copied ${payload.entries.length} workout${payload.entries.length === 1 ? "" : "s"}`);
    } catch {
      toast("Copy failed");
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      // Day payload
      const dayParsed = safeJsonParse<ClipboardDay>(text);
      if (dayParsed && dayParsed.kind === CLIPBOARD_DAY_KIND) {
        const incoming = (dayParsed.entries ?? [])
          .slice(0, 3)
          .map((e, i) => ({
            id: `w${i + 1}`,
            title: String(e?.title ?? ""),
            notes: String(e?.notes ?? ""),
            media: null,
          }))
          .filter(hasContent);

        if (incoming.length === 0) {
          toast("Nothing to paste");
          return;
        }

        setEntries(incoming.length ? (incoming as any) : [{ id: "w1", title: "", notes: "", media: null }]);
        setActiveIdx(0);

        toast(`Pasted ${incoming.length} workout${incoming.length === 1 ? "" : "s"}`);
        return;
      }

      // Single workout payload
      const oneParsed = safeJsonParse<ClipboardWorkout>(text);
      if (oneParsed && oneParsed.kind === CLIPBOARD_WORKOUT_KIND) {
        const incomingTitle = String(oneParsed.title ?? "").trim();
        const incomingNotes = String(oneParsed.notes ?? "");

        const currentTitle = String(active?.title ?? "").trim();
        const currentNotes = String(active?.notes ?? "").trimEnd();

        const nextTitle = currentTitle ? currentTitle : incomingTitle;
        const mergedNotes = currentNotes
          ? incomingNotes
            ? currentNotes + "\n" + incomingNotes
            : currentNotes
          : incomingNotes;

        updateActive({ title: nextTitle, notes: mergedNotes });
        toast("Pasted");
        return;
      }

      // Plain text fallback
      const merged = String(active?.notes ?? "").trimEnd();
      const next = merged ? merged + "\n" + text : text;
      updateActive({ notes: next });
      toast("Pasted");
    } catch {
      toast("Paste failed");
    }
  }

  // ✅ Tabs: show icon if that workout has media (video or image)
  const tabLabels = useMemo(() => {
    return entries.map((e, i) => {
      const t = String(e.title ?? "").trim();
      const media = (e as any)?.media as WorkoutMediaMeta;
      const icon = media?.kind === "video" ? " 🎥" : media?.kind === "image" ? " 📷" : "";
      return (t ? t : `Workout ${i + 1}`) + icon;
    });
  }, [entries]);

  const activeMedia = (active as any)?.media as WorkoutMediaMeta;
  const hasMedia = Boolean(activeMedia?.path);
  const mediaKind =
    activeMedia?.kind === "video" ? "video" : activeMedia?.kind === "image" ? "image" : null;

  
  async function handleShare() {
    try {
      const t = String(active?.title ?? "").trim() || "Workout";
      const n = String(active?.notes ?? "").trim();
      const dateLabel = formatDisplayDate(date);

      let media: { kind: "image" | "video"; url: string } | null = null;
      const m = (active as any)?.media as WorkoutMediaMeta | null | undefined;

      if (m?.path && (m.kind === "image" || m.kind === "video")) {
        let url = mediaUrl;
        if (!url) {
          try {
            url = await getWorkoutMediaSignedUrl(m.path);
          } catch {
            url = null;
          }
        }
        if (url) media = { kind: m.kind, url };
      }

      const safe = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const filename = `gym-log-${date}-${safe || "workout"}.png`;

      const res = await shareWorkoutVerticalImage({
        filename,
        dateLabel,
        title: t,
        notes: n,
        media,
      });

      if (res.kind === "shared") toast("Shared");
      else if (res.kind === "downloaded") toast("Downloaded");
      else toast("Sharing not supported");
    } catch {
      toast("Could not share");
    }
  }


return (
    <div className="overlay">
      <div className="editor editor-full" onMouseDown={(e) => e.stopPropagation()}>
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

        <div
          className="editor-content"
          ref={editorContentRef}
          style={{ paddingBottom: keyboardPad ? keyboardPad + 12 : 0 }}
        >
          
          {/* Editor mode toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(0,0,0,0.15)",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveMode("notebook")}
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  border: "none",
                  background: activeMode === "notebook" ? "rgba(255,255,255,0.14)" : "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                Notebook
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canSwitchToStructured()) {
                    toast("To start Structured, clear your notebook notes first (one-way).");
                    return;
                  }
                  // Initialize draft from current title if needed
                  setStructuredByEntryId((prev) => ({
                    ...prev,
                    [activeId]: prev[activeId] ?? {
                      workoutName: String(active?.title ?? "").trim(),
                      rows: [],
                    },
                  }));
                  setExtraNotesByEntryId((prev) => ({
                    ...prev,
                    [activeId]: prev[activeId] ?? "",
                  }));
                  setActiveMode("structured");
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  border: "none",
                  background: activeMode === "structured" ? "rgba(255,255,255,0.14)" : "transparent",
                  color: "inherit",
                  cursor: canSwitchToStructured() ? "pointer" : "not-allowed",
                  opacity: canSwitchToStructured() ? 1 : 0.55,
                }}
                title={
                  canSwitchToStructured()
                    ? "Structured list editor"
                    : "Not available for existing notebook notes (one-way conversion only)"
                }
              >
                Structured
              </button>
            </div>

            {activeMode === "structured" && (
              <button
                type="button"
                onClick={handleConvertStructuredToNotebook}
                style={{
                  padding: "8px 10px",
                  fontSize: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "inherit",
                  cursor: "pointer",
                }}
                title="One-way: removes structured data and turns it into notebook text."
              >
                Convert to Notebook (one-way)
              </button>
            )}
          </div>

          {activeMode === "structured" ? (
<div
  style={{
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 10,
    background: "rgba(0,0,0,0.10)",
  }}
>
  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
    <button
      type="button"
      onClick={addExercisePrompt}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "inherit",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      + Add exercise
    </button>

    <button
      type="button"
      onClick={addNextSetFromLastRow}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "inherit",
        cursor: "pointer",
        fontWeight: 600,
      }}
      title="Adds another set for the last exercise"
    >
      + Add set
    </button>

    <button
      type="button"
      onClick={duplicateLastStructuredRow}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "inherit",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Repeat last
    </button>

    <div style={{ marginLeft: "auto", fontSize: 13, opacity: 0.9 }}>
      <span style={{ opacity: 0.8, marginRight: 6 }}>Total volume:</span>
      <span style={{ fontWeight: 700 }}>{Math.round(activeTotalVolume).toLocaleString()}</span>
    </div>
  </div>

  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
    {groupRowsByExercise(activeStructured.rows || []).map((g) => {
      const isCollapsed = Boolean(activeCollapsed[g.key]);
      const vol = exerciseGroupVolume(g.indices);
      const setCount = g.indices.length;

      return (
        <div
          key={g.key}
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            overflow: "hidden",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 10,
              background: "rgba(0,0,0,0.12)",
            }}
          >
            <button
              type="button"
              onClick={() => setCollapsed(g.key, !isCollapsed)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
                cursor: "pointer",
                flex: "0 0 auto",
              }}
              aria-label={isCollapsed ? "Expand" : "Collapse"}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? "▸" : "▾"}
            </button>

            <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  value={g.name}
                  onChange={(e) => renameExerciseInGroup(g.key, e.target.value)}
                  style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    padding: "8px 10px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.18)",
                    color: "inherit",
                    outline: "none",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                />

                <button
                  type="button"
                  onClick={() => addSetToExercise(g.key)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "inherit",
                    cursor: "pointer",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flex: "0 0 auto",
                  }}
                  title="Add a set for this exercise"
                >
                  + Set
                </button>
              </div>

              {(() => {
                const prev = prevStatsByExerciseKey[g.key];
                const curMax = computeMaxWeightForIndices(activeStructured.rows || [], g.indices).bestNum;
                const prevMax = prev?.maxWeightNum ?? null;
                const diff =
                  curMax != null && prevMax != null && Number.isFinite(curMax) && Number.isFinite(prevMax)
                    ? curMax - prevMax
                    : null;
                const unit = prev?.unit || "";
                const diffLabel =
                  diff == null || Math.abs(diff) < 0.0001
                    ? ""
                    : `${diff > 0 ? "↑" : "↓"} ${diff > 0 ? "+" : ""}${Math.round(diff)}${unit ? ` ${unit}` : ""}`;

                return (
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      fontSize: 12,
                      opacity: 0.78,
                    }}
                  >
                    <span style={{ whiteSpace: "nowrap" }}>
                      {setCount} set{setCount === 1 ? "" : "s"} • Vol {Math.round(vol).toLocaleString()}
                    </span>
                    {prev?.summary ? (
                      <span style={{ whiteSpace: "nowrap" }}>
                        <span style={{ opacity: 0.85 }}>Last:</span> {prev.summary}
                        {diffLabel ? <span style={{ marginLeft: 8, fontWeight: 700 }}>{diffLabel}</span> : null}
                      </span>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          </div>

          {!isCollapsed && (
            <div style={{ padding: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 40px 72px 1fr 32px",
                  gap: 4,
                  alignItems: "center",
                  fontSize: 12,
                  opacity: 0.8,
                  padding: "0 4px 8px 4px",
                }}
              >
                <div />
                <div>Set</div>
                <div>Reps</div>
                <div>Weight</div>
                <div />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {g.indices.map((rowIdx, pos) => {
                  const r = (activeStructured.rows || [])[rowIdx] as any;
                  const done = Boolean(r?.completed);
                  const rowVol = computeRowVolume(r as any);

                  return (
                    <div
                      key={rowIdx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "32px 40px 72px 1fr 32px",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleRowCompleted(rowIdx)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: done ? "rgba(255,87,33,0.16)" : "rgba(255,255,255,0.06)",
                          color: "inherit",
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                        aria-label={done ? "Mark incomplete" : "Mark complete"}
                        title={done ? "Completed" : "Not completed"}
                      >
                        {done ? "✓" : ""}
                      </button>

                      <div style={{ fontSize: 12, opacity: 0.8 }}>#{pos + 1}</div>

                      <input
                        value={r?.reps ?? ""}
                        onChange={(e) =>
                          updateActiveStructuredRow(rowIdx, { reps: sanitizeIntInput(e.target.value) } as any)
                        }
                        placeholder="8"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{
                          width: "100%",
                          padding: "10px 10px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(0,0,0,0.18)",
                          color: "inherit",
                          outline: "none",
                          fontSize: 14,
                          opacity: done ? 0.7 : 1,
                        }}
                      />

                      <div style={{ position: "relative", flex: "1 1 160px", minWidth: 0 }}>
                        <input
                          value={r?.weight ?? ""}
                          onChange={(e) =>
                            updateActiveStructuredRow(rowIdx, { weight: sanitizeDecimalInput(e.target.value) } as any)
                          }
                          placeholder="Weight"
                          inputMode="decimal"
                          pattern="[0-9.]*"
                          style={{
                            width: "100%",
                            height: 40,
                            borderRadius: 14,
                            padding: rowVol > 0 ? "0 62px 0 12px" : "0 12px",
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(0,0,0,0.18)",
                            color: "inherit",
                            outline: "none",
                            fontSize: 14,
                            opacity: done ? 0.7 : 1,
                          }}
                        />
                        {rowVol > 0 ? (
                          <div
                            style={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              fontSize: 10,
                              opacity: 0.75,
                              padding: "4px 6px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(255,255,255,0.06)",
                              whiteSpace: "nowrap",
                              pointerEvents: "none",
                            }}
                            title="Set volume"
                          >
                            Vol {formatCompactNumber(rowVol)}
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeActiveStructuredRow(rowIdx)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.06)",
                          color: "inherit",
                          cursor: "pointer",
                        }}
                        title="Remove set"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>

  <div style={{ marginTop: 12 }}>
    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Notes (optional)</div>
    <textarea
      value={activeExtraNotes}
      onChange={(e) => updateActiveExtraNotes(e.target.value)}
      placeholder="Extra notes for this workout…"
      rows={3}
      style={{
        width: "100%",
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.18)",
        color: "inherit",
        outline: "none",
        fontSize: 14,
        resize: "vertical",
      }}
    />
  </div>
</div>
) : (
            <textarea
              ref={notesRef}
              className="editor-notes"
              value={active?.notes ?? ""}
              onChange={(e) => updateActive({ notes: e.target.value })}
              placeholder="Workout notes"
            />
          )}


          {/* ✅ Media per workout (image OR video) — Pro only (trial counts) */}
          {proStatus.isPro ? (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setMediaOpen((v) => !v)}
                disabled={mediaBusy}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.10)",
                  color: "inherit",
                  cursor: mediaBusy ? "not-allowed" : "pointer",
                }}
                aria-expanded={mediaOpen}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 auto",
                    }}
                    aria-hidden
                  >
                    📷
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Highlight {mediaKind ? `(${mediaKind})` : ""}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.65 }}>
                      {hasMedia ? "1 attached" : sessionUserId ? "Add image or short video (max 30s)" : "Pro feature — sign in to upload"}
                    </div>
                  </div>
                  {mediaUrl ? (
                    mediaKind === "video" ? (
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(0,0,0,0.18)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.9)",
                          flex: "0 0 auto",
                        }}
                      >
                        ▶
                      </div>
                    ) : (
                      <img
                        src={mediaUrl}
                        alt="Highlight thumbnail"
                        style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", objectFit: "cover", display: "block", flex: "0 0 auto" }}
                      />
                    )
                  ) : null}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, flex: "0 0 auto" }}>{mediaOpen ? "▴" : "▾"}</div>
              </button>

              {mediaOpen ? (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Add / manage highlight media</div>
                    {hasMedia && sessionUserId ? (
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        disabled={mediaBusy}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.18)",
                          color: "var(--text)",
                          borderRadius: 10,
                          padding: "8px 10px",
                          fontWeight: 500,
                          cursor: mediaBusy ? "not-allowed" : "pointer",
                          fontSize: 13,
                          opacity: mediaBusy ? 0.6 : 1,
                          flex: "0 0 auto",
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickKind("image");
                        mediaInputRef.current?.click();
                      }}
                      disabled={!sessionUserId || mediaBusy || (hasMedia && mediaKind === "video")}
                      style={{
                        background: !sessionUserId
                          ? "rgba(255,255,255,0.08)"
                          : hasMedia && mediaKind === "video"
                            ? "rgba(255,255,255,0.08)"
                            : "var(--accent)",
                        border: !sessionUserId || (hasMedia && mediaKind === "video") ? "1px solid rgba(255,255,255,0.12)" : "none",
                        color: !sessionUserId || (hasMedia && mediaKind === "video") ? "rgba(255,255,255,0.75)" : "white",
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontWeight: 600,
                        cursor: !sessionUserId || mediaBusy || (hasMedia && mediaKind === "video") ? "not-allowed" : "pointer",
                        fontSize: 13,
                        opacity: !sessionUserId || mediaBusy || (hasMedia && mediaKind === "video") ? 0.55 : 1,
                        whiteSpace: "nowrap",
                        flex: "0 0 auto",
                      }}
                    >
                      {hasMedia && mediaKind === "image" ? "Replace image" : "Upload image"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPickKind("video");
                        mediaInputRef.current?.click();
                      }}
                      disabled={!sessionUserId || mediaBusy || (hasMedia && mediaKind === "image")}
                      style={{
                        background: !sessionUserId
                          ? "rgba(255,255,255,0.08)"
                          : hasMedia && mediaKind === "image"
                            ? "rgba(255,255,255,0.08)"
                            : "var(--accent)",
                        border: !sessionUserId || (hasMedia && mediaKind === "image") ? "1px solid rgba(255,255,255,0.12)" : "none",
                        color: !sessionUserId || (hasMedia && mediaKind === "image") ? "rgba(255,255,255,0.75)" : "white",
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontWeight: 600,
                        cursor: !sessionUserId || mediaBusy || (hasMedia && mediaKind === "image") ? "not-allowed" : "pointer",
                        fontSize: 13,
                        opacity: !sessionUserId || mediaBusy || (hasMedia && mediaKind === "image") ? 0.55 : 1,
                        whiteSpace: "nowrap",
                        flex: "0 0 auto",
                      }}
                    >
                      {hasMedia && mediaKind === "video" ? "Replace video" : "Upload video"}
                    </button>

                    <input
                      ref={mediaInputRef}
                      type="file"
                      accept={pickKind === "image" ? "image/*" : "video/mp4,video/quicktime"}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePickFile(f);
                      }}
                    />
                  </div>

                  {mediaUrl ? (
                    <div style={{ marginTop: 10 }}>
                      {mediaKind === "video" ? (
                        <video
                          src={mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          style={{ width: "100%", maxHeight: 240, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", display: "block", background: "rgba(0,0,0,0.18)" }}
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt="Workout media"
                          style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", display: "block", background: "rgba(0,0,0,0.18)" }}
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}



        </div>

        <div className="editor-actions">
          <button
            onClick={togglePb}
            className="secondary"
            aria-label={isPb ? "Unmark Personal Best" : "Mark Personal Best"}
            title={isPb ? "Unmark PB" : "Mark PB"}
            style={{
              flex: "0 0 auto",
              width: 54,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isPb ? "var(--accent)" : undefined,
              color: isPb ? "white" : undefined,
            }}
          >
            PB
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

          <button onClick={handleShare} className="secondary">
            Share
          </button>

          <button onClick={handleSave} className="primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
