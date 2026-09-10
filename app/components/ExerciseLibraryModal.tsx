"use client";

import { useEffect, useState } from "react";

export default function ExerciseLibraryModal() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [open, setOpen] = useState(false);

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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
          right: 16,
          bottom: "calc(18px + env(safe-area-inset-bottom))",
          zIndex: 10050,
          padding: "11px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "var(--accent)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 8px 28px rgba(0,0,0,0.32)",
        }}
      >
        Exercise Library
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
      <div
        style={{
          width: "min(1100px, 100%)",
          height: "min(88vh, 900px)",
          background: "var(--background, #101010)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            minHeight: 54,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Exercise Library</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>Look up an exercise without leaving your workout.</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close exercise library"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              cursor: "pointer",
              fontSize: 18,
              flex: "0 0 auto",
            }}
          >
            ✕
          </button>
        </div>

        <iframe
          title="Gym Log Exercise Library"
          src="/exercises"
          style={{
            width: "100%",
            flex: "1 1 auto",
            minHeight: 0,
            border: 0,
            background: "var(--background, #101010)",
          }}
        />
      </div>
    </div>
  );
}
