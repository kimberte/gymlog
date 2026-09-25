"use client";

import { useEffect, useState } from "react";
import styles from "./tools.module.css";
import { useToolTimer } from "../components/ThemeControl";

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
  const { timer, startEmom, pause, reset } = useToolTimer();
  const [minutes,setMinutes]=useState("10"), [reps,setReps]=useState("10");
  const active=timer?.kind==="emom"?timer:null;
  const left=active?active.remaining:60;
  return <Card title="EMOM Timer" subtitle="Every Minute on the Minute. Complete your reps, then use the remaining minute to rest.">
    <div className={styles.formGrid}><Field label="Minutes" value={minutes} onChange={setMinutes} min={1} step="1" suffix="min"/><Field label="Reps" value={reps} onChange={setReps} min={1} step="1" suffix="reps"/></div>
    <div className={styles.intervalPhase}>{active?"EMOM":"READY"}<strong>{String(Math.max(0,Math.ceil(left))).padStart(2,"0")}</strong><span>Minute {active?Math.min(active.round,active.rounds):1} / {minutes}</span></div>
    <div className={styles.actions}><button className={styles.primary} onClick={()=>active?.running?pause():startEmom(60,Number(minutes))}>{active?.running?"Pause":"Start"}</button><button onClick={reset}>Reset</button></div>
    <p className={styles.note}>Complete {reps||"—"} reps at the start of each minute. The timer keeps running while you move around Gym Log.</p>
  </Card>;
}function AMRAP() {
  const { timer, startAmrap, pause, reset } = useToolTimer();
  const [minutes,setMinutes]=useState("10"), [rounds,setRounds]=useState("0");
  const active=timer?.kind==="amrap"?timer:null;
  const left=active?active.remaining:Number(minutes)*60;
  return <Card title="AMRAP Timer" subtitle="Set a time cap for an AMRAP and track completed rounds or reps.">
    <Field label="Time cap" value={minutes} onChange={setMinutes} min={1} step="1" suffix="min"/>
    <div className={styles.intervalPhase}>{active?"AMRAP":"READY"}<strong>{Math.floor(Math.max(0,left)/60).toString().padStart(2,"0")}:{(Math.ceil(Math.max(0,left))%60).toString().padStart(2,"0")}</strong><span>Rounds completed: {rounds}</span></div>
    <div className={styles.actions}><button className={styles.primary} onClick={()=>active?.running?pause():startAmrap(Number(minutes)*60)}>{active?.running?"Pause":"Start"}</button><button onClick={reset}>Reset</button></div>
    <div className={styles.formGrid}><Field label="Rounds completed" value={rounds} onChange={setRounds} min={0} step="1"/></div>
    <p className={styles.note}>The timer continues running while you navigate Gym Log.</p>
  </Card>;
}function PowerScore() {
  const [sex,setSex]=useState("male"),[body,setBody]=useState("200"),[total,setTotal]=useState("1000"),[unit,setUnit]=useState("lb");
  const kg=unit==="lb"?Number(body)/2.2046226218:Number(body), totalKg=unit==="lb"?Number(total)/2.2046226218:Number(total);
  const wilks=[-216.0475144,16.2606339,-0.002388645,-0.00113732,0.00000701863,-0.00000001291];
  const wilksF=[594.31747775582,-27.23842536447,0.82112226871,-0.00930733913,0.00004731582,-0.00000009054];
  const dots=[-307.75076,24.0900756,-0.1918759221,0.0007391293,-0.000001093];
  const dotsF=[-57.96288,13.6175032,-0.1126655495,0.0005158568,-0.0000010706];
  const wC=sex==="male"?wilks:wilksF, dC=sex==="male"?dots:dotsF;
  const wp=wC[0]+wC[1]*kg+wC[2]*kg**2+wC[3]*kg**3+wC[4]*kg**4+wC[5]*kg**5;
  const dp=dC[0]+dC[1]*kg+dC[2]*kg**2+dC[3]*kg**3+dC[4]*kg**4;
  const wilksScore=kg>0&&wp>0?totalKg*500/wp:0, dotsScore=kg>0&&dp>0?totalKg*500/dp:0;
  return <Card title="Powerlifting Score Calculator" subtitle="Calculate classic Wilks and DOTS scores from bodyweight and total.">
    <Toggle value={sex} onChange={setSex} options={[["male","Male"],["female","Female"]]}/>
    <Toggle value={unit} onChange={setUnit} options={[["lb","lb"],["kg","kg"]]}/>
    <div className={styles.formGrid}><Field label="Bodyweight" value={body} onChange={setBody} min={1} suffix={unit}/><Field label="Total" value={total} onChange={setTotal} min={1} suffix={unit}/></div>
    <div className={styles.macroGrid}><Result label="Wilks" value={wilksScore>0?wilksScore.toFixed(2):"—"}/><Result label="DOTS" value={dotsScore>0?dotsScore.toFixed(2):"—"}/></div>
    <p className={styles.note}>Both formulas convert inputs to kilograms and use sex-specific published coefficients. Wilks shown here is the classic Wilks formula; DOTS uses its published quartic coefficients. Scores are not interchangeable with IPF GL points.</p>
  </Card>;
}
