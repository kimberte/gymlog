"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import { WorkoutMap } from "@/lib/storage"

type Props = {
  workouts: WorkoutMap
  onDateClick: (date: string) => void
}

export default function WorkoutCalendar({ workouts, onDateClick }: Props) {
  const events = Object.entries(workouts).map(([date, workout]) => ({
    id: date,
    title: workout.title,
    start: date
  }))

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek"
      }}
      events={events}
      dateClick={(info) => onDateClick(info.dateStr)}
      height="auto"
    />
  )
}
	