import "./programs.css";
import ProgramThemeSync from "./ProgramThemeSync";

export default function WorkoutProgramsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProgramThemeSync />
      {children}
    </>
  );
}
