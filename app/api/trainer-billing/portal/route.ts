import {NextResponse} from "next/server";
import {adminClient,authenticatedTrainer,stripeClient,checkoutEnabled,origin} from "../shared";
export const runtime="nodejs";
export async function POST(request:Request){try{
 const user=await authenticatedTrainer(request);if(!user)return NextResponse.json({error:"Trainer login required"},{status:401});
 if(user.trainerProfile.subscription_status==="complimentary")return NextResponse.json({error:"Your founder membership does not require billing."},{status:409});
 if(!checkoutEnabled())return NextResponse.json({error:"Billing is not enabled yet."},{status:503});
 const {data,error}=await adminClient().from("trainer_billing").select("stripe_customer_id,stripe_subscription_id").eq("trainer_id",user.id).maybeSingle();if(error)throw error;
 if(!data?.stripe_customer_id||!data.stripe_subscription_id)return NextResponse.json({error:"No billing account yet"},{status:404});
 const session=await stripeClient().billingPortal.sessions.create({customer:data.stripe_customer_id,return_url:origin+"/trainers/live?billing=return",...(process.env.STRIPE_TRAINER_PORTAL_CONFIGURATION_ID?{configuration:process.env.STRIPE_TRAINER_PORTAL_CONFIGURATION_ID}:{})});return NextResponse.json({url:session.url});
 }catch{console.error("Trainer billing portal failed");return NextResponse.json({error:"Unable to open billing portal"},{status:500});}}
