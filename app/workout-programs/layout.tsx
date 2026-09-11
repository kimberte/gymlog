import "./programs.css";
import "./programs-light.css";
import ProgramThemeSync from "./ProgramThemeSync";

export default function WorkoutProgramsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProgramThemeSync />
      {children}
    </>
  );
}
