# Gap analysis

## Summary

The repo is not in a launch-ready state for the plan. The main blockers are:

1. Missing source-of-truth schema for Source, Lead, ListingReport, and IngestionRun
2. No audience gate connected to the actual app flow
3. No production RLS or migration proof for the new model set
4. F11 duplicate downgrade bug still present in ingestion logic
5. No read-only database or deployment evidence to prove the launch gates

## Minimum path to completion

### Batch 1: schema and security

- Add the four plan tables and required enums
- Extend Opportunity/Organization/UserProfile with the plan fields
- Add migration files and verify with Prisma validation
- Add a table-by-table RLS checklist and check script

### Batch 2: audience and visibility

- Add the audience gate function and shadow-mode flag
- Wire it in feed, search, match, notification, and USSD flows
- Include UI labels and review scripts covering Appendix B cases

### Batch 3: ingestion and trust controls

- Fix F11 downgrade bug in duplicate handling
- Add report lifecycle and response-clock logic
- Add lead intake and reporting controls with source tracing

## Priority order

1. Fix F11 and add the schema model set
2. Add audience gate with shadow mode and producer-safe defaults
3. Lock down RLS and migration evidence
4. Run launch-gate checks against a read-only database
5. Publish the operational review evidence for owner sign-off
