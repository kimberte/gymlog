import {extractPersonalData,streaksFromDays} from "./personalProgress";
export function calculateStreaks(workouts:Record<string,any>){return streaksFromDays(extractPersonalData(workouts).sessions.filter(s=>s.completed).map(s=>s.date));}
export function formatDisplayDate(date: string | null) {
  if (!date) return "—";
  // Use noon UTC to avoid timezone day-shifts
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

