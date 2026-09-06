"use client";

import { useEffect, useState } from "react";
import { incrementProgramStat } from "../lib/programStats";

type Props = { slug: string };

export default function ProgramStats({ slug }: Props) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    incrementProgramStat(slug, "views").then(value => { if (active) setViews(value); });
    return () => { active = false; };
  }, [slug]);

  if (views === null) return null;
  return <div className="program-usage-stats" aria-label={`${views.toLocaleString()} Gym Log views`}><span>👁 {views.toLocaleString()} views</span></div>;
}
