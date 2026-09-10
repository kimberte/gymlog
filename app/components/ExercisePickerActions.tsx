"use client";

export default function ExercisePickerActions({ name, slug }: { name: string; slug: string }) {
  function addToNotebook() {
    window.parent.postMessage(
      { type: "gym-log-exercise-selected", name, slug },
      window.location.origin
    );
  }

  return (
    <div style={{ marginTop: 22, padding: 18, borderRadius: 16, background: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.1)" }}>
      <strong style={{ display: "block", fontSize: 16 }}>Using this exercise?</strong>
      <p style={{ margin: "6px 0 13px", fontSize: 13, lineHeight: 1.5, opacity: .68 }}>
        Add the exercise name to your notebook. You can then type your sets, reps, weight and notes however you like.
      </p>
      <button
        type="button"
        onClick={addToNotebook}
        style={{ width: "100%", padding: "12px 15px", border: 0, borderRadius: 12, background: "var(--accent,#ff5722)", color: "#111827", font: "inherit", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
      >
        + Add to this workout
      </button>
    </div>
  );
}
