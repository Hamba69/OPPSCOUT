# OppScout implementation status

## Headline

The repo is not launch-ready, but B2 now implements the approved Source/Lead/ListingReport/IngestionRun schema and repository foundation. The additive migration and RLS inventory are present; the local migration-preservation rehearsal remains unverified because the local Docker engine is unavailable. The production audience gate and live launch evidence are still outstanding.

## Baseline

- B2 branch: `plan/b2-domain-foundation`, stacked on B1 commit `bd464c66`
- Current schema: 21 models, including the four D1-approved B2 models
- Review focus: B2 domain foundation, adapters, migration definition, and regression coverage

## Main findings

- Schema foundation: all four D1 models and approved profile, organization, and opportunity fields are present. The additive B2 migration has not been applied; migration-preservation validation is a prerequisite.
- Audience gate gap: no production audience gate exists in app or route flow; the logic exists only as a scratch review artifact, not a live implementation.
- Trust/report gap: suspicious listing reporting exists at a basic service level but not as the plan’s ListingReport workflow with response-clock and two-report logic.
- F11 defect: B1 prevents ordinary authoritative duplicates from downgrading verified listings; B2 records re-ingestion `lastSeenAt` and `needsRecheck` state. Changed application links still return to pending and suspicious content is still flagged.
- B1 defect fixes: F11 re-ingestion preservation, F8 residence-aware location hard gates, and F7 multi-place/study-location scoring now have regression coverage. See the B1 validation log for failing-before/passing-after results.
- Launch status: no read-only DATABASE_URL and no production deployment output were available, so live launch-gate evidence remains unverified.

## Implementation score

- The launch gate remains unverified; this is not a readiness pass.

## Operational conclusion

The repo now has the B2 schema and repository groundwork, but it is not yet aligned with the plan’s production audience gating or verified migration/launch evidence.
