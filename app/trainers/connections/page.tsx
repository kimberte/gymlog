"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import "../trainer-dashboard.css";
type Request={id:string;trainer_id:string;invited_email:string;status:string;client_id:string|null};
export default function TrainerConnections(){
 const [requests,setRequests]=useState<Request[]>([]);
 const [status,setStatus]=useState("Checking your account…");
 const [uid,setUid]=useState<string|null>(null);
 const [busy,setBusy]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [signedOut,setSignedOut]=useState(false);
 const refresh=async()=>{const {data,error}=await supabase.from("trainer_clients").select("id,trainer_id,invited_email,status,client_id").order("created_at",{ascending:false});if(error){setStatus(error.message);return;}setRequests((data||[]) as Request[]);setStatus("")};
 useEffect(()=>{let mounted=true;(async()=>{const {data:{session}}=await supabase.auth.getSession();if(!mounted)return;if(!session?.user){setSignedOut(true);setStatus("Sign in on this preview to review your trainer requests.");return;}const user=session.user;setUid(user.id);await refresh()})();return()=>{mounted=false}},[]);
 const signIn=async()=>{setBusy("login");setStatus("");const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});setBusy("");if(error||!data.user){setStatus(error?.message||"Unable to sign in.");return;}setUid(data.user.id);setSignedOut(false);setPassword("");await refresh();};
 const approve=async(r:Request)=>{if(!uid)return;setBusy(r.id);const {error}=await supabase.from("trainer_clients").update({client_id:uid,status:"accepted",accepted_at:new Date().toISOString()}).eq("id",r.id).eq("status","pending");setBusy("");if(error)setStatus(error.message);else await refresh()};
 const revoke=async(r:Request)=>{setBusy(r.id);const {error}=await supabase.from("trainer_clients").delete().eq("id",r.id);setBusy("");if(error)setStatus(error.message);else await refresh()};
 return <main className="trainer-shell"><header className="trainer-hero"><div><span className="trainer-eyebrow">GYM LOG / CLIENT SETTINGS</span><h1>Trainer connections</h1><p>Only you decide who can manage your training calendar.</p></div><Link href="/">Back to Gym Log</Link></header><section className="trainer-main"><h2>Your trainer requests</h2>{signedOut&&<div className="trainer-editor"><h3>Sign in to this preview</h3><p className="trainer-hint">Signing into gymlogapp.com does not automatically sign you into a separate Vercel preview domain. Use your existing Gym Log credentials here; do not create another account.</p><label>Email<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="trainer-action" disabled={busy==="login"||!email||!password} onClick={signIn}>Sign in and review requests</button></div>}{status&&<p role="status">{status}</p>}{!signedOut&&!status&&requests.length===0&&<p>No trainer connections or requests yet.</p>}{!signedOut&&requests.map(r=><div className="trainer-next" key={r.id}><h3>{r.status==="accepted"?"Connected trainer":"Trainer access request"}</h3><p>Trainer account: {r.trainer_id}</p><p>{r.status==="accepted"?"This trainer can view and assign your training plans.":"Approving allows this trainer to view and manage your assigned training plans."}</p><div className="trainer-editor-actions">{r.status==="pending"&&<button className="trainer-action" disabled={busy===r.id} onClick={()=>approve(r)}>Approve access</button>}<button disabled={busy===r.id} onClick={()=>revoke(r)}>{r.status==="accepted"?"Disconnect trainer":"Decline"}</button></div></div>)}</section></main>;
}
