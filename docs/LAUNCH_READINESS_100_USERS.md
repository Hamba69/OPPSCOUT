# OppScout: 100-user readiness review

Review date: 2 October 2026. Database: the project configured in `.env.local`. No deployment, Git push, schema migration, matching-weight change or feature-flag change was performed.

## Decision

The current architecture can support a controlled 100-account pilot, based on the live tests below, but the app is **not yet ready to promise useful opportunities to 100 diverse seekers**. Content coverage is the main constraint. A successful concurrency test is not a production SLA, and a match score is not proof that all eligibility requirements are met.

Do not market the catalog as complete or broadly sufficient. Recruit a pilot whose expectations fit the actual opportunities and use the cloud-agent research brief to close the missing coverage. No honest code change can manufacture valid jobs or establish eligibility absent from the sources.

## Database work actually completed

The existing insert-only catalog importer was run in dry-run mode and found zero missing records. The database already held the complete 100-record external intake. The destructive demo seeder was not used.

| State | Before | After |
| --- | ---: | ---: |
| Total opportunities | 113 | 115 |
| Active verified | 3 | 15 |
| Verified closed | 10 | 10 |
| Pending, all lifecycle states | 99 | 89 |
| Flagged | 1 | 1 |

Ten existing pending records were independently reviewed and updated; two new jobs were inserted under an existing organization. Eleven expired records were closed without changing their trust decisions. Post-write reads confirmed the final counts. The 15 active verified records comprise 3 internships, 3 scholarships, 6 grants and 3 jobs. Of the 89 remaining pending records, 41 are closed and 48 have open/closing-soon lifecycle status; none are shown as verified matches. The fee-flagged AFNet grant remains flagged.

Reviewed existing records: Chevening Uganda, Commonwealth Master's and PhD scholarships, DRK social enterprise funding, Rufford, Urgent Action Fund Africa, FID, WPHF Rapid Response Window, Pollination Project, and UNICEF Digital Impact Manager. New records: One Acre Fund Global MEL Manager/Senior Manager and Grants Finance Senior Associate/Manager.

Evidence and exact writes are in [reviewed-catalog-changes.json](audits/reviewed-catalog-changes.json), [reviewed-jobs.json](audits/reviewed-jobs.json) and the post-write [catalog snapshot](audits/catalog-snapshot.json). Those files contain source URLs and explicit review notes. Database writes returned the affected records; this is not merely a generated SQL plan.

All 100 pending-source URLs were checked: 93 HTTP 200, 3 HTTP 404, 1 HTTP 401, 1 HTTP 403 and 2 retrieval failures/timeouts. These are reachability results, not 100 completed authenticity reviews. See [pending-source-checks.json](audits/pending-source-checks.json). The remaining 89 pending records require source-specific verification; they were not bulk-approved.

The source checks demonstrated why official listing-level review matters: One Acre Fund's job directory still linked Uganda MEL and Finance vacancies with June/September closing dates. Those were not added as open opportunities. Similarly, an online application does not establish remote employment; organizational grants are described as project funding, with applicant conditions explicitly retained.

## Product and implementation changes

- Restored the existing controlled profile choices. Exact scalar/array values and custom entries survive edits and failed saves; comma-containing locations stay intact.
- Added work experience, internship months and certifications to the profile UI using the existing profile schema. Existing employer details are preserved. Users are told not to double-count overlapping experience.
- Feeds remain keyed to the authenticated user's ID. No founder identity, demo profile or per-user catalog copy is used in the live data path.
- Cards say “Verified listing,” rather than falsely asserting the organization has been separately verified. Missing closing dates say “Not published.” Matching explanations say requirements are not recorded rather than asserting universal eligibility. The empty state acknowledges catalog gaps.
- Added `eligibility.additionalRequirements` within the existing JSON field. Nationality, financial need, organizational/project restrictions and other conditions the profile cannot prove are visible in explanations. This adds no database column.
- Source extraction preserves age and programme rules, accepts additional requirements, ignores instructions embedded in source text and applies the existing configured timeout. No provider/model rollout or paid AI call was made; no Anthropic key was configured in this environment.
- Changed-content duplicate submissions and PATCH edits return to pending/flagged review. Providers cannot self-approve through PATCH or transfer a listing to another organization. Only the review endpoint can approve revised content. Lower-authority duplicate submissions do not refresh official-source freshness.
- Trust-checklist completeness now requires all five named checks. An empty object cannot pass.
- Normal-user opportunity lists exclude passed deadlines. Successful API responses carry private/no-store cache headers.
- Supabase catalog reads page beyond the default API result cap; organization ID lookups are chunked. A 1,205-record regression test proves the end of the catalog remains accessible.
- Feed rendering initially mounts 20 cards with a “Show more” action. Search/category filters reset that limit. This reduces browser work without changing scoring or removing candidates.

## Verification and its limits

- 80 unit/contract tests pass, including fresh-profile behavior, user-scoped matches, custom values, certifications/experience, duplicate trust invalidation, extraction, provider self-approval rejection and catalog pagination.
- TypeScript and the production build pass. ESLint has no errors; one pre-existing unused-variable warning remains in the archive catalog.
- A service-level test built feeds for 100 distinct synthetic profiles concurrently using the live catalog, without inserting those profiles. All completed; the final measured service p95 was 2.45 seconds. See [capacity-100.json](audits/capacity-100.json).
- A separate test created two temporary real Supabase users, signed in through the browser, saved distinct profiles through the real API, loaded feed/detail pages and verified saved-item isolation. Both users saw different feeds. Screens at 390, 768 and 1440 pixels had no horizontal overflow or JavaScript page errors.
- The same test issued 100 simultaneous authenticated HTTP match requests through the local **production** Next server, live Supabase Auth/Postgres and configured Redis. All passed. Exact final latency and browser results are in [live-user-verification.json](audits/live-user-verification.json). Earlier runs measured p95 4.85–5.87 seconds; network and burst load materially affect latency.
- Authenticated direct Data API reads returned no private UserProfile, MatchResult or SavedOpportunity rows. This verifies the observed data-access behavior for the tested user; it is not a complete SQL policy/advisor audit.
- All temporary test profiles and Auth accounts were removed, and sessions signed out. No real user's profile was edited.

This does **not** prove 100 simultaneous distinct authenticated users on production hosting, sustained traffic over hours, notification/provider quotas, recovery under database/Redis outage, complete RLS policy inventory, payment flows or live AI extraction. Those were not silently represented as tested. Screenshots and local build/test logs are under `test-results/launch-audit/` (ignored by Git).

## Is the opportunity inventory enough?

No. Twelve additional active records substantially improve the starting state, but 15 active listings are still sparse and the three jobs are senior roles. The original cohort test against 12 listings left 50/100 simulated seekers without their preferred category. After adding jobs, every simulated profile sees its requested broad category somewhere, but that does not mean it meets senior experience, nationality or other conditions. Many generic grant matches require an organization/project the profile cannot establish. Do not use the “zero empty categories” result or scores above 60 as a coverage success claim.

Suggested launch acceptance targets, to be measured after research (these are product targets, not findings):

- At least 10 actionable, relevant, recently checked options for each priority cohort, with no cohort forced to rely mainly on organizational grants or unpaid international internships.
- Start with 150–300 distinct verified active records spanning jobs, internships, vocational training, scholarships and grants; actual sufficiency depends on distribution and eligibility, not hitting a round number.
- Prioritize paid entry-level work, certificate/diploma opportunities, non-Kampala locations, agriculture/trades/health/education and genuinely accessible remote work.
- Check deadlines daily and sources on the existing freshness schedule: scraped records become stale after 14 days and org submissions after 30. Recheck rolling calls too. A successful scrape must never reset checkedAt without a real source review.
- Measure empty feeds, top-five relevance, disqualifying requirements users discover after clicking, stale links, applications initiated and catalogue coverage by cohort. Use aggregate voluntary feedback; do not export personal profiles to a research agent.
- Before broad release, deploy these code changes and run the authenticated smoke test on that deployment. Confirm worker scheduling, rate-limit/store/provider health and expected hosting limits. The database changes are live; the code changes are local until released.

## Ingestion strategy

Keep the existing separation: discovery -> fact extraction -> duplicate/freshness/trust signals -> review -> verified catalog -> deterministic per-user matching. Use AI to expand research and identify missing evidence, not to manufacture deadlines, requirements or approval. Grow official source registries and stable employer/application reference numbers. Use aggregator URLs only as discovery breadcrumbs.

The current model handles many seeker facts but does not prove citizenship, visas, academic grades, exact graduation dates, organization type/budget, project readiness or experience relevance. Additional requirements preserve these gaps without making the onboarding form collect excessive sensitive data. Skill similarity and generic experience months are ranking signals; reviewers must keep actual mandatory conditions explicit. The age gate currently evaluates age at the listing deadline when present, which cannot represent every programme's selection/start-date rule; the source requirement remains authoritative.

The comprehensive [cloud-agent prompt](CLOUD_AGENT_OPPORTUNITY_RESEARCH_PROMPT.md) specifies a source registry, coverage matrix, two-pass evidence review, deduplication against the current snapshot, complete CSV exports, strict enums/JSON cells, deadline precision, fees/costs, unresolved records and validation manifests. It deliberately separates research verification from app approval and flags CSV rows requiring mapping. There is no new direct CSV-upload promise or bypass around the trust workflow.

## Reproduction

```powershell
npx tsx scripts/audit-catalog.ts
node --conditions=react-server --import tsx scripts/audit-capacity.ts
npm run build
npm run start -- --port 3015
# In another terminal; creates and cleans up two temporary test accounts:
npx tsx scripts/verify-live-users.ts
npm test
npm run lint
```

The dated write scripts are evidence of this review, not scheduled jobs. Do not rerun their `--apply` on another date or use old reviews to reapprove changed records. A fresh official-source review is required. Keep service-role keys server-side and out of reports.
