"use client";
import {useEffect,useState} from "react";
import {supabase} from "./supabaseClient";
export type CoachingRole="trainer"|"client"|"all";
export function useCoachingUnread(userId:string|null,role:CoachingRole="all"){
 const [count,setCount]=useState(0);
 useEffect(()=>{
  setCount(0);if(!userId)return;let active=true,busy=false;
  const refresh=async()=>{if(busy)return;busy=true;try{let q=supabase.from("coaching_messages").select("id",{count:"exact",head:true}).eq("recipient_id",userId).is("read_at",null);if(role==="trainer")q=q.eq("trainer_id",userId);if(role==="client")q=q.eq("client_id",userId);const {count,error}=await q;if(active&&!error)setCount(count||0);}finally{busy=false;}};
  const onRefresh=()=>void refresh();onRefresh();const timer=window.setInterval(onRefresh,15000);window.addEventListener("focus",onRefresh);window.addEventListener("gym-log:messages-read",onRefresh);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener("focus",onRefresh);window.removeEventListener("gym-log:messages-read",onRefresh);};
 },[userId,role]);
 return count;
}
export function useCoachingSession(){
 const [uid,setUid]=useState<string|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;void supabase.auth.getSession().then(({data})=>{if(active){setUid(data.session?.user.id||null);setLoading(false);}});const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(active){setUid(session?.user.id||null);setLoading(false);}});return()=>{active=false;subscription.unsubscribe();};},[]);
 return {uid,loading};
}
