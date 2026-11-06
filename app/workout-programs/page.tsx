import type { Metadata } from "next";
import ProgramLibraryV2 from "./ProgramLibraryV2";
import ProgramThemeShell from "./ProgramThemeShell";
import { PROGRAMS } from "../lib/programs";

export const metadata: Metadata = {
  title: `${PROGRAMS.length}+ Workout Programs & Training Routines | Gym Log`,
  description: `Search and filter ${PROGRAMS.length} workout programs by goal, days per week, experience and equipment. Find a routine and track it with Gym Log.`,
};

export default function WorkoutProgramsPage() {
  return <ProgramThemeShell><ProgramLibraryV2 programs={PROGRAMS} /></ProgramThemeShell>;
}
