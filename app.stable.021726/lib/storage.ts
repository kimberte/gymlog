// app/lib/storage.ts

export type WorkoutMedia =
  | {
      kind: "image";
      path: string;
      updatedAt: number;
      sizeBytes?: number;
    }
  | {
      kind: "video";
      path: string;
      updatedAt: number;
      sizeBytes?: number;
      durationSec?: number;
      width?: number;
      height?: number;
    };

export type WorkoutEntry = {
  id: string;
  title: string;
  notes: string;

  createdAt?: string;
  updatedAt?: string;

  // ✅ NEW: per-workout media (image OR video)
  media?: WorkoutMedia | null;

  // legacy fields (ignored but preserved if present)
  mode?: "plain" | "structured";
  structured?: any;
};

export type WorkoutDay = {
  entries: WorkoutEntry[]; // up to 3

  /** Marks this date as a Personal Best (PB) day. */
  pb?: boolean;

  // Legacy: one image per date (kept for backward compatibility)
  image?: {
    path: string;
    updatedAt: number;
  };
};

export type WorkoutMap = Record<string, WorkoutDay>;

export type Settings = {
  weekStart: "sunday" | "monday";
};

const WORKOUTS_KEY = "gym-log-workouts";
const SETTINGS_KEY = "gym-log-settings";
const WEEK_START_KEY = "gym-log-week-start";

function uid() {
  return `w_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function structuredToText(structured: any): string {
  const rows = Array.isArray(structured?.rows) ? structured.rows : [];
  const lines: string[] = [];
  const hasAny = rows.some((r: any) => {
    const vals = [r?.name, r?.sets, r?.reps, r?.weight, r?.time, r?.notes].map(
      (x) => String(x ?? "").trim()
    );
    return vals.some(Boolean);
  });
  if (!hasAny) return "";

  lines.push("");
  lines.push("--- Structured ---");
  for (const r of rows) {
    const name = String(r?.name ?? "").trim() || "(exercise)";
    const sets = String(r?.sets ?? "").trim() || "-";
    const reps = String(r?.reps ?? "").trim() || "-";
    const weight = String(r?.weight ?? "").trim() || "-";
    const time = String(r?.time ?? "").trim() || "-";
    const note = String(r?.notes ?? "").trim();
    let line = `${name} | ${sets} | ${reps} | ${weight} | ${time}`;
    if (note) line += ` | ${note}`;
    lines.push(line);
  }
  return lines.join("\n").trimEnd();
}

function normalizeMedia(raw: any): WorkoutMedia | null {
  if (!raw || typeof raw !== "object") return null;

  const kind = raw.kind === "video" ? "video" : raw.kind === "image" ? "image" : null;
  const path = String(raw.path ?? "").trim();
  if (!kind || !path) return null;

  const updatedAt = Number(raw.updatedAt ?? Date.now());

  if (kind === "image") {
    return {
      kind: "image",
      path,
      updatedAt,
      sizeBytes: raw.sizeBytes != null ? Number(raw.sizeBytes) : undefined,
    };
  }

  return {
    kind: "video",
    path,
    updatedAt,
    sizeBytes: raw.sizeBytes != null ? Number(raw.sizeBytes) : undefined,
    durationSec: raw.durationSec != null ? Number(raw.durationSec) : undefined,
    width: raw.width != null ? Number(raw.width) : undefined,
    height: raw.height != null ? Number(raw.height) : undefined,
  };
}

function normalizeEntry(raw: any, fallbackId?: string): WorkoutEntry {
  const id = String(raw?.id || fallbackId || uid());
  const title = String(raw?.title ?? "").toString();
  let notes = String(raw?.notes ?? "").toString();

  // If legacy structured rows exist, append readable text so users don't lose data.
  const structuredText = structuredToText(raw?.structured);
  if (structuredText) {
    const baseNotes = notes.trimEnd();
    notes = (baseNotes ? baseNotes + "\n" : "") + structuredText;
  }

  return {
    id,
    title,
    notes,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    media: normalizeMedia(raw?.media),
    mode: raw?.mode,
    structured: raw?.structured,
  };
}

function isWorkoutDay(v: any): v is WorkoutDay {
  return Boolean(v && typeof v === "object" && Array.isArray(v.entries));
}

function isLegacySingle(v: any) {
  return Boolean(
    v &&
      typeof v === "object" &&
      !Array.isArray(v.entries) &&
      ("title" in v || "notes" in v || "structured" in v)
  );
}

export function normalizeWorkoutsMap(input: any): WorkoutMap {
  const out: WorkoutMap = {};
  if (!input || typeof input !== "object") return out;

  for (const [date, v] of Object.entries(input)) {
    if (!date) continue;

    if (isWorkoutDay(v)) {
      const entries = (v.entries || [])
        .slice(0, 3)
        .map((e: any, i: number) => normalizeEntry(e, `w${i + 1}`));

      const pb = Boolean((v as any)?.pb);

      const image =
        v && typeof v === "object" && (v as any).image && typeof (v as any).image === "object"
          ? {
              path: String((v as any).image.path ?? ""),
              updatedAt: Number((v as any).image.updatedAt ?? Date.now()),
            }
          : undefined;

      out[date] = {
        entries,
        pb,
        image: image?.path ? image : undefined,
      };
      continue;
    }

    if (isLegacySingle(v)) {
      out[date] = { entries: [normalizeEntry(v, "w1")] };
      continue;
    }
  }

  return out;
}

export function loadWorkouts(): WorkoutMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WORKOUTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return normalizeWorkoutsMap(parsed);
  } catch {
    return {};
  }
}

export function saveWorkouts(workouts: WorkoutMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  } catch {}
}

/** Convenience getter for a day's entries (always returns an array). */
export function getDayEntries(workouts: WorkoutMap, date: string): WorkoutEntry[] {
  const day = workouts?.[date];
  if (!day) return [];
  if (Array.isArray((day as any).entries)) return (day as any).entries;
  if (typeof day === "object") return [normalizeEntry(day, "w1")];
  return [];
}

export function loadWeekStart(): Settings["weekStart"] {
  if (typeof window === "undefined") return "sunday";
  try {
    const raw = localStorage.getItem(WEEK_START_KEY);
    return raw === "monday" ? "monday" : "sunday";
  } catch {
    return "sunday";
  }
}

export function saveWeekStart(v: Settings["weekStart"]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WEEK_START_KEY, v);
  } catch {}
}

export function loadSettings(): Settings {
  const weekStart = loadWeekStart();

  if (typeof window === "undefined") return { weekStart };

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { weekStart };
    const parsed = JSON.parse(raw);

    const fromSettings =
      parsed && typeof parsed === "object" && parsed.weekStart ? String(parsed.weekStart) : null;

    const mergedWeekStart =
      fromSettings === "monday" || fromSettings === "sunday"
        ? (fromSettings as Settings["weekStart"])
        : weekStart;

    return { weekStart: mergedWeekStart };
  } catch {
    return { weekStart };
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (settings?.weekStart) saveWeekStart(settings.weekStart);
  } catch {}
}
