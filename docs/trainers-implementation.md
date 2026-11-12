# Gym Log for Trainers — implementation plan

## Verified baseline (main, 2026-11-12)
- Next.js 16 App Router, React 19, Supabase JS 2, Stripe 20.
- `app/lib/storage.ts`: localStorage-first workout map, up to 3 entries/day; entries have `completedAt`, notes and structured data.
- `app/lib/backup.ts`: `workout_backups` per-user snapshot; this is **not** a secure collaborative editing layer.
- `app/components/WorkoutCalendar.tsx`: reusable calendar with green completed and grey future markers.
- `app/lib/entitlements.ts`: existing consumer Pro subscription/trial; keep trainer billing separate.

## Delivery phases
1. Trainer identity, client invitation, consent and portal shell (this branch).
2. Shared workouts: introduce per-entry server-authoritative records with client owner, trainer author, scheduled date, prescription snapshot, actual performance, completion timestamp, revision and audit trail. Strict RLS: client owns; accepted trainer may read full client calendar and manage assignments, not personal records. Client can revoke. Do not grant trainers direct access to entire workout_backups JSON.
3. Client integration: merge server assignments into existing local calendar, retain offline edits and reconcile conflicts; no client Pro requirement for coached workouts. Avoid overwriting existing local data. Mark manual completion, preserve original prescription and actual performance.
4. Trainer editor: reuse WorkoutCalendar and WorkoutEditor with scoped client identity; bulk date copy/paste, programs, import and templates.
5. Stripe recurring billing: server-side checkout and webhook validation, trainer tiers, trial, seat limits, subscription cancellation and read-only grace mode. Do not reuse consumer Pro entitlement.
6. Notifications, audit history, monitoring, responsive polish, integration tests and rollout.

## Security/acceptance requirements
- Client must explicitly accept invitation using their signed-in verified email.
- Email matching must not leak whether an account exists.
- Trainer cannot view any calendar before consent, or after revocation.
- No trainer can modify another trainer's relationship or client.
- Subscription entitlement enforced on server for mutations; no client-only gating.
- Complete workouts preserve immutable prescription and client-reported actuals.
- Test cross-account RLS, stale sessions, offline sync, conflicts and account deletion.
- Database migration reviewed and applied to staging before portal use.

## Scope of this foundation
- Adds database schema for trainer profiles and consented client invitations.
- Adds an initial /trainers portal for signup, invitations and acceptance.
- **Not yet** full calendar sharing, workout assignment or payments. Those require phases 2–5.
