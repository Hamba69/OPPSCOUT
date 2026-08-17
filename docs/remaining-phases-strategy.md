# Remaining phases delivery strategy

This plan applies the lessons from Phase One: preserve the spine, make every external dependency replaceable, keep safety-critical decisions deterministic, and distinguish implemented behavior from external rollout evidence.

## Phase 2 - Explainability and provider tools

1. Keep explanations and trust context visible on every match card.
2. Complete organization-scoped listing management, organization details, and aggregate-only analytics.
3. Compute all ten product KPIs from the seven canonical entities and expose an admin dashboard/API.
4. Gate on contract, privacy, KPI, UI, and build tests before committing.

## Phase 3 - AI and automated discovery

1. Add an Anthropic adapter behind an internal structured-analysis boundary and a second `MatchEngine` implementation without changing the frozen contract.
2. Run the original rule-based hard gates before every AI call.
3. Compare both engines on held-out labelled cases; AI cannot become the default unless it meets the configured precision/non-regression gate.
4. Run automated discovery in shadow mode with no writes to live `Opportunity` records. Store shadow artifacts through a provider-neutral store and measure duplicate/freshness errors before cutover.
5. Add automated scam signals as review assistance only; unverified organizations still require human review.

## Phase 4 - USSD accessibility

1. Implement the specified five-option menu as a pure state machine.
2. Persist after every keypress through a Redis-compatible store; use an isolated memory implementation only in tests/local demonstration.
3. Authenticate phone + PIN using hashed credentials and short-lived signed tokens.
4. Enforce the screen character budget centrally and expose a telecom webhook compatible with Africa's Talking request/response semantics.
5. Track USSD completion separately from web uptime and keep public rollout disabled until a real aggregator sandbox proves the SLO.

## Phase 5 - Monetization

1. Extend `Organization` only; do not add product tables outside the master schema.
2. Keep core discovery free by construction.
3. Make monetization activation depend on documented legal approval plus measured trust and retention thresholds.
4. Do not ship payment execution before those prerequisites are evidenced. Repository readiness code may be completed while payment activation remains fail-closed.

## Evidence policy

Automated local tests can prove contracts, deterministic behavior, privacy boundaries, resilience, and fail-closed rollout logic. They cannot prove counsel approval, production retention, provider delivery, a telecom sandbox completion rate, or staging uptime. Those gates remain visibly pending until real evidence is supplied.
