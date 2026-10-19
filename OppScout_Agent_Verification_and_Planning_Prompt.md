# OppScout: Verify and Plan Implementation of the Technical Review and Remediation Plan (Revision 2)

You are the repository agent for OppScout (GitHub: Hamba69/OPPSCOUT, branch main). Your job in this run has two parts. First, verify the claims in "OppScout Technical Review and Remediation Plan, Revision 2" (dated 16 October 2026) against the real repository and against its own internal logic. Second, turn the verified plan into a complete, sequenced, test-backed implementation plan that can be executed later in batches.

You build nothing in `src/`. You change no schema, no migration, no config and no production system. You produce evidence, verdicts, corrected numbers, and a plan.

Read this whole prompt before acting. Work in the order given. Do not skip a section because it looks tedious.

---

## 0. Urgent items to surface first

Today is 16 October 2026. The plan states that the Commonwealth Master's and PhD scholarships close on **20 October 2026**, and that Chevening and the UNICEF Digital Impact Manager post closed on 6 October 2026. Before anything else:

1. Check whether those records exist in the repo snapshot and what status and deadline they carry.
2. If you have web access, confirm the three dates from the official pages (Commonwealth Scholarship Commission, Chevening, UNICEF careers). If you do not have web access, mark them UNVERIFIABLE and say so.
3. Put a short "Time-sensitive" block at the very top of your verification report so the owner can act on the 20 October deadline without reading the rest.

---

## 1. Hard rules (non-negotiable)

1. **Read-only on the product.** Do not edit anything under `src/`, `prisma/`, `supabase/`, `public/`, `.github/`, or any config or env file. Do not run migrations. Do not run any script with `--apply`.
2. **Where you may write.** Only under `docs/review/` (reports, plans, CSVs) and `scripts/review/` (small read-only verification scripts). Create these folders if missing.
3. **No production access unless explicitly given.** If a read-only `DATABASE_URL` or equivalent is present in your environment, you may use it for SELECT statements only, and you must say so in the report. If it is not present, every claim that depends on live data is UNVERIFIABLE. Never guess a live number. Never invent a count.
4. **No scraping and no live crawling of aggregators or social platforms.** You may fetch official documentation pages (for example ReliefWeb API docs, Anthropic docs, Prisma and Supabase docs) to verify external facts. You must not fetch Fuzu, BrighterMonday, unjobnet.org, alljobspo, advance-africa, or any social platform.
5. **No legal conclusions.** Anything touching the Data Protection and Privacy Act 2019, copyright, defamation, registration with the Personal Data Protection Office, or submission terms is flagged "for counsel" with the precise question to ask. You may list what the code does with personal data. You may not say what the law requires.
6. **No fabricated evidence.** Every verdict must cite a file path with line numbers, a command and its output, or a URL. If you cannot cite it, the verdict is UNVERIFIABLE.
7. **No invented translations or local-language scam phrases.** The plan says those must be collected from real reports.
8. **Secrets.** Never print, log, or write a secret value. If you find one committed to the repo, report only the file path and the type of secret, and recommend rotation.
9. **Do not trust the plan.** Treat it as a set of hypotheses written by someone who read the code once. Your value is in finding where it is wrong, outdated, incomplete, or internally inconsistent. Agreement without evidence is a failure.

---

## 2. Inputs

- The plan: `OppScout_Technical_Review_Plan_v2.docx`. If it is not already in the repo, look in `/mnt/user-data/uploads/` or ask for it once, at the end, in the consolidated question list. Convert it to Markdown with `pandoc OppScout_Technical_Review_Plan_v2.docx -t gfm -o docs/review/plan-source.md` (or an equivalent tool) and work from that. A compact claim register is included in section 6 of this prompt so you are never blocked.
- The repository at its current HEAD. Record the commit SHA in the report.
- `docs/audits/catalog-snapshot.json` (dated 2 October 2026) and `scripts/audit-catalog.ts`.
- `docs/deviations.md`, `docs/LAUNCH_READINESS_100_USERS.md`, `prisma/schema.prisma`, `prisma/migrations/`, `supabase/migrations/`, `scripts/check-rls.ts`, `src/config/*`, `src/services/*`.

### Known project context (from the owner; verify each against the repo and flag any mismatch)

- Stack: Next.js, Supabase (Auth, Postgres, Storage), Prisma (was on ^6.19.3; an upgrade to Prisma 8 was requested for Prisma Console deployment, so determine the version actually in `package.json` and lockfile), deployed on Vercel.
- Hosting tiers: Vercel Hobby, Supabase Free, Supabase project in Singapore (ap-southeast-1). No custom domain yet. Resend is the only email provider, domain not yet verified. Every implementation choice must be checked against Hobby and Free limits (cron frequency, function duration, DB size, storage size, project pausing, no point-in-time recovery). The plan proposes GitHub Actions for workers; assess that against these limits.
- Recently decided or in-flight work that overlaps with this plan, which you must reconcile rather than duplicate: email and Google sign-in with seeker or provider account type; organisation accounts with an approval pipeline in admin; seeker research-paper uploads (max 5MB, a few formats) visible to organisations viewing matched seekers; a password-only admin portal opened by a hidden gesture, with user metrics, matching stats and CSV export; an open feedback page; Claude used only for match explanations; Sunbird AI Sunflower for three local languages; Mapbox map; nightly pg_dump backups via GitHub Actions. Find where each of these lives in the repo (or whether it is not yet merged) and state how it interacts with the plan's `Organization`, `trustedPoster`, `verifiedAt`, `StoredDocument`, `Feedback`, `AdminAccessLog` and admin review screen proposals.

---

## 3. Operating protocol

Work in the batches below. At the end of each batch, run its exit checks, write its output files, and append a short entry to `docs/review/05-validation-log.md` (what you ran, what passed, what failed, what you could not run and why). Do not start a batch until the previous batch's exit check passes or its failure is documented.

Verdict labels (use exactly these):

- **CONFIRMED**: evidence matches the claim.
- **PARTIAL**: the claim is right in part. State precisely which part is wrong.
- **REFUTED**: evidence contradicts the claim. Give the correct fact.
- **STALE**: was true at the snapshot or commit the plan cites, no longer true at HEAD.
- **UNVERIFIABLE**: needs production data, a secret, a person, or a legal opinion. Say exactly what is needed and who can supply it.
- **NOT-A-CLAIM**: a recommendation or judgment call. Assess it on merit under section 5.

Severity labels for every non-CONFIRMED item: **BLOCKER** (plan cannot proceed as written), **MAJOR** (plan will produce a wrong result or a defect), **MINOR** (cosmetic or low risk).

Automation rule: wherever a check can be a script, write it as a script in `scripts/review/` that runs offline against the repo and snapshot, prints results, and exits non-zero on mismatch. The owner wants agent-automatable workflows with minimal manual steps. Prefer one command that reproduces your numbers (`npx tsx scripts/review/verify-all.ts`) over prose.

---

## 4. Phase 1: Verification

### Batch V0. Orientation and baseline

1. Record: commit SHA, date, Node and package manager versions, Prisma and Next.js versions, whether `.env` files are present (names only, never values).
2. Map the repo: top-level layout, `src/services/*` modules, `scripts/*`, workers, feature flags, repository adapters (prisma, supabase, memory).
3. Run the baseline and record results without fixing anything: install, typecheck, lint, unit tests, contract tests, `scripts/check-rls.ts` (if it needs a database and none is available, say so and note whether a local option exists). The plan says the tests were read but not run. Report pass or fail counts and any pre-existing failures so they are not blamed on later work.
4. Determine whether the repo has changed since the plan's inputs: compare against `docs/audits/catalog-snapshot.json` date and look at git history since 2 October 2026 for files the plan names. List relevant commits.

Exit: baseline table written to the report.

### Batch V1. Snapshot and catalogue numbers (offline)

Recompute every number in the plan's sections 1, 2.1, 3 (F1, F2), and 5.3 from `docs/audits/catalog-snapshot.json`. Write `scripts/review/verify-snapshot.ts` to do it. Compare against the claim register entries S1 to S12. For each number print: claimed, computed, verdict. Pay particular attention to:

- Whether "Uganda-located" was computed with a sound rule. The plan's own SQL regex is crude (`uganda|kampala|jinja|gulu|entebbe|...`). Test it against the snapshot, list false positives and false negatives (for example multi-country strings, "Jinja, Uganda; Minna, Nigeria; Kinshasa, DRC", remote roles, towns not in the regex such as Soroti, Masaka, Fort Portal, Kabale, Mbale, Tororo, Hoima).
- Whether `sourceUrl` hosts really map to the aggregators named (unjobnet.org, jobsinuganda.alljobspo.com, advance-africa.com, pandemic-fund.org) and the counts per host.
- Whether organisation names are consistent enough for the 79-organisation and "largest holds 6" figures, or whether name variants (case, punctuation, abbreviations) change the answer. Report the corrected distinct-organisation count if it differs.
- The 5 percent cap arithmetic at 200 (10 listings) and at today's size.
- The grants figure (29 of 115) and the proposed 20-of-200 grants cap.

If a production database is available read-only, also run the plan's section 2.3 SQL queries after checking every column name against `prisma/schema.prisma`. Report any query that fails to run and the corrected version. If no database is available, mark the live numbers UNVERIFIABLE and provide the exact commands the owner can run once (see section 8).

Exit: `verify-snapshot.ts` runs with one command, output saved to `docs/review/evidence/snapshot-verification.txt`.

### Batch V2. Code findings F1 to F13

For each finding in the plan's section 3, open the named file, find the named function, and judge the claim. The table below says what to look for. Quote at most a few lines of code as evidence and always give file and line numbers.

| ID | Verify |
|---|---|
| F1 | Already covered in V1. Cross-check the category and status breakdown. |
| F2 | Counts of source type ("scraped" 103, "org_submitted" 12), sourceUrl hosts, organisations behind the 21 pending Uganda records. |
| F3 | `scripts/review-pending-catalog.ts` and `import-reviewed-jobs.ts` hard-code evidence per record and refuse to apply unless the date is 2026-10-02. `audit-pending-sources.ts` proves only an HTTP response (93 of 100 returned 200). Find the output that supports 93 of 100 or say it is absent. |
| F4 | `runShadowDiscovery` takes one URL and one organizationId. Output goes to a storage bucket as JSON. List the existing workers. Search the whole repo for any code that promotes a shadow candidate to a reviewable record. State clearly whether none exists. |
| F5 | `docs/deviations.md` says no deviations and cites the seven-entity freeze. Compare against `prisma/schema.prisma` and list every model. Check whether the "ten further models" named (StoredDocument, SeekerAccessLog, SeekerPipelineEntry, Feedback, RequestMetric, WebVitalSample, MatchRun, UnmatchedTerm, AdminAccessLog, MetricRollup) all exist, and whether any others were added. |
| F6 | `UserProfile` has no nationality, country of residence or openness to working abroad. Check `domain.ts` eligibility fields. Check the African Union record text quoted in the plan. |
| F7 | `engine-selector.ts` defaults to OrbitMatch. `locationSimilarity` rules. Location weight 10 of 85. Multi-place string scores 0. "United Kingdom" scores 0 for Ugandans. Remote gets full credit. Rule-based engine uses substring matching. **Write a failing regression test as a proposed file in `docs/review/proposed-tests/`, not in `tests/`**, and run it from a temp copy to prove the behaviour, if feasible. |
| F8 | `hard-gates.ts` compares `profile.location` to programme-rule values by exact equality. Find the Rhodes Scholarship rule and its allowed values. Prove with a script or test harness that a profile with location "Gulu" fails. |
| F9 | `automated-signals.ts`: exactly six regexes, an HTTPS test, a passed-deadline test. No comparison with `officialLinks`. `/mobile money/i` false positive on a telecom vacancy. `reportSuspiciousListing` flags on a single report and writes a bare event. No `ListingReport` model. |
| F10 | `submitOrganizationOpportunity` requires a verified organisation and a staff member in `dashboardUsers`. `ingestManualOpportunity` always creates pending. |
| F11 | In `ingestManualOpportunity`, a duplicate with equal or higher source authority sets verificationStatus to pending or flagged. **Reproduce with a script against the memory repository adapter**: create a verified listing, re-ingest an identical one, show the status drops. This is the plan's most dangerous claim for adapters, so the evidence must be strong. |
| F12 | `findDuplicateOpportunity` loads all listings of the same organisation and origin. Null organizationId misses cross-source copies. No URL canonicalisation. `refreshOpportunityLifecycle` does one UPDATE per row. Date-only deadlines stored at start of the closing day. 30-day staleness window. |
| F13 | `anthropic-extractor.ts` treats page text as untrusted, validates with zod, returns no evidence quotes or confidence, text only. `ai-rules.ts` limits: 1,200 tokens per call, 20-second timeout, default model string. No monthly spend ceiling. |

Also verify the "What to protect" list: deterministic offline matching, feature flags failing closed (check each flag's default and how it is read; look for any path where a missing env var turns a flag on), RLS on every table with server-only access (compare every model in the schema against `scripts/check-rls.ts` and the migrations), review decisions carrying notes and reviewer IDs, import scripts defaulting to dry-run (check each script), 25 unit test files plus contract and end-to-end specs (count them).

Look beyond the plan. While reading these files, record any additional defects, security issues, or scale risks that the plan missed, in a separate "Findings not in the plan" section. Examples to look for: unvalidated redirects, SSRF in any server-side URL fetch (relevant because leads and adapters will fetch URLs), prompt-injection paths into the extractor, service-role key exposure to the client bundle, admin routes lacking auth, rate-limit gaps, PII in logs.

Exit: every finding F1 to F13 has a verdict, evidence, and severity if not CONFIRMED. Reproduction scripts for F7, F8, F11 saved in `scripts/review/`.

### Batch V3. Proposed code and SQL in the plan

The plan contains code. Treat it as untested.

1. **`isVisibleToSeeker` (section 5.6).** Implement it in a scratch file under `scripts/review/` using the real `UserProfile` and `Opportunity` types (or faithful local mirrors if types will not compile without the migration). Run every row of Appendix B (rows 1 to 16 where applicable to the gate: 1 to 11 and 13 to 16 have different subjects, so classify which rows test the gate, which test OrbitMatch, which test hard gates, and which test ingestion). Report pass or fail per row. Then probe edge cases the matrix does not cover and report results:
   - `workMode` values other than remote, onsite, hybrid, and null or missing workMode.
   - Hybrid roles with `countryCodes` outside Uganda.
   - Category casing and unknown categories; "internship" and "consultancy" are not in the FUNDING set, confirm intended.
   - A funding listing with empty `eligibleCountries`: it returns visible to everyone, including programmes that are actually nationality-restricted. Is that acceptable fail-open behaviour given "unclassified fails closed" elsewhere?
   - Remote funding listings.
   - A seeker abroad (`countryOfResidence` not UG) and `ugandan_citizens` audience.
   - `audience` set but `countryCodes` empty on a funding listing.
   - Parity: the plan wants the same gate in SQL as a pre-filter and in USSD. Draft the SQL equivalent and a parity test strategy (property test over generated profile and listing combinations comparing TS and SQL results).
2. **`residenceTerms` (hard-gates fix).** Check it against how programme-rule location values are stored and normalised (`normalize`). Confirm "gulu" yields ["gulu","uganda"] and that a rule listing "Kampala" only still rejects a Gulu seeker as intended. Look for other places that compare location by equality (OrbitMatch, USSD, feed, saved filters, notifications) that need the same fix.
3. **SourceAdapter interface.** Check it against what a ReliefWeb v2 response, a JSON-LD JobPosting, and an RSS item actually contain. Note missing fields (organisation URL, employment type, date posted, application URL versus listing URL, closing date with or without time).
4. **Prisma additions (Appendix A).** Copy them into a scratch schema copy outside the real `prisma/` directory (for example `docs/review/scratch/schema.prisma`, a copy of the real schema with the additions applied) and run `prisma validate` and `prisma format` against it with the Prisma version actually in use. Report errors. Check: relation fields missing (Lead to Source, Lead to Opportunity, Opportunity to Source, IngestionRun to Source, ListingReport to Opportunity), cascade behaviour, nullable unique `fingerprint` semantics, enum name clash with existing enums, `@db.Uuid` consistency with existing id types (are existing ids uuid or cuid?), index sufficiency for the queries in section 2.3 and 5.7, and the proposed partial index (Prisma cannot express partial indexes natively, so it needs raw SQL in the migration; say so).
5. **Section 2.3 SQL.** Covered in V1; include a corrected, tested version in the plan.
6. **Migration safety.** Review the backfill: which columns need defaults, which rows would violate new constraints, how `audience` null (hidden) interacts with the current 115 records the moment the gate is on, and the effect on the existing feed before classification is done. Draft the expand, backfill, contract sequence and the rollback.

Exit: `docs/review/evidence/` has outputs for the gate matrix, the schema validation, and the edge-case probes.

### Batch V4. Internal consistency and arithmetic of the plan

Check the plan against itself. Report every contradiction.

- Section 1 says 48 pending open records; confirm 37 + 11. Confirm 15 + 48 = 63 open records and the "16 of 63" figure.
- The 21 pending Uganda records: 12 + 5 + 3 + 1 = 21, "20 of the 21" are aggregator-sourced, "20 are jobs", "11 organisations, two holding 5 each".
- The 15 verified records: 3 in Uganda, 12 elsewhere; "nine of the 12 are grants or scholarships; eight are still open now that Chevening has closed". Check against the snapshot (6 grants, 3 scholarships, 3 internships, 3 jobs; are all 3 jobs the Uganda ones?).
- Capacity table: 200 x 10 min, 225 x 15 min, 70 x 5 min, 60 x 30 min; total hours; "about 16 hours a week over eight weeks"; "three reviewers at 5 to 6 hours each". Recompute.
- Planning mix: 25 + 45 + 40 + 90 = 200. 90 community listings at 40 percent conversion needs 225 leads. 40 adapter listings need "about 70" leads, which implies about 57 percent conversion; confirm the stated reason ("adapter leads convert better") is applied consistently.
- Adapter yield: "about 40 of the 200" from "30 careers pages, ReliefWeb capped at 10, RSS". Is 40 reachable under a 10 per origin cap and the capped Source rules? Show the arithmetic of a feasible origin distribution.
- Guardrail feasibility: 200 live, 150 performed in Uganda, at most 20 grants, at most 50 org_attested, at most 10 per origin, at least 20 organisations. Build a small feasibility model (a script) that shows at least one allocation satisfying every constraint simultaneously and states the minimum number of organisations and the tightest constraint. Include the interaction between "no more than 50 remote or abroad" and the grants and scholarships allowance.
- Appendix B text says "replay rows 1 to 13" and also "rows 13 to 16 are new". Row 13 is in both. Report and correct.
- Section 5.3 says to re-verify Commonwealth now; Section 6 says "Re-verify Commonwealth scholarships (close 20 October)" on days 1 to 2. Fine, but check whether D2 (hide pending from browse) and the week 1 to 2 tracing sequence leave the Uganda user with an almost empty feed for two weeks, and propose a mitigation.
- Origin definition: a listing counts against its organisation and, if via an aggregator or feed, also its Source. Check this is implementable with the proposed schema (`sourceId`, `organizationId`) and write the exact query for "origin share" and for "held: origin at cap".
- Definition of "Live" versus the dead-link and freshness rules (30-day staleness): can a "live" listing be stale?
- Timeline: week numbers start at D1 approval; the launch gate is week 8. Check the dependencies in section 6 for ordering errors (for example, adapters before F11 fix, cap rule at intake before helpers submit, audienceGate enforced before classification is complete, ListingReport before report rules, link checker before 2 percent target).

Exit: a numbered list of internal inconsistencies with corrections.

### Batch V5. External facts and technical assumptions

Verify with official sources (if you have web access) and label the source and date you checked. If you do not, mark UNVERIFIABLE.

- ReliefWeb API: v1 retired; from 1 November 2025 a pre-approved `appname` is required; v2 filtering by country and type; content terms and what may be stored. Record the exact application process and any rate limits.
- Anthropic: current model identifiers and pricing, whether the plan's default `claude-sonnet-4-20250514` string in `ai-rules.ts` is still available or deprecated, image input support for extraction, structured output or tool-use constraints. Recommend a model for text extraction and one for screenshot extraction, with the reasoning and the 50-listing hand-labelled evaluation design. Do not pin a model string you have not verified in current documentation. As a starting point only, current identifiers are believed to include `claude-sonnet-5-5` and `claude-haiku-5-5`; verify before use.
- Supabase Free and Vercel Hobby limits relevant to: cron frequency and duration, serverless function timeout, database size, storage size and egress, project pausing after inactivity, connection limits, row-level-security performance. Say which plan items break these limits (for example image uploads, nightly pg_dump retention, ingest worker runtime, weekly link checker over thousands of URLs).
- GitHub Actions scheduled workflows: minimum interval, drift, behaviour on inactive repositories (scheduled workflows are disabled after a period of repository inactivity), secrets handling, and whether the plan's `tsx scripts/worker/ingest.ts` approach is viable.
- Prisma: whether the repo's Prisma version supports the proposed schema features, partial indexes via raw SQL, and the effect of the Prisma 8 upgrade on migration generation and the dual `prisma/migrations` plus `supabase/migrations` habit.
- robots.txt and polite-crawl claims: one request per second per host is a design choice, not a fact; treat it as NOT-A-CLAIM.
- schema.org `JobPosting` JSON-LD: required and recommended fields, and how common it is on Ugandan employer sites is UNVERIFIABLE without sampling; do not sample aggregators. You may propose a sampling method restricted to official employer domains (robots-respecting, low volume) as a Workstream C task for later, not for this run.
- Legal-adjacent items (submission terms, takedown, retention of screenshots for 30 days, PDPO registration, treatment of aggregator-sourced records): UNVERIFIABLE by you. For each, write the exact question for counsel and what the code currently stores that is relevant (private bucket or not, retention workers that exist, what `StoredDocument` and `documents-sweep` do and whether they can serve the 30-day screenshot deletion).

Exit: external facts table with source URL, date checked, verdict.

### Batch V6. Review of the plan's recommendations on merit

For each of the plan's six numbered changes (section 1), the decisions D1 to D10, and the risks in section 7, give an independent judgment:

- Is the recommendation sound, given what you verified?
- What is the simplest alternative that achieves the same outcome?
- What would you change, and why?
- What is the cost of being wrong?

Specifically challenge these, and say what evidence would settle each:

- Four new tables versus extending existing ones (could `Lead` be an `Opportunity` with `verificationStatus` and a lead status, and what would that cost in invariants?).
- Community-first intake as the backbone when no pilot has run (Workstream H). Is the 90-of-200 community assumption defensible? What is the fallback, and at what week does the plan detect failure?
- The 5 percent origin cap as a hard intake block pre-gate. Does it create perverse outcomes (valid listings held while filler passes)? Propose the least harmful enforcement.
- `org_attested` provenance and its fraud risk, versus the 150-in-Uganda target.
- Fail-closed audience gate versus the effect on the existing 115 records on the day it is enabled.
- Not collecting nationality (D3) versus showing `ugandan_citizens` and `african_nationals` listings to everyone with a badge.
- Review capacity of about 125 hours: is the tracing time (15 minutes per community lead) realistic? What can be automated further (apply-link domain checks, organisation lookups, duplicate and fingerprint checks, prefilled evidence)?
- Reports: second independent reporter rule and the "hide at once on payment pattern match" rule. Abuse and false-positive analysis.
- Scope: which items in the plan are not needed for the 200-listing goal and could be deferred (for example SQL-level feed filtering at 200 rows, date-only deadlines, link checker cadence, helper programme tooling)? Mark each plan item as MUST for the gate, SHOULD, or LATER, with reasons.

Exit: a merit review table with MUST, SHOULD, LATER classification.

---

## 5. Phase 2: Implementation planning

Use only verified facts. Where a verdict changed something, the plan must use the corrected version. Do not write code for `src/`. Write a plan that another agent can execute without asking questions.

### 5.1 Planning principles

- Comprehensive, no stubs, no placeholders, no "TBD". If something is unknown, state the assumption you made, the evidence it rests on, and the cheapest way to confirm it.
- Logical batches, each independently shippable behind a flag, each fully validated before the next starts.
- Agent-automatable first: for every step say whether an agent can do it end to end, or what exactly a human must do, and keep human steps few, batched, and clearly labelled.
- Fail closed. New behaviour ships behind flags that default to off. Scripts default to dry-run. Nothing automated ever writes a verified listing.
- Every batch has a rollback.
- Preserve what the plan says to protect: deterministic offline matching, flags failing closed, RLS everywhere, reviewer notes and IDs, dry-run defaults.
- Every change lands in all three repository adapters (prisma, supabase, memory) with tests, because the memory adapter keeps the tests honest.
- Every schema change ships as a Prisma migration plus its mirror in `supabase/migrations`, with RLS (server-only access, following the pattern in `20260925210023_server_repository_data_api_access`) and a line in `scripts/check-rls.ts`.
- Free-tier constraints are first-class: size every worker, upload and query against Vercel Hobby and Supabase Free limits and say what breaks and what to do about it.

### 5.2 Required content of the implementation plan

For each work package (WP) provide all of the following:

1. **ID and title**, and which plan finding, change number or decision it implements.
2. **Objective and acceptance criteria** stated as testable conditions.
3. **Exact files to create or change**, with the function or model names.
4. **Schema and migration steps**, including backfill, indexes, RLS, and `check-rls.ts` change.
5. **Feature flags** introduced, default values, and the order in which flags are turned on.
6. **Tests to write**: unit, contract, end-to-end, and fixtures (recorded responses only; CI must not touch the live network). Map each Appendix B row to a named test.
7. **Scripts**: name, dry-run behaviour, `--apply` behaviour, change-log output location.
8. **Dependencies** on other WPs, decisions, external approvals (for example the ReliefWeb appname), or humans.
9. **Risk and rollback.**
10. **Effort**: S, M or L with an hour range, and your confidence.
11. **Automation level**: AGENT (fully executable), AGENT+REVIEW (agent builds, human approves), HUMAN (agent cannot do it).
12. **Free-tier impact** (Vercel Hobby, Supabase Free).

Cover at minimum these work packages, adjusting scope and order to what verification showed:

- WP-A Re-run the catalogue audit and publish the baseline (needs read-only production access or an owner-run command).
- WP-B Decision record: `docs/deviations.md` entry that lifts the table freeze and lists every model added since, as the plan describes.
- WP-C Migration: four new tables, new columns on `Opportunity`, `Organization`, `UserProfile`, enums, indexes, RLS, adapters.
- WP-D F11 fix: never lower a verified listing on re-ingestion, with the four re-ingestion rules and test rows 14 and 15.
- WP-E F8 fix: hard-gate location resolution, test row 13, and every other equality comparison of location found in V3.
- WP-F Audience gate: `audience.ts`, flag `audienceGate`, shadow mode with logging, a diff report, USSD parity, audience badge, test rows 1 to 12.
- WP-G Catalogue clean-up: `clean-catalog.ts` and `classify-audience.ts`, the close and archive pass, date-only deadline conversion (D4), CSV for human confirmation of audience proposals, change log.
- WP-H Tracing the 21 pending Uganda records: a tracing worksheet generated by script (record, aggregator URL, candidate employer, candidate careers URL, evidence, status), so reviewer time goes to judgment and not to copying fields. Do not fetch aggregator sites; derive candidate employers from the stored organisation names and officialLinks only.
- WP-I Lead intake: `POST /api/v1/leads`, quick-add admin form, rate limits (per-user daily cap), canonicalisation and fingerprinting, de-duplication in SQL, status lifecycle, 48-hour triage and 7-day expiry worker, flag `leadIntake`.
- WP-J Screenshot extraction: image input, evidence quote per field, private bucket, 30-day deletion (reusing the documents sweep if suitable), human sees screenshot beside the extraction, spend ceiling (D7), model decision from the evaluation set.
- WP-K Organisation verification and trusted poster, `officialDomains` derivation, employer direct posting and "post a job" form creating a Lead, reconciled with the in-flight organisation approval pipeline in admin.
- WP-L Trust v2: apply-link checks, scam patterns v2 (and fix of the `mobile money` rule, with the 30 scam and 30 legitimate listing test set built from real examples the owner supplies, never invented), routing rules, origin-cap check and the `held: origin at cap` reason.
- WP-M `ListingReport`, new report rules, 24-hour response clock, per-user cap.
- WP-N Helper programme: admin-invited helper role, status page, quality metrics, helper concentration alert.
- WP-O Source registry and adapters: `SourceAdapter`, ReliefWeb v2 adapter, careers-page adapter with JSON-LD, RSS adapter, `IngestionRun`, ingest worker, pause after three consecutive failures, scheduling mechanism chosen against Hobby and Actions limits.
- WP-P Admin review screen and queue, time-to-decision logging, reconciled with the existing admin portal.
- WP-Q KPIs and SLOs: every metric in section 5.8 of the plan with its exact SQL, additions to `slo-targets.ts`, dashboard placement, alerts.
- WP-R Scale: SQL filtering in `listOpportunities`, bulk lifecycle, link checker worker, deadline handling, capacity run with `audit-capacity.ts` and a 3,000-row synthetic catalogue.
- WP-S Privacy and compliance artefacts the code can support: data-flow note, retention rule implementation, submission terms and takedown route as drafts for counsel (agent drafts, counsel decides).
- WP-T Launch gate checker: one script that evaluates every launch gate condition against the database and prints PASS or FAIL per condition with the offending rows. Make it runnable weekly in CI as a report.

Also produce:

- **Dependency graph** of the work packages (a Mermaid diagram in the plan plus a topological order).
- **Batch schedule**: group the WPs into batches (B1, B2, and so on) that each end in a shippable, validated state. For each batch give an **execution brief** that is complete enough to paste into an agent as a standalone prompt: goal, preconditions, exact steps, commands, files, tests that must pass, definition of done, rollback, and what to report back. No batch brief may say "as above" or refer to context the agent will not have.
- **Critical path and the earliest realistic launch-gate date**, using the verified numbers and the capacity model, with the main risk to that date.
- **Flag rollout runbook**: the order and conditions for enabling `leadIntake`, `audienceGate`, and any adapter flags, including the shadow-mode review procedure and the criteria to turn each on.
- **Test strategy**: the full test inventory, how the Appendix B matrix becomes tests, how adapters are tested offline, and a CI plan that fits Hobby and Free limits.
- **Operational runbook**: weekly review rhythm, concentration and coverage checks, what to do when an origin hits 8 and 10, how to handle a takedown request, and how to pause a Source.
- **Human tasks list**: everything an agent cannot do (decisions, outreach, recruiting helpers, counsel questions, ReliefWeb application, collecting real scam examples and local phrases, naming reviewers), each with the exact deliverable and a suggested deadline relative to week 0.

### 5.3 Decision handling

The plan lists decisions D1 to D10. Do not block on them. For each, state: the plan's recommendation, your verified assessment, the default you will assume if unanswered, and the effect on the plan if the owner chooses otherwise. Present all of them in one consolidated block (section 7 below) so the owner can answer in a single pass.

---

## 6. Claim register (verify every row)

Write results to `docs/review/01-claim-register.csv` with columns: `id, section, claim, how_verified, evidence_ref, verdict, severity, correction, notes`. Add rows for any additional claims you find. This register is the minimum, not the limit.

**Snapshot and catalogue**

- S1: 115 records in the 2 October snapshot.
- S2: verified/open 15, pending/open 37, pending/closing_soon 11, flagged 1, closed 51 (10 verified, 41 pending).
- S3: categories: 58 jobs, 29 grants, 12 fellowships, 10 scholarships, 5 internships, 1 consultancy.
- S4: 57 Uganda-located records, 52 of them pending.
- S5: verified open set is 6 grants, 3 scholarships, 3 internships, 3 jobs; only three are in Uganda (UNICEF Digital Impact Manager, two One Acre Fund roles).
- S6: 103 records have source "scraped", 12 "org_submitted".
- S7: 21 pending open Uganda records, 20 of them jobs; hosts: unjobnet.org 12, jobsinuganda.alljobspo.com 5, advance-africa.com 3, pandemic-fund.org 1; 11 organisations, two with 5 each.
- S8: 79 distinct organisations; the largest holds 6 of 115 (5.2 percent).
- S9: advance-africa.com is the source of 16 of the 63 open records.
- S10: 48 pending open records; 63 open in total.
- S11: grants are 29 of 115.
- S12: 8 of the 12 non-Uganda verified records remain open after Chevening closed.
- S13: Chevening and the UNICEF post closed on 6 October 2026; Commonwealth Master's and PhD scholarships close on 20 October 2026.

**Code findings** F1 to F13 as in section 4, Batch V2. Add one row per sub-claim (for example F7 has at least five).

**Plan logic**

- L1: `isVisibleToSeeker` satisfies matrix rows 1 to 12 as written.
- L2: `residenceTerms` fixes F8 without loosening town-specific rules.
- L3: Appendix A validates under the repo's Prisma version.
- L4: Section 2.3 SQL runs unchanged against the real schema.
- L5: Capacity model totals about 125 hours.
- L6: The guardrail set is jointly satisfiable at 200 listings.
- L7: Adapters can supply about 40 listings under the origin cap.
- L8: Appendix B is internally consistent (row ranges).
- L9: The roadmap's dependencies are in a valid order.
- L10: The re-ingestion rules in 5.5 cover every field combination (title, deadline, location, application method, source link, description) without ambiguity.

**External**

- E1 to E6: ReliefWeb v2 and appname requirement from 1 November 2025; current Anthropic model identifiers and availability of the default in `ai-rules.ts`; Hobby and Free limits; GitHub Actions scheduling behaviour; schema.org JobPosting fields; Prisma capabilities.
- E7: Legal items, always UNVERIFIABLE by you, each with a precise counsel question.

---

## 7. Deliverables and file layout

Create exactly these files under `docs/review/` (plus scripts under `scripts/review/`):

1. `00-verification-report.md`: executive summary; the Time-sensitive block; verdict counts by label and severity; baseline results; findings F1 to F13 table; findings not in the plan; internal inconsistencies; external facts; merit review with MUST, SHOULD, LATER; what you could not verify and what is needed to do so.
2. `01-claim-register.csv`: as specified in section 6.
3. `02-implementation-plan.md`: principles; work packages in full; dependency graph; batches with standalone execution briefs; critical path and date estimate; flag rollout runbook; test strategy; operational runbook; free-tier assessment; risks with owners.
4. `03-backlog.csv`: one row per task with columns `id, wp, batch, title, files, depends_on, effort, hours_low, hours_high, automation, flag, tests, acceptance, rollback`.
5. `04-decisions-and-questions.md`: D1 to D10 with recommendation, verified assessment, default assumed, and effect of alternatives; plus every other question that genuinely blocks work, each with a recommended default so that no question is blocking.
6. `05-validation-log.md`: batch by batch record of commands, outputs summary, passes, failures, and what was not run.
7. `evidence/`: raw outputs referenced by the report.
8. `scripts/review/verify-all.ts` (and the individual scripts it calls): one command reproduces every offline number and test.

Self-validation before you hand off (run all of these and record the results in `05-validation-log.md`):

- `verify-all.ts` runs clean from a fresh checkout state and reproduces the numbers in the report.
- Every claim in the register has a verdict and a non-empty evidence reference.
- Every verdict other than CONFIRMED has a severity and a correction.
- Every WP in the plan has all twelve required fields. Every batch brief is standalone. A script checks this.
- Every Appendix B row maps to a named test in the plan.
- Every new table appears in the `check-rls.ts` change list.
- No `src/`, `prisma/`, `supabase/`, `.github/` or config file has changed: run `git status` and `git diff --stat` and confirm only `docs/review/` and `scripts/review/` are touched.
- The documents contain no placeholders ("TBD", "TODO", "to be decided", "as above"). Grep for them and fix.
- Numbers in the plan, backlog and report agree with each other (the capacity model, the batch hours, and the date estimate must reconcile).

---

## 8. Your final reply

When finished, reply with a short summary only:

1. Verdict counts (CONFIRMED, PARTIAL, REFUTED, STALE, UNVERIFIABLE) and the top BLOCKER and MAJOR items, one line each.
2. The time-sensitive item and its status.
3. The corrected key numbers (live Uganda count, distinct organisations, concentration) and whether the 200 and 150 targets are still jointly feasible.
4. The earliest realistic launch-gate date and the main risk to it.
5. The list of files you produced.
6. **One consolidated question block** with everything you need from the owner, in this order, each with a recommended default so work is never blocked: (a) the plan docx if it was missing; (b) a read-only database URL or the exact commands to run for the live numbers (give the commands); (c) answers or confirmations for D1 to D10; (d) names for reviewers and the first helpers; (e) anything else that genuinely blocks a batch.

Do not paste the reports into the reply. They live in the files.
