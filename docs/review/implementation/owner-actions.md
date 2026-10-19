# Owner actions

These actions are ordered by what unlocks safe implementation and launch. Do not use production database variables for development or rehearsal.

| Order | When | Action and exact command/artifact | Unlocks |
|---:|---|---|---|
| 1 | Finding from B0 rehearsal | Resolve the duplicate migration path between Prisma migration `20261012093356_allow_unlinked_catalog_opportunities` and the tracked Supabase mirror `supabase/migrations/20261012093356_allow_unlinked_catalog_opportunities.sql` in a separately reviewed change. Do not edit or skip the mirror merely to make B0 green. Then reset the local Supabase stack and rerun `npm run impl:migration-rehearsal -- --apply`; see [db-status.md](./db-status.md). | A clean, reproducible migration chain across both migration systems. |
| 2 | Before enabling catalog cleanup | Confirm Chevening is closed (snapshot deadline 6 October 2026) and verify Commonwealth Master’s/PhD deadlines (snapshot says 20 October 2026 at 15:00; timezone must be confirmed against the official source). Supply approved record corrections or traced official URLs. | Safe expiry status and the first 21 Uganda-record tracing worksheet. |
| 3 | Before adapter enablement | Supply a ReliefWeb appname and identify permission owners for Fuzu and BrighterMonday; attach written permission evidence to each Source. Do not enable an adapter until approved. | Permissioned, fixture-tested source ingestion. |
| 4 | During weeks 0–1 | Name three reviewers (5–6 hours/week each), identify five pilot helpers, and supply the reviewed 100-organisation outreach list as CSV. | Review coverage and community-led intake. |
| 5 | Before public lead submissions | Obtain counsel’s advice on submission terms, takedowns, retention, privacy notice, and the scope of consent for submitted screenshots. Supply approved wording and policy version. Drafts are not legal conclusions. | Counsel-approved terms and takedown operations. |
| 6 | Before scam phrase or extractor claims | Supply real labelled scam examples and legitimate examples (30 each), plus the 50-item labelled screenshot extraction evaluation set. Do not provide invented/local-language examples. | Real precision/recall and extractor quality evidence. |
| 7 | Before email rollout | Verify the Resend sending domain and provide the verified sender identity. Until then, keep all product workflows usable without email. | Reliable notification delivery. |
| 8 | Before production migration | Trigger the existing nightly database backup workflow manually and confirm the backup artefact and a local restore drill. Use only the final migration commands in the handoff after reviewing each SQL file. | Recoverability before schema changes. |
| 9 | Before any production data change | Review generated dry-run change logs; then supply explicit approval to apply each command against production from an owner-controlled environment. The agent must never use production credentials. | Human-controlled migration and catalog changes. |
| 10 | Before launch | Review the six launch-gate conditions, their exact SQL and measured results in the final report. Enable flags in the documented sequence only after shadow results and reviewer sign-off. | Evidence-based rollout. |

**Branch policy:** `backup-before-workflow-rewrite` is a read-only reference and is not to be merged, rebased, cherry-picked wholesale, or deleted. The required plan PR stack starts from `main`.
