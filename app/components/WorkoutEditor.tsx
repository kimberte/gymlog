"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { WorkoutEntry, WorkoutMap, getDayEntries,loadDefaultWorkoutMode } from "../lib/storage";
import PrescriptionEditor from "./PrescriptionEditor";
import DragHandle from "./DragHandle";
import PersonalExercisePicker from "./PersonalExercisePicker";
import {canEditPrescription,rowsToPersonalPlan,reusePersonalRows} from "../lib/personalWorkoutPlan";
import "../trainers/trainer-dashboard.css";
import "./WorkoutEditorCompact.css";
import {prescriptionDraft,actualSetRows,actualLiftText,suggestedActual,defaultActualUnit,validActual,canonicalExercise,blockLabel,readPrescription,writePrescription,validatePrescriptionLines} from "../lib/structuredCoaching";
import { getSessionUser } from "../lib/backup";
import { supabase } from "../lib/supabaseClient";
import { compressImageToWebp } from "../lib/imageCompress";
import { shareWorkoutVerticalImage } from "../lib/shareImage";
import { ensureTrialStarted, getProStatus, type ProStatus } from "../lib/entitlements";
import {
  compileStructuredBlock,
  parseStructuredFromNotes,
  removeStructuredBlock,
  upsertStructuredBlock,
  type StructuredWorkout,
  type StructuredExerciseRow,
} from "../lib/structuredNotes";

// NEW: per-workout media (image OR video)
import {
  getWorkoutMediaSignedUrl,
  removeWorkoutMedia,
  uploadWorkoutMedia,
} from "../lib/workoutMedia";

// Community sharing (siloed; best-effort)
import { deleteWorkoutDay, publishWorkoutDay } from "../lib/communityShare";

// (Optional legacy date-photo imports can be removed if you’re fully migrated)
// If you still have these in your project and want to keep backward compat, leave them.
// import { getWorkoutImageSignedUrl, removeWorkoutImage, uploadWorkoutImage } from "../lib/workoutImages";

type WorkoutMediaMeta =
  | null
  | {
      kind: "image" | "video";
      path: string;
      updatedAt: number;
      sizeBytes?: number;
      durationSec?: number;
      width?: number;
      height?: number;
    };

type EntryWithMedia = WorkoutEntry & { media?: WorkoutMediaMeta };

type Props = {
  demoMode?: boolean;
  date: string; // YYYY-MM-DD
  workouts: WorkoutMap;
  setWorkouts: (w: WorkoutMap) => void;
  // Called after explicit saves (so parent can trigger cloud backup)
  onSaved?: (nextWorkouts: WorkoutMap) => void;
  onClose: () => void;
  toast: (msg: string) => void;
};

function hasContent(e: { title?: string; notes?: string }) {
  return Boolean(String(e?.title ?? "").trim() || String(e?.notes ?? "").trim());
}


function structuredToNotebookText(data: StructuredWorkout, extraNotes?: string): string {
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const cleaned = rows
    .map((r: any) => ({
      name: String(r?.name ?? "").trim(),
      reps: String(r?.reps ?? "").trim(),
      weight: String(r?.weight ?? "").trim(),
      completed: Boolean(r?.completed),
      targetReps:String(r?.targetReps??""),targetLoad:String(r?.targetLoad??""),targetRest:String(r?.targetRest??""),setType:r?.setType,block:r?.block,blockRound:r?.blockRound,
    }))
    .filter((r) => r.name || r.reps || r.weight || r.completed);

  // Group rows by exercise name, preserving order of first appearance.
  const order: string[] = [];
  const groups = new Map<string, typeof cleaned>();
  cleaned.forEach((r) => {
    const key = r.name || "(Exercise)";
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(r);
  });

  const lines: string[] = [];
  order.forEach((exName) => {
    lines.push(`${exName}`);
    const sets = groups.get(exName) || [];
    sets.forEach((s, idx) => {
      const repPart = s.reps ? `${s.reps}` : "";
      const wtPart = s.weight ? `${s.weight}` : "";

      let mid = "";
      if (repPart && wtPart) mid = `${repPart} x ${wtPart}`;
      else if (repPart) mid = `${repPart}`;
      else if (wtPart) mid = `${wtPart}`;

      if(!mid&&s.targetReps)mid=[s.targetReps,s.targetLoad,s.targetRest&&"Rest "+s.targetRest].filter(Boolean).join(" · ");
      const doneLabel = s.completed ? "Done" : "Not Done";
      const main = mid ? `: ${mid}` : ":";
      lines.push(`- Set ${idx + 1}${s.setType&&s.setType!=="normal"?" ["+s.setType+"]":""}${main} (${doneLabel})${s.block?" · "+blockLabel(s.block)+" round "+s.blockRound:""}`);
    });
    lines.push("");
  });

  const cleanedExtra = String(extraNotes ?? "").trim();
  if (cleanedExtra) {
    lines.push("Notes:");
    lines.push(cleanedExtra);
  }

  return lines.join("\n").trim();
}

function formatCompactNumber(n: number): string {
  const v = Math.round(n);
  if (!Number.isFinite(v) || v <= 0) return "0";
  if (v < 1000) return v.toLocaleString();
  if (v < 10000) return `${(Math.round((v / 1000) * 10) / 10).toString()}k`; // 1.2k
  return `${Math.round(v / 1000).toLocaleString()}k`;
}

function sanitizeIntInput(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

function sanitizeDecimalInput(raw: string): string {
  // Allow digits and a single dot
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

function parseFirstNumber(s: string): number | null {
  const m = String(s || "").match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function weightUnitFromString(s: string): string {
  const t = String(s || "").toLowerCase();
  if (t.includes("kg")) return "kg";
  if (t.includes("lb")) return "lb";
  return "";
}

function formatDisplayDate(yyyyMMdd: string) {
  // Treat as local date to avoid off-by-one in negative timezones
  const [y, m, d] = yyyyMMdd.split("-").map((v) => parseInt(v, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0); // noon local
  return dt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ✅ Clipboard payloads
const CLIPBOARD_WORKOUT_KIND = "gym-log-workout-v1";
const CLIPBOARD_DAY_KIND = "gym-log-day-v1";

type ClipboardWorkout = {
  kind: typeof CLIPBOARD_WORKOUT_KIND;
  title: string;
  notes: string;
};

type ClipboardDay = {
  kind: typeof CLIPBOARD_DAY_KIND;
  entries: Array<{ title: string; notes: string }>; // up to 3
};

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function readVideoMeta(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;

    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => resolve();
      const onErr = () => reject(new Error("Could not read video metadata"));
      v.addEventListener("loadedmetadata", onLoaded, { once: true });
      v.addEventListener("error", onErr, { once: true });
    });

    return {
      duration: Number(v.duration || 0),
      width: Number(v.videoWidth || 0),
      height: Number(v.videoHeight || 0),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function WorkoutEditor({
  demoMode=false,
  date,
  workouts,
  setWorkouts,
  onSaved,
  onClose,
  toast,
}: Props) {
  const initialPb = useMemo(() => Boolean((workouts as any)?.[date]?.pb), [workouts, date]);

  const initialEntries = useMemo<EntryWithMedia[]>(() => {
    const entries = getDayEntries(workouts, date)
      .slice(0, 3)
      .map((e, i) => ({
        id: String(e?.id || `w${i + 1}`),
        title: String(e?.title ?? ""),
        notes: String(e?.notes ?? ""),
        trainerPrescription: e.trainerPrescription,
        mode:e.mode, structured:e.structured,
        media: (e as any)?.media ?? null,
      completedAt: e.completedAt ?? null,
      }));
    return entries.length ? entries : [{ id: "w1", title: "", notes: "", media: null,mode:demoMode?"plain":loadDefaultWorkoutMode() }];
  }, [workouts, date]);

  const [entries, setEntries] = useState<EntryWithMedia[]>(initialEntries);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completionBusy,setCompletionBusy]=useState(false);
  const [personalPlanning,setPersonalPlanning]=useState<{id:string;replace:boolean;value:string;indices?:number[]}|null>(null);
  const [pickerOpen,setPickerOpen]=useState(false);
  const [workoutMenu,setWorkoutMenu]=useState(false);
  const [exerciseMenu,setExerciseMenu]=useState<string|null>(null);
  const [formatHint,setFormatHint]=useState<string|null>(null);
  const completionLock=useRef(false);

  // Structured editor (stored inside notes string via structuredNotes helpers)
  type EditorMode = "notebook" | "structured";
  const [modeByEntryId, setModeByEntryId] = useState<Record<string, EditorMode>>({});
  const [structuredByEntryId, setStructuredByEntryId] = useState<Record<string, StructuredWorkout>>({});
  const [extraNotesByEntryId, setExtraNotesByEntryId] = useState<Record<string, string>>({});
  const [collapsedByEntryId, setCollapsedByEntryId] = useState<Record<string, Record<string, boolean>>>({});
  const lastNotesSeenRef = useRef<Record<string, string>>({});

  // Initialize structured drafts from existing notes (without mutating entries)
  useEffect(() => {
    setModeByEntryId((prevModes) => {
      const nextModes = { ...prevModes };
      const nextStructured: Record<string, StructuredWorkout> = {};
      const nextExtra: Record<string, string> = {};

      entries.forEach((e) => {
        const id = String(e.id);
        const notes = String(e.notes ?? "");
        const last = lastNotesSeenRef.current[id];

        // Only parse when we haven't seen these notes for this entry yet
        if (last !== notes) {
          lastNotesSeenRef.current[id] = notes;

          const parsed = e.mode==="structured"&&e.structured?.rows ? e.structured as StructuredWorkout : parseStructuredFromNotes(notes);
          if(id.startsWith("trainer_")){
            nextModes[id]="structured";
            nextStructured[id]=parsed||prescriptionDraft(e.title,(e.trainerPrescription||notes).split("\n"));
            nextExtra[id]=parsed?removeStructuredBlock(notes):notes===e.trainerPrescription?"":notes;
            return;
          }
          if (parsed) {
            nextModes[id] = "structured";
            nextStructured[id] = parsed;
            nextExtra[id] = removeStructuredBlock(notes);
          } else {
            // Keep existing mode unless it doesn't exist yet
            if(!nextModes[id])nextModes[id] = e.mode==="structured"?"structured":"notebook";
            if (nextExtra[id] == null) nextExtra[id] = notes;
            if (!nextStructured[id]) {
              nextStructured[id] = {
                workoutName: String(e.title ?? "").trim(),
                rows: [],
              };
            }
          }
        }
      });

      // Apply structured/extra drafts updates in one go (best-effort; only for entries we parsed above)
      if (Object.keys(nextStructured).length) {
        setStructuredByEntryId((prev) => ({ ...prev, ...nextStructured }));
      }
      if (Object.keys(nextExtra).length) {
        setExtraNotesByEntryId((prev) => ({ ...prev, ...nextExtra }));
      }

      return nextModes;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // Personal Best marker (per-day)
  const [isPb, setIsPb] = useState(initialPb);
  useEffect(() => {
    setIsPb(Boolean((workouts as any)?.[date]?.pb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, workouts]);

  // Pro gating
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [proStatus, setProStatus] = useState<ProStatus>({ isPro: false, reason: "signed_out" });

  // Media UI state (per active workout)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [pickKind, setPickKind] = useState<"image" | "video">("image");
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const editorContentRef = useRef<HTMLDivElement | null>(null);

  // Size the sheet to the visible viewport, not the area behind the keyboard.
  const [keyboardViewport,setKeyboardViewport]=useState<{height:number;top:number}|null>(null);
  const [notesFocused,setNotesFocused]=useState(false);

  // Lock background scroll while editor is open
  useEffect(() => {
    const scrollY = window.scrollY || 0;

    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevOverscroll = (document.body.style as any).overscrollBehaviorY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    (document.body.style as any).overscrollBehaviorY = "contain";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      (document.body.style as any).overscrollBehaviorY = prevOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Android may resize the layout viewport; iOS usually only resizes visualViewport.
  // Keep an unobscured height baseline for both behaviours.
  useEffect(() => {
    const vv=window.visualViewport;
    let baseline=vv?.height??window.innerHeight;
    let width=window.innerWidth;
    const update=()=>{
      const height=vv?.height??window.innerHeight;
      const top=vv?.offsetTop??0;
      const nextWidth=window.innerWidth;
      if(Math.abs(nextWidth-width)>80){width=nextWidth;baseline=height;}
      const zoomed=(vv?.scale??1)>1.05;
      const keyboard=!zoomed&&Math.max(window.innerHeight-height,baseline-height)>120;
      if(!keyboard&&!zoomed)baseline=Math.max(baseline,height);
      setKeyboardViewport(old=>{
        const next=keyboard?{height:Math.round(height),top:Math.round(top)}:null;
        return old?.height===next?.height&&old?.top===next?.top?old:next;
      });
    };
    update();
    vv?.addEventListener("resize",update);
    vv?.addEventListener("scroll",update);
    window.addEventListener("resize",update);
    return ()=>{
      vv?.removeEventListener("resize",update);
      vv?.removeEventListener("scroll",update);
      window.removeEventListener("resize",update);
    };
  }, []);

  useEffect(()=>{if(!keyboardViewport&&document.activeElement!==notesRef.current)setNotesFocused(false);},[keyboardViewport]);
  // Load signed-in user (Pro gating)
  useEffect(() => {
    if(demoMode)return;
    let cancelled = false;
    (async () => {
      const user = await getSessionUser();
      if (cancelled) return;
      setSessionUserId(user?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (demoMode||!sessionUserId) {
      setProStatus({ isPro: false, reason: "signed_out" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await ensureTrialStarted(sessionUserId);
        const st = await getProStatus(sessionUserId);
        if (!cancelled) setProStatus(st);
      } catch {
        if (!cancelled) setProStatus({ isPro: false, reason: "free" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);


  // Keep in sync when DATE changes (close/reopen).
  // IMPORTANT: Don't reset local editor state just because `workouts` changed
  // (e.g., after pressing Save). That would wipe UI state like the media preview.
  useEffect(() => {
    setEntries(initialEntries);
    setActiveIdx(0);
    setMediaUrl(null);
    setMediaOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const active = entries[activeIdx] ?? entries[0];
  const localToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
  const futureCompletionBlocked=date>localToday()&&!active?.completedAt;

  const activeId = String(active?.id ?? "w1");
  const [restUntil,setRestUntil]=useState<number|null>(null),[restNow,setRestNow]=useState(0);
  useEffect(()=>{if(restUntil===null)return;const tick=()=>setRestNow(Date.now());tick();const id=window.setInterval(tick,250);return()=>window.clearInterval(id);},[restUntil]);
  useEffect(()=>{setRestUntil(null)},[date,activeId]);
  const restLeft=restUntil===null?0:Math.max(0,Math.ceil((restUntil-restNow)/1000));
  function beginRest(value:string|undefined){const m=String(value||"").trim().match(/^(\d+(?:\.\d+)?)\s*(s|sec|seconds?|m|min|minutes?)?$/i);if(!m)return;const sec=Math.min(3600,Math.round(Number(m[1])*(m[2]?.toLowerCase().startsWith("m")?60:1)));if(sec>0){const now=Date.now();setRestNow(now);setRestUntil(now+sec*1000);}}
  const coached=activeId.startsWith("trainer_");
  const activeMode: "notebook" | "structured" = coached?"structured":modeByEntryId[activeId] ?? (active?.mode==="structured"?"structured":"notebook");
  const writingNotes=activeMode==="notebook"&&notesFocused&&!!keyboardViewport&&!pickerOpen;
  const planOpen=!coached&&personalPlanning?.id===activeId&&activeMode==="structured";

  const activeStructured: StructuredWorkout =
    structuredByEntryId[activeId] ?? (coached?prescriptionDraft(active?.title||"",String(active?.trainerPrescription||active?.notes||"").split("\n")):{
      workoutName: String(active?.title ?? "").trim(),
      rows: [],
    });

  const activeExtraNotes: string = extraNotesByEntryId[activeId] ?? (coached&&active?.notes===active?.trainerPrescription?"":String(active?.notes ?? ""));
const activeRowVolumes = useMemo(
  () => (activeStructured.rows || []).map((r) => computeRowVolume(r)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [activeStructured.rows]
);
const activeTotalVolume = useMemo(
  () => activeRowVolumes.reduce((sum, v) => sum + (Number(v) || 0), 0),
  [activeRowVolumes]
);

  type PrevExerciseStats = {
    date: string;
    summary: string;
    maxWeightNum: number | null;
    unit: string;
    sets: StructuredExerciseRow[];
  };

  function computeMaxWeightForIndices(rows: StructuredExerciseRow[], indices: number[]) {
    let bestNum: number | null = null;
    let bestRaw = "";
    indices.forEach((idx) => {
      const row=rows[idx];if(!row?.completed||!row.unit||/\b(sec|min)$/i.test(row.targetReps||""))return;
      const wRaw = String(row.weight??"").trim();
      const rawNum = parseFirstNumber(wRaw);const n=rawNum==null?null:rawNum*(row.unit==="lb"?0.45359237:1);
      if (n == null) return;
      if (bestNum == null || n > bestNum) {
        bestNum = n;
        bestRaw = Number(n.toFixed(1))+" kg";
      }
    });
    return { bestNum, bestRaw };
  }

  function computeCommonReps(rows: StructuredExerciseRow[], indices: number[]) {
    // Use first non-empty reps as a simple, predictable summary.
    for (const idx of indices) {
      const r = String((rows[idx] as any)?.reps ?? "").trim();
      if (r) return r;
    }
    return "";
  }

  const prevStatsByExerciseKey: Record<string, PrevExerciseStats> = useMemo(() => {
    const neededGroups = groupRowsByExercise(activeStructured.rows || []);
    const neededKeys = new Set(neededGroups.map((g) => g.key));
    if (!neededKeys.size) return {};

    const out: Record<string, PrevExerciseStats> = {};

    const allDates = Object.keys(workouts || {})
      .filter((k) => typeof k === "string" && k < date)
      .sort()
      .reverse();

    for (const d of allDates) {
      const dayEntries = getDayEntries(workouts, d);
      for (const e of dayEntries) {
        const parsed = e.mode==="structured"&&e.structured?.rows?e.structured as StructuredWorkout:parseStructuredFromNotes(String((e as any)?.notes ?? ""));
        if (!parsed?.rows?.length) continue;
        const actualRows=parsed.rows.filter(r=>r.completed&&!r.skipped);const groups=groupRowsByExercise(actualRows);
        for (const g of groups) {
          if (!neededKeys.has(g.key)) continue;
          if (out[g.key]) continue;

          const { bestNum } = computeMaxWeightForIndices(actualRows, g.indices);
          const historyRows=g.indices.map(i=>actualRows[i]);
          const unitChoice=historyRows.find(r=>r.unit)?.unit||"lb";
          const bestRaw=bestNum===null?"":Number((bestNum/(unitChoice==="lb"?0.45359237:1)).toFixed(1))+" "+unitChoice;
          const reps = computeCommonReps(actualRows, g.indices);
          const setCount = g.indices.length;
          const unit = weightUnitFromString(bestRaw);

          // Summary like: 3×8 @225
          const parts: string[] = [];
          if (setCount) {
            if (reps) parts.push(`${setCount}×${reps}`);
            else parts.push(`${setCount} set${setCount === 1 ? "" : "s"}`);
          }
          if (bestRaw) parts.push(`@${bestRaw}`);

          out[g.key] = {
            date: d,
            summary: parts.join(" ").trim(),
            maxWeightNum: bestNum,
            unit,
            sets:historyRows,
          };

          if (Object.keys(out).length === neededKeys.size) return out;
        }
      }
    }

    return out;
  }, [workouts, date, activeStructured.rows]);


  const plannedRows=activeStructured.rows||[];
  const personal=!coached&&activeMode==="structured";
  useEffect(()=>{setPickerOpen(false);setWorkoutMenu(false);setExerciseMenu(null)},[activeId]);
  const canReplacePlan=plannedRows.length>0&&!active?.completedAt&&plannedRows.every(canEditPrescription);
  const openPersonalPlan=(indices?:number[])=>{
    if(coached||active?.completedAt){toast("Reopen the workout before changing its plan.");return;}
    const selected=indices?indices.map(i=>plannedRows[i]).filter(Boolean):plannedRows;
    if(!selected.length){toast("Add exercises first.");return;}
    if(!selected.every(canEditPrescription)){toast("Logged or edited sets are protected. Add new exercises or sets instead.");return;}
    const lines=rowsToPersonalPlan(selected);
    setExerciseMenu(null);setPersonalPlanning({id:activeId,replace:true,value:lines.join("\n"),indices});
  };
  const applyPersonalPlan=()=>{
    if(!personalPlanning||personalPlanning.id!==activeId||coached||active?.completedAt)return;
    const lines=personalPlanning.value.split("\n").filter(Boolean);
    if(!validatePrescriptionLines(lines)){toast("Review the exercises, sets and targets before applying.");return;}
    const indices=personalPlanning.indices;
    const chosen=indices?new Set(indices):new Set(plannedRows.map((_,i)=>i));
    if(plannedRows.some((r,i)=>chosen.has(i)&&!canEditPrescription(r))){toast("Logged results are protected.");return;}
    const base=plannedRows.filter((_,i)=>!chosen.has(i));
    const maxBlock=Math.max(0,...base.map(r=>Number(r.block?.id.slice(1))||0));
    const adjusted=lines.map(line=>{const x=readPrescription(line);return x.block&&maxBlock?writePrescription({...x,block:{...x.block,id:"G"+(Number(x.block.id.slice(1))+maxBlock)}}):line;});
    const replacement=prescriptionDraft(active?.title||"",adjusted).rows;
    const existingNames=new Set(base.map(r=>canonicalExercise(r.name).toLowerCase()));
    if(replacement.some(r=>existingNames.has(canonicalExercise(r.name).toLowerCase()))){toast("An exercise with this name already exists in the workout. Choose a different exercise.");return;}
    if(base.length+replacement.length>250||new Set([...base,...replacement].map(r=>canonicalExercise(r.name).toLowerCase())).size>60){toast("Maximum 60 exercises and 250 sets.");return;}
    const first=indices?Math.min(...indices):0;
    const next=[...base.slice(0,first),...replacement,...base.slice(first)];
    updateActiveStructured({rows:next,personalPlan:base.length?undefined:adjusted});setPersonalPlanning(null);toast("Workout targets updated.");
  };
  const addPickedExercises=(names:string[])=>{
    if(activeMode==="notebook"){updateActive({notes:[String(active?.notes||"").trimEnd(),...names].filter(Boolean).join("\n\n")+"\n"});setPickerOpen(false);return;}
    if(active?.completedAt){toast("Reopen the workout before adding exercises.");return;}
    const existing=new Set(plannedRows.map(r=>canonicalExercise(r.name).toLowerCase()));
    const fresh=names.filter(n=>!existing.has(canonicalExercise(n).toLowerCase()));
    if(plannedRows.length+fresh.length*3>250||existing.size+fresh.length>60){toast("Maximum 60 exercises and 250 sets.");return;}
    const rows:StructuredExerciseRow[]=fresh.flatMap(name=>Array.from({length:3},()=>({name,sets:"1",reps:"",weight:"",unit:"lb" as const,completed:false,targetRest:"60 sec"})));
    updateActiveStructured({rows:[...plannedRows,...rows]});setPickerOpen(false);toast(fresh.length+" exercise"+(fresh.length===1?"":"s")+" added");
  };
  const usePreviousWorkout=()=>{
    if(coached||plannedRows.length||active?.completedAt)return;
    for(const d of Object.keys(workouts).filter(d=>d<date).sort().reverse()){
      for(const entry of getDayEntries(workouts,d)){
        const parsed=entry.structured?.rows?entry.structured as StructuredWorkout:parseStructuredFromNotes(entry.notes||"");
        if(!parsed?.rows.length||entry.id.startsWith("trainer_")||!parsed.rows.some(r=>r.completed))continue;
        if(!window.confirm("Use "+(entry.title||"your previous workout")+" from "+formatDisplayDate(d)+"? Sets will be unchecked."))return;
        updateActiveStructured({rows:reusePersonalRows(parsed.rows)});if(!active?.title)updateActive({title:entry.title||""});toast("Previous workout loaded. Review targets before logging.");return;
      }
    }
    toast("No previous completed personal structured workout found.");
  };
  const useLastExercise=(g:ExerciseGroup)=>{
    if(active?.completedAt)return;
    const prior=prevStatsByExerciseKey[g.key]?.sets;if(!prior?.length)return;
    const next=plannedRows.map((r,i)=>{const pos=g.indices.indexOf(i);if(pos<0||!canEditPrescription(r)||r.targetReps||r.targetLoad)return r;const prev=prior[Math.min(pos,prior.length-1)];const timed=/\b(sec|min)$/i.test(prev.targetReps||"");return {...r,planned:true,targetReps:prev.reps?(timed?prev.reps+" sec":prev.reps):r.targetReps,targetLoad:prev.weight&&prev.unit?prev.weight+" "+prev.unit:r.targetLoad,unit:prev.unit||r.unit};});
    updateActiveStructured({rows:next});toast("Previous results suggested. Sets are still unchecked.");
  };
  const removeExercise=(indices:number[])=>{
    if(active?.completedAt||coached)return;
    if(indices.some(i=>!canEditPrescription(plannedRows[i]))){toast("Logged or edited sets are protected.");return;}
    if(!window.confirm("Remove this exercise and its sets?"))return;
    const ids=new Set(indices);updateActiveStructured({rows:plannedRows.filter((_,i)=>!ids.has(i))});setExerciseMenu(null);
  };
  const moveExercise=(indices:number[],direction:number)=>{
    const start=Math.min(...indices),end=Math.max(...indices);if(indices.length!==end-start+1){toast("This exercise has non-consecutive sets. Reorder in advanced programming.");return;}
    const other=direction<0?start-1:end+1;if(other<0||other>=plannedRows.length)return;
    const neighbor=plannedRows[other];const same=(r:StructuredExerciseRow)=>neighbor.block?r.block?.id===neighbor.block.id:!r.block&&normalizeExerciseKey(r.name)===normalizeExerciseKey(neighbor.name);
    let first=other,last=other;while(first>0&&same(plannedRows[first-1]))first--;while(last+1<plannedRows.length&&same(plannedRows[last+1]))last++;
    const next=direction<0?[...plannedRows.slice(0,first),...plannedRows.slice(start,end+1),...plannedRows.slice(first,start),...plannedRows.slice(end+1)]:[...plannedRows.slice(0,start),...plannedRows.slice(end+1,last+1),...plannedRows.slice(start,end+1),...plannedRows.slice(last+1)];
    updateActiveStructured({rows:next});setExerciseMenu(null);
  };
  function setActiveMode(nextMode: "notebook" | "structured") {
    if(coached&&nextMode==="notebook")return;
    setModeByEntryId((prev) => ({ ...prev, [activeId]: nextMode }));
  }

  function updateActiveStructured(patch: Partial<StructuredWorkout>) {
    setStructuredByEntryId((prev) => ({
      ...prev,
      [activeId]: { ...activeStructured, ...(patch.rows?{personalPlan:undefined}:{}), ...patch },
    }));
  }

  function updateActiveStructuredRow(idx: number, patch: Partial<StructuredExerciseRow>) {
    const nextRows = (activeStructured.rows || []).map((r, i) =>
      i === idx ? ({ ...r, ...patch } as any) : r
    );
    updateActiveStructured({ rows: nextRows });
  }

  function addActiveStructuredRow() {
  const nextRows = [...(activeStructured.rows || [])];
  nextRows.push({ name: "", sets: "", reps: "", weight: "", unit:"lb", completed: false } as any);
  updateActiveStructured({ rows: nextRows });
}

function duplicateLastStructuredRow() {
  const rows = activeStructured.rows || [];
  if (!rows.length) {
    addActiveStructuredRow();
    return;
  }
  const raw=rows[rows.length-1];
  const last=(coached||raw.planned)?suggestedActual(raw):defaultActualUnit(raw);
  const nextRows = [...rows, { ...last, block:undefined,blockRound:undefined, completed:false, skipped:false, planned:false, repsEdited:Boolean(last.reps),weightEdited:Boolean(last.weight),unitEdited:Boolean(last.unit) }];
  updateActiveStructured({ rows: nextRows });
}

// "Add set" = duplicate last row's exercise name (and optionally reps/weight),
// defaulting sets to 1 and clearing the note. This mimics typical trackers where each row can be a set.
function addNextSetFromLastRow() {
  const rows = activeStructured.rows || [];
  if (!rows.length) {
    addActiveStructuredRow();
    return;
  }
  const last = rows[rows.length - 1] || ({} as any);
  const next: StructuredExerciseRow = {
    name: String((last as any)?.name ?? ""),
    sets: "",
    reps: coached?"":String((last as any)?.reps ?? ""),
    weight: coached?"":String((last as any)?.weight ?? ""),
    unit:last?.unit,targetReps:last?.targetReps,targetLoad:last?.targetLoad,targetRest:last?.targetRest,prescribedName:last?.prescribedName,
    completed: false,
  } as any;

  updateActiveStructured({ rows: [...rows, next] });
}

function toggleRowCompleted(idx: number) {
  const row = (activeStructured.rows || [])[idx] as any;
  if (!row) return;
  const filled=(coached||row.planned)?suggestedActual(row):defaultActualUnit(row);
  if(!row.completed&&!validActual(filled)){toast("Enter actual reps or seconds and select a unit for any weight.");return;}
  updateActiveStructuredRow(idx,row.completed?{completed:false}:{...filled,completed:true,skipped:false});
  if(!row.completed){if(row.block){const same=activeStructured.rows.filter((r,i)=>i!==idx&&r.block?.id===row.block?.id&&r.blockRound===row.blockRound);if(same.every(r=>r.completed||r.skipped))beginRest(String(row.block.restSeconds)+" sec");}else beginRest(row.targetRest);}
}

function parseNumeric(val: any): number {
  const s = String(val ?? "").replace(/,/g, "").trim();
  const m = s.match(/-?\d*\.?\d+/);
  return m ? Number(m[0]) : 0;
}

function computeRowVolume(r: StructuredExerciseRow): number {
  if(!r.completed||r.skipped||/\b(sec|min)$/i.test(r.targetReps||"")||!r.unit)return 0;
  const reps = parseNumeric((r as any)?.reps);
  const weight = parseNumeric((r as any)?.weight);
  const setsRaw = parseNumeric((r as any)?.sets);
  const sets = setsRaw > 0 ? setsRaw : 1;
  if (!reps || !weight) return 0;
  return sets * reps * weight * (r.unit==="kg"?1:0.45359237);
}

function normalizeExerciseKey(name: string) {
  const base = String(name || "").trim().toLowerCase();
  return base || "exercise";
}

type ExerciseGroup = { key: string; name: string; indices: number[] };

function groupRowsByExercise(rows: StructuredExerciseRow[]): ExerciseGroup[] {
  const order: string[] = [];
  const map = new Map<string, { name: string; indices: number[] }>();

  rows.forEach((r, idx) => {
    const name = String((r as any)?.name ?? "").trim();
    const key = normalizeExerciseKey(name);
    if (!map.has(key)) {
      map.set(key, { name: name || "Exercise", indices: [] });
      order.push(key);
    }
    map.get(key)!.indices.push(idx);
    // Keep latest non-empty display name
    if (name) map.get(key)!.name = name;
  });

  return order.map((key) => ({ key, name: map.get(key)!.name, indices: map.get(key)!.indices }));
}

const activeCollapsed = collapsedByEntryId[activeId] ?? {};

function setCollapsed(key: string, next: boolean) {
  setCollapsedByEntryId((prev) => ({
    ...prev,
    [activeId]: { ...(prev[activeId] ?? {}), [key]: next },
  }));
}

function renameExerciseInGroup(groupKey: string, nextName: string) {
  const rows = activeStructured.rows || [];
  const nextRows = rows.map((r) => {
    const key = normalizeExerciseKey(String((r as any)?.name ?? ""));
    if (key !== groupKey || r.block) return r as any;
    return { ...(r as any), name: nextName } as any;
  });
  updateActiveStructured({ rows: nextRows });
}

function addExercisePrompt() {
  const name = window.prompt("Exercise name?", "");
  if (name == null) return;
  const clean = canonicalExercise(String(name).trim());
  if (!clean) return;

  const setsStr = window.prompt("How many sets?", "3");
  if(setsStr===null)return;
  const setsN = Math.max(1, Math.min(20, parseInt(String(setsStr || "1"), 10) || 1));

  const nextRows = [...(activeStructured.rows || [])];
  if(nextRows.length+setsN>250){toast("Maximum 250 sets per workout.");return;}
  for (let i = 0; i < setsN; i++) {
    nextRows.push({ name: clean, sets: "", reps: "", weight: "", unit:"lb", completed: false } as any);
  }
  updateActiveStructured({ rows: nextRows });
}

function addSetToExercise(groupKey: string) {
  const rows = activeStructured.rows || [];
  if(rows.length>=250){toast("Maximum 250 sets per workout.");return;}
  // Find last row for this exercise to copy reps/weight
  let lastIdx = -1;
  rows.forEach((r, idx) => {
    const key = normalizeExerciseKey(String((r as any)?.name ?? ""));
    if (key === groupKey && !r.block) lastIdx = idx;
  });

  const last = lastIdx >= 0 ? (rows[lastIdx] as any) : null;
  const nextRow: StructuredExerciseRow = {
    name: last?.name ? String(last.name) : "Exercise",
    sets: "",
    reps: coached?"":last?.reps != null ? String(last.reps) : "",
    weight: coached?"":last?.weight != null ? String(last.weight) : "",
    unit:last?.unit,targetReps:last?.targetReps,targetLoad:last?.targetLoad,targetRest:last?.targetRest,prescribedName:last?.prescribedName,
    completed: false,
  } as any;

  // Insert after the last row of that exercise (so sets stay grouped)
  if (lastIdx >= 0) {
    const nextRows = [...rows];
    nextRows.splice(lastIdx + 1, 0, nextRow as any);
    updateActiveStructured({ rows: nextRows });
  } else {
    updateActiveStructured({ rows: [...rows, nextRow as any] });
  }
}

function exerciseGroupVolume(indices: number[]) {
  const rows = activeStructured.rows || [];
  return indices.reduce((sum, idx) => sum + (computeRowVolume(rows[idx] as any) || 0), 0);
}

  function removeActiveStructuredRow(idx: number) {
    const row=activeStructured.rows[idx];if(row&&(row.block||row.planned&&coached)){updateActiveStructuredRow(idx,{skipped:!row.skipped,completed:false});return;}
    if(row?.completed&&!window.confirm("Remove this logged set?"))return;
    const nextRows = (activeStructured.rows || []).filter((_, i) => i !== idx);
    updateActiveStructured({ rows: nextRows });
  }

  function updateActiveExtraNotes(next: string) {
    setExtraNotesByEntryId((prev) => ({ ...prev, [activeId]: next }));
  }

  function canSwitchToStructured(): boolean {
    const notes = String(active?.notes ?? "");
    const hasStructured = Boolean(parseStructuredFromNotes(notes));
    const stripped = removeStructuredBlock(notes).trim();
    // Allow if already structured OR the free-text part is empty
    return hasStructured || stripped.length === 0;
  }

  function handleConvertStructuredToNotebook() {
    if(coached)return;
    if(personalPlanning){toast("Apply or cancel your workout plan first.");return;}
    if(activeStructured.rows.length&&!window.confirm("Convert to notes? Structured targets, set checks and group details will be replaced with readable text."))return;
    setPersonalPlanning(null);
    const parsed = parseStructuredFromNotes(String(active?.notes ?? ""));
    const data = activeStructured;
    const extra = String(extraNotesByEntryId?.[activeId] ?? "");
    const notebook = structuredToNotebookText(data, extra);

    // Remove structured block, then replace with plain notebook text (one-way)
    updateActive({ notes: notebook,mode:"plain",structured:undefined });
    lastNotesSeenRef.current[activeId] = notebook;

    setModeByEntryId((prev) => ({ ...prev, [activeId]: "notebook" }));
    setStructuredByEntryId((prev) => {
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
    setExtraNotesByEntryId((prev) => ({ ...prev, [activeId]: notebook }));
    setFormatHint(activeId);
    toast("Switched to Notes");
  }


  // When active workout changes, refresh media signed URL
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMediaUrl(null);
      setMediaOpen(false);

      const media = (active as any)?.media as WorkoutMediaMeta;
      if (demoMode||!sessionUserId || !media?.path) return;

      try {
        const url = await getWorkoutMediaSignedUrl(String(media.path), 3600);
        if (cancelled) return;
        setMediaUrl(url);
      } catch {
        if (cancelled) return;
        setMediaUrl(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId, activeIdx, date]);

  function updateActive(patch: Partial<EntryWithMedia>) {
    setEntries((prev) =>
      prev.map((e, i) => (i === activeIdx ? ({ ...e, ...patch } as any) : e))
    );
  }

  function addWorkoutTab() {
    if(personalPlanning){toast("Apply or cancel your workout plan first.");return;}
    if (entries.length >= 3) {
      toast("Max 3 workouts per day");
      return;
    }
    const next: EntryWithMedia = { id: `w_${crypto.randomUUID()}`, title: "", notes: "", media: null,mode:demoMode?"plain":loadDefaultWorkoutMode() };
    setEntries((prev) => [...prev, next]);
    setActiveIdx(entries.length);
    setTimeout(() => notesRef.current?.focus(), 50);
  }

  async function deleteActiveWorkout() {
    if(personalPlanning){toast("Apply or cancel your workout plan first.");return;}
    const ok = window.confirm("Delete this workout?");
    if (!ok) return;
    const removedId=String(entries[activeIdx]?.id||"");
    if(!demoMode&&removedId.startsWith("trainer_")){
      const {error}=await supabase.rpc("remove_trainer_workouts",{p_workout_ids:[removedId.slice(8)]});
      if(error){toast("Could not remove trainer workout: "+error.message);return;}
    }

    if (entries.length === 1) {
      const next = { ...(workouts as any) };

      const existing = (next as any)?.[date];
      const existingImage = existing?.image;
      const keepPb = Boolean(isPb);

      if (keepPb || existingImage?.path) {
        (next as any)[date] = {
          entries: [],
          pb: keepPb,
          image: existingImage?.path ? existingImage : undefined,
        };
      } else {
        delete (next as any)[date];
      }
      setWorkouts(next as any);
      onSaved?.(next as any);
      // Best-effort: remove from community snapshot if enabled
      if(!demoMode)void deleteWorkoutDay({ dateKey: date });
      toast("Workout deleted");
      onClose();
      return;
    }

    const remaining=entries.filter((_,i)=>i!==activeIdx);
    setEntries(remaining);
    persistEntriesToWorkouts(remaining);
    setActiveIdx((i) => Math.max(0, i - 1));
    toast("Workout removed");
  }

  function persistEntriesToWorkouts(nextEntries: EntryWithMedia[], confirmedDraft?:StructuredWorkout) {
    const next = { ...(workouts as any) };
    const day =
      (next as any)[date] && typeof (next as any)[date] === "object"
        ? { ...(next as any)[date] }
        : { entries: [] };

    // Keep any legacy day-level image meta if you still have it
    const existingImage = day?.image;

    const buildNotes = (e: EntryWithMedia) => {
      const id = String(e.id);
      const mode = id.startsWith("trainer_")?"structured":modeByEntryId[id] ?? "notebook";
      if (mode !== "structured") return String(e.notes ?? "");

      // Only exercises are shown in the UI, but we still store a structured payload
      // inside notes to preserve round-trip without changing storage schema.
      const draft = (id===activeId?confirmedDraft:undefined) ?? structuredByEntryId[id] ?? (id.startsWith("trainer_")?prescriptionDraft(e.title,String(e.trainerPrescription||e.notes||"").split("\n")):{workoutName:e.title,rows:[]});

      const extra = extraNotesByEntryId[id] ?? (id.startsWith("trainer_")&&e.notes===e.trainerPrescription?"":removeStructuredBlock(String(e.notes ?? "")));
      const compiled = compileStructuredBlock(draft);
      return upsertStructuredBlock(String(extra ?? ""), compiled);
    };

    // Persist up to 3
    const merged = nextEntries.slice(0, 3).map((e, i) => ({
      ...getDayEntries(workouts,date).find(original=>original.id===e.id),
      id: String(e.id||`w${i + 1}`),
      title: String(e.title ?? ""),
      notes: buildNotes(e),
      mode: (e.id.startsWith("trainer_")||modeByEntryId[e.id]==="structured"?"structured":"plain") as WorkoutEntry["mode"],
      structured: e.id.startsWith("trainer_")||modeByEntryId[e.id]==="structured"?((e.id===activeId?confirmedDraft:undefined)??structuredByEntryId[e.id]??e.structured??prescriptionDraft(e.title,String(e.trainerPrescription||"").split("\n"))):undefined,
      media: (e as any)?.media ?? null,
      completedAt: e.completedAt ?? null,
    }));

    day.entries = merged;
    day.pb = Boolean(isPb);
    if (existingImage?.path) day.image = existingImage;

    (next as any)[date] = day;
    setWorkouts(next as any);
    onSaved?.(next as any);
  }

  async function syncStructuredTrainer(e:WorkoutEntry,completed?:boolean){
    if(demoMode)return true;
    const draft=e.structured as StructuredWorkout|undefined;
    if(!draft)return false;
    const log={notes:removeStructuredBlock(e.notes),actual_sets:actualSetRows(draft),structured_actual_sets:actualLiftText(draft),structured_workout:draft};
    const {error}=await supabase.rpc("save_structured_trainer_workout",{p_workout_id:e.id.slice(8),p_prescription:e.trainerPrescription??"",p_log:log,p_completed:completed??null});
    if(error){toast("Trainer results could not sync: "+error.message);return false;}
    return true;
  }

  async function toggleWorkoutComplete() {
    if(personalPlanning?.id===activeId){toast("Apply or cancel your workout plan first.");return;}
    if(completionLock.current)return;
    if(date>localToday()&&!active?.completedAt){toast("You can mark this workout complete on its scheduled date.");return;}
    if (!active || (!hasContent(active)&&!(activeMode==="structured"&&activeStructured.rows.some(r=>r.name.trim())))) {
      toast("Add a workout before marking it complete");
      return;
    }
    let confirmedDraft=activeStructured;
    if(activeMode==="structured"&&!active.completedAt){
      const candidates=activeStructured.rows.map(row=>(coached||row.planned)?suggestedActual(row):defaultActualUnit(row));
      const ready=candidates.filter(row=>!row.completed&&!row.skipped&&validActual(row)).length;
      const incomplete=candidates.filter(row=>!row.completed&&!row.skipped&&!validActual(row)).length;
      if((ready||incomplete)&&!window.confirm("Confirm "+ready+" additional set(s) using the displayed reps and weights?"+(incomplete?" "+incomplete+" unfinished set(s) will be marked skipped.":"")+" Only confirm sets you actually performed."))return;
      confirmedDraft={...activeStructured,rows:candidates.map(row=>row.completed||row.skipped?row:validActual(row)?{...row,completed:true,skipped:false}:{...row,completed:false,skipped:true})};
    }
    const nextCompletedAt = active.completedAt ? null : new Date().toISOString();
    completionLock.current=true;setCompletionBusy(true);
    try {
    if(coached){const ok=await syncStructuredTrainer({...active,structured:confirmedDraft,notes:activeExtraNotes,completedAt:nextCompletedAt},Boolean(nextCompletedAt));if(!ok)return;}
    if(activeMode==="structured")setStructuredByEntryId(prev=>({...prev,[activeId]:confirmedDraft}));
    const nextEntries=entries.map((e,i)=>i===activeIdx?{...e,completedAt:nextCompletedAt}:e);
    setEntries(nextEntries);
    persistEntriesToWorkouts(nextEntries,confirmedDraft);
    toast(nextCompletedAt?"Workout completed":"Workout reopened — logged sets kept");
    }catch(err){toast("Could not update workout. Please try again.");}finally{completionLock.current=false;setCompletionBusy(false);}
  }

  function handleSave() {
    if(personalPlanning?.id===activeId){toast("Apply or cancel your workout plan first.");return;}
    const buildNotes = (e: EntryWithMedia) => {
      const id = String(e.id);
      const mode = id.startsWith("trainer_")?"structured":modeByEntryId[id] ?? "notebook";
      if (mode !== "structured") return String(e.notes ?? "");

      const draft = structuredByEntryId[id] ?? (id.startsWith("trainer_")?prescriptionDraft(e.title,String(e.trainerPrescription||e.notes||"").split("\n")):{workoutName:e.title,rows:[]});

      const extra = extraNotesByEntryId[id] ?? (id.startsWith("trainer_")&&e.notes===e.trainerPrescription?"":removeStructuredBlock(String(e.notes ?? "")));
      const compiled = compileStructuredBlock(draft);
      return upsertStructuredBlock(String(extra ?? ""), compiled);
    };

    const merged = entries
      .slice(0, 3)
      .map((e, i) => ({
        ...getDayEntries(workouts,date).find(original=>original.id===e.id),
        id: String(e.id||`w${i + 1}`),
        title: String(e.title ?? ""),
        notes: buildNotes(e),
      mode: (e.id.startsWith("trainer_")||modeByEntryId[e.id]==="structured"?"structured":"plain") as WorkoutEntry["mode"],
      structured: e.id.startsWith("trainer_")||modeByEntryId[e.id]==="structured"?(structuredByEntryId[e.id]??e.structured??prescriptionDraft(e.title,String(e.trainerPrescription||"").split("\n"))):undefined,
        media: (e as any)?.media ?? null,
      completedAt: e.completedAt ?? null,
      }));

    const cleaned = merged.filter(e=>e.mode!=="structured"?hasContent(e)||!!e.media?.path:!!(e.title.trim()||removeStructuredBlock(e.notes).trim()||e.media?.path||e.completedAt||e.structured?.rows?.some((r:StructuredExerciseRow)=>r.name?.trim()||r.reps||r.weight||r.note)));
    for (const e of merged) { const old=getDayEntries(workouts,date).find(x=>x.id===e.id);if(e.id.startsWith("trainer_")&&(e.id===activeId||JSON.stringify(old?.structured)!==JSON.stringify(e.structured))){void syncStructuredTrainer(e);} }

    const next = { ...(workouts as any) };
    const existingImage = (next as any)?.[date]?.image; // legacy day image meta
    const keepPb = Boolean(isPb);

    if (cleaned.length === 0) {
      if (keepPb || existingImage?.path) {
        (next as any)[date] = {
          entries: [],
          pb: keepPb,
          image: existingImage?.path ? existingImage : undefined,
        };
      } else {
        delete (next as any)[date];
      }
    } else {
      (next as any)[date] = {
        entries: cleaned,
        pb: keepPb,
        image: existingImage?.path ? existingImage : undefined,
      };
    }

    setWorkouts(next as any);
    onSaved?.(next as any);
    // Best-effort: publish/remove community snapshot if enabled
    if(!demoMode)void publishWorkoutDay({ dateKey: date, workouts: next as any });
    toast("Saved");
  }

  function togglePb() {
    const nextPb = !isPb;
    setIsPb(nextPb);

    const next = { ...(workouts as any) };
    const day =
      (next as any)[date] && typeof (next as any)[date] === "object"
        ? { ...(next as any)[date] }
        : { entries: [] };

    const existingImage = (day as any)?.image;
    day.pb = nextPb;
    if (!Array.isArray(day.entries)) day.entries = [];
    if (existingImage?.path) day.image = existingImage;

    // If toggling off AND no content + no media + no legacy image, remove the day entirely.
    if (!nextPb) {
      const hasEntries = Array.isArray(day.entries) && day.entries.some((e: any) => hasContent(e) || e?.media?.path);
      const hasLegacyImage = Boolean(existingImage?.path);
      if (!hasEntries && !hasLegacyImage) {
        delete (next as any)[date];
      } else {
        (next as any)[date] = day;
      }
    } else {
      (next as any)[date] = day;
    }

    setWorkouts(next as any);
    onSaved?.(next as any);
    // Best-effort: update community snapshot if enabled
    if(!demoMode)void publishWorkoutDay({ dateKey: date, workouts: next as any });
    toast(nextPb ? "Marked PB" : "PB cleared");
  }

  async function handlePickFile(file: File) {
    if(demoMode)return;
    if (!sessionUserId) {
      toast("Sign in to upload");
      return;
    }
    if (!file) return;

    const activeEntryId = String(active?.id || `w${activeIdx + 1}`);
    const existing = (active as any)?.media as WorkoutMediaMeta;

    // If switching kind while one exists, confirm + remove old first
    if (existing?.path && existing?.kind && existing.kind !== pickKind) {
      const ok = window.confirm(
        `Replace existing ${existing.kind} with a ${pickKind}?`
      );
      if (!ok) {
        if (mediaInputRef.current) mediaInputRef.current.value = "";
        return;
      }
      try {
        setMediaBusy(true);
        await removeWorkoutMedia(String(existing.path));
      } catch {
        // ignore
      } finally {
        setMediaBusy(false);
      }
    }

    if (pickKind === "image") {
      if (!file.type.startsWith("image/")) {
        toast("Please select an image");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast("Image too large (max 10MB)");
        return;
      }

      setMediaBusy(true);
      try {
        // compress to webp under hard cap
        const hardCap = 1.5 * 1024 * 1024;
        let blob = await compressImageToWebp(file, { maxLongEdge: 1800, quality: 0.78 });
        if (blob.size > hardCap) blob = await compressImageToWebp(file, { maxLongEdge: 1800, quality: 0.7 });
        if (blob.size > hardCap) blob = await compressImageToWebp(file, { maxLongEdge: 1800, quality: 0.62 });
        if (blob.size > hardCap) {
          toast("Image too large after compression");
          return;
        }

        const path = await uploadWorkoutMedia({
          userId: sessionUserId,
          date,
          entryId: activeEntryId,
          blob,
          kind: "image",
          ext: "webp",
        });

        const url = await getWorkoutMediaSignedUrl(path, 3600);
        setMediaUrl(url);
        setMediaOpen(false);

        const nextMedia: WorkoutMediaMeta = {
          kind: "image",
          path,
          updatedAt: Date.now(),
          sizeBytes: blob.size,
        };

        const nextEntries = entries.map((e, i) =>
          i === activeIdx ? ({ ...e, media: nextMedia } as any) : e
        );
        setEntries(nextEntries);
        persistEntriesToWorkouts(nextEntries);

        toast("Image uploaded");
      } catch (err: any) {
        console.error("Image upload failed:", err);
        const msg = err?.message || err?.error_description || err?.error || "";
        toast(msg ? `Upload failed: ${msg}` : "Upload failed");
      } finally {
        setMediaBusy(false);
        if (mediaInputRef.current) mediaInputRef.current.value = "";
      }
      return;
    }

    // Video rules (Supabase-only; no transcoding)
    const isMp4 = file.type === "video/mp4";
    const isMov = file.type === "video/quicktime";
    if (!isMp4 && !isMov) {
      toast("Video must be MP4 or MOV");
      return;
    }

    const maxBytes = 25 * 1024 * 1024; // 25MB
    if (file.size > maxBytes) {
      toast("Video too large (max 25MB)");
      return;
    }

    setMediaBusy(true);
    try {
      const meta = await readVideoMeta(file);
      const duration = Number(meta.duration || 0);
      if (!duration || duration <= 0) {
        toast("Could not read video duration");
        return;
      }
      if (duration > 30.5) {
        toast("Video too long (max 30 seconds)");
        return;
      }

      const ext = isMov ? "mov" : "mp4";

      const path = await uploadWorkoutMedia({
        userId: sessionUserId,
        date,
        entryId: activeEntryId,
        blob: file,
        kind: "video",
        ext,
      });

      const url = await getWorkoutMediaSignedUrl(path, 3600);
      setMediaUrl(url);
      setMediaOpen(false);

      const nextMedia: WorkoutMediaMeta = {
        kind: "video",
        path,
        updatedAt: Date.now(),
        sizeBytes: file.size,
        durationSec: Math.round(duration * 10) / 10,
        width: meta.width,
        height: meta.height,
      };

      const nextEntries = entries.map((e, i) =>
        i === activeIdx ? ({ ...e, media: nextMedia } as any) : e
      );
      setEntries(nextEntries);
      persistEntriesToWorkouts(nextEntries);

      toast("Video uploaded");
    } catch (err: any) {
      console.error("Video upload failed:", err);
      const msg = err?.message || err?.error_description || err?.error || "";
      toast(msg ? `Upload failed: ${msg}` : "Upload failed");
    } finally {
      setMediaBusy(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  }

  async function handleRemoveMedia() {
    if(demoMode)return;
    if (!sessionUserId) {
      toast("Sign in to manage media");
      return;
    }
    if (!proStatus.isPro) {
      toast("Pro feature locked. Get Pro in Settings.");
      try { window.location.href = "/subscribe"; } catch {}
      return;
    }
    const media = (active as any)?.media as WorkoutMediaMeta;
    if (!media?.path) return;

    const ok = window.confirm("Remove this media?");
    if (!ok) return;

    setMediaBusy(true);
    try {
      await removeWorkoutMedia(String(media.path));
      setMediaUrl(null);
      setMediaOpen(false);

      const nextEntries = entries.map((e, i) =>
        i === activeIdx ? ({ ...e, media: null } as any) : e
      );
      setEntries(nextEntries);
      persistEntriesToWorkouts(nextEntries);

      toast("Removed");
    } catch (err: any) {
      console.error("Remove media failed:", err);
      const msg = err?.message || err?.error_description || err?.error || "";
      toast(msg ? `Failed: ${msg}` : "Failed to remove");
    } finally {
      setMediaBusy(false);
    }
  }

  // Copy the current draft, including structured targets and notes, not only the last saved snapshot.
  async function copyToClipboard() {
    if(personalPlanning){toast("Apply or cancel your workout plan first.");return;}
    try {
      const cleaned = entries
        .slice(0, 3)
        .map((e) => {
          const structured=e.id.startsWith("trainer_")||(modeByEntryId[e.id]??(e.mode==="structured"?"structured":"notebook"))==="structured";
          const draft=structuredByEntryId[e.id]??e.structured??(e.id.startsWith("trainer_")?prescriptionDraft(e.title,String(e.trainerPrescription||"").split("\n")):undefined);
          const extra=extraNotesByEntryId[e.id]??(e.notes===e.trainerPrescription?"":removeStructuredBlock(e.notes||""));
          const meaningful=!!draft?.rows?.some((r:StructuredExerciseRow)=>r.name||r.reps||r.weight||r.note);
          return {title:String(e.title??""),notes:structured?(meaningful?upsertStructuredBlock(extra,compileStructuredBlock({...draft,workoutName:e.title})):extra):String(e.notes??"")};
        })
        .filter(hasContent);

      if (cleaned.length === 0) {
        toast("Nothing to copy");
        return;
      }

      const payload: ClipboardDay = {
        kind: CLIPBOARD_DAY_KIND,
        entries: cleaned.slice(0, 3),
      };

      await navigator.clipboard.writeText(JSON.stringify(payload));
      toast(`Copied ${payload.entries.length} workout${payload.entries.length === 1 ? "" : "s"}`);
    } catch {
      toast("Copy failed");
    }
  }

  async function pasteFromClipboard() {
    if(personalPlanning){toast("Apply or cancel your workout plan first.");return;}
    if(entries.some(e=>e.id.startsWith("trainer_"))){toast("Trainer workouts are structured. Add exercises or sets directly instead of pasting notebook text.");return;}
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      // Day payload
      const dayParsed = safeJsonParse<ClipboardDay>(text);
      if (dayParsed && dayParsed.kind === CLIPBOARD_DAY_KIND) {
        const incoming = (Array.isArray(dayParsed.entries)?dayParsed.entries:[])
          .slice(0, 3)
          .map((e, i) => ({
            id: `w_${crypto.randomUUID()}_${i}`,
            title: String(e?.title ?? ""),
            notes: String(e?.notes ?? ""),
            media: null,
            mode:parseStructuredFromNotes(String(e?.notes??""))?"structured" as const:"plain" as const,
          }))
          .filter(hasContent);

        if (incoming.length === 0) {
          toast("Nothing to paste");
          return;
        }

        if(entries.some(e=>hasContent(e)||e.media?.path||structuredByEntryId[e.id]?.rows?.length)&&!window.confirm("Replace the workouts currently open for this date with the copied workouts? Save any changes you want to keep first."))return;
        setEntries(incoming);
        setActiveIdx(0);

        toast(`Pasted ${incoming.length} workout${incoming.length === 1 ? "" : "s"}`);
        return;
      }

      // Single workout payload
      const oneParsed = safeJsonParse<ClipboardWorkout>(text);
      if (oneParsed && oneParsed.kind === CLIPBOARD_WORKOUT_KIND) {
        const incomingTitle = String(oneParsed.title ?? "").trim();
        const incomingNotes = String(oneParsed.notes ?? "");

        if(activeMode==="structured"){
          const incomingStructured=parseStructuredFromNotes(incomingNotes);
          if(incomingStructured?.rows.length){toast("Copy and paste the full workout day to preserve structured exercises.");return;}
          updateActive({title:active?.title?.trim()||incomingTitle});updateActiveExtraNotes([activeExtraNotes.trimEnd(),incomingNotes].filter(Boolean).join("\n"));toast("Pasted into workout notes");return;
        }
        const currentTitle = String(active?.title ?? "").trim();
        const currentNotes = String(active?.notes ?? "").trimEnd();

        const nextTitle = currentTitle ? currentTitle : incomingTitle;
        const mergedNotes = currentNotes
          ? incomingNotes
            ? currentNotes + "\n" + incomingNotes
            : currentNotes
          : incomingNotes;

        updateActive({ title: nextTitle, notes: mergedNotes });
        toast("Pasted");
        return;
      }

      // Plain text belongs in the extra notes field when logging a structured workout.
      if(activeMode==="structured"){updateActiveExtraNotes([activeExtraNotes.trimEnd(),text].filter(Boolean).join("\n"));toast("Pasted into workout notes");return;}
      const merged = String(active?.notes ?? "").trimEnd();
      const next = merged ? merged + "\n" + text : text;
      updateActive({ notes: next });
      toast("Pasted");
    } catch {
      toast("Paste failed");
    }
  }

  // ✅ Tabs: show icon if that workout has media (video or image)
  const tabLabels = useMemo(() => {
    return entries.map((e, i) => {
      const t = String(e.title ?? "").trim();
      const media = (e as any)?.media as WorkoutMediaMeta;
      const icon = media?.kind === "video" ? " 🎥" : media?.kind === "image" ? " 📷" : "";
      return (t ? t : `Workout ${i + 1}`) + icon;
    });
  }, [entries]);

  const activeMedia = (active as any)?.media as WorkoutMediaMeta;
  const hasMedia = Boolean(activeMedia?.path);
  const mediaKind =
    activeMedia?.kind === "video" ? "video" : activeMedia?.kind === "image" ? "image" : null;

  
  async function handleShare() {
    if(demoMode){toast("Sharing is disabled in this fictional demo.");return;}
    try {
      const t = String(active?.title ?? "").trim() || "Workout";
      const n = activeMode==="structured"
        ? [...(activeStructured.rows||[]).filter(r=>r.completed===true&&!r.skipped&&r.name.trim()&&String(r.reps||"").trim()).map(r=>{
            const timed=/\b(sec|min)$/i.test(r.targetReps||"");
            return r.name+" — "+(timed?r.reps+" sec":r.reps+" reps")+(!timed&&r.weight&&r.unit?" × "+r.weight+" "+r.unit:"");
          }),activeExtraNotes.trim()].filter(Boolean).join("\n")
        : removeStructuredBlock(String(active?.notes??"")).trim();
      const dateLabel = formatDisplayDate(date);

      let media: { kind: "image" | "video"; url: string } | null = null;
      const m = (active as any)?.media as WorkoutMediaMeta | null | undefined;

      if (m?.path && (m.kind === "image" || m.kind === "video")) {
        let url = mediaUrl;
        if (!url) {
          try {
            url = await getWorkoutMediaSignedUrl(m.path);
          } catch {
            url = null;
          }
        }
        if (url) media = { kind: m.kind, url };
      }

      const safe = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const filename = `gym-log-${date}-${safe || "workout"}.png`;

      const res = await shareWorkoutVerticalImage({
        filename,
        dateLabel,
        title: t,
        notes: n,
        media,
        status:active?.completedAt?"Completed":date>localToday()?"Scheduled":"Workout log",
      });

      if (res.kind === "shared") toast("Shared");
      else if (res.kind === "downloaded") toast("Downloaded");
      else toast("Sharing not supported");
    } catch {
      toast("Could not share");
    }
  }


return (
    <div className={"overlay workout-editor-overlay"+(keyboardViewport?" keyboard-open":"")} style={keyboardViewport?{top:keyboardViewport.top,height:keyboardViewport.height,bottom:"auto"}:undefined}>
      <div className={"editor editor-full"+(writingNotes?" writing-notes":"")+(personal?" personal-workout-editor":"")+(pickerOpen?" picker-open":"")+(planOpen?" personal-advanced-open":"")} onMouseDown={(e) => e.stopPropagation()}>
        <button className="close" onClick={()=>{if(personalPlanning){if(window.confirm("Discard unapplied target changes?"))setPersonalPlanning(null);return;}onClose();}} aria-label="Close">
          ✕
        </button>

        <div className="editor-header">
          <div className="editor-date">{formatDisplayDate(date)}{demoMode&&" · DEMO CLIENT"}{!coached&&futureCompletionBlocked&&<span className="personal-scheduled" title="You can edit now and mark complete on the scheduled date">Scheduled</span>}</div>
          {writingNotes&&<div className="workout-writing-title">{active?.title?.trim()||"Workout notes"}</div>}

          <input
            className="editor-title"
            value={active?.title ?? ""}
            onChange={(e) => updateActive({ title: e.target.value })}
            placeholder="Workout title"
          />

          <div className="workout-editor-tabs"
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              overflowX: "auto",
              paddingBottom: 6,
              marginTop: 6,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {tabLabels.map((label, i) => (
              <button
                key={i}
                aria-pressed={i===activeIdx}
                onClick={() => {if(personalPlanning&&i!==activeIdx){toast("Apply or cancel your workout plan first.");return;}setActiveIdx(i);}}
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: i === activeIdx ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: i === activeIdx ? "rgba(255,87,33,0.14)" : "transparent",
                  color: "var(--text)",
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                }}
              >
                {label}
              </button>
            ))}

            <button
              onClick={addWorkoutTab}
              title="Add workout"
              aria-label="Add workout"
              style={{
                padding: "8px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
                opacity: entries.length >= 3 ? 0.5 : 1,
              }}
              disabled={entries.length >= 3}
            >
              + Workout
            </button>
          </div>
        </div>

        <div
          className="editor-content"
          ref={editorContentRef}
        >
          
          {!(!coached&&futureCompletionBlocked)&&<button
            type="button"
            onClick={toggleWorkoutComplete}
            disabled={completionBusy||futureCompletionBlocked}
            title={futureCompletionBlocked?"Available on the scheduled date":undefined}
            className="workout-completion-button"
            aria-pressed={Boolean(active?.completedAt)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              marginTop: 10, padding: "9px 14px", borderRadius: 10,
              border: active?.completedAt ? "1px solid #22c55e" : "1px solid var(--border)",
              background: active?.completedAt ? "rgba(34,197,94,0.14)" : "transparent",
              color: active?.completedAt ? "#22c55e" : "var(--text)",
              fontWeight: 600, cursor: "pointer"
            }}
          >
            {completionBusy?"Saving…":futureCompletionBlocked?"Scheduled · Not available yet":active?.completedAt ? "✓ Completed · Undo" : "✓ Mark Complete"}
          </button>}
          {futureCompletionBlocked&&coached&&<p className="future-completion-hint">You can log and edit this workout now. Mark it complete on or after {formatDisplayDate(date)}.</p>}
          {restUntil!==null&&<div className="structured-rest-timer"><div><strong role="status">{restLeft>0?"Rest timer":"Rest complete"}</strong><span role="timer" aria-live="off">{Math.floor(restLeft/60)}:{String(restLeft%60).padStart(2,"0")}</span></div><button type="button" onClick={()=>setRestUntil(v=>v===null?null:Math.max(Date.now(),v-15000))}>−15s</button><button type="button" onClick={()=>setRestUntil(v=>Math.max(Date.now(),v||0)+15000)}>+15s</button><button type="button" onClick={()=>setRestUntil(null)}>{restLeft?"Skip":"Dismiss"}</button></div>}
          {/* Editor mode toggle */}
          {coached?<p className="workout-mode-label">Trainer-assigned · Structured workout</p>:<div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div role="group" aria-label="Workout format" className="workout-format-switch"
              style={{
                display: "inline-flex",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(0,0,0,0.15)",
              }}
            >
              <button
                type="button"
                aria-pressed={activeMode==="notebook"} onClick={() => {if(activeMode==="structured")handleConvertStructuredToNotebook();}}
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  border: "none",
                  background: activeMode === "notebook" ? "var(--accent)" : "transparent",
                  color: activeMode==="notebook"?"#111":"var(--text)",
                  cursor: "pointer",
                }}
              >
                Notes
              </button>
              <button
                type="button"
                aria-pressed={activeMode==="structured"} onClick={() => {
                  if(activeMode==="structured")return;
                  // Preserve the existing free-form notes instead of forcing deletion.
                  // Initialize draft from current title if needed
                  setStructuredByEntryId((prev) => ({
                    ...prev,
                    [activeId]: prev[activeId] ?? {
                      workoutName: String(active?.title ?? "").trim(),
                      rows: [],
                    },
                  }));
                  setExtraNotesByEntryId((prev) => ({
                    ...prev,
                    [activeId]: String(active?.notes??""),
                  }));
                  setActiveMode("structured");
                  setFormatHint(activeId);
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  border: "none",
                  background: activeMode === "structured" ? "var(--accent)" : "transparent",
                  color: activeMode==="structured"?"#111":"var(--text)",
                  cursor:"pointer",
                }}
                title="Structured workout editor — keeps existing notes"
              >
                Structured
              </button>
            </div>

          </div>}
          {!coached&&formatHint===activeId&&<div className="workout-format-hint" role="status"><span>Prefer {activeMode==="structured"?"Structured":"Notes"} for new workouts? Change your default in <strong>Settings → General → Default workout format.</strong> This switch only affects this workout.</span><button type="button" aria-label="Dismiss format tip" onClick={()=>setFormatHint(null)}>×</button></div>}

          {activeMode === "structured" ? (
<div className={"structured-workout-panel"+(personal?" personal-structured-panel":"")}
  style={{
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 10,
    background: "rgba(0,0,0,0.10)",
  }}
>
  {planOpen&&personalPlanning&&<div className="coach-builder personal-plan-editor"><div className="personal-plan-heading"><strong>Advanced programming</strong><small>Review targets before applying. Unspecified rep targets start at a suggested 10 reps. Existing logged sets are protected.</small></div><PrescriptionEditor value={personalPlanning.value} onChange={value=>setPersonalPlanning(old=>old?{...old,value}:null)}/><div className="coach-builder-actions personal-advanced-actions"><button className="trainer-action" type="button" disabled={!validatePrescriptionLines(personalPlanning.value.split("\n").filter(Boolean))} onClick={applyPersonalPlan}>Apply targets</button><button className="trainer-outline-button" type="button" onClick={()=>{if(!window.confirm("Discard unapplied target changes?"))return;setPersonalPlanning(null)}}>Cancel</button></div></div>}
  {!planOpen&&personal&&<>{plannedRows.length?<div className="personal-workout-summary"><span><strong>{new Set(plannedRows.map(r=>normalizeExerciseKey(r.name))).size}</strong> exercises</span><span><strong>{plannedRows.filter(r=>r.completed&&!r.skipped).length}/{plannedRows.length}</strong> sets</span><span><strong>{formatCompactNumber(activeTotalVolume/0.45359237)}</strong> lb volume</span></div>:<div className="personal-workout-empty"><div aria-hidden="true" className="personal-empty-icon">＋</div><strong>Build your workout</strong><span>Choose exercises and start logging.</span><button type="button" className="personal-primary" onClick={()=>setPickerOpen(true)} disabled={!!active?.completedAt}>＋ Add exercises</button><button type="button" className="personal-secondary" onClick={usePreviousWorkout}>Use previous workout</button><a href="/workout-programs" className="personal-secondary" onClick={ev=>{if(!window.confirm("Leave this workout to browse programs? Save any changes you want to keep first."))ev.preventDefault()}}>Choose a workout program</a></div>}</>}
  {!planOpen&&<>{coached&&<div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
    <button
      type="button"
      onClick={addExercisePrompt}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "inherit",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {coached?"+ Add exercise":"+ Quick log exercise"}
    </button>

    <button
      type="button"
      onClick={addNextSetFromLastRow}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "inherit",
        cursor: "pointer",
        fontWeight: 600,
      }}
      title="Adds another set for the last exercise"
    >
      + Add set
    </button>

    <button
      type="button"
      onClick={duplicateLastStructuredRow}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "inherit",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Repeat last
    </button>

    <div style={{ marginLeft: "auto", fontSize: 13, opacity: 0.9 }}>
      <span style={{ opacity: 0.8, marginRight: 6 }}>Total volume (lb):</span>
      <span style={{ fontWeight: 700 }}>{Math.round(activeTotalVolume/0.45359237).toLocaleString()}</span>
    </div>
  </div>}

  <div className="personal-exercise-list" style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
    {coached&&!activeStructured.rows.length&&<div className="workout-empty-state"><strong>No exercises yet</strong><span>{coached?"Add a set or exercise to this workout.":"Build a plan above, or use Quick log exercise to start tracking a set."}</span></div>}
    {(()=>{const rows=activeStructured.rows||[];const normal=groupRowsByExercise(rows).map(g=>({...g,indices:g.indices.filter(i=>!rows[i].block)})).filter(g=>g.indices.length);const blocks=new Map<string,number[]>();rows.forEach((r,i)=>{if(r.block)blocks.set(r.block.id,[...(blocks.get(r.block.id)||[]),i]);});const display=[...normal.map(g=>({first:g.indices[0],g,blockIndices:null as number[]|null})),...Array.from(blocks.values()).map(indices=>({first:indices[0],g:null,blockIndices:indices}))].sort((a,b)=>a.first-b.first);return display.map(({g,blockIndices,first})=>{if(blockIndices){const block=rows[first].block!;const rounds=Array.from(new Set(blockIndices.map(i=>rows[i].blockRound||1))).sort((a,b)=>a-b);return <section key={"block-"+block.id} className="structured-exercise-card structured-training-block"><header><strong>{blockLabel(block)}</strong><small>{rounds.length} rounds · {block.restSeconds}s rest after each round</small>{personal&&<button type="button" className="personal-secondary" disabled={!!active?.completedAt} onClick={()=>openPersonalPlan(blockIndices)}>Edit group targets</button>}</header>{rounds.map(round=>{const indices=blockIndices.filter(i=>(rows[i].blockRound||1)===round);return <div key={round} className="structured-block-round"><strong>Round {round} · {indices.filter(i=>rows[i].completed&&!rows[i].skipped).length}/{indices.length} complete</strong>{indices.map(i=>{const r=(coached||rows[i].planned)?suggestedActual(rows[i]):defaultActualUnit(rows[i]);return <div key={i} className="structured-block-movement"><div><b>{r.name}</b><small>Target: {[r.targetReps,r.targetLoad,r.note].filter(Boolean).join(" · ")}</small></div><div className="structured-block-inputs"><button type="button" className="structured-set-check" aria-pressed={!!r.completed} aria-label={(r.completed?"Mark incomplete: ":"Mark complete: ")+r.name+", round "+round} onClick={()=>toggleRowCompleted(i)}>{r.completed?"✓":r.skipped?"–":""}</button><label>{/\b(sec|min)$/i.test(r.targetReps||"")?"Seconds":"Reps"}<input inputMode="numeric" value={r.reps||""} onChange={ev=>updateActiveStructuredRow(i,{reps:sanitizeIntInput(ev.target.value),repsEdited:true})}/></label><label>Weight<input inputMode="decimal" value={r.weight||""} onChange={ev=>updateActiveStructuredRow(i,{weight:sanitizeDecimalInput(ev.target.value),weightEdited:true,unit:r.unit||"lb"})}/></label><label>Unit<select value={r.unit||""} onChange={ev=>updateActiveStructuredRow(i,{unit:ev.target.value as StructuredExerciseRow["unit"],unitEdited:true})}>{!r.unit&&<option value="">Unit</option>}<option value="lb">lb</option><option value="kg">kg</option></select></label><button type="button" aria-label={r.skipped?"Restore set":"Skip set"} onClick={()=>removeActiveStructuredRow(i)}>{r.skipped?"↶":"–"}</button></div></div>})}</div>})}</section>;}if(!g)return null;
      const isCollapsed = Boolean(activeCollapsed[g.key]);
      const vol = exerciseGroupVolume(g.indices);
      const setCount = g.indices.length;

      return (
        <div
          key={g.key}
          className="structured-exercise-card"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            overflow: "hidden",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div className="structured-exercise-header"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 10,
              background: "rgba(0,0,0,0.12)",
            }}
          >
            <button
              type="button"
              onClick={() => setCollapsed(g.key, !isCollapsed)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
                cursor: "pointer",
                flex: "0 0 auto",
              }}
              aria-label={isCollapsed ? "Expand" : "Collapse"}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? "▸" : "▾"}
            </button>

            <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {personal?<strong className="personal-exercise-name">{g.name}</strong>:<input
                  value={g.name}
                  onChange={(e) => renameExerciseInGroup(g.key, e.target.value)}
                  style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    padding: "8px 10px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.18)",
                    color: "inherit",
                    outline: "none",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                />}

                {personal?<button type="button" className="personal-icon-button" aria-label={"Options for "+g.name} aria-expanded={exerciseMenu===g.key} onClick={()=>setExerciseMenu(v=>v===g.key?null:g.key)}>···</button>:<button
                  type="button"
                  onClick={() => addSetToExercise(g.key)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "inherit",
                    cursor: "pointer",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flex: "0 0 auto",
                  }}
                  title="Add a set for this exercise"
                >
                  + Set
                </button>}
              </div>
              {personal&&exerciseMenu===g.key&&<div className="personal-exercise-menu"><button type="button" onClick={()=>openPersonalPlan(g.indices)}>Edit exercise targets &amp; details</button>{!demoMode&&<button type="button" onClick={()=>{window.open("/progress?exercise="+encodeURIComponent(g.name)+"#exercise","_blank","noopener,noreferrer");setExerciseMenu(null)}}>View exercise history</button>}<button type="button" onClick={()=>openPersonalPlan()}>Group exercises / advanced plan</button><button type="button" onClick={()=>moveExercise(g.indices,-1)}>Move up</button><button type="button" onClick={()=>moveExercise(g.indices,1)}>Move down</button><button type="button" onClick={()=>removeExercise(g.indices)}>Remove exercise</button></div>}

              {!!activeStructured.rows[g.indices[0]]?.alternatives?.length&&<label style={{fontSize:12}}>{coached?"Coach-approved alternative":"Exercise alternative"}<select value="" onChange={ev=>{if(ev.target.value)renameExerciseInGroup(g.key,ev.target.value)}}><option value="">Choose substitution</option>{[activeStructured.rows[g.indices[0]].prescribedName,...(activeStructured.rows[g.indices[0]].alternatives||[])].filter(Boolean).map(x=><option key={x}>{x}</option>)}</select></label>}{(coached||activeStructured.rows[g.indices[0]]?.planned)&&(()=>{const r=activeStructured.rows[g.indices[0]];return <small style={{color:"var(--muted)",marginTop:5}}>{r?.prescribedName&&r.prescribedName!==r.name?"Substituted for "+r.prescribedName+" · ":""}Target: {[r?.targetReps,r?.targetLoad,r?.targetRest&&"Rest "+r.targetRest].filter(Boolean).join(" · ")||(coached?"Review exercise with coach":"No target")}{r?.note?" · "+r.note:""}</small>})()}
              {(() => {
                const prev = prevStatsByExerciseKey[g.key];
                const curMax = computeMaxWeightForIndices(activeStructured.rows || [], g.indices).bestNum;
                const prevMax = prev?.maxWeightNum ?? null;
                const diff =
                  curMax != null && prevMax != null && Number.isFinite(curMax) && Number.isFinite(prevMax)
                    ? curMax - prevMax
                    : null;
                const unit = prev?.unit || "";
                const diffLabel =
                  diff == null || Math.abs(diff) < 0.0001
                    ? ""
                    : `${diff > 0 ? "↑" : "↓"} ${diff > 0 ? "+" : ""}${Number((diff/(unit==="lb"?0.45359237:1)).toFixed(1))}${unit ? ` ${unit}` : ""}`;

                return (
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      fontSize: 12,
                      opacity: 0.78,
                    }}
                  >
                    <span style={{ whiteSpace: "nowrap" }}>
                      {g.indices.filter(i=>activeStructured.rows[i]?.completed&&!activeStructured.rows[i]?.skipped).length}/{setCount} sets complete • Vol {Math.round(vol/0.45359237).toLocaleString()} lb
                    </span>
                    {prev?.summary ? (
                      <span style={{ whiteSpace: "nowrap" }}>
                        <span style={{ opacity: 0.85 }}>Last:</span> {prev.summary}
                        {diffLabel ? <span style={{ marginLeft: 8, fontWeight: 700 }}>{diffLabel}</span> : null}
                      </span>
                    ) : null}
                  </div>
                );
              })()}
              {personal&&!!prevStatsByExerciseKey[g.key]?.sets.length&&g.indices.some(i=>canEditPrescription(plannedRows[i])&&!plannedRows[i].targetReps&&!plannedRows[i].targetLoad)&&<button type="button" className="personal-use-last" onClick={()=>useLastExercise(g)}>Use last results</button>}
            </div>
          </div>

          {!isCollapsed && (
            <div style={{ padding: 10 }}>
              <div
                className={personal?"personal-set-head":undefined}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 28px minmax(48px, .8fr) minmax(80px, 1.4fr) 32px",
                  gap: 4,
                  alignItems: "center",
                  fontSize: 12,
                  opacity: 0.8,
                  padding: "0 4px 8px 4px",
                }}
              >
                <div />
                <div>Set</div>
                <div>{/\b(sec|min)$/i.test(activeStructured.rows[g.indices[0]]?.targetReps||"")?"Seconds":"Reps"}</div>
                <div>Weight</div>
                <div />
              </div>

              <div data-gl-sort-list style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {g.indices.map((rowIdx, pos) => {
                  const raw = (activeStructured.rows || [])[rowIdx];
                  const r = (coached||raw.planned)?suggestedActual(raw):defaultActualUnit(raw);
                  const done = Boolean(r?.completed);

                  return (
                    <div
                      key={rowIdx}
                      data-gl-sort-item={rowIdx}
                      className={personal?"personal-set-row":undefined}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "36px 28px minmax(48px, .8fr) minmax(80px, 1.4fr) 32px",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleRowCompleted(rowIdx)}
                        className="structured-set-check"
                        aria-pressed={done}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: done ? "rgba(255,87,33,0.16)" : "rgba(255,255,255,0.06)",
                          color: "inherit",
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                        aria-label={(done ? "Mark incomplete: " : "Mark complete: ")+g.name+", set "+(pos+1)}
                        title={done ? "Completed" : "Not completed"}
                      >
                        {done ? "✓" : r.skipped ? "–" : ""}
                      </button>

                      <div className="gl-sort-set-label">{personal&&!active?.completedAt&&g.indices.length>1?<DragHandle className="gl-sort-set-handle" index={rowIdx} label={g.name+" · set "+(pos+1)} onMove={(from,to)=>{if(!g.indices.includes(from)||!g.indices.includes(to)||active?.completedAt)return;const next=[...activeStructured.rows];const group=g.indices.map(i=>next[i]);const [moved]=group.splice(g.indices.indexOf(from),1);group.splice(g.indices.indexOf(to),0,moved);g.indices.forEach((i,j)=>{next[i]=group[j]});updateActiveStructured({rows:next});}}/>:null}#{pos + 1}{r?.setType&&r.setType!=="normal"&&<small style={{display:"block",fontSize:9}}>{r.setType}</small>}{r?.skipped?<small style={{display:"block",fontSize:9}}>Skipped</small>:null}</div>

                      <input
                        value={r?.reps ?? ""}
                        onChange={(e) =>
                          updateActiveStructuredRow(rowIdx, { reps: sanitizeIntInput(e.target.value),repsEdited:true } as any)
                        }
                        placeholder={/\b(sec|min)$/i.test(r?.targetReps||"")?"Seconds":r?.targetReps||"Reps"}
                        aria-label={r?.targetReps?.match(/sec|min/i)?"Actual duration in seconds":"Actual reps"}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{
                          width: "100%",
                          padding: "10px 10px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(0,0,0,0.18)",
                          color: "inherit",
                          outline: "none",
                          fontSize: 14,
                          opacity: done ? 0.7 : 1,
                        }}
                      />

                      <div className="structured-weight-field"><select aria-label={"Weight unit, set "+(pos+1)} value={r?.unit||""} onChange={e=>updateActiveStructuredRow(rowIdx,{unitEdited:true,unit:e.target.value as StructuredExerciseRow["unit"]})} style={{fontSize:13}}>{!r.unit&&<option value="">Unit</option>}<option value="lb">lb</option><option value="kg">kg</option></select>
                        <input
                          value={r?.weight ?? ""}
                          onChange={(e) =>
                            updateActiveStructuredRow(rowIdx, { weight: sanitizeDecimalInput(e.target.value),weightEdited:true,unit:r.unit||"lb" } as any)
                          }
                          placeholder={r?.targetLoad||"Weight"}
                          aria-label="Actual weight"
                          inputMode="decimal"
                          pattern="[0-9.]*"
                          style={{
                            width: "100%",
                            height: 40,
                            borderRadius: 14,
                            padding: "0 8px",
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(0,0,0,0.18)",
                            color: "inherit",
                            outline: "none",
                            fontSize: 14,
                            opacity: done ? 0.7 : 1,
                          }}
                        />

                      </div>

                      <button
                        type="button"
                        onClick={() => removeActiveStructuredRow(rowIdx)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.06)",
                          color: "inherit",
                          cursor: "pointer",
                        }}
                        title={r?.planned?(r.skipped?"Restore skipped set":"Skip prescribed set"):"Remove set"}
                        aria-label={r?.planned?(r.skipped?"Restore skipped set":"Skip prescribed set"):"Remove set"}
                      >
                        {r?.planned?(r.skipped?"↶":"–"):"✕"}
                      </button>
                      {personal&&prevStatsByExerciseKey[g.key]?.sets[pos]&&<small className="personal-set-history">Last: {prevStatsByExerciseKey[g.key].sets[pos].weight?prevStatsByExerciseKey[g.key].sets[pos].weight+" "+(prevStatsByExerciseKey[g.key].sets[pos].unit||"")+" × ":""}{prevStatsByExerciseKey[g.key].sets[pos].reps||"—"}</small>}
                      {r.setType&&<div className="structured-set-target-detail" style={{gridColumn:"2/-1"}}>Target: {[r.targetReps,r.targetLoad,r.targetRest&&"Rest "+r.targetRest,r.targetRpe&&"RPE "+r.targetRpe,r.targetRir&&"RIR "+r.targetRir,r.targetTempo&&"Tempo "+r.targetTempo].filter(Boolean).join(" · ")}{(r.targetRpe||r.targetRir)&&<div style={{display:"flex",gap:8}}>{r.targetRpe&&<label>Actual RPE<input inputMode="decimal" value={r.actualRpe||""} onChange={ev=>updateActiveStructuredRow(rowIdx,{actualRpe:ev.target.value})}/></label>}{r.targetRir&&<label>Actual RIR<input inputMode="numeric" value={r.actualRir||""} onChange={ev=>updateActiveStructuredRow(rowIdx,{actualRir:ev.target.value})}/></label>}</div>}</div>}
                    </div>
                  );
                })}
              </div>
              {personal&&<button type="button" className="personal-add-set" onClick={()=>addSetToExercise(g.key)}>＋ Add set</button>}
            </div>
          )}
        </div>
      );
    });})()}
  </div>{personal&&plannedRows.length>0&&<><button type="button" className="personal-primary personal-add-exercises" onClick={()=>setPickerOpen(true)} disabled={!!active?.completedAt}>＋ Add exercises</button><button type="button" className="personal-secondary" onClick={()=>openPersonalPlan()} disabled={!canReplacePlan}>Advanced programming / group exercises</button>{!canReplacePlan&&!active?.completedAt&&<small className="personal-protected-hint">Advanced grouping is available before logging. Logged sets remain protected.</small>}</>}</>}

  {!planOpen&&<details className="personal-workout-notes" open={coached||activeExtraNotes?true:undefined}>
    <summary>Workout notes (optional)</summary>
    <textarea
      aria-label="Extra workout notes"
      value={activeExtraNotes}
      onChange={(e) => updateActiveExtraNotes(e.target.value)}
      placeholder="Extra notes for this workout…"
      rows={3}
      style={{
        width: "100%",
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.18)",
        color: "inherit",
        outline: "none",
        fontSize: 14,
        resize: "vertical",
      }}
    />
  </details>}
</div>
) : (
            <textarea
              ref={notesRef}
              className="editor-notes"
              aria-label="Workout notes"
              onFocus={()=>setNotesFocused(true)}
              onBlur={()=>{if(!keyboardViewport)setNotesFocused(false);}}
              value={active?.notes ?? ""}
              onChange={(e) => updateActive({ notes: e.target.value })}
              placeholder="Workout notes"
            />
          )}



          {activeMode==="notebook"&&!writingNotes&&<div className="notebook-quick-actions"><button type="button" className="personal-secondary" onClick={()=>setPickerOpen(true)}>＋ Insert exercises</button><a href="/workout-programs" className="personal-secondary" onClick={ev=>{if(!window.confirm("Leave this workout to browse programs? Save any changes you want to keep first."))ev.preventDefault()}}>Choose workout program</a></div>}
          {/* ✅ Media per workout (image OR video) — Pro only (trial counts) */}
          {proStatus.isPro ? (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setMediaOpen((v) => !v)}
                disabled={mediaBusy}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.10)",
                  color: "inherit",
                  cursor: mediaBusy ? "not-allowed" : "pointer",
                }}
                aria-expanded={mediaOpen}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 auto",
                    }}
                    aria-hidden
                  >
                    📷
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Highlight {mediaKind ? `(${mediaKind})` : ""}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.65 }}>
                      {hasMedia ? "1 attached" : sessionUserId ? "Add image or short video (max 30s)" : "Pro feature — sign in to upload"}
                    </div>
                  </div>
                  {mediaUrl ? (
                    mediaKind === "video" ? (
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(0,0,0,0.18)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.9)",
                          flex: "0 0 auto",
                        }}
                      >
                        ▶
                      </div>
                    ) : (
                      <img
                        src={mediaUrl}
                        alt="Highlight thumbnail"
                        style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", objectFit: "cover", display: "block", flex: "0 0 auto" }}
                      />
                    )
                  ) : null}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, flex: "0 0 auto" }}>{mediaOpen ? "▴" : "▾"}</div>
              </button>

              {mediaOpen ? (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Add / manage highlight media</div>
                    {hasMedia && sessionUserId ? (
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        disabled={mediaBusy}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.18)",
                          color: "var(--text)",
                          borderRadius: 10,
                          padding: "8px 10px",
                          fontWeight: 500,
                          cursor: mediaBusy ? "not-allowed" : "pointer",
                          fontSize: 13,
                          opacity: mediaBusy ? 0.6 : 1,
                          flex: "0 0 auto",
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickKind("image");
                        mediaInputRef.current?.click();
                      }}
                      disabled={!sessionUserId || mediaBusy || (hasMedia && mediaKind === "video")}
                      style={{
                        background: !sessionUserId
                          ? "rgba(255,255,255,0.08)"
                          : hasMedia && mediaKind === "video"
                            ? "rgba(255,255,255,0.08)"
                            : "var(--accent)",
                        border: !sessionUserId || (hasMedia && mediaKind === "video") ? "1px solid rgba(255,255,255,0.12)" : "none",
                        color: !sessionUserId || (hasMedia && mediaKind === "video") ? "rgba(255,255,255,0.75)" : "white",
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontWeight: 600,
                        cursor: !sessionUserId || mediaBusy || (hasMedia && mediaKind === "video") ? "not-allowed" : "pointer",
                        fontSize: 13,
                        opacity: !sessionUserId || mediaBusy || (hasMedia && mediaKind === "video") ? 0.55 : 1,
                        whiteSpace: "nowrap",
                        flex: "0 0 auto",
                      }}
                    >
                      {hasMedia && mediaKind === "image" ? "Replace image" : "Upload image"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPickKind("video");
                        mediaInputRef.current?.click();
                      }}
                      disabled={!sessionUserId || mediaBusy || (hasMedia && mediaKind === "image")}
                      style={{
                        background: !sessionUserId
                          ? "rgba(255,255,255,0.08)"
                          : hasMedia && mediaKind === "image"
                            ? "rgba(255,255,255,0.08)"
                            : "var(--accent)",
                        border: !sessionUserId || (hasMedia && mediaKind === "image") ? "1px solid rgba(255,255,255,0.12)" : "none",
                        color: !sessionUserId || (hasMedia && mediaKind === "image") ? "rgba(255,255,255,0.75)" : "white",
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontWeight: 600,
                        cursor: !sessionUserId || mediaBusy || (hasMedia && mediaKind === "image") ? "not-allowed" : "pointer",
                        fontSize: 13,
                        opacity: !sessionUserId || mediaBusy || (hasMedia && mediaKind === "image") ? 0.55 : 1,
                        whiteSpace: "nowrap",
                        flex: "0 0 auto",
                      }}
                    >
                      {hasMedia && mediaKind === "video" ? "Replace video" : "Upload video"}
                    </button>

                    <input
                      ref={mediaInputRef}
                      type="file"
                      accept={pickKind === "image" ? "image/*" : "video/mp4,video/quicktime"}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePickFile(f);
                      }}
                    />
                  </div>

                  {mediaUrl ? (
                    <div style={{ marginTop: 10 }}>
                      {mediaKind === "video" ? (
                        <video
                          src={mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          style={{ width: "100%", maxHeight: 240, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", display: "block", background: "rgba(0,0,0,0.18)" }}
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt="Workout media"
                          style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", display: "block", background: "rgba(0,0,0,0.18)" }}
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}



        </div>

        {pickerOpen&&<PersonalExercisePicker key={activeId+activeMode} existing={activeMode==="notebook"?[]:plannedRows.map(r=>r.name)} notesMode={activeMode==="notebook"} limit={activeMode==="notebook"?60:Math.max(0,Math.min(60-new Set(plannedRows.map(r=>canonicalExercise(r.name).toLowerCase())).size,Math.floor((250-plannedRows.length)/3)))} onClose={()=>setPickerOpen(false)} onAdd={addPickedExercises}/>}
        <div className="editor-actions editor-actions-compact" role="toolbar" aria-label="Workout actions">
          {writingNotes&&<button type="button" className="secondary workout-keyboard-done" onClick={()=>{notesRef.current?.blur();setNotesFocused(false);}}>Done typing</button>}
          {!writingNotes&&<button type="button" className="secondary personal-more-button" aria-label="More workout actions" aria-expanded={workoutMenu} onClick={()=>setWorkoutMenu(v=>!v)}>···</button>}
          <div className={"workout-secondary-actions"+(workoutMenu?" is-open":"")} onClick={()=>setWorkoutMenu(false)}>
          <button
            onClick={togglePb}
            className="secondary"
            aria-label={isPb ? "Unmark Personal Best" : "Mark Personal Best"}
            title={isPb ? "Unmark PB" : "Mark PB"}
            style={{
              flex: "0 0 auto",
              width: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isPb ? "var(--accent)" : undefined,
              color: isPb ? "white" : undefined,
            }}
          >
            PB
          </button>

          <button onClick={copyToClipboard} className="secondary">
            Copy
          </button>
          <button disabled={demoMode} onClick={pasteFromClipboard} className="secondary">
            Paste
          </button>

          <button onClick={deleteActiveWorkout} className="secondary">
            Delete
          </button>

          <button disabled={demoMode} onClick={handleShare} className="secondary">
            Share
          </button>

          </div>
          <button onClick={()=>{handleSave();notesRef.current?.blur();setNotesFocused(false);}} className="primary workout-save-button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
