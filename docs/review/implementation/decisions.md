# B0 — Existing branch review

**Reviewed:** 19 October 2026  
**Current branch:** `main` at merge commit `10fdceedf4b0b01679f3bdfc18b86db53f86dd1b`
**Branch reviewed:** `backup-before-workflow-rewrite`

## Branch status

The local branch contains the two requested commits and diverged from `main` at `80a53fd3ffb2ed49b5fe2997f72ca35780c28643`. The branch was subsequently merged into `main` by merge commit `10fdceedf4b0b01679f3bdfc18b86db53f86dd1b`, with the original branch ref preserved.

| Commit | Subject | Date | Summary |
|---|---|---|---|
| `4bb77c1213f181167d5d4db5e159c25e6a94df15` | `auth gates and admin portal` | 3 October 2026 | 107 changed files; admin portal and access gates, feedback, telemetry, monitoring, profile enrichment, report-review wiring, and schema/migrations. |
| `8449ea21c4847e86dd6958f162f903d4a350b912` | `additional todo features` | 3 October 2026 | 33 changed files; organization and candidate workflows, private seeker documents, document retention worker, schema/migration, and RLS inventory updates. |

Both commits are ancestors of current `main`. The merge retained current-main content for conflicting paths; the net merge changes were `.github/workflows/telemetry-retention.yml` and a settings-page integration for `AdminPortalTrigger`. The branch ref remains available as historical provenance. This is a statement about commit ancestry, not a claim that all the branch's features are absent from the current tree. Some equivalent work is present in current `main` under other commits.

## Contents and overlap with the plan

### `4bb77c1` — auth gates and admin portal

The commit adds or changes:

- Password-gated admin portal, admin section/KPI/review/SLO pages, exports, and authentication/route handling.
- Public feedback form and API, feedback administration, and report-review endpoint changes.
- Telemetry collection, monitoring/KPI/SLO surfaces, retention worker and scheduled workflow.
- Profile enrichment and organization-related UI/API changes.
- Prisma migrations and RLS inventory changes. Its schema contains the seven models `Feedback`, `RequestMetric`, `WebVitalSample`, `MatchRun`, `UnmatchedTerm`, `AdminAccessLog`, and `MetricRollup` in addition to the original core models.

**Plan overlap:** this is relevant prior work for the existing admin/review foundation, organization approval context, profile fields, operational metrics and admin audit history. It does not implement the plan's `Source`, `Lead`, `ListingReport` or `IngestionRun` models, the applicant audience gate, or the F8/F11 fixes. The report-submission/review work is not the plan's independent-reporter lifecycle and response clock.

### `8449ea2` — additional todo features

The commit adds or changes:

- Organization candidate discovery, candidate pages, candidate/pipeline APIs, and organization-facing screens.
- Seeker research-document upload/completion/download handling and a documents sweep worker.
- Three schema models: `StoredDocument`, `SeekerAccessLog` and `SeekerPipelineEntry`; migration and RLS inventory changes.
- Organization submission and profile/validation integration.

**Plan overlap:** organization verification/direct posting is relevant to WP-K and the existing organization-submission path; stored documents and their private retention/access controls are related foundations for WP-J and the plan's private-evidence requirements. The implemented documents are seeker research/application documents, not opportunity-submission screenshots or field-level extraction evidence. Candidate pipelines are not community Leads and do not provide the planned `Lead` lifecycle, provenance, or source registry. This commit does not implement `Source`, `Lead`, `ListingReport` or `IngestionRun`, nor does it fix F8 or F11.

## B0 disposition

The owner later explicitly authorized merging all branches for synchronization; see [owner-actions.md](./owner-actions.md). The branch was merged into `main` without deleting its ref. Do not delete the retained branch. Its branch-only implementation is not automatically credited as completion of plan requirements: the audit scores the current product tree against each specific requirement and records evidence or missing work per row.

Post-merge validation found that the merged settings-page integration references `searchParams` without declaring it, causing `npm run typecheck` to fail at `src/app/(web)/settings/page.tsx:20`. The original audit instruction restricts writes to audit tooling and reports; the product file has not been modified to fix or revert that change. The merge remains local and must not be pushed until the owner resolves the product-code scope or authorizes the minimal correction. See [owner-actions.md](./owner-actions.md).
