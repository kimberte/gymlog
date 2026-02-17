export function calculateStreaks(workouts: Record<string, any>) {
  // Work strictly from YYYY-MM-DD keys (UTC day keys)
  const keys = Object.keys(workouts ?? {}).sort();

  const days = keys.filter((key) => {
    const w = workouts[key];
    return Boolean(
      (w?.title && String(w.title).trim()) ||
        (w?.notes && String(w.notes).trim())
    );
  });

  // All-time total (what you want to show in Settings)
  const totalDays = days.length;

  // Best streak (UTC-safe day math)
  let bestStreak = 0;
  let run = 0;

  for (let i = 0; i < days.length; i++) {
    const cur = days[i];

    if (i === 0) {
      run = 1;
      continue;
    }

    const prev = days[i - 1];

    const prevTime = new Date(prev + "T00:00:00Z").getTime();
    const curTime = new Date(cur + "T00:00:00Z").getTime();
    const diff = (curTime - prevTime) / 86400000;

    if (diff === 1) {
      run += 1;
    } else {
      bestStreak = Math.max(bestStreak, run);
      run = 1;
    }
  }

  bestStreak = Math.max(bestStreak, run);

  // Last workout is the last YYYY-MM-DD key (no timezone shift)
  const lastWorkout = days.length ? days[days.length - 1] : null;

  // Keep currentStreak in return for backwards compat (even if UI hides it)
  // (computed UTC-safe)
  let currentStreak = 0;
  if (days.length) {
    const today = new Date().toISOString().slice(0, 10);
    const last = days[days.length - 1];

    const todayTime = new Date(today + "T00:00:00Z").getTime();
    const lastTime = new Date(last + "T00:00:00Z").getTime();
    const gap = (todayTime - lastTime) / 86400000;

    if (gap === 0) currentStreak = run; // today continues run
    else if (gap === 1) currentStreak = run; // yesterday still counts as “current”
    else currentStreak = 0;
  }

  return {
    currentStreak,
    bestStreak,
    totalDays,
    lastWorkout,
  };
}

export function formatDisplayDate(date: string | null) {
  if (!date) return "—";
  // Use noon UTC to avoid timezone day-shifts
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

