import type { Program } from "./programs";

const extra=(slug:string,name:string,category:string,days:number,level:Program["level"],goal:string,equipment:string):Program=>({slug,name,category,days,level,goal,equipment,description:`${name} is a ${days}-day ${category.toLowerCase()} workout program focused on ${goal.toLowerCase()}. This Gym Log template gives you a practical starting structure for organizing and tracking consistent training.`,bestFor:`People looking for a structured ${days}-day ${category.toLowerCase()} routine focused on ${goal.toLowerCase()}.`,structure:category.includes("Strength")||category.includes("Powerlifting")?["Primary compound lifts","Supplemental strength work","Accessory exercises","Progressive loading"]:["Main movement patterns","Focused training volume","Accessory exercises","Progress gradually"],notes:"This Gym Log listing is an original tracking template, not an official prescription. Use the original source or qualified coach for exact programming details."});

export const EXTRA_PROGRAMS:Program[]=[
extra("dup-powerlifting","DUP Powerlifting Program","Powerlifting",4,"Intermediate","Strength and competition performance","Barbell gym"),
extra("3-day-ppl","3-Day Push Pull Legs Program","Hypertrophy",3,"All Levels","Muscle and strength","Full gym"),
extra("4-day-ppl","4-Day Push Pull Legs Program","Hypertrophy",4,"Intermediate","Muscle and strength","Full gym"),
extra("3-day-full-body-strength","3-Day Full Body Strength","Strength",3,"Beginner","Strength","Full gym"),
extra("4-day-full-body-strength","4-Day Full Body Strength","Strength",4,"Intermediate","Strength","Full gym"),
extra("minimalist-strength-3-day","Minimalist Strength 3-Day","Strength",3,"All Levels","Strength","Barbell gym"),
extra("home-dumbbell-4-day","Home Dumbbell 4-Day Program","Home & Bodyweight",4,"All Levels","Strength and muscle","Dumbbells"),
extra("kettlebell-strength-4-day","Kettlebell Strength 4-Day","Kettlebell",4,"All Levels","Strength and conditioning","Kettlebell"),
extra("athletic-strength-3-day","Athletic Strength 3-Day","Conditioning",3,"Intermediate","Performance","Full gym"),
extra("hypertrophy-upper-lower-3-day","Hypertrophy Upper Lower 3-Day","Hypertrophy",3,"All Levels","Muscle building","Full gym"),
extra("hypertrophy-upper-lower-5-day","Hypertrophy Upper Lower 5-Day","Hypertrophy",5,"Intermediate","Muscle building","Full gym"),
extra("full-body-2-day-strength","2-Day Full Body Strength","Strength",2,"All Levels","Strength and fitness","Full gym"),
];
