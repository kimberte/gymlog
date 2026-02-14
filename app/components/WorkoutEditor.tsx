"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { EXERCISES } from "../lib/exercises";
import { WorkoutEntry, WorkoutMap, getDayEntries } from "../lib/storage";
import { getSessionUser } from "../lib/backup";
import { compressImageToWebp } from "../lib/imageCompress";
import {
  getWorkoutImageSignedUrl,
  removeWorkoutImage,
  uploadWorkoutImage,
} from "../lib/workoutImages";

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

export default function WorkoutEditor({
  date,
  workouts,
  setWorkouts,
  onSaved,
  onClose,
  toast,
}: Props) {
  const initialEntries = useMemo<WorkoutEntry[]>(() => {
    const entries = getDayEntries(workouts, date)
      .slice(0, 3)
      .map((e, i) => ({
        id: String(e?.id || `w${i + 1}`),
        title: String(e?.title ?? ""),
        notes: String(e?.notes ?? ""),
      }));
    return entries.length ? entries : [{ id: "w1", title: "", notes: "" }];
  }, [workouts, date]);

  const [entries, setEntries] = useState<WorkoutEntry[]>(initialEntries);
  const [activeIdx, setActiveIdx] = useState(0);

  // Pro image upload (1 image per date, Supabase Storage)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(
    (workouts as any)?.[date]?.image?.path
      ? String((workouts as any)[date].image.path)
      : null
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Option 1: Collapsible photo (notes-first)
  const [photoOpen, setPhotoOpen] = useState(false);

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

  const setsRef = useRef<HTMLInputElement | null>(null);
  const repsRef = useRef<HTMLInputElement | null>(null);
  const weightRef = useRef<HTMLInputElement | null>(null);
  const timeRef = useRef<HTMLInputElement | null>(null);
  const quickRef = useRef<HTMLInputElement | null>(null);

  const editorContentRef = useRef<HTMLDivElement | null>(null);

  // Keyboard-safe bottom padding (mobile)
  const [keyboardPad, setKeyboardPad] = useState(0);

  useEffect(() => {
    // Lock background scroll while editor is open (prevents the calendar behind from moving)
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

  // Sync image meta from stored workouts for this date
  useEffect(() => {
    const p = (workouts as any)?.[date]?.image?.path
      ? String((workouts as any)[date].image.path)
      : null;
    setImagePath(p);
    setImageUrl(null);
    setPhotoOpen(false);
  }, [workouts, date]);

  // Fetch signed URL for preview
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionUserId || !imagePath) return;
      try {
        const url = await getWorkoutImageSignedUrl(imagePath, 3600);
        if (cancelled) return;
        setImageUrl(url);
        setPhotoOpen(false);
      } catch {
        // If missing/unauthorized, just hide preview
        if (cancelled) return;
        setImageUrl(null);
        setPhotoOpen(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionUserId, imagePath]);

  function focusNext(ref: RefObject<HTMLInputElement | null>) {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true } as any);
    requestAnimationFrame(() => {
      try {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {}
    });
  }

  function handleHelperKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    next?: RefObject<HTMLInputElement | null>,
    submit?: boolean
  ) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (submit) {
      addExerciseToNotes();
      return;
    }
    if (next) focusNext(next);
  }

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
    setPhotoOpen(false);
  }, [initialEntries]);

  // Load auth + existing image meta
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const user = await getSessionUser();
        if (cancelled) return;
        setUserId(user?.id ?? null);

        const existingPath = (workouts as any)?.[date]?.image?.path
          ? String((workouts as any)[date].image.path)
          : null;
        setImagePath(existingPath);

        if (user?.id && existingPath) {
          try {
            const url = await getWorkoutImageSignedUrl(existingPath, 3600);
            if (!cancelled) {
              setImageUrl(url);
              setPhotoOpen(false);
            }
          } catch (err: any) {
            console.error("Load workout photo failed:", err);
            if (!cancelled) {
              setImageUrl(null);
              setPhotoOpen(false);
            }
          }
        } else {
          setImageUrl(null);
          setPhotoOpen(false);
        }
      } catch {
        if (!cancelled) {
          setUserId(null);
          setImagePath(null);
          setImageUrl(null);
          setPhotoOpen(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [date, workouts]);

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

    // Preserve any existing image metadata for this day
    const existingImage = (next as any)?.[date]?.image;

    if (cleaned.length === 0) {
      if (existingImage?.path) {
        (next as any)[date] = { entries: [], image: existingImage };
      } else {
        delete (next as any)[date];
      }
    } else {
      (next as any)[date] = { entries: cleaned, image: existingImage };
    }

    setWorkouts(next as any);
    onSaved?.(next as any);

    toast("Saved");
    onClose();
  }

  async function handleSelectImage(file: File) {
    if (!sessionUserId) {
      toast("Sign in to upload a photo");
      return;
    }
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast("Image too large (max 10MB)");
      return;
    }

    setImageBusy(true);
    try {
      // Compress to WebP (try a couple quality levels to stay under the hard cap)
      const hardCap = 1.5 * 1024 * 1024;
      let blob = await compressImageToWebp(file, {
        maxLongEdge: 1800,
        quality: 0.78,
      });
      if (blob.size > hardCap) {
        blob = await compressImageToWebp(file, {
          maxLongEdge: 1800,
          quality: 0.7,
        });
      }
      if (blob.size > hardCap) {
        blob = await compressImageToWebp(file, {
          maxLongEdge: 1800,
          quality: 0.62,
        });
      }
      if (blob.size > hardCap) {
        toast("Image too large after compression");
        return;
      }

      const path = await uploadWorkoutImage({
        userId: sessionUserId,
        date,
        blob,
      });

      const url = await getWorkoutImageSignedUrl(path, 3600);
      setImagePath(path);
      setImageUrl(url);
      setPhotoOpen(false);

      // Persist meta locally so we can show the preview state without extra lookups
      const next = { ...(workouts as any) };
      const day =
        (next as any)[date] && typeof (next as any)[date] === "object"
          ? (next as any)[date]
          : { entries: [] };
      (next as any)[date] = {
        ...day,
        entries: Array.isArray(day.entries) ? day.entries : [],
        image: { path, updatedAt: Date.now() },
      };
      setWorkouts(next as any);
      onSaved?.(next as any);

      toast("Photo uploaded");
    } catch (err: any) {
      console.error("Photo upload failed:", err);
      const msg = err?.message || err?.error_description || err?.error || "";
      toast(msg ? `Photo upload failed: ${msg}` : "Photo upload failed");
    } finally {
      setImageBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveImage() {
    if (!sessionUserId || !imagePath) return;
    const ok = window.confirm("Remove this photo?");
    if (!ok) return;

    setImageBusy(true);
    try {
      await removeWorkoutImage(imagePath);
      setImageUrl(null);
      setImagePath(null);
      setPhotoOpen(false);

      const next = { ...(workouts as any) };
      if ((next as any)[date] && typeof (next as any)[date] === "object") {
        const day = { ...(next as any)[date] };
        delete (day as any).image;
        // If the day has no entries left, remove the day entirely
        const entriesArr = Array.isArray(day.entries) ? day.entries : [];
        if (!entriesArr.length) delete (next as any)[date];
        else (next as any)[date] = day;
      }
      setWorkouts(next as any);
      onSaved?.(next as any);

      toast("Photo removed");
    } catch (err: any) {
      console.error("Remove photo failed:", err);
      const msg = err?.message || err?.error_description || err?.error || "";
      toast(msg ? `Failed to remove photo: ${msg}` : "Failed to remove photo");
    } finally {
      setImageBusy(false);
    }
  }

  // ✅ Copy ALL workouts (up to 3) for this day: title + notes
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
      toast(
        `Copied ${payload.entries.length} workout${
          payload.entries.length === 1 ? "" : "s"
        }`
      );
    } catch {
      toast("Copy failed");
    }
  }

  // ✅ Paste ALL workouts if day-payload; otherwise fallback to old behaviors
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      // Day payload (preferred)
      const dayParsed = safeJsonParse<ClipboardDay>(text);
      if (dayParsed && dayParsed.kind === CLIPBOARD_DAY_KIND) {
        const incoming = (dayParsed.entries ?? [])
          .slice(0, 3)
          .map((e, i) => ({
            id: `w${i + 1}`,
            title: String(e?.title ?? ""),
            notes: String(e?.notes ?? ""),
          }))
          .filter(hasContent);

        if (incoming.length === 0) {
          toast("Nothing to paste");
          return;
        }

        setEntries(
          incoming.length ? incoming : [{ id: "w1", title: "", notes: "" }]
        );
        setActiveIdx(0);
        setShowHelper(false);

        toast(
          `Pasted ${incoming.length} workout${
            incoming.length === 1 ? "" : "s"
          }`
        );
        return;
      }

      // Single workout payload (older copy format)
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

        updateActive({
          title: nextTitle,
          notes: mergedNotes,
        });

        toast("Pasted");
        return;
      }

      // Plain text fallback (append to active notes)
      const merged = String(active?.notes ?? "").trimEnd();
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
      if (next) setTimeout(() => exRef.current?.focus(), 50);
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

    const base = String(active?.notes ?? "").trimEnd();
    const next = base ? base + "\n" + line : line;
    updateActive({ notes: next });

    resetHelperInputs();
    toast("Added");
    setTimeout(() => notesRef.current?.focus(), 50);
  }

  const tabLabels = useMemo(() => {
    return entries.map((e, i) => {
      const t = String(e.title ?? "").trim();
      return t ? t : `Workout ${i + 1}`;
    });
  }, [entries]);

  return (
    <div className="overlay" onMouseDown={onClose}>
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
                  border:
                    i === activeIdx
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
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
          <textarea
            ref={notesRef}
            className="editor-notes"
            value={active?.notes ?? ""}
            onChange={(e) => updateActive({ notes: e.target.value })}
            placeholder="Workout notes"
          />

          {/* Pro: 1 photo per date (stored in Supabase) - collapsible */}
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 2 }}>
                    Photo
                  </div>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoOpen((v) => !v)}
                      disabled={imageBusy}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.78)",
                        padding: 0,
                        fontSize: 12,
                        cursor: imageBusy ? "not-allowed" : "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                        opacity: imageBusy ? 0.6 : 0.85,
                      }}
                    >
                      {photoOpen ? "Hide" : "Show"}
                    </button>
                  )}
                </div>

                {!sessionUserId && (
                  <div style={{ fontSize: 12, opacity: 0.65 }}>
                    Pro feature — sign in to upload
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {imagePath && sessionUserId && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={imageBusy}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "var(--text)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      fontWeight: 500,
                      cursor: imageBusy ? "not-allowed" : "pointer",
                      fontSize: 13,
                      opacity: imageBusy ? 0.6 : 1,
                    }}
                  >
                    Remove
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!sessionUserId || imageBusy}
                  style={{
                    background: !sessionUserId
                      ? "rgba(255,255,255,0.08)"
                      : "var(--accent)",
                    border: !sessionUserId
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "none",
                    color: !sessionUserId
                      ? "rgba(255,255,255,0.75)"
                      : "white",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontWeight: 600,
                    cursor: !sessionUserId || imageBusy ? "not-allowed" : "pointer",
                    fontSize: 13,
                    opacity: !sessionUserId || imageBusy ? 0.55 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {imagePath ? "Replace" : "Upload"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectImage(f);
                  }}
                />
              </div>
            </div>

            {/* Collapsed thumbnail */}
            {imageUrl && !photoOpen && (
              <button
                type="button"
                onClick={() => setPhotoOpen(true)}
                disabled={imageBusy}
                aria-label="Show photo"
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: 0,
                  border: 0,
                  background: "transparent",
                  cursor: imageBusy ? "not-allowed" : "pointer",
                  position: "relative",
                  textAlign: "left",
                  opacity: imageBusy ? 0.6 : 1,
                }}
              >
                <img
                  src={imageUrl}
                  alt="Workout photo"
                  style={{
                    width: "100%",
                    height: 110,
                    objectFit: "cover",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 10,
                    bottom: 10,
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.45)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  Tap to view
                </div>
              </button>
            )}

            {/* Expanded preview (capped height so it doesn't dominate) */}
            {imageUrl && photoOpen && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={imageUrl}
                  alt="Workout photo"
                  style={{
                    width: "100%",
                    maxHeight: 240,
                    objectFit: "contain",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "block",
                    background: "rgba(0,0,0,0.18)",
                  }}
                />
              </div>
            )}
          </div>

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
                  enterKeyHint="next"
                  onKeyDown={(e) => handleHelperKeyDown(e, setsRef)}
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
                  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <input
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  placeholder="Sets"
                  ref={setsRef}
                  inputMode="numeric"
                  enterKeyHint="next"
                  onKeyDown={(e) => handleHelperKeyDown(e, repsRef)}
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
                  ref={repsRef}
                  inputMode="numeric"
                  enterKeyHint="next"
                  onKeyDown={(e) => handleHelperKeyDown(e, weightRef)}
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
                  ref={weightRef}
                  inputMode="decimal"
                  enterKeyHint="next"
                  onKeyDown={(e) => handleHelperKeyDown(e, timeRef)}
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
                  ref={timeRef}
                  enterKeyHint="next"
                  onKeyDown={(e) => handleHelperKeyDown(e, quickRef)}
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
                ref={quickRef}
                enterKeyHint="done"
                onKeyDown={(e) => handleHelperKeyDown(e, undefined, true)}
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
          <button
            onClick={toggleHelper}
            className="secondary"
            aria-label={showHelper ? "Hide exercise helper" : "Show exercise helper"}
            title={showHelper ? "Hide exercise helper" : "Show exercise helper"}
            style={{
              flex: "0 0 auto",
              width: 54,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
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
