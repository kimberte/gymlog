// Client-only helper to capture a DOM node to PNG and share/download it.

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
    // Same-origin asset; safe, but avoids canvas tainting if the app is behind a CDN.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

async function addWatermark(dataUrl: string) {
  const base = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = base.naturalWidth || base.width;
  canvas.height = base.naturalHeight || base.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(base, 0, 0);

  // Watermark: Gym Log logo + text (subtle, bottom-right)
  const logoSrc = "/icons/gym-app-logo-color-40x40.png";
  const logo = await loadImage(logoSrc);

  const pad = Math.round(Math.max(16, canvas.width * 0.02));
  const logoSize = Math.round(Math.min(40, Math.max(28, canvas.width * 0.045)));
  const gap = Math.round(8);

  const text = "Gym Log";
  const fontSize = Math.round(Math.min(22, Math.max(16, canvas.width * 0.028)));
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const textWidth = ctx.measureText(text).width;
  const wmHeight = Math.max(logoSize, fontSize);
  const xRight = canvas.width - pad;
  const yMid = canvas.height - pad - wmHeight / 2;

  // Slight shadow for legibility
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  // Draw text (left) then logo (right)
  const totalWidth = textWidth + gap + logoSize;
  const xStart = xRight - totalWidth;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(text, xStart, yMid);

  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 4;
  ctx.drawImage(logo, xStart + textWidth + gap, yMid - logoSize / 2, logoSize, logoSize);

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

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

  // ✅ Hide certain UI only during export
  node.classList.add("exporting");

  let dataUrl: string;
  try {
    // Capture to a PNG data URL.
    dataUrl = await mod.toPng(node, {
    cacheBust: true,
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    });
  } finally {
    node.classList.remove("exporting");
  }

  const blob = await addWatermark(dataUrl);

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
