# Database environment status (B0, amended protocol)

**Production remained untouched.** No production database variables or credentials were used for connectivity or writes.

- Supabase CLI `2.109.1` is installed. `supabase/config.toml` now identifies `oppscout-local-db`, configures PostgreSQL 17 at `127.0.0.1:54329`, and suppresses its optional seed step. The CLI accepted the configuration after an unsupported `db.password` key was removed.
- Docker Desktop recovery was attempted with its supported `restart` command, followed by terminating only the `docker-desktop` WSL distribution and relaunching Desktop. Desktop then recovered: its CLI engine status was `running`, Docker client/server versions matched at `29.7.2`, and the Docker WSL distribution was running. A later supported `docker desktop restart --timeout 120` could not stop stale Docker processes, leaving Desktop in `stopping`; terminating the Docker-managed WSL distribution and starting Desktop recovered the engine again. No other WSL distributions were present at the time.
- The required `.\scripts\review\impl\local-db.ps1 -Action Start -Reset` then completed successfully. Supabase local services started with generated keys suppressed. The obsolete B0 container/volume cleanup ran as part of that explicit reset.
- `npm run impl:db-preflight -- --variable=LOCAL_DATABASE_URL` exited **0**; the local endpoint `127.0.0.1:54329` was reachable and PostgreSQL authentication succeeded (TCP and authentication probes each bounded to 2,000 ms). The URL was loaded into the same PowerShell process as the preflight and was not printed.
- The guarded `npm run impl:migration-rehearsal -- --apply` applied all **14 Prisma migrations** successfully to local `postgres` at `127.0.0.1:54329`. Its latest repeat exited **1** after **4,291 ms**: there were no pending Prisma migrations, then the repository's one tracked mirror, `supabase/migrations/20261012093356_allow_unlinked_catalog_opportunities.sql`, failed at its first statement. The mirror attempts to add `Opportunity.organizationName`, which already exists after Prisma migration `20261012093356_allow_unlinked_catalog_opportunities`; Supabase CLI returned `LegacyMigrationApplyError` for that `ALTER TABLE`. The migration was not edited or skipped. `supabase migration list --local` lists the mirror locally but has no applied local-DB record for it. The duplicate cross-tool migration is a finding and the full mirror rehearsal is **failed**, not passed.
- The local Opportunity table was initially empty, so the guarded snapshot seeder added the 115 snapshot Opportunities and 79 synthetic organization reference rows. A subsequent read-only `npm run impl:migration-rehearsal -- --verify-snapshot-only` exited **0** after **128 ms**, confirmed all 115 Opportunity rows unchanged, and recorded digest `e1c870c285493f14c9126ff83b3eb88db20d057679072cc114b4c03e92f5103b`. This independent snapshot check does not convert the failed mirror rehearsal into a pass.
- No product or production database was written. The only database writes were the authorized reset, migrations, and fixture seed on the isolated local Supabase stack.
- `npm run impl:checks` was rerun after the rehearsal: Prisma validation, typecheck, lint, build, and self-audit exited 0; focused database-guard tests passed 11/11; the full suite exited 1 with 95 passed and the two known baseline failures. The generated per-command exit codes and durations are in [validation-log.md](./validation-log.md).

The local Supabase CLI stack was started and provides its actual `anon`, `authenticated`, and `service_role` roles and Auth/Storage schemas for this rehearsal. The plain-PostgreSQL bootstrap exists only as a fallback if the CLI is unavailable; its RLS/policy results are an approximation. The owner's production run of `npm run check:rls` remains authoritative.

## Migration dependency search

Every SQL file under `prisma/migrations/` and `supabase/migrations/` was searched for `auth.`, `storage.`, `extensions.`, `pgrst`, `anon`, `authenticated`, `service_role`, and `auth.uid()`.

- Role grants/revokes and `NOTIFY pgrst` occur in the repository's Prisma migrations.
- `storage.buckets` is conditionally accessed by `20261003020000_documents_candidates/migration.sql`, which inserts the private `profile-documents` bucket.
- No migration references `auth.users`, `auth.uid()`, `storage.objects`, or `extensions.*`.
- One tracked `.sql` file exists under `supabase/migrations/`: `20261012093356_allow_unlinked_catalog_opportunities.sql`. It contains only the duplicate `Opportunity` column alteration and the `WorkMode` enum addition; it contains no Auth, Storage, role, or `auth.uid()` references.

The plain-PostgreSQL fallback bootstrap is at [00-supabase-bootstrap.sql](../../../scripts/review/impl/local-db/00-supabase-bootstrap.sql). It is not evidence of Supabase runtime behavior.
