import { NextResponse } from "next/server";
import { getSeoTemplateBySlug } from "../../../../lib/seoWorkoutTemplates";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ slug: string; format: string }>;
};

function cleanFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "workout";
}

function stripExercise(exercise: string) {
  const parts = exercise.split("—");
  return {
    exercise: parts[0]?.trim() || exercise.trim(),
    prescription: parts.slice(1).join("—").trim(),
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, maxLength = 86) {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function createExcelXml(template: NonNullable<ReturnType<typeof getSeoTemplateBySlug>>) {
  const rows: string[][] = [
    ["Workout", template.name],
    ["Goal", template.goal],
    ["Level", template.level],
    ["Frequency", template.frequency],
    ["Equipment", template.equipment],
    [],
    ["Day", "Focus", "Exercise", "Sets / Reps"],
  ];

  for (const day of template.days) {
    for (const exerciseText of day.exercises) {
      const parsed = stripExercise(exerciseText);
      rows.push([day.name, day.focus, parsed.exercise, parsed.prescription]);
    }
  }

  rows.push([]);
  rows.push(["Coaching Notes"]);
  for (const tip of template.tips) rows.push([tip]);

  const rowXml = rows
    .map((row) => {
      const cells = row
        .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("\n");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="Workout">
    <Table>
      ${rowXml}
    </Table>
  </Worksheet>
</Workbook>`;
}

function createPdf(template: NonNullable<ReturnType<typeof getSeoTemplateBySlug>>) {
  const lines: Array<{ text: string; size?: number; gap?: number }> = [
    { text: template.name, size: 22, gap: 18 },
    { text: template.metaDescription, size: 10, gap: 16 },
    { text: `Level: ${template.level}`, size: 11 },
    { text: `Goal: ${template.goal}`, size: 11 },
    { text: `Frequency: ${template.frequency}`, size: 11 },
    { text: `Equipment: ${template.equipment}`, size: 11, gap: 14 },
    { text: "Weekly Schedule", size: 16, gap: 14 },
  ];

  for (const day of template.days) {
    lines.push({ text: day.name, size: 14, gap: 10 });
    lines.push({ text: day.focus, size: 10 });
    for (const exercise of day.exercises) lines.push({ text: `- ${exercise}`, size: 10 });
    lines.push({ text: "", size: 10, gap: 10 });
  }

  lines.push({ text: "Coaching Notes", size: 16, gap: 14 });
  for (const tip of template.tips) lines.push({ text: `- ${tip}`, size: 10 });
  lines.push({ text: "", gap: 12 });
  lines.push({ text: "Track this workout free at GymLogApp.com", size: 11 });

  const pages: string[][] = [];
  let current: string[] = [];
  let y = 760;

  function flushPage() {
    pages.push(current);
    current = [];
    y = 760;
  }

  for (const item of lines) {
    const size = item.size || 10;
    const wrapped = item.text ? wrapText(item.text, size >= 16 ? 54 : 88) : [""];

    for (const text of wrapped) {
      if (y < 70) flushPage();
      current.push(`BT /F1 ${size} Tf 50 ${y} Td (${escapePdfText(text)}) Tj ET`);
      y -= size + 5;
    }
    y -= item.gap || 3;
  }

  if (current.length) pages.push(current);

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`);

  pages.forEach((pageLines, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;
    const content = pageLines.join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObj} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index++) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug, format } = await params;
  const template = getSeoTemplateBySlug(slug);

  if (!template) {
    return NextResponse.json({ error: "Workout template not found" }, { status: 404 });
  }

  const filename = cleanFilename(template.name);

  if (format === "excel") {
    const body = createExcelXml(template);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.xls"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "pdf") {
    const body = createPdf(template);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({ error: "Unsupported download format" }, { status: 400 });
}
