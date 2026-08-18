# Production readiness and phase verification

This file records the code-level verification against `AGENT_BUILD_GUIDE.md` and `docs/master-plan.md`. A code-complete gate means the repository contains the functional path and automated coverage. It does not claim external evidence that can only come from a deployed environment, provider sandbox, production usage, counsel, or configured credentials.

## Phase status

| Phase | Code status | Remaining external gate |
| --- | --- | --- |
| 1 - Core spine | Complete: profile CRUD, deterministic eligibility, explained feed, save/apply tracking, provider delivery adapters, trust reporting/review, event logging, freshness jobs, and SLO views are wired. | Apply migrations, configure providers/workers/log drain, and prove staging uptime plus delivery SLOs. |
| 2 - Explainability and provider tools | Complete: explanations/trust context are visible, provider onboarding and listing management work, organization review exists, analytics are aggregate-only, and all ten KPIs are queryable. | Populate dashboards with deployed usage and verify organization identities. |
| 3 - AI and automated discovery | Complete behind fail-closed flags: Anthropic analysis, rule-owned hard gates, held-out comparison, private shadow storage, duplicate/freshness metrics, and scam signals are implemented. | Supply the AI key, run and approve held-out validation, create the private shadow bucket, and complete the shadow validation window before cutover. |
| 4 - USSD | Complete behind a public-rollout gate: five-option resumable menu, PIN/token auth, Redis persistence, character budget, Africa's Talking adapter, and isolated SLO instrumentation are implemented. | Configure a header-capable webhook gateway, provision credentials/service code, and prove 95% or better completion in the real sandbox. |
| 5 - Monetization | Readiness complete and activation intentionally blocked: organization plan fields, legal/trust/retention/sample gates, aggregate readiness UI/API, and free discovery invariants are implemented. No payment execution code ships. | Counsel approval and real healthy metrics are mandatory before payment or promoted-listing code is authorized. |

## Required manual setup

1. Copy `.env.example` to `.env.local` locally and configure the same names in the deployment environment. Run `npm run validate:env` in a production-equivalent shell; it reports names only and never prints values.
2. Create the PostgreSQL/Supabase database, run `npm run prisma:generate`, then `npm run db:migrate`. Set production `OPPSCOUT_DATA_MODE=prisma`.
3. In Supabase Auth, enable email/password, add `https://YOUR_DOMAIN/auth/callback` to redirect URLs, and create the first admin with `app_metadata.role=admin`. Normal users self-register. Provider users become organization-scoped automatically when they create an organization; optional metadata can still be used for centrally provisioned staff.
4. Create a **private** Supabase Storage bucket named by `OPPSCOUT_SCRAPER_SHADOW_BUCKET`. Do not make this bucket public.
5. Provision Upstash Redis. It stores USSD sessions/PIN hashes and enforces role-specific API/USSD rate limits.
6. Configure Resend and Africa's Talking SMS credentials. Verify the sender/domain and use a real public `OPPSCOUT_APP_URL`; notification links and preference links are generated from it.
7. Put a trusted reverse proxy/gateway in front of the USSD callback and have it inject `x-oppscout-ussd-secret`. Point Africa's Talking at `https://YOUR_DOMAIN/api/v1/ussd/session` through that gateway. Basic authentication is also accepted. Query-string secrets are disabled by default because URLs are commonly logged; enable `OPPSCOUT_USSD_ALLOW_QUERY_SECRET=true` only for a controlled sandbox.
8. Schedule `npm run worker:freshness` and `npm run worker:notifications`. Alert on a non-zero worker exit. Drain structured application logs to the chosen observability backend so API uptime survives serverless instance recycling.
9. Run `npm run validate:ai` on labelled held-out cases before setting both `OPPSCOUT_AI_COMPARISON_APPROVED=true` and `OPPSCOUT_AI_DEFAULT=true`. Keep automated live scraping disabled until shadow error targets pass.
10. Complete the evidence in `docs/phase-5-legal-gate.md` before any monetization activation. The repository deliberately contains no checkout, processor, or payment-webhook implementation.

## Release commands

```powershell
$env:DATABASE_URL="postgresql://..."
npm ci
npm run prisma:generate
npm run verify
npm run test:e2e
npm run validate:env
npm run db:migrate
```

Run browser tests against a production-equivalent deployment after migrations and secrets are present. Local memory-mode browser tests prove application behavior, not provider delivery or deployed infrastructure health.
