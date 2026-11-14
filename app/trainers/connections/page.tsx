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
 const refresh=async()=>{const {data,error}=await supabase.from("trainer_clients").select("id,trainer_id,invited_email,status,client_id").order("created_at",{ascending:false});if(error){setStatus(error.message);return;}setRequests((data||[]) as Request[]);setStatus("")};
 useEffect(()=>{let mounted=true;(async()=>{const {data:{user},error}=await supabase.auth.getUser();if(!mounted)return;if(error||!user){setStatus("Sign in to Gym Log to review trainer requests.");return;}setUid(user.id);await refresh()})();return()=>{mounted=false}},[]);
 const approve=async(r:Request)=>{if(!uid)return;setBusy(r.id);const {error}=await supabase.from("trainer_clients").update({client_id:uid,status:"accepted",accepted_at:new Date().toISOString()}).eq("id",r.id).eq("status","pending");setBusy("");if(error)setStatus(error.message);else await refresh()};
 const revoke=async(r:Request)=>{setBusy(r.id);const {error}=await supabase.from("trainer_clients").delete().eq("id",r.id);setBusy("");if(error)setStatus(error.message);else await refresh()};
 return <main className="trainer-shell"><header className="trainer-hero"><div><span className="trainer-eyebrow">GYM LOG / CLIENT SETTINGS</span><h1>Trainer connections</h1><p>Only you decide who can manage your training calendar.</p></div><Link href="/">Back to Gym Log</Link></header><section className="trainer-main"><h2>Your trainer requests</h2>{status&&<p role="status">{status}</p>}{!status&&requests.length===0&&<p>No trainer connections or requests yet.</p>}{requests.map(r=><div className="trainer-next" key={r.id}><h3>{r.status==="accepted"?"Connected trainer":"Trainer access request"}</h3><p>Trainer account: {r.trainer_id}</p><p>{r.status==="accepted"?"This trainer can view and assign your training plans.":"Approving allows this trainer to view and manage your assigned training plans."}</p><div className="trainer-editor-actions">{r.status==="pending"&&<button className="trainer-action" disabled={busy===r.id} onClick={()=>approve(r)}>Approve access</button>}<button disabled={busy===r.id} onClick={()=>revoke(r)}>{r.status==="accepted"?"Disconnect trainer":"Decline"}</button></div></div>)}</section></main>;
}
