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
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function u32(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function createZip(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);

    const localHeader = concatBytes([
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
    ]);
    localParts.push(localHeader, data);

    const centralHeader = concatBytes([
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const localDirectory = concatBytes(localParts);
  const end = concatBytes([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDirectory.length),
    u32(localDirectory.length),
    u16(0),
  ]);

  return concatBytes([localDirectory, centralDirectory, end]);
}

function downloadExcel(programName: string, workouts: ProgramWorkout[]) {
  const rows = workouts.flatMap((workout) =>
    workout.exercises.length
      ? workout.exercises.map((exercise) => [workout.day, workout.focus, exercise, workout.guidance])
      : [[workout.day, workout.focus, "", workout.guidance]],
  );

  const cell = (value: string, style?: string) =>
    `<c${style ? ` s="${style}"` : ""} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
  const sheetRows = [
    `<row r="1">${cell("Day", "1")}${cell("Focus", "1")}${cell("Exercise", "1")}${cell("Guidance", "1")}</row>`,
    ...rows.map((row, index) => `<row r="${index + 2}">${row.map((value) => cell(value)).join("")}</row>`),
  ].join("");

  const safeName = programName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "gym-log-program";
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="14"/><col min="2" max="2" width="24"/><col min="3" max="3" width="42"/><col min="4" max="4" width="60"/></cols><sheetData>${sheetRows}</sheetData></worksheet>`;
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Program" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0"/></cellXfs></styleSheet>`;
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;

  const zip = createZip([
    { name: "[Content_Types].xml", content: contentTypesXml },
    { name: "_rels/.rels", content: rootRelsXml },
    { name: "xl/workbook.xml", content: workbookXml },
    { name: "xl/_rels/workbook.xml.rels", content: relsXml },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml },
    { name: "xl/styles.xml", content: stylesXml },
  ]);

  const blob = new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
          <p>Create a free account or sign in to download the full program as an Excel spreadsheet.</p>
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
        <button type="button" className="program-download-button" onClick={() => downloadExcel(programName, workouts)}>Excel (.xlsx)</button>
      </div>
    </section>
  );
}
