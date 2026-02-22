// app/lib/entitlements.ts
"use client";

import { supabase } from "./supabaseClient";

export type ProStatus = {
  isPro: boolean;
  reason: "active" | "trialing" | "trial" | "free" | "signed_out";
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  subscriptionStatus?: string | null;
};

const TRIAL_DAYS = 7;

function addDaysIso(startIso: string, days: number) {
  const d = new Date(startIso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function ensureTrialStarted(userId: string) {
  // best-effort: if trial_started_at missing, set it
  const { data: prof, error } = await supabase
    .from("profiles")
    .select("trial_started_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) return;
  if (prof?.trial_started_at) return;

  await supabase
    .from("profiles")
    .update({ trial_started_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function getProStatus(userId?: string | null): Promise<ProStatus> {
  if (!userId) return { isPro: false, reason: "signed_out" };

  // 1) Paid subscription via webhooks
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, trial_end, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const status = (sub?.status ?? null) ? String(sub!.status) : null;
  if (status === "active" || status === "trialing") {
    return {
      isPro: true,
      reason: status === "active" ? "active" : "trialing",
      subscriptionStatus: status,
      trialEndsAt: (sub?.trial_end ?? null) as any,
    };
  }

  // 2) App-managed 7-day trial
  const { data: prof } = await supabase
    .from("profiles")
    .select("trial_started_at")
    .eq("id", userId)
    .maybeSingle();

  const trialStartedAt = (prof?.trial_started_at ?? null) as any as string | null;
  if (!trialStartedAt) {
    return { isPro: false, reason: "free", trialStartedAt: null, trialEndsAt: null };
  }

  const trialEndsAt = addDaysIso(trialStartedAt, TRIAL_DAYS);
  const now = new Date();
  const ends = new Date(trialEndsAt);

  if (now < ends) {
    return { isPro: true, reason: "trial", trialStartedAt, trialEndsAt };
  }

  return { isPro: false, reason: "free", trialStartedAt, trialEndsAt };
}
