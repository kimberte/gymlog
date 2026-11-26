import {NextResponse} from "next/server";
import {checkoutEnabled,authenticatedTrainer,adminClient} from "../shared";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{
 const user=await authenticatedTrainer(request);if(!user)return NextResponse.json({error:"Trainer login required"},{status:401});
 const admin=adminClient();
 const [billing,roster]=await Promise.all([admin.from("trainer_billing").select("plan,status,current_period_end,trial_ends_at,cancel_at_period_end,stripe_subscription_id,risk_hold").eq("trainer_id",user.id).maybeSingle(),admin.from("trainer_clients").select("id",{count:"exact",head:true}).eq("trainer_id",user.id).in("status",["pending","accepted"])]);
 if(billing.error||roster.error)throw new Error("Billing query failed");
 const b=billing.data;return NextResponse.json({checkoutEnabled:checkoutEnabled(),profile:{subscription_status:user.trainerProfile.subscription_status,trial_ends_at:user.trainerProfile.trial_ends_at},billing:b?{plan:b.plan,status:b.status,current_period_end:b.current_period_end,trial_ends_at:b.trial_ends_at,cancel_at_period_end:b.cancel_at_period_end,hasSubscription:Boolean(b.stripe_subscription_id),riskHold:b.risk_hold}:null,used:roster.count??0},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Unable to load membership"},{status:500});}}
