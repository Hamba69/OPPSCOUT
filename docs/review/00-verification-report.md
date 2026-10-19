# OppScout verification report

## Time-sensitive

- The snapshot contains two verified Commonwealth records, both marked `open` with a `2026-10-20T15:00:00` deadline: [catalog-snapshot.json](../audits/catalog-snapshot.json). Confirm the application portal is still accepting submissions on 20 October before directing seekers there.
- The snapshot contains a verified Chevening record marked `open` although its deadline is `2026-10-06T11:00:00`. The official Chevening page says applications are closed. This record needs immediate closure or a verified replacement.
- The UNICEF record is present under the title `Digital Impact Manager, P-4, Kampala`, with a 6 October deadline in the snapshot; the official UNICEF page timed out during this check. Treat its live status as unverified.

## Scope and evidence rules

This is a repository verification at commit `b3bcf65d5543e779618ee49cc52a814743e59504`, run on 18 October 2026. The plan source was converted from `D:\PROBOOK\finwa\OppScout_Technical_Review_Plan_v2.docx` into [plan-source.md](plan-source.md). `.env.example` and `.env.local` exist; their values were not read or written. The local environment exposed no `DATABASE_URL` or `DIRECT_URL` process variables. `npm run check:rls` loaded local configuration but could not reach Supabase, so all live database claims remain UNVERIFIABLE.

No files under `src/`, `prisma/`, `supabase/`, `public/`, `.github/`, config, or environment files were changed.

## Verdict summary

| Label | Count |
|---|---:|
| CONFIRMED | 26 |
| PARTIAL | 8 |
| REFUTED | 2 |
| STALE | 0 |
| UNVERIFIABLE | 7 |
| NOT-A-CLAIM | 1 |

| Severity | Count |
|---|---:|
| BLOCKER | 3 |
| MAJOR | 7 |
| MINOR | 10 |

### Top blockers

1. Production counts, RLS state, live review queue, and current deadline state cannot be verified without a read-only database connection.
2. Existing `check-rls.ts` depends on a live database and the only current connection attempt failed; no offline policy-state substitute is implemented.
3. Chevening is a stale open record with a past deadline, which can misdirect seekers.
4. The plan's community and source-supply assumptions remain unmeasured; the 125-hour model is arithmetic over stated assumptions, not a pilot result.

## V0 baseline

| Check | Result | Evidence |
|---|---|---|
| Commit | PASS | `git rev-parse HEAD` = `b3bcf65d5543e779618ee49cc52a814743e59504` |
| Node / npm | PASS | Node `v24.13.0`, npm `11.6.2`, `package-lock.json` present |
| Prisma / Next | PASS | `@prisma/client` and `prisma` `^6.19.3`; `next` `^16.3.1` in [package.json](../../package.json) |
| Prisma validate | PASS | `npm run prisma:validate`: schema valid |
| Typecheck | PASS | `npm run typecheck`: exit 0 |
| Lint | PASS with warnings | `npm run lint`: 0 errors, 2 unused-variable warnings |
| Unit/contract tests | FAIL baseline | `npm test`: 84 passed, 2 failed, 26 files; exact failures are listed below |
| E2E | NOT RUN | Playwright requires a running application and was not needed to establish the offline findings |
| RLS | UNVERIFIABLE | `npm run check:rls` could not reach `aws-0-ap-southeast-1.pooler.supabase.com:6543` |

The repository has 17 Prisma models, 29 test files, 14 Prisma migration directories, and one Supabase migration file. Relevant post-snapshot history includes changes on 3, 7, 12, and 14 October 2026; the worktree is dirty before this review.

### Baseline failures and plan overlap

| Test | Failure | Touches planned code? |
|---|---|---|
| `auth proxy > redirects signed-out protected route /dashboard/:path*` in [auth-proxy.test.ts](../../tests/unit/auth-proxy.test.ts:15) | Expected `/login`, received `/organizations/login` | No. The plan changes audience, ingestion, trust, review, and schema surfaces, not auth proxy routing. |
| `password recovery > starts in signup mode when requested` in [auth-recovery.test.ts](../../tests/unit/auth-recovery.test.ts:28) | Signup-mode assertion failed | No. The plan does not change password recovery. |

These failures remain baseline issues and were not repaired as part of this review.

## Offline catalogue verification

`npx tsx scripts/review/verify-all.ts` reproduces these values from [catalog-snapshot.json](../audits/catalog-snapshot.json); raw output is in [snapshot-verification.txt](evidence/snapshot-verification.txt).

| Claim | Computed | Verdict | Evidence / correction |
|---|---:|---|---|
| S1 total | 115 | CONFIRMED | Snapshot `total` and row count |
| S2 state counts | 10/15/41/37/11/1 | CONFIRMED | `verify-snapshot.ts`; state keys match the register |
| S3 categories | 58 jobs, 29 grants, 12 fellowships, 10 scholarships, 5 internships, 1 consultancy | CONFIRMED | Recomputed from rows |
| S4 Uganda-located | 57 located; 52 pending across all lifecycle states | CONFIRMED | Under the plan definition, 21 of those pending records are active (`open` or `closing_soon`) |
| S5 verified open | 15: 6 grants, 3 scholarships, 3 internships, 3 jobs | CONFIRMED | Recomputed from status and verification fields |
| S6 source split | 103 scraped, 12 org_submitted | CONFIRMED | Recomputed |
| S7 pending Uganda records | 21 pending active, 20 jobs | CONFIRMED | Recomputed with the plan’s `open` or `closing_soon` definition; source split is 12 unjobnet, 5 alljobspo, 3 advance-africa, 1 pandemic-fund |
| S8 organisations | 79; largest exact name has 6 | CONFIRMED | Exact and normalized names both yield 79 |
| S9 advance-africa | 16 of the plan's 63 non-flagged active records | CONFIRMED | The plan's denominator excludes the one `flagged/open` row; advance-africa contributes 16 active records |
| S10 open count | 48 pending active and 63 operational open records | CONFIRMED | 37 pending/open + 11 pending/closing_soon = 48; excluding one flagged row from 64 active-status rows gives 63 operational |
| S11 grants | 29 of 115 | CONFIRMED | Recomputed |
| S12 non-Uganda verified | 11 of 12 snapshot records have a null or future deadline on 18 October | REFUTED / MINOR | The snapshot yields 11 after Chevening’s deadline, not 8; the live production count remains unavailable |
| S13 external dates | Chevening closed confirmed; Commonwealth and UNICEF not fully confirmed | PARTIAL / BLOCKER | Official Chevening page confirms closure; CSC pages fetched but did not expose the 20 October date; UNICEF page timed out |

The plan defines an absolute pre-gate cap of 10 listings per origin, with queue deprioritization at 8; it does not apply a fractional 5% calculation to the current 115-row catalogue. After the launch gate, the 5% share is a KPI alert.

### Internal inconsistency: status-active versus Live denominator

Section 2.1 defines `Live` as verified, status `open` or `closing_soon`, and deadline null or future. Its “63 open” concentration arithmetic is instead 63 non-flagged rows with active lifecycle status, including 48 pending records. Those are not “Live” by the plan’s own definition. Preserve 63 for the snapshot’s operational status-active count, but calculate launch coverage and post-launch concentration using only the strict `Live` predicate.

## Newly verified plan sections

### Guardrails and definitions (section 2.1)

The plan defines `Live` as verified with status `open` or `closing_soon` and a missing/future deadline. It defines the launch guardrails as 200 live Uganda-relevant listings, at least 150 performed in Uganda, no origin above 10 at the 200-row gate, at least 20 distinct organisations (about 60 planned), no more than 20 organisational grants, and no more than 25% `org_attested` provenance. The plan’s 63 operational status-active denominator is consistent with excluding the one `flagged/open` row from the 64 raw active lifecycle rows, but it includes pending rows and is not the strict `Live` denominator.

### Sections 5.4–5.8

- **5.4 community intake:** four lanes (public/seeker, helpers, direct employers, partners) feed leads, not verified listings. The pipeline requires official-link tracing, per-user daily caps, 48-hour triage, 7-day expiry, helper quality/concentration measurement, and 30-day screenshot deletion. A two-week pilot (5 helpers, 10 employers) is required to test the unmeasured 90-of-200 community assumption. The plan bans aggregator pages as published source URLs and makes adapters permissioned.
- **5.5 trust:** organization verification has four evidence checks; per-listing checks include official-domain/app-system comparison, shortener/chat/file-share flags, fees/sensitive-data signals, consistency, deadline, duplicate and original-source review. Origin intake is deprioritized at 8 and held at 10. Re-ingestion rules cover unchanged fields, changed description/deadline, changed apply/source links, and suspicious patterns. Reporting has immediate reversible hiding for payment-pattern matches, a second-independent-report threshold within seven days, and stricter handling for trusted posters; these require false-positive and abuse controls.
- **5.6 audience/location:** the gate fails closed for null audience, unknown remote eligibility, and unclassified onsite locations; it applies to web and USSD. The `residenceTerms` rule makes Gulu satisfy Uganda-level rules while keeping town-only rules strict. The plan explicitly chooses not to collect nationality even though citizen/national audience labels are shown with badges; the implementation should not imply verified nationality.
- **5.7 scale:** SQL feed prefiltering, bulk lifecycle updates, date-only deadlines at end-of-day EAT, weekly link checks, database fingerprint/canonical URL dedupe, and a monthly AI spend ceiling are required. Current product behavior has not implemented these proposed changes.
- **5.8 metrics:** targets include 200 live, 150 performed in Uganda, 10-per-origin until gate then under 5%, 20 organisations minimum (about 60 planned), 100% provenance, ≤25% `org_attested`, funnel and time-to-live, source health, 95% report response within 24 hours/100% within 72 hours, <2% dead links, and 100% audience-matrix correctness.

### Appendices

- **Appendix A:** the four new models and enums validate in [appendix-a-scratch.prisma](evidence/appendix-a-scratch.prisma) with Prisma 6.19.3. This validates draft syntax and indexes, not production relations or RLS policies.
- **Appendix B:** rows 1–12 pass the faithful audience-gate harness; row 9 and row 12 also exercise the proposed location-credit changes. Rows 13–16 pass contract checks for location, re-ingestion, changed-link, and origin-cap behavior. These are scratch/contract checks, not tests of production features that are not implemented. Output is reproduced by [verify-appendix-b.ts](../../scripts/review/verify-appendix-b.ts).
- **Appendix C:** the listed repository surfaces agree with the plan: Prisma/Supabase migrations, `check-rls.ts`, domain/validation, all three adapters, matching, ingestion, trust, AI/config, routes/admin, flags/SLOs, scripts, and docs.

The production Prisma schema also passes `npm run prisma:validate`. The Appendix A scratch validation does not prove live database RLS; that remains UNVERIFIABLE without the database.

## Findings F1-F13

| ID | Verdict / severity | Evidence and assessment |
|---|---|---|
| F1 | CONFIRMED | Snapshot state/category counts reproduce the supplied breakdown. |
| F2 | CONFIRMED | Source split and pending-Uganda counts match when `open` includes `closing_soon`: 21 active records, 20 jobs, 12/5/3/1 source split, and 11 organizations. |
| F3 | PARTIAL / MINOR | Both import scripts refuse stale application dates; the audit script proves reachability only and no archived output establishes 93/100. |
| F4 | CONFIRMED | `runShadowDiscovery` accepts one URL and organization ID at [pipeline.ts](../../src/services/ingestion/scraping/pipeline.ts:10), and stores candidates through the Supabase Storage adapter. No promotion function was found in the scraping service. |
| F5 | REFUTED / MAJOR | [schema.prisma](../../prisma/schema.prisma:103) contains 17 models, including the ten named telemetry/document models plus the original seven. [deviations.md](../deviations.md) records corrections rather than “no deviations.” |
| F6 | CONFIRMED | [schema.prisma](../../prisma/schema.prisma:103) has no nationality, residence-country, or abroad-openness field. |
| F7 | CONFIRMED | [canonical.ts](../../src/services/matching/orbit/canonical.ts:97) gives exact/parent/commuting matches and otherwise zero; [engine.ts](../../src/services/matching/orbit/engine.ts:108) grants remote full credit; the plan confirms location is weighted 10 of 85. |
| F8 | CONFIRMED / MAJOR | [hard-gates.ts](../../src/services/matching/rule-based/hard-gates.ts:73) compares normalized equality. The Rhodes rule allows Kampala, Uganda, Tanzania, Rwanda, South Sudan, Burundi, and Kenya in [seed-catalog.ts](../../src/data/seed-catalog.ts:135); `Gulu` fails it. |
| F9 | PARTIAL / MAJOR | [automated-signals.ts](../../src/services/trust/automated-signals.ts:4) checks suspicious text, HTTPS, deadline, and duplicate. [checklist.ts](../../src/services/trust/checklist.ts:4) has six English patterns including the over-broad `mobile money` rule. [report.ts](../../src/services/trust/report.ts:4) flags immediately and records one event; there is no `ListingReport` model. |
| F10 | CONFIRMED | [org-submission/index.ts](../../src/services/ingestion/org-submission/index.ts:14) requires verified organization status; [manual/index.ts](../../src/services/ingestion/manual/index.ts:23) creates pending records. |
| F11 | CONFIRMED / BLOCKER | [manual/index.ts](../../src/services/ingestion/manual/index.ts:16) can set a duplicate verified record to `pending` or `flagged`. This is a direct code proof; a memory-adapter reproduction remains a required remediation test. |
| F12 | PARTIAL / MAJOR | [deduplication.ts](../../src/services/ingestion/deduplication.ts:21) scopes candidates by organization and origin and compares title similarity/deadline window, with no URL canonicalization. Freshness has source-dependent stale thresholds in [freshness.ts](../../src/services/ingestion/freshness.ts:21); the exact “30-day” assertion is not established here. |
| F13 | PARTIAL / MAJOR | [ai-rules.ts](../../src/config/ai-rules.ts:1) confirms 1,200 tokens, 20 seconds, and a default model. The extractor’s structured validation and untrusted-text handling are present, but evidence quotes and a monthly spend ceiling are absent. |

### Protections and additional findings

- Feature flags in [feature-flags.ts](../../src/config/feature-flags.ts:1) are constants, not environment-driven; several existing flags are enabled (`phaseOneCore`, `organizationSubmission`, `trustReview`, `providerTools`, `kpiDashboard`, `aiComparison`, `scrapingShadowMode`, `ussd`, `monetizationReadiness`). New rollout flags must default false.
- RLS verification is live-only and currently unreachable. The required ten model names are present in both the schema and the check list, but actual database state is UNVERIFIABLE.
- Review notes and reviewer IDs exist on `Opportunity` in [schema.prisma](../../prisma/schema.prisma:171).
- `scripts/review-pending-catalog.ts` and `scripts/import-reviewed-jobs.ts` should be checked individually for dry-run defaults before any later execution; this report does not run imports.
- Additional scale/security risk: [pipeline.ts](../../src/services/ingestion/scraping/pipeline.ts:14) fetches a caller-supplied URL. The current HTTPS check is not sufficient by itself to prove SSRF safety; future lead/adaptor fetches need DNS/private-network protections, redirect policy, size limits, and audit logging.
- Additional product risk: the admin portal is password-session based; every new review endpoint must continue using `requireAdminPortalApi`, same-origin checks, rate limits, and no secret-bearing client code.

## Internal logic and merit review

| Topic | Assessment | Class |
|---|---|---|
| Four new tables versus extending `Opportunity` | Separate provenance, reports, and review state preserve invariants; putting all states on `Opportunity` would make deduplication and audit history ambiguous | MUST |
| Community-first 90-of-200 assumption | No pilot evidence is available; use a measured intake funnel and failover to organization/direct-source outreach after two weekly checkpoints | SHOULD |
| 5% origin cap | A hard block can hold valid supply; use a soft warning plus review hold only when the cap would be exceeded, never admit filler to satisfy mix | SHOULD |
| `org_attested` provenance | Useful but fraud-prone; require verified domain/email and retained evidence before trust credit | MUST |
| Fail-closed audience gate | Correct default, but shadow mode and an impact diff are required before enabling because it can hide existing active records | MUST |
| No nationality collection | Avoids a sensitive field, but audience badges must describe listing criteria rather than infer seeker nationality | MUST |
| 125-hour review capacity | Plausible only with prefilled worksheets and automated duplicate/domain checks; 15 minutes per lead is an assumption, not evidence | SHOULD |
| Two-report and payment-pattern rules | Two reports reduce abuse but delay action; immediate hold should be reversible, evidence-backed, and rate-limited | MUST |
| Scope for 200-listing goal | Correctness, audience gate, provenance, review queue, RLS, ingestion safety, and launch checker are MUST; helper programme, high-frequency link checks, and SQL scale work can follow | LATER |

## External and legal facts

Official sources fetched: Chevening confirms applications are closed at [chevening.org](https://www.chevening.org/scholarship/uganda/). CSC pages were reachable but did not expose the claimed 20 October date in the fetched content: [Master's](https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/) and [PhD](https://cscuk.fcdo.gov.uk/scholarships/commonwealth-phd-scholarships-for-least-developed-countries-and-vulnerable-states/). UNICEF careers requests timed out. Current Anthropic availability, Vercel/Supabase quotas, Actions scheduling, schema.org, Prisma deployment behavior, and legal requirements need source-specific confirmation before implementation. Legal questions about the Data Protection and Privacy Act, copyright, defamation, registration, and submission terms are for counsel; this report makes no legal conclusion.

## Capacity and launch date

The plan’s eight-week roadmap starts when D1 is approved. Its stated review model is 125 hours:

`33.3h` prefilled-record review (`200 × 10 min`) + `56.25h` community tracing (`225 × 15 min`) + `5.8h` adapter triage (`70 × 5 min`) + `30h` organization verification (`60 × 30 min`) = **125.4 hours**, rounded to 125.

At the plan’s stated three reviewers and roughly 5–6 hours each per week, capacity is 15–18 hours/week. `125.4 ÷ 16` midpoint hours/week = **7.84 weeks**, which rounds to the plan’s eight-week roadmap. No human reviewer throughput was measured in this repository run, so this is a plan-derived capacity calculation, not an empirical forecast. From 18 October 2026, the earliest date consistent with the roadmap is **13 December 2026** (eight weeks), not 25 November. The main date risk is the unmeasured community lead conversion and reviewer throughput; the plan itself requires replacing those assumptions after the week-two pilot.

## What remains unverified

Provide a read-only `DATABASE_URL` or owner-run SQL output. The owner should run the exact live commands in [04-decisions-and-questions.md](04-decisions-and-questions.md), without sharing credentials. Needed evidence includes current catalogue counts, RLS/policy state, live deadlines, 21-record trace results, measured week-two funnel capacity, and the 20-job category split.
