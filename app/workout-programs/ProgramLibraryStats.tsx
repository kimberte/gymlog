"use client";

import { useEffect, useState } from "react";
import { getOverallProgramStats } from "../lib/programStats";

export default function ProgramLibraryStats() {
  const [stats, setStats] = useState({ views: 0, downloads: 0 });
  useEffect(() => { getOverallProgramStats().then(setStats); }, []);
  return <><div className="program-library-stats"><div><strong>{stats.views.toLocaleString()}</strong><span>program views</span></div><div><strong>{stats.downloads.toLocaleString()}</strong><span>downloads</span></div></div><style jsx>{`.program-library-stats{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.program-library-stats div{display:flex;align-items:baseline;gap:6px;padding:8px 12px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:rgba(255,255,255,.05)}.program-library-stats strong{font-size:18px}.program-library-stats span{font-size:12px;opacity:.72}`}</style></>;
}
