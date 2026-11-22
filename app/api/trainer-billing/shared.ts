import Stripe from "stripe";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export function stripeClient(){const key=process.env.STRIPE_SECRET_KEY;if(!key)throw new Error("Stripe is not configured");return new Stripe(key);}
export function adminClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Supabase admin not configured");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function authenticatedTrainer(request:Request){const bearer=request.headers.get("authorization")||"";if(!bearer.startsWith("Bearer "))return null;const admin=adminClient();const {data:{user},error}=await admin.auth.getUser(bearer.slice(7));if(error||!user)return null;const {data:profile}=await admin.from("trainer_profiles").select("user_id").eq("user_id",user.id).maybeSingle();return profile?user:null;}
export const plans={coach:{priceEnv:"STRIPE_TRAINER_COACH_PRICE_ID",limit:20},growing_coach:{priceEnv:"STRIPE_TRAINER_GROWING_PRICE_ID",limit:50}} as const;
