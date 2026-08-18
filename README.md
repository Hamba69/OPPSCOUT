# OppScout

Uganda-first opportunity discovery with deterministic eligibility, explained rule/AI matching, verified manual and shadow-discovered listings, provider analytics, web/USSD access, selective alerts, and fail-closed monetization readiness.

## Local demonstration

```powershell
npm install
$env:OPPSCOUT_DATA_MODE="memory"
npm run dev
```

Open `http://127.0.0.1:3000/feed`. The memory adapter contains realistic demonstration records and is enabled only when explicitly selected, in tests, or when a non-production development environment has no database URL.

## PostgreSQL / Supabase setup

1. Copy `.env.example` to `.env.local` and supply the environment-owned values.
2. Run `npm run prisma:generate`.
3. Apply the committed migration with `npm run db:migrate`.
4. Seed development data with `npm run db:seed`.
5. Schedule `npm run worker:freshness` and `npm run worker:notifications` in the chosen worker runtime.

Run `npm run validate:env` in the production-equivalent environment to confirm that required variable names are present without printing their values. The complete deployment checklist and phase-by-phase evidence boundary are in [`docs/production-readiness.md`](docs/production-readiness.md).

Later-phase integrations are deliberately gated:

- AI matching needs `ANTHROPIC_API_KEY` plus a passing `npm run validate:ai` result recorded through `OPPSCOUT_AI_COMPARISON_APPROVED=true` before `OPPSCOUT_AI_DEFAULT=true` is permitted.
- Scraping writes only to the private Supabase Storage shadow bucket until measured duplicate and freshness targets pass.
- USSD uses the Africa's Talking callback at `/api/v1/ussd/session`, Redis-compatible session/credential persistence, `USSD_TOKEN_SECRET`, and a gateway webhook secret. Public rollout remains blocked until the real sandbox completion SLO passes.
- Monetization is read-only readiness infrastructure. Payment handling is intentionally absent until the legal and real-metric evidence in `docs/phase-5-legal-gate.md` is supplied.

Supabase Auth users default to the `user` role. Provider users become organization-scoped when they create an organization; centrally provisioned staff may instead carry `app_metadata.role=organization` plus `app_metadata.organization_id`. Admins must carry `app_metadata.role=admin`. Secrets never use `NEXT_PUBLIC_` names.

## Verification

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oppscout"
npm run prisma:validate
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run check:stubs
```

The contract suite covers every `/api/v1` route across all phases. Browser tests run against the real Next.js server in isolated memory mode.
