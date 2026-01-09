"use client";

import { Settings, saveSettings } from "@/app/lib/storage";

export default function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
}) {
  function update(partial: Partial<Settings>) {
    const next = { ...settings, ...partial };
    saveSettings(next);
    onChange(next);
    const theme = (next as any).theme;
    if (typeof theme === "string") {
      document.body.dataset.theme = theme;
    }

  }

  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => update({ theme: settings.theme === "light" ? "dark" : "light" })}>
        Toggle Theme
      </button>

      <button onClick={() => update({ view: settings.view === "month" ? "week" : "month" })}>
        Toggle View
      </button>

      <button onClick={() => update({ weekStart: settings.weekStart === "sunday" ? "monday" : "sunday" })}>
        Week Starts: {settings.weekStart}
      </button>
    </div>
  );
}
