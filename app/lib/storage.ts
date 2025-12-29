export type WorkoutEntry = {
  title: string
  description: string
  updatedAt: number
}

export type WorkoutMap = {
  [date: string]: WorkoutEntry
}

const STORAGE_KEY = "gymNotebook.workouts"

export function loadWorkouts(): WorkoutMap {
  if (typeof window === "undefined") return {}
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

export function saveWorkouts(workouts: WorkoutMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
}
