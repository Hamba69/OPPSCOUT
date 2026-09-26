# External opportunity intake screening

The archive is dated 2026-09-25 and contains 100 opportunities from 74 organizations. Its original `pipeline_report.json` reports 99 passed and one Dalilang near-duplicate pair.

## Comparison with the existing catalog

- Compared the 100 incoming records with all 12 existing seed opportunities using the app's title-similarity rule and its three-day deadline window. No incoming record matched an existing opportunity. No opportunity IDs, organization IDs, or normalized organization names collide with the existing seed catalog.
- Within the incoming set, the app rule flags the two Dalilang Territory Field Sales Representative records at similarity 0.872. The archive report says 0.857. The source URL is the same broad AllJobspo index for both; exact title and duty station remain unresolved, so both stay in the review queue.
- The Commonwealth PhD and Master's scholarship titles score 0.849 but describe different study levels; they remain separate.
- Sixteen records share three broad scholarship/jobs landing pages. The source links need listing-specific confirmation before approval.

## Other checks and findings

- All 100 records have HTTPS source URLs, valid dates, linked organizations, unique IDs, and deadlines after the archive snapshot and the 2026-09-26 screening time.
- The app's current text-based trust scan finds no signal in the imported title, description, or application-method fields. That scan did not catch a fee disclosed on the linked organization's own page: AFNet's official grant page states a $25 processing fee. The AFNet opportunity is flagged, its source link now points to that official page, and the organization link no longer uses a TinyURL redirect.
- Seventy-five source URLs are hosted by third-party opportunity aggregators. Many supplied organization links also point to an aggregator homepage instead of an organization's own site. The records and organizations therefore enter the app as pending rather than inheriting the archive's blanket `verified` status.
- Twenty-nine grant records have no required skills but do include preferred skills. The matching engine treats that as a valid no-required-skills case, so it is not a reason to reject them.

## Integration decision

All 100 opportunities and 74 organizations are included through the app's existing seed catalog. Organizations and opportunities remain pending in the admin trust desk; the AFNet record is flagged, and the Dalilang pair has its duplicate check left incomplete. The user feed only includes verified opportunities, so the intake will not be shown as approved until an administrator checks the source, fees, sensitive-data requests, deadline, and duplicate status.

The live database was not seeded during this change. Run the existing seed command only after reviewing the resulting catalog and choosing the intended database.