"use client";

export default function ProgramFeaturedStyles() {
  return (
    <style jsx global>{`
      .programs-page{overflow-x:hidden}
      .programs-hero-visual{position:relative;overflow:hidden;min-height:380px;display:flex;align-items:stretch;isolation:isolate}
      .programs-hero-image{position:absolute;inset:0;background-image:linear-gradient(90deg,rgba(8,11,16,.96) 0%,rgba(8,11,16,.82) 42%,rgba(8,11,16,.18) 100%),url('/empty-gym.png');background-size:cover;background-position:center 55%;z-index:-1}
      .programs-hero-content{max-width:680px;padding:68px 34px 60px}
      .programs-hero-content h1{max-width:620px}
      .programs-hero-content p{max-width:620px}
      .programs-hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
      .programs-browse-cta{background:rgba(255,255,255,.1)!important;color:inherit!important;border:1px solid rgba(255,255,255,.14)}
      .program-featured{max-width:1100px;margin:0 auto;padding:34px 20px 8px;min-width:0}
      .program-section-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:17px}
      .program-featured h2{font-size:clamp(26px,4vw,34px);line-height:1.1;margin:8px 0 9px;letter-spacing:-.03em}
      .program-featured>p,.program-section-heading p{max-width:700px;line-height:1.6;opacity:.68;margin:0;font-size:14px}
      .program-section-link{flex:none;color:var(--accent,#ff5722)!important;text-decoration:none!important;font-size:12px;font-weight:850;white-space:nowrap;padding-bottom:4px}
      .program-featured-row{display:flex;gap:12px;overflow-x:auto;padding:2px 2px 12px;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
      .program-featured-row::-webkit-scrollbar{display:none}
      .program-featured-card{scroll-snap-align:start;flex:0 0 230px;min-width:230px;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:17px;background:rgba(255,255,255,.045);color:var(--text,#f5f7fa)!important;text-decoration:none!important;box-shadow:0 9px 28px rgba(0,0,0,.12);transition:transform .15s ease,border-color .15s ease}
      .program-featured-card:link,.program-featured-card:visited,.program-featured-card:hover,.program-featured-card:active{color:var(--text,#f5f7fa)!important;text-decoration:none!important}
      .program-featured-card:hover{transform:translateY(-2px);border-color:var(--accent,#ff5722)}
      .program-featured-image{height:94px;display:block;background:linear-gradient(135deg,#3f4b5c,#161b23);position:relative}
      .program-featured-image:after{content:"";position:absolute;inset:0;background:linear-gradient(145deg,transparent 35%,rgba(255,87,34,.35),transparent 68%),radial-gradient(circle at 78% 20%,rgba(255,255,255,.18),transparent 35%)}
      .program-featured-card:nth-child(3n+2) .program-featured-image{background:linear-gradient(135deg,#76513e,#241a17)}
      .program-featured-card:nth-child(3n+3) .program-featured-image{background:linear-gradient(135deg,#536d65,#182420)}
      .program-featured-card:nth-child(3n+4) .program-featured-image{background:linear-gradient(135deg,#665e82,#211e30)}
      .program-featured-card-body{display:flex;flex-direction:column;min-height:145px;padding:13px 14px 15px;gap:6px}
      .program-featured-card-body>span,.program-featured-card-body>small{display:block;min-width:0;font-size:10px;line-height:1.35;color:var(--muted,#b0b3c0)!important;white-space:normal;overflow-wrap:anywhere}
      .program-featured-card-body>strong{display:block;min-width:0;font-size:16px;line-height:1.22;color:var(--text,#f5f7fa)!important;flex:1;overflow-wrap:anywhere}
      .program-featured-card-body>b{display:block;font-size:11px;line-height:1.3;color:var(--accent,#ff5722)!important;font-weight:850}
      @media(max-width:700px){
        .programs-hero-visual{min-height:350px}
        .programs-hero-image{background-position:center}
        .programs-hero-content{padding:52px 22px 42px}
        .program-section-heading{align-items:flex-start;flex-direction:column;gap:8px}
      }
      @media(max-width:520px){
        .program-featured{padding:28px 20px 6px}
        .program-featured h2{font-size:25px}
        .program-featured-row{margin-right:-20px;padding-right:20px}
        .program-featured-card{flex-basis:216px;min-width:216px}
      }
    `}</style>
  );
}
