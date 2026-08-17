# Feature flags

Phase One flags are defined in `src/config/feature-flags.ts`.

| Flag | State | Reason |
|---|---:|---|
| `phaseOneCore` | on | Core profile, match, save, trust, and event paths are implemented and tested. |
| `organizationSubmission` | on | Submissions enter the manual verification queue. |
| `notifications` | on | Trigger logic, safeguards, worker, and provider adapters are implemented. Provider credentials remain environment-owned. |
| `trustReview` | on | Reports and pre-publication checks share the admin queue. |
| `providerTools` | on | Self-serve publishing, organization details, and aggregate-only analytics are complete. |
| `kpiDashboard` | on | All ten master-plan KPIs are computed from canonical records. |
| `aiMatching` | off | Implemented, but cannot become default before a real-provider held-out comparison passes. |
| `aiComparison` | on | Side-by-side rule/AI precision harness is available. |
| `scrapingShadowMode` | on | Discovery writes private shadow artifacts only, never live opportunities. |
| `automatedScraping` | off | Live cutover remains blocked until the measured shadow error targets pass. |
| `ussd` | off | Phase 4. |
