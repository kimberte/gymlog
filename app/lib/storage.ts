// app/lib/storage.ts

export type WorkoutEntry = {
  title?: string;
  notes?: string;
};

export type WorkoutMap = Record<string, WorkoutEntry>;

export type Settings = {
  weekStart: "sunday" | "monday";
};

const WORKOUTS_KEY = "gym-log-workouts";
const SETTINGS_KEY = "gym-log-settings";

export function loadWorkouts(): WorkoutMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WORKOUTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveWorkouts(workouts: WorkoutMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts ?? {}));
  } catch {}
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") {
    return { weekStart: "sunday" };
  }

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { weekStart: "sunday" };
    const parsed = JSON.parse(raw);

    const weekStart =
      parsed?.weekStart === "monday" || parsed?.weekStart === "sunday"
        ? parsed.weekStart
        : "sunday";

    return { weekStart };
  } catch {
    return { weekStart: "sunday" };
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
