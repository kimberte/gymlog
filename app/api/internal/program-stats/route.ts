import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = process.env.ADMIN_STATS_TOKEN;
  const supplied = request.headers.get("x-admin-stats-token");
  if (!token || !supplied || supplied !== token) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("program_stats")
    .select("slug,views,downloads,popularity_baseline,updated_at")
    .order("views", { ascending: false });

  if (error) return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });

  const rows = data ?? [];
  return NextResponse.json({
    totals: {
      views: rows.reduce((n, row) => n + Number(row.views || 0), 0),
      downloads: rows.reduce((n, row) => n + Number(row.downloads || 0), 0),
    },
    programs: rows,
  }, { headers: { "Cache-Control": "no-store" } });
}
