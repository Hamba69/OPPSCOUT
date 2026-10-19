# B0 — Existing branch review

**Reviewed:** 19 October 2026  
**Current branch:** `main` at `7588d39f42d19f5f6cb98969a13c387cdf4f161c`  
**Branch reviewed:** `backup-before-workflow-rewrite`

## Branch status

The local branch contains the two requested commits and diverges from `main` at `80a53fd3ffb2ed49b5fe2997f72ca35780c28643`.

| Commit | Subject | Date | Summary |
|---|---|---|---|
| `4bb77c1213f181167d5d4db5e159c25e6a94df15` | `auth gates and admin portal` | 3 October 2026 | 107 changed files; admin portal and access gates, feedback, telemetry, monitoring, profile enrichment, report-review wiring, and schema/migrations. |
| `8449ea21c4847e86dd6958f162f903d4a350b912` | `additional todo features` | 3 October 2026 | 33 changed files; organization and candidate workflows, private seeker documents, document retention worker, schema/migration, and RLS inventory updates. |

Neither commit is an ancestor of current `main`; `git rev-list --left-right --count main...backup-before-workflow-rewrite` reports 17 commits on the `main` side and 2 on the branch side. This is a statement about commit ancestry, not a claim that all the branch's features are absent from the current tree. Some equivalent work is present in current `main` under other commits. The branch-specific commits remain unmerged and are not treated as shipped implementation evidence in the implementation-status score.

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

Keep the branch as historical/unmerged work for owner review. Do not build on it, merge it, or delete it based on this audit. Compare its feature intent with the current `main` tree before any future integration to avoid duplicating work already present through other commits. The decision can change only through an explicit owner instruction recorded in [owner-actions.md](./owner-actions.md).

