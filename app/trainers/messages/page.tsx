import Link from "next/link";
import CoachingMessages from "../../components/CoachingMessages";
import "../trainer-dashboard.css";
export default function CoachingInboxPage(){return <main className="trainer-shell trainer-product"><header className="trainer-hero"><div><span className="trainer-eyebrow">GYM LOG COACHING</span><h1>Private messages<span className="trainer-heading-period">.</span></h1><p>Chat with your approved coaching connections.</p></div><div className="coach-builder-actions"><Link className="trainer-outline-button" href="/trainers">Coaching dashboard</Link><Link className="trainer-action" href="/">Calendar</Link></div></header><CoachingMessages/></main>;}
