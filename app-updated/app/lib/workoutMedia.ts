// app/lib/workoutMedia.ts
// Pro feature: per-workout media (image OR video) stored in Supabase Storage.

import { supabase } from "./supabaseClient";

export const WORKOUT_MEDIA_BUCKET = "workout-media";

export function buildWorkoutMediaPath(args: {
  userId: string;
  date: string; // YYYY-MM-DD
  entryId: string; // w1/w2/w3 or uuid
  ext: "webp" | "mp4" | "mov";
}) {
  // Example: userId/2026-02-14/w1.mp4
  return `${args.userId}/${args.date}/${args.entryId}.${args.ext}`;
}

export async function uploadWorkoutMedia(args: {
  userId: string;
  date: string;
  entryId: string;
  blob: Blob;
  kind: "image" | "video";
  ext: "webp" | "mp4" | "mov";
}) {
  const path = buildWorkoutMediaPath({
    userId: args.userId,
    date: args.date,
    entryId: args.entryId,
    ext: args.ext,
  });

  const contentType =
    args.kind === "image"
      ? args.blob.type || "image/webp"
      : args.ext === "mov"
        ? "video/quicktime"
        : "video/mp4";

  const { error } = await supabase.storage.from(WORKOUT_MEDIA_BUCKET).upload(path, args.blob, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  });

  if (error) throw error;
  return path;
}

export async function removeWorkoutMedia(path: string) {
  const { error } = await supabase.storage.from(WORKOUT_MEDIA_BUCKET).remove([path]);
  if (error) throw error;
}

export async function getWorkoutMediaSignedUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(WORKOUT_MEDIA_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
