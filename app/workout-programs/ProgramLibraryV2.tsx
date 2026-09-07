"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Program } from "../lib/programs";

const QUICK_SEARCHES = ["strength", "muscle building", "beginner", "powerlifting", "dumbbell", "home"];

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
      return (!q || haystack.includes(q)) &&
        (category === "All" || p.category === category) &&
        (days === "All" || String(p.days) === days) &&
        (level === "All" || p.level === level) &&
        (equipment === "All" || p.equipment === equipment) &&
        (goal === "All" || p.goal === goal);
    });
    return result.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "days" ? a.days - b.days || a.name.localeCompare(b.name) : 0);
  }, [programs, query, category, days, level, equipment, goal, sort]);

  const hasFilters = Boolean(query || category !== "All" || days !== "All" || level !== "All" || equipment !== "All" || goal !== "All");
  const clearFilters = () => { setQuery(""); setCategory("All"); setDays("All"); setLevel("All"); setEquipment("All"); setGoal("All"); setSort("featured"); };

  return (
    <section className="program-library-v2" aria-labelledby="all-programs-heading">
      <div className="program-library-heading">
        <div>
          <div className="program-detail-kicker">EXPLORE THE LIBRARY</div>
          <h2 id="all-programs-heading">Find your next workout program</h2>
          <p>Search by program name or training goal, then narrow it down by schedule, experience level and equipment.</p>
        </div>
        <Link href="/workout-programs/find" className="program-finder-button">Not sure? Find my workout →</Link>
      </div>

      <div className="program-search-row">
        <label className="program-search-box"><span className="sr-only">Search workout programs</span><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search programs, goals, equipment..." /></label>
        <button type="button" className="program-clear-button" onClick={clearFilters} disabled={!hasFilters}>Clear filters</button>
      </div>

      <div className="program-quick-searches" aria-label="Popular searches">
        <span>Popular:</span>
        {QUICK_SEARCHES.map(term => <button type="button" key={term} onClick={() => setQuery(term)}>{term}</button>)}
      </div>

      <div className="program-filter-grid">
        <label>Goal<select value={goal} onChange={e => setGoal(e.target.value)}>{goals.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Training style<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Days per week<select value={days} onChange={e => setDays(e.target.value)}><option value="All">Any</option>{[2,3,4,5,6].map(n => <option key={n} value={String(n)}>{n} days</option>)}</select></label>
        <label>Experience<select value={level} onChange={e => setLevel(e.target.value)}>{levels.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Equipment<select value={equipment} onChange={e => setEquipment(e.target.value)}>{equipmentOptions.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Sort<select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Recommended</option><option value="name">A–Z</option><option value="days">Fewest days first</option></select></label>
      </div>

      <div className="program-results-toolbar"><strong>{filtered.length}</strong> {filtered.length === 1 ? "program" : "programs"} found <span>{hasFilters ? "· Filters active" : "· Showing the full library"}</span></div>

      <div className="program-grid-v2">
        {filtered.map(p => <Link href={`/workout-programs/${p.slug}`} className="program-card-v2" key={p.slug}>
          <div className="program-card-top-v2"><span>{p.category}</span><span>{p.days} days/week</span></div>
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <div className="program-card-meta-v2"><span>{p.level}</span><span>{p.goal}</span></div>
          <div className="program-card-track"><span>View program</span><strong>View &amp; track →</strong></div>
        </Link>)}
      </div>

      {!filtered.length && <div className="program-empty-v2"><h3>No programs match those filters.</h3><p>Try a broader search or reset the filters.</p><button type="button" onClick={clearFilters}>Reset library</button></div>}

      <style jsx global>{`
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        .program-library-v2{max-width:1100px;margin:auto;padding:28px 20px 60px}
        .program-library-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:18px}
        .program-library-heading h2{font-size:clamp(28px,4vw,38px);line-height:1.08;margin:7px 0 9px;letter-spacing:-.025em}
        .program-library-heading p{margin:0;max-width:700px;line-height:1.6;opacity:.68}
        .program-finder-button{flex-shrink:0;padding:12px 16px;border-radius:12px;background:var(--accent,#ff5722);color:#111827;text-decoration:none;font-size:13px;font-weight:900}
        .program-search-row{display:flex;gap:10px;align-items:center}
        .program-search-box{position:relative;display:flex;align-items:center;gap:9px;flex:1;padding:0 14px;border:1px solid rgba(255,255,255,.15);border-radius:14px;background:rgba(255,255,255,.065)}
        .program-search-box>span{font-size:23px;opacity:.6}
        .program-search-box input{width:100%;padding:15px 0;border:0;outline:0;background:transparent;color:inherit;font:inherit}
        .program-search-box input::placeholder{opacity:.55}
        .program-clear-button{padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);color:inherit;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
        .program-clear-button:disabled{opacity:.35;cursor:default}
        .program-quick-searches{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin:11px 0 15px;font-size:12px;opacity:.8}
        .program-quick-searches>span{opacity:.55;margin-right:2px}
        .program-quick-searches button{border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:6px 10px;background:rgba(255,255,255,.04);color:inherit;font:inherit;cursor:pointer}
        .program-quick-searches button:hover{border-color:var(--accent,#ff5722)}
        .program-filter-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.025)}
        .program-filter-grid label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:800;opacity:.72}
        .program-filter-grid select{width:100%;box-sizing:border-box;padding:11px 10px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.06);color:inherit;font:inherit;font-size:12px}
        .program-results-toolbar{margin:16px 0 13px;font-size:13px;opacity:.62}.program-results-toolbar strong{color:inherit;opacity:1}.program-results-toolbar span{opacity:.7}
        .program-grid-v2{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .program-card-v2{display:flex;flex-direction:column;min-height:255px;padding:19px;border:1px solid rgba(255,255,255,.1);border-radius:17px;background:rgba(255,255,255,.045);color:inherit;text-decoration:none;box-shadow:0 8px 28px rgba(0,0,0,.11);transition:transform .15s ease,background .15s ease,border-color .15s ease}
        .program-card-v2:hover{transform:translateY(-3px);background:rgba(255,255,255,.07);border-color:var(--accent,#ff5722)}
        .program-card-v2:focus-visible{outline:2px solid var(--accent,#ff5722);outline-offset:3px}
        .program-card-top-v2{display:flex;justify-content:space-between;gap:8px;font-size:11px;opacity:.55}
        .program-card-v2 h3{font-size:20px;line-height:1.18;margin:15px 0 8px}.program-card-v2 p{font-size:13px;line-height:1.55;opacity:.68;flex:1;margin:0 0 14px}
        .program-card-meta-v2{display:flex;gap:7px;flex-wrap:wrap}.program-card-meta-v2 span{padding:5px 8px;border-radius:8px;background:rgba(255,255,255,.055);font-size:11px;opacity:.72}
        .program-card-track{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:15px;padding-top:12px;border-top:1px solid rgba(255,255,255,.09);font-size:12px}.program-card-track span{opacity:.55}.program-card-track strong{color:var(--accent,#ff5722)}
        .program-empty-v2{text-align:center;padding:55px 20px;border:1px dashed rgba(255,255,255,.14);border-radius:16px}.program-empty-v2 h3{margin:0 0 7px}.program-empty-v2 p{opacity:.62}.program-empty-v2 button{padding:10px 14px;border:0;border-radius:10px;background:var(--accent,#ff5722);font-weight:800;cursor:pointer}
        @media(max-width:900px){.program-filter-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.program-grid-v2{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:650px){.program-library-heading{align-items:stretch;flex-direction:column;gap:14px}.program-finder-button{text-align:center}.program-search-row{align-items:stretch;flex-direction:column}.program-search-box,.program-clear-button{width:100%;box-sizing:border-box}.program-filter-grid{grid-template-columns:1fr 1fr}.program-grid-v2{grid-template-columns:1fr}.program-card-v2{min-height:0}}
      `}</style>
    </section>
  );
}
