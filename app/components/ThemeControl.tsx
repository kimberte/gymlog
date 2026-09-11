"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "gym-log-theme";
type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("light");
  const [settingsEl, setSettingsEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let saved: Theme = "light";
    try {
      saved = localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch {}
    setTheme(saved);
    applyTheme(saved);

    const findSettings = () => setSettingsEl(document.querySelector<HTMLElement>(".settings"));
    findSettings();
    const observer = new MutationObserver(findSettings);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function changeTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }

  if (!settingsEl) return null;

  return createPortal(
    <div className="theme-setting-row">
      <div>
        <strong>Appearance</strong>
        <span>Choose how Gym Log looks across the app.</span>
      </div>
      <div className="theme-setting-options" role="group" aria-label="Appearance">
        <button type="button" className={theme === "light" ? "active" : ""} onClick={() => changeTheme("light")} aria-pressed={theme === "light"}>☀ Light</button>
        <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => changeTheme("dark")} aria-pressed={theme === "dark"}>☾ Dark</button>
      </div>
    </div>,
    settingsEl
  );
}
