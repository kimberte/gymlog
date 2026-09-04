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
    </section>
  );
}
