# OppScout implementation status

## Headline

The repo is materially behind the technical review and remediation plan. The current codebase contains the original schema and operational flow rather than the plan’s four-table Source/Lead/ListingReport/IngestionRun architecture, audience gate, and migration/RLS layer. The launch gate remains unprovable without a live read-only database and deployment evidence.

## Baseline

- Baseline commit: b3bcf65d5543e779618ee49cc52a814743e59504
- Current repo state: same HEAD as baseline; worktree dirty with unrelated local files
- Review focus: repo audit only; no edits to production source files

## Main findings

- Schema gap: the Prisma schema still reflects the original seven-model design and does not include the plan’s Source, Lead, ListingReport, or IngestionRun models.
- Audience gate gap: no production audience gate exists in app or route flow; the logic exists only as a scratch review artifact, not a live implementation.
- Trust/report gap: suspicious listing reporting exists at a basic service level but not as the plan’s ListingReport workflow with response-clock and two-report logic.
- F11 defect: duplicate manual ingests can still degrade verified listings to pending or flagged, matching the defect called out in the plan.
- Launch status: no read-only DATABASE_URL and no production deployment output were available, so live launch-gate evidence remains unverified.

## Implementation score

- Structural completeness: 0/16 major plan requirements are fully implemented in production code.
- Partial progress: 6/16 track small pieces of the plan, mainly in trust, review, and helper-adjacent logic.
- Status: not ready for launch gate; this is a gap, not a pass.

## Operational conclusion

The repo should be treated as an earlier-phase product implementation. It contains relevant groundwork, but it is not yet aligned with the plan’s required schema, audience gating, migration strategy, or launch-readiness evidence.
