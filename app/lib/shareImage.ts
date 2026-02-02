// Client-only helper to capture a DOM node to PNG and share/download it.
// - Uses app background color (reads from CSS/body computed style)
// - Adds export-only header banner (month + month workout count) centered and brand orange
// - Hides export-only UI via .exporting class (CSS rule)
// - Adds a footer band with centered larger "Gym Log" + logo watermark

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

/**
 * Reads the visible calendar month title + subtitle from the DOM.
 * Works even if those elements are outside the capture node.
 */
function readCalendarHeaderFromDOM(): { title?: string; subtitle?: string } {
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

  const { bg, accent } = readThemeColors();
  const { title, subtitle } = readCalendarHeaderFromDOM();
  const hasBanner = Boolean(title || subtitle);

  // Scale sizes with image width
  const padX = Math.round(Math.max(18, baseW * 0.03));
  const padY = Math.round(Math.max(14, baseW * 0.02));
  const titleSize = Math.round(Math.min(44, Math.max(24, baseW * 0.045))); // bigger
  const subtitleSize = Math.round(Math.min(28, Math.max(16, baseW * 0.028))); // bigger
  const gap = Math.round(Math.max(8, baseW * 0.015));

  const bannerHeight = hasBanner
    ? Math.round(padY + titleSize + (subtitle ? gap + subtitleSize : 0) + padY)
    : 0;

  // Footer with centered brand watermark
  const footerPadY = Math.round(Math.max(14, baseW * 0.02));
  const footerFont = Math.round(Math.min(28, Math.max(18, baseW * 0.03))); // bigger
  const footerLogo = Math.round(Math.min(52, Math.max(34, baseW * 0.055))); // bigger
  const footerGap = Math.round(Math.max(10, baseW * 0.02));
  const footerHeight = Math.round(footerPadY + Math.max(footerFont, footerLogo) + footerPadY);

  // New canvas taller (banner + capture + footer)
  const canvas = document.createElement("canvas");
  canvas.width = baseW;
  canvas.height = bannerHeight + baseH + footerHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background matches app
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Banner top (centered, brand orange)
  if (hasBanner) {
    // Optional subtle divider line under banner
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, bannerHeight - 0.5);
    ctx.lineTo(canvas.width, bannerHeight - 0.5);
    ctx.stroke();

    const xCenter = canvas.width / 2;

    let y = padY + titleSize * 0.55;

    if (title) {
      ctx.fillStyle = accent;
      ctx.font = `800 ${titleSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(title, xCenter, y);
      y += titleSize * 0.65 + gap;
    }

    if (subtitle) {
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.9;
      ctx.font = `700 ${subtitleSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(subtitle, xCenter, y);
      ctx.globalAlpha = 1;
    }
  }

  // Draw captured image below banner
  ctx.drawImage(base, 0, bannerHeight);

  // Footer separator
  const footerTopY = bannerHeight + baseH;
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerTopY + 0.5);
  ctx.lineTo(canvas.width, footerTopY + 0.5);
  ctx.stroke();

  // Watermark footer: centered "Gym Log" + logo
  const logoSrc = "/icons/gym-app-logo-color-40x40.png";
  try {
    const logo = await loadImage(logoSrc);

    const text = "Gym Log";
    ctx.font = `800 ${footerFont}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    const textWidth = ctx.measureText(text).width;

    const totalW = textWidth + footerGap + footerLogo;
    const xStart = (canvas.width - totalW) / 2;
    const yMid = footerTopY + footerHeight / 2;

    // Use accent (brand orange) and keep it crisp
    ctx.fillStyle = accent;
    ctx.fillText(text, xStart, yMid);

    ctx.drawImage(logo, xStart + textWidth + footerGap, yMid - footerLogo / 2, footerLogo, footerLogo);
  } catch {
    // If logo fails, export still works (text-only could be added, but we keep it simple)
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

  const mod = await import("html-to-image");
  const { bg } = readThemeColors();

  // Hide certain UI only during export
  node.classList.add("exporting");

  let dataUrl: string;
  try {
    dataUrl = await mod.toPng(node, {
      cacheBust: true,
      backgroundColor: bg, // ✅ match app background
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
