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
