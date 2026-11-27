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
