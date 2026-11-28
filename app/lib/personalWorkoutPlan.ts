import type {StructuredExerciseRow} from "./structuredNotes";
import {writePrescription,canonicalExercise,type PrescribedExercise,type SetTarget} from "./structuredCoaching";
export const canEditPrescription=(r:StructuredExerciseRow)=>!r.completed&&!r.skipped&&!r.repsEdited&&!r.weightEdited&&!r.unitEdited&&!r.reps&&!r.weight&&!r.actualRpe&&!r.actualRir;
const asTarget=(r:StructuredExerciseRow):SetTarget=>({type:r.setType||"normal",reps:r.targetReps||"10",load:r.targetLoad||"",rest:r.targetRest||"",rpe:r.targetRpe,rir:r.targetRir,tempo:r.targetTempo});
// Preserve grouping, distinct set targets and exercise alternatives from the existing row model.
export function rowsToPersonalPlan(rows:StructuredExerciseRow[]):string[]{
 const groups=new Map<string,StructuredExerciseRow[]>();
 for(const r of rows){const key=(r.block?.id||"normal")+":"+r.name.trim().toLowerCase();const arr=groups.get(key)||[];arr.push(r);groups.set(key,arr);}
 return Array.from(groups.values()).map(setRows=>{const first=setRows[0],targets=setRows.map(asTarget),t=targets[0];const individual=!first.block&&targets.some(x=>x.type!=="normal"||x.rpe||x.rir||x.tempo||x.reps!==t.reps||x.load!==t.load||x.rest!==t.rest);const item:PrescribedExercise={name:canonicalExercise(first.name),sets:String(setRows.length),reps:t.reps,load:t.load,rest:t.rest,notes:first.note||"",alternatives:first.alternatives,block:first.block,...(individual?{targets}:{})};return writePrescription(item);});
}
export function reusePersonalRows(rows:StructuredExerciseRow[]):StructuredExerciseRow[]{
 return rows.map(r=>{const {completed,skipped,actualRpe,actualRir,repsEdited,weightEdited,unitEdited,...base}=r;const timed=/\b(sec|min)$/i.test(r.targetReps||"");return {...base,planned:true,completed:false,skipped:false,reps:"",weight:"",targetReps:r.completed&&r.reps?(timed?r.reps+" sec":r.reps):r.targetReps,targetLoad:r.completed&&r.weight&&r.unit?r.weight+" "+r.unit:r.targetLoad};});
}
