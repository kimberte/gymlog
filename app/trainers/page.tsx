"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import "./trainer-dashboard.css";

type Session = { date: string; title: string; exercises: string[]; done?: boolean };
type Client = { id: string; name: string; initials: string; goal: string; level: string; color: string; sessions: Session[] };
const demo: Client[] = [
  { id:"demo-ava",name:"Ava Thompson",initials:"AT",goal:"Glute & lower-body strength",level:"Intermediate",color:"#fb923c",sessions:[{date:"2026-11-16",title:"Lower A · Glutes",exercises:["Hip thrust · 4 × 8","Romanian deadlift · 3 × 10","Bulgarian split squat · 3 × 10","Cable kickback · 3 × 12"]},{date:"2026-11-18",title:"Upper · Back",exercises:["Lat pulldown · 4 × 10","Dumbbell row · 3 × 10","Incline press · 3 × 10"]},{date:"2026-11-20",title:"Lower B · Quads",exercises:["Squat · 4 × 6","Leg press · 3 × 12","Leg extension · 3 × 12"]}] },
  { id:"demo-marcus",name:"Marcus Lee",initials:"ML",goal:"Strength & powerbuilding",level:"Advanced",color:"#60a5fa",sessions:[{date:"2026-11-16",title:"Heavy Bench",exercises:["Bench press · 5 × 5","Incline dumbbell press · 3 × 8","Triceps pushdown · 3 × 12"]},{date:"2026-11-19",title:"Deadlift & Pull",exercises:["Deadlift · 4 × 4","Pull-up · 4 × 6","Barbell row · 3 × 8"]}] },
  { id:"demo-sophia",name:"Sophia Patel",initials:"SP",goal:"General fitness",level:"Beginner",color:"#a78bfa",sessions:[{date:"2026-11-17",title:"Full Body A",exercises:["Goblet squat · 3 × 10","Dumbbell press · 3 × 10","Seated row · 3 × 12"]},{date:"2026-11-20",title:"Full Body B",exercises:["Leg press · 3 × 12","Lat pulldown · 3 × 10","Dumbbell RDL · 3 × 10"]}] },
  { id:"demo-jordan",name:"Jordan Brooks",initials:"JB",goal:"Hypertrophy",level:"Intermediate",color:"#34d399",sessions:[{date:"2026-11-17",title:"Push",exercises:["Incline bench · 4 × 8","Shoulder press · 3 × 10","Lateral raise · 3 × 15"]},{date:"2026-11-19",title:"Pull",exercises:["Pull-up · 4 × 8","Chest-supported row · 3 × 10","Dumbbell curl · 3 × 12"]}] },
  { id:"demo-emily",name:"Emily Chen",initials:"EC",goal:"Return to training",level:"Beginner",color:"#f472b6",sessions:[{date:"2026-11-18",title:"Full Body Foundations",exercises:["Bodyweight squat · 3 × 10","Dumbbell row · 3 × 10","Incline push-up · 3 × 8"]}] },
  { id:"demo-noah",name:"Noah Williams",initials:"NW",goal:"Athletic performance",level:"Advanced",color:"#facc15",sessions:[{date:"2026-11-16",title:"Lower Strength",exercises:["Back squat · 5 × 3","Romanian deadlift · 3 × 8","Walking lunge · 3 × 12"]},{date:"2026-11-18",title:"Upper Power",exercises:["Push press · 4 × 5","Weighted pull-up · 4 × 5","Bench press · 3 × 6"]}] },
];
const dateKey=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const monday=(d:Date)=>{const v=new Date(d);v.setDate(v.getDate()-((v.getDay()+6)%7));v.setHours(12,0,0,0);return v;};
export default function TrainersPage(){
 const [auth,setAuth]=useState<"loading"|"signed-out"|"unauthorized"|"ready">("loading");
 const [clients,setClients]=useState<Client[]>(demo);
 const [selected,setSelected]=useState(demo[0].id);
 const [week,setWeek]=useState(()=>monday(new Date("2026-11-16T12:00:00")));
 const [query,setQuery]=useState("");
 const [editing,setEditing]=useState<string|null>(null);
 const [title,setTitle]=useState("");
 const [exercises,setExercises]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>{let active=true;(async()=>{try{const {data:{user}}=await supabase.auth.getUser();if(!active)return;if(!user){setAuth("signed-out");return;}const {data,error}=await supabase.from("trainer_profiles").select("user_id").eq("user_id",user.id).maybeSingle();if(!active)return;setAuth(!error&&data?"ready":"unauthorized");}catch{if(active)setAuth("unauthorized");}})();return()=>{active=false}},[]);
 const client=clients.find(c=>c.id===selected)||clients[0];
 const visible=clients.filter(c=>(c.name+" "+c.goal).toLowerCase().includes(query.toLowerCase()));
 const days=useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date(week);d.setDate(d.getDate()+i);return d;}),[week]);
 const sessions=clients.reduce((n,c)=>n+c.sessions.length,0);
 const openEditor=(date:string)=>{const session=client.sessions.find(s=>s.date===date);setEditing(date);setTitle(session?.title||"");setExercises(session?.exercises.join("\n")||"");setNotice("");};
 const save=()=>{if(!editing||!title.trim())return;setClients(prev=>prev.map(c=>c.id!==selected?c:{...c,sessions:[...c.sessions.filter(s=>s.date!==editing),{date:editing,title:title.trim(),exercises:exercises.split("\n").map(s=>s.trim()).filter(Boolean)}]}));setEditing(null);setNotice("Demo workout saved locally. No real client calendar was changed.");};
 const moveWeek=(delta:number)=>setWeek(prev=>{const d=new Date(prev);d.setDate(d.getDate()+7*delta);return d;});
 if(auth==="loading")return <main className="trainer-gate">Loading trainer workspace…</main>;
 if(auth!=="ready")return <main className="trainer-gate"><h1>Gym Log for Trainers</h1><p>{auth==="signed-out"?"Sign in to your Gym Log account to open the trainer workspace.":"This account does not have an active trainer profile."}</p><Link className="trainer-action" href="/">Open Gym Log</Link></main>;
 return <main className="trainer-shell">
  <header className="trainer-hero"><div><span className="trainer-eyebrow">GYM LOG / TRAINER WORKSPACE</span><h1>Your coaching command centre</h1><p>Plan confidently. Keep every client's training on track.</p></div><div className="trainer-demo-tag">● Demo workspace · No invitations sent</div></header>
  <div className="trainer-stats"><div><span>Sample clients</span><strong>{clients.length}</strong><small>Ready to explore</small></div><div><span>Planned workouts</span><strong>{sessions}</strong><small>Across demo calendars</small></div><div><span>Active program plans</span><strong>{clients.length}</strong><small>Individual coaching goals</small></div></div>
  <div className="trainer-layout"><aside className="trainer-sidebar"><div className="trainer-panel-head"><h2>Clients</h2><span>{visible.length}</span></div><input aria-label="Search clients" placeholder="Search clients or goals…" value={query} onChange={e=>setQuery(e.target.value)}/><div className="trainer-client-list">{visible.map(c=><button key={c.id} className={"trainer-client "+(selected===c.id?"is-active":"")} onClick={()=>{setSelected(c.id);setEditing(null)}}><span className="trainer-avatar" style={{background:c.color}}>{c.initials}</span><span><strong>{c.name}</strong><small>{c.goal}</small></span><span aria-hidden="true">›</span></button>)}</div><p className="trainer-hint">These are fictional sample profiles. No real Gym Log users or private workout data are included.</p></aside>
  <section className="trainer-main"><div className="trainer-client-header"><span className="trainer-avatar trainer-avatar-large" style={{background:client.color}}>{client.initials}</span><div><span className="trainer-eyebrow">CLIENT CALENDAR</span><h2>{client.name}</h2><p>{client.goal} · {client.level}</p></div></div>
   <div className="trainer-calendar-head"><div><h3>Training week</h3><p>{days[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})} – {days[6].toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p></div><div className="trainer-week-actions"><button onClick={()=>moveWeek(-1)} aria-label="Previous week">‹</button><button onClick={()=>setWeek(monday(new Date()))}>Today</button><button onClick={()=>moveWeek(1)} aria-label="Next week">›</button></div></div>
   <div className="trainer-week-grid">{days.map(d=>{const key=dateKey(d);const s=client.sessions.find(s=>s.date===key);return <button key={key} className={"trainer-day "+(s?"has-session":"")} onClick={()=>openEditor(key)}><span className="trainer-day-label">{d.toLocaleDateString("en-US",{weekday:"short"})}</span><strong>{d.getDate()}</strong>{s?<span className="trainer-session"><b>{s.title}</b><small>{s.exercises.length} exercises</small></span>:<span className="trainer-add">+ Plan workout</span>}</button>})}</div>
   {editing&&<div className="trainer-editor"><div className="trainer-panel-head"><h3>Edit workout · {editing}</h3><button onClick={()=>setEditing(null)} aria-label="Close editor">✕</button></div><label>Workout name<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Lower Body A"/></label><label>Exercises (one per line)<textarea rows={6} value={exercises} onChange={e=>setExercises(e.target.value)} placeholder="Squat · 4 × 8"/></label><div className="trainer-editor-actions"><button onClick={()=>setEditing(null)}>Cancel</button><button className="trainer-action" onClick={save} disabled={!title.trim()}>Save demo workout</button></div></div>}
   {notice&&<p role="status" className="trainer-notice">{notice}</p>}
   <div className="trainer-next"><h3>Next steps for your coaching platform</h3><p>Demo calendars are editable locally for testing. Live client syncing, program assignment, consent-based connections and Stripe subscriptions are the next integration milestones.</p></div>
  </section></div>
 </main>;
}
