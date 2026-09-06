import { supabase } from "./supabaseClient";

export type ProgramStat = { slug: string; views: number; downloads: number; popularity_baseline: number };

export async function incrementProgramStat(slug: string, stat: "views" | "downloads") {
  const { data, error } = await supabase.rpc("increment_program_stat", { p_slug: slug, p_stat: stat });
  if (error) return null;
  return typeof data === "number" ? data : null;
}

export async function getProgramStats(slug: string) {
  const { data } = await supabase.from("program_stats").select("slug,views,downloads,popularity_baseline").eq("slug", slug).maybeSingle();
  return (data as ProgramStat | null) ?? { slug, views: 0, downloads: 0, popularity_baseline: 0 };
}

export async function getOverallProgramStats() {
  const { data } = await supabase.from("program_stats").select("views,downloads");
  return (data ?? []).reduce((totals, row) => ({ views: totals.views + Number(row.views || 0), downloads: totals.downloads + Number(row.downloads || 0) }), { views: 0, downloads: 0 });
}
