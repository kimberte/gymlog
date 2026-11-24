import {createClient} from "@supabase/supabase-js";
import {timingSafeEqual} from "node:crypto";
import {sendPush} from "../../../lib/coachingPush";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const links:Record<string,string>={message_received:"/trainers/messages",connection_requested:"/trainers/connections",connection_approved:"/trainers/live",workout_assigned:"/trainers/client",workout_updated:"/",workout_approved:"/trainers/live",workout_completed:"/trainers/live"};
export async function POST(request:Request){
 const secret=process.env.COACH_NOTIFICATION_WORKER_SECRET||"",provided=request.headers.get("authorization")||"",expected="Bearer "+secret;
 if(!secret||provided.length!==expected.length||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return Response.json({error:"Unauthorized"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key||!process.env.VAPID_PRIVATE_KEY||!process.env.VAPID_PUBLIC_KEY)return Response.json({error:"Push not configured"},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const cutoff=new Date(Date.now()-3600000).toISOString(),now=new Date().toISOString(),stale=new Date(Date.now()-120000).toISOString();
 await db.from("coaching_delivery_queue").update({push_state:"expired"}).in("push_state",["pending","processing"]).lt("created_at",cutoff);
 const filter="push_state.eq.pending,and(push_state.eq.processing,push_lease.lt."+stale+")";
 const {data:rows,error}=await db.from("coaching_delivery_queue").select("*").gte("created_at",cutoff).or(filter).order("created_at").limit(10);
 if(error)return Response.json({error:"Queue unavailable"},{status:500});
 let sent=0,failed=0,skipped=0;
 for(const row of rows||[]){
  const {data:claim}=await db.from("coaching_delivery_queue").update({push_state:"processing",push_lease:now}).eq("id",row.id).or(filter).select("id").maybeSingle();
  if(!claim)continue;
  let state="pending";
  try{
   if(row.event_type==="message_received"){
    const {data:message,error:messageError}=await db.from("coaching_messages").select("trainer_id,client_id,recipient_id,read_at").eq("id",row.id).eq("recipient_id",row.recipient_id).maybeSingle();
    if(messageError)throw messageError;
    let eligible=Boolean(message&&!message.read_at);
    if(message&&eligible){const {data:connection,error:connectionError}=await db.from("trainer_clients").select("id").eq("trainer_id",message.trainer_id).eq("client_id",message.client_id).eq("status","accepted").limit(1);if(connectionError)throw connectionError;eligible=Boolean(connection?.length);}
    if(!eligible){await db.from("coaching_delivery_queue").update({push_state:"skipped",push_lease:null}).eq("id",row.id).eq("push_lease",now);skipped++;continue;}
   }
   const {data:prefs,error:prefError}=await db.from("trainer_notification_preferences").select("*").eq("user_id",row.recipient_id).maybeSingle();
   if(prefError)throw prefError;
   if(prefs?.push_enabled===false||prefs?.[row.event_type]===false){state="skipped";skipped++;}
   else{
    const {data:devices,error:deviceError}=await db.from("coaching_push_devices").select("endpoint,p256dh,auth").eq("user_id",row.recipient_id).lte("updated_at",row.created_at).limit(10);
    if(deviceError)throw deviceError;
    if(!devices?.length){state="skipped";skipped++;}
    else{
     const results=await Promise.all(devices.map(async device=>{
      try{const status=await sendPush(device,{title:"Gym Log",body:row.title,url:links[row.event_type]||"/",tag:"coaching-"+row.id});if(status===404||status===410)await db.from("coaching_push_devices").delete().eq("endpoint",device.endpoint).eq("user_id",row.recipient_id);return status;}catch{return 503;}
     }));
     if(results.every(s=>s>=200&&s<300)){state="sent";sent++;}
     else if(results.some(s=>s>=200&&s<300)){state="partial";sent++;}
     else if(results.some(s=>s>=500||s===429||s===408)){failed++;}
     else{state="failed";failed++;}
    }
   }
  }catch{failed++;}
  await db.from("coaching_delivery_queue").update({push_state:state,push_lease:null}).eq("id",row.id).eq("push_lease",now);
 }
 return Response.json({sent,skipped,failed});
}
