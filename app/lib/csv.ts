export function exportCSV(workouts: Record<string, any>) {
  const rows = ["date,title,notes"];

  Object.entries(workouts).forEach(([date, w]: any) => {
    rows.push(
      `${date},"${(w.title || "").replace(/"/g, "")}","${(w.notes || "").replace(
        /"/g,
        ""
      )}"`
    );
  });

  download(rows.join("\n"), "gym-log.csv");
}

/* ---------- NEW: TEMPLATE DOWNLOAD ---------- */

export function downloadTemplateCSV() {
  const rows = [
    "date,title,notes",
    "2026-01-01,Leg Day,Squats, lunges, calf raises"
  ];

  download(rows.join("\n"), "gym-log-template.csv");
}

/* ---------- IMPORT (UNCHANGED) ---------- */

export async function importCSV(
  existing: Record<string, any>,
  file: File
): Promise<Record<string, any>> {
  const text = await file.text();
  const lines = text.split("\n").slice(1);

  const updates: Record<string, any> = {};

  lines.forEach((line) => {
    if (!line.trim()) return;

    const [date, title, notes] = parseCSVLine(line);
    if (!date) return;

    updates[date] = {
      title: title || "",
      notes: notes || "",
    };
  });

  return {
    ...existing,
    ...updates, // overwrite only dates present in CSV
  };
}

/* ---------- HELPERS ---------- */

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((v) => v.replace(/^"|"$/g, ""));
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
