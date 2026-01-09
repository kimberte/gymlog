export function toDateKey(d: Date) {
  // Use local date parts to avoid timezone off-by-one issues that happen with toISOString().
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
