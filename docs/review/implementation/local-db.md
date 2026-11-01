# Local database for implementation review

## Preferred local stack

Supabase CLI `2.109.1` is installed, so B0 uses `supabase start` and the real local Supabase services, including the `anon`, `authenticated`, and `service_role` roles plus the Auth and Storage schemas. The project is configured as `oppscout-local-db`, uses the CLI-supported PostgreSQL 17 image, and binds its database to `127.0.0.1:54329`. The plain PostgreSQL fallback uses `postgres:16`.

Start or inspect the stack from the repository root:

```powershell
.\scripts\review\impl\local-db.ps1 -Action Start
.\scripts\review\impl\local-db.ps1 -Action Status
npm run impl:db-preflight -- --variable=LOCAL_DATABASE_URL
```

The helper loads the local `DB_URL` from `supabase status --output env` into `LOCAL_DATABASE_URL` and `LOCAL_DIRECT_URL` in the current PowerShell process without printing either URL or its credential. Do not run `supabase status --output env` directly in a visible terminal.

`-Action Stop` preserves local database data. A full reset is intentionally explicit and destructive:

```powershell
.\scripts\review\impl\local-db.ps1 -Action Start -Reset
```

It stops the Supabase project with `--no-backup`, removes its local data volumes, and removes the obsolete B0 plain-Postgres container and volume created before this protocol amendment. It then starts a clean Supabase stack. Do not use `-Reset` if you need to preserve local data.

## Migration rehearsal order

The local Supabase services initialize their supported roles and `auth`/`storage` schemas first. Apply repository Prisma migrations second:

```powershell
npm run impl:migration-rehearsal -- --apply
```

The rehearsal runs `prisma migrate deploy` against the guarded `LOCAL_*` loopback URL and compares every seeded Opportunity field with `docs/audits/catalog-snapshot.json`. Seed only when the Opportunity table is empty:

```powershell
npm run impl:seed-snapshot -- --apply
npm run impl:migration-rehearsal -- --apply
```

After Prisma, the rehearsal also attempts every SQL file in `supabase/migrations/` against the same local database. The repository currently has one tracked mirror, `20261012093356_allow_unlinked_catalog_opportunities.sql`. In the B0 rehearsal, Prisma applied all 14 migrations, then this mirror failed because its `ADD COLUMN "organizationName"` duplicates the column added by the Prisma migration. This is a migration-chain finding, not a passing rehearsal: do not skip or edit the mirror to conceal the conflict. Resolve the authoritative migration path in a separately reviewed migration change, then rerun the full rehearsal and record the result.

If the mirror migration fails, the full rehearsal stops before snapshot verification. Once Prisma deployment has completed, the snapshot can be seeded only if the local `Opportunity` table is empty, and its field-by-field preservation can be checked independently without applying or skipping migrations:

```powershell
npm run impl:seed-snapshot -- --apply
npm run impl:migration-rehearsal -- --verify-snapshot-only
```

The read-only verification does not turn a failed migration rehearsal into a pass; report both outcomes.

## Plain PostgreSQL fallback and RLS limitations

If Supabase CLI is unavailable, `local-db.ps1` falls back to a loopback-only `postgres:16` container named `oppscout-local-db`, with `POSTGRES_USER=postgres`, `POSTGRES_DB=postgres`, and a generated `LOCAL_DB_PASSWORD` in the ignored `.env.local-db` file. The committed idempotent bootstrap at `scripts/review/impl/local-db/00-supabase-bootstrap.sql` supplies minimal role, Auth, and Storage stubs required by the current migrations. That bootstrap is an approximation, not the Supabase implementation: RLS and policy behavior proven with these stubs is only a rehearsal. The owner's production run of `npm run check:rls` remains the authority.

Never use production `DATABASE_URL`, `DIRECT_URL`, or `NEXT_PUBLIC_SUPABASE_URL` for local rehearsal or writes. All database scripts require explicit `LOCAL_*_URL` or a separately owner-provided, non-production `DEV_*_URL`; the guard refuses a production project.
