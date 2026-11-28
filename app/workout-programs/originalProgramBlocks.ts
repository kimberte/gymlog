import type {SpecificProgram} from "./specificPrograms";
import {writePrescription,type SetTarget} from "../lib/structuredCoaching";
type Movement=[string,number,string,number,string?];
type Block={slug:string;name:string;category:string;days:number;level:string;goal:string;equipment:string;duration:string;progression:string;sessions:{focus:string;offset:number;ex:Movement[]}[]};
const blocks:Block[]=[
  {
    "slug": "gym-log-beginner",
    "name": "Gym Log Beginner Program",
    "category": "Gym Log Originals",
    "days": 3,
    "level": "Beginner",
    "goal": "Foundational strength and muscle",
    "equipment": "Full gym",
    "duration": "4 weeks · 12 sessions · about 35–50 minutes per session",
    "progression": "Weeks 1–3: learn the movements, then add reps within the range while maintaining the prescribed effort. Increase weight only once all working sets reach the top of the range with good form. Week 4 reduces sets and effort; repeat or progress after recovery.",
    "sessions": [
      {
        "focus": "Full body A",
        "offset": 0,
        "ex": [
          [
            "Leg press",
            2,
            "8-12",
            120
          ],
          [
            "Dumbbell bench press",
            2,
            "8-12",
            120
          ],
          [
            "Cable row (seated)",
            2,
            "10-12",
            90
          ],
          [
            "Dumbbell Romanian deadlift",
            2,
            "8-10",
            120
          ],
          [
            "Dead bug",
            2,
            "8-10",
            45,
            "Per side."
          ]
        ]
      },
      {
        "focus": "Full body B",
        "offset": 2,
        "ex": [
          [
            "Goblet squat",
            2,
            "8-12",
            120
          ],
          [
            "Cable lat pulldown",
            2,
            "8-12",
            90
          ],
          [
            "Dumbbell shoulder press",
            2,
            "8-12",
            90
          ],
          [
            "Glute bridge",
            2,
            "10-15",
            90
          ],
          [
            "Plank",
            2,
            "20-40 sec",
            45
          ]
        ]
      },
      {
        "focus": "Full body C",
        "offset": 4,
        "ex": [
          [
            "Leg press",
            2,
            "10-12",
            120
          ],
          [
            "Machine chest press",
            2,
            "8-12",
            120
          ],
          [
            "Chest-supported dumbbell row",
            2,
            "10-12",
            90
          ],
          [
            "Seated leg curl",
            2,
            "10-15",
            75
          ],
          [
            "Calf raise (standing)",
            2,
            "12-15",
            60
          ]
        ]
      }
    ]
  },
  {
    "slug": "gym-log-2-day-dumbbell-foundations",
    "name": "Gym Log 2-Day Dumbbell Foundations",
    "category": "Gym Log Originals",
    "days": 2,
    "level": "Beginner",
    "goal": "Strength and muscle with limited equipment and time",
    "equipment": "Dumbbells and floor space",
    "duration": "4 weeks · 8 sessions · about 30–40 minutes per session",
    "progression": "Leave at least two days between sessions. Add reps before load in weeks 1–3. Use a lighter dumbbell or shorter range when needed to maintain control. Week 4 reduces sets and effort. Choose a load that leaves the prescribed reps in reserve; no fixed weight is assumed.",
    "sessions": [
      {
        "focus": "Full body A · squat and push",
        "offset": 0,
        "ex": [
          [
            "Dumbbell goblet squat",
            3,
            "8-12",
            120
          ],
          [
            "Push-up",
            2,
            "6-12",
            90,
            "Use incline push-ups if needed."
          ],
          [
            "Single-arm dumbbell row",
            3,
            "8-12",
            90,
            "Per side."
          ],
          [
            "Dumbbell Romanian deadlift",
            2,
            "8-12",
            120
          ],
          [
            "Dead bug",
            2,
            "8-10",
            45,
            "Per side."
          ]
        ]
      },
      {
        "focus": "Full body B · hinge and press",
        "offset": 3,
        "ex": [
          [
            "Dumbbell Romanian deadlift",
            3,
            "8-12",
            120
          ],
          [
            "Reverse lunge (dumbbell)",
            2,
            "8-10",
            90,
            "Per leg."
          ],
          [
            "Dumbbell shoulder press (standing)",
            2,
            "8-12",
            90
          ],
          [
            "Dumbbell row",
            2,
            "10-12",
            90
          ],
          [
            "Side plank",
            2,
            "20-40 sec",
            45,
            "Per side."
          ]
        ]
      }
    ]
  },
  {
    "slug": "gym-log-3-day-glute-strength-foundations",
    "name": "Gym Log 3-Day Glute Strength Foundations",
    "category": "Gym Log Originals",
    "days": 3,
    "level": "Intermediate",
    "goal": "Glute hypertrophy and balanced full-body strength",
    "equipment": "Full gym",
    "duration": "4 weeks · 12 sessions · about 45–60 minutes per session",
    "progression": "Train on nonconsecutive days. Weeks 1–3 use double progression with a gradual increase in effort. Increase weight only once all target reps are achieved with control. Week 4 lowers volume and effort; repeat only if recovered. Avoid taking heavy compound sets to failure.",
    "sessions": [
      {
        "focus": "Glute strength · hip thrust and squat",
        "offset": 0,
        "ex": [
          [
            "Barbell hip thrust",
            3,
            "6-10",
            150
          ],
          [
            "Leg press",
            3,
            "8-12",
            150
          ],
          [
            "Seated leg curl",
            2,
            "10-15",
            75
          ],
          [
            "Dumbbell bench press",
            2,
            "8-12",
            90
          ],
          [
            "Cable row (seated)",
            2,
            "10-12",
            90
          ]
        ]
      },
      {
        "focus": "Upper body and unilateral glutes",
        "offset": 2,
        "ex": [
          [
            "Dumbbell step-up",
            3,
            "8-12",
            120,
            "Per leg."
          ],
          [
            "Cable lat pulldown",
            3,
            "8-12",
            90
          ],
          [
            "Dumbbell shoulder press",
            2,
            "8-12",
            90
          ],
          [
            "Cable kickback",
            2,
            "12-15",
            60,
            "Per leg."
          ],
          [
            "Side plank",
            2,
            "20-40 sec",
            45,
            "Per side."
          ]
        ]
      },
      {
        "focus": "Posterior chain and glute volume",
        "offset": 4,
        "ex": [
          [
            "Dumbbell Romanian deadlift",
            3,
            "8-12",
            150
          ],
          [
            "Reverse lunge (dumbbell)",
            3,
            "8-12",
            120,
            "Per leg."
          ],
          [
            "Hip thrust (machine)",
            2,
            "10-15",
            120
          ],
          [
            "Leg extension (machine)",
            2,
            "10-15",
            75
          ],
          [
            "Chest-supported dumbbell row",
            2,
            "10-12",
            90
          ]
        ]
      }
    ]
  }
];
/** Explicit four-week original blocks; actual loading is always chosen by the lifter. */
export const ORIGINAL_PROGRAM_BLOCKS:Record<string,SpecificProgram>=Object.fromEntries(blocks.map(b=>[b.slug,{
 duration:b.duration,progression:b.progression,accuracyNote:"Gym Log original program. Suggested effort and rest targets are starting points, not individualized medical or coaching advice.",
 workouts:Array.from({length:4},(_,week)=>b.sessions.map((s,i)=>({day:"Week "+(week+1)+" — Day "+(i+1),focus:s.focus,offsetDays:week*7+s.offset,guidance:"Warm up for 5–8 minutes and perform lighter ramp-up sets before the first loaded compound. "+(week===3?"Recovery week: reduce load as needed, leave 4 reps in reserve.":"Choose loads that leave "+(week===0?3:2)+" reps in reserve. Maintain good form; rest longer if needed.")+" "+s.ex.filter(x=>x[4]).map(x=>x[0]+": "+x[4]).join(" "),exercises:s.ex.map(([name,count,reps,seconds,note])=>{const sets=week===3?Math.max(1,count-1):count;const rest=seconds+" sec";const timed=/sec$/.test(reps);const targets:SetTarget[]=Array.from({length:sets},()=>({type:"normal",reps,load:"",rest,...(!timed?{rir:String(week===3?4:week===0?3:2)}:{})}));return writePrescription({name,sets:String(sets),reps,load:"",rest,notes:note||"",targets});})}))).flat()
}]));
