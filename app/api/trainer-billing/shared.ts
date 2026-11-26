import Stripe from "stripe";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const origin="https://www.gymlogapp.com";
export const plans={coach:{priceEnv:"STRIPE_TRAINER_COACH_PRICE_ID",limit:20,amount:900},growing_coach:{priceEnv:"STRIPE_TRAINER_GROWING_PRICE_ID",limit:50,amount:2500}} as const;
export type TrainerPlan=keyof typeof plans;
export const billingMode=()=>process.env.TRAINER_BILLING_MODE==="test"?"test":"live";
export function stripeClient(){const key=process.env.STRIPE_TRAINER_SECRET_KEY||(billingMode()==="live"?process.env.STRIPE_SECRET_KEY:undefined);if(!key||!new RegExp("^[sr]k_"+billingMode()+"_").test(key))throw new Error("Trainer Stripe key or mode not configured");return new Stripe(key);}
export function checkoutEnabled(){if(process.env.TRAINER_BILLING_CHECKOUT_ENABLED!=="true"||!process.env.STRIPE_TRAINER_WEBHOOK_SECRET||!process.env.STRIPE_TRAINER_COACH_PRICE_ID||!process.env.STRIPE_TRAINER_GROWING_PRICE_ID)return false;
 // Never enable sandbox payments on the production Gym Log database.
 if(billingMode()==="test"&&(process.env.VERCEL_ENV==="production"||process.env.TRAINER_BILLING_ISOLATED_TEST_DB!=="true"))return false;
 try{stripeClient();return true;}catch{return false;}
}
export function adminClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Supabase admin not configured");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function authenticatedTrainer(request:Request){const bearer=request.headers.get("authorization")||"";if(!bearer.startsWith("Bearer "))return null;const admin=adminClient();const {data:{user},error}=await admin.auth.getUser(bearer.slice(7));if(error||!user||!user.email_confirmed_at)return null;const {data:profile,error:profileError}=await admin.from("trainer_profiles").select("user_id,subscription_status,trial_started_at,trial_ends_at,trial_terms_accepted_at").eq("user_id",user.id).maybeSingle();if(profileError)throw profileError;return profile?{...user,trainerProfile:profile}:null;}
export const idOf=(x:string|{id:string}|null|undefined)=>typeof x==="string"?x:x?.id??null;
export const iso=(n:number|null|undefined)=>n?new Date(n*1000).toISOString():null;
export const planFromPrice=(price:string|undefined):TrainerPlan|null=>price&&price===process.env.STRIPE_TRAINER_COACH_PRICE_ID?"coach":price&&price===process.env.STRIPE_TRAINER_GROWING_PRICE_ID?"growing_coach":null;
