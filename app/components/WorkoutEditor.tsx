"use client";

import { useEffect, useState } from "react";
import {
  loadWorkout,
  saveWorkout,
  WorkoutEntry,
} from "@/app/lib/storage";

interface Props {
  date: string;
  onClose: () => void;
}

export default function WorkoutEditor({ date, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const existing = loadWorkout(date);
    if (existing) {
      setTitle(existing.title);
      setNotes(existing.notes);
    }
  }, [date]);

  function handleSave() {
    const entry: WorkoutEntry = {
      date,
      title,
      notes,
    };

    saveWorkout(entry);
    onClose();
  }

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "16px",
        border: "1px solid #ccc",
        background: "#fafafa",
      }}
    >
      <h2>{date}</h2>

      <input
        placeholder="Workout title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: "8px" }}
      />

      <textarea
        placeholder="Workout details"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: "100%", height: "120px" }}
      />

      <div style={{ marginTop: "8px" }}>
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose} style={{ marginLeft: "8px" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
