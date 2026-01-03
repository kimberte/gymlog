import { saveWorkouts } from "./storage";

function clean(v: string) {
  return v?.replace(/^"|"$/g, "").trim();
}

export function exportCSV(workouts: any) {
  const rows = ["date,title,notes"];
  Object.entries(workouts).forEach(([date, w]: any) => {
    rows.push(`${date},"${w.title || ""}","${w.notes || ""}"`);
  });
  download(rows.join("\n"), "workouts.csv");
}

export function exportTemplateCSV() {
  download(
    "date,title,notes\n2025-01-01,Leg Day,Squats & lunges",
    "template.csv"
  );
}

export async function importCSV(file: File) {
  const text = await file.text();
  const lines = text.split("\n").slice(1);

  const data: any = {};
  lines.forEach((l) => {
    const [date, title, notes] = l.split(",");
    if (date) {
      data[clean(date)] = {
        title: clean(title),
        notes: clean(notes),
      };
    }
  });

  saveWorkouts(data);
  location.reload();
}

function download(content: string, name: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}
