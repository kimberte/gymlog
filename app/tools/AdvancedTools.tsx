"use client";

import { useEffect, useState } from "react";
import styles from "./tools.module.css";

function Field({label,value,onChange,suffix,min=0,step="any"}:{label:string;value:string;onChange:(v:string)=>void;suffix?:string;min?:number;step?:string}) {
  return <label className={styles.field}><span>{label}</span><div className={styles.inputWrap}><input type="number" inputMode="decimal" min={min} step={step} value={value} onChange={e=>onChange(e.target.value)}/>{suffix&&<em>{suffix}</em>}</div></label>;
}
function Result({label,value}:{label:string;value:string}) { return <div className={styles.result}><span>{label}</span><strong>{value}</strong></div>; }
function Card({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}) {
  return <main className={styles.page}><a href="/tools" className={styles.back}>← All tools</a><section className={styles.card}><h2>{title}</h2><p className={styles.subtitle}>{subtitle}</p>{children}</section></main>;
}
function Toggle({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:[string,string][]}) {
  return <div className={styles.toggle}>{options.map(([v,label])=><button key={v} className={value===v?styles.active:""} onClick={()=>onChange(v)}>{label}</button>)}</div>;
}

function EMOM() {
  const [minutes,setMinutes]=useState("10"), [reps,setReps]=useState("10"), [left,setLeft]=useState(60), [round,setRound]=useState(1), [run,setRun]=useState(false);
  useEffect(()=>{if(!run)return;const id=setInterval(()=>setLeft(v=>{if(v>1)return v;if(round>=Number(minutes)){setRun(false);return 0}setRound(x=>x+1);return 60}),1000);return()=>clearInterval(id)},[run,round,minutes]);
  return <Card title="EMOM Timer" subtitle="Every Minute on the Minute. Complete your reps, then use the remaining minute to rest.">
    <div className={styles.formGrid}><Field label="Minutes" value={minutes} onChange={v=>{setMinutes(v);setRound(1);setLeft(60)}} min={1} step="1" suffix="min"/><Field label="Reps" value={reps} onChange={setReps} min={1} step="1" suffix="reps"/></div>
    <div className={styles.intervalPhase}>{run?"EMOM":"READY"}<strong>{String(left).padStart(2,"0")}</strong><span>Minute {Math.min(round,Number(minutes)||1)} / {minutes}</span></div>
    <div className={styles.actions}><button className={styles.primary} onClick={()=>setRun(v=>!v)}>{run?"Pause":"Start"}</button><button onClick={()=>{setRun(false);setRound(1);setLeft(60)}}>Reset</button></div>
    <p className={styles.note}>Complete {reps || "—"} reps at the start of each minute. The timer is designed as a simple visual pacing aid.</p>
  </Card>;
}

function AMRAP() {
  const [minutes,setMinutes]=useState("10"), [left,setLeft]=useState(600), [run,setRun]=useState(false), [rounds,setRounds]=useState("0");
  useEffect(()=>{if(!run)return;const id=setInterval(()=>setLeft(v=>{if(v>1)return v-1;setRun(false);return 0}),1000);return()=>clearInterval(id)},[run]);
  return <Card title="AMRAP Timer" subtitle="Set a time cap for an AMRAP and track completed rounds or reps.">
    <Field label="Time cap" value={minutes} onChange={v=>{setMinutes(v);setLeft((Number(v)||0)*60)}} min={1} step="1" suffix="min"/>
    <div className={styles.intervalPhase}>{run?"AMRAP":"READY"}<strong>{Math.floor(left/60).toString().padStart(2,"0")}:{(left%60).toString().padStart(2,"0")}</strong><span>Rounds completed: {rounds}</span></div>
    <div className={styles.actions}><button className={styles.primary} onClick={()=>setRun(v=>!v)}>{run?"Pause":"Start"}</button><button onClick={()=>{setRun(false);setRounds("0");setLeft((Number(minutes)||0)*60)}}>Reset</button></div>
    <div className={styles.formGrid}><Field label="Rounds completed" value={rounds} onChange={setRounds} min={0} step="1"/></div>
  </Card>;
}

function TrainingVolume() {
  const [sets,setSets]=useState("4"),[reps,setReps]=useState("8"),[exercises,setExercises]=useState("5");
  const totalSets=Number(sets)*Number(exercises), totalReps=totalSets*Number(reps);
  return <Card title="Training Volume Calculator" subtitle="Estimate total sets and reps across a workout.">
    <div className={styles.formGrid}><Field label="Sets / exercise" value={sets} onChange={setSets} min={1} step="1"/><Field label="Reps / set" value={reps} onChange={setReps} min={1} step="1"/><Field label="Exercises" value={exercises} onChange={setExercises} min={1} step="1"/></div>
    <div className={styles.macroGrid}><Result label="Total sets" value={totalSets>0?String(totalSets):"—"}/><Result label="Total reps" value={totalReps>0?String(totalReps):"—"}/><Result label="Exercises" value={Number(exercises)>0?exercises:"—"}/></div>
  </Card>;
}

function VolumeLoad() {
  const [weight,setWeight]=useState("225"),[reps,setReps]=useState("5"),[sets,setSets]=useState("4");
  const load=Number(weight)*Number(reps)*Number(sets);
  return <Card title="Volume Load Calculator" subtitle="Calculate total weight moved from load, reps and sets.">
    <div className={styles.formGrid}><Field label="Weight" value={weight} onChange={setWeight} min={0} suffix="lb"/><Field label="Reps" value={reps} onChange={setReps} min={1} step="1"/><Field label="Sets" value={sets} onChange={setSets} min={1} step="1"/></div>
    <Result label="Total volume load" value={load>0?Math.round(load).toLocaleString()+" lb":"—"}/>
    <p className={styles.note}>Volume load is weight × reps × sets. Use the same unit throughout the calculation.</p>
  </Card>;
}

function RepPercent() {
  const [max,setMax]=useState("300");
  return <Card title="Rep Percentage Calculator" subtitle="Calculate common training weights from your estimated 1RM.">
    <Field label="1RM" value={max} onChange={setMax} min={1} suffix="lb"/>
    <div className={styles.percentGrid}>{[50,55,60,65,70,75,80,85,90,95,100].map(p=><div key={p}><b>{p}%</b><span>{Number(max)>0?Math.round(Number(max)*p/100)+" lb":"—"}</span></div>)}</div>
    <p className={styles.note}>Percentages are useful starting points; actual working weights vary by exercise and athlete.</p>
  </Card>;
}

function StrengthStandards() {
  const [weight,setWeight]=useState("200"),[lift,setLift]=useState("bench"),[level,setLevel]=useState("intermediate");
  const standards:{[k:string]:number[]}={bench:[0.5,0.75,1,1.25,1.5],squat:[0.75,1.1,1.4,1.75,2.1],deadlift:[1,1.4,1.75,2.1,2.5],ohp:[0.3,0.5,0.7,0.9,1.1]};
  const names=["Beginner","Novice","Intermediate","Advanced","Elite"], ratio=standards[lift][names.map(n=>n.toLowerCase()).indexOf(level)]||1, target=Number(weight)*ratio;
  return <Card title="Strength Standards Calculator" subtitle="See illustrative strength targets relative to bodyweight.">
    <Toggle value={lift} onChange={setLift} options={[["bench","Bench"],["squat","Squat"],["deadlift","Deadlift"],["ohp","OHP"]]}/>
    <div className={styles.formGrid}><Field label="Bodyweight" value={weight} onChange={setWeight} min={1} suffix="lb"/></div>
    <label className={styles.field}><span>Level</span><select value={level} onChange={e=>setLevel(e.target.value)}>{names.map(n=><option key={n} value={n.toLowerCase()}>{n}</option>)}</select></label>
    <Result label="Illustrative target" value={target>0?Math.round(target)+" lb":"—"}/>
    <p className={styles.note}>These are simplified reference ratios, not medical or competitive qualification standards. Individual results vary by lift, sex, equipment and training history.</p>
  </Card>;
}

function PowerScore() {
  const [body,setBody]=useState("200"),[total,setTotal]=useState("1000"),[unit,setUnit]=useState("lb");
  const kg=unit==="lb"?Number(body)/2.20462:Number(body), totalKg=unit==="lb"?Number(total)/2.20462:Number(total);
  const wilks=kg>0?totalKg/(0.000001093*kg**5-0.000383*kg**4+0.068063*kg**3-4.3911*kg**2+114.7*kg-100):0;
  const dots=kg>0?totalKg*500/(47.46178854+(-0.002388645*kg)+(7.47277582e-4*kg**2)+(-1.711119e-5*kg**3)+(2.3731081e-7*kg**4)+(-1.8252083e-9*kg**5)+(5.911105e-12*kg**6)) : 0;
  return <Card title="Powerlifting Score Calculator" subtitle="Calculate Wilks and DOTS-style scores from bodyweight and total.">
    <Toggle value={unit} onChange={setUnit} options={[["lb","lb"],["kg","kg"]]}/>
    <div className={styles.formGrid}><Field label="Bodyweight" value={body} onChange={setBody} min={1} suffix={unit}/><Field label="Total" value={total} onChange={setTotal} min={1} suffix={unit}/></div>
    <div className={styles.macroGrid}><Result label="Wilks" value={wilks>0?wilks.toFixed(1):"—"}/><Result label="DOTS" value={dots>0?dots.toFixed(1):"—"}/></div>
    <p className={styles.note}>These are calculator estimates using published-style formulas. Federation rules and coefficients can differ.</p>
  </Card>;
}

function BodyFat() {
  const [sex,setSex]=useState("male"),[waist,setWaist]=useState("36"),[neck,setNeck]=useState("16"),[height,setHeight]=useState("70"),[hip,setHip]=useState("40");
  const h=Number(height), w=Number(waist), n=Number(neck), hipV=Number(hip);
  const bf=sex==="male"? (86.010*Math.log10(Math.max(w-n,1))-70.041*Math.log10(Math.max(h,1))+36.76) : (163.205*Math.log10(Math.max(w+hipV-n,1))-97.684*Math.log10(Math.max(h,1))-78.387);
  return <Card title="Body Fat Calculator" subtitle="Estimate body fat percentage from circumference measurements.">
    <Toggle value={sex} onChange={setSex} options={[["male","Male"],["female","Female"]]}/>
    <div className={styles.formGrid}><Field label="Height" value={height} onChange={setHeight} min={1} suffix="in"/><Field label="Waist" value={waist} onChange={setWaist} min={1} suffix="in"/><Field label="Neck" value={neck} onChange={setNeck} min={1} suffix="in"/>{sex==="female"&&<Field label="Hip" value={hip} onChange={setHip} min={1} suffix="in"/>}</div>
    <Result label="Estimated body fat" value={Number.isFinite(bf)&&bf>0?bf.toFixed(1)+"%":"—"}/>
    <p className={styles.note}>This is an estimate using the U.S. Navy circumference method. Measurement technique can materially affect the result.</p>
  </Card>;
}

function IdealWeight() {
  const [height,setHeight]=useState("70"),[sex,setSex]=useState("male");
  const inches=Number(height), base=Math.max(inches-60,0), kg=sex==="male"?50+2.3*base:45.5+2.3*base;
  return <Card title="Ideal Weight Calculator" subtitle="Compare common reference formulas for height-based weight estimates.">
    <Toggle value={sex} onChange={setSex} options={[["male","Male"],["female","Female"]]}/>
    <Field label="Height" value={height} onChange={setHeight} min={48} suffix="in"/>
    <div className={styles.macroGrid}><Result label="Devine" value={kg>0?kg.toFixed(1)+" kg":"—"}/><Result label="Devine" value={kg>0?(kg*2.20462).toFixed(1)+" lb":"—"}/><Result label="Height" value={inches>0?inches+" in":"—"}/></div>
    <p className={styles.note}>There is no single medically ideal body weight. This formula is a historical reference estimate and does not account for muscle mass or body composition.</p>
  </Card>;
}

function Water() {
  const [weight,setWeight]=useState("200"),[activity,setActivity]=useState("60");
  const oz=Math.max(0,Number(weight)*0.5+Number(activity)/30*12), liters=oz*0.0295735;
  return <Card title="Water Intake Calculator" subtitle="Get a simple daily hydration starting point based on bodyweight and activity.">
    <div className={styles.formGrid}><Field label="Bodyweight" value={weight} onChange={setWeight} min={1} suffix="lb"/><Field label="Exercise" value={activity} onChange={setActivity} min={0} step="15" suffix="min"/></div>
    <div className={styles.macroGrid}><Result label="Daily estimate" value={oz>0?Math.round(oz)+" oz":"—"}/><Result label="Litres" value={liters>0?liters.toFixed(1)+" L":"—"}/></div>
    <p className={styles.note}>A practical starting estimate, not a medical prescription. Heat, sweat rate, diet and individual needs can change hydration requirements.</p>
  </Card>;
}

export function AdvancedTool({slug}:{slug:string}) {
  const map:Record<string,()=>React.ReactNode>={"emom-timer":EMOM,"amrap-timer":AMRAP,"training-volume-calculator":TrainingVolume,"volume-load-calculator":VolumeLoad,"rep-percentage-calculator":RepPercent,"strength-standards-calculator":StrengthStandards,"powerlifting-score-calculator":PowerScore,"body-fat-calculator":BodyFat,"ideal-weight-calculator":IdealWeight,"water-intake-calculator":Water};
  const C=map[slug]; return C?<C/>:null;
}
