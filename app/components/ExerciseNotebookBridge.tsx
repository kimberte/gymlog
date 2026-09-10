"use client";

import { useEffect, useState } from "react";
import ExercisePickerModal from "./ExercisePickerModal";

type ExerciseSelection = { name: string; slug: string };

function setReactTextareaValue(element: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

export default function ExerciseNotebookBridge() {
  const [notesElement, setNotesElement] = useState<HTMLTextAreaElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const findNotes = () => {
      const next = document.querySelector<HTMLTextAreaElement>("textarea.editor-notes");
      setNotesElement((current) => (current === next ? current : next));
    };

    findNotes();
    const observer = new MutationObserver(findNotes);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function addExercise(exercise: ExerciseSelection) {
    const textarea = notesElement || document.querySelector<HTMLTextAreaElement>("textarea.editor-notes");
    if (!textarea) return;

    const current = textarea.value.trimEnd();
    const next = current ? `${current}\n\n${exercise.name}\n` : `${exercise.name}\n`;
    setReactTextareaValue(textarea, next);
    textarea.focus();
    textarea.setSelectionRange(next.length, next.length);
    setPickerOpen(false);
  }

  if (!notesElement) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label="Add exercise from exercise database"
        style={{
          position: "fixed",
          right: 16,
          bottom: "calc(76px + env(safe-area-inset-bottom))",
          zIndex: 9000,
          padding: "10px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "var(--accent, #ff5722)",
          color: "#111827",
          fontSize: 13,
          fontWeight: 800,
          boxShadow: "0 8px 28px rgba(0,0,0,0.32)",
          cursor: "pointer",
        }}
      >
        ＋ Exercise
      </button>

      {pickerOpen ? (
        <ExercisePickerModal
          onSelect={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </>
  );
}
