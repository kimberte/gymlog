"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

type Invitation = { id:string; invited_email:string; status:string; trainer_id:string; client_id:string|null };
export default function TrainersPage() {
 const [userId,setUserId]=useState<string|null>(null);
 const [email,setEmail]=useState("");
 const [name,setName]=useState("");
 const [profile,setProfile]=useState(false);
 const [status,setStatus]=useState("inactive");
 const [trialEnds,setTrialEnds]=useState<string|null>(null);
 const [termsAccepted,setTermsAccepted]=useState(false);
 const [invites,setInvites]=useState<Invitation[]>([]);
 const [incoming,setIncoming]=useState<Invitation[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const refresh=useCallback(async (id:string)=>{
  const [p,out,inc]=await Promise.all([
   supabase.from("trainer_profiles").select("user_id,display_name,subscription_status,trial_ends_at").eq("user_id",id).maybeSingle(),
   supabase.from("trainer_clients").select("id,invited_email,status,trainer_id,client_id").eq("trainer_id",id),
   supabase.from("trainer_clients").select("id,invited_email,status,trainer_id,client_id").eq("status","pending")
  ]);
  setProfile(Boolean(p.data));setName(p.data?.display_name??"");setStatus(p.data?.subscription_status??"inactive");setTrialEnds(p.data?.trial_ends_at??null);
  setInvites(out.data??[]);
  // RLS limits pending invitations to the signed-in recipient or trainer.
  setIncoming((inc.data??[]).filter((x)=>x.trainer_id!==id));
 },[]);
 useEffect(()=>{
  let mounted=true;
  supabase.auth.getUser().then(({data})=>{if(mounted){const id=data.user?.id??null;setUserId(id);if(id)void refresh(id);}});
  const {data:sub}=supabase.auth.onAuthStateChange((_event,session)=>{const id=session?.user.id??null;setUserId(id);if(id)void refresh(id);});
  return ()=>{mounted=false;sub.subscription.unsubscribe();};
 },[refresh]);
 async function createProfile(){
  if(!userId)return;setBusy(true);setMessage("");
  const {error}=await supabase.rpc("start_trainer_trial",{p_display_name:name.trim(),p_terms_accepted:termsAccepted});
  setBusy(false);if(error){setMessage(error.message);return;}await refresh(userId);
 }
 async function invite(){
  if(!userId||!email.trim())return;setBusy(true);setMessage("");
  const {error}=await supabase.from("trainer_clients").insert({trainer_id:userId,invited_email:email.trim().toLowerCase(),status:"pending"});
  setBusy(false);setMessage(error?error.message:"Invitation created. Email delivery will be added in the next phase.");
  if(!error){setEmail("");await refresh(userId);}
 }
 async function accept(id:string){
  if(!userId)return;setBusy(true);setMessage("");
  const {error}=await supabase.rpc("accept_trainer_invitation",{p_invitation_id:id});
  setBusy(false);setMessage(error?error.message:"Trainer access approved.");await refresh(userId);
 }
 return <main style={{maxWidth:900,margin:"0 auto",padding:"32px 20px",fontFamily:"system-ui,sans-serif"}}>
  <Link href="/" style={{color:"#f97316"}}>← Gym Log</Link>
  <h1 style={{fontSize:34,marginBottom:8}}>Gym Log for Trainers</h1>
  <p style={{color:"#777"}}>Manage your coaching relationships. Client calendar editing is coming in the next development phase.</p>
  {!userId?<section><h2>Sign in to Gym Log</h2><p>Use your existing Gym Log account to access the trainer portal.</p><Link href="/?auth=login" style={{color:"#f97316"}}>Go to Gym Log sign in</Link></section>:<>
   {incoming.length>0&&<section><h2>Trainer invitations awaiting your approval</h2>{incoming.map(x=><div key={x.id} style={{padding:12,border:"1px solid #777",marginBottom:8,borderRadius:8}}><span>Trainer account: {x.trainer_id.slice(0,8)}…</span> <button disabled={busy} onClick={()=>void accept(x.id)}>Approve access</button></div>)}</section>}
   {!profile?<section><h2>Create your trainer profile</h2><label>Display name <input value={name} onChange={e=>setName(e.target.value)} maxLength={120} style={{padding:10,margin:10}} /></label><p>Start with 30 days free. No payment is collected during the trial. When the trial ends, a paid subscription will be required to continue using trainer features; we will show the price and ask you to authorize billing before any charge.</p><label style={{display:"block",margin:"12px 0"}}><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} /> I agree to start a 30-day free trainer trial and understand that continued access afterward requires a separately authorized paid subscription.</label><button disabled={busy||!name.trim()||!termsAccepted} onClick={()=>void createProfile()}>Start free 30-day trial</button></section>:<section>
    <h2>My clients</h2>
    <p>Subscription: {status}{trialEnds?` · Trial ends ${new Date(trialEnds).toLocaleDateString()}`:""} · {invites.filter(x=>x.status==="accepted").length} connected clients</p>
    <label>Invite client by email <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="client@example.com" style={{padding:10,margin:10}} /></label>
    <button disabled={busy||!email.includes("@")} onClick={()=>void invite()}>Add client</button>
    <div style={{marginTop:20}}>{invites.length===0?"No invitations yet.":invites.map(x=><div key={x.id} style={{padding:14,border:"1px solid #777",borderRadius:8,marginBottom:8}}><strong>{x.invited_email}</strong><span style={{marginLeft:12}}>{x.status}</span></div>)}</div>
   </section>}
   {message&&<p role="status">{message}</p>}
  </>}
 </main>;
}
