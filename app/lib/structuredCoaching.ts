import type {StructuredWorkout,StructuredExerciseRow} from "./structuredNotes";
export type PrescribedExercise={name:string;sets:string;reps:string;load:string;rest:string;notes:string};
export const emptyPrescription=():PrescribedExercise=>({name:"",sets:"",reps:"",load:"",rest:"",notes:""});
// Compatible with existing program-library strings; only explicit sets/targets are inferred.
export function readPrescription(line:string):PrescribedExercise{
 const text=String(line||"").trim(),parts=text.split(" · "),head=parts[0]||"";
 const m=text.match(/^(.*?)\s*(?:·\s*|[—–:]\s*|\s+)(\d+)\s*(?:sets?\s*)?[×x]\s*(\d+(?:\s*[-–]\s*\d+)?)(?:\s*(reps?|sec(?:onds?)?|min(?:utes?)?))?/i);
 const result=emptyPrescription();result.name=(m?m[1]:head).trim();result.sets=m?.[2]||"";result.reps=m?m[3]+(m[4]&&!/^rep/i.test(m[4])?" "+(/^sec/i.test(m[4])?"sec":"min"):""):"";
 for(const p of parts.slice(m?2:1)){if(/^load:/i.test(p))result.load=p.slice(5).trim();else if(/^rest:/i.test(p))result.rest=p.slice(5).trim();else result.notes=[result.notes,p].filter(Boolean).join(" · ");}
 if(!m&&parts.length===1)result.name=text;
 return result;
}
export function validPrescription(e:PrescribedExercise){
 const target=e.reps.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?(?:\s*(sec|min))?$/i);
 return Boolean(e.name.trim()&&e.name.length<=150&&!/[\n\r·]/.test(e.name)&&/^\d+$/.test(e.sets)&&Number(e.sets)>=1&&Number(e.sets)<=30&&target&&Number(target[1])>=1&&Number(target[1])<=3600&&(!target[2]||Number(target[2])>=Number(target[1])&&Number(target[2])<=3600));
}
export const writePrescription=(e:PrescribedExercise)=>[e.name.trim(),e.sets.trim()+" sets × "+e.reps.trim().replace(/\s*–\s*/g,"-")+(/(?:sec|min)$/i.test(e.reps.trim())?"":" reps"),e.load.trim()&&"Load: "+e.load.trim(),e.rest.trim()&&"Rest: "+e.rest.trim(),e.notes.trim()].filter(Boolean).join(" · ");
export function validatePrescriptionLines(lines:string[]){return lines.length>0&&lines.length<=60&&lines.every(l=>validPrescription(readPrescription(l)))&&lines.reduce((sum,l)=>sum+Number(readPrescription(l).sets),0)<=250;}
export function prescriptionDraft(title:string,lines:unknown[]):StructuredWorkout{
 const rows:StructuredExerciseRow[]=[];
 for(const raw of lines){const line=typeof raw==="string"?raw:raw&&typeof raw==="object"&&"name" in raw?String(raw.name):"";if(!line.trim())continue;
 const e=readPrescription(line),n=validPrescription(e)?Number(e.sets):1;
 // Old free-form lines become editable, blank actual sets, never invented results.
 for(let i=0;i<n&&rows.length<250;i++)rows.push({name:e.name||line,sets:"1",reps:"",weight:"",unit:"",completed:false,targetReps:e.reps,targetLoad:e.load,targetRest:e.rest,note:e.notes});
 }
 return {workoutName:title,rows};
}
export function actualSetRows(draft:StructuredWorkout){
 return (draft.rows||[]).filter(r=>r.completed&&r.name.trim()&&/^\d+$/.test(r.reps||"")&&Number(r.reps)>0&&Number(r.reps)<=3600&&(r.weight===""||r.weight==null||/^\d+(?:\.\d+)?$/.test(r.weight)&&Number(r.weight)<=2000)).map(r=>({name:r.name.trim(),reps:/\b(sec|min)$/i.test(r.targetReps||"")?null:Number(r.reps),duration_seconds:/\b(sec|min)$/i.test(r.targetReps||"")?Number(r.reps):null,weight:r.weight===""||r.weight==null?null:Number(r.weight),unit:r.unit==="kg"?"kg":r.unit==="lb"?"lb":null,completed:true}));
}
export function actualLiftText(draft:StructuredWorkout){return actualSetRows(draft).filter(r=>r.weight!==null&&r.weight>0&&r.unit!==null&&r.reps!==null).map(r=>r.name+": "+r.weight+" "+r.unit+" x "+r.reps).join("\n");}
