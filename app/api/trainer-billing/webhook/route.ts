import Stripe from "stripe";
import {adminClient,stripeClient,billingMode,idOf,iso,planFromPrice} from "../shared";
export const runtime="nodejs";
const lifecycle=new Set(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted","customer.subscription.paused","customer.subscription.resumed"]);
const invoices=new Set(["invoice.paid","invoice.payment_failed","invoice.payment_action_required","invoice.finalization_failed"]);
const riskEvents=new Set(["charge.refunded","charge.dispute.created","radar.early_fraud_warning.created"]);
const invoiceSub=(invoice:Stripe.Invoice)=>idOf(invoice.parent?.subscription_details?.subscription);
async function knownCustomer(customer:string|null){if(!customer)return false;const {data,error}=await adminClient().from("trainer_billing").select("trainer_id").eq("stripe_customer_id",customer).maybeSingle();if(error)throw error;return Boolean(data);}
async function syncSubscription(stripe:Stripe,id:string,customerHint:string|null){
 if(!await knownCustomer(customerHint))return;
 // Retrieve current authoritative state instead of trusting an old event snapshot.
 const observed=new Date().toISOString();const sub=await stripe.subscriptions.retrieve(id);
 const customer=idOf(sub.customer);if(!customer||customer!==customerHint||sub.items.data.length!==1)return;
 const item=sub.items.data[0],plan=planFromPrice(item.price.id);
 if(!plan||item.quantity!==1||sub.livemode!==(billingMode()==="live"))return;
 const {error}=await adminClient().rpc("sync_trainer_subscription",{p_customer:customer,p_subscription:sub.id,p_created:sub.created,p_observed:observed,p_plan:plan,p_status:sub.status,p_period:iso(item.current_period_end),p_trial:iso(sub.trial_end),p_cancel:sub.cancel_at_period_end});if(error)throw error;
}
async function recordRisk(stripe:Stripe,event:Stripe.Event){
 let charge:Stripe.Charge,pi:string|null;
 if(event.type==="charge.refunded"){charge=event.data.object as Stripe.Charge;pi=idOf(charge.payment_intent);}
 else{const object=event.data.object as Stripe.Dispute|Stripe.Radar.EarlyFraudWarning;const chargeId=idOf(object.charge);if(!chargeId)return;charge=await stripe.charges.retrieve(chargeId);pi=idOf(object.payment_intent)||idOf(charge.payment_intent);}
 const customer=idOf(charge.customer);if(!pi||!await knownCustomer(customer))return;
 const seen=new Set<string>();
 for await(const payment of stripe.invoicePayments.list({payment:{type:"payment_intent",payment_intent:pi},status:"paid",limit:100})){
 const invoiceId=idOf(payment.invoice);if(!invoiceId)continue;const invoice=await stripe.invoices.retrieve(invoiceId);const subscription=invoiceSub(invoice);if(!subscription||seen.has(subscription)||idOf(invoice.customer)!==customer)continue;seen.add(subscription);
 await syncSubscription(stripe,subscription,customer);
 const {error}=await adminClient().rpc("record_trainer_billing_risk",{p_event:event.id,p_kind:event.type,p_customer:customer,p_subscription:subscription});if(error)throw error;
 }
}
export async function POST(request:Request){
 const secret=process.env.STRIPE_TRAINER_WEBHOOK_SECRET,signature=request.headers.get("stripe-signature");
 if(!secret)return new Response("Webhook not configured",{status:503});
 if(!signature)return new Response("Signature required",{status:400});
 if(billingMode()==="test"&&(process.env.VERCEL_ENV==="production"||process.env.TRAINER_BILLING_ISOLATED_TEST_DB!=="true"))return new Response("Sandbox disabled on production data",{status:503});
 let event:Stripe.Event,stripe:Stripe;
 try{stripe=stripeClient();event=stripe.webhooks.constructEvent(await request.text(),signature,secret);}catch{return new Response("Invalid signature or configuration",{status:400});}
 if(event.livemode!==(billingMode()==="live"))return new Response("Mode mismatch",{status:400});
 try{
 if(event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded"){
 const session=event.data.object as Stripe.Checkout.Session;
 const sub=idOf(session.subscription);if(session.mode==="subscription"&&sub&&session.payment_status!=="unpaid")await syncSubscription(stripe,sub,idOf(session.customer));
 }else if(event.type==="checkout.session.async_payment_failed"){
 const session=event.data.object as Stripe.Checkout.Session;const sub=idOf(session.subscription);if(sub)await syncSubscription(stripe,sub,idOf(session.customer));
 }else if(lifecycle.has(event.type)){
 const sub=event.data.object as Stripe.Subscription;await syncSubscription(stripe,sub.id,idOf(sub.customer));
 }else if(invoices.has(event.type)){
 const invoice=event.data.object as Stripe.Invoice;const sub=invoiceSub(invoice);if(sub)await syncSubscription(stripe,sub,idOf(invoice.customer));
 }else if(riskEvents.has(event.type)){await recordRisk(stripe,event);}
 return new Response("ok",{status:200});
 }catch{console.error("Trainer Stripe webhook processing failed",event.id,event.type);return new Response("Processing failed",{status:500});}
}
