import {adminClient} from "../trainer-billing/shared";
export const runtime="nodejs";
export async function POST(request:Request){try{
 const token=request.headers.get("authorization")||"";
 if(!token.startsWith("Bearer "))return Response.json({error:"Please sign in first."},{status:401});
 const db=adminClient();const {data:{user},error}=await db.auth.getUser(token.slice(7));if(error||!user?.email_confirmed_at||!user.email)return Response.json({error:"Please sign in with a verified email."},{status:401});
 const raw=await request.text();if(raw.length>12000)return Response.json({error:"Feedback is too long."},{status:413});
 const body=JSON.parse(raw);const category=String(body.category||"");const message=String(body.message||"").trim();
 if(!["Issue","Feature suggestion","Trainer coaching","Billing","Other"].includes(category)||message.length<10||message.length>4000)return Response.json({error:"Enter feedback between 10 and 4000 characters."},{status:400});
 const {data,error:writeError}=await db.rpc("queue_gym_log_feedback",{p_user:user.id,p_category:category,p_message:message});if(writeError)throw writeError;if(!data)return Response.json({error:"Too many submissions. Please try again later."},{status:429});
 return Response.json({ok:true});
 }catch{return Response.json({error:"Unable to submit feedback. Please email info@gymlogapp.com."},{status:500})}}
