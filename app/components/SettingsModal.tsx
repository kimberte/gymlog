"use client";

import { useRef, useState } from "react";
import {
  exportCSV,
  importCSV,
  downloadTemplateCSV,
} from "../lib/csv";

export default function SettingsModal({
  workouts,
  onClose,
  toast,
}: {
  workouts: Record<string, any>;
  onClose: () => void;
  toast: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleExport() {
    exportCSV(workouts);
    toast("Workouts exported");
  }

  function handleDownloadTemplate() {
    downloadTemplateCSV();
    toast("CSV template downloaded");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setConfirming(true);
  }

  async function handleConfirmImport() {
    if (!pendingFile) return;

    try {
      const updated = await importCSV(workouts, pendingFile);
      Object.keys(updated).forEach((k) => {
        workouts[k] = updated[k];
      });

      toast("Workouts imported");
      setConfirming(false);
      setPendingFile(null);
      onClose();
    } catch {
      toast("Import failed");
    }
  }

  return (
    <div className="overlay">
      <div className="settings">
        <button className="close" onClick={onClose}>
          ✕
        </button>

        <h3>Settings</h3>

        <button onClick={handleExport}>
          Export workouts (CSV)
        </button>

        <button
          style={{
            marginTop: 8,
            fontSize: 13,
            opacity: 0.85,
          }}
          onClick={handleDownloadTemplate}
        >
          Download CSV template
        </button>

        <label style={{ display: "block", marginTop: 16, fontSize: 13 }}>
          Import workouts (CSV)
        </label>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
        />

        {confirming && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              background: "rgba(255,87,33,0.12)",
              fontSize: 13,
            }}
          >
            <strong>Warning</strong>
            <p style={{ margin: "6px 0" }}>
              Importing will overwrite existing workouts for matching dates.
              This cannot be undone.
            </p>

            <button
              style={{
                width: "100%",
                marginTop: 8,
                background: "#FF5721",
                color: "#fff",
                border: "none",
                padding: 10,
                borderRadius: 10,
                cursor: "pointer",
              }}
              onClick={handleConfirmImport}
            >
              Confirm Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
