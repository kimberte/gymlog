import type {StructuredWorkout,StructuredExerciseRow} from "./structuredNotes";
export type ExerciseBlock={kind:"superset"|"giant set"|"circuit";id:string;restSeconds:number};
export type SetType="normal"|"warm-up"|"drop"|"failure";
export type SetTarget={type:SetType;reps:string;load:string;rest:string;rpe?:string;rir?:string;tempo?:string};
export type PrescribedExercise={name:string;sets:string;reps:string;load:string;rest:string;notes:string;block?:ExerciseBlock;targets?:SetTarget[];alternatives?:string[]};
export const blockLabel=(b:ExerciseBlock)=>b.kind.charAt(0).toUpperCase()+b.kind.slice(1)+" "+b.id.slice(1);
export const emptyPrescription=():PrescribedExercise=>({name:"",sets:"",reps:"",load:"",rest:"",notes:""});
// Compatible with existing program-library strings; only explicit sets/targets are inferred.
import {EXERCISES} from "./exercises";
export function canonicalExercise(name:string){const clean=name.trim();return EXERCISES.find(n=>n.toLowerCase()===clean.toLowerCase())||({"bench press":"Barbell bench press","squat":"Back squat","lat pulldown":"Cable lat pulldown","overhead press":"Barbell overhead press","triceps pressdown":"Cable triceps pushdown"} as Record<string,string>)[clean.toLowerCase()]||clean;}
export function readPrescription(line:string):PrescribedExercise{
 const text=String(line||"").trim(),parts=text.split(" · "),head=parts[0]||"";
 const m=text.match(/^(.*?)\s*(?:·\s*|[—–:]\s*|\s+)(\d+)\s*(?:sets?\s*)?[×x]\s*(\d+(?:\s*[-–]\s*\d+)?)(?:\s*(reps?|sec(?:onds?)?|min(?:utes?)?))?/i);
 const result=emptyPrescription();result.name=canonicalExercise((m?m[1]:head).trim());result.sets=m?.[2]||"";result.reps=m?m[3]+(m[4]&&!/^rep/i.test(m[4])?" "+(/^sec/i.test(m[4])?"sec":"min"):""):"";
 if(m){const trailing=text.slice(m[0].length).trim().replace(/^·\s*/,"");for(const p of trailing.split(" · ").filter(Boolean)){if(/^load:/i.test(p))result.load=p.slice(5).trim();else if(/^rest:/i.test(p))result.rest=p.slice(5).trim();else if(/^Group: (superset|giant set|circuit) G[1-9][0-9]* \| [0-9]+s$/i.test(p)){const g=p.match(/^Group: (superset|giant set|circuit) (G[1-9][0-9]*) \| ([0-9]+)s$/i)!;result.block={kind:g[1].toLowerCase() as ExerciseBlock["kind"],id:g[2].toUpperCase(),restSeconds:Number(g[3])};}else if(p.startsWith("Set targets: ")){try{const v=JSON.parse(p.slice(13));if(Array.isArray(v))result.targets=v.map((a:unknown)=>{if(!Array.isArray(a))throw Error("Invalid set");return {type:a[0],reps:String(a[1]??""),load:String(a[2]??""),rest:String(a[3]??""),rpe:String(a[4]??""),rir:String(a[5]??""),tempo:String(a[6]??"")};});}catch{result.targets=[];}}else if(p.startsWith("Alternatives: ")){try{const v=JSON.parse(p.slice(14));if(Array.isArray(v))result.alternatives=v.filter(x=>typeof x==="string");}catch{}}else if(/^@/.test(p))result.load=p.slice(1).trim();else result.notes=[result.notes,p].filter(Boolean).join(" · ");}}
 else{const timed=text.match(/^(.*?)\s*[—–:]\s*(\d+(?:\s*[-–]\s*\d+)?)\s*(min|sec)\b(.*)$/i);if(timed){result.name=canonicalExercise(timed[1]);result.sets="1";result.reps=timed[2]+" "+timed[3].toLowerCase();result.notes=timed[4].trim();}else if(parts.length===1)result.name=canonicalExercise(text);}
 return result;
}
export function importPrescription(line:string,guidance=""){const e=readPrescription(line);if(!validPrescription(e))return line;return writePrescription({...e,notes:[e.notes,guidance].filter(Boolean).join(" / ")});}
export function suggestedActual(r:StructuredExerciseRow):StructuredExerciseRow{
 const target=(r.targetReps||"").match(/^(\d+)(?:\s*[-–]\s*\d+)?(?:\s*(sec|min))?$/i);
 const load=(r.targetLoad||"").match(/^(\d+(?:\.\d+)?)\s*(kg|lbs?)?$/i);
 if(r.completed||r.skipped)return r;
 return {...r,reps:r.repsEdited?r.reps:r.reps|| (target?String(Number(target[1])*(target[2]?.toLowerCase()==="min"?60:1)):""),weight:r.weightEdited?r.weight:r.weight||load?.[1]||"",unit:r.unit||(load?.[2]?(load[2].toLowerCase()==="kg"?"kg":"lb"):"lb")};
}
export function defaultActualUnit(r:StructuredExerciseRow):StructuredExerciseRow{return r.unit||r.completed||r.skipped?r:{...r,unit:"lb"};}
export function validActual(r:StructuredExerciseRow){return Boolean(r.name.trim()&&/^\d+$/.test(r.reps||"")&&Number(r.reps)>0&&Number(r.reps)<=3600&&(!r.weight||(/^\d+(?:\.\d+)?$/.test(r.weight)&&Number(r.weight)<=2000&&r.unit)));}
export function validSetTarget(s:SetTarget){return ["normal","warm-up","drop","failure"].includes(s.type)&&/^\d+(?:\s*[-–]\s*\d+)?(?:\s*(sec|min))?$/i.test(s.reps)&&Number(s.reps.match(/^\d+/)?.[0])>=1&&s.reps.length<=24&&s.load.length<=40&&s.rest.length<=24&&![s.load,s.rest,s.rpe,s.rir,s.tempo].some(x=>/[\r\n·]/.test(x||""))&&(!s.rpe||(/^\d+(?:\.\d+)?$/.test(s.rpe)&&Number(s.rpe)>=1&&Number(s.rpe)<=10))&&(!s.rir||(/^\d+$/.test(s.rir)&&Number(s.rir)<=10))&&(!s.tempo||/^[0-9Xx-]{3,9}$/.test(s.tempo));}
export function validPrescription(e:PrescribedExercise){
 const target=e.reps.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?(?:\s*(sec|min))?$/i);
 return Boolean((!e.targets||(e.targets.length===Number(e.sets)&&!e.block&&e.targets.every(validSetTarget)))&&e.name.trim()&&e.name.length<=150&&!/[\n\r·]/.test(e.name)&&/^\d+$/.test(e.sets)&&Number(e.sets)>=1&&Number(e.sets)<=30&&target&&Number(target[1])>=1&&Number(target[1])<=3600&&(!target[2]||Number(target[2])>=Number(target[1])&&Number(target[2])<=3600));
}
export const writePrescription=(e:PrescribedExercise)=>[e.name.trim(),e.sets.trim()+" sets × "+e.reps.trim().replace(/\s*–\s*/g,"-")+(/(?:sec|min)$/i.test(e.reps.trim())?"":" reps"),e.load.trim()&&"Load: "+e.load.trim(),e.rest.trim()&&"Rest: "+e.rest.trim(),e.block&&"Group: "+e.block.kind+" "+e.block.id+" | "+e.block.restSeconds+"s",e.targets&&"Set targets: "+JSON.stringify(e.targets.map(s=>[s.type,s.reps,s.load,s.rest,s.rpe||"",s.rir||"",s.tempo||""])),e.alternatives?.length&&"Alternatives: "+JSON.stringify(e.alternatives),e.notes.trim()].filter(Boolean).join(" · ");
export function validatePrescriptionLines(lines:string[]){const entries=lines.map(readPrescription);if(lines.some(l=>l.length>1500)||!entries.length||entries.length>60||!entries.every(validPrescription)||entries.reduce((sum,e)=>sum+Number(e.sets),0)>250)return false;const groups=new Map<string,number[]>();entries.forEach((e,i)=>{if(e.block)groups.set(e.block.id,[...(groups.get(e.block.id)||[]),i]);});for(const indices of groups.values()){const first=entries[indices[0]],block=first.block!;if(!Number.isInteger(block.restSeconds)||block.restSeconds<0||block.restSeconds>3600||indices.length<(block.kind==="giant set"?3:2)||(block.kind==="superset"&&indices.length!==2)||indices.some((i,j)=>i!==indices[0]+j||entries[i].sets!==first.sets||entries[i].block?.kind!==block.kind||entries[i].block?.restSeconds!==block.restSeconds))return false;}return true;}
export function prescriptionDraft(title:string,lines:unknown[]):StructuredWorkout{
 const rows:StructuredExerciseRow[]=[];
 for(const raw of lines){const line=typeof raw==="string"?raw:raw&&typeof raw==="object"&&"name" in raw?String(raw.name):"";if(!line.trim())continue;
 const e=readPrescription(line),n=validPrescription(e)?Number(e.sets):1;
 // Old free-form lines become editable, blank actual sets, never invented results.
 for(let i=0;i<n&&rows.length<250;i++){const target=e.targets?.[i];rows.push({name:e.name||line,sets:"1",reps:"",weight:"",unit:"",completed:false,planned:true,prescribedName:e.name||line,targetReps:target?.reps??e.reps,targetLoad:target?.load??e.load,targetRest:target?.rest??e.rest,note:e.notes,setType:target?.type,targetRpe:target?.rpe,targetRir:target?.rir,targetTempo:target?.tempo,alternatives:e.alternatives,...(e.block?{block:e.block,blockRound:i+1}:{})});}
 }
 return {workoutName:title,rows};
}
export function actualSetRows(draft:StructuredWorkout){
 return (draft.rows||[]).filter(r=>r.completed&&!r.skipped&&r.name.trim()&&/^\d+$/.test(r.reps||"")&&Number(r.reps)>0&&Number(r.reps)<=3600&&(r.weight===""||r.weight==null||/^\d+(?:\.\d+)?$/.test(r.weight)&&Number(r.weight)<=2000)).map(r=>({name:r.name.trim(),reps:/\b(sec|min)$/i.test(r.targetReps||"")?null:Number(r.reps),duration_seconds:/\b(sec|min)$/i.test(r.targetReps||"")?Number(r.reps):null,weight:r.weight===""||r.weight==null?null:Number(r.weight),unit:r.unit==="kg"?"kg":r.unit==="lb"?"lb":null,completed:true}));
}
export function actualLiftText(draft:StructuredWorkout){return actualSetRows(draft).filter(r=>r.weight!==null&&r.weight>0&&r.unit!==null&&r.reps!==null).map(r=>r.name+": "+r.weight+" "+r.unit+" x "+r.reps).join("\n");}
