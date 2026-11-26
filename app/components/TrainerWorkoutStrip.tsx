"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "../lib/supabaseClient";
type Plan={id:string;date_key:string;title:string;pending_revision:{token:string}|null};
export default function TrainerWorkoutStrip({userId}:{userId:string|null}){
 const [plans,setPlans]=useState<Plan[]>([]);
 const [dismissed,setDismissed]=useState("");
 useEffect(()=>{setPlans([]);setDismissed("");if(!userId)return;let active=true;const load=async()=>{const {data,error}=await supabase.from("trainer_planned_workouts").select("id,date_key,title,pending_revision").eq("client_id",userId).or("client_approved_at.is.null,pending_revision.not.is.null").is("client_removed_at",null).order("date_key");if(active&&!error)setPlans(data||[])};void load();const timer=window.setInterval(load,15000);window.addEventListener("focus",load);return()=>{active=false;window.clearInterval(timer);window.removeEventListener("focus",load)}},[userId]);
 const signature=plans.map(p=>p.id+":"+(p.pending_revision?.token||"new")).sort().join(",");
 if(!plans.length||dismissed===signature)return null;
 return <section aria-label="Trainer assigned workouts" style={{margin:"8px 16px",padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,107,34,.3)",background:"rgba(255,107,34,.07)"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><strong style={{fontSize:14}}>{plans.length} workout{plans.length===1?"":"s"} awaiting approval</strong><Link href="/trainers/client" style={{fontSize:13,fontWeight:700,color:"var(--accent,#ff6b22)"}}>Review in client portal →</Link><button type="button" aria-label="Dismiss assigned workouts notification" onClick={()=>setDismissed(signature)}>×</button></div></section>;
}
