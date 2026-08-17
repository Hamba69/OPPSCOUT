# Feature flags

Phase One flags are defined in `src/config/feature-flags.ts`.

| Flag | State | Reason |
|---|---:|---|
| `phaseOneCore` | on | Core profile, match, save, trust, and event paths are implemented and tested. |
| `organizationSubmission` | on | Submissions enter the manual verification queue. |
| `notifications` | on | Trigger logic, safeguards, worker, and provider adapters are implemented. Provider credentials remain environment-owned. |
| `trustReview` | on | Reports and pre-publication checks share the admin queue. |
| `aiMatching` | off | Phase 3. |
| `automatedScraping` | off | Phase 3 shadow-mode work. |
| `ussd` | off | Phase 4. |
