import {readPrescription,validPrescription,prescriptionDraft,canonicalExercise,formatProgramPrescription} from "./structuredCoaching";
import {compileStructuredBlock,upsertStructuredBlock,type StructuredExerciseRow,type StructuredWorkout} from "./structuredNotes";

/** Convert explicit prescriptions only. Retain the original text for anything that cannot be faithfully mapped. */
export function structuredProgramImport(title:string,lines:string[],originalNotes:string){
 const rows:StructuredExerciseRow[]=[];let review=0;
 for(const line of lines){
   if(!line.trim())continue;
   const parsed=readPrescription(line);
   if(validPrescription(parsed)&&!/\d\s*(?:m|meters?|metres?|km|mi|miles?|yards?|yd|ft)\b/i.test(line.split(" · ")[0])){
     const draft=prescriptionDraft(title,[line]);
     // Non-numeric prescriptions (e.g. RPE, %1RM or bodyweight) are instructions, not actual weights.
     for(const r of draft.rows){
       if(r.targetLoad&&!/^\d+(?:\.\d+)?\s*(?:kg|lbs?)?$/i.test(r.targetLoad.trim())){
         r.targetLoad="";review++;
       }
       r.note=formatProgramPrescription(line);
     }
     rows.push(...draft.rows);
   }else{
     const match=line.match(/^(.+?)\s+(?:—|–|·|:)\s+(\d+)\s+sets?\b/i);
     const name=canonicalExercise((match?.[1]||line.split(/\s+[—–·]\s+/)[0]||line).trim().slice(0,150));
     const count=match?Math.min(30,Math.max(1,Number(match[2]))):1;
     for(let i=0;i<count;i++)rows.push({name:name||"Review exercise",sets:"1",reps:"",weight:"",unit:"",planned:false,completed:false,note:line});
     review++;
   }
 }
 if(rows.length>250){review++;rows.length=250;}
 const structured:StructuredWorkout={workoutName:title,rows};
 return {structured,notes:upsertStructuredBlock(originalNotes,compileStructuredBlock(structured)),review};
}
