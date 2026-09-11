"use client";

import { useEffect, useState } from "react";

export const GYMLOG_THEME_KEY = "gymlog-program-library-theme";
export type GymLogTheme = "light" | "dark";

function applyTheme(theme: GymLogTheme) {
  document.documentElement.dataset.gymlogTheme = theme;
  try {
    localStorage.setItem(GYMLOG_THEME_KEY, theme);
  } catch {}
  window.dispatchEvent(new CustomEvent("gymlog-theme-change", { detail: theme }));
}

export default function AppearanceControl() {
  const [theme, setTheme] = useState<GymLogTheme>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GYMLOG_THEME_KEY);
      const next: GymLogTheme = saved === "dark" ? "dark" : "light";
      setTheme(next);
      applyTheme(next);
    } catch {
      applyTheme("light");
    }
  }, []);

  const change = (next: GymLogTheme) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="appearance-settings-card" role="group" aria-label="Appearance">
      <div>
        <strong>Appearance</strong>
        <span>Choose light or dark mode. This setting applies across Gym Log.</span>
      </div>
      <div className="appearance-settings-buttons">
        <button type="button" className={theme === "light" ? "active" : ""} onClick={() => change("light")} aria-pressed={theme === "light"}>
          ☀ Light
        </button>
        <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => change("dark")} aria-pressed={theme === "dark"}>
          ☾ Dark
        </button>
      </div>
      <style jsx>{`
        .appearance-settings-card{margin-top:14px;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(0,0,0,.10);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .appearance-settings-card strong{display:block;font-size:13px}
        .appearance-settings-card span{display:block;margin-top:4px;font-size:11px;color:var(--muted,#b0b3c0);line-height:1.45}
        .appearance-settings-buttons{display:flex;gap:6px;flex-shrink:0}
        .appearance-settings-buttons button{border:1px solid rgba(255,255,255,.15);border-radius:9px;padding:8px 10px;background:transparent;color:inherit;font:inherit;font-size:11px;font-weight:800;cursor:pointer}
        .appearance-settings-buttons button.active{background:var(--accent,#ff5721);border-color:var(--accent,#ff5721);color:#111827}
        @media(max-width:520px){.appearance-settings-card{align-items:stretch}.appearance-settings-buttons{width:100%}.appearance-settings-buttons button{flex:1}}
      `}</style>
    </div>
  );
}
