"use client";

export default function ProgramFeaturedStyles() {
  return (
    <style jsx global>{`
      .programs-page{overflow-x:hidden}
      .program-featured{max-width:1100px;margin:0 auto;padding:24px 20px 12px;min-width:0}
      .program-featured h2{font-size:clamp(26px,4vw,34px);line-height:1.15;margin:8px 0 10px;letter-spacing:-.025em}
      .program-featured>p{max-width:700px;line-height:1.6;opacity:.68;margin:0;font-size:15px}
      .program-featured-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px;min-width:0}
      .program-featured-card{display:flex;flex-direction:column;gap:8px;min-width:0;min-height:148px;padding:17px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.045);color:var(--text,#f5f7fa)!important;text-decoration:none!important;overflow:hidden;transition:transform .15s ease,border-color .15s ease,background .15s ease}
      .program-featured-card:link,.program-featured-card:visited,.program-featured-card:hover,.program-featured-card:active{color:var(--text,#f5f7fa)!important;text-decoration:none!important}
      .program-featured-card:hover{transform:translateY(-2px);border-color:var(--accent,#ff5722);background:rgba(255,255,255,.07)}
      .program-featured-card:focus-visible{outline:2px solid var(--accent,#ff5722);outline-offset:3px}
      .program-featured-card>span,.program-featured-card>small{display:block;min-width:0;font-size:11px;line-height:1.35;color:var(--muted,#b0b3c0)!important;white-space:normal;overflow-wrap:anywhere}
      .program-featured-card>strong{display:block;min-width:0;font-size:16px;line-height:1.25;color:var(--text,#f5f7fa)!important;flex:1;overflow-wrap:anywhere}
      .program-featured-card>b{display:block;font-size:12px;line-height:1.3;color:var(--accent,#ff5722)!important;font-weight:800}
      .program-browse-links{min-width:0;overflow:hidden}
      .program-browse-links h2{font-size:clamp(25px,4vw,34px);line-height:1.15;letter-spacing:-.025em;overflow-wrap:anywhere}
      .program-browse-grid{min-width:0}
      .program-browse-grid a{min-width:0;overflow-wrap:anywhere}
      @media(max-width:800px){
        .program-featured-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:520px){
        .program-featured{padding:20px 20px 12px}
        .program-featured h2{font-size:25px}
        .program-featured-grid{grid-template-columns:1fr;gap:10px;margin-top:16px}
        .program-featured-card{min-height:0;padding:16px}
        .program-featured-card>strong{font-size:17px}
        .program-browse-links{padding-left:20px;padding-right:20px}
        .program-browse-links h2{font-size:25px}
      }
    `}</style>
  );
}
