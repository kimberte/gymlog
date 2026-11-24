import {createClient} from "@supabase/supabase-js";
import {allowedPushEndpoint,sendPush} from "../../../lib/coachingPush";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){return Response.json({publicKey:process.env.VAPID_PUBLIC_KEY||null});}
export async function POST(request:Request){
 const bearer=request.headers.get("authorization");if(!bearer?.startsWith("Bearer "))return Response.json({error:"Sign in first."},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return Response.json({error:"Push not configured."},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(bearer.slice(7));
 if(error||!user?.email_confirmed_at)return Response.json({error:"Sign in with a verified account."},{status:401});
 let body;try{body=await request.json()}catch{return Response.json({error:"Invalid request."},{status:400});}
 const endpoint=body?.subscription?.endpoint;
 if(typeof endpoint!=="string"||endpoint.length>2048||!allowedPushEndpoint(endpoint))return Response.json({error:"Unsupported push service."},{status:400});
 if(body.action==="remove"){const {error}=await db.from("coaching_push_devices").delete().eq("endpoint",endpoint).eq("user_id",user.id);return Response.json(error?{error:"Could not remove device."}:{message:"Device removed."},{status:error?500:200});}
 if(body.action==="register"){
 const p256dh=body.subscription?.keys?.p256dh,auth=body.subscription?.keys?.auth;
 if(typeof p256dh!=="string"||typeof auth!=="string"||p256dh.length>120||auth.length>30||Buffer.from(p256dh,"base64url").length!==65||Buffer.from(auth,"base64url").length!==16)return Response.json({error:"Invalid subscription keys."},{status:400});
 const {error}=await db.from("coaching_push_devices").upsert({endpoint,user_id:user.id,p256dh,auth,updated_at:new Date().toISOString()},{onConflict:"endpoint"});
 return Response.json(error?{error:"Could not register device."}:{message:"Push enabled on this device."},{status:error?500:200});
 }
 if(body.action==="test"){
 const now=new Date().toISOString(),cutoff=new Date(Date.now()-60000).toISOString();
 const {data:device,error}=await db.from("coaching_push_devices").update({last_test_at:now}).eq("endpoint",endpoint).eq("user_id",user.id).or("last_test_at.is.null,last_test_at.lt."+cutoff).select("endpoint,p256dh,auth").maybeSingle();
 if(error||!device)return Response.json({error:"Enable this device first, or wait a minute between tests."},{status:429});
 try{const status=await sendPush(device,{title:"Gym Log test",body:"Push notifications are connected on this device.",url:"/?settings=1",tag:"gym-log-test"});if(status>=200&&status<300)return Response.json({message:"Test push accepted by your device's push service."});if(status===404||status===410)await db.from("coaching_push_devices").delete().eq("endpoint",endpoint).eq("user_id",user.id);return Response.json({error:"Push service rejected the test ("+status+"). Re-enable this device."},{status:502});}catch{return Response.json({error:"Push delivery failed."},{status:502});}
 }
 return Response.json({error:"Unknown action."},{status:400});
}
