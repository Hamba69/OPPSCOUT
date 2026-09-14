# Demo readiness sprint

Implemented and checked on 14 September 2026, using `OPPSCOUT_DATA_MODE=memory` throughout.

## Run the demo

From the repository root in PowerShell:

```powershell
$env:OPPSCOUT_DATA_MODE = 'memory'
npm run build
npm run start -- --hostname 127.0.0.1
```

Open <http://127.0.0.1:3000/> and choose **Explore the demo**. **Switch persona** is available in the main navigation throughout the walkthrough.

Restart the server for a fresh collection and empty activity history. Saves, submissions, reviews, and analytics activity live only in the current process. Demo deadlines start two to twenty-eight days after initialization; two listings close in two and three days.

## Walkthrough

1. Open the homepage: its featured card is an actual ranked match. Initial totals are 10 verified open opportunities, 4 verified organizations, and 8.0 explanation factors per match.
2. Choose **Opportunity seeker (Amina)**. Her ten matches span 51–95%, with specific skills, study fields, locations, and preparation gaps.
3. Open a Nile Innovation Hub match, save it, select **I plan to apply**, and open its source. Demo sources are local previews and collect no applications.
4. Switch to **Verified organization (Nile Innovation Hub)**. Analytics shows real view, save, source-click, and application-intent events from the walkthrough. Post a listing to demonstrate the pending review flow.
5. Switch to **Platform admin**. Inspect the ten KPIs, review the new listing, and use the persistent admin navigation to open system health.

For a contrasting feed, stop the server, set the following process variable, and restart:

```powershell
$env:OPPSCOUT_DEMO_USER_ID = '11111111-1111-4111-8111-111111111112'
```

Daniel has an agriculture diploma, fewer overlapping skills, and Mbale/Jinja location preferences. His initial scores span 30–68%. Remove that process variable before the main Amina walkthrough:

```powershell
Remove-Item Env:OPPSCOUT_DEMO_USER_ID -ErrorAction SilentlyContinue
```

## Content and behavior boundaries

- `src/data/demo-catalog.ts` supplies ten fictional Ugandan demo listings and four fictional organizations through the memory repository. The previously supplied, sourced `src/data/seed-catalog.ts` and database seed script are preserved.
- Verification states on these fixtures illustrate the trust workflow; they are not claims about real vacancies or organizations. The feed, detail pages, homepage statistics, and source previews identify the demo content.
- KPI totals are calculated from repository records. Seven-point bar series and directional dots are explicitly illustrative, deterministic, and never stored as observed history. Zero-sample metrics remain visibly awaiting data.
- Provider funnel bars use actual events and identify them as totals, not unique people or cohort conversion rates. SLO badges and gauges use the existing target direction and values; absent samples remain neutral and dashed.
- `/login` uses the persona switcher in memory mode and retains the real auth form otherwise. Real Supabase sign-in was not exercised.
- No runtime dependencies were added. Schema, matching services, auth implementation, trust services, USSD, monetization gating, and all files under `tests/` were not edited by this sprint. Pre-existing test and seed edits remain in the checkout.

## Verification

- Typecheck and production build passed after each numbered implementation section. Final typecheck, build, and repository lint passed.
- All 30 existing unit/contract tests passed.
- All 5 existing Playwright tests passed against the production build in memory mode, including account entry, onboarding, saving, preferences, provider analytics, submissions, and monetization gating.
- A separate browser walkthrough checked 18 public routes at 1440px and 375px: 36 route checks, no horizontal overflow, and no browser console/page errors.
- The walkthrough verified all three persona links, saving, application intent, source navigation, real provider funnel updates, and admin approval.
- The three route groups emit their loading boundaries. Empty-state links, card hover, score animation, and reduced-motion behavior were checked in the browser.
- Local screenshots and the route-check record are under `test-results/demo-sprint/` (ignored verification artifacts).

This verifies the memory-mode demo. PostgreSQL persistence, real authentication, live notification delivery, real vacancy availability, and production deployment were outside this sprint.
