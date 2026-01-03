"use client";

import { exportCSV, importCSV, exportTemplateCSV } from "@/app/lib/csv";
import { WorkoutMap } from "@/app/lib/storage";

export default function SettingsModal({
  workouts,
  onClose,
  toast,
}: {
  workouts: WorkoutMap;
  onClose: () => void;
  toast: (msg: string) => void;
}) {
  return (
    <div className="overlay">
      <div className="settings">
        <button className="close" onClick={onClose}>✕</button>
        <h3>Settings</h3>

        <button onClick={() => { exportCSV(workouts); toast("Exported CSV"); }}>
          Export Workouts
        </button>

        <button onClick={() => { exportTemplateCSV(); toast("Template downloaded"); }}>
          Export CSV Template
        </button>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files) {
              importCSV(e.target.files[0]);
              toast("Workouts imported");
            }
          }}
        />
      </div>
    </div>
  );
}
