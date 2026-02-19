"use client";
import { supabase } from "./supabaseClient";
import { uploadWorkoutMedia } from "./workoutMedia";

const COMMUNITY_SHARE_KEY = "gym-log-community-share-enabled";

export function isCommunityShareEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COMMUNITY_SHARE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setCommunityShareEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMMUNITY_SHARE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

// Back-compat helpers (older names)
export const loadShareEnabled = isCommunityShareEnabled;
export function saveShareEnabled(v: boolean) {
  setCommunityShareEnabled(v);
}

function isBlobLike(path: string) {
  return path.startsWith("blob:") || path.startsWith("data:");
}

function pickVideoExtFromType(type: string): "mp4" | "mov" {
  if (String(type || "").toLowerCase().includes("quicktime")) return "mov";
  return "mp4";
}

async function ensureUser() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return user ?? null;
}

export async function deleteWorkoutDay(args: { dateKey: string }) {
  if (!isCommunityShareEnabled()) return;
  const user = await ensureUser();
  if (!user) return;

  try {
    await supabase
      .from("workout_days")
      .delete()
      .eq("user_id", user.id)
      .eq("date_key", args.dateKey);
  } catch {
    // best-effort, never break core
  }
}

export async function publishWorkoutDay(args: { dateKey: string; workouts: Record<string, any> }) {
  if (!isCommunityShareEnabled()) return;
  const user = await ensureUser();
  if (!user) return;

  const day = args.workouts?.[args.dateKey];
  if (!day) {
    await deleteWorkoutDay({ dateKey: args.dateKey });
    return;
  }

  const rawEntries: any[] = Array.isArray(day?.entries) ? day.entries : [];

  // Upload any blob/data media to Storage and replace paths with Storage paths
  const entries = await Promise.all(
    rawEntries.map(async (e: any, idx: number) => {
      const entryId = String(e?.id || `w${idx + 1}`);
      const media = e?.media;
      if (!media?.path || !media?.kind) return e;

      const path = String(media.path);
      if (!isBlobLike(path)) return e; // already a storage path or external URL

      try {
        const res = await fetch(path);
        const blob = await res.blob();

        if (media.kind === "image") {
          const storagePath = await uploadWorkoutMedia({
            userId: user.id,
            date: args.dateKey,
            entryId,
            blob,
            kind: "image",
            ext: "webp",
          });
          return { ...e, media: { ...media, path: storagePath } };
        }

        // video
        const ext = pickVideoExtFromType(blob.type);
        const storagePath = await uploadWorkoutMedia({
          userId: user.id,
          date: args.dateKey,
          entryId,
          blob,
          kind: "video",
          ext,
        });
        return { ...e, media: { ...media, path: storagePath } };
      } catch {
        // If upload fails, keep original path (may not render for friends, but don't break save)
        return e;
      }
    })
  );

  const hasPhoto = entries.some((e: any) => e?.media?.kind === "image" && e?.media?.path);
  const hasVideo = entries.some((e: any) => e?.media?.kind === "video" && e?.media?.path);
  const title = String(entries.find((e: any) => String(e?.title || "").trim())?.title || "").trim() || null;

  try {
    await supabase.from("workout_days").upsert(
      {
        user_id: user.id,
        date_key: args.dateKey,
        title,
        entries,
        has_photo: Boolean(hasPhoto),
        has_video: Boolean(hasVideo),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date_key" }
    );
  } catch {
    // best-effort
  }
}
