"use client"

import { useEffect, useState } from "react"
import WorkoutCalendar from "@/components/WorkoutCalendar"
import WorkoutEditor from "@/components/WorkoutEditor"
import {
  loadWorkouts,
  saveWorkouts,
  WorkoutMap,
  WorkoutEntry
} from "@/lib/storage"

export default function Home() {
  const [workouts, setWorkouts] = useState<WorkoutMap>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    setWorkouts(loadWorkouts())
  }, [])

  function handleSave(date: string, entry: WorkoutEntry) {
    const updated = { ...workouts, [date]: entry }
    setWorkouts(updated)
    saveWorkouts(updated)
    setSelectedDate(null)
  }

  return (
    <main className="p-4">
      <WorkoutCalendar
        workouts={workouts}
        onDateClick={setSelectedDate}
      />

      {selectedDate && (
        <WorkoutEditor
          date={selectedDate}
          workout={workouts[selectedDate]}
          onSave={handleSave}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </main>
  )
}
