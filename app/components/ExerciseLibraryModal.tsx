"use client";

import { useEffect, useRef, useState } from "react";

export default function ExerciseLibraryModal() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const sync = () => {
      const visible = Boolean(document.querySelector(".editor-full"));
      setEditorOpen(visible);
      if (!visible) setOpen(false);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== "gym-log-exercise-selected") return;
      const name = String(data.name ?? "").trim();
      if (!name) return;
      const textarea = document.querySelector<HTMLTextAreaElement>("textarea.editor-notes");
      if (!textarea) return;
      const current = textarea.value.trimEnd();
      const next = current ? `${current}\n\n${name}\n` : `${name}\n`;
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      if (setter) setter.call(textarea, next);
      else textarea.value = next;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.focus();
      textarea.setSelectionRange(next.length, next.length);
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("message", onMessage);
    };
  }, [open]);

  function handleIframeLoad() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      try {
        const url = new URL(href, window.location.origin);
        // Any link back to the main workout/calendar should close the modal
        // instead of loading the calendar inside the exercise-library iframe.
        if (url.origin === window.location.origin && url.pathname === "/") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
      } catch {
        // Ignore malformed/non-navigation hrefs.
      }
    };

    doc.addEventListener("click", onClick);
    iframeRef.current.dataset.bound = "true";
    (iframeRef.current as HTMLIFrameElement & { __gymLogCleanup?: () => void }).__gymLogCleanup = () => {
      doc.removeEventListener("click", onClick);
    };
  }

  useEffect(() => {
    return () => {
      const iframe = iframeRef.current as (HTMLIFrameElement & { __gymLogCleanup?: () => void }) | null;
      iframe?.__gymLogCleanup?.();
    };
  }, [open]);

  if (!editorOpen) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open exercise library"
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10050,
          padding: "12px 9px",
          borderRadius: "12px 0 0 12px",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRight: 0,
          background: "var(--accent)",
          color: "#111827",
          fontSize: 12,
          fontWeight: 900,
          cursor: "pointer",
          boxShadow: "0 8px 28px rgba(0,0,0,0.3)",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        Exercises
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Exercise Library"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10060,
        background: "rgba(0,0,0,0.78)",
        padding: "max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "min(1100px, 100%)", height: "min(88vh, 900px)", background: "var(--background, #101010)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
        <div style={{ minHeight: 54, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Exercise Library</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>Learn how to perform an exercise first. Add it to your notebook only when you want to.</div>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close exercise library" style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "inherit", cursor: "pointer", fontSize: 18, flex: "0 0 auto" }}>✕</button>
        </div>
        <iframe ref={iframeRef} onLoad={handleIframeLoad} title="Gym Log Exercise Library" src="/exercises?picker=1" style={{ width: "100%", flex: "1 1 auto", minHeight: 0, border: 0, background: "var(--background, #101010)" }} />
      </div>
    </div>
  );
}
