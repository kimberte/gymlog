"use client";
import {useState} from "react";
type Plan={date_key:string;completed_at:string|null;client_approved_at?:string|null;performance_log?:Record<string,string>|null};
type Lift={name:string;date:string;kg:number;reps:number;raw:string};
// Only explicit exercise, load, unit and reps are accepted. Never infer units or parse prescriptions.
export function parseLift(line:string,date:string):Lift|null{
 const m=line.trim().match(/^([^|:\n]+?)\s*[:|]\s*(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?)\s*[x×]\s*(\d+)\s*(?:reps?)?$/i);
 if(!m)return null;const weight=Number(m[2]),reps=Number(m[4]);if(!Number.isFinite(weight)||weight<=0||weight>2000||reps<1||reps>100)return null;
 return {name:m[1].trim(),date,kg:weight*(m[3].toLowerCase()==="kg"?1:0.45359237),reps,raw:line.trim()};
}
export default function ExerciseProgress({plans}:{plans:Plan[]}){
 const [chosen,setChosen]=useState(""),[unit,setUnit]=useState("lb");
 const today=new Date();const todayKey=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
 const lifts=plans.filter(p=>p.completed_at&&p.client_approved_at&&p.date_key<=todayKey).flatMap(p=>Object.values(p.performance_log||{}).flatMap(v=>typeof v==="string"?v.split("\n").map(line=>parseLift(line,p.date_key)).filter((l):l is Lift=>l!==null):[]));
 const names=[...new Map(lifts.map(l=>[l.name.toLowerCase(),l.name])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
 const selected=names.some(n=>n[0]===chosen)?chosen:names[0]?.[0]||"";
 const own=lifts.filter(l=>l.name.toLowerCase()===selected).sort((a,b)=>a.date.localeCompare(b.date));
 const daily=[...new Map(own.map(l=>[l.date,own.filter(x=>x.date===l.date).reduce((a,b)=>a.kg>=b.kg?a:b)])).values()];
 const best=own.reduce<Lift|null>((a,b)=>!a||b.kg>a.kg?b:a,null),latest=daily[daily.length-1],first=daily[0];
 const weight=(kg:number)=>Number((kg/(unit==="kg"?1:0.45359237)).toFixed(1));
 const max=Math.max(1,...daily.map(l=>l.kg)),min=Math.min(...daily.map(l=>l.kg)),range=Math.max(max-min,max*.1);
 const points=daily.map((l,i)=>({x:24+(daily.length===1?152:i/(daily.length-1)*304),y:124-(l.kg-min)/range*100,l}));
 return <section className="client-panel"><div className="coach-builder-head"><div><h2>Exercise progression &amp; personal bests</h2><p>All available completed coaching sessions · explicit logged loads only</p></div><select aria-label="Weight units" value={unit} onChange={e=>setUnit(e.target.value)}><option value="lb">lb</option><option value="kg">kg</option></select></div><p className="trainer-hint">For automatic tracking, log each actual set on its own line, e.g. Bench press: 135 lb x 8. Use kg or lb. Other notes remain visible in recorded performance.</p>{!names.length?<p>No comparable lift records yet.</p>:<><label>Exercise<select value={selected} onChange={e=>setChosen(e.target.value)}>{names.map(([k,n])=><option key={k} value={k}>{n}</option>)}</select></label><div className="client-metrics"><article><small>Heaviest recorded set</small><strong>{best?weight(best.kg):"—"} {unit}</strong><small>{best?.reps} reps · {best?.date}</small></article><article><small>Latest session best</small><strong>{latest?weight(latest.kg):"—"} {unit}</strong><small>{latest?.reps} reps</small></article><article><small>Change in session best</small><strong>{first&&latest&&daily.length>1?(latest.kg>=first.kg?"+":"")+weight(latest.kg-first.kg):"—"}</strong><small>{unit} · {daily.length} sessions</small></article></div><svg viewBox="0 0 352 152" role="img" aria-label="Heaviest recorded load per session" style={{width:"100%",maxHeight:220}}><path d="M24 24V124H328" fill="none" stroke="currentColor" opacity=".3"/><polyline points={points.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke="#ff6b22" strokeWidth="2"/>{points.map(p=><circle key={p.l.date} cx={p.x} cy={p.y} r="3" fill="#ff6b22"><title>{p.l.date}: {weight(p.l.kg)} {unit}</title></circle>)}</svg><div className="coach-report-history">{daily.slice().reverse().map(l=><article className="client-session" key={l.date}><div><small>{l.date}</small><strong>{weight(l.kg)} {unit} × {l.reps}</strong></div>{best&&Math.abs(l.kg-best.kg)<.00001&&<span className="client-state done">Best load</span>}</article>)}</div></>}</section>;
}
