"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { getProStatus } from "../lib/entitlements";

export default function ProgramProUpsell() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return;
      const status = await getProStatus(data.session.user.id);
      if (mounted && !status.isPro) setShow(true);
    }
    check();
    return () => { mounted = false; };
  }, []);

  if (!show) return null;

  return (
    <section className="program-pro-card">
      <div>
        <div className="program-detail-kicker">PROTECTION FOR YOUR LOG</div>
        <h2>Keep your workout history safe.</h2>
        <p>You've found a program. Pro makes it easier to keep the work you log: automatic cloud backups, one-tap restore and CSV export when you need your data elsewhere.</p>
      </div>
      <Link href="/subscribe" className="program-pro-upsell">See Gym Log Pro →</Link>
      <style jsx>{`.program-pro-card{margin-top:18px;padding:22px;border-radius:18px;background:linear-gradient(180deg,rgba(255,87,33,.11),rgba(255,255,255,.045));border:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center;gap:20px}.program-pro-card h2{margin:5px 0}.program-pro-card p{margin:0;max-width:720px;line-height:1.55;opacity:.72;font-size:13px}.program-pro-upsell{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--accent,#ff5722);color:#111827;text-decoration:none;font-weight:900;padding:13px 18px;border-radius:12px;white-space:nowrap}.program-pro-upsell:focus-visible{outline:2px solid var(--accent,#ff5722);outline-offset:3px}@media(max-width:800px){.program-pro-card{align-items:stretch;flex-direction:column}.program-pro-upsell{width:100%}}`}</style>
    </section>
  );
}
