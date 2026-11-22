import {NextResponse} from "next/server";
import {adminClient,authenticatedTrainer,plans,stripeClient} from "../shared";
export const runtime="nodejs";
export async function POST(request:Request){try{
 const user=await authenticatedTrainer(request);if(!user)return NextResponse.json({error:"Trainer login required"},{status:401});
 if(process.env.TRAINER_BILLING_CHECKOUT_ENABLED!=="true")return NextResponse.json({error:"Trainer billing is not accepting payments yet."},{status:503});
 const body=await request.json().catch(()=>({}));const plan=body.plan as keyof typeof plans;
 if(!Object.prototype.hasOwnProperty.call(plans,plan))return NextResponse.json({error:"Invalid plan"},{status:400});
 const price=process.env[plans[plan].priceEnv];if(!price)return NextResponse.json({error:"Plan is not configured"},{status:503});
 const admin=adminClient();const {data:profile}=await admin.from("trainer_profiles").select("trial_started_at,trial_ends_at,subscription_status").eq("user_id",user.id).single();const {data:billing}=await admin.from("trainer_billing").select("*").eq("trainer_id",user.id).maybeSingle();
 if(billing?.stripe_subscription_id&&["active","trialing","past_due","unpaid"].includes(billing.status))return NextResponse.json({error:"Existing subscription: manage billing instead"},{status:409});
 const stripe=stripeClient();let customer=billing?.stripe_customer_id as string|undefined;
 if(!customer){const created=await stripe.customers.create({email:user.email,metadata:{trainer_id:user.id}});customer=created.id;const {error}=await admin.from("trainer_billing").upsert({trainer_id:user.id,stripe_customer_id:customer},{onConflict:"trainer_id"});if(error)throw error;}
 const origin="https://www.gymlogapp.com";const trialEnd=profile?.trial_ends_at?new Date(profile.trial_ends_at).getTime():null;const trialSeconds=trialEnd?Math.floor((trialEnd-Date.now())/1000):0;const eligibleTrial=!billing?.stripe_subscription_id&&(!profile?.trial_started_at||trialSeconds>0);const trialSettings=eligibleTrial?(trialSeconds>86400?{trial_end:Math.floor(trialEnd!/1000)}:!profile?.trial_started_at?{trial_period_days:30}:{}):{};
 const session=await stripe.checkout.sessions.create({mode:"subscription",customer,automatic_tax:{enabled:true},billing_address_collection:"required",line_items:[{price,quantity:1}],success_url:origin+"/trainers/live?billing=success",cancel_url:origin+"/trainers/live?billing=cancel",client_reference_id:user.id,metadata:{trainer_id:user.id,plan},subscription_data:{metadata:{trainer_id:user.id,plan},...trialSettings}});
 return NextResponse.json({url:session.url});
}catch(e){console.error("Trainer checkout failed",e);return NextResponse.json({error:"Unable to start checkout"},{status:500});}}
