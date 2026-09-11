"use client";

import { useEffect } from "react";

const STORAGE_KEY = "gym-log-theme";

export default function ProgramThemeSync() {
  useEffect(() => {
    const apply = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const next = saved === "dark" ? "dark" : "light";
        document.documentElement.dataset.theme = next;
        document.documentElement.dataset.gymlogTheme = next;
        document.documentElement.style.colorScheme = next;
      } catch {
        document.documentElement.dataset.theme = "light";
        document.documentElement.dataset.gymlogTheme = "light";
      }
    };
    apply();
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<"light" | "dark">).detail;
      if (next === "dark" || next === "light") {
        document.documentElement.dataset.theme = next;
        document.documentElement.dataset.gymlogTheme = next;
        document.documentElement.style.colorScheme = next;
      } else apply();
    };
    window.addEventListener("gymlog-theme-change", onChange);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener("gymlog-theme-change", onChange);
      window.removeEventListener("storage", apply);
    };
  }, []);

  return null;
}
