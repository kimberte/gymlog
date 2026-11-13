"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

type Invitation = { id:string; invited_email:string; status:string; trainer_id:string; client_id:string|null };

const demoClients = [
 {name:"Sarah Mitchell",goal:"Strength & conditioning",days:4},
 {name:"James Wilson",goal:"Powerbuilding",days:4},
 {name:"Emily Parker",goal:"Glute growth",days:4},
 {name:"Alex Rivera",goal:"General fitness",days:3},
 {name:"Jordan Lee",goal:"Hypertrophy",days:5},
 {name:"Taylor Brooks",goal:"Strength training",days:3}
];
const demoTitles=["Lower Body Strength","Upper Body Push","Pull & Core","Full Body Hypertrophy","Conditioning"];
function isoDay(offset:number){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function sampleSessions(client:number){return [-12,-10,-8,-5,-3,-1,1,3,5,8,10].map((offset,i)=>({date:isoDay(offset),title:demoTitles[(i+client)%demoTitles.length],complete:offset<0&&(i+client)%4!==0,notes:offset<0?"Bench press 3 × 8; Squat 4 × 6; Lat pulldown 3 × 12. RPE 7–8.":"Warm up 10 min. Squat 4 × 6; Dumbbell press 3 × 10; Row 3 × 12. Track sets, reps and weight."}))}
function DemoRoster(){
 const [client,setClient]=useState(0);
 const [search,setSearch]=useState("");
 const [selectedDay,setSelectedDay]=useState<string|null>(null);
 const [month,setMonth]=useState(0);
 const sessions=sampleSessions(client);
 const base=new Date();const shown=new Date(base.getFullYear(),base.getMonth()+month,1);
 const first=(shown.getDay()+6)%7;
 const days=new Date(shown.getFullYear(),shown.getMonth()+1,0).getDate();
 const cells=Array.from({length:first+days},(_,i)=>i-first+1);
 const chosen=sessions.find(s=>s.date===selectedDay);
 const tile={border:"1px solid #8885",borderRadius:12,padding:14} as const;
 return <section style={{marginTop:28}}>
 <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><h2 style={{margin:0}}>Sample clients</h2><span style={{fontSize:12,border:"1px solid #f97316",borderRadius:18,color:"#f97316",padding:"4px 9px"}}>DEMO · Fictional data</span></div>
 <p style={{color:"#777"}}>Explore six example coaching profiles. These are not real Gym Log users and cannot access or change anyone’s workouts.</p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))",gap:14}}>
 <div style={tile}><label style={{display:"block",marginBottom:8}}>Find a client</label><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sample clients" style={{width:"100%",boxSizing:"border-box",padding:12,border:"1px solid #8887",borderRadius:8,background:"transparent",color:"inherit"}}/>
 <div style={{display:"grid",gap:6,marginTop:12}}>{demoClients.map((p,i)=>p.name.toLowerCase().includes(search.toLowerCase())?<button key={p.name} onClick={()=>{setClient(i);setSelectedDay(null)}} style={{textAlign:"left",padding:12,border:"1px solid "+(client===i?"#f97316":"#8883"),borderRadius:8,background:client===i?"#f973161c":"transparent",color:"inherit",cursor:"pointer"}}><strong style={{display:"block"}}>{p.name}</strong><span style={{fontSize:12,opacity:.7}}>{p.goal} · {p.days} days/week</span></button>:null)}</div></div>
 <div style={{...tile,minWidth:0}}>
 <h3 style={{marginTop:0}}>{demoClients[client].name}</h3><p style={{opacity:.7,marginTop:0}}>{demoClients[client].goal} · {sessions.filter(s=>s.complete).length} completed workouts</p>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><button aria-label="Previous month" onClick={()=>{setMonth(m=>m-1);setSelectedDay(null)}} style={{padding:"7px 12px"}}>‹</button><strong>{shown.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</strong><button aria-label="Next month" onClick={()=>{setMonth(m=>m+1);setSelectedDay(null)}} style={{padding:"7px 12px"}}>›</button></div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:4}}>{["M","T","W","T","F","S","S"].map((x,i)=><div key={i} style={{textAlign:"center",fontSize:12,opacity:.6}}>{x}</div>)}{cells.map((d,i)=>{if(d<1)return <div key={"empty"+i}/>;const key=shown.getFullYear()+"-"+String(shown.getMonth()+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");const session=sessions.find(s=>s.date===key);return <button key={key} onClick={()=>setSelectedDay(key)} style={{minWidth:0,aspectRatio:"1",border:selectedDay===key?"2px solid #f97316":"1px solid #8883",borderRadius:7,background:"transparent",color:"inherit",padding:2,cursor:"pointer",fontSize:12}}>{d}{session&&<span style={{display:"block",width:7,height:7,margin:"2px auto 0",borderRadius:"50%",background:session.complete?"#22c55e":key>isoDay(0)?"#9ca3af":"#f97316"}}/>}</button>})}</div>
 <p style={{fontSize:11,opacity:.7}}>🟢 Completed · 🟠 Not completed · ⚪ Upcoming</p>
 {selectedDay&&<div style={{borderTop:"1px solid #8884",paddingTop:12}}><strong>{selectedDay}</strong>{chosen?<><h4 style={{margin:"10px 0 4px"}}>{chosen.title}</h4><p style={{whiteSpace:"pre-wrap",fontSize:13}}>{chosen.notes}</p><strong style={{color:chosen.complete?"#22c55e":"inherit"}}>{chosen.complete?"✓ Completed":"Not completed"}</strong></>:<p>No workout scheduled for this date.</p>}</div>}
 </div></div></section>
}

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
    <DemoRoster />
   </section>}
   {message&&<p role="status">{message}</p>}
  </>}
 </main>;
}
