import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(request:Request){
 const token=request.headers.get("authorization");
 if(!token?.startsWith("Bearer "))return Response.json({error:"Sign in first."},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return Response.json({error:"Authentication not configured."},{status:503});
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await supabase.auth.getUser(token.slice(7));
 if(error||!user?.email||!user.email_confirmed_at)return Response.json({error:"A verified email account is required."},{status:401});
 const apiKey=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
 if(!apiKey||!from)return Response.json({error:"Email delivery not configured."},{status:503});
 const slot=Math.floor(Date.now()/300000);
 const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json","Idempotency-Key":"gym-log-test-"+user.id+"-"+slot},body:JSON.stringify({from:"Gym Log <"+from+">",to:[user.email],subject:"Gym Log notification test",text:"Your Gym Log email notification test was requested from your account settings. Open https://www.gymlogapp.com/trainers/notifications to manage your preferences."})});
 if(!result.ok)return Response.json({error:"Email provider rejected the request. Check Resend logs."},{status:502});
 return Response.json({ok:true,message:"Test email accepted by Resend. Check your inbox and spam folder. Repeated requests within five minutes are deduplicated."});
}
