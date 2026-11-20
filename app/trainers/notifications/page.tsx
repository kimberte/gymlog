"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import "../trainer-dashboard.css";
type Prefs={user_id:string;workout_assigned:boolean;workout_updated:boolean;workout_completed:boolean;email_enabled:boolean;push_enabled:boolean};
const defaults={workout_assigned:true,workout_updated:true,workout_completed:true,email_enabled:true,push_enabled:false};
const fields:[keyof typeof defaults,string,string][]=[
 ["workout_assigned","New workout assigned","Notify me when my trainer assigns a workout"],
 ["workout_updated","Workout updated","Notify me when my trainer changes a workout"],
 ["workout_completed","Workout completed","Notify me when a connected client completes a workout"],
 ["email_enabled","Email delivery","Allow trainer-related email notifications when available"],
 ["push_enabled","Push delivery","Allow trainer-related push notifications when available"]
];
export default function TrainerNotificationsSettings(){
 const [prefs,setPrefs]=useState<Prefs|null>(null);
 const [status,setStatus]=useState("Loading notification preferences…");
 const [saving,setSaving]=useState(false);
 useEffect(()=>{let active=true;(async()=>{const {data:{user},error}=await supabase.auth.getUser();if(!active)return;if(error||!user){setStatus("Please sign in to Gym Log first.");return;}const {data,error:readError}=await supabase.from("trainer_notification_preferences").select("*").eq("user_id",user.id).maybeSingle();if(!active)return;if(readError){setStatus(readError.message);return;}setPrefs({user_id:user.id,...defaults,...(data||{})});setStatus("")})();return()=>{active=false}},[]);
 const save=async()=>{if(!prefs)return;setSaving(true);setStatus("");const {error}=await supabase.from("trainer_notification_preferences").upsert({...prefs,updated_at:new Date().toISOString()},{onConflict:"user_id"});setSaving(false);setStatus(error?error.message:"Preferences saved. Delivery channels will activate when notifications are connected.")};
 return <main className="trainer-shell"><header className="trainer-hero"><div><span className="trainer-eyebrow">GYM LOG / NOTIFICATIONS</span><h1>Coaching notifications</h1><p>Choose which training updates matter to you.</p></div><Link href="/trainers/live">Trainer workspace</Link></header><section className="trainer-main" style={{maxWidth:760}}>{prefs&&<><div className="trainer-client-list">{fields.map(([key,label,description])=><label key={key} className="trainer-client" style={{justifyContent:"space-between",cursor:"pointer",padding:16}}><span style={{flex:1}}><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={prefs[key]} onChange={e=>setPrefs(prev=>prev?{...prev,[key]:e.target.checked}:prev)} style={{width:22,height:22,accentColor:"#ff6b22"}}/></label>)}</div><p className="trainer-hint">These preferences are stored in your account. Email, push and in-app event delivery are still being implemented.</p><button className="trainer-action" disabled={saving} onClick={save}>{saving?"Saving…":"Save preferences"}</button></>}{status&&<p role="status" className="trainer-notice">{status}</p>}</section></main>
}
