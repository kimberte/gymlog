import {adminClient} from "../api/trainer-billing/shared";
export async function deliverOwnerAlerts(){
 const apiKey=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
 if(!apiKey||!from)return {sent:0,failed:0};
 const db=adminClient(),now=new Date().toISOString(),stale=new Date(Date.now()-120000).toISOString();
 const {data:rows,error}=await db.from("gym_log_owner_alerts").select("id,subject,body").or("state.eq.pending,and(state.eq.processing,lease.lt."+stale+")").order("created_at").limit(3);
 if(error)return {sent:0,failed:1};
 let sent=0,failed=0;
 for(const row of rows||[]){
 const {data:claim}=await db.from("gym_log_owner_alerts").update({state:"processing",lease:now}).eq("id",row.id).or("state.eq.pending,and(state.eq.processing,lease.lt."+stale+")").select("id").maybeSingle();
 if(!claim)continue;
 let state="pending";
 try{const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json","Idempotency-Key":"gym-owner-"+row.id},body:JSON.stringify({from:"Gym Log <"+from+">",to:["info@gymlogapp.com"],subject:row.subject,text:row.body}),signal:AbortSignal.timeout(4000)});if(result.ok){state="sent";sent++;}else{failed++;if(result.status>=400&&result.status<500&&![408,409,429].includes(result.status))state="failed";}}catch{failed++}
 await db.from("gym_log_owner_alerts").update({state,lease:null}).eq("id",row.id).eq("lease",now);
 }
 return {sent,failed};
}
