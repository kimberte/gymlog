# Trainer UX and product roadmap — 2026-11-27

## Owner acceptance (Nov 27)
- PASS: existing program import and prefill, overlapping assignments, retain original until approval, replacement, marking complete, undo, light mode, default lb and chronological approval months.
- Preserve completed and logged training from coach replacement. Do not reset client data.

## Current iteration
- Disable future-day completion using the client's local date in the shared editor; allow undo for any previously completed future workout. Editing and planning remain available. UI safeguard, not a server timezone policy.
- Exercise reorder in shared Program Studio: desktop drag handle and accessible up/down controls for mobile and keyboard; preserve order through saved programs and client approval.
- Landing page: price and 20-client capacity above fold, 30-day trial, no-login live demo near top, pricing per client at capacity, no unsupported competitor claims. Keep real demo using same components and fictional data.

## Next UX work (prioritized)
1. Structured exercise groups: optional superset (two movements), giant set (three or more), and circuit; explicit rounds/rest, visible group badges and client round-by-round logging; preserve individual set results and historical data. Keep regular workouts default. Notes can cover advanced methods temporarily, but not a substitute for grouping.
2. Trainer builder usability: reorder days/workouts, duplicate sessions, inline editing, mobile layout, keyboard accessibility, review unsaved changes, preserve program library and fast assignment path. Verify on phone and desktop; do not add a parallel builder.
3. Trial onboarding: demo → trial → first saved program → first client connection → first assignment. Encourage program building before invitations; show remaining trial days, plan limits, clear billing terms. Measure conversion and first assignment completion.

## Future feature — private progress media and form checks (owner requested, not yet built)
- Reuse existing photo/video upload and compression infrastructure, not public community media. Add private dated progress photo gallery with front/side/back labels and comparison; optional sharing with an approved trainer, revocable by client.
- Exercise/workout-specific technique clips: client uploads a form video, trainer views it in the client workspace, provides private feedback, client sees reply. Explicit opt-in, no public sharing, no training video reuse without consent. Allow client deletion and enforce private storage RLS, authorized short-lived URLs, revoked access, file validation, limits, and retention. Review storage and bandwidth costs before rollout.
- Do not advertise these as current features until verified. Keep existing notes photo/video behavior unchanged.

## Market review (official public pages, Nov 27)
- Everfit: https://everfit.io/pricing/ ; https://help.everfit.io/en/articles/4620515-workout-builder-overview ; https://help.everfit.io/en/articles/4620517-how-to-create-a-superset
- TrueCoach: https://truecoach.co/pricing/ ; https://help.truecoach.co/en/articles/3047972-the-workout-builder-basics
- My PT Hub: https://www.mypthub.net/ ; https://www.mypthub.net/pricing/
- Position Gym Log as affordable training-first software rather than feature-for-feature all-in-one parity. Everfit has a free five-client tier; avoid blanket cheapest claims. Retain $9 USD/20 and $25 USD/50 unless owner changes pricing. Prioritize core programming, client logging and real progress over nutrition, wearables and white label expansion.

## Approved follow-up
- Use $0.45 USD/client/month at 20 clients prominently on trainer landing, trial entry and future marketing; never imply per-client billing or that the effective rate applies to smaller rosters.
- Move/swap a whole workout in a draft by desktop drag or destination picker; duplicate to another day/week; require confirmation when a duplicate would replace a draft. Same Program Studio for demo/live.
- First-time trainer overview directs trainers to build a program before connecting clients. Trial status, full guided onboarding, and structured exercise groups remain follow-up work.

- Initial structured supersets, giant sets and circuits: group adjacent exercises with shared rounds and post-round rest; group metadata is retained in existing prescription lines and structured result payloads. Client logs each movement by round. Ungroup before reordering individually; grouped movement removal requires ungrouping. Verify save/import/approval and mobile logging before marketing as a live feature.

## Builder expansion — approved Nov 27
- Initial individual set targets (normal/warm-up/drop/failure), per-set RPE/RIR/tempo targets, coach-approved alternatives, catalog filters and device-local favorites/recent exercises.
- Device-local Program Studio draft recovery, four-week editable progression grid (ordinary uniform prescriptions only), deterministic TXT / CSV / TSV / Gym Log JSON import with review and rejection of unknown targets, automatic prescribed rest timer (including grouped rounds).
- Do not claim completed QA: test persistence and server acceptance, actual results, mobile behavior and demo parity. Remaining: inline editor redesign, group block reordering/direct round editing, durable client draft recovery, Excel/PDF/image interpretation, percentage/automatic progression, trainer custom exercise profiles and video, timer background alerts, warmup/cooldown sections, exercise-level comments. No unreviewed automatic assignment.

## Inline studio and progression — owner approved Nov 27
- Common uniform targets edit inline on blur/Enter; advanced details remain expandable. Exercise catalog is a responsive desktop sidebar, collapsible on mobile. Existing grouping validation retained.
- Progression rules are deterministic and review-first: fixed or percentage load, reps, configurable load rounding and optional final-week load deload. Apply only to matching exercise occurrence on a selected training day in the current draft; skip absent workouts, individual-set prescriptions, incompatible units or duration targets. Grouped uniform reps/load may progress without changing group rounds. Apply requires explicit approval, with immediate undo available while the resulting draft is unchanged. Never change assigned workouts or historical results.
- QA required: light/dark, phone/desktop, inline edits, advanced editor, group validation, progression preview/undo and assignment persistence. Client-based percentage-of-1RM and performance-triggered progression remain separate future features.

## Launch focus — owner direction Nov 27
- Defer progress photo gallery, form videos and additional coaching expansion. Prioritize UX/UI polish, production reliability and commercial launch checks.
- Personal workouts use the shared PrescriptionEditor and WorkoutEditor, with a device-local Notes/Structured default for new personal workouts. Preserve existing modes and notes; trainer assignments remain structured. Personal plan can be edited while untouched and appended after logging without overwriting existing rows; grouping, targets, alternatives, individual sets and rest timers use the same implementation. Maintain demo/live parity and verify mobile/light/dark and persistence before claiming final QA.

- Owner confirmed personal structured workouts work. Structured is now the fallback for new personal workouts without an explicit saved preference. Retain existing explicit Notes preferences and existing workout modes. Show a dismissible Settings reminder after switching formats, without changing the default automatically.
