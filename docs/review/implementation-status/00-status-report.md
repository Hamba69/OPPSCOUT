# OppScout implementation-status audit

## Headline

At commit `7588d39f42d19f5f6cb98969a13c387cdf4f161c` on branch `main`, 16 of 20 requirements are level 0, 4 are level 1, 0 are level 2, 0 are level 3, and 0 are level 4. Weighted engineering completeness is **5.0%**.

Weights used: level 0 = 0%, level 1 = 25%, level 2 = 50%, level 3 = 75%, and level 4 = 100%. The score is the arithmetic mean of the per-row level weights, computed by parsing [01-status-register.csv](./01-status-register.csv); it measures engineering implementation only, not production readiness. Every row above level 0 records wiring, adapter, migration, RLS and test evidence, or explicitly says MISSING/not applicable.

- Level 0: 16
- Level 1: 4
- Level 2: 0
- Level 3: 0
- Level 4: 0

No requirement is level 4: there is no production evidence for any planned capability. The four level-1 items are narrow existing sub-requirements only; none is a complete plan feature. The remaining level-0 items include absences, unverifiable live outcomes, and the two known active defects. The current implementation is not “0 of N implemented” because the register contains level-1 evidence. The earlier report described 0/16 fully implemented with 6 partial items; this corrected, row-based register has 4 narrowly credited sub-requirements among 20 rows and no fully implemented plan feature. The broad conclusion is unchanged, but the old figures and scoring are not comparable and should be retired.

## Audit scope and baseline

- Current HEAD: `7588d39f42d19f5f6cb98969a13c387cdf4f161c`; branch: `main`.
- Previous audit baseline referenced by the request: `b3bcf65d5543e779618ee49cc52a814743e59504`. Current HEAD is later; intervening commits are recorded in `evidence/branch-and-history.txt`.
- The initial read-only worktree inspection before audit edits was clean. At generation time, current uncommitted entries are recorded in `evidence/branch-and-history.txt`; changes under the audit directories are audit work in progress, not shipped product implementation.
- This audit writes only to `docs/review/implementation-status/` and `scripts/review/status/`. No product, schema, migration, test, config or environment file was changed.
- Original `OppScout_Agent_Implementation_Status_Audit_Prompt.md` is not present in this repository. This rerun follows the supplied corrections and the checked-in plan and prompt sources; no unsupported requirements from the missing file are invented.
- Time-sensitive note from the plan: the Commonwealth Master's and PhD scholarship deadline was stated as 20 October 2026. Current catalogue or live-record status is UNVERIFIABLE offline; the plan's date should be checked against the official listing before action.
- Runtime/toolchain: Node v24.13.0, npm 11.6.2, Prisma ^6.19.3, Next.js ^16.3.1. Environment-file names found (values never read or printed): .env.local, .env.example.
- Database variable names set in this process (values suppressed): none.

## Partial matches (level 1 only)

- **C2 — employer submission:** verified organization staff can submit an HTTPS opportunity, which goes through existing ingestion and is pending review. This covers only the already-existing direct-submission sub-requirement; the plan's Lead lifecycle, employer post form, source provenance, cap and fast lane are absent.
- **T1 — basic review checklist:** reviewers can record source authenticity, fee/sensitive-data checks, deadline plausibility and duplicate checking. This is a checklist, not the plan's automated domain verification or trust routing.
- **T3 — report intake:** a report can immediately flag an opportunity and create an event. The plan's ListingReport entity, two-independent-reporter threshold, priority and response clock are absent.
- **T4 — admin review queue:** the existing admin queue can review opportunities and approve/reject them. It is not the planned lead/report queue or its prioritization and SLA.

These partial matches are not listed as “done.” F8 and F11 receive level 0 because their bugs remain present.

## F11 and F8 real-code execution

The F11 reproduction calls the production `ingestManualOpportunity` with a real `MemoryRepository` and an initially verified listing. Output: [F11 execution](./evidence/f11-execution.txt). The identical re-ingest and changed-link re-ingest both leave the listing pending. The affected product paths are manual/admin opportunity submission through `POST /api/v1/opportunities` and organization submission via `submitOrganizationOpportunity` through that same route. Organization submission also requires a verified organization and one of its dashboard users. The standalone `scripts/import-reviewed-jobs.ts` uses direct Supabase writes and does not call the defective function. A verified listing can be removed from visible verified results by either affected API path.

The F8 reproduction calls the production `evaluateHardGates` for location Gulu with residence context Uganda and the allowed values Uganda or Kampala. Output: [F8 execution](./evidence/f8-execution.txt). It rejects eligibility because the function compares only `profile.location` by normalized equality. This is a current false-negative matching risk, not an authorization bypass. The production profile schema has no residence field.

## Dangerous partial states: existence, executability and current risk

| State | Code path exists? | Can it run today? | Present-day risk | Evidence |
|---|---|---|---|---|
| F11 duplicate ingestion status rewrite | Yes: `ingestManualOpportunity`. | Yes: the manual/admin API and organization API paths reach it; the standalone reviewed-jobs script bypasses it with direct Supabase writes. | A verified item can become pending or flagged on duplicate re-ingestion, reducing visibility without a human decision. | `src/services/ingestion/manual/index.ts:16`; `src/app/api/v1/opportunities/route.ts:39`; `src/services/ingestion/org-submission/index.ts:16`; [F11 execution](./evidence/f11-execution.txt). |
| F8 location programme rule | Yes: hard gates are wired into matching/feed. | Yes: the audit executed the actual function offline. | A Gulu applicant is rejected for a Uganda-level rule when permitted terms are Uganda/Kampala. | `src/services/matching/rule-based/hard-gates.ts:77`; [F8 execution](./evidence/f8-execution.txt). |
| Single suspicious-listing report | Yes: report endpoint calls the service. | Yes: current route updates listing status and writes an event. | One report can flag a listing; there is no report record lifecycle, independent-report rule, or response-time measurement. | `src/app/api/v1/reports/route.ts:11`; `src/services/trust/report.ts:11`. |
| Organization post submission | Yes: organization submission service and opportunities route. | Yes, subject to signed-in verified staff authorization and HTTPS source URL. | Submissions enter the defective shared ingestion function, so a duplicate can downgrade an existing verified listing. | `src/services/ingestion/org-submission/index.ts:16`; `src/app/api/v1/opportunities/route.ts:38`. |
| Audience gate | No production `audience.ts`, flag, or feed/USSD wiring. Appendix-B harness is audit tooling only. | No; there is no production audience predicate to invoke. | Existing matching/feed can include opportunities without the plan's fail-closed applicant-scope check. | `src/services/matching/audience.ts` absent; `src/config/feature-flags.ts` has no audience flag; `src/services/matching/feed.ts:70`. |
| New Source/Lead/report ingestion pipeline | No planned models, adapter methods or lead route. Shadow discovery is not a substitute. | No for the plan workflow. | Leads cannot be triaged through the planned lifecycle, traced, or governed with per-source caps. | `prisma/schema.prisma:103` model inventory; `src/lib/repository/types.ts:117`; `src/services/ingestion/scraping/pipeline.ts:10`. |

## Branches and uncommitted work

Branches from `git branch -a`: [recorded in evidence](./evidence/branch-and-history.txt).

Commits on other branches touching plan paths, not merged into `main`:

- Exists on branch backup-before-workflow-rewrite, not merged into main: 8449ea21c4847e86dd6958f162f903d4a350b912
- Exists on branch backup-before-workflow-rewrite, not merged into main: 4bb77c1213f181167d5d4db5e159c25e6a94df15

At generation time, uncommitted entries are the audit artifacts and audit script changes listed in [evidence/branch-and-history.txt](./evidence/branch-and-history.txt); they are in progress, not shipped product work. No product, test, migration, config or environment changes outside the two permitted directories were found: `(none)`.

Status labels use ABSENT for features not built, PARTIAL only for the four narrow existing sub-requirements, ACTIVE_DEFECT for F8/F11, and UNVERIFIABLE for production metrics. No item is labelled REGRESSED: inspected `git log` history contains no evidence that the planned F8/F11 fixes or production audience gate existed and were later removed.

## Audit tooling (not product implementation)

`scripts/review/status/verify-status-all.ts` generates this audit, the register, validation log and evidence. The earlier Appendix B harness and launch-gate checker are not product features and are not credited in the register. The generator opens no database connection unless `AUDIT_DB_URL` is set; it never prints the URL. Without that variable, database-dependent counts print UNVERIFIABLE and do not affect the script exit status.

## Validation

Confirmed expected baseline: 2 failed | 24 passed (26); 2 failed | 84 passed (86); both known failures match the supplied test names.

tsconfig include paths are src and generated .next types only; scripts/review is excluded, so its files cannot cause a TypeScript typecheck failure.

- `npm run prisma:validate`: exit 0.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0; warnings are shown in the captured evidence, no lint errors.
- `npm run test -- --reporter=dot`: exit 1; 2 failed | 24 passed (26); 2 failed | 84 passed (86).
- Combined previous run's final exit code cannot be assigned to either subcommand because only the final chained result was recorded. Separate current executions both pass; no TypeScript failure is attributable to `scripts/review/`.

See [04-validation-log.md](./04-validation-log.md) and individual command output in [evidence/](./evidence/).
