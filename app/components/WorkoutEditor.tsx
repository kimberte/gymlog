"use client";

import { useState } from "react";
import { WorkoutMap } from "@/app/lib/storage";

export default function WorkoutEditor({
  date,
  workouts,
  setWorkouts,
  onClose,
  toast,
}: {
  date: string;
  workouts: WorkoutMap;
  setWorkouts: (w: WorkoutMap) => void;
  onClose: () => void;
  toast: (msg: string) => void;
}) {
  const existing = workouts[date];

  const [title, setTitle] = useState(existing?.title || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  function save() {
    setWorkouts({
      ...workouts,
      [date]: { title, notes },
    });
    toast("Workout saved");
    onClose();
  }

  function copy() {
    navigator.clipboard.writeText(JSON.stringify({ title, notes }));
    toast("Workout copied");
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      setTitle(data.title || "");
      setNotes(data.notes || "");
      toast("Workout pasted");
    } catch {}
  }

  function deleteWorkout() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    const updated = { ...workouts };
    delete updated[date];

    setWorkouts(updated);
    toast("Workout deleted");
    onClose();
  }

  return (
    <div className="overlay">
      <div className="editor editor-full">
        <button className="close" onClick={onClose}>✕</button>

        <div className="editor-header">
          <div className="editor-date">{formattedDate}</div>

          <input
            className="editor-title"
            placeholder="Workout title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <textarea
          className="editor-notes"
          placeholder="Workout notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="editor-actions">
          <button className="secondary" onClick={copy}>Copy</button>
          <button className="secondary" onClick={paste}>Paste</button>
          <button
            className={`secondary danger`}
            onClick={deleteWorkout}
          >
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
          <button className="primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
