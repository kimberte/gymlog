export type TrainerSeoTopic={slug:string;title:string;desc:string;headline:string;lead:string;sections:string[][];example:string[];faq:string[][];related:string[]};
export const TRAINER_TOPICS:TrainerSeoTopic[]=[
  {
    "slug": "online-coaching",
    "title": "Online Personal Training Software",
    "desc": "Deliver remote training plans, collect actual workout results and communicate with clients from $9 USD/month.",
    "headline": "Online personal training software",
    "lead": "Build a remote coaching workflow around the training itself, not scattered PDFs, chat threads and spreadsheets.",
    "sections": [
      [
        "Start with a client-approved connection",
        "Invite the email your client uses for Gym Log. They review the access request before you can assign training. Their personal calendar remains their own."
      ],
      [
        "Deliver a program they can actually follow",
        "Build a four-week block, select the start date and preview assignments. The client reviews the plan before it appears in their calendar. Revisions require approval too."
      ],
      [
        "Review results between sessions",
        "Use logged weights, reps, workout completion and notes to decide what to adjust. Message the client privately in the same coaching workspace."
      ]
    ],
    "example": [
      "Example: a remote strength client",
      "Assign Monday upper body and Thursday lower body for four weeks. On Friday review actual sets, ask about missed sessions and revise next week's targets if necessary."
    ],
    "faq": [
      [
        "Does my client need a paid subscription?",
        "No trainer subscription is required for client coaching access."
      ],
      [
        "Does Gym Log include meal plans or video consultations?",
        "Gym Log focuses on workout programming and training results; it is not a full nutrition or video-call platform."
      ]
    ],
    "related": [
      "workout-builder",
      "client-management",
      "progress-tracking"
    ]
  },
  {
    "slug": "workout-builder",
    "title": "Workout Builder for Personal Trainers",
    "desc": "Create structured workouts with individual set targets, supersets, RPE, tempo and progression rules.",
    "headline": "A workout builder for personal trainers",
    "lead": "Create detailed strength sessions without rebuilding a spreadsheet every time you coach a new client.",
    "sections": [
      [
        "Program at exercise or set level",
        "Edit sets, reps, load and rest inline. Open Details for warm-up, drop and failure sets, individual targets, effort, tempo and exercise alternatives."
      ],
      [
        "Organize training groups",
        "Create supersets, giant sets and circuits with matching set counts and a shared rest period after each round. The builder explains incompatible groups before they are applied."
      ],
      [
        "Plan progression before assigning",
        "Duplicate weeks and preview fixed load, percentage changes or rep progression across matching exercises. Apply the preview to the draft only; assigned workouts do not silently change."
      ]
    ],
    "example": [
      "Example: upper-body session",
      "Bench press: two warm-up sets, two working sets and a drop set. Pair curls and triceps pushdowns for three rounds with 60 seconds rest. Then preview four weeks of lat-pulldown progression."
    ],
    "faq": [
      [
        "Can I import a spreadsheet?",
        "The importer supports CSV, TSV, text and JSON with review before applying. Native Excel and PDF import are not currently supported."
      ],
      [
        "Can clients change actual weight and reps?",
        "Yes. Targets are prefilled, and actual logged results remain distinct from the prescription."
      ]
    ],
    "related": [
      "program-templates",
      "strength-coaching",
      "online-coaching"
    ]
  },
  {
    "slug": "affordable-software",
    "title": "Affordable Personal Trainer Software",
    "desc": "Compare Gym Log's transparent monthly plans: $9 for up to 20 clients or $25 for up to 50, in USD.",
    "headline": "Affordable personal trainer software",
    "lead": "Keep your coaching overhead predictable. Choose a client capacity rather than paying for a different feature set.",
    "sections": [
      [
        "Know your monthly cost",
        "Coach is $9 USD per month for up to 20 clients. Growing Coach is $25 USD per month for up to 50. Applicable taxes are extra. Both include the same coaching features."
      ],
      [
        "Calculate the cost at your roster size",
        "At 5 clients, Coach costs $1.80 per client per month; at 10, $0.90; at 20, $0.45. At 50 clients, Growing Coach costs $0.50 each. These are effective costs, not per-client charges."
      ],
      [
        "Evaluate the features you actually need",
        "If your work centers on programs, calendar delivery, logged results and private messaging, try the workspace before subscribing. If nutrition, branded apps or client payment collection are essential, compare broader platforms."
      ]
    ],
    "example": [
      "Example: coaching 12 clients",
      "The Coach subscription stays $9 monthly, or $0.75 per client at that roster size. There is no need to move to the higher plan until capacity requires it."
    ],
    "faq": [
      [
        "Is there a permanent free trainer plan?",
        "No. The trainer trial lasts 30 days; a paid membership is required afterward."
      ],
      [
        "Is a credit card required to try it?",
        "No card is needed to begin the trial. The demo also works without an account."
      ]
    ],
    "related": [
      "client-management",
      "online-coaching",
      "workout-builder"
    ]
  },
  {
    "slug": "client-management",
    "title": "Client Management Software for Personal Trainers",
    "desc": "Manage approved trainer-client connections, training plans and private messages in one coaching workspace.",
    "headline": "Client management for personal trainers",
    "lead": "Keep your roster, training calendar and conversations organized without adding a separate client-management system.",
    "sections": [
      [
        "Invite and manage your roster",
        "Clients approve their own access requests. Open a client workspace to view training history, progress and planned sessions."
      ],
      [
        "Coordinate training changes",
        "Assign a single session or multiweek block. Preview overlaps before sending. Clients approve new assignments and revisions, while completed results are protected."
      ],
      [
        "Keep coaching communication connected",
        "Use the private inbox and unread indicators for client conversations. Review notification preferences and keep follow-ups near the training plan."
      ]
    ],
    "example": [
      "Example: weekly roster review",
      "Open each client's upcoming calendar, identify pending approvals and missed training, and send a specific follow-up based on their logged workout rather than asking them to retype results."
    ],
    "faq": [
      [
        "Can clients revoke access?",
        "Yes. Clients can manage trainer connections and disconnect a trainer."
      ],
      [
        "Does this replace appointment booking or a sales CRM?",
        "No. Client management is focused on workout coaching rather than lead pipelines, appointment booking or client invoicing."
      ]
    ],
    "related": [
      "workout-calendar",
      "progress-tracking",
      "online-coaching"
    ]
  },
  {
    "slug": "progress-tracking",
    "title": "Client Fitness Progress Tracking Software",
    "desc": "Track completed workouts, adherence, actual lifts, personal records and body measurements for coaching clients.",
    "headline": "Client fitness progress tracking",
    "lead": "See the training your clients actually completed, rather than relying on a checkmark in a spreadsheet.",
    "sections": [
      [
        "Separate planned work from actual results",
        "Clients see prescribed reps and load, then log actual sets. Review performance and notes before changing the next session."
      ],
      [
        "Review consistency over time",
        "Use completion and adherence views to see whether approved workouts are being completed. A missed session is a conversation starter, not evidence of poor effort."
      ],
      [
        "Compare like with like",
        "Review an exercise's performance history and body measurements where available. Consider changes in exercise, units, reps and technique before interpreting a new personal record."
      ]
    ],
    "example": [
      "Example: bench press review",
      "If a client records 135 lb for eight reps one week and 140 lb for eight reps the next, that is useful evidence for discussion. If they changed technique or recorded fewer reps, review the context first."
    ],
    "faq": [
      [
        "Can I see workout notes?",
        "Yes, review the actual training results and client notes available through the coaching workspace."
      ],
      [
        "Does Gym Log include a private progress photo gallery?",
        "A dedicated progress photo gallery is not part of the current trainer feature set."
      ]
    ],
    "related": [
      "strength-coaching",
      "client-management",
      "workout-builder"
    ]
  },
  {
    "slug": "strength-coaching",
    "title": "Strength Coaching Software",
    "desc": "Program strength training blocks with individual sets, load targets, rest timers and exercise progress history.",
    "headline": "Strength coaching software",
    "lead": "Build practical programs for independent strength coaches who want control over prescriptions and results.",
    "sections": [
      [
        "Prescribe distinct working sets",
        "Set warm-up loads separately from working sets and drop sets. Add target RPE, RIR and tempo when the exercise calls for them."
      ],
      [
        "Progress the block deliberately",
        "Use the week-by-week progression grid or preview fixed-weight, percentage-load and rep changes. A final-week load deload is optional. Individualized set changes are edited in the builder."
      ],
      [
        "Keep the athlete's training record",
        "Review actual reps and loads, compare comparable sessions and use private messaging to discuss the next adjustment. The software does not automatically decide when an athlete should increase weight."
      ]
    ],
    "example": [
      "Example: four-week squat block",
      "Start with four sets of six at 185 lb, preview a 5 lb weekly increase and optionally reduce final-week loading. Confirm the proposed targets before assigning."
    ],
    "faq": [
      [
        "Can I use kilograms?",
        "Yes. Structured targets and logs support lb and kg."
      ],
      [
        "Does percentage progression use a client's 1RM automatically?",
        "No. The current percentage rule changes the starting load across weeks; automatic percentage-of-1RM prescriptions are not included."
      ]
    ],
    "related": [
      "workout-builder",
      "progress-tracking",
      "program-templates"
    ]
  },
  {
    "slug": "workout-calendar",
    "title": "Workout Scheduling Software for Trainers",
    "desc": "Schedule client training sessions and multiweek plans with a shared workout calendar and client approvals.",
    "headline": "Workout scheduling for personal trainers",
    "lead": "Deliver the right session on the right day and keep the training calendar clear.",
    "sections": [
      [
        "Schedule an entire block",
        "Choose a program, client and start date. Preview the dates and conflicts before assigning it."
      ],
      [
        "Make changes with approval",
        "Move or revise future training as needed. Clients review assignments before adding them to their calendar; previously approved training stays in place until an eligible revision is approved."
      ],
      [
        "Review what is due",
        "Use calendar and progress views to distinguish upcoming, approved and completed workouts. Clients log their sets in the main Gym Log calendar."
      ]
    ],
    "example": [
      "Example: a three-day split",
      "Schedule Monday, Wednesday and Friday across four weeks. If the client's routine changes, review the affected future dates and send a revised plan."
    ],
    "faq": [
      [
        "Is this an appointment booking tool?",
        "No. It schedules training workouts, not paid appointment slots or group class bookings."
      ],
      [
        "Can clients have their own workouts?",
        "Yes. The personal calendar supports independent workouts alongside approved trainer assignments."
      ]
    ],
    "related": [
      "client-management",
      "online-coaching",
      "program-templates"
    ]
  },
  {
    "slug": "program-templates",
    "title": "Workout Program Templates for Personal Trainers",
    "desc": "Build reusable training blocks, adapt Gym Log's workout program library and assign customized plans.",
    "headline": "Workout program templates for personal trainers",
    "lead": "Start from a proven structure and adapt the sessions to the person in front of you.",
    "sections": [
      [
        "Start with a reusable block",
        "Browse Gym Log's library or build your own multiweek template. Duplicate weeks and sessions instead of entering the same movements repeatedly."
      ],
      [
        "Customize before delivery",
        "Adjust exercises, sets, loads, rest and alternatives for the client's equipment and training history. Review the program preview before assignment."
      ],
      [
        "Bring existing plans with you",
        "Paste formatted text or import CSV, TSV or JSON. Review parsed sessions and fix any issues before replacing the draft. Native XLSX and PDF parsing are not currently included."
      ]
    ],
    "example": [
      "Example: four-week upper/lower template",
      "Build two upper and two lower sessions, duplicate the weekly structure, then adjust progression for each client. Save the reusable program in your trainer library."
    ],
    "faq": [
      [
        "Can I reuse a program with another client?",
        "Yes. Saved multiweek programs can be loaded and adapted before assigning them."
      ],
      [
        "Where can I browse sample routines?",
        "The public Gym Log workout program library is available at /workout-programs."
      ]
    ],
    "related": [
      "workout-builder",
      "strength-coaching",
      "workout-calendar"
    ]
  }
];
export const TRAINER_COMPARISONS=[
  {
    "slug": "trainerize",
    "brand": "ABC Trainerize",
    "source": "https://www.trainerize.com/pricing/",
    "price": "Free tier for one active client; paid plans and add-ons vary by roster and features.",
    "strength": "Trainerize offers a broad suite that includes nutrition coaching, branded app options and integrated payments on eligible plans or add-ons.",
    "fit": "If your business sells memberships or needs nutrition coaching and branded delivery, its wider scope may be worth the cost. If you mainly prescribe workouts and review results, Gym Log is a focused alternative.",
    "migration": "Recreate your core templates and invite a small group first. Keep any nutrition records, payment subscriptions and historical exports separately; Gym Log does not transfer those systems."
  },
  {
    "slug": "truecoach",
    "brand": "TrueCoach",
    "source": "https://truecoach.co/pricing/",
    "price": "The official pricing page shows Starter for 5 clients, Standard for 20 and Pro for 50, with monthly and annual options. A 14-day trial is advertised.",
    "strength": "TrueCoach combines programming and client tracking with nutrition and habit tools, a video exercise library and integrated payments; some tiers add integrations and branding.",
    "fit": "Choose TrueCoach if these broader coaching tools are central to your service. Gym Log prioritizes detailed strength programming, calendar approvals and affordable capacity for independent coaches.",
    "migration": "Export or archive prior results first. Transfer your current workout prescriptions through text or supported CSV/JSON formats, then check exercise names, targets and schedules before assigning."
  },
  {
    "slug": "everfit",
    "brand": "Everfit",
    "source": "https://everfit.io/pricing/",
    "price": "Everfit advertises a free Starter tier for up to 5 clients and a monthly Pro tier listed at $49 for 20 clients and $95 for 50; annual billing may differ.",
    "strength": "Everfit supports progress photos, tasks and coaching apps; Pro also lists nutrition, habits, questionnaires and team capabilities.",
    "fit": "For a coach with five or fewer clients, Everfit's free tier is worth evaluating. For a workout-focused roster of up to 20 or 50, compare Gym Log's fixed subscription and the features you need.",
    "migration": "Keep existing check-ins, meal plans and photos in your current archive. Test a single training block and client approval workflow before moving the rest of your roster."
  },
  {
    "slug": "hevy-coach",
    "brand": "Hevy Coach",
    "source": "https://hevycoach.com/pricing",
    "price": "The public pricing page displays $25 USD/month with a client-count selector and a 30-day trial; confirm the quote for your actual roster.",
    "strength": "Hevy Coach emphasizes workout programming and progress tracking, with custom exercises, a client app and coaching-team tools.",
    "fit": "Both platforms serve strength-focused coaches. Compare the logging experience, client approval flow, program editing and roster cost; Hevy's existing app ecosystem and team functionality may be important to your business.",
    "migration": "Test your current strength block with the Gym Log demo, including individual set targets and groups. Preserve your existing workout history separately rather than assuming cross-platform sync."
  },
  {
    "slug": "my-pt-hub",
    "brand": "My PT Hub",
    "source": "https://www.mypthub.net/pricing/",
    "price": "My PT Hub lists a free Lite tier for one client and paid tiers with unlimited-client options. Pricing and promotions vary by currency and plan.",
    "strength": "My PT Hub offers a wider business toolkit including nutrition, payment processing, bookings, check-ins and branded-app options on applicable plans.",
    "fit": "A larger business needing unlimited clients or integrated booking and payments may prefer that scope. Gym Log is designed for independent workout-focused coaches with up to 50 clients.",
    "migration": "Separate scheduling, billing and nutrition records from workout prescriptions. Trial the coaching workspace alongside your current service before deciding whether a switch makes sense."
  }
];
export const TRAINER_SEO_PATHS=[...TRAINER_TOPICS.map(t=>"/trainers/"+t.slug),...TRAINER_COMPARISONS.map(t=>"/trainers/compare/"+t.slug)];
