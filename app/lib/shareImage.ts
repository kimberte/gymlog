// Client-only helper to capture a DOM node to PNG and share/download it.
// - Uses app background color (reads from CSS/body computed style)
// - Adds export-only brand header (Gym Log + logo) centered and large
// - Hides export-only UI via .exporting class (CSS rule)
// - No month/workout overlay (avoids duplicates)
// - No footer watermark (brand header replaces it)

type ShareResult =
  | { kind: "shared" }
  | { kind: "downloaded" }
  | { kind: "unsupported" };

function blobToFile(blob: Blob, filename: string) {
  return new File([blob], filename, { type: blob.type || "image/png" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Pull colors from the live app so export matches theme.
 * - background: prefer CSS vars (--app-bg / --bg), fallback to body backgroundColor, then white.
 * - brand orange: prefer CSS vars (--brand / --accent / --orange), fallback to #ff6a00.
 */
function readThemeColors(): { bg: string; accent: string } {
  const root = document.documentElement;
  const rootStyle = getComputedStyle(root);
  const bodyStyle = getComputedStyle(document.body);

  const pickVar = (...names: string[]) => {
    for (const n of names) {
      const v = rootStyle.getPropertyValue(n).trim();
      if (v) return v;
    }
    return "";
  };

  const bgVar = pickVar("--app-bg", "--bg", "--background", "--page-bg");
  const bg = bgVar || bodyStyle.backgroundColor || "#ffffff";

  const accentVar = pickVar("--brand", "--accent", "--orange", "--primary");
  const accent = accentVar || "#ff6a00";

  return { bg, accent };
}

async function renderFinalPngBlob(dataUrl: string) {
  const base = await loadImage(dataUrl);

  const baseW = base.naturalWidth || base.width;
  const baseH = base.naturalHeight || base.height;

  const { bg, accent } = readThemeColors();

  // Brand header sizing (scale with image width)
  const padY = Math.round(Math.max(16, baseW * 0.02));
  const headerFont = Math.round(Math.min(54, Math.max(28, baseW * 0.055))); // large
  const logoSize = Math.round(Math.min(64, Math.max(34, baseW * 0.06))); // large
  const gap = Math.round(Math.max(12, baseW * 0.02));
  const headerHeight = Math.round(padY + Math.max(headerFont, logoSize) + padY);

  // New canvas: header + captured image
  const canvas = document.createElement("canvas");
  canvas.width = baseW;
  canvas.height = headerHeight + baseH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background matches app
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Optional subtle divider under header
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight - 0.5);
  ctx.lineTo(canvas.width, headerHeight - 0.5);
  ctx.stroke();

  // Draw brand header centered: "Gym Log" + logo
  const logoSrc = "/icons/gym-app-logo-color-40x40.png";
  try {
    const logo = await loadImage(logoSrc);

    const text = "Gym Log";
    ctx.font = `900 ${headerFont}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    const textWidth = ctx.measureText(text).width;
    const totalW = textWidth + gap + logoSize;

    const xStart = (canvas.width - totalW) / 2;
    const yMid = headerHeight / 2;

    ctx.fillStyle = accent;

     ctx.drawImage(
      logo,
      xStart,
      yMid - logoSize / 2,
      logoSize,
      logoSize
    );

    ctx.fillText(text, xStart + logoSize + gap, yMid);


  } catch {
    // If logo fails to load, still show brand text centered
    const text = "Gym Log";
    ctx.font = `900 ${headerFont}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = accent;
    ctx.fillText(text, canvas.width / 2, headerHeight / 2);
  }

  // Draw captured image below header
  ctx.drawImage(base, 0, headerHeight);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG"))),
      "image/png"
    );
  });

  return blob;
}



async function loadVideoFrame(src: string, atSec: number = 0.1): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = src;

    const cleanup = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };

    video.addEventListener("error", () => {
      cleanup();
      reject(new Error("Failed to load video"));
    });

    video.addEventListener("loadedmetadata", () => {
      const target = Math.min(Math.max(atSec, 0), Math.max(0, (video.duration || 0) - 0.05));
      try {
        video.currentTime = target;
      } catch {
        // Some browsers block setting currentTime until canplay
      }
    });

    video.addEventListener("seeked", () => {
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;
      if (!w || !h) {
        cleanup();
        reject(new Error("Invalid video dimensions"));
        return;
      }
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      cleanup();
      resolve(c);
    });

    // Kick load
    video.load();
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  let line = "";
  let lines: string[] = [];

  for (const w of words) {
    const test = line ? line + " " + w : w;
    const m = ctx.measureText(test).width;
    if (m > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }

  return lines.length;
}

/**
 * Export a vertical "share card" (1080x1920):
 * - Top: highlight image/video frame (cover)
 * - Middle: date + title + notes
 * - Bottom: Gym Log watermark
 */
export async function shareWorkoutVerticalImage(options: {
  filename: string;
  dateLabel: string;
  title: string;
  notes?: string;
  media?: { kind: "image" | "video"; url: string } | null;
}): Promise<ShareResult> {
  const { filename, dateLabel, title, notes, media } = options;
  const { bg, accent } = readThemeColors();

  const W = 1080;
  const H = 1920;
  const topH = 1080; // ~top half

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Base background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // --- Top media area ---
  if (media?.url) {
    try {
      if (media.kind === "image") {
        const img = await loadImage(media.url);
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;

        // cover crop into W x topH
        const scale = Math.max(W / iw, topH / ih);
        const sw = W / scale;
        const sh = topH / scale;
        const sx = (iw - sw) / 2;
        const sy = (ih - sh) / 2;

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, topH);
      } else {
        const frame = await loadVideoFrame(media.url, 0.1);
        const iw = frame.width;
        const ih = frame.height;

        const scale = Math.max(W / iw, topH / ih);
        const sw = W / scale;
        const sh = topH / scale;
        const sx = (iw - sw) / 2;
        const sy = (ih - sh) / 2;

        ctx.drawImage(frame, sx, sy, sw, sh, 0, 0, W, topH);
      }
    } catch {
      // fallback: brand block if media fails
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, topH);
      ctx.fillStyle = accent;
      ctx.font = `900 120px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Gym Log", W / 2, topH / 2);
    }
  } else {
    // no media: show brand in top
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, topH);
    ctx.fillStyle = accent;
    ctx.font = `900 120px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Gym Log", W / 2, topH / 2);
  }

  // Divider line
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, topH + 1);
  ctx.lineTo(W, topH + 1);
  ctx.stroke();

  // --- Text area ---
  const padX = 84;
  let y = topH + 80;

  // Date
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `600 44px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText(dateLabel, padX, y);

  // Title
  y += 110;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `800 92px ui-serif, Georgia, 'Times New Roman', Times, serif`;
  const titleLines = wrapText(ctx, title || "-", padX, y, W - padX * 2, 104, 3);
  y += titleLines * 104 + 40;

  // Notes (single dash if empty)
  const noteText = String(notes || "").trim() || "–";
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.font = `500 52px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  wrapText(ctx, noteText, padX, y, W - padX * 2, 64, 6);

  // --- Footer watermark ---
  const footerY = H - 250;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `500 46px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText("Find My Workout On", padX, footerY);

  ctx.fillStyle = accent;
  ctx.font = `900 120px ui-serif, Georgia, 'Times New Roman', Times, serif`;
  ctx.fillText("Gym Log", padX, footerY + 140);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `600 44px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText("gymlogapp.com", padX, footerY + 200);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG"))), "image/png");
  });

  const file = blobToFile(blob, filename);
  const nav: any = navigator;

  try {
    if (typeof nav?.share === "function") {
      const canShareFiles =
        typeof nav?.canShare === "function" && nav.canShare({ files: [file] });
      if (canShareFiles) {
        await nav.share({
          files: [file],
          title: "Gym Log",
          text: "",
        });
        return { kind: "shared" };
      }
    }
  } catch {
    // fall through
  }

  downloadBlob(blob, filename);
  return { kind: "downloaded" };
}

export async function shareNodeAsPng(options: {
  node: HTMLElement;
  filename: string;
  title?: string;
  text?: string;
}): Promise<ShareResult> {
  const { node, filename, title, text } = options;

  const mod = await import("html-to-image");
  const { bg } = readThemeColors();

  // Hide certain UI only during export
  node.classList.add("exporting");

  let dataUrl: string;
  try {
    dataUrl = await mod.toPng(node, {
      cacheBust: true,
      backgroundColor: bg, // match app background
      pixelRatio: 2,
    });
  } finally {
    node.classList.remove("exporting");
  }

  const blob = await renderFinalPngBlob(dataUrl);

  const file = blobToFile(blob, filename);
  const nav: any = navigator;

  try {
    if (typeof nav?.share === "function") {
      const canShareFiles =
        typeof nav?.canShare === "function" && nav.canShare({ files: [file] });
      if (canShareFiles) {
        await nav.share({
          files: [file],
          title: title || "Gym Log",
          text: text || "",
        });
        return { kind: "shared" };
      }
    }
  } catch {
    // fall through to download
  }

  downloadBlob(blob, filename);
  return { kind: "downloaded" };
}
