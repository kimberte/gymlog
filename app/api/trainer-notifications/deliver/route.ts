import {createClient} from "@supabase/supabase-js";
import {timingSafeEqual} from "node:crypto";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const links:Record<string,string>={message_received:"/trainers/messages",connection_requested:"/trainers/connections",connection_approved:"/trainers/live",workout_assigned:"/trainers/client",workout_updated:"/",workout_approved:"/trainers/live",workout_completed:"/trainers/live"};
export async function POST(request:Request){
 const secret=process.env.COACH_NOTIFICATION_WORKER_SECRET||"";
 const provided=request.headers.get("authorization")||"";
 const expected="Bearer "+secret;
 if(!secret||provided.length!==expected.length||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return Response.json({error:"Unauthorized"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,apiKey=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
 if(!url||!key||!apiKey||!from)return Response.json({error:"Delivery not configured"},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const cutoff=new Date(Date.now()-23*3600000).toISOString(),now=new Date().toISOString(),stale=new Date(Date.now()-120000).toISOString();
 await db.from("coaching_delivery_queue").update({email_state:"expired"}).in("email_state",["pending","processing"]).lt("created_at",cutoff);
 const {data:rows,error}=await db.from("coaching_delivery_queue").select("*").gte("created_at",cutoff).or("email_state.eq.pending,and(email_state.eq.processing,email_lease.lt."+stale+")").order("created_at").limit(10);
 if(error)return Response.json({error:"Queue unavailable"},{status:500});
 let sent=0,skipped=0,failed=0;
 for(const row of rows||[]){
  const {data:claim}=await db.from("coaching_delivery_queue").update({email_state:"processing",email_lease:now}).eq("id",row.id).or("email_state.eq.pending,and(email_state.eq.processing,email_lease.lt."+stale+")").select("id").maybeSingle();
  if(!claim)continue;
  let state="pending";
  try{
   if(row.event_type==="message_received"){
    const {data:message,error:messageError}=await db.from("coaching_messages").select("trainer_id,client_id,recipient_id,read_at").eq("id",row.id).eq("recipient_id",row.recipient_id).maybeSingle();
    if(messageError)throw messageError;
    let eligible=Boolean(message&&!message.read_at);
    if(message&&eligible){const {data:connection,error:connectionError}=await db.from("trainer_clients").select("id").eq("trainer_id",message.trainer_id).eq("client_id",message.client_id).eq("status","accepted").limit(1);if(connectionError)throw connectionError;eligible=Boolean(connection?.length);}
    if(!eligible){await db.from("coaching_delivery_queue").update({email_state:"skipped",email_lease:null}).eq("id",row.id).eq("email_lease",now);skipped++;continue;}
   }
   const {data:prefs,error:prefError}=await db.from("trainer_notification_preferences").select("*").eq("user_id",row.recipient_id).maybeSingle();
   if(prefError)throw prefError;
   if(prefs?.email_enabled===false||prefs?.[row.event_type]===false||(row.event_type==="message_received"&&prefs?.message_email_enabled===false)){state="skipped";skipped++;}
   else{
    const {data:{user},error:userError}=await db.auth.admin.getUserById(row.recipient_id);
    if(userError)throw userError;
    if(!user?.email||!user.email_confirmed_at){state="skipped";skipped++;}
    else{
     const path=links[row.event_type]||"/";
     const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json","Idempotency-Key":"coaching-event-"+row.id},body:JSON.stringify({from:"Gym Log <"+from+">",to:[user.email],subject:row.title,text:row.title+".\n\n"+(row.event_type==="message_received"?"Sign in to Gym Log to read your private message:":"Open Gym Log to review your training updates:")+"\nhttps://www.gymlogapp.com"+path+"\n\nManage notifications in your account settings."}),signal:AbortSignal.timeout(4000)});
     if(result.ok){state="sent";sent++;}else{failed++;if(result.status>=400&&result.status<500&&![408,409,429].includes(result.status))state="failed";}
    }
   }
  }catch{failed++;}
  await db.from("coaching_delivery_queue").update({email_state:state,email_lease:null}).eq("id",row.id).eq("email_lease",now);
 }
 return Response.json({sent,skipped,failed});
}
