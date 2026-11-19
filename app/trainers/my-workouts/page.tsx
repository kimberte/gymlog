"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import "../trainer-dashboard.css";
type Plan={id:string;trainer_id:string;client_id:string;date_key:string;title:string;exercises:string[];completed_at:string|null};
export default function MyTrainerWorkouts(){
 const [plans,setPlans]=useState<Plan[]>([]);
 const [status,setStatus]=useState("Loading your assigned workouts…");
 const [busy,setBusy]=useState("");
 const [uid,setUid]=useState("");
 const refresh=async(id:string)=>{const {data,error}=await supabase.from("trainer_planned_workouts").select("id,trainer_id,client_id,date_key,title,exercises,completed_at").eq("client_id",id).order("date_key",{ascending:false});if(error){setStatus(error.message);return;}setPlans((data||[]) as Plan[]);setStatus("")};
 useEffect(()=>{let mounted=true;(async()=>{const {data:{session}}=await supabase.auth.getSession();if(!mounted)return;if(!session?.user){setStatus("Sign in to Gym Log on this domain to view your trainer workouts.");return;}setUid(session.user.id);await refresh(session.user.id)})();return()=>{mounted=false}},[]);
 const toggle=async(p:Plan)=>{setBusy(p.id);setStatus("");const {error}=await supabase.rpc("set_trainer_workout_completion",{p_workout_id:p.id,p_completed:!p.completed_at});setBusy("");if(error)setStatus(error.message);else await refresh(uid)};
 return <main className="trainer-shell"><header className="trainer-hero"><div><span className="trainer-eyebrow">GYM LOG / MY TRAINING</span><h1>Trainer workouts</h1><p>Workouts assigned by your connected trainer.</p></div><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><Link href="/trainers/connections">My trainers</Link><Link href="/">Calendar</Link></div></header><section className="trainer-main" style={{maxWidth:850}}>{status&&<p role="status">{status}</p>}{!status&&!plans.length&&<div className="trainer-next"><h3>No trainer workouts yet</h3><p>Once you approve a trainer connection and they assign a workout, it will appear here.</p><Link href="/trainers/connections">Manage trainer connections</Link></div>}{plans.map(p=><article key={p.id} className="trainer-next" style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><small>{p.date_key}</small><h3 style={{margin:"4px 0"}}>{p.title}</h3></div><span style={{color:p.completed_at?"#22a05a":"inherit",fontWeight:700}}>{p.completed_at?"● Completed":"○ Scheduled"}</span></div>{p.exercises.length>0&&<ul style={{paddingLeft:20}}>{p.exercises.map((ex,i)=><li key={i}>{ex}</li>)}</ul>}<button className="trainer-action" disabled={busy===p.id} onClick={()=>toggle(p)}>{busy===p.id?"Saving…":p.completed_at?"Mark incomplete":"Mark workout complete"}</button></article>)}</section></main>
}
