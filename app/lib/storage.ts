export interface WorkoutEntry {
  date: string;
  title: string;
  notes: string;
}

const STORAGE_KEY = "gym-log";

function readStore(): Record<string, WorkoutEntry> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function writeStore(data: Record<string, WorkoutEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadWorkout(date: string): WorkoutEntry | null {
  const store = readStore();
  return store[date] ?? null;
}

export function saveWorkout(entry: WorkoutEntry) {
  const store = readStore();
  store[entry.date] = entry;
  writeStore(store);
}

export function getWorkoutMap(): Record<string, string> {
  const store = readStore();
  const map: Record<string, string> = {};

  Object.values(store).forEach((entry) => {
    if (entry.title) {
      map[entry.date] = entry.title;
    }
  });

  return map;
}
