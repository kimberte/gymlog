"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "gymlog-program-library-theme";

type Theme = "light" | "dark";

export default function ProgramThemeShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  return (
    <main className={`programs-page programs-page-${theme}`}>
      <div className="program-theme-toggle-wrap">
        <div className="program-theme-toggle" role="group" aria-label="Workout program appearance">
          <span className="program-theme-label">Appearance</span>
          <button
            type="button"
            className={theme === "light" ? "active" : ""}
            onClick={() => setTheme("light")}
            aria-pressed={theme === "light"}
          >
            <span aria-hidden="true">☀</span> Light
          </button>
          <button
            type="button"
            className={theme === "dark" ? "active" : ""}
            onClick={() => setTheme("dark")}
            aria-pressed={theme === "dark"}
          >
            <span aria-hidden="true">☾</span> Dark
          </button>
        </div>
      </div>
      {children}
      <style jsx global>{`
        .programs-page {
          --program-bg: #f6f7f9;
          --program-surface: #ffffff;
          --program-surface-soft: #f0f2f5;
          --program-border: rgba(15,23,42,.11);
          --program-border-strong: rgba(15,23,42,.17);
          --program-text: #111827;
          --program-muted: #5f6878;
          --program-subtle: #7b8493;
          --program-accent: #ff5722;
          min-height: 100vh;
          background: var(--program-bg);
          color: var(--program-text);
          transition: background .2s ease, color .2s ease;
        }
        .programs-page.programs-page-dark {
          --program-bg: #0d0f12;
          --program-surface: #15181d;
          --program-surface-soft: #1b1f25;
          --program-border: rgba(255,255,255,.10);
          --program-border-strong: rgba(255,255,255,.17);
          --program-text: #f5f7fa;
          --program-muted: #b0b3c0;
          --program-subtle: #8d93a0;
        }
        .programs-page .programs-nav,
        .programs-page .programs-hero,
        .programs-page .program-featured,
        .programs-page .program-browse-links,
        .programs-page .program-library-v2 { color: var(--program-text); }
        .programs-page .programs-nav { border-bottom-color: var(--program-border) !important; }
        .programs-page .programs-brand,
        .programs-page .programs-back { color: var(--program-text) !important; }
        .programs-page .programs-hero p,
        .programs-page .program-featured>p,
        .programs-page .program-browse-links>p,
        .programs-page .program-library-heading p { color: var(--program-muted); opacity: 1; }
        .programs-page .program-featured-card,
        .programs-page .program-browse-grid a,
        .programs-page .program-search-panel,
        .programs-page .program-filter-grid,
        .programs-page .program-card-v2,
        .programs-page .program-empty-v2 {
          border-color: var(--program-border) !important;
          background: var(--program-surface) !important;
          color: var(--program-text) !important;
          box-shadow: 0 8px 28px rgba(15,23,42,.06);
        }
        .programs-page.programs-page-dark .program-featured-card,
        .programs-page.programs-page-dark .program-browse-grid a,
        .programs-page.programs-page-dark .program-search-panel,
        .programs-page.programs-page-dark .program-filter-grid,
        .programs-page.programs-page-dark .program-card-v2,
        .programs-page.programs-page-dark .program-empty-v2 {
          box-shadow: 0 8px 28px rgba(0,0,0,.14);
        }
        .programs-page .program-featured-card>strong,
        .programs-page .program-featured-card>span,
        .programs-page .program-featured-card>small { color: var(--program-text) !important; }
        .programs-page .program-featured-card>span,
        .programs-page .program-featured-card>small { opacity: .62; }
        .programs-page .program-featured-card>b,
        .programs-page .program-card-track strong { color: var(--program-accent) !important; }
        .programs-page .program-search-box,
        .programs-page .program-filter-grid select,
        .programs-page .program-clear-button,
        .programs-page .program-quick-searches button,
        .programs-page .program-card-days,
        .programs-page .program-days,
        .programs-page .program-card-meta-v2 span,
        .programs-page .program-results-toolbar span {
          border-color: var(--program-border) !important;
          background: var(--program-surface-soft) !important;
          color: var(--program-text) !important;
        }
        .programs-page .program-filter-grid label,
        .programs-page .program-results-toolbar,
        .programs-page .program-quick-searches,
        .programs-page .program-card-track span { color: var(--program-muted); }
        .programs-page .program-search-box input { color: var(--program-text); }
        .programs-page .program-search-box input::placeholder { color: var(--program-subtle); opacity: 1; }
        .programs-page .program-card-v2 p { color: var(--program-muted); opacity: 1; }
        .programs-page .program-card-v2:hover,
        .programs-page .program-featured-card:hover { border-color: rgba(255,87,34,.55) !important; }
        .programs-page .programs-back[style] { background: var(--program-surface-soft) !important; }
        .programs-page .program-theme-toggle-wrap {
          position: absolute;
          top: 14px;
          right: 20px;
          z-index: 20;
        }
        .programs-page .program-theme-toggle {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 4px;
          border: 1px solid var(--program-border);
          border-radius: 999px;
          background: var(--program-surface);
          box-shadow: 0 5px 18px rgba(15,23,42,.08);
          font-size: 11px;
        }
        .programs-page.programs-page-dark .program-theme-toggle { box-shadow: 0 5px 18px rgba(0,0,0,.18); }
        .programs-page .program-theme-label { padding: 0 6px 0 8px; color: var(--program-muted); font-weight: 700; }
        .programs-page .program-theme-toggle button {
          border: 0;
          border-radius: 999px;
          padding: 7px 10px;
          background: transparent;
          color: var(--program-muted);
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition: background .15s ease, color .15s ease;
        }
        .programs-page .program-theme-toggle button.active {
          background: var(--program-text);
          color: var(--program-bg);
        }
        .programs-page .program-theme-toggle button:hover { color: var(--program-text); }
        @media(max-width:650px) {
          .programs-page .program-theme-toggle-wrap { top: 10px; right: 12px; }
          .programs-page .program-theme-label { display: none; }
          .programs-page .program-theme-toggle button { padding: 7px 9px; }
        }
      `}</style>
    </main>
  );
}
