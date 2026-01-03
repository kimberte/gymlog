export type WorkoutEntry = {
  title?: string;
  notes?: string;
};

export type WorkoutMap = Record<string, WorkoutEntry>;

export type Settings = {
  weekStart: "sunday" | "monday";
};

const SETTINGS_KEY = "gym_settings";
const WORKOUTS_KEY = "gym_workouts";

export function loadSettings(): Settings {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)!) || {
      weekStart: "sunday",
    };
  } catch {
    return { weekStart: "sunday" };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadWorkouts(): WorkoutMap {
  try {
    return JSON.parse(localStorage.getItem(WORKOUTS_KEY)!) || {};
  } catch {
    return {};
  }
}

export function saveWorkouts(w: WorkoutMap) {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(w));
}
