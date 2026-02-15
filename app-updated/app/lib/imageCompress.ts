// app/lib/imageCompress.ts
// Minimal client-side image compression for uploads (no heavy deps).

export async function compressImageToWebp(
  file: File,
  opts?: {
    maxLongEdge?: number; // px
    quality?: number; // 0..1
  }
): Promise<Blob> {
  const maxLongEdge = opts?.maxLongEdge ?? 1800;
  const quality = opts?.quality ?? 0.78;

  // Decode
  const bitmap = await createImageBitmap(file);

  const srcW = bitmap.width;
  const srcH = bitmap.height;

  const longEdge = Math.max(srcW, srcH);
  const scale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1;
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(bitmap, 0, 0, dstW, dstH);
  bitmap.close?.();

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode"))),
      "image/webp",
      quality
    );
  });

  return blob;
}
