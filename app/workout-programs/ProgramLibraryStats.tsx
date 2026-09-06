"use client";

import { useEffect, useState } from "react";
import { getOverallProgramStats } from "../lib/programStats";

export default function ProgramLibraryStats() {
  const [stats, setStats] = useState({ views: 0, downloads: 0 });
  useEffect(() => { getOverallProgramStats().then(setStats); }, []);
  return <div className="program-library-stats"><strong>{stats.views.toLocaleString()}</strong><span>program views</span><strong>{stats.downloads.toLocaleString()}</strong><span>downloads</span></div>;
}
