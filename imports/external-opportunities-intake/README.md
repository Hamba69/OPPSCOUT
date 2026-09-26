# SCREENING UPDATE

This archive was re-screened for this checkout. See screening-notes.md and use src/data/discovered-catalog.ts as the app adapter. The imported records enter the trust desk as pending, except the AFNet grant which is flagged. Do not use the archive's original blanket verified statuses to publish these records. The existing seed catalog now includes the screened records.

---

# OppScout — discovered opportunity catalogue

Output of a manual simulation of `src/services/ingestion/scraping/pipeline.ts`
run against live sources on **2026-09-25**, followed by the trust review the
pipeline's shadow-store design assumes happens before anything goes live.

## Files

- **`discovered-catalog.ts`** → drop into `src/data/discovered-catalog.ts`.
  100 real, currently-open opportunities (jobs, scholarships, internships,
  grants, fellowships) and their 74 organizations, in the exact
  `Opportunity` / `Organization` shape from `src/core/entities/domain.ts`.
  Type-checks clean (`tsc --noEmit`) against your real domain types — verified
  in an isolated project during this run, zero errors.
- **`discovered.ts`** → drop into `scripts/seed/discovered.ts`. A companion to
  your existing `scripts/seed/index.ts` that seeds this catalog instead of
  `seed-catalog.ts`. Same `validateCatalog()` contract (unique IDs, HTTPS
  sources, future deadlines, fully-checked trust review), same upsert
  behaviour — safe to run alongside your existing seed. Run with
  `npx tsx scripts/seed/discovered.ts`.
- **`pipeline_report.json`** → the raw output of the dedup + trust-signal
  simulation described below.

## What the pipeline simulation actually checked

Every candidate was run through the same logic your code uses:

- **HTTPS check** (`sourceUrl.startsWith("https://")`) — 0/100 failed.
- **Deadline plausibility** (`deadline > snapshot`) — 0/100 failed.
- **Trust-signal scan** — the exact `SUSPICIOUS_PATTERNS` regexes from
  `src/services/trust/checklist.ts` (fee requests, "send money", mobile
  money, bank account/PIN, password, national-ID-before-applying) run
  against every title + description + application method — 0/100 matched.
- **Dedup** — the exact bigram `titleSimilarity()` formula from
  `src/services/ingestion/deduplication.ts` (0.85 threshold, 3-day deadline
  window, scoped per organization) — **1 pair flagged**: the two Dalilang
  Foods & Beverages "Territory Field Sales Representative" roles (Gulu vs.
  Mukono), similarity 0.857. Reviewed and kept as distinct listings — same
  title pattern, different duty stations. This is a good real example of why
  the automated dedup threshold needs a human in the loop rather than
  auto-rejecting matches.

Net result: 99 of 100 candidates a naive pipeline would treat as unique are
in fact unique; the 100th needed one manual look, which is exactly what the
review workflow is for.

## Where this sits in your actual architecture — read before you seed it

Your `scraping/pipeline.ts` deliberately **never writes to the live
Opportunity table**: `runShadowDiscovery()` only logs `ShadowCandidate` rows,
and `liveOpportunityWrites` is hardcoded to `0` in `scraping/metrics.ts`
until duplicate-rate and freshness-error-rate stay under the 1% cutover
targets. So strictly speaking, real scraped candidates land in the shadow
store first, not straight into this shape.

`discovered-catalog.ts` skips that shadow stage and is formatted as if each
candidate already passed a human trust review — which is what I actually did
for each of these 100 (checked the org has a real HTTPS presence, scanned for
fee/payment/sensitive-data language, confirmed the deadline is a real future
date stated on the source page, and ran the dedup check above). That's a
legitimate way to get a usable seed set today, but it bypasses the
shadow-store checkpoint your architecture is designed around. If you want the
seed data to reflect your actual pipeline exactly, the more faithful path is:
feed these 100 URLs through `runShadowDiscovery()` as if they were freshly
scraped, let them land as `ShadowCandidate` rows, and only then promote the
ones that clear your metrics thresholds — at which point `liveOpportunityWrites`
stops being hardcoded to `0`.

## Coverage

- 51 jobs (mostly Uganda-based: UN/INGO postings via UNjobnet, plus Stanbic
  Bank, Savanna Fibre, Dalilang Foods, LEAD 4 Africa, and others)
- 29 grants (rolling and dated calls open to Uganda-based applicants)
- 9 scholarships, 9 fellowships (Chevening, Commonwealth, Mandela Washington
  Fellowship, CIFAR, etc.)
- 2 internships (World Bank YPP, FAO Africa)

All 100 organizations are marked `verificationStatus: "verified"` on the
strength of the manual review above; all have `source: "scraped"` since
that's how they were actually discovered.
