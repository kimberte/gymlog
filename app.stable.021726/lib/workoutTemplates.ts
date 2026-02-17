const KEY = "gym-log-workout-templates";

const DEFAULTS = [
  "Push Day",
  "Pull Day",
  "Leg Day",
  "Upper",
  "Lower",
  "Full Body",
  "Chest + Triceps",
  "Back + Biceps",
  "Shoulders + Arms",
  "Quads",
  "Hamstrings + Glutes",
  "Core",
  "Bench Day",
  "Squat Day",
  "Deadlift Day",
  "Overhead Press Day",
  "Arms (Biceps/Triceps)",
  "Back",
  "Chest",
  "Legs",
  "Shoulders",
  "Glutes",
  "Strength (Heavy)",
  "Hypertrophy",
  "Powerbuilding",
  "Powerlifting",
  "Bodyweight",
  "Olympic Lifting",
  "Kettlebell",
  "Dumbbell Only",
  "Machine Only",
  "Zone 2 Cardio",
  "HIIT",
  "Intervals",
  "Tempo Run",
  "Easy Run",
  "Long Run",
  "Treadmill",
  "Bike",
  "Spin",
  "Rowing",
  "StairMaster",
  "Swimming",
  "Jump Rope",
  "Sled/Carry",
  "Conditioning",
  "Metcon / Circuit",
  "CrossFit WOD",
  "Mobility",
  "Stretching",
  "Yoga",
  "Pilates",
  "Warm-up / Activation",
  "Cooldown",
  "Rehab / Physio",
  "Prehab",
  "Recovery (Light)",
  "Sports Practice",
  "Basketball",
  "Soccer",
  "Hockey",
  "Tennis",
  "Golf Fitness"
];

function normalize(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function getWorkoutTemplates(): string[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULTS;
    const out = parsed
      .map((s) => normalize(String(s || "")))
      .filter(Boolean);

    // ensure defaults exist
    const lower = new Set(out.map((x) => x.toLowerCase()));
    for (const d of DEFAULTS) {
      if (!lower.has(d.toLowerCase())) out.unshift(d);
    }

    // de-dupe
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const v of out) {
      const k = v.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(v);
    }
    return deduped;
  } catch {
    return DEFAULTS;
  }
}

export function saveWorkoutTemplates(list: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function addWorkoutTemplate(name: string): { added: boolean; templates: string[] } {
  const n = normalize(name);
  if (!n) return { added: false, templates: getWorkoutTemplates() };

  const templates = getWorkoutTemplates();
  const exists = templates.some((t) => t.toLowerCase() === n.toLowerCase());
  if (exists) return { added: false, templates };

  const next = [n, ...templates];
  saveWorkoutTemplates(next);
  return { added: true, templates: next };
}
