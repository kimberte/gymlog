"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./community-open.css";

type WorkoutDay = { user_id:string; date_key:string; title?:string|null; entries?:unknown; has_photo?:boolean|null; has_video?:boolean|null; updated_at?:string|null };
type Profile = { id:string; first_name?:string|null; last_name?:string|null; community_share_enabled?:boolean|null };

function displayName(profile?:Profile){const first=String(profile?.first_name??"").trim();const last=String(profile?.last_name??"").trim();if(!first)return "Gym Log Member";return last?`${first} ${last[0].toUpperCase()}.`:first;}
function avatarLetter(profile?:Profile){const name=displayName(profile);return name==="Gym Log Member"?"G":name.charAt(0).toUpperCase();}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function entryCount(entries:unknown){return Array.isArray(entries)?entries.length:0;}

export default function CommunityOpen(){
 const [workouts,setWorkouts]=useState<WorkoutDay[]>([]);const [profiles,setProfiles]=useState<Record<string,Profile>>({});const [sharing,setSharing]=useState(true);const [loading,setLoading]=useState(true);const [signedIn,setSignedIn]=useState(false);const [message,setMessage]=useState("");const today=useMemo(todayKey,[]);
 async function load(){setLoading(true);setMessage("");const {data:sessionData}=await supabase.auth.getSession();const userId=sessionData.session?.user?.id;setSignedIn(Boolean(userId));if(!userId){setWorkouts([]);setProfiles({});setLoading(false);setMessage("Sign in to join the Gym Log community.");return;}
  const profileResult=await supabase.from("profiles").select("id, first_name, last_name, community_share_enabled").eq("id",userId).maybeSingle();if(profileResult.data)setSharing(profileResult.data.community_share_enabled!==false);
  const result=await supabase.from("workout_days").select("user_id, date_key, title, entries, has_photo, has_video, updated_at").eq("date_key",today).order("updated_at",{ascending:false});
  if(result.error){setMessage("Community workouts are unavailable right now.");setWorkouts([]);setProfiles({});setLoading(false);return;}
  const rows=(result.data??[]) as WorkoutDay[];setWorkouts(rows);const ids=Array.from(new Set(rows.map(w=>w.user_id).filter(Boolean)));if(ids.length){const p=await supabase.from("profiles").select("id, first_name, last_name, community_share_enabled").in("id",ids);const map:Record<string,Profile>={};(p.data??[]).forEach(row=>{map[row.id]=row as Profile;});setProfiles(map);}else setProfiles({});setLoading(false);
 }
 useEffect(()=>{load();},[]);
 async function toggleSharing(){const next=!sharing;setSharing(next);setMessage("");const {data:sessionData}=await supabase.auth.getSession();const userId=sessionData.session?.user?.id;if(!userId)return;const {error}=await supabase.from("profiles").update({community_share_enabled:next}).eq("id",userId);if(error){setSharing(!next);setMessage("We couldn't update your sharing preference.");return;}if(!next){setWorkouts(items=>items.filter(item=>item.user_id!==userId));setMessage("Your workouts are hidden from the community.");}else{setMessage("Your workouts are now shared with the community.");}}
 return <main className="community-open-page"><div className="community-open-shell">
  <header className="community-open-header"><div><p className="community-eyebrow">GYM LOG COMMUNITY</p><h1>Community</h1><p className="community-open-subtitle">See what people are training today and stay motivated together.</p></div><div className="community-today-pill">TODAY</div></header>
  <section className="community-share-card"><div className="community-share-icon" aria-hidden="true">↗</div><div className="community-share-copy"><strong>Share my workouts</strong><span>Your workouts are shared with the community by default. Turn this off anytime.</span></div><button type="button" aria-label={sharing?"Turn off workout sharing":"Turn on workout sharing"} aria-pressed={sharing} onClick={toggleSharing} className={`community-switch${sharing?" on":""}`}><span/></button></section>
  {message&&<div className="community-open-message" role="status">{message}</div>}
  <section className="community-feed-section"><div className="community-feed-heading"><div><h2>Training today</h2><p>{loading?"Loading the community feed…":`${workouts.length} workout${workouts.length===1?"":"s"} logged today`}</p></div>{!loading&&workouts.length>0&&<span className="community-count">{workouts.length}</span>}</div>
   {!signedIn&&!loading?<div className="community-empty"><div className="community-empty-icon">◎</div><h3>Join the community</h3><p>Sign in to see today's workouts from other Gym Log members.</p></div>:loading?<div className="community-loading-card"><span className="community-spinner"/>Loading today's workouts</div>:workouts.length===0?<div className="community-empty"><div className="community-empty-icon">+</div><h3>No workouts shared yet</h3><p>Log a workout today and be one of the first to appear here.</p></div>:<div className="community-feed-list">{workouts.map(workout=>{const profile=profiles[workout.user_id];const title=String(workout.title??"Workout").trim()||"Workout";const exercises=entryCount(workout.entries);return <article className="community-workout-card" key={`${workout.user_id}-${workout.date_key}`}><div className="community-workout-person"><div className="community-avatar" aria-hidden="true">{avatarLetter(profile)}</div><div className="community-person-copy"><strong>{displayName(profile)}</strong><span>Training today</span></div><span className="community-live-dot" title="Logged today" aria-label="Logged today"/></div><div className="community-workout-body"><h3>{title}</h3><div className="community-workout-meta">{exercises>0&&<span>{exercises} {exercises===1?"exercise":"exercises"}</span>}{workout.has_photo&&<span>Photo</span>}{workout.has_video&&<span>Video</span>}</div></div></article>})}</div>}
  </section></div></main>;
}
