import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server not configured (missing env vars)." },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";

  if (!token) {
    return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
  }

  // Client used only to validate the user token
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  // Admin client (service role) used to delete data + auth user
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // 1) Delete app data (your single server backup)
  // Adjust table/column names if yours differ:
  // - table: workout_backups
  // - column: user_id (uuid)
  try {
    const { error: delBackupErr } = await admin
      .from("workout_backups")
      .delete()
      .eq("user_id", user.id);

    // If table doesn't exist yet, don't block deletion of auth user.
    // Supabase error for missing table typically includes "relation ... does not exist".
    if (delBackupErr && !String(delBackupErr.message).includes("does not exist")) {
      return NextResponse.json(
        { error: `Failed deleting backups: ${delBackupErr.message}` },
        { status: 500 }
      );
    }
  } catch (e: any) {
    // Ignore only if it's "does not exist" style error
    const msg = String(e?.message || e);
    if (!msg.includes("does not exist")) {
      return NextResponse.json(
        { error: "Failed deleting backups." },
        { status: 500 }
      );
    }
  }

  // 2) Delete auth user
  const { error: delUserErr } = await admin.auth.admin.deleteUser(user.id);
  if (delUserErr) {
    return NextResponse.json(
      { error: `Failed deleting user: ${delUserErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
