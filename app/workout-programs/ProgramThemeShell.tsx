"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "gymlog-program-library-theme";
type Theme = "light" | "dark";

export default function ProgramThemeShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const readTheme = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const next: Theme = saved === "dark" ? "dark" : "light";
        setTheme(next);
        document.documentElement.dataset.gymlogTheme = next;
      } catch {
        setTheme("light");
        document.documentElement.dataset.gymlogTheme = "light";
      }
    };

    readTheme();
    const onThemeChange = (event: Event) => {
      const next = (event as CustomEvent<Theme>).detail;
      if (next === "dark" || next === "light") {
        setTheme(next);
        document.documentElement.dataset.gymlogTheme = next;
      } else {
        readTheme();
      }
    };

    window.addEventListener("gymlog-theme-change", onThemeChange);
    window.addEventListener("storage", readTheme);
    return () => {
      window.removeEventListener("gymlog-theme-change", onThemeChange);
      window.removeEventListener("storage", readTheme);
    };
  }, []);

  return (
    <main className={`programs-page programs-page-${theme}`}>
      {children}
      <style jsx global>{`
        .programs-page {
          --program-bg: #f6f7f9;
          --program-surface: #ffffff;
          --program-surface-soft: #eef1f4;
          --program-border: rgba(15,23,42,.12);
          --program-border-strong: rgba(15,23,42,.20);
          --program-text: #111827;
          --program-muted: #4b5563;
          --program-subtle: #667085;
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
        .programs-page.programs-page-dark .program-empty-v2 { box-shadow: 0 8px 28px rgba(0,0,0,.14); }
        .programs-page .program-featured-card>strong,
        .programs-page .program-featured-card>span,
        .programs-page .program-featured-card>small { color: var(--program-text) !important; }
        .programs-page .program-featured-card>span,
        .programs-page .program-featured-card>small { opacity: .72; }
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
      `}</style>
    </main>
  );
}
