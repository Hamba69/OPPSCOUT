# Implementation deviations

Prior-phase clarifications are retained below; the Revision 2 schema decision is recorded under D1.

## 20 October 2026 — B1 model inventory

The current Prisma schema has 17 models. The generated inventory is [model-inventory.txt](./review/evidence/model-inventory.txt). D1 is approved: B2 may add the four planned models `Source`, `Lead`, `ListingReport`, and `IngestionRun`, with RLS and adapter support. This approval supersedes the earlier seven-entity freeze; it does not authorize production migrations or writes.

Operational note: local development and automated tests can use an isolated in-memory repository when `OPPSCOUT_DATA_MODE=memory`. Production always requires PostgreSQL through Prisma; the adapter does not change the production data model or API contracts.

Phase 3 clarification: the build guide asks shadow scraping to use a staging table, while the master data-model contract forbids tables beyond the seven canonical entities. Shadow candidates therefore use a private Supabase Storage bucket through a provider-neutral adapter. This preserves zero writes to live `Opportunity` rows and avoids changing the master schema.

Phase 4 schema correction: the USSD menu explicitly requires persisted notification frequency, but the Phase 1 end-state `UserProfile` field list omitted it. A `notificationFrequency` field and enum were added to the existing entity; no new entity or frozen interface changed.

Production-readiness schema correction: the matching specification requires enforceable age gates, but the planned `UserProfile` fields omitted a date from which age can be verified. A nullable `dateOfBirth` field was added to the existing entity so age-gated opportunities can pass or fail deterministically instead of permanently excluding every user.

## Technical Review Plan, Revision 2

### D1 — Four approved plan entities

**Decision:** Add `Source`, `Lead`, `ListingReport`, and `IngestionRun`; the earlier seven-entity freeze is lifted in practice.

**Evidence:** At review commit `7588d39f42d19f5f6cb98969a13c387cdf4f161c`, `prisma/schema.prisma` defines 17 models. The ten models added since the freeze are `StoredDocument`, `SeekerAccessLog`, `SeekerPipelineEntry`, `Feedback`, `RequestMetric`, `WebVitalSample`, `MatchRun`, `UnmatchedTerm`, `AdminAccessLog`, and `MetricRollup`.

**Effect:** The plan's four entities may be implemented with relations, indexes, migrations, adapter contracts, and RLS. See [the B0 decision record](./review/implementation/decisions.md).

### D11 — Supabase-faithful local database rehearsal

The owner amended the database protocol after a plain PostgreSQL start exposed missing Supabase roles/schemas. Because Supabase CLI `2.109.1` is installed, B0 now prefers its local stack on `127.0.0.1:54329`; the old port-55432 result is superseded. The fallback bootstrap at `scripts/review/impl/local-db/00-supabase-bootstrap.sql` is used only if the CLI is unavailable, and its Auth/Storage stubs are an approximation. Local stub RLS results are rehearsal only; the owner's production `npm run check:rls` remains authoritative.

The amended stack could not be started in this environment: Docker Desktop returned HTTP 500 for `/version` through both local contexts, including a forced API 1.50 request. The updated migration rehearsal was therefore not executed. This is recorded as `BLOCKED`, with no exit code claimed, in `docs/audits/migration-rehearsal-results.json`; restart Docker Desktop and rerun the exact owner action in `docs/review/implementation/owner-actions.md`.
