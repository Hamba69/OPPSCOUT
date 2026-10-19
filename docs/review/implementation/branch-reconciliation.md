# Backup branch reconciliation (read-only)

Compared `backup-before-workflow-rewrite` at `8449ea21` / `4bb77c12` with `origin/main` at `7588d39f42d19f5f6cb98969a13c387cdf4f161c`. The backup branch is not a base and was not merged, rebased, cherry-picked, or deleted.

| Feature in backup branch | Present on `main`? | `main` evidence | Outcome |
|---|---|---|---|
| Organisation account setup and approval pipeline | Yes | `src/app/(web)/onboarding/organization/page.tsx`, `src/app/api/v1/organizations/review/route.ts`, `Organization.verificationStatus` in `prisma/schema.prisma` | Superseded for existing organization setup/approval; plan extensions are implemented fresh on this branch. |
| Candidate document upload and access flow | Yes | `src/app/api/v1/profile/documents/route.ts`, `src/app/api/v1/documents/[id]/download/route.ts`, `StoredDocument` and `SeekerAccessLog` in `prisma/schema.prisma` | Superseded for existing private seeker-document features; plan evidence screenshots still require their own workflow. |
| Admin portal | Yes | `src/app/(admin)/admin/review/page.tsx`, `src/app/api/v1/admin-portal/unlock/route.ts` | Reuse existing portal; do not create another admin/auth path. |
| Admin access log | Yes | `AdminAccessLog` in `prisma/schema.prisma`, admin portal API/routes | Existing model is present; plan-specific review audit events still need inspection/extension. |
| Feedback | Yes | `src/app/feedback/page.tsx`, `src/app/api/v1/feedback/route.ts`, `Feedback` in `prisma/schema.prisma` | Superseded; retain and extend only if plan requires. |
| Telemetry and operational metrics | Yes | `src/app/api/v1/telemetry/vitals/route.ts`, `src/app/api/v1/monitoring/kpis/route.ts`, `RequestMetric`, `WebVitalSample`, `MatchRun`, `MetricRollup` in `prisma/schema.prisma` | Existing baseline is reused; plan KPIs and launch gate remain separate work. |

`main` has the ten post-freeze models (`StoredDocument`, `SeekerAccessLog`, `SeekerPipelineEntry`, `Feedback`, `RequestMetric`, `WebVitalSample`, `MatchRun`, `UnmatchedTerm`, `AdminAccessLog`, `MetricRollup`). The branch contains pre-rewrite alternatives and unrelated deletions; do not transplant them. Feature presence is evidence of a reusable foundation, not automatic credit for new plan requirements.
