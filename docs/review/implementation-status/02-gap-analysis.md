# Gap analysis

## Decision

The implementation remains substantially behind the plan. The register reports 16 level-0, 4 level-1, 0 level-2, 0 level-3 and 0 level-4 items; weighted engineering completeness is 5.0% using weights 0%, 25%, 50%, 75% and 100%. The script computes the headline from the written CSV register.

## Gaps by workstream

1. **Provenance and persistence:** Source, Lead, ListingReport and IngestionRun models, supporting Opportunity/Organization/UserProfile fields, adapters, migrations and associated RLS are absent.
2. **Community and employer intake:** verified employer users can submit an opportunity, but there is no plan Lead API/lifecycle, helper channel, organization post-a-job form, triage SLA or origin cap.
3. **Audience and location:** no production audience gate is present. The production hard gate retains F8; the production ingestion path retains F11.
4. **Trust and reporting:** the existing checklist, report flagging and opportunity review queue satisfy only their named narrow sub-requirements. Automated official-domain checks, trusted-poster routing, report thresholds, timestamps and the 24-hour target are not implemented.
5. **Operations and launch evidence:** plan-specific catalog cleanup, source-concentration and Uganda-performed metrics, and a complete launch gate are absent or UNVERIFIABLE. Without `AUDIT_DB_URL`, no live query is attempted.
6. **Evidence capture:** plan screenshot extraction, field-level evidence and private retention workflow are absent.

## Existing sub-requirements credited

| Register item | Credited sub-requirement | Still missing |
|---|---|---|
| C2 | Verified organization staff can submit an HTTPS opportunity into pending review. | Lead model/lifecycle, lead-specific form, provenance, cap and fast lane. |
| T1 | Reviewer checklist records five basic checks. | Automated domain comparison, expanded risk signals and routing. |
| T3 | Report intake flags an opportunity and records an event. | ListingReport records, thresholds, priority, abuse controls and response clock. |
| T4 | Admin queue supports opportunity review and approve/reject decisions. | Planned lead/report workflow, priority routing and SLA. |

No “done” list includes pre-existing code with a known defect. In particular, F8 and F11 are level 0.

## Current risks

- **F11:** actual execution shows identical and changed-link duplicate ingestion can move a verified listing to pending. The admin/manual API path and organization submission reach `ingestManualOpportunity`; organization submission adds organization verification and staff-membership checks before the call. The standalone reviewed-jobs script writes directly and bypasses it.
- **F8:** actual execution shows the location hard gate rejects Gulu for a rule allowing Uganda or Kampala because current code compares `profile.location` only.
- **Reports:** the current path flags on an individual report; it does not implement the planned reporting thresholds or response clock.
- **Audience:** absence of a gate means today's feed can rank/display opportunities without the proposed fail-closed applicant-scope check.
- **Unmerged development:** the branch and commit evidence is in [evidence/branch-and-history.txt](./evidence/branch-and-history.txt); unmerged code is not shipped.

## Regression determination

No REGRESSED status is justified. `git log --all` was checked for the audience module and the F8/F11 production paths. The planned fixes were not found as production implementations before removal; absence is not regression.
