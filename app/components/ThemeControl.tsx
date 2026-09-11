"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "gym-log-theme";
type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.gymlogTheme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("light");
  const [settingsSlot, setSettingsSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let saved: Theme = "light";
    try {
      saved = localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch {}
    setTheme(saved);
    applyTheme(saved);

    const ensureSettingsSlot = () => {
      const settings = document.querySelector<HTMLElement>(".settings");
      if (!settings) {
        setSettingsSlot(null);
        return;
      }

      let slot = settings.querySelector<HTMLElement>(".settings-appearance-slot");
      if (!slot) {
        const links = Array.from(settings.querySelectorAll<HTMLAnchorElement>("a"));
        const legalLink = links.find((link) => /terms|privacy/i.test(link.textContent || ""));

        slot = document.createElement("div");
        slot.className = "settings-appearance-slot";

        if (legalLink?.parentElement) {
          legalLink.parentElement.insertBefore(slot, legalLink);
        } else {
          settings.appendChild(slot);
        }
      }

      setSettingsSlot(slot);
    };

    ensureSettingsSlot();
    const observer = new MutationObserver(ensureSettingsSlot);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      setSettingsSlot(null);
      document.querySelector(".settings-appearance-slot")?.remove();
    };
  }, []);

  function changeTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    window.dispatchEvent(new CustomEvent("gymlog-theme-change", { detail: next }));
  }

  if (!settingsSlot) return null;

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
    settingsSlot
  );
}
