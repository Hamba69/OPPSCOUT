# Validation log

## V0 — orientation and baseline

- `git rev-parse HEAD`: PASS, `b3bcf65d5543e779618ee49cc52a814743e59504`.
- Node/npm: PASS, Node `v24.13.0`, npm `11.6.2`.
- `npm run prisma:validate`: PASS.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with two warnings and zero errors.
- `npm test -- --reporter=verbose`: FAIL baseline, 84 passed and 2 failed in 26 files. Failures are auth proxy redirect expectation and password recovery signup-mode behavior.
- `npm run check:rls`: UNVERIFIABLE; Supabase pooler was unreachable.
- No product/config/env file was edited.

## V1 — snapshot

- `npx tsx scripts/review/verify-all.ts`: PASS after correcting the verifier’s URL-host helper.
- Reproduced 115 rows, 57 Uganda matches, 52 pending Uganda records across statuses, 21 pending active Uganda rows (20 jobs), 63 operational active rows after excluding the one flagged row, 79 exact organizations, largest organization count 6.
- Output stored in [evidence/snapshot-verification.txt](evidence/snapshot-verification.txt).

## V2 — code findings

- PASS: named source files, schema models, existing flags, adapters, and RLS check list inspected.
- PASS: no promotion path found for shadow candidates in the inspected scraping service.
- UNVERIFIABLE: live RLS state and live execution of the plan SQL; the schema columns and offline definitions were checked.
- No reproduction script was added under `tests/`; the required proposed tests belong under review-only scope and product code was not changed.

## V3 — plan logic and appendices

- Converted `OppScout_Technical_Review_Plan_v2.docx` to [plan-source.md](plan-source.md).
- Verified sections 2.1, 5.4–5.8, the week-8 roadmap, D1–D10, and Appendices A–C.
- Identified denominator inconsistency: the plan’s 63 non-flagged status-active rows include pending items, but its `Live` definition requires verified status; use separate raw-active and strict-live counts.
- `npx tsx scripts/review/verify-appendix-b.ts`: PASS for all 16 plan rows in a scratch contract harness. Rows 1–12 exercise the proposed audience predicate; rows 9/12 additionally check location-credit behavior; rows 13–16 check proposed rule contracts. This does not claim unimplemented production code passes.
- `npx prisma validate --schema docs/review/evidence/appendix-a-scratch.prisma`: PASS with Appendix A enums, four models, and proposed model columns/indexes copied into a scratch schema.
- The production `npm run prisma:validate` PASS result remains the V0 baseline; it was not rerun in this request.
- Capacity arithmetic: 33.3 + 56.25 + 5.8 + 30 = 125.4 hours; at 16 hours/week this is 7.84 weeks, rounding to the plan’s eight-week roadmap and 13 December 2026 from 18 October.
- Unit baseline was not rerun: the recorded failures are `auth proxy > redirects signed-out protected route /dashboard/:path*` (`tests/unit/auth-proxy.test.ts:15`) and `password recovery > starts in signup mode when requested` (`tests/unit/auth-recovery.test.ts:28`). Neither overlaps planned workstream files.

## Self-validation

- `git status --short` checked after report generation. This task's additions/edits are confined to `docs/review/` and `scripts/review/`; the worktree also contains unrelated pre-existing modifications/deletions and user-provided files outside this scope, which were left untouched.
- `npx tsx scripts/review/verify-all.ts` is the reproducible offline check.
- Final claim-register check: 44 rows; verdict totals 26 CONFIRMED, 8 PARTIAL, 2 REFUTED, 7 UNVERIFIABLE, 1 NOT-A-CLAIM, and zero STALE; severity totals 3 BLOCKER, 7 MAJOR, 10 MINOR. The denominator inconsistency L11 is PARTIAL/MINOR.
- `git diff --check`: PASS. Baseline unit tests were not rerun, as requested.
