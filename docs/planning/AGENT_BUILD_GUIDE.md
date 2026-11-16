# OppScout — Agent Build Guide

**Audience:** an autonomous or semi-autonomous coding agent (e.g. Claude Code) implementing OppScout.
**Source of truth:** `OppScout_Master_Technical_Planning_Document.docx` (13 specs). This guide translates
that document into an execution plan — directories, files, order of work, and gates. If anything here
ever conflicts with the master doc, the master doc wins; open a note in `/docs/deviations.md` and continue.

**Prime directive:** build every feature in the original OppScout Concept Definition & Product Framework.
Nothing is cut. Scope is sequenced into five phases (§12 of the master doc), and each phase is a fully
working product that later phases plug into — never rewrite. Do not skip ahead to a later phase's files
until the current phase's gate checklist (below) is fully green.

---

## 0. How the agent should use this file

1. Work top to bottom. Do not start Phase *N+1* file work until Phase *N*'s **Gate Checklist** passes.
2. Before writing any file, check whether it already exists and whether an earlier phase already defined
   the interface it must satisfy (§3, "Interfaces that must never break"). Extend, don't duplicate.
3. Every commit touches one phase, one concern. Commit message format: `[phase-N] <area>: <what changed>`.
4. When a task is ambiguous, resolve it by re-reading the relevant section of the master doc referenced
   next to the task — the number in parentheses, e.g. `(§4.1)`, points to the exact spec section.
5. No stub logic, no placeholder returns, no `TODO` left in a file that a phase gate claims is complete.
   If a task can't be finished in one pass, it stays off the "done" list — it does not get faked to look done.
6. Every phase ends with: tests passing, SLO dashboard populated (even with early/low data), and the
   Gate Checklist below fully checked before moving on.

---

## 1. Guiding principles (non-negotiable, carried from the master doc)

- **Spine first, features plug in.** The API layer and data layer (§1, §2) are built once and never
  rewritten. `MatchEngine` and `NotificationChannel` are interfaces from day one; new implementations are
  added in later phases without touching code that already ships (§1.3).
- **Explainability is not optional.** No `MatchResult` is ever returned without `matched_factors[]` and
  `missing_factors[]` populated. A match score with no explanation is an invalid API response, not a
  shortcut (§4.2).
- **Hard eligibility gates stay rule-based forever.** Education, mandatory certifications, and
  programme-specific eligibility are never delegated to the AI matcher, even after Phase 3 ships (§4.3).
- **Trust is a build requirement, not a feature backlog item.** Every opportunity has a verification
  workflow before it can ever appear in a user's feed (§7).
- **Reliability targets are per-subsystem, not one global number.** Use the SLO table in §9.1 verbatim —
  do not invent a single "99% uptime" target that blends infra-controlled and telecom-dependent metrics.
- **Nothing ships that regresses a metric.** Every feature goes behind a flag and is checked against the
  SLO dashboard before full rollout (§9.3, §12.2).
- **Sequencing is not scope-cutting.** If a task feels like it belongs to a later phase, it still gets
  built — just not yet. Do not quietly drop it from the plan.

---

## 2. Tech stack (decided, not open — consistent with existing VAIS/Twezimbe stack conventions)

| Layer | Choice | Why |
|---|---|---|
| Web client | Next.js 14+ (App Router), TypeScript, Tailwind CSS | Matches existing NK Udada Hub / VAIS website stack; SSR helps low-bandwidth users |
| API layer | Next.js Route Handlers (`/app/api`) behind a typed contract | One codebase, one deploy target for Phase 1–2; can be split out later if load demands it (§1.4 explicit non-goal: no premature microservices) |
| Database | PostgreSQL via Supabase | Matches existing stack pattern; built-in auth, storage, row-level security fits the access rules in §10 |
| ORM / schema | Prisma | Single schema file is the literal source of truth for §2's data model |
| Auth | Supabase Auth (JWT) for web/dashboard; custom short-lived token flow for USSD sessions (§10.3) | |
| Background jobs / notifications | Node cron worker (Phase 1) → queue-backed worker (BullMQ + Redis) once volume demands it | Batch-based is sufficient per §1.4 |
| SMS/USSD gateway | Africa's Talking (or equivalent Uganda-capable aggregator) | Confirm commercial terms before Phase 4; keep the `NotificationChannel`/USSD gateway code provider-agnostic behind an adapter |
| AI layer (Phase 3) | Anthropic API (Claude) for extraction, classification, explanation generation | Keep prompts and parsing isolated in `/services/ai/` so the provider is swappable |
| Testing | Vitest (unit), Playwright (E2E web), contract tests for API (§3) | |
| Deployment | Vercel (web/API) + Supabase (DB/auth) | |

If any of these choices conflict with infrastructure the person building this already has running
(e.g. an existing Supabase project), adapt the choice but keep the *shape* — typed interfaces, one schema
file, provider-agnostic adapters for USSD/AI/notifications.

---

## 3. Repository structure (target end-state — built incrementally, phase by phase)

```
oppscout/
├── AGENT_BUILD_GUIDE.md              # this file
├── docs/
│   ├── master-plan.md                # exported text of the 13-spec master doc, kept in-repo for agent reference
│   └── deviations.md                 # any place implementation had to diverge from the master doc, with reasons
├── prisma/
│   └── schema.prisma                 # §2 — single source of truth for every entity
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (web)/                    # end-user web client routes
│   │   │   ├── profile/
│   │   │   ├── feed/
│   │   │   ├── opportunity/[id]/
│   │   │   ├── saved/
│   │   │   └── settings/
│   │   ├── (dashboard)/              # org/provider dashboard routes — Phase 1 basic, Phase 2 full
│   │   │   ├── opportunities/
│   │   │   ├── analytics/
│   │   │   └── organization/
│   │   ├── (admin)/                  # trust/verification review queue — §7
│   │   │   └── review/
│   │   └── api/
│   │       └── v1/                   # §3 — every endpoint group below
│   │           ├── profile/
│   │           ├── opportunities/
│   │           ├── matches/
│   │           ├── saved/
│   │           ├── notifications/
│   │           ├── organizations/
│   │           └── reports/
│   ├── core/                         # the "spine" — never phase-specific
│   │   ├── interfaces/
│   │   │   ├── match-engine.ts       # §1.3 contract — implementations plug in here
│   │   │   └── notification-channel.ts
│   │   ├── entities/                 # typed domain models mirroring prisma schema
│   │   └── errors/
│   ├── services/
│   │   ├── matching/
│   │   │   ├── rule-based/           # Phase 1 MatchEngine implementation (§4.1)
│   │   │   └── ai-assisted/          # Phase 3 MatchEngine implementation (§4.3)
│   │   ├── notifications/
│   │   │   ├── email/                # Phase 1
│   │   │   ├── sms/                  # Phase 1
│   │   │   └── ussd/                 # Phase 4
│   │   ├── trust/                    # §7 — verification workflow, scam/duplicate detection
│   │   ├── ingestion/
│   │   │   ├── manual/               # Phase 1 — admin/org entry
│   │   │   ├── org-submission/       # Phase 1 — dashboard submission
│   │   │   └── scraping/             # Phase 3 — shadow mode first (§8.4)
│   │   ├── ai/                       # Phase 3 — extraction, classification, explanation generation
│   │   └── kpi/                      # §13 — EventLog writers, dashboard queries
│   ├── ussd/                         # Phase 4 — menu tree state machine (§6)
│   │   ├── menu-tree.ts
│   │   ├── session-store.ts
│   │   └── character-budget.ts
│   ├── lib/                          # shared utilities (auth, db client, validation)
│   └── config/
│       ├── slo-targets.ts            # §9.1 table, as code — used by monitoring
│       └── matching-weights.ts       # §4.1 weights, as config not hardcoded logic
├── tests/
│   ├── unit/
│   ├── contract/                     # API contract tests against §3
│   └── e2e/
├── scripts/
│   └── seed/                         # seed data for local dev — realistic Uganda opportunities
└── infra/
    ├── monitoring/                   # SLO dashboard config (§9.2)
    └── migrations/
```

**Rule:** `src/core/interfaces/` files are written once, in Phase 1, and are the only files Phase 3 and
Phase 4 are allowed to depend on when adding new `MatchEngine`/`NotificationChannel` implementations. If a
later phase needs to change an interface's shape, that is a flagged architectural decision, not a routine
edit — log it in `docs/deviations.md` before doing it.

---

## 4. Coding standards

- **TypeScript strict mode on**, no `any` without a comment justifying it.
- **One responsibility per file.** A file in `services/matching/rule-based/` scores one dimension or
  orchestrates scoring — it does not also send notifications.
- **Every exported function has a return type**, explicit, not inferred — this is what keeps the
  `MatchEngine`/`NotificationChannel` contracts honest across implementations.
- **No magic numbers in logic files.** Weights, thresholds, caps (§4.1 weights, §5.1 score threshold,
  §9.1 SLO targets) live in `src/config/`, imported, never inlined.
- **Naming:** entities match `prisma/schema.prisma` names exactly in code (`UserProfile`, `Opportunity`,
  `MatchResult`, etc.) — no renaming across layers.
- **Every API route handler in `app/api/v1/` has a matching contract test in `tests/contract/`** before
  it is considered done.
- **Commit discipline:** `[phase-N] <area>: <what changed>` — e.g. `[phase-1] matching: implement education hard-filter gate`.
- **No feature flag left permanently on/off silently** — flags used for the rollout discipline (§9.3) get
  documented in `docs/deviations.md` or a `FLAGS.md` once flipped to fully-on.

---

## 5. Core interface contracts (write these first, Phase 1, before anything depends on them)

```ts
// src/core/interfaces/match-engine.ts  (§1.3, §4)
export interface MatchFactor {
  label: string;
  detail: string;
}

export interface MatchResult {
  score: number; // 0–100
  matchedFactors: MatchFactor[];
  missingFactors: MatchFactor[];
  generatedBy: "rules" | "ai";
}

export interface MatchEngine {
  score(profile: UserProfile, opportunity: Opportunity): Promise<MatchResult>;
}
// Hard gates (education, mandatory certs, programme-specific eligibility) MUST be evaluated
// before this is called, and a failed gate means this is never invoked — the opportunity
// is excluded, not down-scored. See §4.1 and §4.3.
```

```ts
// src/core/interfaces/notification-channel.ts  (§1.3, §5)
export type NotificationPriority = "high" | "normal" | "digest";

export interface NotificationPayload {
  userId: string;
  matchId?: string;
  message: string;
  priority: NotificationPriority;
}

export type DeliveryStatus = "sent" | "delivered" | "failed";

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<DeliveryStatus>;
}
// Trigger logic (§5.1) and anti-noise safeguards (§5.3) live OUTSIDE channel implementations —
// a channel only knows how to deliver, never when to fire.
```

Any implementation added in Phase 3 or Phase 4 must satisfy these interfaces exactly. If it can't, the
interface is wrong and needs a deliberate, logged revision — not a workaround in the implementation.

---

## 6. Data model (Prisma schema skeleton — §2)

Build `prisma/schema.prisma` with every entity from §2.1 present from Phase 1, even where a field's
populating mechanism (AI-generated `matchedFactors`, `source: scraped`) doesn't exist until later:

- `UserProfile` — identity/contact, education, skills/experience, preferences, `profileCompletenessScore`
- `Opportunity` — core, `eligibility` (JSON, structured — never free text), logistics, trust fields
  (`verificationStatus`, `source`), lifecycle `status`
- `Organization` — identity, `verificationStatus`, `dashboardUsers`, `postingHistory`
- `MatchResult` — `userId` FK, `opportunityId` FK, `score`, `matchedFactors` (JSON), `missingFactors`
  (JSON), `generatedBy`
- `Notification` — `userId` FK, `matchId` FK nullable, `channel`, `status`, `sentAt`
- `SavedOpportunity` — `userId` FK, `opportunityId` FK, `status`, `reminderSent`
- `EventLog` — `eventType`, `userId`, `opportunityId`, `timestamp` (§13 — write path from Phase 1)

Do not add tables outside this list without updating §2 of the master doc first — the schema is the
contract every phase writes against.

---

## 7. Phase-by-phase build plan

Each phase lists: what gets built, which files/dirs it touches, and its **Gate Checklist**. Do not begin
the next phase until every box below is checked.

### Phase 1 — Core Spine

**Build:**
- `prisma/schema.prisma` — full schema (§6 above)
- `src/core/interfaces/` — both interface files, frozen contracts
- `src/services/matching/rule-based/` — every dimension in §4.1's table as its own scoring function,
  weights sourced from `src/config/matching-weights.ts`; hard gates implemented as exclusion, not scoring
- `src/services/notifications/email/`, `.../sms/` — concrete `NotificationChannel` implementations
- Notification trigger logic (§5.1) as a standalone scheduler, channel-agnostic
- `src/services/ingestion/manual/`, `.../org-submission/` — no scraping yet
- `src/services/trust/` — manual review checklist workflow (§7.2), reporting endpoint (§7.3)
- `app/api/v1/{profile,opportunities,matches,saved,notifications,reports}` — full CRUD per §3.2
- `app/(web)/{profile,feed,opportunity,saved,settings}` — end-user web client
- `app/(dashboard)` — basic org submission UI (full analytics comes Phase 2)
- `app/(admin)/review` — trust review queue UI
- `src/services/kpi/` — `EventLog` writer wired into every relevant user action from day one (§13.2)
- `src/config/slo-targets.ts` + `infra/monitoring/` — dashboard wired to real metrics, even at low volume

**Gate Checklist:**
- [ ] A user can create a profile, see a ranked + explained match feed built from manually-entered/org-submitted opportunities, save an opportunity, and receive an email/SMS deadline reminder
- [ ] Every `MatchResult` returned by the API includes non-empty `matchedFactors`/`missingFactors` — verified by contract test, not spot check
- [ ] Hard-gated opportunities (failed education/cert eligibility) never appear in a user's feed — covered by a unit test with a deliberately-failing profile
- [ ] A suspicious listing can be reported and appears in the admin review queue
- [ ] `EventLog` rows are being written for view/save/click/apply_intent actions
- [ ] SLO dashboard is live and showing real (even if sparse) numbers for API uptime and notification delivery (§9.1)
- [ ] Contract tests exist and pass for every `app/api/v1/*` route
- [ ] No file in this phase's scope contains a `TODO` or stub return

### Phase 2 — Explainability + Provider Tools

**Build:**
- `app/(web)/opportunity/[id]` — explanation rendering surfaced on every match, not just detail pages (§7.4 — trust info alongside match, not hidden behind a click)
- `app/(dashboard)/{opportunities,analytics,organization}` — full self-serve publishing + aggregate analytics (never individual profile data — §10.1)
- `src/services/kpi/` — dashboard queries for every KPI in §13.1's mapping table, backed by real Phase 1 data

**Gate Checklist:**
- [ ] Every match view in the web client shows the explanation without an extra click
- [ ] An organization can self-serve publish an opportunity through the dashboard without admin intervention (still passes through the §7.2 verification workflow)
- [ ] Organization analytics are aggregate-only — a dedicated test confirms no individual profile data leaks into a dashboard response
- [ ] All ten KPIs in §13.1 are queryable and return real numbers from Phase 1+2 usage

### Phase 3 — AI + Automated Discovery

**Build:**
- `src/services/matching/ai-assisted/` — second `MatchEngine` implementation; extraction/classification logic in `src/services/ai/`; hard gates still delegate to the same rule-based gate functions from Phase 1 (§4.3 — never let AI own eligibility gates)
- `src/services/ingestion/scraping/` — shadow mode first: writes to a staging table, never live `Opportunity` rows, until validated against §8 freshness/dedup targets
- Duplicate/scam detection logic added to `src/services/trust/`

**Gate Checklist:**
- [ ] AI `MatchEngine` implementation passes a side-by-side precision comparison against the rule-based engine on held-out data before it becomes default for any user segment
- [ ] Hard gates are still rule-based — confirmed by the same Phase 1 gate tests, now run against the AI implementation too
- [ ] Scraper runs in shadow mode for a defined validation window with zero writes to live `Opportunity` rows
- [ ] Scraper's duplicate/freshness error rate is measured against §8 targets before any cutover to live ingestion
- [ ] Every AI-assisted `MatchResult` still returns non-empty explanation factors — same contract test from Phase 1, still passing

### Phase 4 — USSD Accessibility

**Build:**
- `src/ussd/` — menu tree (§6.2), session persistence after every keypress (§6.3), character-budget truncation logic
- `src/services/notifications/ussd/` — new `NotificationChannel` implementation, no changes to trigger logic from Phase 1
- USSD-specific auth flow (§10.3 — phone + PIN, short-lived session tokens)
- USSD session completion added to `src/config/slo-targets.ts` as its own tracked metric (§9.1), never blended into web uptime

**Gate Checklist:**
- [ ] Full menu tree functional against a real telecom aggregator sandbox
- [ ] A dropped session resumes from last completed step, not from scratch — covered by a deliberate drop-simulation test
- [ ] No USSD screen exceeds its character budget, verified programmatically against real opportunity data, not just short test strings
- [ ] USSD session completion rate meets the 95–97% target in sandbox testing before any public rollout
- [ ] USSD notification delivery uses the exact same trigger/anti-noise logic as Phase 1 — no duplicated or forked trigger code

### Phase 5 — Monetization

**Build:**
- Subscription/promoted-listing models added to `Organization` schema extensions
- Payment integration (flagged for legal review — §11.3 — before implementation, not after)
- Gating logic tying monetized features to the trust/retention thresholds defined once real §13 data exists

**Gate Checklist:**
- [ ] Legal review of payment handling completed (BoU/NPS Act considerations, §11.3) before any payment code ships
- [ ] Trust and retention metrics from §13 meet the thresholds defined at Phase 5 kickoff before monetized features go live
- [ ] Core opportunity discovery remains free and unblocked by any monetization change — verified by a test asserting an unpaid user's feed is functionally unrestricted

---

## 8. Definition of Done (applies at every phase)

A task is only marked complete when all of the following are true simultaneously:

- [ ] Code implements the full behavior described in the referenced master-doc section — no partial version
- [ ] Automated test(s) exist and pass, covering the behavior, not just the happy path
- [ ] No `TODO`, `FIXME`, or placeholder return remains in the touched files
- [ ] Relevant SLO metric (if applicable) is instrumented and visible on the dashboard
- [ ] `docs/deviations.md` updated if implementation had to diverge from the master doc, with a one-line reason

If any box can't be checked, the task is not done — it stays in progress and is not counted toward the
phase's gate checklist.
