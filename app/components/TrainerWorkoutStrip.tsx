"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "../lib/supabaseClient";
type Plan={id:string;date_key:string;title:string;completed_at:string|null;client_approved_at:string|null};
export default function TrainerWorkoutStrip({userId}:{userId:string|null}){
 const [plans,setPlans]=useState<Plan[]>([]);
 useEffect(()=>{if(!userId){setPlans([]);return;}let active=true;const load=async()=>{const {data,error}=await supabase.from("trainer_planned_workouts").select("id,date_key,title,completed_at,client_approved_at").eq("client_id",userId).order("date_key",{ascending:false}).limit(40);if(active&&!error)setPlans((data||[]) as Plan[])};void load();const onFocus=()=>void load();window.addEventListener("focus",onFocus);return()=>{active=false;window.removeEventListener("focus",onFocus)}},[userId]);
 if(!plans.length)return null;
 const now=new Date();const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 const upcoming=plans.filter(p=>p.date_key>=today).sort((a,b)=>a.date_key.localeCompare(b.date_key)).slice(0,3);
 const visible=upcoming.length?upcoming:plans.slice(0,2);
 const pending=plans.filter(p=>!p.client_approved_at).length;
 return <section aria-label="Trainer assigned workouts" style={{margin:"8px 16px",padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,107,34,.3)",background:"rgba(255,107,34,.07)"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><strong style={{fontSize:14}}>{pending?`${pending} workout${pending===1?"":"s"} awaiting approval`:"From your trainer"}</strong><Link href="/trainers/my-workouts" style={{fontSize:13,fontWeight:700,color:"var(--accent,#ff6b22)"}}>Review assigned workouts →</Link></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>{visible.map(p=><div key={p.id} style={{fontSize:12,padding:"6px 9px",borderRadius:8,background:"rgba(128,128,128,.10)"}}><span style={{color:p.completed_at?"#24a15a":"inherit"}}>{p.completed_at?"●":p.client_approved_at?"◉":"○"}</span> {p.date_key}: {p.title}</div>)}</div></section>;
}
