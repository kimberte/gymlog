"use client"

import { WorkoutEntry } from "@/lib/storage"
import { useState } from "react"

type Props = {
  date: string
  workout?: WorkoutEntry
  onSave: (date: string, entry: WorkoutEntry) => void
  onClose: () => void
}

export default function WorkoutEditor({
  date,
  workout,
  onSave,
  onClose
}: Props) {
  const [title, setTitle] = useState(workout?.title || "")
  const [description, setDescription] = useState(workout?.description || "")

  function handleSave() {
    onSave(date, {
      title,
      description,
      updatedAt: Date.now()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end">
      <div
        className="w-full max-w-md h-full p-4 bg-[url('/notebook.png')] bg-cover"
      >
        <h2 className="text-xl font-bold mb-2">{date}</h2>

        <input
          className="w-full mb-2 p-2 border"
          placeholder="Workout title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full h-40 p-2 border"
          placeholder="Workout description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex gap-2 mt-4">
          <button
            className="px-4 py-2 bg-black text-white"
            onClick={handleSave}
          >
            Save
          </button>

          <button
            className="px-4 py-2 border"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
