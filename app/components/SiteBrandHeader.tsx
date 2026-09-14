"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = new Set(["/", "/subscribe"]);

export default function SiteBrandHeader() {
  const pathname = usePathname();
  if (!pathname || HIDDEN_PATHS.has(pathname)) return null;

  return (
    <header className="site-brand-header">
      <div className="site-brand-header-inner">
        <Link href="/launcher" className="site-brand-link" aria-label="Gym Log home">
          <img src="/gym-log-mark.svg" alt="Gym Log" className="site-brand-mark" width={52} height={32} />
          <span>Gym Log</span>
        </Link>
        <Link href="/" className="site-brand-cta">Open Workout Log <span aria-hidden="true">→</span></Link>
      </div>
    </header>
  );
}
