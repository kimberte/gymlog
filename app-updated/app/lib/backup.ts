// app/lib/backup.ts
import { supabase } from "./supabaseClient";

export type BackupRow = {
  user_id: string;
  data: Record<string, any>;
  updated_at: string; // ISO string
};

export async function getSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function upsertBackup(workouts: Record<string, any>) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  // Upsert latest snapshot for this user
  const { data, error } = await supabase
    .from("workout_backups")
    .upsert(
      {
        user_id: user.id,
        data: workouts ?? {},
      },
      { onConflict: "user_id" }
    )
    .select("updated_at")
    .single();

  if (error) throw error;
  return data?.updated_at as string;
}

export async function fetchLatestBackup(): Promise<BackupRow | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("workout_backups")
    .select("user_id,data,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export function formatBackupDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
