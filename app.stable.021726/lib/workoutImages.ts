// app/lib/workoutImages.ts
// Pro feature: one image per date, stored in Supabase Storage.

import { supabase } from "./supabaseClient";

export const WORKOUT_IMAGES_BUCKET = "workout-images";

export function buildWorkoutImagePath(userId: string, date: string) {
  // date is YYYY-MM-DD
  return `${userId}/${date}.webp`;
}

export async function uploadWorkoutImage(args: {
  userId: string;
  date: string;
  blob: Blob;
}) {
  const path = buildWorkoutImagePath(args.userId, args.date);

  const { error } = await supabase.storage
    .from(WORKOUT_IMAGES_BUCKET)
    .upload(path, args.blob, {
      upsert: true,
      contentType: args.blob.type || "image/webp",
      cacheControl: "3600",
    });

  if (error) throw error;
  return path;
}

export async function removeWorkoutImage(path: string) {
  const { error } = await supabase.storage
    .from(WORKOUT_IMAGES_BUCKET)
    .remove([path]);
  if (error) throw error;
}

export async function getWorkoutImageSignedUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(WORKOUT_IMAGES_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
