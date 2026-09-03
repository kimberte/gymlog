"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type ProgramExercise = string;
type ProgramWorkout = { day: string; focus: string; exercises: ProgramExercise[]; guidance: string };

type Props = {
  programName: string;
  slug: string;
  workouts: ProgramWorkout[];
};

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function downloadExcel(programName: string, workouts: ProgramWorkout[]) {
  const rows = workouts.map((w) => ({
    day: w.day,
    focus: w.focus,
    exercises: w.exercises.join(" | "),
    guidance: w.guidance,
  }));

  const worksheetRows = rows
    .map(
      (r) => `<Row><Cell><Data ss:Type="String">${escapeXml(r.day)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(r.focus)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(r.exercises)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(r.guidance)}</Data></Cell></Row>`
    )
    .join("");

  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${escapeXml(programName).slice(0, 31)}"><Table><Row><Cell><Data ss:Type="String">Day</Data></Cell><Cell><Data ss:Type="String">Focus</Data></Cell><Cell><Data ss:Type="String">Exercises</Data></Cell><Cell><Data ss:Type="String">Guidance</Data></Cell></Row>${worksheetRows}</Table></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${programName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "gym-log-program"}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function savePdf(programName: string, workouts: ProgramWorkout[]) {
  const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
  const days = workouts
    .map((w) => `<section><h2>${escapeHtml(w.day)} — ${escapeHtml(w.focus)}</h2><ol>${w.exercises.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ol><p>${escapeHtml(w.guidance)}</p></section>`)
    .join("");

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=900");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(programName)} | Gym Log</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:0 auto;padding:40px;color:#111}h1{font-size:30px;margin:0 0 8px}h2{font-size:18px;margin:0 0 12px}p{line-height:1.5;color:#444}section{border:1px solid #ddd;border-radius:10px;padding:16px;margin:14px 0;break-inside:avoid}li{margin:7px 0}@media print{body{padding:0}section{break-inside:avoid}}</style></head><body><h1>${escapeHtml(programName)}</h1><p>Workout program — exported from Gym Log</p>${days}<script>window.onload=function(){window.print();}</script></body></html>`);
  printWindow.document.close();
}

export default function ProgramDownloads({ programName, slug, workouts }: Props) {
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) setSignedIn(Boolean(data.session?.user));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSignedIn(Boolean(session?.user));
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  if (!signedIn) {
    return (
      <section className="program-downloads program-downloads-locked">
        <div>
          <h2>Download this program</h2>
          <p>Create a free account or sign in to download the full program as Excel or save it as a PDF.</p>
        </div>
        <Link className="program-download-button" href={`/?auth=signin&returnTo=${encodeURIComponent(`/workout-programs/${slug}`)}`}>Sign in to download →</Link>
      </section>
    );
  }

  return (
    <section className="program-downloads">
      <div>
        <h2>Download this program</h2>
        <p>Free for logged-in Gym Log members. Your workout log backups and exports remain Pro features.</p>
      </div>
      <div className="program-download-actions">
        <button type="button" className="program-download-button" onClick={() => downloadExcel(programName, workouts)}>Excel (.xls)</button>
        <button type="button" className="program-download-button program-download-secondary" onClick={() => savePdf(programName, workouts)}>PDF</button>
      </div>
    </section>
  );
}
