# Validation log

## What was checked

- Repo baseline and branch state
- Prisma validation
- Typecheck
- WIP review scripts under scripts/review/status
- RLS and feature flag evidence
- Launch gate status with live database access constraints

## Fresh evidence

- `npm run prisma:validate` ran successfully.
- `npm run typecheck` ran successfully.
- `npx tsx scripts/review/status/verify-status-all.ts` was attempted, but the environment does not expose a live database for the launch gate, and the command surfaced a Postgres connection refusal related to localhost:5432.
- This means the schema and repo-state audit is valid, while the live launch-gate proof remains unverified rather than passed.

## Conclusion

The repo’s static code review supports the gap findings above. The live operational launch gate cannot be signed off without a read-only DATABASE_URL or deployment output from the owner.

## B1 — Evidence baseline and defect fixes

- Branch `plan/b1-evidence-baseline` is based on `plan/b0-foundation`; both B0 commits are ancestors. The original `E:\OPPSCOUT` checkout is on `main` with its pre-existing `next-env.d.ts` change untouched.
- `npm run check:free-disk`: PASS. The check reports C: at 13.81 GB free and E: at 96.68 GB free, covering the active worktrees, temporary/build output, and Docker-data path. It warns below 3 GB on any checked drive.
- `npx tsx scripts/review/verify-all.ts`: PASS. Snapshot evidence remains historical: 115 rows, 57 Uganda matches, 52 pending Uganda records across statuses, 21 pending active Uganda records (20 jobs), 79 organizations, and largest exact organization group 6. The worksheet is not a completed trace.
- The focused F11/F8/F7 regression suite was run before the fixes and failed in all four new assertions: the verified duplicate became `pending`, Gulu failed the Uganda-level rule, the Jinja multi-place location scored 0, and the UK scholarship had no location match. After the fixes, all 20 tests across `ingestion.test.ts`, `matching.test.ts`, and `orbit-matching.test.ts` passed. The suite also confirms changed apply links return to pending and suspicious duplicates remain flagged.
- `npm run typecheck -- --incremental false`: PASS. Targeted ESLint for changed application and test files: PASS.
- `npm run prisma:validate`: PASS with non-connecting loopback placeholders for `DATABASE_URL` and `DIRECT_URL`; the initial invocation without them failed with P1012. No connection was made.

### Migration-preservation attempt

- `scripts/review/impl/local-db.ps1 -Action Status` reported that the local Supabase stack was not running.
- The requested `local-db.ps1 -Action Start -Reset` was attempted. It could not reach the Docker Desktop Linux-engine named pipe; Docker Desktop Service was stopped and could not be started under this session’s permissions. The local helper therefore could not load `LOCAL_DATABASE_URL`.
- The exact `npm run impl:db-preflight -- --variable=LOCAL_DATABASE_URL` check could not run because Status did not provide a connection URL. No database reset/seed/migration/comparison was claimed; the real field-by-field preservation test remains unrun and must precede B2 migration application.

### Decision and history notes

- D1 and D2 plus D3–D10 are recorded as approved. D5’s remaining owner action is to supply reviewer names and the helper roster; names remain `OWNER-SUPPLIED: TBD` placeholders.
- The plan’s earlier B1 label means evidence baseline only; the final prompt makes F11/F8/F7 fixes part of B1. The evidence baseline remains a B1 prerequisite, and all three defect fixes are included in B1.
- The pushed B0 commit trailers are malformed and were left unchanged. New commits use the correct Copilot co-author trailer.

## B2 — Domain foundation

- Added the four D1-approved models and enums, profile residence defaults, organization trust/domain fields, and opportunity audience/provenance/re-ingestion fields. The generated additive migration also backfills organization domains and enables RLS on the new tables.
- Added repository contracts and create/read/update support across Prisma, Supabase, and memory adapters. Organization domains are normalized from official links on create/update; automated scraping and AI matching remain disabled by default.
- Manual duplicate ingestion records `lastSeenAt` and sets `needsRecheck` for suspicious content or changed application links. The verified-listing, changed-link, and suspicious-content cases are covered in `ingestion.test.ts`.
- Focused B2 and ingestion tests: **7/7 passed**. Typecheck, targeted ESLint, Prisma validation with non-connecting loopback placeholders, and generated-migration comparison passed.
- The owner supplied a separate dev Supabase project for the real preservation and RLS rehearsal. The environment available to this run did not contain `DEV_DIRECT_URL` or `DEV_DATABASE_URL` (presence-only check; no values were read or printed). Therefore no remote preflight, reset, migration, seed, snapshot comparison, or RLS query was attempted; no dev database was written. These checks remain pending until the owner-provided variables are present. This is not the Docker/local-stack blocker.
- Recorded attempts: `npm run impl:db-preflight -- --variable=DEV_DIRECT_URL` exited **1** (`DEV_DIRECT_URL is missing`); the guarded dev preservation runner exited **1** at its target guard for the same reason, before reset or migration; `npm run check:rls` exited **1** because `DATABASE_URL` was missing before it could connect. These are blocked attempts, not migration-preservation or RLS results.
- Once available, use only `DEV_DIRECT_URL` (session pooler, port 5432): run the guarded preflight, reset only that dev project’s `public` schema, use `prisma migrate deploy` through the migration before B2, seed at that schema, deploy B2, compare every snapshot field, then run `npm run check:rls`. Do not use `DEV_DATABASE_URL` for migrations and do not apply `supabase/migrations` mirrors. The rehearsal is development evidence; the owner’s production RLS run remains authoritative.
