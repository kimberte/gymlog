// Client-only branded PNG exports. All share paths use the approved GL dumbbell mark and live app typography.

type ShareResult =
  | { kind: "shared" }
  | { kind: "downloaded" }
  | { kind: "unsupported" };

function blobToFile(blob: Blob, filename: string) {
  return new File([blob], filename, { type: blob.type || "image/png" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Pull colors from the live app so export matches theme.
 * - background: prefer CSS vars (--app-bg / --bg), fallback to body backgroundColor, then white.
 * - brand orange: prefer CSS vars (--brand / --accent / --orange), fallback to #ff6a00.
 */
function readThemeColors(): { bg: string; accent: string; text: string; muted: string; border: string } {
  const root = document.documentElement;
  const rootStyle = getComputedStyle(root);
  const bodyStyle = getComputedStyle(document.body);

  const pickVar = (...names: string[]) => {
    for (const n of names) {
      const v = rootStyle.getPropertyValue(n).trim();
      if (v) return v;
    }
    return "";
  };

  const bgVar = pickVar("--app-bg", "--bg", "--background", "--page-bg");
  const bg = bgVar || bodyStyle.backgroundColor || "#ffffff";

  const accentVar = pickVar("--brand", "--accent", "--orange", "--primary");
  const accent = accentVar || "#ff6a00";

  const text=pickVar("--text")||bodyStyle.color||"#fafafa";
  const muted=pickVar("--muted")||text;
  const border=pickVar("--border")||(root.dataset.theme==="light"?"#d9dde4":"#555a66");
  return { bg, accent, text, muted, border };
}

const BRAND_MARK="/gym-log-mark.svg";
const MARK_RATIO=894/353;
const BRAND_URL="gymlogapp.com";
async function shareFont(){
  // Next/font supplies the real Poppins family via the body class.
  const family=getComputedStyle(document.body).fontFamily||'"Poppins", sans-serif';
  if(document.fonts){try{await Promise.all([400,500,600].map(w=>document.fonts.load(w+" 48px "+family,"Gym Log 123")));await document.fonts.ready;}catch{}}
  return family;
}
async function brandLogo(){try{return await loadImage(BRAND_MARK);}catch{return null;}}
function font(ctx:CanvasRenderingContext2D,size:number,weight:number,family:string){ctx.font=weight+" "+size+"px "+family;}
function drawMark(ctx:CanvasRenderingContext2D,logo:HTMLImageElement|null,x:number,y:number,h:number,family:string,accent:string){
  const w=h*MARK_RATIO;
  if(logo)ctx.drawImage(logo,x,y,w,h);
  else{ctx.save();font(ctx,h*.85,600,family);ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=accent;ctx.fillText("GL",x+w/2,y+h/2);ctx.restore();}
  return w;
}
function drawLockup(ctx:CanvasRenderingContext2D,logo:HTMLImageElement|null,cx:number,cy:number,h:number,family:string,theme:ReturnType<typeof readThemeColors>){
  ctx.save();font(ctx,h*.78,600,family);ctx.textAlign="left";ctx.textBaseline="middle";
  const gap=h*.3,markW=h*MARK_RATIO,wordW=ctx.measureText("Gym Log").width;
  const x=cx-(markW+gap+wordW)/2;
  drawMark(ctx,logo,x,cy-h/2,h,family,theme.accent);
  ctx.fillStyle=theme.text;ctx.fillText("Gym Log",x+markW+gap,cy);
  ctx.restore();
}
async function renderFinalPngBlob(dataUrl:string){
  const [base,family,logo]=await Promise.all([loadImage(dataUrl),shareFont(),brandLogo()]);
  const baseW=base.naturalWidth||base.width,baseH=base.naturalHeight||base.height;
  const theme=readThemeColors(),markH=Math.max(18,Math.min(62,baseW*.065));
  const headerH=Math.round(markH*2.4),footerH=Math.round(markH*1.25);
  const canvas=document.createElement("canvas");canvas.width=baseW;canvas.height=headerH+baseH+footerH;
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas not supported");
  ctx.fillStyle=theme.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
  drawLockup(ctx,logo,baseW/2,headerH/2,markH,family,theme);
  ctx.fillStyle=theme.accent;ctx.fillRect(0,headerH-3,baseW,3);
  ctx.drawImage(base,0,headerH);
  ctx.strokeStyle=theme.border;ctx.beginPath();ctx.moveTo(0,headerH+baseH);ctx.lineTo(baseW,headerH+baseH);ctx.stroke();
  font(ctx,Math.max(12,markH*.5),500,family);ctx.fillStyle=theme.muted;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(BRAND_URL,baseW/2,headerH+baseH+footerH/2);
  return pngBlob(canvas);
}
function pngBlob(canvas:HTMLCanvasElement):Promise<Blob>{return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Failed to encode PNG")),"image/png"));}

async function loadVideoFrame(
  src: string,
  atSec: number = 0.1
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = src;

    const cleanup = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };

    video.addEventListener("error", () => {
      cleanup();
      reject(new Error("Failed to load video"));
    });

    video.addEventListener("loadedmetadata", () => {
      const target = Math.min(
        Math.max(atSec, 0),
        Math.max(0, (video.duration || 0) - 0.05)
      );
      try {
        video.currentTime = target;
      } catch {
        // Some browsers block setting currentTime until canplay
      }
    });

    video.addEventListener("seeked", () => {
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;
      if (!w || !h) {
        cleanup();
        reject(new Error("Invalid video dimensions"));
        return;
      }
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      cleanup();
      resolve(c);
    });

    // Kick load
    video.load();
  });
}

function drawWrapped(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines:number,preserveNewlines:boolean){
 const paragraphs=preserveNewlines?String(text).replace(/\r\n?/g,"\n").split("\n"):[String(text).replace(/\s+/g," ")];
 const lines:string[]=[];
 for(const paragraph of paragraphs){
   if(!paragraph.trim()){lines.push("");continue;}
   let line="";
   for(const word of paragraph.trim().split(/\s+/)){
     if(line&&ctx.measureText(line+" "+word).width>maxWidth){lines.push(line);line="";}
     if(ctx.measureText(word).width<=maxWidth){line=line?line+" "+word:word;continue;}
     let chunk="";
     for(const char of word){if(chunk&&ctx.measureText(chunk+char).width>maxWidth){lines.push(chunk);chunk="";}chunk+=char;}
     line=chunk;
   }
   if(line)lines.push(line);
 }
 const visible=lines.slice(0,Math.max(0,maxLines));
 if(lines.length>visible.length&&visible.length){let last=visible[visible.length-1];while(last&&ctx.measureText(last+"…").width>maxWidth)last=last.slice(0,-1);visible[visible.length-1]=last.trimEnd()+"…";}
 visible.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight,maxWidth));return visible.length;
}
function wrapTextWithEllipsis(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines:number){return drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines,false);}
function wrapTextPreserveNewlinesWithEllipsis(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines:number){return drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines,true);}

export async function shareWorkoutVerticalImage(options: {
  filename:string;dateLabel:string;title:string;notes?:string;
  media?:{kind:"image"|"video";url:string}|null;
  status?:"Completed"|"Scheduled"|"Workout log";
}):Promise<ShareResult>{
 const {filename,dateLabel,title,notes,media,status="Workout log"}=options;
 const theme=readThemeColors(),[family,logo]=await Promise.all([shareFont(),brandLogo()]);
 const W=1080,H=1920,pad=72,headerH=188,heroH=media?.url?760:400,heroY=headerH,bodyY=heroY+heroH,footerY=H-192;
 const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas not supported");
 ctx.fillStyle=theme.bg;ctx.fillRect(0,0,W,H);
 drawLockup(ctx,logo,W/2,headerH/2,72,family,theme);
 ctx.fillStyle=theme.accent;ctx.fillRect(0,headerH-5,W,5);
 const cover=(img:CanvasImageSource,iw:number,ih:number)=>{if(!iw||!ih)throw Error("Invalid image");const scale=Math.max(W/iw,heroH/ih),sw=W/scale,sh=heroH/scale;ctx.drawImage(img,(iw-sw)/2,(ih-sh)/2,sw,sh,0,heroY,W,heroH);};
 let shown=false;
 if(media?.url){try{if(media.kind==="image"){const img=await loadImage(media.url);cover(img,img.naturalWidth,img.naturalHeight);}else{const frame=await loadVideoFrame(media.url,.1);cover(frame,frame.width,frame.height);}shown=true;}catch{}}
 if(!shown){try{const img=await loadImage("/empty-gym.png");cover(img,img.naturalWidth,img.naturalHeight);shown=true;}catch{}}
 if(!shown){ctx.fillStyle="#191c24";ctx.fillRect(0,heroY,W,heroH);const mh=100;drawMark(ctx,logo,(W-mh*MARK_RATIO)/2,heroY+(heroH-mh)/2,mh,family,theme.accent);}
 ctx.fillStyle=theme.accent;ctx.fillRect(0,bodyY,W,5);
 ctx.textAlign="left";ctx.textBaseline="alphabetic";
 let y=bodyY+62;
 font(ctx,30,500,family);ctx.fillStyle=theme.muted;
 ctx.fillText(status.toUpperCase()+"  ·  "+dateLabel,pad,y,W-2*pad);
 y+=80;font(ctx,66,600,family);ctx.fillStyle=theme.text;
 const titleLines=wrapTextWithEllipsis(ctx,title||"Workout",pad,y,W-pad*2,78,2);
 y+=Math.max(1,titleLines)*78+18;
 font(ctx,37,400,family);ctx.fillStyle=theme.text;
 const noteText=String(notes||"").replace(/\r\n?/g,"\n").replace(/\[\[structured:[^\]]*\]\]/g,"").trim().replace(/\n{3,}/g,"\n\n")||"";
 const lineH=48,available=footerY-40-y,maxLines=Math.max(0,Math.floor(available/lineH)+1);
 if(noteText&&maxLines>0)wrapTextPreserveNewlinesWithEllipsis(ctx,noteText,pad,y,W-pad*2,lineH,maxLines);
 ctx.strokeStyle=theme.border;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad,footerY);ctx.lineTo(W-pad,footerY);ctx.stroke();
 const logoH=48;drawMark(ctx,logo,pad,footerY+50,logoH,family,theme.accent);
 ctx.fillStyle=theme.text;font(ctx,37,600,family);ctx.fillText("Track your training.",pad+logoH*MARK_RATIO+26,footerY+87,W-pad*2-logoH*MARK_RATIO-26);
 font(ctx,29,500,family);ctx.fillStyle=theme.muted;ctx.fillText(BRAND_URL,pad+logoH*MARK_RATIO+26,footerY+132);
 const blob=await pngBlob(canvas);
 return shareOrDownload(blob,filename,"Gym Log");
}
async function shareOrDownload(blob:Blob,filename:string,title="Gym Log",text=""):Promise<ShareResult>{
 const file=blobToFile(blob,filename);
 try{if(typeof navigator.share==="function"&&typeof navigator.canShare==="function"&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title,text});return {kind:"shared"};}}
 catch(err){if(err instanceof DOMException&&err.name==="AbortError")return {kind:"unsupported"};}
 downloadBlob(blob,filename);return {kind:"downloaded"};
}

export async function shareNodeAsPng(options: {
  node: HTMLElement;
  filename: string;
  title?: string;
  text?: string;
}): Promise<ShareResult> {
  const { node, filename, title, text } = options;

  const mod = await import("html-to-image");
  const { bg } = readThemeColors();

  // Wait for the same app font used by the live calendar before capturing it.
  await shareFont();
  // Hide certain UI only during export
  node.classList.add("exporting");

  let dataUrl: string;
  try {
    dataUrl = await mod.toPng(node, {
      cacheBust: true,
      backgroundColor: bg, // match app background
      pixelRatio: 2,
    });
  } finally {
    node.classList.remove("exporting");
  }

  const blob = await renderFinalPngBlob(dataUrl);

  return shareOrDownload(blob,filename,title||"Gym Log",text||"");
}
