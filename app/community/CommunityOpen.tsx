"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./community-open.css";

type WorkoutDay = { user_id:string; date_key:string; title?:string|null; entries?:unknown; notes?:string|null; description?:string|null; has_photo?:boolean|null; has_video?:boolean|null; updated_at?:string|null };
type Profile = { id:string; first_name?:string|null; last_name?:string|null; created_at?:string|null };

function displayName(profile?:Profile){const first=String(profile?.first_name??"").trim();const last=String(profile?.last_name??"").trim();if(!first)return "Gym Log Member";return last?`${first} ${last[0].toUpperCase()}.`:first;}
function avatarLetter(profile?:Profile){const name=displayName(profile);return name==="Gym Log Member"?"G":name.charAt(0).toUpperCase();}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function entryCount(entries:unknown){return Array.isArray(entries)?entries.length:0;}
function memberSince(createdAt?:string|null){if(!createdAt)return "Member";const start=new Date(createdAt);if(Number.isNaN(start.getTime()))return "Member";const now=new Date();let months=(now.getFullYear()-start.getFullYear())*12+(now.getMonth()-start.getMonth());if(now.getDate()<start.getDate())months--;if(months<1)return "New member";if(months<12)return `${months} month${months===1?"":"s"} member`;const years=Math.floor(months/12);const remaining=months%12;return `${years} year${years===1?"":"s"}${remaining?` ${remaining} mo`:""} member`;}
function workoutDescription(workout:WorkoutDay){const direct=String(workout.description??"").trim();if(direct)return direct;const notes=String(workout.notes??"").trim();return notes;}

export default function CommunityOpen(){
 const [workouts,setWorkouts]=useState<WorkoutDay[]>([]);const [profiles,setProfiles]=useState<Record<string,Profile>>({});const [loading,setLoading]=useState(true);const [signedIn,setSignedIn]=useState(false);const [message,setMessage]=useState("");const [expanded,setExpanded]=useState<string|null>(null);const today=useMemo(todayKey,[]);
 async function load(){setLoading(true);setMessage("");const {data:sessionData}=await supabase.auth.getSession();const userId=sessionData.session?.user?.id;setSignedIn(Boolean(userId));if(!userId){setWorkouts([]);setProfiles({});setLoading(false);setMessage("Sign in to join the Gym Log community.");return;}
  const result=await supabase.from("workout_days").select("user_id, date_key, title, entries, notes, description, has_photo, has_video, updated_at").eq("date_key",today).order("updated_at",{ascending:false});
  if(result.error){
   const fallback=await supabase.from("workout_days").select("user_id, date_key, title, entries, has_photo, has_video, updated_at").eq("date_key",today).order("updated_at",{ascending:false});
   if(fallback.error){setMessage("Community workouts are unavailable right now.");setWorkouts([]);setProfiles({});setLoading(false);return;}
   setWorkouts((fallback.data??[]) as WorkoutDay[]);
   const ids=Array.from(new Set((fallback.data??[]).map((w:any)=>w.user_id).filter(Boolean)));await loadProfiles(ids);setLoading(false);return;
  }
  const rows=(result.data??[]) as WorkoutDay[];setWorkouts(rows);const ids=Array.from(new Set(rows.map(w=>w.user_id).filter(Boolean)));await loadProfiles(ids);setLoading(false);
 }
 async function loadProfiles(ids:string[]){if(!ids.length){setProfiles({});return;}const p=await supabase.from("profiles").select("id, first_name, last_name, created_at").in("id",ids);const map:Record<string,Profile>={};(p.data??[]).forEach(row=>{map[row.id]=row as Profile;});setProfiles(map);}
 useEffect(()=>{load();},[]);
 return <main className="community-open-page"><div className="community-open-shell">
  <header className="community-open-header"><div><p className="community-eyebrow">GYM LOG COMMUNITY</p><h1>Community</h1><p className="community-open-subtitle">See what the Gym Log community is training today.</p></div><div className="community-today-pill">TODAY</div></header>
  {message&&<div className="community-open-message" role="status">{message}</div>}
  <section className="community-feed-section"><div className="community-feed-heading"><div><h2>Training today</h2><p>{loading?"Loading the community feed…":`${workouts.length} workout${workouts.length===1?"":"s"} logged today`}</p></div>{!loading&&workouts.length>0&&<span className="community-count">{workouts.length}</span>}</div>
   {!signedIn&&!loading?<div className="community-empty"><div className="community-empty-icon">◎</div><h3>Join the community</h3><p>Sign in to see what other Gym Log members are training today.</p></div>:loading?<div className="community-loading-card"><span className="community-spinner"/>Loading today's workouts</div>:workouts.length===0?<div className="community-empty"><div className="community-empty-icon">+</div><h3>No workouts logged yet</h3><p>Be one of the first members to log a workout today.</p></div>:<div className="community-feed-list">{workouts.map(workout=>{const profile=profiles[workout.user_id];const title=String(workout.title??"Workout").trim()||"Workout";const exercises=entryCount(workout.entries);const key=`${workout.user_id}-${workout.date_key}`;const isExpanded=expanded===key;const description=workoutDescription(workout);return <article className={`community-workout-card${isExpanded?" expanded":""}`} key={key}>
    <button type="button" className="community-workout-trigger" aria-expanded={isExpanded} onClick={()=>setExpanded(isExpanded?null:key)}>
      <div className="community-workout-person"><div className="community-avatar" aria-hidden="true">{avatarLetter(profile)}</div><div className="community-person-copy"><strong>{displayName(profile)}</strong><span>{memberSince(profile?.created_at)} · {exercises} workout entries</span></div><div className="community-feed-indicators">{workout.has_photo&&<span title="Photo logged" aria-label="Photo logged">▣</span>}{workout.has_video&&<span title="Video logged" aria-label="Video logged">▶</span>}<span className="community-chevron">{isExpanded?"⌃":"⌄"}</span></div></div>
      <div className="community-workout-summary"><h3>{title}</h3><div className="community-workout-meta"><span>Training today</span>{exercises>0&&<span>{exercises} {exercises===1?"exercise":"exercises"}</span>}</div></div>
    </button>
    {isExpanded&&<div className="community-workout-details"><div className="community-detail-row"><span className="community-detail-label">Workout</span><strong>{title}</strong></div><div className="community-detail-row"><span className="community-detail-label">Description</span><p>{description||"No workout description added."}</p></div>{(workout.has_photo||workout.has_video)&&<div className="community-media-row">{workout.has_photo&&<span>▣ Photo logged</span>}{workout.has_video&&<span>▶ Video logged</span>}</div>}</div>}
   </article>})}</div>}
  </section></div></main>;
}
