# Program library roadmap — November 28, 2026

Goal: 500+ genuinely distinct importable programs. Baseline source audit: 343 unique catalog slugs, 112 dedicated definitions, 231 generated adaptations; 35 additional unique SEO templates. These are source counts, not proof that all are fully structured.

## Batch 1
- Upgrade gym-log-beginner to a four-week, 12-session original block.
- Add gym-log-2-day-dumbbell-foundations (8 sessions) and gym-log-3-day-glute-strength-foundations (12 sessions).
- All 32 sessions use explicit offsets, rest and individual RIR targets for resistance work. Timed core work uses duration, not invented RIR. Actual weight stays blank. Week 4 reduces volume/effort. Guidance includes warm-up and progression.
- Canonical name validation against exercises.ts completed before commit; check scheduled day counts and set target shape. Full browser and production import QA pending. Source count expected 345 catalog entries and 115 dedicated definitions, 230 adaptations; verify actual deployed counts.
- Readable display for canonical serialized prescriptions; structured importer retains readable instructions and avoids mapping distance prescriptions as reps in personal imports.

## Next priorities
1. Verify production build and import these exact blocks in personal Notes/Structured and trainer builder. Add automated round-trip validation for serialization, dates and targets. Make duration/distance/percentage parsing consistent across all entry points. Ensure whole-program guidance remains available.
2. Enrich existing dedicated and generated programs in small batches, prioritizing distinct original plans and high-value training goals. Label third-party adaptations; never reproduce paid plans or invent official loading rules.
3. Consolidate SEO templates, preserve URLs and distinguish variants from duplicates. Expand originals only with clear differences in frequency, goal, equipment and experience. Maintain coverage counts and test results here.
4. Target 500+ verified useful entries, not superficial duplicates. Coordinate atomic main writes with daily blogs and other development tasks.
