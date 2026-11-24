import Link from "next/link";
import "../trainer-dashboard.css";
export default function NotificationSettings(){return <main className="trainer-shell"><h1>Notification settings</h1><p>Manage your preferences directly in your workspace.</p><div style={{display:"flex",flexWrap:"wrap",gap:12}}><Link className="trainer-action" href="/?settings=1">Gym Log settings</Link><Link className="trainer-outline-button" style={{margin:0}} href="/trainers/live">Trainer workspace</Link></div></main>;}
