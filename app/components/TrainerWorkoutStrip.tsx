"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {supabase} from "../lib/supabaseClient";
type Plan={id:string;pending_revision:{token:string}|null};
type Request={id:string;invited_email:string;trainer_id:string};
type NoticeState={owner:string;requests:string[];workouts:string[]};
const empty=(owner:string):NoticeState=>({owner,requests:[],workouts:[]});
const storageKey=(uid:string)=>"gym-log-calendar-coaching-seen-v1:"+uid;
const readSeen=(uid:string):string[]=>{try{const value=JSON.parse(localStorage.getItem(storageKey(uid))||"[]");return Array.isArray(value)?value.filter((x:unknown)=>typeof x==="string"):[];}catch{return [];}};
export default function TrainerWorkoutStrip({userId}:{userId:string|null}){
 const [notices,setNotices]=useState<NoticeState|null>(null);
 const [seen,setSeen]=useState<{owner:string;ids:string[]}|null>(null);
 const seenRef=useRef<{owner:string;ids:string[]}|null>(null);
 useEffect(()=>{
  setNotices(null);
  if(!userId){seenRef.current=null;setSeen(null);return;}
  const uid=userId;
  const initial={owner:uid,ids:readSeen(uid)};seenRef.current=initial;setSeen(initial);
  let active=true,busy=false;
  const load=async()=>{
   if(busy||!active)return;busy=true;
   try{
    const {data:{session}}=await supabase.auth.getSession();
    if(!active||session?.user.id!==uid)return;
    const email=session.user.email?.trim().toLowerCase();
    const [workouts,requests]=await Promise.all([
     supabase.from("trainer_planned_workouts").select("id,pending_revision").eq("client_id",uid).or("client_approved_at.is.null,pending_revision.not.is.null").is("client_removed_at",null),
     supabase.from("trainer_clients").select("id,invited_email,trainer_id").eq("status","pending").is("client_id",null)
    ]);
    if(!active)return;
    const requestIds=(requests.data||[] as Request[]).filter(r=>!!email&&r.invited_email?.trim().toLowerCase()===email&&r.trainer_id!==uid).map(r=>"request:"+r.id);
    const workoutIds=(workouts.data||[] as Plan[]).map(p=>"workout:"+p.id+":"+(p.pending_revision?.token||"new"));
    setNotices(old=>({owner:uid,requests:requests.error?(old?.owner===uid?old.requests:[]):requestIds,workouts:workouts.error?(old?.owner===uid?old.workouts:[]):workoutIds}));
    // Keep seen IDs only while those items remain pending; never reset on fetch error.
    if(!requests.error&&!workouts.error){
     const live=new Set([...requestIds,...workoutIds]);
     const ids=[...new Set([...(seenRef.current?.owner===uid?seenRef.current.ids:[]),...readSeen(uid)])].filter(id=>live.has(id));
     const next={owner:uid,ids};seenRef.current=next;setSeen(next);
     try{localStorage.setItem(storageKey(uid),JSON.stringify(ids));}catch{}
    }
   }catch{}finally{busy=false;}
  };
  const onVisibility=()=>{if(document.visibilityState==="visible")void load();};
  const onStorage=(ev:StorageEvent)=>{if(ev.key!==storageKey(uid))return;const next={owner:uid,ids:[...new Set([...(seenRef.current?.owner===uid?seenRef.current.ids:[]),...readSeen(uid)])]};seenRef.current=next;setSeen(next);};
  void load();const timer=window.setInterval(load,15000);
  window.addEventListener("focus",load);window.addEventListener("pageshow",load);window.addEventListener("storage",onStorage);document.addEventListener("visibilitychange",onVisibility);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener("focus",load);window.removeEventListener("pageshow",load);window.removeEventListener("storage",onStorage);document.removeEventListener("visibilitychange",onVisibility);};
 },[userId]);
 const dismiss=(ids:string[])=>{
  if(!userId)return;const next={owner:userId,ids:[...new Set([...(seenRef.current?.owner===userId?seenRef.current.ids:[]),...readSeen(userId),...ids])]};
  seenRef.current=next;setSeen(next);try{localStorage.setItem(storageKey(userId),JSON.stringify(next.ids));}catch{}
 };
 if(!userId||notices?.owner!==userId||seen?.owner!==userId)return null;
 const unreadRequests=notices.requests.filter(id=>!seen.ids.includes(id));
 const unreadWorkouts=notices.workouts.filter(id=>!seen.ids.includes(id));
 if(!unreadRequests.length&&!unreadWorkouts.length)return null;
 const banner=(ids:string[],kind:"request"|"workout")=>{
  if(!ids.length)return null;const request=kind==="request";
  return <section key={kind} aria-label={request?"Trainer access requests":"Workout approvals"} style={{margin:"8px 16px",padding:"10px 12px",borderRadius:12,border:"1px solid var(--border)",background:"color-mix(in srgb, var(--accent) 7%, var(--surface))",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
   <strong style={{fontSize:13,flex:"1 1 140px",minWidth:0}}>{ids.length} {request?"trainer request":"workout"}{ids.length===1?"":"s"} awaiting approval</strong>
   <Link href={request?"/trainers/client#access":"/trainers/client#workouts"} onClick={()=>dismiss(ids)} style={{fontSize:13,fontWeight:700,color:"var(--text)",textDecoration:"underline",textUnderlineOffset:3}}>{request?"View request"+(ids.length===1?"":"s"):"Review workouts"} →</Link>
   <button type="button" aria-label={request?"Dismiss trainer request notification":"Dismiss assigned workouts notification"} onClick={()=>dismiss(ids)} style={{display:"grid",placeItems:"center",width:34,height:34,flex:"0 0 34px",border:"1px solid var(--border)",borderRadius:8,background:"var(--surface)",color:"var(--text)",fontSize:20,cursor:"pointer"}}>×</button>
  </section>;
 };
 return <>{banner(unreadRequests,"request")}{banner(unreadWorkouts,"workout")}</>;
}
