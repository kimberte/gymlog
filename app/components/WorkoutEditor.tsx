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
  isPro: boolean;
};

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
  isPro,
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

  // Personal Best marker (per-day)
  const [isPb, setIsPb] = useState(initialPb);
  useEffect(() => {
    setIsPb(Boolean((workouts as any)?.[date]?.pb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, workouts]);

  // Pro gating
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

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

  // When active workout changes, refresh media signed URL
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMediaUrl(null);
      setMediaOpen(false);

      const media = (active as any)?.media as WorkoutMediaMeta;
      if (!sessionUserId || !media?.path) return;
      if (!isPro) return; // ✅ Pro-only to view media

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
  }, [sessionUserId, activeIdx, date, isPro]);

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

    // Persist up to 3
    const merged = nextEntries.slice(0, 3).map((e, i) => ({
      id: `w${i + 1}`,
      title: String(e.title ?? ""),
      notes: String(e.notes ?? ""),
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
    const cleaned = entries
      .slice(0, 3)
      .map((e, i) => ({
        id: `w${i + 1}`,
        title: String(e.title ?? ""),
        notes: String(e.notes ?? ""),
        media: (e as any)?.media ?? null,
      }))
      .filter((e) => hasContent(e) || (e as any)?.media?.path);

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
    if (!isPro) {
      toast("Upgrade to Pro to add media");
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
    if (!isPro) {
      toast("Upgrade to Pro to manage media");
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
          <textarea
            ref={notesRef}
            className="editor-notes"
            value={active?.notes ?? ""}
            onChange={(e) => updateActive({ notes: e.target.value })}
            placeholder="Workout notes"
          />

          {/* ✅ Media per workout (image OR video) */}
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.10)",
              maxHeight: 170,
              overflowY: "auto",
            }}
          >
            {/* ✅ Put text ABOVE buttons so nothing is squished */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>
                      Highlight {mediaKind ? `(${mediaKind})` : ""}
                    </div>

                    {mediaUrl && (
                      <button
                        type="button"
                        onClick={() => setMediaOpen((v) => !v)}
                        disabled={mediaBusy}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(255,255,255,0.78)",
                          padding: 0,
                          fontSize: 12,
                          cursor: mediaBusy ? "not-allowed" : "pointer",
                          textDecoration: "underline",
                          textUnderlineOffset: 3,
                          opacity: mediaBusy ? 0.6 : 0.85,
                        }}
                      >
                        {mediaOpen ? "Hide" : "Show"}
                      </button>
                    )}
                  
                    {mediaUrl && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {mediaKind === "video" ? (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.18)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              color: "rgba(255,255,255,0.9)",
                            }}
                            title="Video attached"
                            aria-label="Video attached"
                          >
                            ▶
                          </div>
                        ) : (
                          <img
                            src={mediaUrl}
                            alt="Highlight thumbnail"
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        )}
                      </div>
                    )}
</div>

                  {!sessionUserId && (
                    <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
                      Pro feature — sign in to upload
                    </div>
                  )}
                  {sessionUserId && (
                    <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
                      Add image or short video (max 30s)
                    </div>
                  )}
                </div>

                {hasMedia && sessionUserId && (
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
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setPickKind("image");
                    mediaInputRef.current?.click();
                  }}
                  disabled={!sessionUserId || !isPro || mediaBusy || (hasMedia && mediaKind === "video")}
                  style={{
                    background: !sessionUserId
                      ? "rgba(255,255,255,0.08)"
                      : hasMedia && mediaKind === "video"
                        ? "rgba(255,255,255,0.08)"
                        : "var(--accent)",
                    border: !sessionUserId || (hasMedia && mediaKind === "video")
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "none",
                    color: !sessionUserId || (hasMedia && mediaKind === "video")
                      ? "rgba(255,255,255,0.75)"
                      : "white",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontWeight: 600,
                    cursor:
                      !sessionUserId || mediaBusy || (hasMedia && mediaKind === "video")
                        ? "not-allowed"
                        : "pointer",
                    fontSize: 13,
                    opacity:
                      !sessionUserId || mediaBusy || (hasMedia && mediaKind === "video") ? 0.55 : 1,
                    whiteSpace: "nowrap",
                    flex: "0 0 auto",
                  }}
                  title={!sessionUserId ? "Sign in to upload" : !isPro ? "Upgrade to Pro to upload" : hasMedia && mediaKind === "video" ? "Remove the video to upload an image" : "Upload image"}
                >
                  {hasMedia && mediaKind === "image" ? "Replace image" : "Upload image"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPickKind("video");
                    mediaInputRef.current?.click();
                  }}
                  disabled={!sessionUserId || !isPro || mediaBusy || (hasMedia && mediaKind === "image")}
                  style={{
                    background: !sessionUserId
                      ? "rgba(255,255,255,0.08)"
                      : hasMedia && mediaKind === "image"
                        ? "rgba(255,255,255,0.08)"
                        : "var(--accent)",
                    border: !sessionUserId || (hasMedia && mediaKind === "image")
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "none",
                    color: !sessionUserId || (hasMedia && mediaKind === "image")
                      ? "rgba(255,255,255,0.75)"
                      : "white",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontWeight: 600,
                    cursor:
                      !sessionUserId || mediaBusy || (hasMedia && mediaKind === "image")
                        ? "not-allowed"
                        : "pointer",
                    fontSize: 13,
                    opacity:
                      !sessionUserId || mediaBusy || (hasMedia && mediaKind === "image") ? 0.55 : 1,
                    whiteSpace: "nowrap",
                    flex: "0 0 auto",
                  }}
                  title={!sessionUserId ? "Sign in to upload" : !isPro ? "Upgrade to Pro to upload" : hasMedia && mediaKind === "image" ? "Remove the image to upload a video" : "Upload video"}
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
            </div>

            {/* Expanded preview */}

            {mediaUrl && mediaOpen && (
              <div style={{ marginTop: 10 }}>
                {mediaKind === "video" ? (
                  <video
                    src={mediaUrl}
                    controls
                    playsInline
                    preload="metadata"
                    style={{
                      width: "100%",
                      maxHeight: 160,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.10)",
                      display: "block",
                      background: "rgba(0,0,0,0.18)",
                    }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Workout media"
                    style={{
                      width: "100%",
                      maxHeight: 160,
                      objectFit: "contain",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.10)",
                      display: "block",
                      background: "rgba(0,0,0,0.18)",
                    }}
                  />
                )}
              </div>
            )}
          </div>



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
