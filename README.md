# OppScout

Uganda-first opportunity discovery. Seekers build a profile and get a ranked feed of jobs, internships,
scholarships, fellowships, grants and training they are eligible for, on the web or by USSD.

- **A curated catalogue.** Listings are researched and approved by the catalogue owner, and organisations
  that sign up can post their own. Every listing passes the same review before seekers see it. See
  [docs/catalogue/ROUTINE.md](docs/catalogue/ROUTINE.md).
- **Deterministic matching.** Hard eligibility gates (education, certifications, age, programme rules), then
  OrbitMatch scores fit from skills, field, qualification, experience, interests and opportunity type. Seekers
  see a match percentage. See [ORBITMATCH.md](ORBITMATCH.md). `OPPSCOUT_MATCH_ENGINE=rules` selects the
  legacy engine.
- **Admin portal.** Overview, review queue, catalogue fixes, publishers, users and feedback, with analytics
  under "More".

## Stack

Next.js 16 (App Router), React 19, Supabase (Auth, Postgres through the Supabase API, Storage), Prisma for the
schema and migrations, Tailwind, Vitest and Playwright.

## Local development

```bash
npm install
npm run prisma:generate
npm run dev
```

Open `http://127.0.0.1:3000/login`. The app always uses Supabase Auth and Postgres; configure `.env.local`
first. The in-memory repository is used only by automated tests.

## Environment and database

1. Copy `.env.example` to `.env.local` and fill it in. `DATABASE_URL` is the Supabase transaction pooler URL
   (`:6543`, `pgbouncer=true`, low `connection_limit`); `DIRECT_URL` is the direct URL (`:5432`), used only for
   migrations.
2. Apply migrations with `npm run db:migrate`.
3. Seed development data with `npm run db:seed` (development databases only).
4. Create an admin with `npm run admin:create`.

`npm run validate:env` confirms required variables are present without printing them. The deployment
checklist is [docs/production-readiness.md](docs/production-readiness.md).

On Vercel, set both database variables for Production, Preview and Development; Preview must use a separate
Supabase project. The build runs only `prisma generate` and `next build`; apply migrations deliberately.

Roles: Supabase Auth users default to `user`. Publisher users become organisation-scoped when they create an
organisation. Admins carry `app_metadata.role=admin`. Secrets never use `NEXT_PUBLIC_` names.

## Catalogue

| Command | What it does |
|---|---|
| `npm run seed:run -- <file>` | Checks a file of researched listings and reports what would be held and why |
| `npm run seed:run -- <file> --apply` | Stages the survivors as pending for review |
| `npm run seed:check` | Live counts against targets, coverage for typical seekers, re-check queue and research plan |
| `npm run seed:publish -- <run> --reviewer "Name"` | Approves a staged run from the command line (the review queue does the same) |
| `npm run worker:freshness` | Removes expired and stale listings (runs nightly) |

Docs: [ROUTINE.md](docs/catalogue/ROUTINE.md) (daily routine and targets),
[RESEARCH_GUIDE.md](docs/catalogue/RESEARCH_GUIDE.md) (how to research and record a listing),
[PIPELINE.md](docs/catalogue/PIPELINE.md) (what each check does).

## Scheduled jobs (GitHub Actions)

| Workflow | When | What |
|---|---|---|
| Catalogue maintenance | Nightly, 03:00 Kampala | Removes expired and stale listings, checks catalogue health, writes the research plan |
| Telemetry retention | Scheduled | Trims old request and web-vitals samples |

Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Variable: `OPPSCOUT_CATALOGUE_PHASE`.

`npm run worker:notifications` sends alerts and needs a scheduler of your choice once notification providers
are configured.

## Gated features

Feature flags live in `src/config/feature-flags.ts` and [FLAGS.md](FLAGS.md).

- **Publishers** need an official email and URSB registration number. Any website must be public HTTPS and
  match the email domain. An admin may verify without the number after a manual identity check.
- **AI matching** stays off unless `ANTHROPIC_API_KEY` is set and a held-out comparison
  (`npm run validate:ai`) passes; then `OPPSCOUT_AI_COMPARISON_APPROVED=true` allows `OPPSCOUT_AI_DEFAULT=true`.
- **Automated scraping** is off. The dormant shadow-discovery code (`worker:weekly-opportunities`) never
  publishes; nothing is scheduled to run it.
- **USSD** uses the Africa's Talking callback at `/api/v1/ussd/session`; public rollout stays off until a real
  sandbox run meets the completion target.
- **Payments** are intentionally absent until the legal review in
  [docs/phase-5-legal-gate.md](docs/phase-5-legal-gate.md).

International scholarships, grants, fellowships, training and internships may be on-site abroad; matching
does not penalise their location, but review must confirm Ugandans are eligible.

## Verification

```bash
npm run verify        # prisma validate, typecheck, lint, unit and contract tests, build, stub check
npm run test:e2e      # browser tests against the real Next.js server in memory mode
```
