OPPSCOUT

Master Technical Planning Document

13 pre-build specifications, consolidated — architecture, data, product logic, trust, non-functional requirements, and delivery plan

Prepared for: VAIS Applied Intelligence Systems

Scope: Uganda-first · Web + USSD + AI

Status: Pre-build planning — v1.0

# Table of Contents

0. Introduction & How to Use This Document

1. System Architecture Specification

2. Data Model / Schema Specification

3. API Contract Specification

4. Matching Engine Specification

5. Notification & Alerting Specification

6. USSD Flow Specification

7. Verification & Trust Policy

8. Data Ingestion & Freshness Policy

9. SLO / Reliability Specification

10. Security & Privacy Specification

11. Uganda Regulatory Compliance Specification

12. Phased Rollout Plan

13. KPI & Instrumentation Specification

Appendix A — Glossary

# 0. Introduction & How to Use This Document

This document consolidates the thirteen planning documents identified as necessary before OppScout enters production build. It exists to answer one question for every subsystem before a single line of production code is written: “what does correct look like, and how will we know if we drifted from it?”

The document definition supplied for OppScout (the Concept Definition & Product Framework) is treated here as the complete and unreduced scope. No feature, section, or capability described in that document has been removed. What this planning document adds is sequencing, interface boundaries, and measurable acceptance criteria — the layer that turns a strategy document into something buildable without the build quality degrading as scope grows.

### Guiding principle

Every later-phase feature (AI matching, USSD, automated scraping, monetization) is designed as an additional implementation behind an interface that exists from Phase 1, rather than a rebuild of something already shipped. This is what makes “never decline, only improve” structurally true rather than aspirational — see §1 (Architecture) and §12 (Phased Rollout Plan).

### How to read this document

- §1–3 (Architecture, Data Model, API) define the shared spine every other section builds on — read these first.

- §4–6 (Matching, Notifications, USSD) are product-logic specs — they define exact behavior, not just intent.

- §7–8 (Trust, Data Freshness) protect the two things users can't tolerate failure in: being scammed, and being shown stale information.

- §9–11 (SLOs, Security, Regulatory) are non-functional requirements — numbers and constraints, not features.

- §12–13 (Rollout Plan, KPIs) translate everything above into an execution order with acceptance criteria.

# 1. System Architecture Specification

DOCUMENT: System Architecture Specification

Purpose: define the components of OppScout and the interfaces between them so that every feature in the product framework (§1–24 of the source doc) has an explicit, stable place to live — including features scheduled for later phases.

## 1.1 Architectural approach

OppScout is built around a fixed spine (API layer + data layer) and two pluggable interfaces: MatchEngine and NotificationChannel. Phase 1 ships one concrete implementation of each. Later phases add implementations — an AI-assisted MatchEngine, a USSD NotificationChannel — without altering the interface contract or requiring changes to code that already works in production.

Figure 1.1 — OppScout system architecture, Phase 1 spine with later-phase components marked in amber.

## 1.2 Components

| Component | Responsibility | Phase introduced |
| --- | --- | --- |
| Web Client | Primary user-facing app; profile creation, opportunity feed, save/track | 1 |
| Org / Provider Dashboard | Opportunity publishing, eligibility definition, candidate-interest analytics | 1 (basic) → 2 (full) |
| USSD Gateway | Feature-phone access via telecom aggregator session API | 4 |
| API Layer | Single versioned contract consumed by every client | 1 |
| MatchEngine (interface) | Compares profile to opportunity, returns score + explanation | 1 (rule-based) → 3 (AI) |
| NotificationChannel (interface) | Sends alerts through a channel; new channels register against the same interface | 1 (email/SMS) → 4 (USSD) |
| Verification & Trust Engine | Org/opportunity verification workflow, scam/duplicate detection | 1 (manual) → 3 (semi-automated) |
| Data Layer | System of record for all entities, see §2 | 1 |
| Ingestion | How opportunities enter the system: manual, org-submitted, or scraped | 1 (manual/org) → 3 (scraping) |
| KPI / Instrumentation Log | Event capture feeding §13 dashboard | 1 |

## 1.3 Interface contracts (why nothing gets rebuilt)

- MatchEngine: input = UserProfile + Opportunity, output = { score: 0-100, matched_factors: [], missing_factors: [], generated_by: 'rules' | 'ai' }. The rule-based Phase 1 implementation and the AI Phase 3 implementation both satisfy this exact contract, so the API layer, UI, and explainability rendering never change when the engine swaps.

- NotificationChannel: input = { user_id, message_payload, priority }, output = delivery status. Email/SMS (Phase 1) and USSD/WhatsApp (Phase 4) are separate implementations of the same contract, selected per-user by their registered channel preference.

## 1.4 Explicit non-goals for Phase 1 architecture

- No microservices split — a modular monolith is sufficient at this scale and reduces operational surface area for a small team.

- No real-time streaming infrastructure — batch/cron-based matching and notification runs are adequate until volume proves otherwise.

- No multi-region deployment — single-region (Africa-proximate) deployment with backups; revisit only if latency data demands it.

# 2. Data Model / Schema Specification

DOCUMENT: Data Model / Schema Specification

Purpose: define every entity referenced across the product framework in one schema, present from Phase 1, so opportunity records, matches, and profiles never need a breaking migration as later features (AI scoring, scraping, USSD) are added.

Figure 2.1 — Core entity relationships. FK = foreign key.

## 2.1 Entity field reference

### UserProfile (§8 of source doc)

- Identity & contact: id, name, phone, email, preferred_channel (web | ussd)

- Education: level, institution, field_of_study, graduation_status

- Skills & experience: skills[], work_experience[], internship_experience[], certifications[]

- Preferences: location, preferred_locations[], career_interests[], opportunity_categories[], work_mode_pref (remote|onsite|hybrid), languages[]

- System fields: profile_completeness_score, created_at, updated_at

### Opportunity (§10)

- Core: id, title, organization_id (FK), category, description

- Eligibility: eligibility{} (structured, not free text — see §4), required_skills[], preferred_skills[]

- Logistics: location, work_mode, deadline, application_method, source_url

- Trust fields: verification_status (unverified|pending|verified|flagged), source (org_submitted|scraped|partner_feed), publication_date

- Lifecycle: status (open|closing_soon|closed|stale|removed)

### Organization (§14)

- id, name, sector, official_links[], verification_status, dashboard_users[], posting_history[]

### MatchResult

- id, user_id (FK), opportunity_id (FK), score, matched_factors[], missing_factors[], generated_by (rules|ai), created_at

### Notification

- id, user_id (FK), match_id (FK, nullable), channel, status (sent|delivered|failed), sent_at

### SavedOpportunity / Tracker (§16)

- user_id (FK), opportunity_id (FK), status (saved|applied|expired), reminder_sent

### EventLog (feeds §13 KPIs)

- event_type (view|save|click|apply_intent|report), user_id, opportunity_id, timestamp

## 2.2 Migration discipline

All fields listed above exist in the schema from Phase 1, even where the populating mechanism (e.g. AI-generated matched_factors, scraped source) doesn't exist yet. This means Phase 3's AI engine and Phase 4's USSD channel write into existing tables rather than requiring new ones — the schema is designed for its Phase-5 end state on day one.

# 3. API Contract Specification

DOCUMENT: API Contract Specification

Purpose: one versioned contract consumed identically by the web client, USSD gateway, and org dashboard, so no client-specific backend logic accumulates.

## 3.1 Versioning

- URI-versioned (/v1/...); breaking changes require a new version, never an in-place contract change.

- USSD gateway (Phase 4) consumes the same /v1 endpoints as web — it is a thin client, not a parallel backend.

## 3.2 Core endpoint groups

| Group | Examples | Notes |
| --- | --- | --- |
| Profile | POST /profile, PATCH /profile, GET /profile/completeness | Partial profile is valid — required for USSD |
| Opportunities | GET /opportunities (filter/search), GET /opportunities/:id | Never returns unverified listings by default |
| Matching | GET /matches (ranked feed), GET /matches/:id/explanation | Explanation always accompanies score — see §4 |
| Tracking | POST /saved, PATCH /saved/:id/status | Powers §16 user journey |
| Notifications | GET /notifications/preferences, PATCH .../preferences | Channel opt-in/out per §5 |
| Org / Provider | POST /organizations, POST /opportunities (org-scoped), GET /organizations/:id/analytics | Requires verified org auth scope |
| Reporting | POST /reports (suspicious listing) | Feeds §7 trust workflow |

## 3.3 Cross-cutting rules

- Auth: JWT-based sessions for web/dashboard; USSD sessions authenticate via phone number + PIN, short-lived tokens scoped to session length.

- Rate limiting per client type, tuned separately — org dashboards and scraping-adjacent internal jobs need different limits than end-user traffic.

- Every response includes a data freshness timestamp on opportunity records, so clients can flag stale data rather than silently trusting it.

# 4. Matching Engine Specification

DOCUMENT: Matching Engine Specification

Purpose: define exactly how a match score and explanation are produced, so the output in §9 of the source doc (“82% Match: this internship fits your...”) is a specified, testable behavior rather than an aspiration.

## 4.1 Phase 1: rule-based scoring

Each matching dimension listed in §9 of the source document is implemented as an explicit, independently-testable rule with a weight:

| Dimension | Type | Default weight |
| --- | --- | --- |
| Education eligibility | Hard filter (fail = excluded, not just down-scored) | Gate |
| Field/discipline relevance | Weighted match | 20% |
| Skills match | Weighted match (required vs. preferred distinguished) | 25% |
| Experience level | Weighted match | 15% |
| Location compatibility | Weighted match | 10% |
| Work-mode preference | Weighted match | 5% |
| Career-interest alignment | Weighted match | 10% |
| Age/programme-specific eligibility | Hard filter where applicable | Gate |
| Deadline urgency | Ranking boost, not part of the score itself | N/A (sort signal) |
| Required certifications | Hard filter if marked mandatory | Gate |

Weights are configuration, not code — stored per-category, since a scholarship and an internship don't weight “experience level” the same way.

## 4.2 Explainability output (mandatory, not optional)

Every MatchResult returns matched_factors[] and missing_factors[] in plain language before it returns a raw score. The source document is explicit that a match score must never be presented as an unexplained AI decision (§9) — this is treated as a hard product requirement, enforced at the API contract level: a MatchResult without an explanation payload is an invalid response, not a permitted shortcut.

## 4.3 Phase 3: AI-assisted scoring

The AI implementation extracts structured requirements from unstructured opportunity text (§13) and can adjust relevance weighting based on observed engagement, but it does not replace the hard-filter gates (education, mandatory certifications, programme-specific eligibility). Those remain rule-based permanently — core eligibility facts stay traceable to the original opportunity source, per §13 of the source doc, precisely because a false positive there (telling someone they're eligible when they're not) is worse than a missed match.

# 5. Notification & Alerting Specification

DOCUMENT: Notification & Alerting Specification

Purpose: make “selective rather than noisy” (§11 of source doc) a concrete, testable rule set rather than an editorial judgment applied inconsistently.

## 5.1 Trigger rules

- New high-fit opportunity: score ≥ 75 (configurable) and category matches an opt-in preference — sent immediately, capped at N per day per user.

- Deadline approaching: for saved or high-fit (≥ 60) opportunities, at 7 days, 3 days, and 24 hours out — not more frequently.

- Major opportunity change: eligibility or deadline change on a saved opportunity — always sent regardless of daily cap, since it can invalidate a user's plan.

- Digest fallback: if no trigger-worthy event occurred, a periodic (e.g. weekly) digest is used instead of silence, so users don't churn from perceived inactivity — but digests never count against the same-day trigger cap.

## 5.2 Channel selection

Every user has a preferred_channel and can opt into secondary channels. Channel routing is resolved by the NotificationChannel interface (§1.3) at send time — the same trigger logic above is channel-agnostic, so adding USSD or WhatsApp in later phases never touches this spec.

## 5.3 Anti-noise safeguards

- Global per-user daily send cap, independent of how many trigger conditions fire.

- De-duplication: the same opportunity never triggers two notifications within a rolling 48-hour window.

- Every notification includes an unsubscribe/preferences path — mandatory for SMS delivery reputation as much as for user trust.

# 6. USSD Flow Specification

DOCUMENT: USSD Flow Specification

Purpose: specify the constrained USSD experience described in §12 of the source doc precisely enough to build against telecom aggregator session limits (short sessions, small character budgets, no persistent connection).

## 6.1 Design constraint

A USSD user does not complete a full profile in one session. The flow collects only the highest-value matching fields first — exactly as the source document specifies — and defers richer profile completion to web.

## 6.2 Menu tree (Phase 1 USSD scope)

- 1. Create/continue profile → education level → field of study → location → top 2 opportunity categories (4 short prompts, session-safe)

- 2. Check new matches → short summary (title, org, one-line fit reason, deadline) for top 3, paged

- 3. Save an opportunity → confirmation + “SMS me the link” option

- 4. View upcoming deadlines → saved items only, soonest first

- 5. Manage notification preferences → on/off + frequency, not full channel management (that stays on web)

## 6.3 Session resilience rules

- Every multi-step flow is resumable: state is persisted server-side after each keypress, not held in session memory only, so a dropped session doesn't lose partial input.

- Timeout behavior is explicit and tested: a session that times out mid-flow saves progress and shows a clear “continue where you left off” entry point next time.

- Character budgets per screen are enforced at the content layer — opportunity summaries are truncated with a defined algorithm (not ad hoc), never silently cut mid-word.

## 6.4 Reliability target

USSD session completion rate is tracked as its own SLO (§9.4), separate from cloud uptime, because it depends partly on telecom aggregator infrastructure outside OppScout's direct control.

# 7. Verification & Trust Policy

DOCUMENT: Verification & Trust Policy

Purpose: define precisely what “verified organization” and “verified opportunity” mean (§15 of source doc), since trust is a core product requirement, not an optional feature, for users who may be vulnerable to scams.

## 7.1 Organization verification

- Minimum bar: official domain/email match, registration or institutional proof (business registration, university affiliation, NGO registration), and a named accountable contact.

- Verification status is visible on every listing from that organization, not just on the org's own profile page.

## 7.2 Opportunity verification

- Every opportunity must link to an official source (application page or organization-owned channel) — no opportunity is published from an unverifiable third-hand source.

- Manual review checklist (Phase 1, human-run) before publishing: source authenticity, no requests for inappropriate payment or sensitive information, deadline plausibility, duplicate check against existing listings.

- Phase 3 adds semi-automated duplicate and suspicious-listing detection but does not remove the human review step for new, unverified organizations.

## 7.3 Warnings & reporting

- Any listing requesting payment for application, or requesting sensitive personal/financial information beyond what a legitimate application needs, is auto-flagged and held pending review, not published.

- A reporting mechanism is available on every opportunity from Phase 1, routed to the same review queue as pre-publication checks.

## 7.4 Explainability of trust, not just matching

Per §15 of the source doc, how matching recommendations are generated must be transparent to users. The trust policy extends this: verification status, source link, and publication date are always visible alongside a match, not hidden behind a detail page click.

# 8. Data Ingestion & Freshness Policy

DOCUMENT: Data Ingestion & Freshness Policy

Purpose: this is the single highest operational risk in the product (see architecture discussion in §1) — match quality is capped by data quality, and data quality degrades continuously unless actively maintained.

## 8.1 Source hierarchy

- Priority 1: Direct organization submission via provider dashboard (§14) — highest trust, lowest maintenance burden.

- Priority 2: Official partner feeds/APIs (§10) where available — structured, so lowest transformation risk.

- Priority 3: Approved automated discovery (scraping), Phase 3 onward, run in shadow mode against known-good manual data before any scraped listing goes live unverified.

## 8.2 Staleness rules

- Every opportunity has a checked_at timestamp; listings not re-verified within a defined window (e.g. 14 days for scraped sources, 30 days for org-submitted) are auto-flagged closing_soon-uncertain rather than silently shown as open.

- Deadline-passed listings are auto-transitioned to closed — never left in the active feed by omission.

## 8.3 Deduplication

- Canonical matching on (organization, title, deadline window) with fuzzy title matching; duplicates are merged with the most authoritative source (org-submitted beats scraped) taking precedence for displayed fields.

## 8.4 Why scraping is sequenced late, not cut

Automated discovery is explicitly retained as an end-state capability (§10 of source doc, §1.4 Phase 3 here) but is not built until the manual/org-submission pipeline has proven the schema, verification workflow, and freshness rules against real data. Building scraping first would mean debugging data quality and matching quality problems simultaneously — this sequencing is what protects the 99% data-freshness target, not a scope reduction.

# 9. SLO / Reliability Specification

DOCUMENT: SLO / Reliability Specification

Purpose: replace a single “99% efficiency” target with per-subsystem numbers that can actually be measured, alerted on, and held to — because different subsystems have fundamentally different achievable ceilings.

## 9.1 Per-subsystem targets

| Subsystem | Metric | Target | Why this ceiling |
| --- | --- | --- | --- |
| Core API (web, dashboard) | Uptime | 99.9% | Fully within OppScout's own infra control |
| Notification delivery (email/SMS) | Successful delivery rate | 99% | Mostly infra-dependent; provider SLAs support this |
| Data freshness | % listings correctly open/closed/stale | 99% | Requires active ingestion discipline (§8), not just uptime |
| Match relevance | % top-3 matches user engages with (view/save/click) | Track & improve — no fixed target Phase 1 | Behavioral metric, not an infra metric; baseline first |
| USSD session completion | % sessions completed without drop/timeout failure | 95–97% | Partially dependent on telecom aggregator, outside direct control |
| Trust/verification turnaround | Time from submission to review decision | < 48 hours (manual, Phase 1) | Human-review-bound until Phase 3 automation |

## 9.2 Measurement discipline

- Every target above has an owning subsystem and an alert threshold set below the target, so degradation is caught before it becomes a user-visible failure.

- USSD completion rate is never blended into overall platform uptime reporting — doing so would hide a telecom-side problem inside a number that looks like an OppScout infra problem, or vice versa.

## 9.3 Regression protection

Per the phased rollout discipline in §12, every feature ships behind a flag and is checked against this SLO dashboard pre-rollout. A change that would degrade any metric above is blocked from full release, which is the mechanical enforcement behind “only improvement, never decline.”

# 10. Security & Privacy Specification

DOCUMENT: Security & Privacy Specification

Purpose: define data handling boundaries for user profile data (education, skills, location, eligibility-relevant details) and provider-side access, given the platform holds information that could be sensitive if exposed or misused.

## 10.1 Data classification

- Personal identifying data (name, phone, email): encrypted at rest, access-logged.

- Profile/eligibility data (education, skills, experience): visible to the matching engine and to the user; never exposed to an organization beyond what the user explicitly shares via an application action.

- Aggregate/anonymized data (candidate-interest analytics for orgs, §14): organizations see counts and trends, never individual profile data, unless a user has taken an explicit apply action.

## 10.2 Access control

- Role-based access: end user, organization staff (scoped to their own org's data only), platform admin/reviewer (trust workflow, §7).

- Provider dashboard analytics are aggregate-only by default; any path to individual-level data requires explicit user consent tied to an application event.

## 10.3 Authentication & session security

- Web/dashboard: standard credential + token-based auth, with rate-limited login attempts.

- USSD: phone number + PIN, given no persistent device session is possible; session tokens are short-lived and scoped to the USSD session only.

## 10.4 Data retention & deletion

- Users can request profile deletion; deletion cascades to MatchResults and Notifications tied to that user, retaining only anonymized aggregate counts needed for §13 KPI history.

# 11. Uganda Regulatory Compliance Specification

DOCUMENT: Uganda Regulatory Compliance Specification

Purpose: identify the Uganda-specific regulatory surfaces this platform touches, given its data-protection and telecom-channel obligations. This section maps obligations to product areas; it is not a substitute for formal legal review before launch.

## 11.1 Data Protection and Privacy Act (DPPA)

- OppScout processes personal data (profile, contact, eligibility-relevant information) and must handle registration/notification obligations to the Personal Data Protection Office, lawful-basis and consent requirements, and data subject rights (access, correction, deletion — see §10.4) under the DPPA.

- Cross-border data storage (if infrastructure is hosted outside Uganda) needs review against DPPA transfer provisions.

## 11.2 Telecom / USSD channel obligations

- USSD access (§6) requires an aggregator or direct telecom relationship subject to Uganda Communications Commission (UCC) requirements; SMS notification volume/content is also subject to telecom carrier and UCC rules on bulk messaging.

## 11.3 Adjacent considerations flagged for legal review

- Any future payment-related features (e.g. premium subscriptions, §18) would bring in Bank of Uganda (BoU) and National Payment Systems Act considerations if OppScout handles payment flows directly rather than via a licensed payment processor.

- Employment/recruitment-adjacent platforms may have sector-specific obligations worth a targeted legal check before the Provider Platform (§14) monetizes recruitment services.

This section should be reviewed with counsel before Phase 1 launch, and re-reviewed before Phase 4 (USSD) and Phase 5 (monetization) given each introduces new regulatory surface.

# 12. Phased Rollout Plan

DOCUMENT: Phased Rollout Plan

Purpose: sequence every feature in the source product framework into five phases, each a fully working, independently valuable product, with explicit acceptance criteria — so scope is never dropped, only ordered.

Figure 12.1 — Five-phase build sequence. Every source-document section is covered by exactly one phase.

## 12.1 Acceptance criteria by phase

### Phase 1 — Core Spine

- Acceptance: a real user can create a profile, receive a ranked, explained match feed from manually-entered/org-submitted opportunities, save opportunities, receive email/SMS deadline reminders, and report a suspicious listing.

- SLO gate: API uptime and notification delivery targets (§9) met in staging under simulated load before public launch.

### Phase 2 — Explainability + Provider Tools

- Acceptance: match explanations are shown for every match without exception; organizations can self-serve publish opportunities and see aggregate analytics; KPI dashboard (§13) is live and populated from real Phase 1 usage data.

### Phase 3 — AI + Automated Discovery

- Acceptance: AI MatchEngine implementation passes a side-by-side precision comparison against the rule-based engine on held-out data before replacing it as default; scraping runs in shadow mode with zero live impact until its duplicate/freshness error rate is validated against §8 targets.

### Phase 4 — USSD Accessibility

- Acceptance: full menu tree (§6) functional against a real telecom aggregator sandbox; session completion rate meets its own SLO (§9.1) before public rollout, measured separately from web metrics.

### Phase 5 — Monetization

- Acceptance: gated on trust and retention metrics from §13 reaching defined healthy thresholds first, consistent with the source document's own caution against undermining the inclusion mission by charging for core access (§18).

## 12.2 Cross-phase rule

No phase begins production build until the prior phase has met its SLO gate in staging. This is the mechanism, not just the intention, behind building everything in the source document without ever shipping a subsystem below the reliability bar it needs.

# 13. KPI & Instrumentation Specification

DOCUMENT: KPI & Instrumentation Specification

Purpose: ensure every KPI listed in §22 of the source document is measurable from the data model in §2 and the EventLog entity specifically, instrumented from Phase 1 rather than retrofitted later.

## 13.1 KPI to data-source mapping

| KPI (source doc §22) | Computed from |
| --- | --- |
| Registered users | UserProfile count |
| % users with completed matching profiles | UserProfile.profile_completeness_score |
| Verified opportunities | Opportunity.verification_status = verified, count |
| Opportunity-to-user match rate | MatchResult volume / active UserProfile count |
| Opportunity click-through rate | EventLog event_type = click / event_type = view |
| Save and application-intent rate | EventLog event_type = save, apply_intent / views |
| Notification engagement rate | Notification.status = delivered vs. downstream EventLog click |
| USSD active users | UserProfile.preferred_channel = ussd, active in period |
| Application deadline success rate | SavedOpportunity.status = applied vs. deadline passed without action |
| Organization retention / repeat posting rate | Organization.posting_history, repeat post interval |

## 13.2 Instrumentation rule

EventLog writes are part of the core request path from Phase 1, not an analytics add-on bolted on later — this is what makes §22's KPIs measurable retroactively across every phase rather than only from whenever instrumentation happened to get built.

# Appendix A — Glossary

| Term | Meaning in this document |
| --- | --- |
| Spine | The fixed core (API + data layer) that all phases build on without rewriting |
| MatchEngine / NotificationChannel | Interfaces with swappable implementations across phases (§1.3) |
| Shadow mode | Running a new system (e.g. scraping) in parallel with production without affecting live data, to validate before cutover |
| SLO | Service Level Objective — a measurable reliability target per subsystem (§9) |
| Hard filter / gate | A matching rule that excludes a user rather than lowering their score (§4.1) |

Document coverage check: every numbered section (§1–24) of the original OppScout Concept Definition & Product Framework is referenced at least once above. No feature was removed in the planning process — only sequenced.
