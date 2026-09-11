"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Program } from "../lib/programs";

const QUICK_SEARCHES = ["strength", "muscle building", "beginner", "powerlifting", "dumbbell", "home"];

type BrowseSection = {
  title: string;
  subtitle: string;
  icon: string;
  tone: string;
  test: (p: Program) => boolean;
};

const BROWSE_SECTIONS: BrowseSection[] = [
  { title: "Popular programs", subtitle: "Proven starting points across the library", icon: "★", tone: "popular", test: () => true },
  { title: "Build muscle", subtitle: "Hypertrophy-focused programs", icon: "↗", tone: "muscle", test: p => /muscle|hypertrophy|bodybuilding/i.test(`${p.goal} ${p.category}`) },
  { title: "Get stronger", subtitle: "Strength, powerlifting and powerbuilding", icon: "▣", tone: "strength", test: p => /strength|powerlifting|powerbuilding/i.test(`${p.goal} ${p.category}`) },
  { title: "Beginner friendly", subtitle: "Simple programs to build your base", icon: "＋", tone: "beginner", test: p => p.level === "Beginner" || p.category === "Beginners" },
  { title: "3 days per week", subtitle: "A great balance of training and recovery", icon: "3", tone: "three", test: p => p.days === 3 },
  { title: "Home & minimal equipment", subtitle: "Train with less equipment", icon: "⌂", tone: "home", test: p => /home|dumbbell|bodyweight|minimal/i.test(p.equipment) || /home|bodyweight|minimal/i.test(p.category) },
];

function ProgramCard({ program, compact = false }: { program: Program; compact?: boolean }) {
  return <Link href={`/workout-programs/${program.slug}`} className={compact ? "program-discovery-card" : "program-card-v2"}>
    {compact && <div className={`program-thumb program-thumb-${program.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}><span>{program.category === "Strength" || program.category === "Powerlifting" ? "▣" : program.category === "Home & Bodyweight" ? "⌂" : program.category === "Beginners" ? "＋" : "↗"}</span></div>}
    <div className={compact ? "program-discovery-card-body" : "program-card-body-v2"}>
      <div className="program-card-top-v2"><span className="program-card-category">{program.category}</span><span className="program-days">{program.days} days</span></div>
      <h3>{program.name}</h3>
      <p>{compact ? program.bestFor : program.description}</p>
      <div className="program-card-meta-v2"><span>{program.level}</span><span>{program.goal}</span></div>
      {!compact && <div className="program-card-track"><span>Program details</span><strong>View &amp; track <b>→</b></strong></div>}
    </div>
  </Link>;
}

export default function ProgramLibraryV2({ programs }: { programs: Program[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [days, setDays] = useState("All");
  const [level, setLevel] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [goal, setGoal] = useState("All");
  const [sort, setSort] = useState("featured");

  const categories = useMemo(() => ["All", ...Array.from(new Set(programs.map(p => p.category))).sort()], [programs]);
  const levels = ["All", "Beginner", "Intermediate", "Advanced", "All Levels"];
  const equipmentOptions = useMemo(() => ["All", ...Array.from(new Set(programs.map(p => p.equipment))).sort()], [programs]);
  const goals = useMemo(() => ["All", ...Array.from(new Set(programs.map(p => p.goal))).sort()], [programs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = programs.filter(p => {
      const haystack = [p.name, p.category, p.goal, p.level, p.equipment, p.description, p.bestFor].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) && (category === "All" || p.category === category) && (days === "All" || String(p.days) === days) && (level === "All" || p.level === level) && (equipment === "All" || p.equipment === equipment) && (goal === "All" || p.goal === goal);
    });
    return result.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "days" ? a.days - b.days || a.name.localeCompare(b.name) : 0);
  }, [programs, query, category, days, level, equipment, goal, sort]);

  const hasFilters = Boolean(query || category !== "All" || days !== "All" || level !== "All" || equipment !== "All" || goal !== "All");
  const clearFilters = () => { setQuery(""); setCategory("All"); setDays("All"); setLevel("All"); setEquipment("All"); setGoal("All"); setSort("featured"); };
  const browsePrograms = (section: BrowseSection) => {
    if (section.title === "Popular programs") return programs.slice(0, 10);
    return programs.filter(section.test).slice(0, 10);
  };

  return <section className="program-library-v2" aria-labelledby="all-programs-heading">
    <div className="program-library-heading">
      <div><div className="program-detail-kicker">EXPLORE THE LIBRARY</div><h2 id="all-programs-heading">Find your next workout program</h2><p>Start with a focused collection, swipe through programs that fit your goal, or search the full Gym Log library.</p></div>
      <Link href="/workout-programs/find" className="program-finder-button">Not sure? Find my workout <span>→</span></Link>
    </div>

    {!hasFilters && <div className="program-discovery" aria-label="Program collections">
      {BROWSE_SECTIONS.map(section => {
        const items = browsePrograms(section);
        if (!items.length) return null;
        return <div className="program-discovery-section" key={section.title}>
          <div className="program-discovery-heading">
            <div className="program-discovery-title"><span className={`program-category-icon ${section.tone}`}>{section.icon}</span><div><h3>{section.title}</h3><p>{section.subtitle}</p></div></div>
            <button type="button" className="program-see-all" onClick={() => { setQuery(""); setCategory("All"); setDays("All"); setLevel("All"); setEquipment("All"); setGoal("All"); if (section.title.includes("Build muscle")) setGoal("Muscle building"); else if (section.title.includes("Get stronger")) setGoal("Strength"); else if (section.title.includes("Beginner")) setLevel("Beginner"); else if (section.title.includes("3 days")) setDays("3"); else if (section.title.includes("Home")) setCategory("Home & Bodyweight"); }}>See all <span>→</span></button>
          </div>
          <div className="program-horizontal-row">{items.map(p => <ProgramCard key={p.slug} program={p} compact />)}</div>
        </div>;
      })}
    </div>}

    <div className="program-browse-divider"><div><span className="program-detail-kicker">FULL LIBRARY</span><h3>Browse all {programs.length}+ programs</h3><p>Search and filter the complete collection.</p></div>{!hasFilters && <span className="program-browse-hint">← Swipe rows above</span>}</div>

    <div className="program-search-panel"><div className="program-search-row"><label className="program-search-box"><span className="program-search-icon" aria-hidden="true">⌕</span><span className="sr-only">Search workout programs</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search programs, goals, equipment..." /></label><button type="button" className="program-clear-button" onClick={clearFilters} disabled={!hasFilters}>Clear</button></div><div className="program-quick-searches" aria-label="Popular searches"><span>Popular searches</span>{QUICK_SEARCHES.map(term => <button type="button" key={term} onClick={() => setQuery(term)}>{term}</button>)}</div></div>

    <div className="program-filter-grid"><label><span>Goal</span><select value={goal} onChange={e => setGoal(e.target.value)}>{goals.map(x => <option key={x}>{x}</option>)}</select></label><label><span>Training style</span><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(x => <option key={x}>{x}</option>)}</select></label><label><span>Days per week</span><select value={days} onChange={e => setDays(e.target.value)}><option value="All">Any schedule</option>{[2,3,4,5,6].map(n => <option key={n} value={String(n)}>{n} days</option>)}</select></label><label><span>Experience</span><select value={level} onChange={e => setLevel(e.target.value)}>{levels.map(x => <option key={x}>{x}</option>)}</select></label><label><span>Equipment</span><select value={equipment} onChange={e => setEquipment(e.target.value)}>{equipmentOptions.map(x => <option key={x}>{x}</option>)}</select></label><label><span>Sort</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Recommended</option><option value="name">A–Z</option><option value="days">Fewest days</option></select></label></div>

    <div className="program-results-toolbar"><div><strong>{filtered.length}</strong> {filtered.length === 1 ? "program" : "programs"}</div><span>{hasFilters ? "Filters applied" : "Full library"}</span></div>
    <div className="program-grid-v2">{filtered.map(p => <ProgramCard key={p.slug} program={p} />)}</div>
    {!filtered.length && <div className="program-empty-v2"><div className="program-empty-icon">⌕</div><h3>No programs match those filters.</h3><p>Try a broader search or reset the library filters.</p><button type="button" onClick={clearFilters}>Reset library</button></div>}

    <style jsx global>{`
      .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      .program-library-v2{max-width:1100px;margin:auto;padding:42px 20px 72px}
      .program-library-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:25px}.program-library-heading h2{font-size:clamp(29px,4vw,40px);line-height:1.06;margin:8px 0 10px;letter-spacing:-.035em}.program-library-heading p{margin:0;max-width:700px;line-height:1.65;opacity:.62;font-size:14px}.program-finder-button{flex-shrink:0;padding:12px 16px;border-radius:13px;background:var(--accent,#ff5722);color:#111827;text-decoration:none;font-size:13px;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.15)}
      .program-discovery{display:flex;flex-direction:column;gap:27px;margin-bottom:38px}.program-discovery-section{min-width:0}.program-discovery-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 2px 11px}.program-discovery-title{display:flex;align-items:center;gap:11px;min-width:0}.program-category-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;flex:none;font-weight:950;font-size:17px;color:#fff;background:linear-gradient(145deg,#3b4554,#171c25);box-shadow:0 7px 20px rgba(0,0,0,.16)}.program-category-icon.muscle{background:linear-gradient(145deg,#a85b35,#382018)}.program-category-icon.strength{background:linear-gradient(145deg,#566f91,#1b2635)}.program-category-icon.beginner{background:linear-gradient(145deg,#6d8b64,#263526)}.program-category-icon.three{background:linear-gradient(145deg,#78639b,#292039)}.program-category-icon.home{background:linear-gradient(145deg,#6d7865,#252b23)}.program-discovery-title h3{margin:0;font-size:16px;letter-spacing:-.015em}.program-discovery-title p{margin:3px 0 0;font-size:11px;opacity:.5}.program-see-all{border:0;background:none;color:var(--accent,#ff5722);font:inherit;font-size:11px;font-weight:850;white-space:nowrap;cursor:pointer;padding:7px 2px}.program-see-all span{font-size:14px;margin-left:3px}
      .program-horizontal-row{display:flex;gap:11px;overflow-x:auto;padding:1px 2px 9px;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}.program-horizontal-row::-webkit-scrollbar{display:none}.program-discovery-card{scroll-snap-align:start;flex:0 0 218px;min-width:218px;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.095);border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.025));color:inherit;text-decoration:none;box-shadow:0 7px 24px rgba(0,0,0,.1);transition:transform .18s ease,border-color .18s ease}.program-discovery-card:hover{transform:translateY(-3px);border-color:rgba(255,87,34,.5)}.program-thumb{height:91px;position:relative;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#414b5a,#171b23)}.program-thumb:before{content:"";position:absolute;inset:-30%;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.2),transparent 38%),linear-gradient(135deg,transparent 35%,rgba(255,87,34,.32) 36%,transparent 60%);transform:rotate(-10deg)}.program-thumb span{position:relative;width:45px;height:45px;border-radius:14px;display:grid;place-items:center;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);font-size:22px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.4)}.program-thumb-strength,.program-thumb-powerlifting,.program-thumb-powerbuilding{background:linear-gradient(135deg,#50647c,#1a2330)}.program-thumb-hypertrophy,.program-thumb-bodybuilding{background:linear-gradient(135deg,#8c5238,#291c18)}.program-thumb-beginners,.program-thumb-general-fitness{background:linear-gradient(135deg,#687f62,#222d21)}.program-thumb-home---bodyweight,.program-thumb-kettlebell{background:linear-gradient(135deg,#6f7660,#24291f)}.program-discovery-card-body{padding:13px 14px 15px}.program-discovery-card h3{font-size:15px;line-height:1.2;margin:10px 0 6px;letter-spacing:-.015em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.program-discovery-card p{font-size:11px;line-height:1.45;opacity:.52;margin:0 0 11px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .program-browse-divider{display:flex;align-items:end;justify-content:space-between;gap:15px;margin:0 2px 16px;padding-top:5px}.program-browse-divider h3{font-size:21px;margin:6px 0 3px;letter-spacing:-.02em}.program-browse-divider p{margin:0;font-size:11px;opacity:.48}.program-browse-hint{font-size:10px;opacity:.38;margin-bottom:5px}
      .program-search-panel{padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));box-shadow:0 12px 35px rgba(0,0,0,.12)}.program-search-row{display:flex;gap:9px;align-items:center}.program-search-box{position:relative;display:flex;align-items:center;gap:10px;flex:1;padding:0 14px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(0,0,0,.13)}.program-search-icon{font-size:22px;line-height:1;opacity:.55}.program-search-box input{width:100%;padding:14px 0;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:14px}.program-search-box input::placeholder{opacity:.45}.program-clear-button{padding:12px 15px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);color:inherit;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.program-clear-button:disabled{opacity:.3;cursor:default}.program-quick-searches{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin:12px 2px 1px;font-size:11px}.program-quick-searches>span{opacity:.45;font-weight:700;margin-right:2px}.program-quick-searches button{border:1px solid rgba(255,255,255,.09);border-radius:999px;padding:6px 10px;background:rgba(255,255,255,.035);color:inherit;font:inherit;cursor:pointer;transition:border-color .15s ease,background .15s ease}.program-quick-searches button:hover{border-color:var(--accent,#ff5722);background:rgba(255,87,34,.08)}
      .program-filter-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin-top:10px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.018)}.program-filter-grid label{display:flex;flex-direction:column;gap:6px;font-size:10px;font-weight:800;letter-spacing:.02em;opacity:.68}.program-filter-grid select{width:100%;box-sizing:border-box;padding:10px 9px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.045);color:inherit;font:inherit;font-size:11px;outline:none}.program-filter-grid select:focus{border-color:var(--accent,#ff5722)}
      .program-results-toolbar{display:flex;justify-content:space-between;align-items:center;margin:18px 2px 12px;font-size:12px;opacity:.58}.program-results-toolbar strong{font-size:14px;opacity:1}.program-results-toolbar span{padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.04);font-size:10px}.program-grid-v2{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.program-card-v2{display:flex;flex-direction:column;min-height:258px;padding:19px;border:1px solid rgba(255,255,255,.095);border-radius:18px;background:linear-gradient(145deg,rgba(255,255,255,.052),rgba(255,255,255,.025));color:inherit;text-decoration:none;box-shadow:0 8px 28px rgba(0,0,0,.1);transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease}.program-card-v2:hover{transform:translateY(-4px);background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.035));border-color:rgba(255,87,34,.55);box-shadow:0 14px 35px rgba(0,0,0,.17)}.program-card-v2:focus-visible,.program-discovery-card:focus-visible{outline:2px solid var(--accent,#ff5722);outline-offset:3px}.program-card-body-v2{display:flex;flex-direction:column;min-height:220px;flex:1}.program-card-top-v2{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:10px;letter-spacing:.02em}.program-card-category{opacity:.62}.program-days{padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.055);opacity:.75;white-space:nowrap}.program-card-v2 h3{font-size:20px;line-height:1.18;margin:16px 0 9px;letter-spacing:-.015em}.program-card-v2 p{font-size:13px;line-height:1.58;opacity:.62;flex:1;margin:0 0 15px}.program-card-meta-v2{display:flex;gap:6px;flex-wrap:wrap}.program-card-meta-v2 span{padding:5px 8px;border-radius:7px;background:rgba(255,255,255,.045);font-size:10px;opacity:.68}.program-card-track{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:15px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);font-size:11px}.program-card-track span{opacity:.4}.program-card-track strong{color:var(--accent,#ff5722);font-weight:850}.program-card-track b{font-size:14px;margin-left:2px}.program-empty-v2{text-align:center;padding:62px 20px;border:1px dashed rgba(255,255,255,.14);border-radius:18px;background:rgba(255,255,255,.02)}.program-empty-icon{font-size:30px;opacity:.35}.program-empty-v2 h3{margin:10px 0 6px}.program-empty-v2 p{opacity:.55;font-size:13px}.program-empty-v2 button{padding:10px 14px;border:0;border-radius:10px;background:var(--accent,#ff5722);font-weight:800;cursor:pointer}
      @media(max-width:900px){.program-filter-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.program-grid-v2{grid-template-columns:repeat(2,minmax(0,1fr))}.program-discovery-card{flex-basis:205px;min-width:205px}}
      @media(max-width:650px){.program-library-v2{padding-top:30px}.program-library-heading{align-items:stretch;flex-direction:column;gap:14px}.program-finder-button{text-align:center}.program-discovery{gap:23px;margin-left:-20px;margin-right:-20px}.program-discovery-heading{margin-left:20px;margin-right:20px}.program-horizontal-row{padding-left:20px;padding-right:20px}.program-discovery-card{flex-basis:218px;min-width:218px}.program-search-row{align-items:stretch;flex-direction:column}.program-search-box,.program-clear-button{width:100%;box-sizing:border-box}.program-filter-grid{grid-template-columns:1fr 1fr;padding:10px}.program-grid-v2{grid-template-columns:1fr}.program-card-v2{min-height:0;padding:18px}.program-quick-searches{gap:6px}.program-quick-searches button{padding:6px 8px}.program-browse-divider{align-items:flex-start;flex-direction:column}.program-browse-hint{display:none}}
    `}</style>
  </section>;
}
