"use client";
import { useEffect,useMemo,useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import "../trainer-dashboard.css";
import {loadWorkouts,saveWorkouts} from "../../lib/storage";
import {prescriptionDraft} from "../../lib/structuredCoaching";
import {removeStructuredBlock} from "../../lib/structuredNotes";
type Revision={token:string;title:string;exercises:unknown[]};
type Plan={pending_revision:Revision|null;id:string;trainer_id:string;client_id:string;date_key:string;title:string;exercises:unknown[];performance_log:Record<string,string>|null;completed_at:string|null;client_approved_at:string|null};
export default function MyTrainerWorkouts(){
 const [plans,setPlans]=useState<Plan[]>([]);
 const [status,setStatus]=useState("Loading your assigned workouts…");
 const [busy,setBusy]=useState("");
 const [uid,setUid]=useState("");
 const [expandedMonths,setExpandedMonths]=useState<Record<string,boolean>>({});
 const [showPast,setShowPast]=useState(false);
 const now=new Date();const currentMonth=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
 const months=useMemo(()=>{const groups=new Map<string,Plan[]>();for(const plan of [...plans].sort((a,b)=>a.date_key.localeCompare(b.date_key))){const month=plan.date_key.slice(0,7);groups.set(month,[...(groups.get(month)||[]),plan]);}return [...groups.entries()];},[plans]);
 const upcoming=months.filter(([month])=>month>=currentMonth);const past=months.filter(([month])=>month<currentMonth).reverse();const pastPending=past.reduce((n,[,items])=>n+items.filter(p=>!p.client_approved_at||p.pending_revision).length,0);

 const refresh=async(id:string)=>{const {data,error}=await supabase.from("trainer_planned_workouts").select("id,trainer_id,client_id,date_key,title,exercises,performance_log,completed_at,client_approved_at,pending_revision").eq("client_id",id).is("client_removed_at",null).order("date_key",{ascending:false});if(error){setStatus(error.message);return;}setPlans((data||[]) as Plan[]);setStatus("")};
 useEffect(()=>{let mounted=true;(async()=>{const {data:{session}}=await supabase.auth.getSession();if(!mounted)return;if(!session?.user){setStatus("Sign in to Gym Log on this domain to view your trainer workouts.");return;}setUid(session.user.id);await refresh(session.user.id)})();return()=>{mounted=false}},[]);
 const exerciseText=(ex:unknown)=>typeof ex==="string"?ex:ex&&typeof ex==="object"?("name" in ex&&typeof ex.name==="string"?ex.name:JSON.stringify(ex)):String(ex);
 const isPending=(p:Plan)=>!p.client_approved_at||Boolean(p.pending_revision);
 const approve=async(items:Plan[],key:string)=>{
  if(!items.length||busy)return;
  const map=loadWorkouts();const counts:Record<string,number>={};
  for(const p of items){const entries=map[p.date_key]?.entries||[];counts[p.date_key]=(counts[p.date_key]??entries.length)+(entries.some(e=>e.id==="trainer_"+p.id)?0:1);if(counts[p.date_key]>3){setStatus("A date already has 3 workouts. Free up space before approving.");return;}}
  setBusy(key);setStatus("");
  const {error}=await supabase.rpc("approve_trainer_reviews",{p_reviews:items.map(p=>({id:p.id,token:p.pending_revision?.token??null}))});
  if(error){await refresh(uid);setStatus("Approval failed: "+error.message);setBusy("");return;}
  const latest=loadWorkouts();
  for(const p of items){
   const entries=latest[p.date_key]?.entries||[],id="trainer_"+p.id,old=entries.find(e=>e.id===id);
   const title=p.pending_revision?.title??p.title,prescription=(p.pending_revision?.exercises??p.exercises).map(exerciseText).join("\n");
   const notes=old&&old.notes!==old.trainerPrescription&&old.notes!==p.exercises.map(exerciseText).join("\n")?removeStructuredBlock(old.notes):"";
   const structured=prescriptionDraft(title,p.pending_revision?.exercises??p.exercises);
   if(old){latest[p.date_key]={...latest[p.date_key],entries:entries.map(e=>e.id===id?{...e,title,notes,mode:"structured" as const,structured,trainerPrescription:prescription}:e)};}
   else if(entries.length<3){latest[p.date_key]={...(latest[p.date_key]||{}),entries:[...entries,{id,title,notes,mode:"structured",structured,trainerPrescription:prescription,createdAt:new Date().toISOString()}]};}
  }
  saveWorkouts(latest);await refresh(uid);setBusy("");setStatus(items.length===1?"Workout approved and calendar updated.":items.length+" workouts approved and calendar updated.");
 };
 const approveImport=(p:Plan)=>approve([p],p.id);
 const visiblePending=plans.filter(p=>isPending(p)&&(showPast||p.date_key.slice(0,7)>=currentMonth));
 const approveAll=()=>approve(visiblePending,"all");
 return <main className="trainer-shell"><header className="trainer-hero"><div><span className="trainer-eyebrow">GYM LOG / MY TRAINING</span><h1>Review assigned workouts</h1><p>Approve your trainer’s workouts here, then use your regular calendar to log training and mark sessions complete.</p></div><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><Link href="/trainers/client">Client portal</Link><Link href="/">Calendar</Link></div></header><section className="trainer-main" style={{maxWidth:850}}>{status&&<p role="status">{status}</p>}{!status&&!plans.length&&<div className="trainer-next"><h3>No trainer workouts yet</h3><p>Once you approve a trainer connection and they assign a workout, it will appear here.</p><Link href="/trainers/client">Manage trainer connections</Link></div>}{visiblePending.length>0&&<div style={{marginBottom:14}}><button className="trainer-action" disabled={Boolean(busy)} onClick={approveAll}>Approve all {visiblePending.length} {showPast?"visible":"current & upcoming"} workouts</button></div>}{[...upcoming,...(showPast?past:[])].map(([month,monthPlans],index)=>{const pending=monthPlans.filter(isPending).length;const expanded=expandedMonths[month]??(month>=currentMonth&&index===0);const label=new Date(Number(month.slice(0,4)),Number(month.slice(5,7))-1,1).toLocaleDateString("en-US",{month:"long",year:"numeric"});return <section key={month} style={{marginBottom:12}}>{index===upcoming.length&&showPast&&<h3>Past training</h3>}<button type="button" aria-expanded={expanded} onClick={()=>setExpandedMonths(prev=>({...prev,[month]:!expanded}))} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"15px 16px",borderRadius:12,border:"1px solid var(--border,#555)",background:"var(--surface,#202126)",color:"inherit",textAlign:"left",cursor:"pointer"}}><span><strong>{label}</strong><span style={{display:"block",fontSize:12,opacity:.75,marginTop:4}}>{monthPlans.length} workouts · {pending?pending+" awaiting approval": "All approved"}</span></span><span aria-hidden="true">{expanded?"▾":"▸"}</span></button>{expanded&&<div style={{paddingTop:10}}>{monthPlans.map(p=><article key={p.id} className="trainer-next" style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><small>{p.date_key}</small><h3 style={{margin:"4px 0"}}>{p.title}</h3></div><span style={{color:p.completed_at?"#22a05a":"inherit",fontWeight:700}}>{p.pending_revision?"○ Revision awaiting approval":p.completed_at?"● Completed":p.client_approved_at?"● Accepted":"○ Awaiting approval"}</span></div>{p.exercises.length>0&&<ul style={{paddingLeft:20}}>{p.exercises.map((ex,i)=><li key={i} style={{marginBottom:6}}>{exerciseText(ex)}</li>)}</ul>}<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:12}}>{p.pending_revision&&<section style={{marginTop:12,padding:12,border:"1px solid var(--border)",borderRadius:10}}><strong>Proposed replacement: {p.pending_revision.title}</strong><p className="trainer-hint">Your original workout above stays in your calendar until you approve this revision.</p><ul style={{paddingLeft:20}}>{p.pending_revision.exercises.map((ex,i)=><li key={i}>{exerciseText(ex)}</li>)}</ul></section>}{p.client_approved_at&&<Link href="/">View calendar</Link>}{isPending(p)&&<button className="trainer-action" disabled={Boolean(busy)} onClick={()=>approveImport(p)}>{p.pending_revision?"Approve replacement":"Approve & import to calendar"}</button>}</div></article>)}</div>}</section>})}{past.length>0&&<button type="button" className="trainer-outline-button" aria-expanded={showPast} onClick={()=>setShowPast(v=>!v)}>{showPast?"Hide":"Show"} past months ({past.length}){pastPending? " · "+pastPending+" awaiting approval":""}</button>}</section></main>
}
