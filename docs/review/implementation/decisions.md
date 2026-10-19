# Implementation decisions

## Run-level and plan decisions

The following decisions were supplied by the owner and are recorded verbatim.

### DEC-01

Production Supabase is the only Supabase project and is never a test target. Database work uses local Docker Postgres first, an owner-provided dev project second, memory adapter third.  
The owner decided earlier not to run a second Supabase project, so "remote" can only mean production. Writing to it from an automated run is an unacceptable risk on a Free plan with no point-in-time recovery.

### DEC-02

Prisma stays at 6.19.x. The Prisma 8 upgrade is a separate change after production readiness.  
Mixing a major ORM upgrade with eight batches of schema and migration work makes failures impossible to attribute. The Vercel build log confirms 6.19.3 is what deploys.

### DEC-03

The branch `backup-before-workflow-rewrite` (commits `8449ea21`, `4bb77c12`) is a read-only reference, not a base. Do not merge, rebase, cherry-pick wholesale, or delete it. In B0, compare feature by feature against `main` (organisation account setup and approval pipeline, candidate document upload, admin portal and access log, feedback, telemetry) and record, per feature, whether `main` already has it. If `main` has the feature, the branch is superseded for it. If a plan work package depends on a feature that exists only on the branch, implement the plan's version fresh on `main`, borrowing design ideas by reading the branch, and list it in the report.  
`main` already carries the ten later models (StoredDocument, SeekerAccessLog, SeekerPipelineEntry, Feedback, RequestMetric, WebVitalSample, MatchRun, UnmatchedTerm, AdminAccessLog, MetricRollup), so the branch is most likely the pre-rewrite state. Building on it would reintroduce superseded design and conflict with the schema batch.

### DEC-04

The build must be green first. If `npm run build` fails on `main` because of `next/font/google` (Montserrat, Turbopack, Next 16.3.1), fix it before anything else by self-hosting the font (B0, step 2).  
Every later branch inherits `main`'s build state, and Vercel previews would all fail.

**Applied:** baseline `npm run build` passed on Next.js 16.3.1, so no font migration was made. The correct Next.js font guide was read at `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`.

### DEC-05

The Anthropic spend ceiling (D7) covers **all** Claude calls in the app, including match explanations, not only the new extraction. Enforced in code, default conservative, every call goes through one budget-checked client.  
A ceiling that exempts existing calls is not a ceiling.

### DEC-06

New plan features must work with email delivery switched off. Reports, leads, review queues and helper status use in-app and admin surfaces only. Notification emails go through the existing Resend integration and fail soft.  
Resend is the only email provider and its domain is not verified, so deliverability is limited today. Production readiness cannot depend on it.

### DEC-07

Reuse, do not duplicate: provider (organisation) accounts with admin verification become the plan's organisation verification (T1, `trustedPoster`, `org_attested`); the existing admin-invite flow is used for the helper role; the existing password-only admin portal (opened by the triple-tap gear icon, password hashed in env, no login or email) hosts the review screen, quick-add, KPIs and launch-gate panel; the existing Feedback model and page stay as they are; StoredDocument and its sweep are reused for private screenshots and 30-day deletion. No second admin, no second auth path.  
These were all decided and built or requested earlier; the plan's work packages map onto them.

### DEC-08

New user-facing strings (audience badges, lead and report copy, helper status, the "unreviewed" toggle) use the app's existing language mechanism (English plus the three Sunbird-translated languages). If strings are translated at runtime, include the new ones in the same path. If translation needs a pre-built catalogue, ship English and add the keys so the pipeline can fill the rest. Never invent translations.  
The product commits to English plus three local languages.

### DEC-09

Out of scope this run: the paid seeker tier, organisation paid features, payment integration, custom domain, Mapbox changes, Sunbird changes, new sign-in methods, and any feature not in the plan. Free tier only.  
The plan defines readiness; monetisation is a separate roadmap.

### DEC-10

The owner's researched Uganda opportunity file (CSV, in the app's import column scope) can enter only through a new bulk lead import (B6) as **Leads**, never as listings. Nothing goes live without the tracing rule.

### D1

Approved by the owner on 19 October 2026: new tables Source, Lead, ListingReport and IngestionRun are allowed. The seven-entity freeze is lifted in practice. The deviations entry lists the ten models added since the freeze and is verified against `prisma/schema.prisma` (17 models at the review commit).  
Plan recommendation.

### D2

Pending catalogue listings are hidden from browse by default **only after** the 21 pending Uganda records are traced. Ship as flag `hidePendingFromBrowse` (default off) with an explicit "unreviewed" toggle. A KPI shows how many verified Uganda-relevant listings a seeker would see with the flag on.  
Plan recommendation plus a guard against an empty feed.

### D3

No nationality collected. `UserProfile` gains `countryOfResidence` (default UG) and `openToAbroad` (default false). Date of birth, already collected at onboarding, is never used by the audience gate.  
Plan recommendation. Nationality is sensitive data.

### D4

Date-only deadlines are stored as end of day in `Africa/Kampala` (UTC+3). Explicit source times are preserved. Conversion of existing records is in the clean-up script, dry-run by default.  
Plan recommendation, using Kampala as the user base.

### D5

Three reviewers at about 5 to 6 hours a week each; helper pilot of 5 growing to 8 to 10 by week 4. Owner action.  
Plan recommendation.

### D6

One owner for Fuzu and BrighterMonday permission, one for the 100-organisation outreach list. Owner action. No adapter for any platform runs without a recorded written permission on its Source row.  
Plan recommendation.

### D7

Monthly AI spend ceiling in configuration, enforced in code (see DEC-05). Screenshot extraction stays off until the 50-listing evaluation set passes.  
Plan recommendation.

### D8

Origin cap enforced at intake and review, never by deleting. Origins at 8 live listings are deprioritised in the queue. At 10, further items wait in pending with reason `held: origin at cap`, and nothing is approved above the cap before the launch gate. After launch the cap is 5 percent of the live catalogue, tracked as an alert. "Origin" counts against the organisation and, for aggregator or feed items, the Source.  
Plan recommendation.

### D9

`org_attested` provenance is allowed with all three conditions enforced in code: registration proof, a named contact confirmed by a logged call, and no more than 25 percent of the live catalogue.  
Plan recommendation.

### D10

Helpers are recognised by listings that went live, not paid per lead. The repo builds the status page and quality metrics.  
Plan recommendation.

## B0 decisions and evidence

- DEC-03 is applied as a strict branch boundary: this worktree starts at `origin/main`; the backup branch is only inspected and is never integrated.
- DEC-04 required no code change because the baseline build passed.
- The baseline lockfile was out of sync with `package.json`; `npm install --package-lock-only --offline --ignore-scripts --no-audit --no-fund` repaired it. `npm ci` remains unverified because required package tarballs are not available in the local npm cache and registry requests fail with `ECONNRESET`.
- The repository contains `.env.local` only in the original checkout; B0 runs in an isolated worktree without that file. No values from environment files are read or printed.
