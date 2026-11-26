"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "../lib/supabaseClient";
type Plan={id:string;date_key:string;title:string;pending_revision:{token:string}|null};
export default function TrainerWorkoutStrip({userId}:{userId:string|null}){
 const [plans,setPlans]=useState<Plan[]>([]);
 const [connected,setConnected]=useState(false);
 const [dismissed,setDismissed]=useState("");
 useEffect(()=>{setPlans([]);setConnected(false);setDismissed("");if(!userId)return;let active=true;const load=async()=>{
 const [workouts,connections]=await Promise.all([supabase.from("trainer_planned_workouts").select("id,date_key,title,pending_revision").eq("client_id",userId).or("client_approved_at.is.null,pending_revision.not.is.null").is("client_removed_at",null).order("date_key"),supabase.from("trainer_clients").select("id",{count:"exact",head:true}).eq("client_id",userId).eq("status","accepted")]);
 if(active&&!workouts.error)setPlans(workouts.data||[]);if(active&&!connections.error)setConnected(Boolean(connections.count));
 };void load();const timer=window.setInterval(load,15000);window.addEventListener("focus",load);return()=>{active=false;window.clearInterval(timer);window.removeEventListener("focus",load)}},[userId]);
 const signature=plans.map(p=>p.id+":"+(p.pending_revision?.token||"new")).sort().join(",");
 const pending=plans.length>0&&dismissed!==signature;
 if(!connected&&!pending)return null;
 return <section aria-label="My coaching" style={{margin:"8px 16px",padding:pending?"12px 14px":"8px 12px",borderRadius:12,border:"1px solid var(--border)",background:pending?"rgba(255,107,34,.07)":"var(--surface)"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><strong style={{fontSize:13}}>{pending?plans.length+" workout"+(plans.length===1?"":"s")+" awaiting approval":"My coaching"}</strong>{!pending&&<span style={{display:"block",fontSize:11,color:"var(--muted)"}}>Your coach, training and progress</span>}</div><Link href={pending?"/trainers/client#workouts":"/trainers/client"} style={{fontSize:13,fontWeight:700,color:"var(--accent,#ff6b22)"}}>{pending?"Review workouts →":"Open coaching →"}</Link>{pending&&<button type="button" aria-label="Dismiss assigned workouts notification" onClick={()=>setDismissed(signature)}>×</button>}</div></section>;
}
