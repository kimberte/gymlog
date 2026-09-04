"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProgramMetadata } from "./programMetadata";

const GOALS = [
  ["muscle", "Build muscle"], ["strength", "Get stronger"], ["fat-loss", "Lose fat"], ["fitness", "Improve fitness"], ["conditioning", "Strength + conditioning"], ["powerlifting", "Powerlifting"],
] as const;
const LEVELS = [["beginner", "Complete beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]] as const;
const DAYS = [2, 3, 4, 5, 6] as const;
const EQUIPMENT = [["gym", "Full gym"], ["home", "Home gym"], ["dumbbells", "Dumbbells"], ["machines", "Machines"], ["bodyweight", "Bodyweight"]] as const;
const STYLES = [["full-body", "Full body"], ["upper-lower", "Upper / lower"], ["ppl", "Push / pull / legs"], ["powerlifting", "Powerlifting"], ["bodybuilding", "Bodybuilding"]] as const;

type Goal = typeof GOALS[number][0];

function scoreProgram(p: ProgramMetadata, goal: Goal, level: string, days: number, equipment: string, style: string) {
  let score = 0;
  const reasons: string[] = [];
  if (p.goalTags.includes(goal)) { score += 30; reasons.push(goal === "muscle" ? "muscle building" : goal === "strength" ? "strength" : goal === "fat-loss" ? "fat loss" : goal === "powerlifting" ? "powerlifting" : "fitness"); }
  if (level === "") score += p.level === "All Levels" ? 8 : 4;
  else if (p.levelTag === level) { score += 20; reasons.push(`${p.level.toLowerCase()} level`); }
  else if (p.level === "All Levels") score += 12;
  else if ((level === "intermediate" && p.level === "Beginner") || (level === "advanced" && p.level === "Intermediate")) score += 5;
  if (p.days === days) { score += 18; reasons.push(`${days} days/week`); }
  else if (Math.abs(p.days - days) === 1) score += 9;
  if (!equipment) score += 6;
  else if (p.equipmentTags.includes(equipment)) { score += 16; reasons.push(equipment === "gym" ? "full gym" : equipment); }
  else if (equipment === "home" && p.equipmentTags.includes("dumbbells")) score += 5;
  if (style && p.styleTags.includes(style)) { score += 10; reasons.push(style === "full-body" ? "full-body training" : style === "upper-lower" ? "upper/lower split" : style === "ppl" ? "PPL" : style); }
  return { score, reasons };
}

export default function WorkoutFinder({ programs }: { programs: ProgramMetadata[] }) {
  const [goal, setGoal] = useState<Goal>("muscle");
  const [level, setLevel] = useState("");
  const [days, setDays] = useState(3);
  const [equipment, setEquipment] = useState("");
  const [style, setStyle] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const recommendations = useMemo(() => programs.map(program => ({ program, ...scoreProgram(program, goal, level, days, equipment, style) })).sort((a,b) => b.score - a.score || a.program.name.localeCompare(b.program.name)).slice(0, 6), [programs, goal, level, days, equipment, style]);

  return <div className="finder-wrap">
    <div className="finder-card">
      <div className="finder-progress"><span>WORKOUT FINDER</span><span>60-second recommendation</span></div>
      <h2>Tell us what you need.</h2>
      <p className="finder-intro">We'll compare your answers against the Gym Log program library and show you the strongest matches.</p>
      <div className="finder-question"><label>What's your primary goal?</label><div className="finder-options">{GOALS.map(([value,label])=><button className={goal===value?"selected":""} onClick={()=>setGoal(value)} key={value}>{label}</button>)}</div></div>
      <div className="finder-question"><label>What's your experience?</label><div className="finder-options">{LEVELS.map(([value,label])=><button className={level===value?"selected":""} onClick={()=>setLevel(value)} key={value}>{label}</button>)}</div></div>
      <div className="finder-question"><label>How many days can you train?</label><div className="finder-options compact">{DAYS.map(value=><button className={days===value?"selected":""} onClick={()=>setDays(value)} key={value}>{value} days</button>)}</div></div>
      <div className="finder-question"><label>Where do you train?</label><div className="finder-options">{EQUIPMENT.map(([value,label])=><button className={equipment===value?"selected":""} onClick={()=>setEquipment(value)} key={value}>{label}</button>)}</div></div>
      <div className="finder-question"><label>Do you have a preferred style? <small>Optional</small></label><div className="finder-options">{STYLES.map(([value,label])=><button className={style===value?"selected":""} onClick={()=>setStyle(style===value?"":value)} key={value}>{label}</button>)}</div></div>
      <button className="finder-submit" onClick={()=>setSubmitted(true)}>Find my programs →</button>
    </div>
    {submitted && <section className="finder-results"><div className="program-detail-kicker">YOUR TOP MATCHES</div><h2>Programs we'd start with</h2><p>These matches are ranked from your goals, experience, schedule, equipment and preferred training style.</p><div className="finder-results-grid">{recommendations.map((item,index)=><Link href={`/workout-programs/${item.program.slug}`} className="finder-result" key={item.program.slug}><div className="finder-rank">#{index+1} · {Math.min(99, Math.max(60, item.score))}% match</div><h3>{item.program.name}</h3><div className="finder-meta">{item.program.category} · {item.program.days} days/week · {item.program.level}</div><p>{item.program.description}</p><span>View program →</span></Link>)}</div></section>}
    <style jsx>{`.finder-wrap{max-width:900px;margin:0 auto;padding:20px}.finder-card{padding:28px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:rgba(255,255,255,.045);box-shadow:0 12px 36px rgba(0,0,0,.15)}.finder-progress{display:flex;justify-content:space-between;gap:12px;font-size:11px;letter-spacing:.08em;font-weight:800;opacity:.55}.finder-card h2{font-size:32px;letter-spacing:-.03em;margin:18px 0 8px}.finder-intro{line-height:1.6;opacity:.7;margin:0 0 28px}.finder-question{padding:22px 0;border-top:1px solid rgba(255,255,255,.08)}.finder-question label{display:block;font-weight:850;margin-bottom:12px}.finder-question small{font-weight:500;opacity:.5}.finder-options{display:flex;flex-wrap:wrap;gap:9px}.finder-options button{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:inherit;border-radius:11px;padding:11px 13px;font:inherit;font-size:13px;cursor:pointer}.finder-options button:hover,.finder-options button.selected{background:var(--accent,#ff5722);border-color:var(--accent,#ff5722);color:#111827;font-weight:800}.finder-submit{width:100%;border:0;border-radius:13px;padding:15px;background:var(--accent,#ff5722);color:#111827;font:inherit;font-weight:900;cursor:pointer;margin-top:10px}.finder-results{padding:55px 0 20px}.finder-results h2{font-size:32px;margin:7px 0}.finder-results>p{opacity:.65;line-height:1.6}.finder-results-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:22px}.finder-result{display:flex;flex-direction:column;padding:20px;border:1px solid rgba(255,255,255,.1);border-radius:17px;background:rgba(255,255,255,.045);color:inherit;text-decoration:none;min-height:250px}.finder-result:hover{transform:translateY(-2px);background:rgba(255,255,255,.07)}.finder-rank{font-size:11px;color:var(--accent,#ff5722);font-weight:900}.finder-result h3{font-size:20px;line-height:1.15;margin:13px 0 7px}.finder-meta{font-size:12px;opacity:.55}.finder-result p{font-size:13px;line-height:1.5;opacity:.68;flex:1}.finder-result span{font-size:13px;font-weight:850;color:var(--accent,#ff5722)}@media(max-width:760px){.finder-results-grid{grid-template-columns:1fr}.finder-card{padding:21px}.finder-card h2{font-size:28px}}`}</style>
  </div>;
}
