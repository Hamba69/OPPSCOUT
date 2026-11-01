# Production check and pending catalogue review

Reviewed on **1 November 2026, Africa/Nairobi**. Machine timestamps are UTC (31 October late evening).

## Result

Nine opportunities were approved in the live Supabase catalogue after current official-source review. Every changed field was read back and compared successfully. Active, unexpired verified listings increased from **17 to 26**.

The deployed `https://oppscout-delta.vercel.app` login page loads a JavaScript asset containing the same Supabase hostname as the configured client used for these updates. This corroborates the project connection. Signed-in browser rendering was **not** verified; no user account was created or impersonated. Current source loads opportunities dynamically, admits open verified records, and provides their detail/application links.

| Approved programme | Corrected deadline, UTC |
| --- | --- |
| CIFAR Global Scholars | 4 November 2026, 17:00 |
| Dalai Lama Fellows | 11 November 2026, 22:00 |
| Harvard LEAD | 16 November 2026, 04:59 |
| Hong Kong PhD Fellowship Scheme | 1 December 2026, 04:00 |
| Yale World Fellows | 2 December 2026, 19:00 |
| Gates Cambridge | 8 December 2026, 23:59; earliest international course deadline, later courses close 6 January |
| Harvard Loeb Fellowship | 6 January 2027, 04:59 |
| Heinz Heinen Fellowships | 10 January 2027, 22:59 |
| Atlantic Fellows for Social and Economic Equity | 11 January 2027, 17:00 |

Descriptions, eligibility, location, delivery format and application instructions were rewritten from official sources. Yale's USD 20 application charge, Cambridge admission charges and possible Hong Kong university charges are disclosed. Dalai Lama's age rule is retained in text because it is assessed on 1 April 2027, whereas the app's machine age gate uses the application deadline. No universal eligibility or acceptance guarantee is implied.

## Review coverage

All **299 pending records** received a status/deadline triage. **31 records** received a programme/source-based disposition (nine approvals, twenty holds/closures, two duplicates). This is not a claim that all 299 sources were verified.

| Disposition | Records |
| --- | ---: |
| Approved | 9 |
| Closed using elapsed stored deadlines, without claiming source re-verification | 113 |
| Closed after programme review | 6 |
| Duplicate records closed, original IDs/relationships preserved | 2 |
| Source-reviewed but held pending | 14 |
| Already closed, unchanged | 41 |
| Not individually source-reviewed, unchanged | 114 |

The six programme-review closures comprise Frontline AIDS (fund closed), Maypole (next window opens January), three Edinburgh records (new-applicant entry stages closed), and TWAS Research Professors (stored deadline elapsed, but official source gives a later date; remains withheld pending deadline and institutional-applicant handling). Edinburgh's later main-application deadline is still relevant to previously invited applicants, not new entrants.

Holds include conflicting programme/portal cycles, unconfirmed exact deadlines, course-dependent dates, incomplete current vacancy evidence, and institutional programmes that the app cannot reliably exclude from individual matching. The two duplicate closures are the additional Dalai Lama and Yale entries. No approval was copied from an older review script.

## Quick production-readiness verdict: release blocked

| Check | Current result |
| --- | --- |
| TypeScript | Failed: `src/app/(web)/settings/page.tsx:20` references undeclared `searchParams`. A successful production build is not established. |
| Unit/contract tests | 84 passed, 2 failed across 26 files. Auth proxy test expects `/login` but gets `/organizations/login`; auth recovery test lacks the `toHaveAttribute` matcher. |
| Runtime dependency audit | 4 vulnerable dependency entries: Next.js critical; sharp, source-map-js and zod high. No automated dependency upgrades applied. Installed-tree advisories do not prove a deployed exploit. |
| Local production environment validator | Failed: database URL formats and seven missing variables. These are local settings, not a readout of Vercel production secrets. Some missing names relate to gated USSD/monetization features. |
| Database RLS checker | Could not connect to the configured PostgreSQL pooler. REST access worked; this does not establish RLS or migration health. |
| Deployed homepage and login | HTTP 200, Content-Security-Policy present. |
| Signed-out opportunities page | HTTP 307 to login. |
| Signed-out opportunities API | HTTP 401. |
| Signed-out admin review | HTTP 307 to unlock entry. Full admin authorization was not tested. |
| Script validation | Node syntax check, dry-run disposition review and repository diff whitespace check passed. All 144 database updates passed read-back comparison. |

Before a code release, repair the Settings compilation error, resolve the two test failures, upgrade vulnerable runtime dependencies with compatibility testing, and validate deployment configuration/RLS using reachable production infrastructure. A full build, browser journey, provider delivery, worker scheduling and production SLOs were outside this quick check and remain unproven. No application code was deployed during this review.

Additional catalogue correctness concerns: the UI currently labels all null deadlines “Open until filled”, including unknown or variable deadlines; applicant-scope enforcement is absent; some eligibility requirements are text-only. These are reasons to hold affected candidates rather than invent precise dates or promote institutional grants indiscriminately.

## Evidence and recovery

- [Source reviews](./source-reviews.json): per-programme official URLs, evidence and approval/hold reasons.
- [Pending triage](./pending-triage.json): disposition for every pending record.
- [Review plan](./review-plan.json): exact previous rows and applied field updates.
- [Apply journal](./applied.jsonl): each successfully applied record.
- [Verified result](./result.json): final counts and read-back result.
- [Before](./catalog-before.json) and [after](./catalog-after.json): catalogue snapshots.
- [Dated review script](../../../scripts/review-catalog-2026-11-01.mjs): dry run by default, Nairobi-date guard, full snapshot preflight, conditional updates and append-only apply journal. It refuses a second apply when the journal exists.

Updates were limited to pending catalogue records. Existing verified decisions, organisation relationships, saves, applications and publication timestamps were preserved. Recovery must use the per-record previous values and check for subsequent edits; do not blindly restore the whole snapshot. Pre-existing local changes in the implementation validation log and TypeScript build-info file were not reverted. No commit or push was performed.
