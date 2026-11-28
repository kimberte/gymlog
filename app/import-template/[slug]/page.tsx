"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSeoTemplateBySlug } from "../../lib/seoWorkoutTemplates";
import { getProgram } from "../../lib/programs";
import { loadWorkouts, loadDefaultWorkoutMode, type DefaultWorkoutMode } from "../../lib/storage";
import { getProgramWorkouts } from "../../workout-programs/programWorkouts";
import { structuredProgramImport } from "../../lib/structuredProgramImport";
import styles from "./import-template.module.css";
import { FOUNDER_SPECIAL_V2_WORKOUTS } from "../../workout-programs/founderSpecialV2";
import { FOUNDER_SPECIAL_WORKOUTS } from "../../workout-programs/founderSpecial";

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateString: string, days: number) {
  const d = new Date(`${dateString}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

export default function ImportTemplatePage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || "");
  const template = useMemo(() => getSeoTemplateBySlug(slug), [slug]);
  const program = useMemo(() => getProgram(slug), [slug]);
  const days = useMemo(()=>{if(slug==="gym-log-founder-special-v2")return FOUNDER_SPECIAL_V2_WORKOUTS;if(slug==="gym-log-founder-special")return FOUNDER_SPECIAL_WORKOUTS;if(template)return template.days.map(d=>({...d,day:d.name,guidance:d.notes||""}));if(!program)return [];return getProgramWorkouts(program).map((d,i)=>({...d,offsetDays:"offsetDays" in d&&typeof d.offsetDays==="number"?d.offsetDays:Math.floor(i/Math.max(1,program.days))*7+Math.floor((i%Math.max(1,program.days))*7/Math.max(1,program.days))}));},[slug,program,template]);
  const name = template?.name ?? program?.name ?? "Workout Program";
  const description = template?.shortDescription ?? program?.description ?? "Import this workout program into Gym Log.";
  const [startDate, setStartDate] = useState(() => toDateInputValue(new Date()));
  const [status, setStatus] = useState<string>("");
  const [format,setFormat]=useState<DefaultWorkoutMode>("structured");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{setFormat(loadDefaultWorkoutMode());const start=new URLSearchParams(window.location.search).get("start");if(start&&/^\d{4}-\d{2}-\d{2}$/.test(start))setStartDate(start);},[]);
  const prepared=useMemo(()=>days.map(day=>{const original=[day.focus,day.exercises.join("\n"),day.guidance||"",`Imported from Gym Log workout program: ${name}`].filter(Boolean).join("\n\n");return {day,original,converted:format==="structured"?structuredProgramImport(day.day,day.exercises,original):null};}),[days,format,name]);
  const needsReview=prepared.filter(x=>x.converted?.review).length;

  function handleImport() {
    if(busy)return;
    if (!days.length) { setStatus("Program not found. Please return to the workout library."); return; }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!Number.isFinite(new Date(startDate+"T12:00:00").getTime())){setStatus("Choose a valid start date.");return;}
    setBusy(true);
    try {
      const existing = loadWorkouts();
      const next = { ...(existing || {}) } as Record<string, any>;
      const now = new Date().toISOString();
      const importedDates: string[] = [];
      prepared.forEach(({day,original,converted}, dayIndex) => {
        const date = addDays(startDate, day.offsetDays);
        const current = next[date] && Array.isArray(next[date].entries) ? next[date] : { entries: [] };
        const available = Math.max(0, 3 - current.entries.length);
        if (available === 0) return;
        const entry = { id: `program_${Date.now()}_${dayIndex}_${Math.random().toString(16).slice(2)}`, title: day.day, notes: converted?.notes??original, mode:format, ...(converted?{structured:converted.structured}:{}), completedAt:null, createdAt: now, updatedAt: now };
        next[date] = { ...current, entries: [...current.entries, entry].slice(0, 3) };
        importedDates.push(date);
      });
      if(!importedDates.length){setStatus("No available workout slots. Choose another start date.");setBusy(false);return;}
      if(importedDates.length<days.length&&!window.confirm(`Only ${importedDates.length} of ${days.length} sessions fit. Import these and skip full dates?`)){setBusy(false);return;}
      localStorage.setItem("gym-log-workouts", JSON.stringify(next));
      localStorage.removeItem("gym-log-template-import-pending");
      setStatus(`Imported ${importedDates.length} workout day${importedDates.length === 1 ? "" : "s"}. Opening Gym Log…`);
      window.setTimeout(() => { window.location.href = `/?imported=1&start=${encodeURIComponent(startDate)}`; }, 150);
    } catch { setStatus("Import failed. Please try again."); setBusy(false); }
  }

  if (!days.length) {
    return (
      <main className={styles.page}>
        <nav className="programs-nav"><Link href="/workout-programs" className="programs-brand">Gym Log</Link><Link href="/" className="programs-back">Open Workout Log</Link></nav>
        <section className={`${styles.shell} ${styles.empty}`}>
          <Link href="/workout-programs" className={styles.breadcrumb}>← Back to program library</Link>
          <div className={styles.kicker}>WORKOUT PROGRAM</div>
          <h1>Program not found</h1>
          <p>We couldn't find that workout program. Return to the library to choose another routine.</p>
          <Link href="/workout-programs" className={styles.primary}>Browse workout programs</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <nav className="programs-nav"><Link href="/workout-programs" className="programs-brand">Gym Log</Link><Link href="/" className="programs-back">Open Workout Log</Link></nav>
      <section className={styles.shell}>
        <Link href={`/workout-programs/${slug}`} className={styles.breadcrumb}>← Back to {name}</Link>
        <div className={styles.hero}>
          <div className={styles.kicker}>START YOUR PROGRAM</div>
          <h1>Track <span>{name}</span> with Gym Log.</h1>
          <p>{description}</p>
        </div>

        <div className={styles.layout}>
          <section className={`${styles.card} ${styles.mainCard}`}>
            <div className={styles.step}>1</div>
            <h2>Choose your start date</h2>
            <p className={styles.muted}>We'll place the program into your Gym Log calendar starting on this date.</p>
            <label htmlFor="startDate" className={styles.label}>Program start</label>
            <input id="startDate" className={styles.date} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <fieldset className={styles.format}><legend>Workout format</legend><p className={styles.muted}>Choose how to log this program. Your default is selected; this choice applies only to this import.</p>{([{value:"structured",title:"Structured",desc:"Individual sets, reps, targets and completion checks"},{value:"plain",title:"Notes",desc:"Editable free-form workout text"}] as const).map(option=><label key={option.value} className={styles.formatOption}><input type="radio" name="format" value={option.value} checked={format===option.value} onChange={()=>setFormat(option.value)}/><span><strong>{option.title}</strong><small>{option.desc}</small></span></label>)}{format==="structured"&&<p className={styles.muted}>{needsReview?`${needsReview} session(s) contain instructions or targets that need review. Original instructions are preserved in workout notes.`:"Exercise targets are prefilled where specified. Original program instructions remain in workout notes."} No sets are marked complete.</p>}</fieldset>
            <div className={styles.callout}><span className={styles.check}>✓</span><div><strong>Your existing workouts stay safe.</strong><span>New sessions are added only where there is an open slot.</span></div></div>
            <button onClick={handleImport} disabled={busy||!startDate} className={styles.primary}>{busy?"Importing…":`Import as ${format==="structured"?"Structured":"Notes"}`} <span>→</span></button>
            {status ? <p role="status" className={styles.status}>{status}</p> : null}
          </section>

          <aside className={styles.card}>
            <div className={styles.step}>2</div>
            <h2>Here's what you'll get</h2>
            <p className={styles.muted}>{(slug === "gym-log-founder-special" || slug === "gym-log-founder-special-v2") ? "4 weeks × 4 training days = 16 sessions ready to add to your calendar." : `${days.length} training day${days.length === 1 ? "" : "s"} ready to add to your calendar.`}</p>
            <div className={styles.days}>
              {days.map((day, index) => (
                <div key={day.day + day.offsetDays} className={styles.day}>
                  <div className={styles.dayNumber}>{index + 1}</div>
                  <div className={styles.dayCopy}><strong>{day.day}</strong><span>{day.focus}</span><small>{day.exercises.length} exercises · {day.offsetDays === 0 ? "Starts on your chosen date" : `${day.offsetDays} day${day.offsetDays > 1 ? "s" : ""} later`}</small></div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className={styles.footer}><span>Gym Log workout library</span><span>•</span><span>Track it. Progress. Repeat.</span></div>
      </section>
    </main>
  );
}
