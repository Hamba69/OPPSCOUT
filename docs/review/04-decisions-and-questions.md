# Decisions and questions

The recommendations below are copied from section 8 of the technical review plan. The assessment column records what this repository verification established. Defaults are implementation assumptions, not owner approvals.

## D1-D10

| ID | Plan decision | Plan recommendation | Verified assessment | Default assumed |
|---|---|---|---|---|
| D1 | Allow new tables (Source, Lead, ListingReport, IngestionRun) | Yes. Record it in `docs/deviations.md`, along with the ten models already added. The freeze is lifted in practice. | `prisma/schema.prisma` already has 17 models, including the ten later models; the four Appendix A additions validate in a scratch schema. | Proceed with an explicit deviations entry before migration work. |
| D2 | Should pending catalogue listings appear in the browse page? | Hide them by default, but only after the 21 pending Uganda records have been traced (weeks 1 to 2). Otherwise a Ugandan user would see almost nothing in the meantime. `browseOpportunities` currently shows pending catalogue items beside verified ones. Afterwards show unreviewed items only behind an explicit “unreviewed” toggle, if at all. | Under the plan’s `open` definition (`open` or `closing_soon`), there are 21 pending active Uganda-matching records; 20 are jobs. [browseOpportunities](/E:/OPPSCOUT/src/lib/opportunity-browse.ts:20) includes pending catalog-origin rows. Pending items should not be hidden before the trace pass. | Keep current visibility during the first two-week trace; then hide pending by default behind an explicit flag/toggle. |
| D3 | Collect nationality? | Not yet. Assume Ugandan, collect `countryOfResidence` and `openToAbroad`, and treat nationality-restricted listings through `eligibleCountries` and the additional-requirements note. Nationality is sensitive data and adds consent duties. | Current `UserProfile` has none of nationality, residence, or abroad-openness. Appendix A proposes residence/openness but no nationality. | Do not collect nationality; use `countryOfResidence` default UG and `openToAbroad` default false as proposed, subject to counsel’s data-protection review. |
| D4 | Date-only deadlines | Store end of day in East Africa Time and display the date. This is a behaviour change for existing records, so apply it in the clean-up script. | Current deadline values are `DateTime`; the plan explicitly identifies start-of-day storage as a defect and offers no conflicting evidence. | End of day in East Africa Time (`Africa/Nairobi`) for date-only sources; preserve explicit source times. |
| D5 | Who reviews, and who are the first community helpers? | Three reviewers at about 5 to 6 hours a week each, plus 8 to 10 helpers from campus career offices and youth networks. Name the reviewers by day 2. | No reviewer/helper roster exists in the repository. The capacity model assumes three reviewers and 125.4 total hours. | Name three reviewers and recruit 8–10 helpers as recommended; the pilot may start with five confirmed helpers and expand based on quality. |
| D6 | Who asks for permission, and who runs employer outreach? | Name one person for Fuzu and BrighterMonday and one for the 100-organisation outreach list, each with a date. A written yes or no matters more than the answer. | No permission or outreach owner is recorded in the repository. The plan forbids automated access without written permission. | Assign one owner per outreach lane and record request/response dates before enabling any adapter. |
| D7 | Monthly spend ceiling for AI extraction | Set one in configuration before any scheduled run. None exists today. Start small and raise it from measured cost per lead. | `ai-rules.ts` has token and timeout limits but no monthly spend ceiling. | Keep screenshot extraction off; set an initial conservative ceiling and alert before scheduling. |
| D8 | How is the 5 percent cap enforced? | At intake and review, not by deleting. Origins at 8 live listings are deprioritised in the queue. At 10, further items wait in pending with a reason code and nothing is approved above the cap before the gate. After launch the cap is 5 percent of the live catalogue, tracked as an alert rather than a block. | Snapshot operational count is 63 live-status records after excluding one flagged row; 16 count against advance-africa as a Source. At target size, 5% is 10. | Deprioritise at 8, hold the 11th with `held: origin at cap`, and after launch use the live-denominator alert; never delete. |
| D9 | Allow `org_attested` provenance for small employers without websites? | Yes, with conditions: registration proof, a named contact confirmed by a logged call, and no more than 25 percent of the catalogue. Without this, the 150-in-Uganda target is unlikely because many small Ugandan employers have no website. | No provenance model exists today; Appendix A adds `ProvenanceType`. Whether the evidence is legally sufficient is for counsel. | Allow only after all named evidence checks; enforce the 25 percent cap and review with counsel. |
| D10 | How do we recognise helpers? | Recognition, references and a public thank-you based on listings that went live, not payment per lead. Revisit after two weeks of measured funnel data, because pay-per-submission invites spam. | No helper model or recognition workflow exists. The plan identifies raw-submission incentives as an abuse risk. | Recognition only during the first two-week pilot; reassess using measured outcomes, not raw lead volume. |

## Remaining owner inputs

1. **Read-only database:** run with a restricted role and share redacted output, not credentials:

   ```powershell
   $env:DATABASE_URL='postgresql://READ_ONLY_URL'
   npm run check:rls
   npx tsx scripts/review/verify-all.ts
   npx tsx scripts/audit-catalog.ts --help
   ```

   Default: the owner runs these locally and shares counts/failures only.
2. **Reviewers/helpers:** name the three reviewers and first 5–10 helpers required by D5. Default: owner plus two domain reviewers and five helpers.
3. **Permission/outreach owners:** name the D6 owners and dates. Default: assign before adapter flags are enabled.
4. **Counsel:** confirm submission terms, retention, takedown, source licensing, and any registration/notice obligations. Default: make no legal assertion until counsel responds.
