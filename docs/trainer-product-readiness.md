# Trainer product readiness

Updated 2026-11-26. Do not enable live billing or use real accounts for destructive tests.

- [x] My Training bulk approval calls atomic RPC (source verified at d317fb6170d22bafb130d4eabca82fb761b449b3; production READY for that commit). User reported bulk approval PASS; other entry points and notification counts still need verification.
- [x] Review page no longer exposes structured logging after approval; links to calendar instead (a4f62e9d4e6c83baa5b465834aaab58c9e685f2b). Single approval buttons disabled during any approval. Build and functional verification pending.
- [ ] Revision lifecycle: retain approved original until replacement approval; protect completed results; reconcile calendar import without duplicates or lost notes.
- [ ] Verify atomic approvals across all entry points and one notification per trainer using isolated fixtures.
- [ ] Official GL barbell notification/PWA assets and logout push privacy.
- [ ] Demo parity with fictional local data only.
- [ ] Test-mode billing webhook, entitlement/security/capacity enforcement, founder complimentary access; no live prices or charges.
- [ ] Simplified navigation, client settings, canonical inbox, landing SEO and conversion tracking.
- [ ] Verify builds and isolated end-to-end tests; final user acceptance checklist.

Body measurements excluded. Preserve unrelated changes. Update this checklist only with evidence; distinguish source inspection, deployment readiness and functional tests.
