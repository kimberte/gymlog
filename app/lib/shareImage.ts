// Client-only helper to capture a DOM node to PNG and share/download it.
// Adds an export-only header banner (month + month workout count) by reading DOM text,
// then adds the Gym Log watermark (logo + text) at bottom-right.

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
 * Reads the visible calendar month title + subtitle from the DOM.
 * This works even if those elements are OUTSIDE the capture node.
 *
 * If selectors ever change, we fail gracefully and simply omit the banner.
 */
function readCalendarHeaderFromDOM(): { title?: string; subtitle?: string } {
  // These selectors match your WorkoutCalendar header markup:
  // <div className="month-title"><h2>...</h2><div className="month-subtitle">...</div></div>
  const titleEl = document.querySelector(".month-title h2");
  const subtitleEl = document.querySelector(".month-title .month-subtitle");

  const title = titleEl?.textContent?.trim() || undefined;
  const subtitle = subtitleEl?.textContent?.trim() || undefined;

  return { title, subtitle };
}

async function renderFinalPngBlob(dataUrl: string) {
  const base = await loadImage(dataUrl);

  const baseW = base.naturalWidth || base.width;
  const baseH = base.naturalHeight || base.height;

  // Read header text from DOM (not from capture).
  const { title, subtitle } = readCalendarHeaderFromDOM();
  const hasBanner = Boolean(title || subtitle);

  // Banner sizing (scale with image width a bit)
  const padX = Math.round(Math.max(18, baseW * 0.02));
  const padY = Math.round(Math.max(14, baseW * 0.012));
  const titleSize = Math.round(Math.min(28, Math.max(18, baseW * 0.03)));
  const subtitleSize = Math.round(Math.min(20, Math.max(14, baseW * 0.02)));
  const gap = Math.round(Math.max(6, baseW * 0.008));

  const bannerHeight = hasBanner
    ? Math.round(padY + titleSize + (subtitle ? gap + subtitleSize : 0) + padY)
    : 0;

  // Create a new canvas that is taller so banner does not cover the capture.
  const canvas = document.createElement("canvas");
  canvas.width = baseW;
  canvas.height = baseH + bannerHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Banner (top)
  if (hasBanner) {
    // Subtle divider line
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, bannerHeight);

    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, bannerHeight - 0.5);
    ctx.lineTo(canvas.width, bannerHeight - 0.5);
    ctx.stroke();

    let y = padY + titleSize * 0.55;

    if (title) {
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.font = `700 ${titleSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(title, padX, y);
      y += titleSize * 0.6 + gap;
    }

    if (subtitle) {
      ctx.fillStyle = "rgba(0,0,0,0.60)";
      ctx.font = `600 ${subtitleSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(subtitle, padX, y);
    }
  }

  // Draw captured image below banner
  ctx.drawImage(base, 0, bannerHeight);

  // Watermark: Gym Log text + logo (bottom-right of full image)
  const logoSrc = "/icons/gym-app-logo-color-40x40.png";
  try {
    const logo = await loadImage(logoSrc);

    const pad = Math.round(Math.max(16, canvas.width * 0.02));
    const logoSize = Math.round(Math.min(40, Math.max(28, canvas.width * 0.045)));
    const text = "Gym Log";
    const fontSize = Math.round(Math.min(22, Math.max(16, canvas.width * 0.028)));
    const gap2 = Math.round(8);

    ctx.font = `700 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    const textWidth = ctx.measureText(text).width;
    const wmHeight = Math.max(logoSize, fontSize);
    const xRight = canvas.width - pad;
    const yMid = canvas.height - pad - wmHeight / 2;

    // Very subtle shadow for legibility
    ctx.shadowColor = "rgba(0,0,0,0.16)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    const totalWidth = textWidth + gap2 + logoSize;
    const xStart = xRight - totalWidth;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText(text, xStart, yMid);

    ctx.drawImage(logo, xStart + textWidth + gap2, yMid - logoSize / 2, logoSize, logoSize);

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  } catch {
    // If logo fails to load for any reason, we still export.
  }

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG"))), "image/png");
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

  // html-to-image is client-only; load it dynamically.
  const mod = await import("html-to-image");

  // Hide certain UI only during export
  node.classList.add("exporting");

  let dataUrl: string;
  try {
    dataUrl = await mod.toPng(node, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2,
    });
  } finally {
    node.classList.remove("exporting");
  }

  const blob = await renderFinalPngBlob(dataUrl);

  // Attempt to share (mobile). Fallback to download.
  const file = blobToFile(blob, filename);
  const nav: any = navigator;

  try {
    if (typeof nav?.share === "function") {
      const canShareFiles = typeof nav?.canShare === "function" && nav.canShare({ files: [file] });
      if (canShareFiles) {
        await nav.share({ files: [file], title: title || "Gym Log", text: text || "" });
        return { kind: "shared" };
      }
    }
  } catch {
    // fall through to download
  }

  downloadBlob(blob, filename);
  return { kind: "downloaded" };
}
