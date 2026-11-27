import {readPrescription,writePrescription,validPrescription,validatePrescriptionLines} from "../../lib/structuredCoaching";
export type Session={offset:number;title:string;exercises:string[]};
export type Rule={mode:"fixed"|"percent"|"reps";day:number;exercise:string;firstWeek:number;lastWeek:number;baseline:string;step:string;unit:"lb"|"kg";increment:string;deload:string};
export type Change={offset:number;index:number;week:number;title:string;old:string;next:string;before:string;after:string};
export type Preview={changes:Change[];skipped:string[];error:string|null};
export function findExercise(s:Session|undefined,k:string){if(!s)return -1;let n=0;const nameKey=k.slice(0,k.lastIndexOf("#"));return s.exercises.findIndex(line=>{const name=readPrescription(line).name.toLowerCase();if(name!==nameKey)return false;n++;return name+"#"+n===k;});}
const numeric=(s:string)=>/^\d+(?:\.\d+)?$/.test(s.trim())?Number(s):NaN;
const signed=(s:string)=>/^-?\d+(?:\.\d+)?$/.test(s.trim())?Number(s):NaN;
const loadValue=(s:string)=>{const m=s.trim().match(/^(\d+(?:\.\d+)?)\s*(lb|lbs|kg)?$/i);return m?{value:Number(m[1]),unit:m[2]?.toLowerCase()==="kg"?"kg":"lb"}:null;};
const format=(n:number)=>String(Number(n.toFixed(4)));
export function previewRule(sessions:Session[],weeks:number,r:Rule):Preview{
 const changes:Change[]=[],skipped:string[]=[];const fail=(error:string):Preview=>({changes:[],skipped,error});
 if(!r.exercise||!Number.isInteger(r.day)||r.day<0||r.day>6||!Number.isInteger(r.firstWeek)||!Number.isInteger(r.lastWeek)||r.firstWeek<1||r.lastWeek>weeks||r.lastWeek<r.firstWeek)return fail("Choose an exercise and a valid week range.");
 const base=numeric(r.baseline),step=signed(r.step),inc=numeric(r.increment),deload=numeric(r.deload||"0");
 if(!Number.isFinite(base)||!Number.isFinite(step))return fail("Enter a valid starting target and weekly change.");
 if(r.mode==="reps"&&(!Number.isInteger(base)||!Number.isInteger(step)||base<1||base>3600))return fail("Rep progression needs whole numbers and at least one rep.");
 if(r.mode!=="reps"&&(base<0||base>2000||!Number.isFinite(inc)||inc<=0||inc>100||!Number.isFinite(deload)||deload<0||deload>90))return fail("Enter a load from 0 to 2000, a rounding increment greater than zero (maximum 100), and a final deload from 0 to 90%.");
 if(r.mode==="percent"&&step<=-100)return fail("Weekly percentage change must be greater than -100%.");
 for(let week=r.firstWeek;week<=r.lastWeek;week++){
  const offset=(week-1)*7+r.day,s=sessions.find(x=>x.offset===offset),idx=findExercise(s,r.exercise);
  if(!s||idx<0){skipped.push("Week "+week+": matching exercise not found.");continue;}
  const old=s.exercises[idx],e=readPrescription(old);
  if(!validPrescription(e)||e.targets){skipped.push("Week "+week+": individually programmed or invalid targets; use Details.");continue;}
  const field=r.mode==="reps"?"reps":"load";
  if(field==="reps"&&!/^\d+(?:\s*[-–]\s*\d+)?$/.test(e.reps.trim())){skipped.push("Week "+week+": duration target, not reps.");continue;}
  if(field==="load"&&e.load.trim()){const v=loadValue(e.load);if(!v||v.unit!==r.unit){skipped.push("Week "+week+": non-numeric or different-unit load preserved.");continue;}}
  const n=week-r.firstWeek;let result=r.mode==="percent"?base*Math.pow(1+step/100,n):base+n*step;
  if(r.mode!=="reps"){if(week===r.lastWeek&&r.lastWeek>r.firstWeek&&deload>0)result*=1-deload/100;result=Math.round(result/inc)*inc;}
  if(!Number.isFinite(result)||result<0||result>(r.mode==="reps"?3600:2000)||r.mode==="reps"&&result<1)return fail("Week "+week+" produces an out-of-range target. Adjust the starting target or weekly change.");
  const after=format(result)+(field==="load"?" "+r.unit:"");const next=writePrescription({...e,[field]:after});
  if(next.length>1500||!validatePrescriptionLines(s.exercises.map((l,i)=>i===idx?next:l))){skipped.push("Week "+week+": updated workout would fail validation.");continue;}
  changes.push({offset,index:idx,week,title:s.title,old,next,before:e[field]||"Not set",after});
 }
 return {changes,skipped,error:changes.length?null:"No eligible matching workouts found. Add or duplicate workouts first."};
}
export function applyRule(sessions:Session[],preview:Preview):Session[]|null{
 if(preview.error||!preview.changes.length||preview.changes.some(c=>sessions.find(s=>s.offset===c.offset)?.exercises[c.index]!==c.old))return null;
 return sessions.map(s=>({...s,exercises:s.exercises.map((l,i)=>preview.changes.find(c=>c.offset===s.offset&&c.index===i)?.next??l)}));
}
