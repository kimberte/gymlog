"use client";

import { useEffect } from "react";

type Props = {
  onSelect: (exercise: { name: string; slug: string }) => void;
  onClose: () => void;
};

export default function ExercisePickerModal({ onSelect, onClose }: Props) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== "gym-log-exercise-selected") return;
      const name = String(data.name ?? "").trim();
      const slug = String(data.slug ?? "").trim();
      if (!name || !slug) return;
      onSelect({ name, slug });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelect]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose an exercise"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          height: "min(88vh, 900px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "var(--background, #0b0f14)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            minHeight: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Choose an exercise</div>
            <div style={{ fontSize: 12, opacity: 0.62 }}>Search the Gym Log exercise database, then add it to this workout.</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close exercise picker"
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
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
          title="Gym Log Exercise Database"
          src="/exercises?picker=1"
          style={{ width: "100%", flex: "1 1 auto", minHeight: 0, border: 0, background: "var(--background, #0b0f14)" }}
        />
      </div>
    </div>
  );
}
