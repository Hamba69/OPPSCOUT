OppScout

Technical Review and Remediation Plan

From a thin, mostly foreign catalogue to 200 verified opportunities a Ugandan can act on, built on community submission



| Item | Detail |

| --- | --- |

| Prepared for | TT |

| Date | 16 October 2026 (Revision 2, replaces the 15 October version) |

| Inputs | The report “OppScout: What’s Wrong and How We’re Fixing It” (3 pages). The OPPSCOUT-main source archive, read in full for the services, scripts, schema and docs, including docs/audits/catalog-snapshot.json (dated 2 October 2026). |

| Not reviewed | The live Supabase database, Vercel settings, production environment variables and any records added after 2 October. The test suite was read but not run. Every count below comes from the snapshot and must be re-run first (Workstream A). |





| What changed in this revision Targets. At least 150 of the 200 listings must be performed in Uganda, and no single source or organisation may supply more than 5 percent of the catalogue (10 of 200). Community submission is now the backbone (new section 5.4). Legal limits mean the internet alone cannot supply the catalogue, so the plan is built around people submitting what they see and employers posting directly. Web adapters are kept, but small and permissioned. Corrected against the code. The location-scoring finding was only half right, a second location bug sits in the hard eligibility gates, and a re-ingestion bug can silently un-verify live listings. The earlier draft of the audience gate also disagreed with its own test matrix. All are fixed here. The quick win is smaller than first stated. 20 of the 21 pending Uganda records were scraped from three aggregator sites, so each must be traced to the employer’s own page before approval. Timeline and capacity. The launch gate moves from week 6 to week 8, and the review-hours estimate is rebuilt for a community-led intake. Dates. Commonwealth Master’s and PhD scholarships close on 20 October. Chevening and the UNICEF post closed on 6 October. |

| --- |



## 1. Summary

The report diagnoses the problem correctly, and the code backs it up with numbers. The 2 October snapshot holds 115 opportunity records. Fifteen are verified and open, and only three of those are in Uganda: the UNICEF Digital Impact Manager post in Kampala and two One Acre Fund roles. The UNICEF post closed on 6 October, so unless records were added since, the live Uganda count is about two.

Another 48 records are open but pending review, and 21 of those are in Uganda (20 of the 21 are jobs). That looks like a quick gain, but the code shows a catch. Of those 21, 12 were scraped from unjobnet.org, 5 from jobsinuganda.alljobspo.com and 3 from advance-africa.com. They point to aggregators, not employers, so each one has to be traced to the employer’s own page before it can be approved. Treat the 21 as a tracing exercise that might yield 10 to 15 verified Uganda listings in the first two weeks, not as a week-one approval.

The three problems in the report share one cause. The system has nowhere to keep something it does not yet believe. A listing is either a row in Opportunity or it is nothing. Sources, social-media leads and user reports have no home, so each one is handled by a hand-written script or not at all. The Phase 3 shadow scraper writes JSON files into a storage bucket because the master plan froze the schema at seven entities, and I found no code that turns one of those files into a reviewable record.

## Why the plan is now community-first

The internet cannot supply 200 listings on its own, and most of what it can supply is not ours to take. Aggregators such as Fuzu and BrighterMonday give no automated access without written permission. Social platforms do not allow scraping, and WhatsApp content is private by design. Newspapers hold the copyright to their ads. Employer careers pages differ site by site, and some forbid robots. ReliefWeb offers an official API, but it needs a pre-approved application name and it leans towards international NGOs. Every one of those routes is worth using where it is clean, but together they cannot reach 150 Uganda-based listings spread across at least 20 organisations.

People can reach what a crawler cannot. Seekers, campus career offices, youth networks and employers themselves see these opportunities daily. The plan therefore makes community submission the main intake, keeps a human approving everything, and traces each lead back to the employer so that what we publish is facts plus a link to the original, never copied text or screenshots.

## What this plan changes



| # | Change | Why it matters | Effort | Section |

| --- | --- | --- | --- | --- |

| 1 | Approve four new tables (Source, Lead, ListingReport, IngestionRun) plus new columns on existing tables | Gives sources, leads and reports a lifecycle, timestamps and an audit trail | M | 5.1, 5.2 |

| 2 | Build the community channel: lead form, helper programme, employer direct posting | Turns people into the main intake while keeping approval with reviewers | L | 5.4 |

| 3 | Add a few permissioned adapters (ReliefWeb API, employer careers pages, RSS) that write Leads, never live listings | Adds a steady, legal trickle, capped so no source dominates | M | 5.4.8 |

| 4 | Replace free-text location with applicant scope plus structured places, enforced as a hard gate, and fix the hard-gate location rule | Stops Addis Ababa jobs ranking in Gulu and stops UK scholarships open to Ugandans scoring zero | M | 5.6 |

| 5 | Automate mechanical trust checks, add a trusted-poster fast path, stop re-ingestion from un-verifying listings, rebuild reporting with timestamps | Reviewer hours go to risky items and the one-day promise becomes measurable | M | 5.5 |

| 6 | Add coverage and concentration KPIs and a hard launch gate: 200 live, 150 in Uganda, no origin above 5 percent | Makes “is it working” a number on the admin dashboard | S | 5.8, 6 |



Recommended order. Decide on the schema (two days). Then, in weeks 1 to 2, trace the 21 pending Uganda records, recruit the first helpers and start employer outreach, while the migration ships in parallel. Community intake and the trust upgrades follow in weeks 2 to 6. The launch gate is checked in week 8. Section 6 has the full schedule.

## 2. Goal, definitions and review method

## 2.1 The goal in testable form

The report sets one launch condition: at least 200 live Uganda-relevant opportunities, each with a source we can point to, and a response to suspicious reports within a day. This revision adds two rules: at least 150 of the 200 are performed in Uganda, and no single source or organisation supplies more than 5 percent. The terms below need a definition before anyone can count against them.



| Term | Definition used in this plan |

| --- | --- |

| Live | verificationStatus is verified, status is open or closing_soon, and the deadline is empty or in the future. |

| Uganda-relevant | A Ugandan resident can apply and act on it: the work is performed in Uganda, or it is remote and accepts Ugandans, or it is a scholarship, fellowship or grant whose eligibility includes Uganda. |

| Performed in Uganda | The work or programme takes place in Uganda: countryCodes includes UG and workMode is onsite or hybrid, or a training or fellowship is delivered in Uganda. Remote roles and study abroad do not count, even when open to Ugandans. |

| Source we can point to | A sourceUrl plus a provenance record (which Source, Lead or organisation it came from, and who reviewed it). Three types are allowed: official_page: on the employer’s or funder’s own domain. application_system: an application system the employer links to, such as PageUp or Workday. org_attested: for a verified organisation with no website of its own. The reviewer has confirmed registration proof and a named contact by phone or work email and logged the call; the sourceUrl is the organisation’s own public page. A submitter’s social post or screenshot is never the sourceUrl. |

| Origin (for the 5% cap) | Who published the listing, not how we found it. An origin is either an organisation (the employer or funder) or a Source (an aggregator or feed such as ReliefWeb). Discovery channels such as WhatsApp, a helper or the lead form are not origins: a lead is traced to the organisation behind it. A listing counts against its organisation. If it came through an aggregator or feed, it also counts against that Source. So ReliefWeb as a Source is limited to 10 live listings even though it carries many organisations. |

| Responded to | A ListingReport moves from open to actioned or dismissed, or gets a reviewer note, within 24 hours of creation. |



## Guardrails so the number of 200 cannot be reached with filler



| Measure | Rule | What it implies |

| --- | --- | --- |

| Live Uganda-relevant listings | At least 200 | The headline target. |

| Performed in Uganda | At least 150 (75 percent) | At most 50 can be remote roles or funding for study abroad that is open to Ugandans. |

| Concentration | No origin above 5 percent: at most 10 live listings from any one organisation or Source at 200 | At least 20 distinct organisations, and realistically about 60 (an average of 3 to 4 each). Planning figure, to be confirmed. |

| Organisational grants | No more than 20 of 200 (10 percent). Proposal for you to confirm. | Grants are 29 of the 115 records today and are no use to a school leaver looking for work. |

| Weak provenance | No more than 50 of 200 (25 percent) rely on org_attested. Proposal, see D9. | Small employers without websites are welcome, but not at the expense of checkable sources. |



How the 5 percent cap is applied. Before the catalogue reaches 200, the cap is an absolute 10 live listings per origin, because a percentage means little when the catalogue has 15 listings. After the launch gate the cap is 5 percent of the live catalogue, tracked as a KPI with an alert. Today’s snapshot is already at the edge: the largest organisation holds 6 of the 115 records (5.2 percent) and advance-africa.com alone is the source of 16 of the 63 open records. Decision D8 explains how the cap is enforced at intake.

## 2.2 Review method

The review runs as eight workstreams. Each has one question, a method that can be repeated, and an output someone can check. Workstream A should start immediately because every other number depends on it. Workstream H is new and tests the community channel with real helpers before the plan relies on it.



|  | Workstream | Question | Method | Output / effort |

| --- | --- | --- | --- | --- |

| A | Catalogue audit | What is actually live, and what can a Ugandan see today? | Re-run scripts/audit-catalog.ts against production, then the coverage and concentration SQL in 2.3. Compare with the 2 October snapshot. | Fresh snapshot, one-page coverage table, concentration table. 0.5 day |

| B | Schema and migration review | What must change in the data model, and how do we ship it safely? | Draft the migration from Appendix A, run it on a Supabase preview project, extend scripts/check-rls.ts to the new tables, dry-run the backfill. | Reviewed migration and rollback notes. 2 days |

| C | Sources and legality | Which sources can we legally and reliably read, and what does each yield? | Build the source registry. For each candidate record the robots.txt result, terms, structure (API, JSON-LD, RSS, HTML only) and a 20-listing sample parse. No Source is approved without a recorded terms review. | Source registry with go or no-go per source. 3 days |

| D | Trust and abuse | Where can a scam listing get through, and where can an honest listing be pulled unfairly? | Replay 30 known scam patterns and 30 legitimate listings through the checks. Review the report flow and the community channel against the abuse cases in 5.4.7 and 5.5. | Scam test set and signal tuning. 2 days |

| E | Eligibility and matching | Does every seeker see only listings they can act on? | Implement the visibility function behind a flag, run it in shadow mode against all live users, review each listing it would hide. Include the hard-gate location fix. | Diff report (would hide, would show). 2 days |

| F | Performance and operations | What breaks at 1,000 to 5,000 listings? | Run scripts/audit-capacity.ts with a synthetic 3,000-row catalogue. Profile the feed and the freshness worker. | Bottleneck list. 1 day |

| G | Privacy and compliance | What personal data do leads, screenshots and helpers bring in, and what do submission terms need to say? | Map data flows for lead intake. Draft submission terms and a takedown route. Confirm retention and consent wording, and whether registration is needed, with whoever advises on the Data Protection and Privacy Act 2019. | Data flow note, draft terms, retention rule. 1.5 days |

| H | Community channel pilot | Do real helpers and employers produce traceable leads, and how fast? | Pilot with 5 helpers (for example from ISBAT and a youth network) and 10 employers for two weeks using the quick-add form. Log every lead from submission to outcome. | Measured funnel and time to live. 3 days plus the pilot |



## 2.3 Coverage queries for Workstream A

The location match below is crude on purpose, because location is free text today. It is good enough to size the problem and is replaced by countryCodes once the migration lands. These are drafts: check the column names against prisma/schema.prisma before running them.

-- Live listings, how many are in Uganda, by category

select ("location" ~* 'uganda|kampala|jinja|gulu|entebbe|mbarara|mukono|wakiso|lira|arua')

as in_uganda, category, count(*)

from "Opportunity"

where "verificationStatus" = 'verified'

and status in ('open','closing_soon')

and (deadline is null or deadline > now())

group by 1, 2 order by 1 desc, 3 desc;

-- Concentration by organisation (should stay at or under 5 percent)

select "organizationId", count(*) as live,

round(100.0 * count(*) / sum(count(*)) over (), 1) as pct

from "Opportunity"

where "verificationStatus" = 'verified' and status in ('open','closing_soon')

and (deadline is null or deadline > now())

group by 1 order by live desc;

-- Concentration by source host

select substring("sourceUrl" from '^https://([^/]+)') as host, count(*) as live

from "Opportunity"

where "verificationStatus" = 'verified' and status in ('open','closing_soon')

group by 1 order by live desc;

-- Pending review queue (what we can convert fastest once traced)

select id, title, "organizationName", location, deadline, "sourceUrl"

from "Opportunity"

where "verificationStatus" = 'pending' and status in ('open','closing_soon')

order by (location ~* 'uganda|kampala|jinja|gulu') desc, deadline nulls last;

-- Live listings with no usable provenance (should return zero rows)

select id, title from "Opportunity"

where "verificationStatus" = 'verified' and ("sourceUrl" is null or "sourceUrl" !~ '^https://');

## 3. Findings from the codebase

Thirteen findings, in the order they affect the goal. “Evidence” names the file or record so each one can be checked rather than taken on trust. F2, F8 and F11 are new in this revision, and F7 is corrected.



| ID | Finding | Evidence | Consequence |

| --- | --- | --- | --- |

| F1 | Coverage is thin and mostly foreign | catalog-snapshot.json: 115 records. verified/open 15, pending/open 37, pending/closing_soon 11, flagged 1, closed 51. Of 57 Uganda-located records, 52 are pending. The verified open set is 6 grants, 3 scholarships, 3 internships, 3 jobs. Categories overall: 58 jobs, 29 grants, 12 fellowships, 10 scholarships, 5 internships, 1 consultancy. | A Ugandan opening the app sees UNESCO internships, an African Union post in Addis Ababa and UK scholarships. This is the report’s problem 1. |

| F2 | The existing catalogue came from aggregators and is concentrated (new) | 103 of 115 records have source “scraped” and 12 are “org_submitted”. The 21 pending open Uganda records come from unjobnet.org (12), jobsinuganda.alljobspo.com (5), advance-africa.com (3) and pandemic-fund.org (1), spread over 11 organisations, two of which hold 5 each. Across all 115 records, 79 organisations appear and the largest holds 6. | None of the aggregator-sourced records meets the provenance rule until traced to the employer. The same sites would break the 5 percent cap if used as sources. I have not reviewed those sites’ terms. |

| F3 | Review does not scale | scripts/review-pending-catalog.ts and import-reviewed-jobs.ts hard-code evidence for specific records and refuse to apply on any date except 2026-10-02. audit-pending-sources.ts proves a URL answers, not that it is genuine: 93 of 100 returned HTTP 200. | Each batch needs a new hand-written script. There is no queue, no evidence capture and no throughput figure. |

| F4 | No ingestion backbone | runShadowDiscovery takes one URL and one organizationId per call, triggered from an admin route. Output goes to a storage bucket as JSON. The only workers are freshness, notifications, telemetry retention and documents sweep. Nothing records which sources exist, how often they were read or how they failed. | Discovery depends on a person pasting URLs. I found no code that promotes a shadow candidate into a reviewable record. This is the report’s problem 2. |

| F5 | The schema freeze is already lifted in practice | docs/deviations.md still records no deviations and says shadow data went to a bucket because the master plan forbids tables beyond seven entities. Since then ten further models were added: StoredDocument, SeekerAccessLog, SeekerPipelineEntry, Feedback, RequestMetric, WebVitalSample, MatchRun, UnmatchedTerm, AdminAccessLog and MetricRollup. | Allowing four more tables costs little. It needs a written decision, not a debate. |

| F6 | No concept of who may apply | Eligibility in domain.ts covers education, field, experience, age, certifications and three programme-rule fields. UserProfile has no nationality, country of residence or openness to working abroad. The African Union record says “OppScout does not currently collect nationality.” | Whether a listing suits a Ugandan lives in free-text descriptions. The audience badge cannot exist yet. |

| F7 | Location conflates two ideas and is not a gate (corrected) | OrbitMatch, the default engine (engine-selector.ts), scores location with locationSimilarity: equality, a commuting zone, a shared region, or the literal “uganda”. Location carries weight 10 of 85. “Jinja, Uganda; Minna, Nigeria; Kinshasa, DRC” equals no single place, so it scores 0 even for a Jinja seeker. Chevening’s location “United Kingdom” scores 0 for the Ugandans it targets. Remote listings always get full credit. The older rule-based engine uses substring matching, so that Jinja case would match there. | A Gulu seeker can see an Addis Ababa job, only ranked lower. Remote roles show whether or not they accept Ugandans. Add a regression test for the Jinja case against OrbitMatch. |

| F8 | The hard eligibility gate also gets location wrong (new) | hard-gates.ts compares profile.location for exact equality with each programme-rule value. The Rhodes Scholarship rule allows “Kampala” and “Uganda” (among others). A seeker whose profile says “Gulu” fails the gate, so the scholarship is removed from their feed entirely. | Fixing the audience gate alone would leave this bug. Eligible Ugandans outside Kampala silently lose listings. |

| F9 | Trust checks are shallow and one-sided | automated-signals.ts uses six English regexes, an HTTPS test and a passed-deadline test. It never compares the apply link with the organisation’s officialLinks. The pattern /mobile money/i would flag a legitimate telecom vacancy. reportSuspiciousListing flags a listing on a single report and writes a bare event. ListingReport does not exist, so reports have no status and no resolved time. | Scams that avoid six phrases pass. One malicious user can pull any listing. The one-day promise cannot be measured. This is the report’s problem 3. |

| F10 | Verified organisations still wait | submitOrganizationOpportunity requires a verified organisation and a staff member on its dashboardUsers, then ingestManualOpportunity always creates the listing as pending. | The employer-direct path is half built. Reviewers spend time on the safest items. |

| F11 | Re-ingestion can un-verify a live listing (new) | In ingestManualOpportunity, when a duplicate exists and the incoming source is at least as authoritative, the update sets verificationStatus to pending (or flagged). A verified listing that is re-submitted, or re-read by a daily adapter, drops back to pending and leaves the feed. | Any scheduled adapter or an employer re-posting its own job would quietly remove verified listings. This must be fixed before the first adapter runs. |

| F12 | Deduplication and lifecycle will not hold at volume | findDuplicateOpportunity loads every listing of the same organisation and origin for each check. Cross-source copies of one job are missed when organizationId is null. No URL canonicalisation. refreshOpportunityLifecycle loads all rows and issues one UPDATE per change. Date-only deadlines are stored at the start of the closing day. Verified listings go stale after 30 days without a re-check. | Fine at 115 rows, slow at several thousand. Listings disappear on their last open day, which costs a Ugandan applicant a day. |

| F13 | AI extraction is sound but narrow | anthropic-extractor.ts treats page text as untrusted and validates tool output with zod. It does not return evidence quotes or confidence and accepts text only (no screenshots). ai-rules.ts sets a per-call limit of 1,200 tokens and a 20-second timeout, with the model defaulting to claude-sonnet-4-20250514. I found no monthly spend ceiling. | Good base for leads. It cannot read the WhatsApp and Instagram screenshots that community members will send. |



## What to protect

Several decisions in this codebase are right and the plan builds on them. Matching is deterministic and offline (OrbitMatch), so growing the catalogue adds no AI cost per seeker. Automated scraping and AI matching are behind feature flags that fail closed. Every table sits behind row-level security with server-only access. Review decisions carry notes and reviewer IDs, and the import scripts default to dry-run. The repository has 25 unit test files plus contract and end-to-end specs (read, not run). The organisation submission path already exists and is the seed of the employer-direct channel. None of that should be traded away for speed.

## 4. Target architecture

The design adds one idea: a candidate is a different thing from a listing. Candidates (Leads) are cheap, may be wrong, and carry provenance. Listings are what seekers see, and only a reviewed Lead can become one. Three lanes feed the same pipeline, and the community lane is the largest.



| Stage | What happens | Reuse | New |

| --- | --- | --- | --- |

| 1. Discover | Lane A, community: seekers, helpers and employers submit links, screenshots and posts. Lane B, employer direct: verified organisations post through the existing portal. Lane C, permissioned adapters: a scheduled worker reads approved Sources (API, careers page, RSS). Admins can paste leads. | submitOrganizationOpportunity, scripts/worker pattern, rate-limit.ts | Lead form and /api/v1/leads, helper status page, SourceAdapter interface, ingest worker |

| 2. Canonicalise | Strip tracking parameters, resolve redirects, lowercase host, hash title plus organisation plus deadline into a fingerprint. | normalize.ts | canonicalUrl(), fingerprint() |

| 3. De-duplicate | Exact match on fingerprint or canonicalUrl first, then the existing title-similarity rule, now in SQL. | deduplication.ts (0.85 similarity, 3-day window) | Indexed lookup, cross-source match |

| 4. Extract | Parse JSON-LD JobPosting or API fields first. Use the AI extractor only for what remains, and require a quoted evidence snippet per field. Screenshots are read here and then used only as evidence. | anthropic-extractor.ts, zod schema | Deterministic parsers, evidence fields, image input |

| 5. Trace and check | Link the lead to the real organisation and its own page. Run automated signals and score risk. Record the provenance type. | automated-signals.ts, checklist.ts | apply-link.ts, scam patterns v2, provenanceType |

| 6. Route | Low risk from a trusted poster goes to a fast review lane. Everything else goes to the standard queue. High risk is rejected or flagged. Origins at the cap wait. | reviewOpportunity, 5-item checklist | Routing rules, trustedPoster, cap rule |

| 7. Publish and watch | A verified listing appears if the audience gate allows it. Link checker and freshness worker keep it honest. Reports feed back in. | Freshness worker, KPI dashboard | Link checker, ListingReport, coverage and concentration KPIs |



Rules kept from the existing design. Adapters write Leads and, at most, pending listings. Nothing automated writes a verified listing. The automatedScraping flag stays off until the measured duplicate and freshness error targets (1 percent each) pass on the new pipeline. Rule added: re-ingestion never lowers a verified listing’s status (finding F11, section 5.5).

## 5. Remediation in detail

## 5.1 Decision zero: lift the table freeze on the record

Add a short entry to docs/deviations.md in the style already used there: the master plan’s seven-entity rule is superseded for source registry, lead intake, listing reports and ingestion runs, because the original reason (a staging table for shadow data) now applies to the whole intake path. The file currently records no deviations at all, so this entry should also list the ten models added since. Follow the migration habits the repo already has. Each new table gets a Prisma migration in prisma/migrations and its mirror in supabase/migrations, a row-level-security policy that allows server access only (copy the pattern of 20260925210023_server_repository_data_api_access), and a line in scripts/check-rls.ts so the check fails if a table is exposed.

## 5.2 Data model changes

Appendix A has the Prisma blocks. In summary:

Source: one row per place we read from, with kind, base URL, optional owning organisation, status (proposed, approved, paused, blocked), a terms review date and notes, crawl interval and consecutive-failure count. Nothing runs against a Source that is not approved.

Lead: one row per candidate, with channel (whatsapp, tiktok, instagram, facebook, linkedin, newspaper, web, email, employer, other), submitter, raw URL, canonical URL, private screenshot path, extracted facts, candidate organisation, official URL once traced, a unique fingerprint, status (new, tracing, traced, rejected, duplicate, promoted, expired) and timestamps.

ListingReport: opportunity, reporter, reason, details, status (open, actioned, dismissed), created, resolved and resolver. This replaces the current behaviour of writing a bare event and flagging at once.

IngestionRun: per-run counts of fetched, new, updated, duplicate and failed items, so source health is a query and not a guess.

Opportunity gains: audience, countryCodes, regions, remoteEligibility, eligibleCountries, provenanceType, sourceId, leadId, canonicalUrl, contentHash, deadlineDateOnly, lastSeenAt and needsRecheck.

Organization gains: officialDomains, trustedPoster, verifiedAt, verifiedBy. officialDomains is derived from officialLinks at write time so domain checks are a set lookup.

UserProfile gains: countryOfResidence (default UG) and openToAbroad (default false). I recommend not adding nationality yet (decision D3).

## 5.3 Cleaning up the existing 115 records

Run this as one script, scripts/clean-catalog.ts, following the repo convention: dry-run by default, --apply to write, review decisions preserved, and a JSON change log written to docs/audits.

Do first, this week. Run the freshness worker so Chevening and the UNICEF post (both closed 6 October) are marked closed. Re-verify the Commonwealth Master’s and PhD scholarships now, because both close on 20 October. They are the most useful verified listings for Ugandan graduates and have only days left.

Close and archive. The 51 records already closed (10 verified, 41 pending) stay in the table because they teach the de-duplicator what we have seen, but they are excluded from every seeker query.

Classify audience. Rules first: a location naming a Ugandan place sets countryCodes to UG and audience to uganda_residents unless the text says otherwise. Phrases such as “eligible countries”, “African nationals” or “AU member state” produce a proposed audience. Anything the rules cannot settle gets an AI proposal marked proposed. A person confirms every proposal. The output is a CSV the reviewer works through, not a silent update.

Trace the 21 pending Uganda records to their employers. For each, find the job on the employer’s own careers page or application system. If found, record the employer page as the sourceUrl and review it with the checklist in 5.5. If not found, the record stays pending and is never cited to the aggregator. These 21 come from 11 organisations, so most fit under the 5 percent cap, but the 12 from unjobnet.org must not all become verified under one source.

Re-verify the 15 verified records. Confirm each source page still says what the record says. Nine of the 12 non-Uganda ones are grants or scholarships (eight are still open now that Chevening has closed), which fit within the allowance of up to 50 non-Uganda listings.

Record the result. Write the final counts, including the concentration table, back to the audit snapshot so the 200 target has a trustworthy baseline.

Expected result: the Uganda-verified count rises from about two to somewhere between 10 and 20 by the end of week 2, depending on how many of the 21 can be traced to a genuine employer page. Treat that as a hope to test, not a forecast.

## 5.4 Community submission: the backbone

## 5.4.1 Why people, not crawlers, carry the catalogue

Each way of reading the internet has a legal or practical limit. The table shows what we can do with each, and which of those limits make community submission necessary. I have not reviewed the individual terms of the named sites; each Source gets a recorded terms review before it is approved (Workstream C).



| Route | What we can do | Limit |

| --- | --- | --- |

| Employer and funder careers pages | Read the page politely (robots.txt respected, one request per second per host, daily). Use schema.org JobPosting JSON-LD where present. Store facts and the link. | Some sites forbid robots or emit no structured data. Yield varies by site and each one needs its own terms check. Start with about 30 official sources. |

| ReliefWeb API | Query jobs filtered to Uganda through the official v2 API. It already classifies type, career category and experience. | API v1 is retired and, from 1 November 2025, every call needs a pre-approved appname. Apply on day one. Store facts and the link only, and read its content terms. Leans towards international NGOs, so as a Source it is capped at 10 live listings. |

| Fuzu, BrighterMonday and similar aggregators | Nothing automated without written permission. A person who sees a job there can submit the link as a lead, and we trace it to the employer. | Never a sourceUrl. Ask each for permission, a feed or a partnership (D6). Until a yes arrives they are discovery hints only. |

| Social platforms (WhatsApp, TikTok, Instagram, Facebook) | Receive what people choose to send us. Read the screenshot to extract facts, then treat it as evidence only. | No scraping, and WhatsApp groups are private. A post is never published and never the sourceUrl. |

| Newspapers | Read feeds where they exist. Keep title, link and dates. Extract facts transiently. | Never store article text. Ads often print only a contact email, so they usually become leads needing tracing. |

| Community and employers | People submit links, screenshots and notes. Employers post their own jobs. We hold the right to publish facts and a link because the submitter or employer gave them to us. | Needs submission terms, tracing, rate limits and review capacity. This is where most of the 200 must come from. |



## 5.4.2 Four lanes of community intake



| Lane | How it works | Who it suits |

| --- | --- | --- |

| Seekers and the public | A signed-in user pastes a link or uploads a screenshot with an optional note. The lead enters the queue and the submitter can see its status. | Anyone who spots an opportunity on WhatsApp, TikTok, Instagram or a notice board. |

| Helpers | Campus career offices, student guilds, youth networks and community centres register as helpers. They get a short training, a quick-add form and a status page that shows which of their leads went live. | ISBAT and the youth networks you already work with are practical first pilots, since you can ask in person. Target 8 to 10 helpers by week 4. |

| Employers direct | A verified organisation posts through the existing portal, and the fast lane applies. An employer not yet verified fills a “post a job” form that creates a Lead and starts organisation verification. | Banks, telecoms, universities, ministries, NGOs, and small Ugandan firms that advertise only on Facebook or WhatsApp. Build an outreach list of 100 organisations. |

| Partners | Written arrangements with aggregators, university career services, chambers of commerce or professional bodies, who send feeds or batches of leads. | Fuzu and BrighterMonday once permission is given. Each partner is a Source and is subject to the same 5 percent cap. |



## 5.4.3 From lead to listing: the tracing rule

Endpoint and form. POST /api/v1/leads for signed-in users, plus a quick-add box in the admin area. Use the existing Upstash limiter, but the public tier of 30 a minute is too generous for uploads: set a tighter per-user daily cap.

Screenshot reading. Extend the extractor to accept an image and return the same fields plus a quoted evidence line for each. A human sees the screenshot beside the extracted facts.

Tracing rule. A lead may be promoted only when it has an official page or application system link on a domain recorded for the organisation, or the organisation is verified and the reviewer attaches evidence that the post is genuinely the organisation’s (registration record, work email confirmation, named contact, a logged call). That produces an official_page, application_system or org_attested record.

What we publish. Facts in our own words plus a link to the original. We do not republish the submitter’s screenshot, a competitor’s copied advert text or any personal data in it.

Clock. Triage within 48 hours. A lead untraced after 7 days expires automatically with a reason code. Expiry is normal and the reasons feed back into source quality.

## 5.4.4 Helper programme

Recruit and train. One-hour onboarding using real examples of genuine and fake listings. Ask helpers to crop screenshots so other people’s names and numbers are not shown.

Status page. Each helper sees every lead they sent with its status and reason code. Seeing which leads went live is the reward that keeps people submitting.

Recognise quality, not volume. Rank and recognise helpers by listings that went live and stayed live, not by raw submissions. Counting raw leads would reward spam. I recommend recognition and references rather than payment per lead until the funnel is measured (D10).

Watch concentration. Track each helper’s share of promoted community listings. No helper should account for more than about 20 percent, so the channel does not depend on one person.

## 5.4.5 Employers posting directly

Free, verified once. Offer organisations a free account. Verification is done once per organisation (see 5.5), and every later post from it takes the fast lane.

Organisations without a website. Many small Ugandan employers advertise only on Facebook or WhatsApp. For them, provenance is org_attested: a registration or institutional proof, a named contact reached by phone or work email, and a logged reviewer note. Check the right registry for each type of body (for example the company registry or the NGO Bureau). This is how the 150-in-Uganda target is reachable, but it is capped at 25 percent of the catalogue until you decide otherwise (D9).

Spread, do not stack. Because of the 5 percent cap, outreach should aim for many organisations with a few posts each, not a few large ones with many.

## 5.4.6 Legal and policy basis for community submissions

Community submission lowers, but does not remove, legal exposure. Before launch, ask counsel to confirm the points below under Uganda’s Data Protection and Privacy Act 2019 and the law on copyright and defamation. I am flagging them for advice, not giving legal conclusions.

Submission terms. The submitter confirms they may share the content, that it is not private or confidential, and that it contains no personal data about others beyond what the advert itself prints. We publish only facts and a link.

Takedown and correction. Any employer can ask for a correction or removal. Respond within 24 hours and log it as a ListingReport.

Submitter data. Collect the minimum (account, optional phone). Keep screenshots in a private bucket and delete them 30 days after the lead resolves, using the documents-sweep worker as the model.

Registration and notices. Ask counsel whether OppScout must register with the Personal Data Protection Office and what notice and consent wording submitters need.

Aggregator content. The existing 103 scraped records came largely from aggregator pages. Ask counsel whether any need removal, and replace them with employer-sourced versions regardless.

## 5.4.7 Abuse of the community channel



| Abuse | Defence |

| --- | --- |

| Scammers submit their own fake listing as a “lead” | Nothing is published without the tracing rule. A scammer’s post cannot become a verified listing without a link on the organisation’s own domain or a verified organisation with a confirmed contact. |

| Spam or flooding | Per-user daily cap, fingerprint de-duplication, and recognition based on listings that went live. |

| Self-promotion or competitor sabotage | Reviewer follows the link to the employer. Reports need an independent second reporter or a pattern match before a listing is hidden. |

| Fabricated helper accounts | Helpers are invited by an admin and approved. Their leads show in a helper-level quality report. |

| One organisation dominating through many helpers | The 5 percent per-origin cap applies regardless of who submitted the lead. |



## 5.4.8 Permissioned adapters (the smaller lane)

Define one interface and keep each source small. Each Source needs a recorded terms review and an approved status before anything runs against it.

export interface SourceAdapter {

readonly kind: 'api' | 'careers_page' | 'rss' | 'newspaper';

fetchSince(source: Source, since: Date): AsyncIterable<RawListing>;

}

// RawListing = { url, title?, organizationName?, location?, deadline?, bodyText?, jsonLd? }

ReliefWeb API: map fields into RawListing. Apply for the appname on day one and use API v2.

Careers pages: read JSON-LD when present and use the AI extractor only for what is missing. Start with 30 official sources: banks, telecoms, universities, ministries and agencies, and the larger NGOs.

RSS and newspaper feeds: keep title, link and dates only.

Run schedule: use whichever runtime already runs worker:freshness. If none is set up, a scheduled GitHub Actions workflow calling tsx scripts/worker/ingest.ts is the lowest-effort option. Each run writes an IngestionRun row, and three consecutive failures pause the Source and show it on the admin dashboard.

Cap: with 10 live listings per Source and each organisation also capped, adapters should yield about 40 of the 200.

## 5.5 Verification and trust

## Check the organisation once

The Organization record already has officialLinks, officialEmail, registrationProof and accountableContact. Add verifiedAt, verifiedBy and trustedPoster. An organisation is verified when a reviewer confirms four things and records evidence for each: a registration or institutional proof, an official website or verified public page, a working email on that domain or a confirmed phone contact, and a named person reachable by phone or email. Derive officialDomains from the links.

## Check each post, automatically where possible



| Check | Automated? | Rule |

| --- | --- | --- |

| Apply link host belongs to the organisation or a known application system | Yes | Compare host with officialDomains. Known systems (PageUp, Workday, Greenhouse, Lever) are an allow-list. Google Forms are common among small Ugandan organisations, so a form link is review, not block. |

| Link is not a shortener, chat link or file-share page | Yes | Flag bit.ly-style shorteners and wa.me. Review, not reject. |

| Contact email is on the organisation’s domain | Yes | A free mail address (gmail, yahoo) on a post claiming to be a bank or telecom is high risk. For org_attested organisations, the confirmed contact replaces this check. |

| No payment or sensitive-data request | Yes, then human | Patterns v2 below. A match means high risk. |

| Details agree with each other | Partly | Title, organisation, deadline and location are consistent between the source page and the extracted fields. The AI proposes, the reviewer confirms. |

| Deadline plausible, duplicate checked | Yes | Existing checks, now fed by fingerprints. |

| Source is the original, not a copy | Human | The reviewer follows the link to the employer page and records it. |

| Origin is under the cap | Yes | Count live listings for the organisation and Source. At 8 the origin is deprioritised, and at 10 further items wait (D8). |



Scam patterns v2. Keep the current six and fix the over-broad one: “mobile money” alone should not fire, but “send”, “pay” or “deposit” within a few words of it should. Add registration, processing, training, medical, uniform and visa fees; guaranteed job abroad or guaranteed visa; “no experience, earn per day”; “WhatsApp only” application with no organisation page; and requests to buy a CV pack or a certificate. You speak Luganda and Swahili, so the list needs your phrases for the local variants. I have not invented translations here: collect them from real reported posts.

## Re-ingestion must never lower a verified listing

This fixes finding F11. When a duplicate of a verified listing arrives from an adapter, a helper or the employer:

If the title, deadline, location, application method and source link are unchanged, do nothing except update lastSeenAt.

If the deadline or description changed, update the facts, keep the listing visible, and set needsRecheck so a reviewer sees it.

If the application method or source link changed, hide the listing (back to pending) until a reviewer confirms, because a changed apply link is a known hijacking pattern.

If a suspicious pattern matches, flag it, as today.

## Routing



| Signals | Route | Notes |

| --- | --- | --- |

| Trusted poster, low risk, no change to key fields | Fast lane: one-screen summary, reviewer approves | Reviewer still approves. Draw a 10 percent random sample for a full check. |

| Known organisation, no red flags | Standard queue, checklist pre-filled | Target under 10 minutes per record. |

| Unknown organisation | Organisation verification first | Listings wait. The organisation is done once. |

| Origin already at the cap | Wait in pending with reason “held: origin at cap” | Released when the catalogue passes the gate or another listing from that origin closes. |

| Any high-risk signal | Reject, or flag and hold | Record the signal so patterns improve. |



This keeps the existing rule that only the review endpoint approves content. Today a verified organisation’s post still lands as pending, so the fast lane is mostly a queue-ordering and pre-fill change, not a loosening of approval.

## Reports

Replace the single-report flag with a rule that reflects the harm. A report claiming a payment or sensitive-data request hides the listing at once if the automated scan finds a matching pattern, because someone could lose money while it waits. Other reports go to the queue with a priority, and a second independent reporter within seven days hides the listing pending review. A trusted poster’s listing that draws a report is hidden and the organisation’s standing is reviewed. A per-user daily cap blocks mass reporting. The report button already exists. What changes is the ListingReport table and the response clock.

## 5.6 Audience, location and visibility

This addresses the report’s step 4 and the finding that jobs in Addis Ababa can rank in Gulu. The core idea is to separate where the work or study happens from who is allowed to apply.



| Field | Meaning |

| --- | --- |

| audience | uganda_residents, ugandan_citizens, african_nationals or global. These are the four labels in the report (people in Uganda, Ugandans abroad, Africans, everyone). Null means unclassified and hidden. |

| countryCodes, regions | Where it happens, as ISO country codes and normalised place names that map onto the ontology’s LOCATION_PARENT keys. One listing can have several countries, which fixes the One Acre Fund case. The free-text location stays for display. |

| remoteEligibility | unknown, uganda, east_africa, africa or global. Unknown is the default and is hidden, which implements the report’s rule that remote jobs show only if they accept Ugandans. |

| eligibleCountries | Explicit list for “eligible countries” grants and scholarships. If present and it lacks UG, the listing is hidden. |



The gate is a pure function, easy to test and run in SQL as a pre-filter before scoring. This version corrects the earlier draft: an onsite listing with no countryCodes is now hidden for everyone (matrix row 11), and the handling of the citizen and national labels is explicit.

// src/services/matching/audience.ts

const FUNDING = new Set(['scholarship', 'fellowship', 'grant']);

const REMOTE_OK = new Set(['uganda', 'east_africa', 'africa', 'global']);

export function isVisibleToSeeker(profile: UserProfile, opp: Opportunity): boolean {

if (!opp.audience) return false;                         // unclassified: fail closed

const inUganda = (profile.countryOfResidence ?? 'UG') === 'UG';

// Nationality is not collected (decision D3), so ugandan_citizens, african_nationals

// and global listings are shown to every seeker and carry an audience badge.

if (opp.audience === 'uganda_residents' && !inUganda) return false;

if (opp.eligibleCountries.length && !opp.eligibleCountries.includes('UG')) return false;

if (opp.workMode === 'remote') return REMOTE_OK.has(opp.remoteEligibility);

if (FUNDING.has(opp.category.toLowerCase())) return true; // study location is not a barrier

if (opp.countryCodes.length === 0) return false;         // unclassified location: fail closed

if (opp.countryCodes.includes('UG')) return true;        // Uganda work shows to everyone

return profile.openToAbroad === true;                    // foreign onsite work

}

## Fix the hard-gate location rule (finding F8)

In hard-gates.ts, programme rules of type location compare profile.location for exact equality. Resolve the seeker’s town to its country first, so “Gulu” also counts as “Uganda”. This keeps rules that name a specific town strict while letting Ugandans anywhere meet rules that name the country.

// hard-gates.ts: values used for the 'location' programme rule

function residenceTerms(profile: UserProfile): string[] {

const town = normalize(profile.location ?? '');

const country = (profile.countryOfResidence ?? 'UG') === 'UG' ? ['uganda'] : [];

return [town, ...country];                               // 'gulu' -> ['gulu', 'uganda']

}

## Three smaller changes

Funding location credit. In the OrbitMatch location dimension, return full credit for scholarship, fellowship and grant categories, with the detail line “Study location is set by the programme”. That stops a UK scholarship open to Ugandans losing 10 of its 85 points, and it changes no weights.

Audience badge. Show it on the listing card and match card: “Open to people in Uganda”, “Open to Ugandans abroad”, “Open to African nationals”, “Open to everyone”.

USSD. Apply the same gate to the USSD menus so a feature-phone user never receives something they cannot apply for.

Because the gate hides listings, ship it the way the repo ships risky things: behind a new audienceGate flag that starts off. Run it in shadow mode, logging for each live seeker which listings it would hide, and review the diff before enforcing. Re-run scripts/sim/orbit-simulation.ts before and after the scoring tweak and keep the output with the change.

## 5.7 Scale and operational hardening

Filter in SQL. repository.listOpportunities returns every row and the feed filters in memory. Move status, verification, deadline and the audience pre-filter into the query, and add a partial index on (audience, status) where verificationStatus is verified.

Bulk lifecycle. Replace the per-row loop in refreshOpportunityLifecycle with two statements: close everything whose deadline has passed, and mark stale everything past its staleness window. Return counts from the statements.

Deadlines. Add deadlineDateOnly. When a source gives a date without a time, store the end of that day in East Africa Time and show “Closes 17 Nov”. Listings then stay up through their last open day. Keep the conservative rule only when a time is known.

Link checker. Turn audit-pending-sources.ts into a weekly worker (worker:linkcheck) for every live listing: 404 or 410 moves it to stale, and repeated timeouts raise an admin alert. Store lastSeenAt on each pass.

Dedup in the database. Query by fingerprint and canonicalUrl through indexes, then apply title similarity only to a short candidate list.

Model choice and spend. Keep the model behind the existing ANTHROPIC_MODEL variable. Extraction is structured and tool-constrained, so test a smaller current model against a 50-listing hand-labelled set before paying for the larger one, and set a monthly spend ceiling in configuration (none exists today). Check the current model names in Anthropic’s documentation before pinning.

Admin review screen. One screen per item: source page link and snapshot hash on the left, extracted fields with their evidence quotes on the right, the checklist pre-filled from automated signals, the origin’s current share of the catalogue, and an Approve, Edit or Reject action. Log time to decision for every review.

## 5.8 Measuring progress

Add these to the existing KPI dashboard and to slo-targets.ts, which already holds the freshness and delivery targets.



| Metric | Definition | Target |

| --- | --- | --- |

| Live Uganda-relevant listings | Count under the 2.1 definition | 200 at launch (gate) |

| Performed in Uganda | Live listings with UG in countryCodes and onsite or hybrid work | At least 150 of the 200 |

| Largest origin share | Top organisation or Source as a share of live listings | At most 10 live listings until the gate, then under 5 percent |

| Distinct organisations | Organisations with at least one live listing | At least 20 (hard floor), about 60 planned |

| Listings with provenance | Live listings with a sourceUrl and a Source, Lead or organisation link | 100 percent |

| Weak provenance share | Live listings with provenanceType org_attested | At most 25 percent (D9) |

| Channel mix | Share of live listings by lane: community, employer direct, adapter, existing | Tracked. Community expected to be the largest |

| Lead funnel | New, traced, promoted, rejected, expired per week by channel and by helper | Tracked. Replaces the planning assumptions below |

| Median time, lead to live | Lead created to listing verified | Under 5 days after week 4 |

| Source health | Failure rate and last success per Source | No approved Source silent for more than 3 days |

| Report response | Share of ListingReports with a first response inside 24 hours | At least 95 percent; 100 percent inside 72 hours |

| Dead links among live listings | Weekly link-check failures | Under 2 percent |

| Audience gate correctness | Pass rate on the Appendix B matrix, plus reviewed shadow diff | 100 percent |



## Capacity check

Review is the true constraint, and a community-led intake moves most of the effort into tracing. These are my assumptions, not measurements. The planning mix for the 200 is: existing catalogue 25, employer direct 45, adapters 40, community 90. At a 40 percent conversion from lead to live, 90 community listings need about 225 leads. Adapter leads convert better, so 40 listings need about 70.



| Task | Volume (assumed) | Minutes each | Hours |

| --- | --- | --- | --- |

| Review of prefilled records | 200 listings | 10 | about 33 |

| Community lead triage and tracing | 225 leads | 15 average | about 56 |

| Adapter and partner lead triage | 70 leads | 5 | about 6 |

| Organisation verification | 60 organisations | 30 | 30 |

| Total |  |  | about 125 |



That is about 16 hours a week over eight weeks, or three reviewers at roughly 5 to 6 hours each. Replace both the conversion rate and the minutes with measured values once the funnel has run for two weeks (Workstream H).

## 6. Roadmap

Eight weeks, with content work and engineering running in parallel. The gate moves from week 6 to week 8 because the 150-in-Uganda rule and the 5 percent cap mean at least 20 and realistically about 60 organisations must be verified, and community intake needs time to ramp up. Week numbers start from approval of decision D1.



| When | Engineering | Content, community and review | Exit check |

| --- | --- | --- | --- |

| Days 1 to 2 | Write the deviations entry. Draft the migration. Apply for the ReliefWeb appname. Re-run the catalogue audit. | Name three reviewers. Re-verify Commonwealth scholarships (close 20 October). Decide D2 to D10. Draft the submission terms and the outreach list of 100 organisations. | Decisions recorded, fresh snapshot saved |

| Weeks 1 to 2 | Ship the migration with RLS. Repository methods in prisma, supabase and memory adapters. Fix F11 (never lower a verified listing) and F8 (hard-gate location). Admin quick-add for leads. Visibility function and badge behind audienceGate (off). clean-catalog.ts and the classify script. | Close and archive. Trace the 21 pending Uganda records to employers. Re-verify the 15 live. Recruit and train the first 5 helpers. Begin employer outreach and organisation verification. Start the Workstream H pilot. | Uganda-verified at least 12, at least 8 distinct organisations. Gate matrix passes |

| Weeks 2 to 4 | Lead endpoint and public form. Image extraction. Helper status page. SourceAdapter, careers-page and ReliefWeb adapters (if approved), ingest worker, IngestionRun. Link checker. | Registry of 30 sources with go or no-go. 8 to 10 helpers active. 30 organisations verified. Begin Fuzu and BrighterMonday outreach. Review the first 100 leads. | 60 live, 45 in Uganda, at least 20 organisations. Funnel measured |

| Weeks 4 to 6 | Trust v2: apply-link checks, patterns v2, trustedPoster and the fast lane. ListingReport and the new report rules. Review screen. KPI additions including concentration. Cap rule at intake. | Verify up to 60 organisations in total. Build the scam test set from real reports. Collect Luganda and Swahili phrases. Weekly concentration review. | 130 live, 100 in Uganda, at least 40 organisations. Review time under 10 minutes |

| Weeks 6 to 8 | SQL-level feed filtering, bulk lifecycle, date-only deadlines. Capacity run. Turn audienceGate on after the shadow diff review. | Fill coverage gaps by cohort and region. Rebalance the mix against the guardrails. Final provenance audit. | Launch gate below |



The checkpoints are an assumed pace, not forecasts. Replace them with measured figures after the week 2 review. At every checkpoint no origin may exceed 10 live listings.

## Launch gate (week 8 go or no-go)

At least 200 live Uganda-relevant listings, at least 150 of them performed in Uganda.

No single organisation and no single Source above 5 percent of the live catalogue (at most 10 of 200), with at least 20 distinct organisations.

Every live listing has a sourceUrl and a provenance record. Listings relying on org_attested are no more than 25 percent (subject to D9).

Report response inside 24 hours for at least 95 percent of reports over the preceding two weeks.

Audience gate enforced, matrix passing, shadow diff reviewed and signed off.

Dead-link rate under 2 percent and freshness error under 1 percent on the weekly checks.

If the gate is missed, extend the date and keep the standard. Do not relax the definition of Uganda-relevant, the Uganda share or the cap to reach 200. The existing 100-account pilot plan in docs/LAUNCH_READINESS_100_USERS.md is a sensible fallback audience while content catches up.

## 7. Risks



| Risk | Why it matters | Mitigation |

| --- | --- | --- |

| Scraping a site that forbids it (Fuzu, BrighterMonday, aggregators) | Legal and reputational damage, and a blocked IP | No automated access without written permission. People may submit links. Every Source records a terms review before it can be approved. |

| Community channel does not produce enough | The plan now depends on it for about 90 listings plus leads for the rest | Run the pilot in weeks 1 to 2 and measure. Add helpers and employer outreach early. Keep adapters and partners as backup. |

| Reviewer bottleneck | Tracing moves effort onto reviewers. The queue grows faster than it clears and the 200 date slips | Prefilled review screen, fast lane for trusted posters, measure time per decision, three reviewers from the start, and expiry of untraced leads after 7 days. |

| Cap makes the target hard | At most 10 per origin forces breadth across 20 or more, realistically 60, organisations | Start outreach and verification in week 1. Track distinct organisations weekly. Hold excess in pending rather than dropping it. |

| Weak provenance for small employers | org_attested relies on a phone call and registration proof, which is easier to fake than an official domain | Cap at 25 percent, log every call, verify the organisation once with registration proof, sample 10 percent for audit, revoke on a report. |

| Scams entering through the community channel | Scammers can submit leads or pose as employers | Tracing rule, human approval, no publication from screenshots, reports hide a listing on a pattern match. |

| ReliefWeb approval is slow | Removes the best structured feed | Apply on day one. Careers pages and community proceed independently. It is capped at 10 listings anyway. |

| Extraction errors presented as fact | A wrong deadline or location misleads seekers | Evidence quote per field, human approval kept, field-level accuracy of at least 95 percent on deadline and location on the 50-listing test set before prefill is trusted. |

| Trusted-poster abuse | A compromised or dishonest organisation publishes scams quickly | 10 percent sampled audits, a report hides the listing at once, trust can be revoked, changes to key fields return the listing to the standard queue. |

| Personal data in screenshots and helper accounts | Third-party names and numbers collected without need | Private bucket, 30-day deletion, crop guidance, minimal submitter data, retention and registration confirmed with counsel under the Data Protection and Privacy Act 2019. |

| Audience gate hides too much | Honest listings vanish and the catalogue looks smaller | Flag off first, shadow diff, human review of each hidden listing before enforcement. |

| Filling the catalogue to reach 200 | A padded count hides the real quality problem | The guardrails in 2.1: 150 in Uganda, 5 percent per origin, grants at most 10 percent, weak provenance at most 25 percent. |



## 8. Decisions needed from you

Each decision has my recommendation. D1 blocks everything, so settle it first. D8 to D10 are new in this revision.



| ID | Decision | Recommendation |

| --- | --- | --- |

| D1 | Allow new tables (Source, Lead, ListingReport, IngestionRun) | Yes. Record it in docs/deviations.md, along with the ten models already added. The freeze is lifted in practice. |

| D2 | Should pending catalogue listings appear in the browse page? | Hide them by default, but only after the 21 pending Uganda records have been traced (weeks 1 to 2). Otherwise a Ugandan user would see almost nothing in the meantime. browseOpportunities currently shows pending catalogue items beside verified ones. Afterwards show unreviewed items only behind an explicit “unreviewed” toggle, if at all. |

| D3 | Collect nationality? | Not yet. Assume Ugandan, collect countryOfResidence and openToAbroad, and treat nationality-restricted listings through eligibleCountries and the additional-requirements note. Nationality is sensitive data and adds consent duties. |

| D4 | Date-only deadlines | Store end of day in East Africa Time and display the date. This is a behaviour change for existing records, so apply it in the clean-up script. |

| D5 | Who reviews, and who are the first community helpers? | Three reviewers at about 5 to 6 hours a week each, plus 8 to 10 helpers from campus career offices and youth networks. Name the reviewers by day 2. |

| D6 | Who asks for permission, and who runs employer outreach? | Name one person for Fuzu and BrighterMonday and one for the 100-organisation outreach list, each with a date. A written yes or no matters more than the answer. |

| D7 | Monthly spend ceiling for AI extraction | Set one in configuration before any scheduled run. None exists today. Start small and raise it from measured cost per lead. |

| D8 | How is the 5 percent cap enforced? | At intake and review, not by deleting. Origins at 8 live listings are deprioritised in the queue. At 10, further items wait in pending with a reason code and nothing is approved above the cap before the gate. After launch the cap is 5 percent of the live catalogue, tracked as an alert rather than a block. |

| D9 | Allow org_attested provenance for small employers without websites? | Yes, with conditions: registration proof, a named contact confirmed by a logged call, and no more than 25 percent of the catalogue. Without this, the 150-in-Uganda target is unlikely because many small Ugandan employers have no website. |

| D10 | How do we recognise helpers? | Recognition, references and a public thank-you based on listings that went live, not payment per lead. Revisit after two weeks of measured funnel data, because pay-per-submission invites spam. |



## Appendix A. Prisma additions (draft)

A starting point for the migration, not final syntax. Field names follow the existing schema. Review enum values against your own wording before generating.

enum ApplicantScope    { uganda_residents ugandan_citizens african_nationals global }

enum RemoteEligibility { unknown uganda east_africa africa global }

enum ProvenanceType    { official_page application_system org_attested }

enum SourceKind        { api careers_page rss newspaper partner community }

enum SourceStatus      { proposed approved paused blocked }

enum LeadChannel { whatsapp tiktok instagram facebook linkedin newspaper web email employer other }

enum LeadStatus        { new tracing traced rejected duplicate promoted expired }

enum ReportStatus      { open actioned dismissed }

model Source {

id                  String       @id @default(uuid()) @db.Uuid

name                String

kind                SourceKind

baseUrl             String       @unique

organizationId      String?      @db.Uuid

status              SourceStatus @default(proposed)

termsReviewedAt     DateTime?

termsNotes          String?

crawlIntervalHours  Int          @default(24)

lastRunAt           DateTime?

lastSuccessAt       DateTime?

consecutiveFailures Int          @default(0)

createdAt           DateTime     @default(now())

updatedAt           DateTime     @updatedAt

@@index([status, lastRunAt])

}

model Lead {

id                    String      @id @default(uuid()) @db.Uuid

channel               LeadChannel

status                LeadStatus  @default(new)

sourceId              String?     @db.Uuid

submittedById         String?     @db.Uuid

rawUrl                String?

canonicalUrl          String?

screenshotPath        String?

note                  String?

extracted             Json        @default("{}")

candidateOrgName      String?

officialUrl           String?

organizationId        String?     @db.Uuid

fingerprint           String      @unique

duplicateOfId         String?     @db.Uuid

promotedOpportunityId String?     @db.Uuid

rejectReason          String?

createdAt             DateTime    @default(now())

tracedAt              DateTime?

resolvedAt            DateTime?

@@index([status, createdAt])

@@index([canonicalUrl])

@@index([submittedById, status])

}

model ListingReport {

id             String       @id @default(uuid()) @db.Uuid

opportunityId  String       @db.Uuid

reporterId     String?      @db.Uuid

reason         String

details        String?

status         ReportStatus @default(open)

createdAt      DateTime     @default(now())

resolvedAt     DateTime?

resolvedBy     String?

resolutionNote String?

@@index([status, createdAt])

@@index([opportunityId])

}

model IngestionRun {

id         String    @id @default(uuid()) @db.Uuid

sourceId   String    @db.Uuid

startedAt  DateTime  @default(now())

finishedAt DateTime?

fetched    Int       @default(0)

created    Int       @default(0)

updated    Int       @default(0)

duplicates Int       @default(0)

failed     Int       @default(0)

errors     Json      @default("[]")

@@index([sourceId, startedAt])

}

// Opportunity: add

//   audience ApplicantScope?   countryCodes String[] @default([])   regions String[] @default([])

//   remoteEligibility RemoteEligibility @default(unknown)   eligibleCountries String[] @default([])

//   provenanceType ProvenanceType?   needsRecheck Boolean @default(false)

//   sourceId String? @db.Uuid   leadId String? @db.Uuid   canonicalUrl String?   contentHash String?

//   deadlineDateOnly Boolean @default(false)   lastSeenAt DateTime?

//   @@index([audience, status])   @@index([canonicalUrl])   @@index([organizationId, status])

// Organization: add officialDomains String[] @default([])  trustedPoster Boolean @default(false)

//   verifiedAt DateTime?  verifiedBy String?

// UserProfile: add countryOfResidence String @default("UG")  openToAbroad Boolean @default(false)

## Appendix B. Audience gate and intake test matrix

Each row becomes a unit test in tests/unit. The shadow-mode review should also replay rows 1 to 13 against real profiles. Rows 13 to 16 are new in this revision.



| # | Listing | Seeker | Expected |

| --- | --- | --- | --- |

| 1 | Onsite job in Gulu, audience uganda_residents | Resident of UG, openToAbroad false | Visible |

| 2 | Onsite job in Addis Ababa, audience african_nationals | Resident of UG, openToAbroad false | Hidden |

| 3 | Same Addis Ababa job | Resident of UG, openToAbroad true | Visible |

| 4 | Remote job, remoteEligibility unknown | Any | Hidden |

| 5 | Remote job, remoteEligibility africa | Any | Visible |

| 6 | UK scholarship, eligibleCountries includes UG | Resident of UG, openToAbroad false | Visible |

| 7 | UK scholarship, eligibleCountries excludes UG | Any | Hidden |

| 8 | Any listing with audience null | Any | Hidden |

| 9 | Job in Jinja, Minna and Kinshasa (countryCodes UG, NG, CD) | Seeker in Jinja | Visible, location credit above 0 in OrbitMatch |

| 10 | Grant, audience uganda_residents | Seeker with countryOfResidence KE | Hidden |

| 11 | Onsite job, countryCodes empty | Any, including openToAbroad true | Hidden (unclassified location) |

| 12 | Scholarship at a UK university, location scoring | Any eligible seeker | Location dimension at full credit |

| 13 | Rhodes Scholarship, location rule allows Uganda and Kampala | Profile location Gulu, residence UG | Hard gate passes (F8 fix) |

| 14 | Identical re-ingestion of a verified listing | n/a | Stays verified and visible, only lastSeenAt changes (F11 fix) |

| 15 | Re-ingestion of a verified listing with a changed apply link | n/a | Hidden and pending until a reviewer confirms |

| 16 | An organisation already holding 10 live listings submits an 11th | n/a | Waits in pending with reason “held: origin at cap” |



## Appendix C. Where the changes land



| File or area | Change |

| --- | --- |

| prisma/schema.prisma, prisma/migrations, supabase/migrations | Appendix A tables and columns, RLS policies, server-only access policy |

| scripts/check-rls.ts | Add the four new tables |

| src/core/entities/domain.ts, src/lib/validation.ts | New types and fields. opportunitySchema is strict, so new fields must be added there explicitly |

| src/lib/repository (types, prisma, supabase, memory) | Lead, Source, ListingReport and IngestionRun methods in all three adapters, plus a seeker-scoped query with SQL filters. The memory adapter keeps the tests honest |

| src/services/matching (audience.ts new, feed.ts, orbit/engine.ts, rule-based/hard-gates.ts) | Gate before scoring, location credit for funding categories, region-based location similarity, residence terms for programme rules (F8) |

| src/services/ingestion (manual/index.ts, sources/*, pipeline.ts, deduplication.ts, freshness.ts) | Never lower a verified listing on re-ingestion (F11), cap rule at intake, adapters, canonicalisation, fingerprints, SQL de-duplication, bulk lifecycle, date-only deadlines |

| src/services/trust (automated-signals.ts, checklist.ts, report.ts, apply-link.ts new) | Domain match, patterns v2, routing, report thresholds, origin-share check |

| src/services/ai/anthropic-extractor.ts, src/config/ai-rules.ts | Image input, evidence fields, spend ceiling, model via environment |

| src/app/api/v1/leads, sources, reports; helper status page; employer post-a-job form | New routes and screens. Admin queue and review screen under (admin) |

| src/config (feature-flags.ts, slo-targets.ts, ingestion-rules.ts) | Flags audienceGate and leadIntake (off), new SLOs, per-source rate rules, origin cap constant |

| scripts (clean-catalog.ts, classify-audience.ts, worker/ingest.ts, worker/linkcheck.ts) | Dry-run by default, JSON change logs in docs/audits |

| docs (deviations.md, submission terms, helper guide) | Record the schema decision, publish the submission terms and takedown route, and write the one-page helper guide |

| tests/unit, tests/contract | Gate matrix, adapter fixtures (recorded responses, no live network in CI), dedup cases, never-downgrade cases, cap rule, report rules, contract tests for new routes |


