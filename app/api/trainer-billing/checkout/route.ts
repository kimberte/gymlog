import {NextResponse} from "next/server";
import {adminClient,authenticatedTrainer,plans,stripeClient,checkoutEnabled,origin,type TrainerPlan} from "../shared";
export const runtime="nodejs";
export async function POST(request:Request){
 let lease:string|null=null,trainer:string|null=null;
 const reply=(error:string,status:number)=>NextResponse.json({error},{status});
 try{
 const user=await authenticatedTrainer(request);if(!user)return reply("Verified trainer login required",401);
 if(!checkoutEnabled())return reply("Trainer billing is not accepting payments yet.",503);
 const profile=user.trainerProfile;if(profile.subscription_status==="complimentary")return reply("Your complimentary membership does not require payment.",409);
 if(!profile.trial_terms_accepted_at)return reply("Accept the trial terms first.",403);
 const body=await request.json().catch(()=>({}));const plan=body.plan as TrainerPlan;
 if(!Object.prototype.hasOwnProperty.call(plans,plan))return reply("Invalid plan",400);
 const price=process.env[plans[plan].priceEnv]!;
 const admin=adminClient();const stripe=stripeClient();
 const trialEnd=profile.trial_ends_at?Math.floor(new Date(profile.trial_ends_at).getTime()/1000):0;
 const remaining=trialEnd-Math.floor(Date.now()/1000);
 // Never shorten a free trial because Checkout requires a minimum lead time.
 if(remaining>0&&remaining<49*3600)return reply("Your free trial is still active. Please return after it ends to subscribe without losing any free days.",409);
 const {count,error:rosterError}=await admin.from("trainer_clients").select("id",{count:"exact",head:true}).eq("trainer_id",user.id).in("status",["pending","accepted"]);
 if(rosterError)throw rosterError;
 if((count??0)>plans[plan].limit)return reply("Your current client roster exceeds this plan. Choose a larger plan or reduce your roster.",409);
 const productPrice=await stripe.prices.retrieve(price);
 if(!productPrice.active||productPrice.currency!=="usd"||productPrice.unit_amount!==plans[plan].amount||productPrice.recurring?.interval!=="month"||productPrice.recurring.interval_count!==1||productPrice.tax_behavior!=="exclusive")return reply("Selected plan is unavailable.",503);
 const attempt=crypto.randomUUID();
 const {data:claimed,error:claimError}=await admin.rpc("claim_trainer_checkout",{p_trainer:user.id,p_lease:attempt});
 if(claimError)throw claimError;if(!claimed)return reply("A billing request is already in progress or your account requires review.",409);
 lease=attempt;trainer=user.id;
 const {data:billing,error:billingError}=await admin.from("trainer_billing").select("*").eq("trainer_id",user.id).single();if(billingError)throw billingError;
 if(billing.stripe_subscription_id&&!["canceled","incomplete_expired"].includes(billing.status))return reply("Manage your existing subscription instead.",409);
 let customer=billing.stripe_customer_id as string|null;
 if(!customer){
 const created=await stripe.customers.create({email:user.email,metadata:{trainer_id:user.id,app:"gym_log_trainers"}},{idempotencyKey:"gym-log-trainer-customer-"+user.id});
 customer=created.id;
 const {error}=await admin.from("trainer_billing").update({stripe_customer_id:customer}).eq("trainer_id",user.id).eq("checkout_lease_id",lease);if(error)throw error;
 }
 const subscriptions=await stripe.subscriptions.list({customer,status:"all",limit:100});
 if(subscriptions.has_more||subscriptions.data.some(s=>!["canceled","incomplete_expired"].includes(s.status)))return reply("Manage your existing subscription instead.",409);
 const open=await stripe.checkout.sessions.list({customer,status:"open",limit:100});
 if(open.has_more)return reply("An existing checkout needs review.",409);
 for(const session of open.data){
 if(session.mode!=="subscription")continue;
 if(session.metadata?.app==="gym_log_trainers"&&session.metadata?.plan===plan&&session.url)return NextResponse.json({url:session.url});
 return reply("Another checkout is still open. Complete it or wait for it to expire before choosing another plan.",409);
 }
 const trialSettings=remaining>=49*3600&&!billing.stripe_subscription_id?{trial_end:trialEnd}:{};
 const session=await stripe.checkout.sessions.create({mode:"subscription",customer,automatic_tax:{enabled:true},customer_update:{address:"auto",name:"auto"},billing_address_collection:"required",line_items:[{price,quantity:1}],success_url:origin+"/trainers/live?billing=success",cancel_url:origin+"/trainers/live?billing=cancel",expires_at:Math.floor(Date.now()/1000)+31*60,client_reference_id:user.id,metadata:{app:"gym_log_trainers",trainer_id:user.id,plan},subscription_data:{metadata:{app:"gym_log_trainers",trainer_id:user.id,plan},...trialSettings}},{idempotencyKey:"gym-log-trainer-checkout-"+lease});
 if(!session.url)throw new Error("Missing Checkout URL");return NextResponse.json({url:session.url});
 }catch{console.error("Trainer checkout failed");return reply("Unable to start checkout",500);}
 finally{if(lease&&trainer){try{await adminClient().from("trainer_billing").update({checkout_lease_until:null,checkout_lease_id:null}).eq("trainer_id",trainer).eq("checkout_lease_id",lease);}catch{}}}
}
