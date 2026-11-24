"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
type Prefs={message_received:boolean;message_email_enabled:boolean;user_id:string;connection_requested:boolean;connection_approved:boolean;workout_approved:boolean;workout_assigned:boolean;workout_updated:boolean;workout_completed:boolean;email_enabled:boolean;push_enabled:boolean};
const defaults={message_received:true,message_email_enabled:true,connection_requested:true,connection_approved:true,workout_approved:true,workout_assigned:true,workout_updated:true,workout_completed:true,email_enabled:true,push_enabled:true};
const fields:[keyof typeof defaults,string,string][]=[
 ["connection_requested","Trainer access request","Notify me when a trainer requests access"],
 ["connection_approved","Client connection approved","Notify me when a client approves access"],
 ["workout_approved","Client workout approved","Notify me when a client accepts training"],
 ["workout_assigned","New workout assigned","Notify me when my trainer assigns a workout"],
 ["workout_updated","Workout updated","Notify me when my trainer changes a workout"],
 ["workout_completed","Workout completed","Notify me when a connected client completes a workout"],
 ["message_received","New coaching messages","Allow notifications for new private trainer–client messages"],
 ["message_email_enabled","Coaching message emails","Send email alerts for unread messages when email delivery is enabled"],
 ["email_enabled","Email delivery","Allow trainer-related email notifications when available"],
 ["push_enabled","Push delivery","Allow trainer-related push notifications when available"]
];
export default function CoachingNotificationPreferences({role}:{role:"client"|"trainer"}){
 const [prefs,setPrefs]=useState<Prefs|null>(null);
 const [status,setStatus]=useState("Loading notification preferences…");
 const [saving,setSaving]=useState(false);
 const [deviceStatus,setDeviceStatus]=useState("Checking device registration…");
 useEffect(()=>{let active=true;(async()=>{try{if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){if(active)setDeviceStatus("Push unavailable in this browser. On iPhone, use the installed Home Screen app.");return;}const registration=await navigator.serviceWorker.getRegistration("/push/");const subscription=registration?.scope.endsWith("/push/")?await registration.pushManager.getSubscription():null;const {data:{session}}=await supabase.auth.getSession();if(!subscription||!session){if(active)setDeviceStatus("Not registered on this device");return;}const response=await fetch("/api/trainer-notifications/push",{method:"POST",headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify({action:"status",subscription:subscription.toJSON()})});const result=await response.json();if(active)setDeviceStatus(result.registered?"Registered on this device":"Not registered on this device");}catch{if(active)setDeviceStatus("Could not check device registration");}})();return()=>{active=false};},[]);
 useEffect(()=>{let active=true;(async()=>{const {data:{user},error}=await supabase.auth.getUser();if(!active)return;if(error||!user){setStatus("Please sign in to Gym Log first.");return;}const {data,error:readError}=await supabase.from("trainer_notification_preferences").select("*").eq("user_id",user.id).maybeSingle();if(!active)return;if(readError){setStatus(readError.message);return;}setPrefs({user_id:user.id,...defaults,...(data||{})});setStatus("")})();return()=>{active=false}},[]);
 const testEmail=async()=>{setSaving(true);setStatus("");try{const {data:{session}}=await supabase.auth.getSession();if(!session){setStatus("Sign in first.");return;}const response=await fetch("/api/trainer-notifications/test",{method:"POST",headers:{Authorization:"Bearer "+session.access_token}});const result=await response.json();setStatus(result.message||result.error||"Unable to send test email.");}catch{setStatus("Unable to reach notification service.");}finally{setSaving(false);}};
 const pushAction=async(action:"register"|"test"|"remove")=>{
  setSaving(true);setStatus("");
  try{
   if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){setStatus("Push is unavailable here. On iPhone, install Gym Log on your Home Screen and open it there.");return;}
   if(action==="register"){const permission=await Notification.requestPermission();if(permission!=="granted"){setStatus("Notification permission was not granted. Check your device settings.");return;}}
   const {data:{session}}=await supabase.auth.getSession();if(!session){setStatus("Sign in first.");return;}
   const registration=await navigator.serviceWorker.register("/push/sw.js",{scope:"/push/"});
   if(!registration.active){await new Promise<void>((resolve,reject)=>{const worker=registration.installing||registration.waiting;if(!worker){reject(new Error("Push worker unavailable"));return;}const timeout=setTimeout(()=>reject(new Error("Push worker not ready")),10000);worker.addEventListener("statechange",()=>{if(worker.state==="activated"){clearTimeout(timeout);resolve();}else if(worker.state==="redundant"){clearTimeout(timeout);reject(new Error("Push worker failed"));}});if(worker.state==="activated"){clearTimeout(timeout);resolve();}});}
   let subscription=await registration.pushManager.getSubscription();
   if(action==="register"){
    const response=await fetch("/api/trainer-notifications/push",{cache:"no-store"});const {publicKey}=await response.json();if(!publicKey)throw new Error("Push credentials unavailable. Please refresh the app.");
    const raw=atob(publicKey.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(publicKey.length/4)*4,"="));
    const applicationServerKey=Uint8Array.from(raw,c=>c.charCodeAt(0));
    if(subscription){const oldKey=subscription.options.applicationServerKey;if(!oldKey||new Uint8Array(oldKey).join(",")!==applicationServerKey.join(",")){await subscription.unsubscribe();subscription=null;}}
    if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey});
   }
   if(!subscription){setStatus("Enable push on this device first.");return;}
   const response=await fetch("/api/trainer-notifications/push",{method:"POST",headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify({action,subscription:subscription.toJSON()})});
   const result=await response.json();if(response.ok&&action==="remove"){await subscription.unsubscribe();setDeviceStatus("Not registered on this device");}
   if(response.ok&&action==="register")setDeviceStatus("Registered on this device");
   setStatus(result.message||result.error||"Unable to manage push.");
  }catch(error){setStatus(error instanceof Error?"Push registration/test: "+error.message:"Push unavailable.");}finally{setSaving(false);}
 };
 const save=async()=>{if(!prefs)return;setSaving(true);setStatus("");const {error}=await supabase.from("trainer_notification_preferences").upsert({...prefs,updated_at:new Date().toISOString()},{onConflict:"user_id"});setSaving(false);setStatus(error?error.message:"Preferences saved.")};
 return <section style={{width:"100%",minWidth:0,boxSizing:"border-box",overflowWrap:"anywhere",marginTop:16}}><h3>Notification settings</h3>{prefs&&<><div style={{display:"grid",gap:8,gridTemplateColumns:"minmax(0,1fr)",minWidth:0}}>{fields.filter(([key])=>role==="trainer"? !["workout_assigned","workout_updated","connection_requested"].includes(key):!["workout_completed","connection_approved","workout_approved"].includes(key)).map(([key,label,description])=><label key={key} style={{display:"flex",alignItems:"center",gap:12,border:"1px solid var(--border, #555)",borderRadius:10,justifyContent:"space-between",cursor:"pointer",padding:"14px 10px",boxSizing:"border-box",minWidth:0,borderColor:"var(--border)"}}><span style={{flex:"1 1 0",minWidth:0,display:"block"}}><strong style={{display:"block",fontSize:14}}>{label}</strong><small style={{display:"block",whiteSpace:"normal",overflow:"visible",lineHeight:1.5,marginTop:4}}>{description}</small></span><input type="checkbox" checked={prefs[key]} onChange={e=>setPrefs(prev=>prev?{...prev,[key]:e.target.checked}:prev)} style={{width:22,height:22,flex:"0 0 22px",margin:0,accentColor:"#ff6b22"}}/></label>)}</div><p role="status" style={{fontWeight:700,marginTop:12}}>{deviceStatus}</p><p className="trainer-hint">These preferences are stored in your account. To receive push alerts, enable each device separately. Activity notifications are processed approximately every minute.</p><div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:16}}><button style={{flex:"1 1 180px",minWidth:0,minHeight:44,borderRadius:10,padding:10,cursor:"pointer"}} className="trainer-action" disabled={saving} onClick={save}>{saving?"Working…":"Save preferences"}</button> <button style={{flex:"1 1 180px",minWidth:0,minHeight:44,margin:0}} className="trainer-outline-button" disabled={saving} onClick={testEmail}>Send test email</button><button className="trainer-outline-button" style={{flex:"1 1 180px",minWidth:0,minHeight:44,margin:0}} disabled={saving} onClick={()=>pushAction("register")}>Enable push on this device</button><button className="trainer-outline-button" style={{flex:"1 1 180px",minWidth:0,minHeight:44,margin:0}} disabled={saving} onClick={()=>pushAction("test")}>Send test push</button><button className="trainer-outline-button" style={{flex:"1 1 180px",minWidth:0,minHeight:44,margin:0}} disabled={saving} onClick={()=>pushAction("remove")}>Disable push on this device</button></div></>}{status&&<p role="status" className="trainer-notice">{status}</p>}</section>
}
