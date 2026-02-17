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


async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  // dataUrl is small enough; fetch works in browsers
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * Capture a DOM node to PNG and share/download it WITHOUT adding the extra brand header.
 * Use this for workout-share cards where the layout already includes logo/text.
 */
export async function shareNodeAsPngPlain(options: {
  node: HTMLElement;
  filename: string;
  title?: string;
  text?: string;
}): Promise<ShareResult> {
  const { node, filename, title, text } = options;

  const mod = await import("html-to-image");
  const { bg } = readThemeColors();

  node.classList.add("exporting");

  let dataUrl: string;
  try {
    dataUrl = await mod.toPng(node, {
      cacheBust: true,
      backgroundColor: bg,
      pixelRatio: 2,
    });
  } finally {
    node.classList.remove("exporting");
  }

  const blob = await dataUrlToBlob(dataUrl);

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
    // fall through
  }

  downloadBlob(blob, filename);
  return { kind: "downloaded" };
}
