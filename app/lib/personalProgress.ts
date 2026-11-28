import {getDayEntries,type WorkoutMap} from "./storage";
import {parseStructuredFromNotes,type StructuredExerciseRow} from "./structuredNotes";
import {canonicalExercise} from "./structuredCoaching";

export const localDateKey=(d=new Date())=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
export function shiftDay(date:string,n:number){const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export const dayDistance=(a:string,b:string)=>Math.round((Date.parse(b+"T12:00:00Z")-Date.parse(a+"T12:00:00Z"))/86400000);
export function validDay(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+"T12:00:00Z"))&&new Date(s+"T12:00:00Z").toISOString().slice(0,10)===s;}
export const exerciseKey=(name:string)=>canonicalExercise(name).trim().toLowerCase();
const numeric=(v:unknown)=>typeof v==="number"?v:typeof v==="string"&&/^\d+(?:\.\d+)?$/.test(v.trim())?Number(v):NaN;
export type LoggedSet={date:string;session:string;name:string;key:string;reps:number|null;seconds:number|null;kg:number|null;setType:string;rpe:number|null;rir:number|null;};
export type LoggedSession={date:string;id:string;title:string;completed:boolean;structured:boolean;trainer:boolean;sets:LoggedSet[]};
export type PersonalData={sessions:LoggedSession[];sets:LoggedSet[];manualPBs:string[]};
export function extractPersonalData(workouts:WorkoutMap,today=localDateKey()):PersonalData{
 const sessions:LoggedSession[]=[],sets:LoggedSet[]=[],manualPBs:string[]=[];const trainerIds=new Set<string>();
 for(const date of Object.keys(workouts||{}).filter(d=>validDay(d)&&d<=today).sort()){
   const entries=getDayEntries(workouts,date);
   if(workouts[date]?.pb&&entries.some(e=>!!e.completedAt))manualPBs.push(date);
   entries.forEach((e,i)=>{
    if(!e)return;const trainer=e.id.startsWith("trainer_");
    if(trainer&&trainerIds.has(e.id))return;
    const structured=e.mode==="plain"?null:Array.isArray(e.structured?.rows)?e.structured:parseStructuredFromNotes(e.notes||"");
    const session=date+":"+i+":"+e.id,completed=!!e.completedAt;
    if(!completed&&!structured?.rows?.length)return;
    const actual:LoggedSet[]=[];
    for(const r of (structured?.rows||[]) as StructuredExerciseRow[]){
      if(!r||r.completed!==true||r.skipped||typeof r.name!=="string"||!r.name.trim())continue;
      const count=numeric(r.reps);
      if(!Number.isInteger(count)||count<1||count>3600)continue;
      const timed=/\b(sec|min)$/i.test(r.targetReps||"");
      const load=numeric(r.weight),kg=Number.isFinite(load)&&load>=0&&load<=2000&&(r.unit==="lb"||r.unit==="kg")?load*(r.unit==="lb"?0.45359237:1):null;
      const rpe=numeric(r.actualRpe),rir=numeric(r.actualRir);
      actual.push({date,session,name:canonicalExercise(r.name),key:exerciseKey(r.name),reps:timed?null:count,seconds:timed?count:null,kg,setType:r.setType||"normal",rpe:rpe>=1&&rpe<=10?rpe:null,rir:Number.isInteger(rir)&&rir>=0&&rir<=10?rir:null});
    }
    if(!completed&&!actual.length)return;
    if(trainer)trainerIds.add(e.id);
    sessions.push({date,id:session,title:e.title||"Workout",completed,structured:!!structured,trainer,sets:actual});sets.push(...actual);
   });
 }
 return {sessions,sets,manualPBs};
}
export function streaksFromDays(dates:string[],today=localDateKey()){
 const days=[...new Set(dates.filter(d=>validDay(d)&&d<=today))].sort();let best=0,run=0;
 days.forEach((d,i)=>{run=i&&dayDistance(days[i-1],d)===1?run+1:1;best=Math.max(best,run);});
 const last=days[days.length-1]||null;return {currentStreak:last&&dayDistance(last,today)<=1?run:0,bestStreak:best,totalDays:days.length,lastWorkout:last};
}
export const volumeKg=(s:LoggedSet)=>s.reps!==null&&s.kg!==null?s.reps*s.kg:0;
export const comparable=(s:LoggedSet)=>s.reps!==null&&s.kg!==null&&s.kg>0&&s.setType!=="warm-up";
export function repRecords(sets:LoggedSet[]){
 const records=new Map<string,LoggedSet>();
 for(const s of sets){if(!comparable(s))continue;const key=s.key+":"+s.reps,old=records.get(key);if(!old||s.kg!>old.kg!+1e-8)records.set(key,s);}
 return [...records.values()];
}
export function periodSummary(data:PersonalData,start:string,end:string){
 const sessions=data.sessions.filter(s=>s.date>=start&&s.date<=end&&s.completed);
 const sets=data.sets.filter(s=>s.date>=start&&s.date<=end);
 return {sessions,sets,days:new Set(sessions.map(s=>s.date)).size,structured:sessions.filter(s=>s.structured).length,notes:sessions.filter(s=>!s.structured).length,volume:sets.reduce((n,s)=>n+volumeKg(s),0),reps:sets.reduce((n,s)=>n+(s.reps||0),0),seconds:sets.reduce((n,s)=>n+(s.seconds||0),0)};
}
