export type StructuredExerciseRow = {
  name: string;
  sets?: string;
  reps?: string;
  weight?: string;
  time?: string;
  note?: string;
};

export type StructuredWorkout = {
  workoutName: string;
  time?: string; // optional session time
  sessionNotes?: string; // optional session note
  rows: StructuredExerciseRow[];
};

const START = "✎ Structured workout";
const END = "✎ End structured";

/**
 * Hidden-but-readable data line for reliable parsing.
 * Example: [[structured:eyJ3b3Jrb3V0TmFtZSI6IlB1c2giLCJyb3dzIjpbXX0=]]
 */
const DATA_PREFIX = "[[structured:";
const DATA_SUFFIX = "]]";

function safeB64Encode(obj: any) {
  try {
    const jsonStr = JSON.stringify(obj);
    // btoa expects latin1; encode to base64 safely
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch {
    return null;
  }
}

function safeB64Decode(b64: string) {
  try {
    const jsonStr = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function compileStructuredBlock(data: StructuredWorkout): string {
  const cleanName = String(data.workoutName || "").trim();
  const cleanTime = String(data.time || "").trim();
  const cleanSessionNotes = String(data.sessionNotes || "").trim();

  const rows = Array.isArray(data.rows) ? data.rows : [];
  const cleanedRows = rows
    .map((r) => ({
      name: String(r?.name ?? "").trim(),
      sets: String(r?.sets ?? "").trim(),
      reps: String(r?.reps ?? "").trim(),
      weight: String(r?.weight ?? "").trim(),
      time: String(r?.time ?? "").trim(),
      note: String((r?.note ?? (r as any)?.notes) ?? "").trim(),
    }))
    .filter((r) => r.name || r.sets || r.reps || r.weight || r.time || r.note);

  const payload: StructuredWorkout = {
    workoutName: cleanName,
    time: cleanTime || undefined,
    sessionNotes: cleanSessionNotes || undefined,
    rows: cleanedRows,
  };

  const encoded = safeB64Encode(payload);

  // Less-visible but readable block
  const lines: string[] = [];
  lines.push(START);

  // Header line: name + session time
  const headerBits: string[] = [];
  if (cleanName) headerBits.push(cleanName);
  if (cleanTime) headerBits.push(cleanTime);
  if (headerBits.length) lines.push(`• ${headerBits.join(" — ")}`);

  // Exercises
  if (cleanedRows.length) {
    cleanedRows.forEach((r) => {
      const sets = r.sets ? r.sets : "";
      const reps = r.reps ? r.reps : "";
      const weight = r.weight ? r.weight : "";
      const time = r.time ? r.time : "";
      const note = r.note ? r.note : "";

      const setsReps = sets || reps ? `${sets || "?"}x${reps || "?"}` : "";
      const wt = weight ? ` @${weight}` : "";
      const t = time ? ` (${time})` : "";

      const mid = [setsReps].filter(Boolean).join(" ");
      const left = [r.name || "(exercise)", mid].filter(Boolean).join(" — ");
      const right = note ? ` — ${note}` : "";

      lines.push(`• ${left}${wt}${t}${right}`);
    });
  } else {
    lines.push("• (add exercises)");
  }

  if (cleanSessionNotes) lines.push(`• Note: ${cleanSessionNotes}`);

  if (encoded) lines.push(`${DATA_PREFIX}${encoded}${DATA_SUFFIX}`);
  lines.push(END);

  return lines.join("\n");
}

export function findStructuredBlock(
  notes: string
): { start: number; end: number; block: string } | null {
  const s = notes.indexOf(START);
  if (s === -1) return null;
  const e = notes.indexOf(END, s);
  if (e === -1) return null;
  const endIdx = e + END.length;
  const block = notes.slice(s, endIdx);
  return { start: s, end: endIdx, block };
}

export function upsertStructuredBlock(notes: string, compiledBlock: string): string {
  const safeNotes = String(notes || "");
  const found = findStructuredBlock(safeNotes);

  if (!found) {
    const trimmed = safeNotes.trimEnd();
    if (!trimmed) return compiledBlock;
    return `${trimmed}\n\n${compiledBlock}`;
  }

  return safeNotes.slice(0, found.start) + compiledBlock + safeNotes.slice(found.end);
}

export function removeStructuredBlock(notes: string): string {
  const safeNotes = String(notes || "");
  const found = findStructuredBlock(safeNotes);
  if (!found) return safeNotes;
  const before = safeNotes.slice(0, found.start).trimEnd();
  const after = safeNotes.slice(found.end).trimStart();
  if (!before) return after;
  if (!after) return before;
  return `${before}\n\n${after}`;
}

export function parseStructuredFromNotes(notes: string): StructuredWorkout | null {
  const safeNotes = String(notes || "");
  const found = findStructuredBlock(safeNotes);
  if (!found) return null;

  const lines = found.block.split("\n").map((l) => l.trim());

  // 1) Prefer hidden data line
  const dataLine = lines.find(
    (l) => l.startsWith(DATA_PREFIX) && l.endsWith(DATA_SUFFIX)
  );
  if (dataLine) {
    const b64 = dataLine.slice(
      DATA_PREFIX.length,
      dataLine.length - DATA_SUFFIX.length
    );
    const decoded = safeB64Decode(b64);
    if (decoded && typeof decoded === "object") {
      const rows = Array.isArray(decoded.rows) ? decoded.rows : [];
      return {
        workoutName: String(decoded.workoutName || ""),
        time: decoded.time ? String(decoded.time) : undefined,
        sessionNotes: decoded.sessionNotes ? String(decoded.sessionNotes) : undefined,
        rows: rows.map((r: any) => ({
          name: String(r?.name ?? ""),
          sets: r?.sets != null ? String(r.sets) : undefined,
          reps: r?.reps != null ? String(r.reps) : undefined,
          weight: r?.weight != null ? String(r.weight) : undefined,
          time: r?.time != null ? String(r.time) : undefined,
          note: (r?.note ?? r?.notes) != null ? String(r?.note ?? r?.notes) : undefined,
        })),
      };
    }
  }

  // 2) Fallback parse (best-effort)
  let workoutName = "";
  let time = "";
  let sessionNotes = "";
  const rows: StructuredExerciseRow[] = [];

  for (const line of lines) {
    if (!line || line === START || line === END) continue;

    if (line.startsWith("• Note:")) {
      sessionNotes = line.replace(/^•\s*Note:\s*/i, "").trim();
      continue;
    }

    // Header: "• Push Day — 60m"
    if (line.startsWith("•") && !line.includes("x") && !line.includes("@") && !line.includes("(") && !line.includes("—")) {
      // ignore (rare)
    }

    if (line.startsWith("•") && rows.length === 0 && !line.includes("x") && line.includes("—")) {
      const hdr = line.replace(/^•\s*/, "").trim();
      const parts = hdr.split("—").map((p) => p.trim()).filter(Boolean);
      workoutName = parts[0] || workoutName;
      if (parts[1]) time = parts[1] || time;
      continue;
    }

    if (!line.startsWith("•")) continue;
    const rest = line.replace(/^•\s*/, "").trim();
    if (!rest || rest === "(add exercises)") continue;

    // Pattern: "Bench Press — 3x8 @135lb (10m) — quick note"
    const parts = rest.split(" — ").map((p) => p.trim()).filter(Boolean);
    const left = parts[0] || "";
    const midMaybe = parts[1] || "";
    const rightNote = parts.length > 2 ? parts.slice(2).join(" — ") : "";

    let name = left;
    let sets = "";
    let reps = "";
    let weightVal = "";
    let timeVal = "";

    // If left contains "@weight" or "(time)" at end, peel them
    let namePart = left;

    const timeMatch = namePart.match(/\(([^)]+)\)\s*$/);
    if (timeMatch) {
      timeVal = timeMatch[1].trim();
      namePart = namePart.replace(/\(([^)]+)\)\s*$/, "").trim();
    }

    const wtMatch = namePart.match(/@([^\s]+)\s*$/);
    if (wtMatch) {
      weightVal = wtMatch[1].trim();
      namePart = namePart.replace(/@([^\s]+)\s*$/, "").trim();
    }

    name = namePart;

    // midMaybe like "3x8"
    if (midMaybe && /x/i.test(midMaybe)) {
      const sr = midMaybe.split(/x/i).map((p) => p.trim());
      sets = sr[0] || "";
      reps = sr[1] || "";
    } else if (midMaybe && /\d/.test(midMaybe) && midMaybe.includes("x")) {
      // already handled
    }

    rows.push({
      name,
      sets: sets || undefined,
      reps: reps || undefined,
      weight: weightVal || undefined,
      time: timeVal || undefined,
      note: rightNote || undefined,
    });
  }

  return {
    workoutName,
    time: time || undefined,
    sessionNotes: sessionNotes || undefined,
    rows,
  };
}
