// app/lib/entitlements.ts
import { supabase } from "./supabaseClient";

export type ProStatus = {
  isPro: boolean;
  reason: "active" | "trialing" | "trial" | "free" | "signed_out";
  trialEndsAt?: string | null;
  subscriptionStatus?: string | null;
};

const TRIAL_DAYS = 7;

function addDaysIso(dateIso: string, days: number) {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function getProStatus(userId?: string | null): Promise<ProStatus> {
  if (!userId) return { isPro: false, reason: "signed_out" };

  // 1) Check paid subscription status (server-truth via webhooks)
  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select("status, trial_end, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!subErr && sub?.status) {
    const status = String(sub.status);
    if (status === "active" || status === "trialing") {
      return {
        isPro: true,
        reason: status === "active" ? "active" : "trialing",
        subscriptionStatus: status,
        trialEndsAt: sub.trial_end ?? null,
      };
    }
  }

  // 2) Otherwise, use app-managed 7-day trial based on profiles.trial_started_at
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("trial_started_at")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) {
    // If profile read fails (RLS etc), fail closed (no Pro)
    return { isPro: false, reason: "free" };
  }

  let trialStartedAt: string | null = prof?.trial_started_at ?? null;

  // If missing, we DON'T set it here (client-side writes can fail w/ RLS).
  // It should be set on sign-up/login server-side or via an RPC/policy you allow.
  if (!trialStartedAt) {
    return { isPro: false, reason: "free" };
  }

  const trialEndsAt = addDaysIso(trialStartedAt, TRIAL_DAYS);
  const now = new Date();
  const ends = new Date(trialEndsAt);

  if (now < ends) {
    return { isPro: true, reason: "trial", trialEndsAt };
  }

  return { isPro: false, reason: "free", trialEndsAt };
}