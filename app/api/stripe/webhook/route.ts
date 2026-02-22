import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return new Stripe(key, { apiVersion: "2024-06-20" as any });
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toIsoFromUnix(ts?: number | null) {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

function pickUnix(obj: any, snake: string, camel: string) {
  const v = obj?.[snake] ?? obj?.[camel];
  return typeof v === "number" ? v : null;
}

async function upsertFromSubscription(args: {
  userId: string;
  subscription: Stripe.Subscription;
  customerId?: string | null;
}) {
  const supabase = getSupabaseAdmin();

  // Stripe typings can drift; runtime objects are stable. Use a safe accessor.
  const subAny = args.subscription as any;

  await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: args.userId,
        stripe_subscription_id: subAny.id,
        status: subAny.status ?? null,
        current_period_end: toIsoFromUnix(
          pickUnix(subAny, "current_period_end", "currentPeriodEnd")
        ),
        trial_end: toIsoFromUnix(pickUnix(subAny, "trial_end", "trialEnd")),
        cancel_at_period_end: Boolean(
          subAny.cancel_at_period_end ?? subAny.cancelAtPeriodEnd
        ),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (args.customerId) {
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: args.customerId })
      .eq("id", args.userId);
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const stripe = getStripe();

  let payload: string;
  try {
    payload = await req.text();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    return new Response(
      `Webhook Error: ${err?.message ?? "invalid"}`,
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = (session.client_reference_id || "") as string;
      const subscriptionId = (session.subscription || "") as string;
      const customerId = (session.customer || "") as string;

      if (!userId || !subscriptionId) {
        return new Response("Missing client_reference_id/subscription", {
          status: 200,
        });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await upsertFromSubscription({ userId, subscription, customerId });
      return new Response("ok", { status: 200 });
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;

      // Find the user by stripe_subscription_id (set during checkout.session.completed)
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", (sub as any).id)
        .maybeSingle();

      const userId = data?.user_id as string | undefined;
      if (!userId) return new Response("ok", { status: 200 });

      await upsertFromSubscription({
        userId,
        subscription: sub,
        customerId:
          typeof (sub as any).customer === "string"
            ? ((sub as any).customer as string)
            : ((sub as any).customer?.id as string | undefined),
      });

      return new Response("ok", { status: 200 });
    }

    return new Response("ok", { status: 200 });
  } catch {
    // Return 200 to avoid Stripe retry storms while you inspect Supabase logs.
    return new Response("ok", { status: 200 });
  }
}