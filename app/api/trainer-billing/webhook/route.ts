import Stripe from "stripe";
import {adminClient,stripeClient} from "../shared";
export const runtime="nodejs";
async function syncSubscription(stripe:Stripe,sub:Stripe.Subscription){const admin=adminClient();const trainerId=sub.metadata?.trainer_id;if(!trainerId)return;const customer=typeof sub.customer==="string"?sub.customer:sub.customer.id;const price=sub.items.data[0]?.price.id;const plan=price===process.env.STRIPE_TRAINER_COACH_PRICE_ID?"coach":price===process.env.STRIPE_TRAINER_GROWING_PRICE_ID?"growing_coach":null;
 const period=sub.items.data[0]?.current_period_end;
 const {error}=await admin.from("trainer_billing").upsert({trainer_id:trainerId,stripe_customer_id:customer,stripe_subscription_id:sub.id,plan,status:sub.status,current_period_end:period?new Date(period*1000).toISOString():null,trial_ends_at:sub.trial_end?new Date(sub.trial_end*1000).toISOString():null,cancel_at_period_end:sub.cancel_at_period_end,updated_at:new Date().toISOString()},{onConflict:"trainer_id"});if(error)throw error;
}
export async function POST(request:Request){const secret=process.env.STRIPE_TRAINER_WEBHOOK_SECRET;if(!secret)return new Response("Webhook not configured",{status:503});const signature=request.headers.get("stripe-signature");if(!signature)return new Response("Signature required",{status:400});let event:Stripe.Event;const stripe=stripeClient();try{event=stripe.webhooks.constructEvent(await request.text(),signature,secret);}catch{return new Response("Invalid signature",{status:400});}
 try{if(event.type==="checkout.session.completed"){const session=event.data.object as Stripe.Checkout.Session;const subId=typeof session.subscription==="string"?session.subscription:session.subscription?.id;if(subId){const sub=await stripe.subscriptions.retrieve(subId);await syncSubscription(stripe,sub);}}
 if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)){const sub=event.data.object as Stripe.Subscription;await syncSubscription(stripe,sub);}
 return new Response("ok",{status:200});}catch(error){console.error("Trainer Stripe webhook processing failed",event.id,error);return new Response("Processing failed",{status:500});}
}
