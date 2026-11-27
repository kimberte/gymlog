"use client";
import {useState,useId,useMemo} from "react";
import {EXERCISES} from "../lib/exercises";
import {canonicalExercise,emptyPrescription,readPrescription,writePrescription,validPrescription,validatePrescriptionLines,type PrescribedExercise} from "../lib/structuredCoaching";

function Fields({draft,onChange}:{draft:PrescribedExercise;onChange:(value:PrescribedExercise)=>void}){
 const id=useId();
 const [open,setOpen]=useState(false);
 const q=draft.name.trim().toLowerCase();
 const matches=useMemo(()=>EXERCISES.filter(n=>!q||n.toLowerCase().includes(q)).sort((a,b)=>Number(b.toLowerCase().startsWith(q))-Number(a.toLowerCase().startsWith(q))).slice(0,12),[q]);
 return <div className="coach-builder-fields">
 <div style={{minWidth:0}} onBlur={ev=>{if(!ev.currentTarget.contains(ev.relatedTarget))setOpen(false)}}>
 <label htmlFor={id}>Exercise</label>
 <input id={id} value={draft.name} maxLength={150} autoComplete="off" placeholder="Search or type custom exercise" onFocus={()=>setOpen(true)} onChange={ev=>{onChange({...draft,name:ev.target.value});setOpen(true)}}/>
 {open&&<div style={{maxHeight:220,overflowY:"auto",display:"grid",gap:2,border:"1px solid var(--border)",borderRadius:8,padding:4}}>
 {matches.map(n=><button type="button" key={n} onClick={()=>{onChange({...draft,name:n});setOpen(false)}} style={{textAlign:"left",padding:8,background:"transparent",color:"inherit",border:0,cursor:"pointer"}}>{n}</button>)}
 {q&&!matches.some(n=>n.toLowerCase()===q)&&<button type="button" onClick={()=>setOpen(false)} style={{textAlign:"left",padding:8,background:"transparent",color:"inherit",border:0}}>Use custom: {draft.name.trim()}</button>}
 </div>}
 </div>
 {(["sets","reps","load","rest","notes"] as const).map(k=><label key={k}>{({sets:"Sets",reps:"Reps / time",load:"Target weight / RPE",rest:"Rest",notes:"Instructions"})[k]}<input value={draft[k]} inputMode={k==="sets"?"numeric":"text"} maxLength={250} onChange={ev=>onChange({...draft,[k]:ev.target.value})} placeholder={k==="sets"?"3":k==="reps"?"8–10 or 30 sec":k==="load"?"135 lb":k==="rest"?"90 sec":"Optional"}/></label>)}
 </div>;
}
export default function PrescriptionEditor({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const [draft,setDraft]=useState<PrescribedExercise>(emptyPrescription),[editing,setEditing]=useState<number|null>(null);
 const lines=value.split("\n").filter(Boolean);
 const [dragging,setDragging]=useState<number|null>(null);
 const [announcement,setAnnouncement]=useState("");
 const move=(from:number,to:number)=>{if(editing!==null||from===to||from<0||to<0||from>=lines.length||to>=lines.length)return;const next=[...lines];const [line]=next.splice(from,1);next.splice(to,0,line);onChange(next.join("\n"));setAnnouncement(readPrescription(line).name+" moved to position "+(to+1));setDragging(null);};
 const cancel=()=>{setEditing(null);setDraft(emptyPrescription());};
 const apply=()=>{if(!validPrescription(draft))return;const next=[...lines];const line=writePrescription({...draft,name:canonicalExercise(draft.name)});if(editing===null)next.push(line);else next[editing]=line;onChange(next.join("\n"));cancel();};
 const fields=<><Fields draft={draft} onChange={setDraft}/><div className="coach-builder-actions"><button type="button" className="trainer-action" disabled={!validPrescription(draft)} onClick={apply}>{editing===null?"Add exercise":"Save exercise"}</button>{editing!==null&&<button type="button" className="trainer-outline-button" onClick={cancel}>Cancel edit</button>}</div></>;
 return <section style={{border:"1px solid var(--border)",padding:12,borderRadius:12,margin:"12px 0",display:"grid",gap:10,minWidth:0}}><h4 style={{margin:0}}>Exercises</h4><span role="status" aria-live="polite" style={{position:"absolute",width:1,height:1,overflow:"hidden",clipPath:"inset(50%)"}}>{announcement}</span><p className="trainer-hint">Search Gym Log's exercise names or enter a custom exercise. Imported targets are ready to edit. Drag the handle or use the arrows to reorder exercises.</p>
 {lines.map((line,i)=>{const e=readPrescription(line);return <div key={i} onDragOver={ev=>{if(dragging!==null&&editing===null){ev.preventDefault();ev.dataTransfer.dropEffect="move"}}} onDrop={ev=>{ev.preventDefault();if(dragging!==null)move(dragging,i);setDragging(null)}} style={{display:"grid",gap:8,padding:8,borderBottom:"1px solid var(--border)",opacity:dragging===i?.55:1}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span draggable={editing===null} onDragStart={ev=>{setDragging(i);ev.dataTransfer.effectAllowed="move";ev.dataTransfer.setData("text/plain",String(i))}} onDragEnd={()=>setDragging(null)} title="Drag to reorder" aria-hidden="true" style={{cursor:editing===null?"grab":"default",padding:6,color:"var(--muted)",fontSize:20}}>⠿</span><div style={{flex:"1 1 160px",minWidth:0}}><strong>{i+1}. {e.name}</strong><div style={{fontSize:12}}>{validPrescription(e)?[e.sets+" sets × "+e.reps,e.load&&"Load: "+e.load,e.rest&&"Rest: "+e.rest,e.notes].filter(Boolean).join(" · "):"Needs review: "+line}</div></div><div style={{display:"flex",gap:4}}><button type="button" className="trainer-outline-button" aria-label={"Move "+e.name+" up"} disabled={i===0||editing!==null} onClick={()=>move(i,i-1)}>↑</button><button type="button" className="trainer-outline-button" aria-label={"Move "+e.name+" down"} disabled={i===lines.length-1||editing!==null} onClick={()=>move(i,i+1)}>↓</button></div><button type="button" className="trainer-outline-button" onClick={()=>{setDraft(e);setEditing(i)}}>Edit</button><button type="button" className="trainer-outline-button" aria-label={"Remove "+e.name} onClick={()=>{onChange(lines.filter((_,j)=>i!==j).join("\n"));cancel()}}>Remove</button></div>{editing===i&&fields}</div>})}
 {editing===null&&<div style={{display:"grid",gap:10}}><strong>Add exercise</strong>{fields}</div>}
 {lines.length>0&&!validatePrescriptionLines(lines)&&<p role="alert">Review all exercise targets before assigning this workout. Maximum 60 exercises and 250 sets.</p>}</section>;
}
