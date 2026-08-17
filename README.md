# OppScout

Uganda-first opportunity discovery with rule-based eligibility, explained matching, verified listings, tracking, and selective email/SMS reminders.

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

Supabase Auth users must carry `app_metadata.role` (`user`, `organization`, or `admin`). Organization staff also require `app_metadata.organization_id`. Secrets never use `NEXT_PUBLIC_` names.

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

The contract suite covers every Phase One `/api/v1` route. Browser tests run against the real Next.js server in isolated memory mode.
