import { WorkoutMap, WorkoutDay, WorkoutEntry, normalizeWorkoutsMap } from "./storage";

function hasContent(e: { title?: string; notes?: string }) {
  return Boolean(String(e?.title ?? "").trim() || String(e?.notes ?? "").trim());
}

function escapeCsvValue(v: string) {
  const s = (v ?? "").toString();
  // wrap in quotes and escape quotes
  return `"${s.replace(/"/g, '""')}"`;
}

export function exportCSV(workouts: WorkoutMap) {
  // New format supports multiple entries per day
  const rows: string[] = ["date,entry_index,title,notes"];

  Object.entries(workouts ?? {}).forEach(([date, day]) => {
    const entries = Array.isArray((day as any)?.entries) ? (day as any).entries : [];
    entries.slice(0, 3).forEach((e: any, i: number) => {
      const title = String(e?.title ?? "");
      const notes = String(e?.notes ?? "");
      if (!hasContent({ title, notes })) return;

      rows.push(
        `${date},${i + 1},${escapeCsvValue(title)},${escapeCsvValue(notes)}`
      );
    });
  });

  download(rows.join("\n"), "gym-log-workouts.csv");
}

export async function importCSV(existing: WorkoutMap, file: File): Promise<WorkoutMap> {
  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return existing;

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  const hasEntryIndex = header.includes("entry_index") || header.includes("entry") || header.includes("workout");
  const dateIdx = header.indexOf("date");
  const entryIdx = header.indexOf("entry_index");
  const titleIdx = header.indexOf("title");
  const notesIdx = header.indexOf("notes");

  // Backwards-compatible fallback: date,title,notes
  const legacy =
    dateIdx !== -1 &&
    titleIdx !== -1 &&
    notesIdx !== -1 &&
    !hasEntryIndex;

  const updates: Record<string, WorkoutDay> = {};

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);

    const date = parts[dateIdx] ? String(parts[dateIdx]).trim() : "";
    if (!date) continue;

    const title = titleIdx !== -1 ? String(parts[titleIdx] ?? "") : "";
    const notes = notesIdx !== -1 ? String(parts[notesIdx] ?? "") : "";

    let slot = 1;
    if (!legacy) {
      const rawSlot =
        entryIdx !== -1 ? parts[entryIdx] : (header.indexOf("entry") !== -1 ? parts[header.indexOf("entry")] : "");
      const parsed = parseInt(String(rawSlot ?? "1"), 10);
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 3) slot = parsed;
    }

    // Merge with existing day if present
    const currentDay = updates[date] ?? (existing?.[date] as any);
    const normalized = normalizeWorkoutsMap({ [date]: currentDay })[date] ?? { entries: [] };

    const nextEntries = [...(normalized.entries || [])].slice(0, 3);

    while (nextEntries.length < slot) {
      nextEntries.push({
        id: `w${nextEntries.length + 1}`,
        title: "",
        notes: "",
      } as WorkoutEntry);
    }

    nextEntries[slot - 1] = {
      ...(nextEntries[slot - 1] || { id: `w${slot}` }),
      id: (nextEntries[slot - 1] && (nextEntries[slot - 1] as any).id) ? (nextEntries[slot - 1] as any).id : `w${slot}`,
      title,
      notes,
    } as WorkoutEntry;

    updates[date] = { entries: nextEntries };
  }

  return {
    ...existing,
    ...updates,
  };
}

/* ---------- HELPERS ---------- */

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  result.push(current);
  return result;
}

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
