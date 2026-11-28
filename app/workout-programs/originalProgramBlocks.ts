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
  },
{"slug":"gym-log-2-day-machine-strength","name":"Gym Log 2-Day Machine Strength","category":"Gym Log Originals","days":2,"level":"Beginner","goal":"Low-complexity full-body strength","equipment":"Machines and cable station","duration":"4 weeks · 8 sessions · about 35–50 minutes per session","progression":"Leave at least two days between sessions. Adjust machine seats and start with a comfortable range. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Full body A","offset":0,"ex":[["Leg press",3,"8-12",120],["Machine chest press",3,"8-12",120],["Cable row (seated)",3,"10-12",90],["Hamstring curl (seated machine)",2,"10-15",75],["Calf raise (standing machine)",2,"12-15",60]]},{"focus":"Full body B","offset":3,"ex":[["Hack squat (machine)",3,"8-12",120],["Machine lat pulldown",3,"8-12",90],["Machine chest press",2,"10-12",90],["Hip thrust (machine)",3,"8-12",120],["Leg extension (machine)",2,"12-15",75]]}]},
{"slug":"gym-log-3-day-barbell-strength-base","name":"Gym Log 3-Day Barbell Strength Base","category":"Gym Log Originals","days":3,"level":"Intermediate","goal":"Squat, bench and deadlift strength","equipment":"Barbell, rack, bench and plates","duration":"4 weeks · 12 sessions · about 45–65 minutes per session","progression":"Keep heavy repetitions technically consistent; never grind. Use safeties for squats and bench. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Squat and bench","offset":0,"ex":[["Back squat",4,"4-6",180],["Barbell bench press",4,"4-6",180],["Barbell row",3,"6-8",120],["Plank",2,"30-45 sec",60]]},{"focus":"Deadlift and press","offset":2,"ex":[["Barbell deadlift",3,"3-5",210],["Barbell overhead press",3,"5-8",150],["Barbell Bulgarian split squat",2,"8-10",120,"Per leg; use a stable setup."],["Barbell curl",2,"10-12",75]]},{"focus":"Technique and volume","offset":4,"ex":[["Pause squat",3,"5-6",150,"Controlled pause; use less load than day one."],["Pause bench press",3,"6-8",150,"Pause each rep."],["Barbell row",3,"8-10",120],["Barbell glute bridge",2,"10-12",90]]}]},
{"slug":"gym-log-4-day-upper-lower-muscle","name":"Gym Log 4-Day Upper Lower Muscle","category":"Gym Log Originals","days":4,"level":"Intermediate","goal":"Balanced hypertrophy with two upper and two lower sessions","equipment":"Full gym","duration":"4 weeks · 16 sessions · about 45–65 minutes per session","progression":"Use controlled reps and maintain a day off between the first and second pair of workouts. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Upper A · horizontal","offset":0,"ex":[["Barbell bench press",3,"6-10",150],["Cable row (seated)",3,"8-12",120],["Incline dumbbell bench press",3,"8-12",90],["Dumbbell lateral raise",2,"12-18",60],["Cable triceps pushdown",2,"10-15",60]]},{"focus":"Lower A · quads","offset":1,"ex":[["Back squat",3,"6-10",150],["Leg press",3,"10-12",120],["Hamstring curl (seated machine)",3,"10-15",75],["Calf raise (standing)",3,"12-15",60]]},{"focus":"Upper B · vertical","offset":3,"ex":[["Cable lat pulldown",3,"8-12",120],["Dumbbell shoulder press (standing)",3,"8-12",120],["Chest-supported dumbbell row",3,"10-12",90],["Pec deck fly",2,"12-15",75],["Hammer curl (dumbbell)",2,"10-15",60]]},{"focus":"Lower B · posterior chain","offset":4,"ex":[["Dumbbell Romanian deadlift",3,"8-10",150],["Barbell hip thrust",3,"8-12",120],["Bulgarian split squat (dumbbell)",2,"8-12",120,"Per leg."],["Leg extension (machine)",2,"12-15",75],["Calf raise (seated machine)",2,"12-18",60]]}]},
{"slug":"gym-log-3-day-kettlebell-fundamentals","name":"Gym Log 3-Day Kettlebell Fundamentals","category":"Gym Log Originals","days":3,"level":"Beginner","goal":"Full-body strength and controlled conditioning","equipment":"One kettlebell and floor space","duration":"4 weeks · 12 sessions · about 30–40 minutes per session","progression":"Use a bell you can control throughout; no ballistic swings required. On unilateral work complete both sides before resting. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Squat and row","offset":0,"ex":[["Kettlebell goblet squat",3,"8-12",90],["Kettlebell row",3,"8-12",90,"Per side."],["Push-up",2,"6-12",90,"Use incline push-ups if needed."],["Plank",2,"20-40 sec",45]]},{"focus":"Hinge and unilateral","offset":2,"ex":[["Kettlebell deadlift",3,"8-12",120],["Lunge",2,"8-10",90,"Per leg; bodyweight or hold the kettlebell at chest."],["Kettlebell row",2,"10-12",75,"Per side."],["Glute bridge",2,"12-15",60]]},{"focus":"Squat and trunk","offset":4,"ex":[["Kettlebell goblet squat",3,"10-12",90],["Kettlebell deadlift",2,"10-12",90],["Push-up",3,"6-12",90],["Plank (side)",2,"20-30 sec",45,"Per side."]]}]},
{"slug":"gym-log-3-day-bodyweight-no-equipment","name":"Gym Log 3-Day Bodyweight No Equipment","category":"Gym Log Originals","days":3,"level":"Beginner","goal":"Strength and movement without equipment","equipment":"Floor space and stable wall or counter","duration":"4 weeks · 12 sessions · about 25–35 minutes per session","progression":"Use easier variations until controlled; progress range or leverage after the top rep target. Pulling strength is limited without equipment. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Squat and push","offset":0,"ex":[["Air squat",3,"10-15",75],["Incline push-up",3,"6-12",75,"Use a sturdy counter or wall."],["Glute bridge",3,"10-15",60],["Dead bug",2,"8-10",45,"Per side."]]},{"focus":"Single-leg and trunk","offset":2,"ex":[["Lunge",3,"8-12",75,"Per leg."],["Push-up",3,"6-12",75,"Use incline version as needed."],["Glute bridge (single-leg)",2,"8-12",60,"Per side."],["Plank (side)",2,"20-30 sec",45,"Per side."]]},{"focus":"Full body","offset":4,"ex":[["Air squat",3,"12-18",75],["Incline push-up",3,"8-15",75],["Calf raise (standing)",3,"12-20",60],["Plank",3,"20-40 sec",45]]}]},
{"slug":"gym-log-3-day-bench-emphasis","name":"Gym Log 3-Day Bench Emphasis","category":"Gym Log Originals","days":3,"level":"Intermediate","goal":"Improve bench press while maintaining balanced strength","equipment":"Barbell gym and cable station","duration":"4 weeks · 12 sessions · about 45–60 minutes per session","progression":"Separate heavy, moderate and technique bench sessions by rest days. Use a spotter or safeties. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Heavy bench","offset":0,"ex":[["Barbell bench press",4,"4-6",180],["Barbell row",3,"6-8",120],["Back squat",3,"6-8",150],["Cable triceps pushdown",2,"10-15",75]]},{"focus":"Bench volume","offset":2,"ex":[["Barbell bench press",3,"8-10",150],["Cable lat pulldown",3,"8-12",120],["Dumbbell Romanian deadlift",3,"8-10",120],["Dumbbell lateral raise",2,"12-15",60]]},{"focus":"Paused bench and upper back","offset":4,"ex":[["Pause bench press",3,"5-6",150,"Lighter load; pause each repetition."],["Chest-supported dumbbell row",3,"10-12",90],["Leg press",3,"10-12",120],["Cable face pull",2,"12-15",75]]}]},
{"slug":"gym-log-4-day-glute-upper-balance","name":"Gym Log 4-Day Glute and Upper Balance","category":"Gym Log Originals","days":4,"level":"Intermediate","goal":"Glute hypertrophy with complete upper-body training","equipment":"Full gym","duration":"4 weeks · 16 sessions · about 45–65 minutes per session","progression":"Separate lower sessions by at least two days. Control unilateral movement; reduce glute accessory volume if recovery suffers. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Lower A · hip thrust","offset":0,"ex":[["Barbell hip thrust",4,"6-10",150],["Leg press",3,"8-12",120],["Hamstring curl (seated machine)",3,"10-15",75],["Cable kickback",2,"12-15",60,"Per leg."]]},{"focus":"Upper A","offset":1,"ex":[["Dumbbell bench press",3,"8-12",120],["Cable row (seated)",3,"8-12",90],["Dumbbell lateral raise",3,"12-15",60],["Cable triceps pushdown",2,"10-15",60]]},{"focus":"Lower B · hinge","offset":3,"ex":[["Dumbbell Romanian deadlift",3,"8-10",150],["Bulgarian split squat (dumbbell)",3,"8-12",120,"Per leg."],["Hip thrust (machine)",3,"10-15",120],["Leg extension (machine)",2,"12-15",75]]},{"focus":"Upper B","offset":4,"ex":[["Cable lat pulldown",3,"8-12",120],["Incline dumbbell bench press",3,"8-12",90],["Chest-supported dumbbell row",3,"10-12",90],["Hammer curl (dumbbell)",2,"10-15",60],["Cable face pull",2,"12-15",60]]}]},
{"slug":"gym-log-3-day-express-25","name":"Gym Log 3-Day Express 25","category":"Gym Log Originals","days":3,"level":"Beginner","goal":"Efficient full-body training in short sessions","equipment":"Full gym","duration":"4 weeks · 12 sessions · about 25–35 minutes per session","progression":"Use two work sets per exercise and prioritize the first three movements. Do not rush loaded reps or skip warm-up to meet the clock. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Express A","offset":0,"ex":[["Leg press",2,"8-12",90],["Machine chest press",2,"8-12",90],["Cable row (seated)",2,"10-12",90],["Plank",2,"20-40 sec",45]]},{"focus":"Express B","offset":2,"ex":[["Dumbbell Romanian deadlift",2,"8-12",120],["Cable lat pulldown",2,"8-12",90],["Dumbbell shoulder press (standing)",2,"8-12",90],["Dead bug",2,"8-10",45,"Per side."]]},{"focus":"Express C","offset":4,"ex":[["Goblet squat",2,"8-12",90],["Incline dumbbell bench press",2,"8-12",90],["Chest-supported dumbbell row",2,"10-12",90],["Calf raise (standing)",2,"12-15",60]]}]},
{"slug":"gym-log-5-day-bodybuilding-balanced","name":"Gym Log 5-Day Balanced Bodybuilding","category":"Gym Log Originals","days":5,"level":"Advanced","goal":"Hypertrophy with a body-part split and upper accessory day","equipment":"Full gym","duration":"4 weeks · 20 sessions · about 45–65 minutes per session","progression":"Manage fatigue across consecutive sessions. Use consistent range of motion, no forced reps, and rest on days 4 and 7. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Chest and triceps","offset":0,"ex":[["Barbell bench press",3,"6-10",150],["Incline dumbbell bench press",3,"8-12",120],["Pec deck fly",3,"10-15",75],["Cable triceps pushdown",3,"10-15",60]]},{"focus":"Back and biceps","offset":1,"ex":[["Cable lat pulldown",3,"8-12",120],["Barbell row",3,"8-10",120],["Chest-supported dumbbell row",3,"10-12",90],["EZ-bar curl",3,"10-15",75]]},{"focus":"Quads and calves","offset":2,"ex":[["Back squat",3,"6-10",180],["Leg press",3,"10-12",120],["Leg extension (machine)",3,"12-15",75],["Calf raise (standing)",4,"10-15",60]]},{"focus":"Shoulders and arms","offset":4,"ex":[["Dumbbell shoulder press (standing)",3,"8-12",120],["Dumbbell lateral raise",3,"12-18",60],["Cable face pull",3,"12-15",75],["Hammer curl (dumbbell)",2,"10-15",60],["Cable overhead triceps extension",2,"10-15",60]]},{"focus":"Posterior chain","offset":5,"ex":[["Dumbbell Romanian deadlift",4,"8-10",150],["Barbell hip thrust",3,"8-12",120],["Hamstring curl (lying machine)",3,"10-15",75],["Calf raise (seated machine)",3,"12-18",60]]}]},
{"slug":"gym-log-2-day-weekend-full-body","name":"Gym Log 2-Day Weekend Full Body","category":"Gym Log Originals","days":2,"level":"Intermediate","goal":"Two adjacent days with complementary emphasis","equipment":"Full gym","duration":"4 weeks · 8 sessions · about 40–55 minutes per session","progression":"Designed for consecutive training days. Day one emphasizes squat and push; day two emphasizes hinge and pull. Keep accessory effort moderate if sore. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Day A · squat and push","offset":0,"ex":[["Back squat",3,"5-8",150],["Dumbbell bench press",3,"8-12",120],["Cable row (seated)",2,"10-12",90],["Leg extension (machine)",2,"12-15",75],["Cable triceps pushdown",2,"10-15",60]]},{"focus":"Day B · hinge and pull","offset":1,"ex":[["Dumbbell Romanian deadlift",3,"8-10",150],["Cable lat pulldown",3,"8-12",120],["Dumbbell shoulder press (standing)",2,"8-12",90],["Hamstring curl (seated machine)",2,"10-15",75],["Hammer curl (dumbbell)",2,"10-15",60]]}]},
{"slug":"gym-log-3-day-deadlift-technique","name":"Gym Log 3-Day Deadlift Technique","category":"Gym Log Originals","days":3,"level":"Intermediate","goal":"Deadlift technique and posterior-chain strength","equipment":"Barbell gym","duration":"4 weeks · 12 sessions · about 45–60 minutes per session","progression":"Use lighter paused reps to refine positioning; keep heavy pulls well short of failure. Rest at least one day between sessions. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Conventional strength","offset":0,"ex":[["Barbell deadlift",3,"3-5",210],["Barbell bench press",3,"6-8",150],["Barbell row",3,"8-10",120],["Plank",2,"30-45 sec",60]]},{"focus":"Squat and upper strength","offset":2,"ex":[["Back squat",3,"5-8",180],["Barbell overhead press",3,"6-8",120],["Barbell curl",2,"10-12",75],["Glute bridge",2,"12-15",60]]},{"focus":"Paused pull and hinge volume","offset":4,"ex":[["Pause deadlift",3,"4-6",180,"Use a lighter load, pause just off floor."],["Barbell glute bridge",2,"8-10",120],["Close-grip bench press",3,"6-10",120],["Barbell row",2,"8-12",90]]}]},
{"slug":"gym-log-4-day-dumbbell-home-muscle","name":"Gym Log 4-Day Dumbbell Home Muscle","category":"Gym Log Originals","days":4,"level":"Intermediate","goal":"Home hypertrophy with a compact upper/lower split","equipment":"Dumbbells, stable bench and floor space","duration":"4 weeks · 16 sessions · about 35–50 minutes per session","progression":"Use adjustable dumbbells if available. Keep two rest days between sessions for the same body region; progress reps before weight. Weeks 1–3: add reps before adding the smallest practical load increment while respecting effort targets. Week 4: reduce sets and load as needed; leave at least 4 reps in reserve on resistance movements.","sessions":[{"focus":"Upper A","offset":0,"ex":[["Dumbbell bench press",3,"8-12",120],["Single-arm dumbbell row",3,"8-12",90,"Per side."],["Dumbbell lateral raise",3,"12-18",60],["Overhead triceps extension (dumbbell)",2,"10-15",60]]},{"focus":"Lower A","offset":1,"ex":[["Dumbbell goblet squat",3,"8-12",120],["Dumbbell Romanian deadlift",3,"8-12",120],["Dumbbell step-up",2,"8-10",90,"Per leg; use a sturdy low platform."],["Calf raise (standing)",3,"12-20",60]]},{"focus":"Upper B","offset":3,"ex":[["Dumbbell shoulder press (standing)",3,"8-12",120],["Chest-supported dumbbell row",3,"10-12",90],["Push-up",3,"8-15",75],["Hammer curl (dumbbell)",3,"10-15",60]]},{"focus":"Lower B","offset":4,"ex":[["Bulgarian split squat (dumbbell)",3,"8-12",120,"Per leg."],["Dumbbell hip thrust",3,"10-15",90],["Dumbbell Romanian deadlift",2,"10-12",120],["Plank (side)",2,"20-40 sec",45,"Per side."]]}]}
];
/** Explicit four-week original blocks; actual loading is always chosen by the lifter. */
export const ORIGINAL_PROGRAM_BLOCKS:Record<string,SpecificProgram>=Object.fromEntries(blocks.map(b=>[b.slug,{
 duration:b.duration,progression:b.progression,accuracyNote:"Gym Log original program. Suggested effort and rest targets are starting points, not individualized medical or coaching advice.",
 workouts:Array.from({length:4},(_,week)=>b.sessions.map((s,i)=>({day:"Week "+(week+1)+" — Day "+(i+1),focus:s.focus,offsetDays:week*7+s.offset,guidance:"Warm up for 5–8 minutes and perform lighter ramp-up sets before the first loaded compound. "+(week===3?"Recovery week: reduce load as needed, leave 4 reps in reserve.":"Choose loads that leave "+(week===0?3:2)+" reps in reserve. Maintain good form; rest longer if needed.")+" "+s.ex.filter(x=>x[4]).map(x=>x[0]+": "+x[4]).join(" "),exercises:s.ex.map(([name,count,reps,seconds,note])=>{const sets=week===3?Math.max(1,count-1):count;const rest=seconds+" sec";const timed=/sec$/.test(reps);const targets:SetTarget[]=Array.from({length:sets},()=>({type:"normal",reps,load:"",rest,...(!timed?{rir:String(week===3?4:week===0?3:2)}:{})}));return writePrescription({name,sets:String(sets),reps,load:"",rest,notes:note||"",targets});})}))).flat()
}]));
