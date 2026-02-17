"use client";

import { supabase } from "./supabaseClient";

// Community is fully siloed away from core logging.
// Sharing is opt-in and OFF by default.
export const SHARE_ENABLED_KEY = "gym-log-community-share-enabled";

export function loadShareEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SHARE_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveShareEnabled(v: boolean) {
  try {
    localStorage.setItem(SHARE_ENABLED_KEY, v ? "1" : "0");
  } catch {}
}

function safeEntriesForDay(day: any): any[] {
  if (!day) return [];
  if (Array.isArray(day?.entries)) return day.entries;
  // legacy single-entry shape
  return [day];
}

function deriveTitle(entries: any[]): string | null {
  const first = entries
    .map((e) => String(e?.title ?? "").trim())
    .find((t) => Boolean(t));
  return first || null;
}

function deriveMediaFlags(day: any): { has_photo: boolean; has_video: boolean } {
  const entries = safeEntriesForDay(day);
  // Legacy day image support
  const hasLegacyPhoto = Boolean(day?.image?.path);

  // Per-entry media support (your current model)
  const hasPhoto =
    hasLegacyPhoto ||
    entries.some((e) => {
      const m = e?.media;
      if (m?.kind === "image" && m?.path) return true;
      // newer arrays
      if (Array.isArray(e?.images) && e.images.length) return true;
      return false;
    });

  const hasVideo = entries.some((e) => {
    const m = e?.media;
    if (m?.kind === "video" && m?.path) return true;
    if (Array.isArray(e?.videos) && e.videos.length) return true;
    return false;
  });

  return { has_photo: Boolean(hasPhoto), has_video: Boolean(hasVideo) };
}

/**
 * Ensures the current user has a row in public.profiles.
 * Note: requires RLS policies allowing authed users to insert/update their own profile.
 */
export async function ensureProfileRow() {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    const email = user?.email;
    if (!user?.id || !email) return;

    await supabase
      .from("profiles")
      .upsert({ id: user.id, email }, { onConflict: "id" });
  } catch {
    // Ignore: community is optional.
  }
}

/**
 * Upserts the workout day snapshot used by the community feed.
 * Fully opt-in. If sharing is disabled or not signed in, it does nothing.
 */
export async function publishWorkoutDay(dateKey: string, workouts: Record<string, any>) {
  try {
    if (!loadShareEnabled()) return;
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.id) return;

    const day = (workouts as any)?.[dateKey];
    const entries = safeEntriesForDay(day);
    const title = deriveTitle(entries);
    const flags = deriveMediaFlags(day);

    await supabase.from("workout_days").upsert(
      {
        user_id: user.id,
        date_key: dateKey,
        title,
        entries,
        ...flags,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date_key" }
    );
  } catch {
    // Ignore: core logging must never break because of community.
  }
}
