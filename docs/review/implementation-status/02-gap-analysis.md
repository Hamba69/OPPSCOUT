# Gap analysis

## Summary

The repo is not in a launch-ready state for the plan. The main blockers are:

1. No production audience gate connected to the actual app flow
2. The B2 schema migration has not passed the required local snapshot-preservation test
3. No live database or deployment evidence is available to prove the launch gates

## Minimum path to completion

### B2: domain foundation

- Add the four plan tables and required enums
- Extend Opportunity/Organization/UserProfile with the plan fields
- Add repository CRUD support, migration, and RLS coverage
- Run the migration-preservation test before applying the migration

### B3: audience and visibility

- Add the audience gate function and shadow-mode flag
- Wire it in feed, search, match, notification, and USSD flows
- Include UI labels and review scripts covering Appendix B cases

### Later: ingestion and trust controls

- Fix F11 downgrade bug in duplicate handling
- Add report lifecycle and response-clock logic
- Add lead intake and reporting controls with source tracing

## Priority order

1. Complete local migration-preservation validation for B2
2. Add audience gate with shadow mode and producer-safe defaults
3. Lock down RLS and migration evidence
4. Run launch-gate checks against a read-only database
5. Publish the operational review evidence for owner sign-off
