# Owner commands for additional live evidence

All commands below are read-only. Supply a database role restricted to SELECT/catalog inspection through `AUDIT_DB_URL`; never paste or report the URL itself. The offline audit does not need a database, and `npx tsx scripts/review/status/verify-status-all.ts` must not be given a database variable.

## Repository checks

```sh
git rev-parse HEAD
git status --short --branch
git branch -a
npm run prisma:validate
npm run typecheck
npm run lint
npm run test -- --reporter=dot
npx tsx scripts/review/status/verify-status-all.ts
```

The final command runs offline unless `AUDIT_DB_URL` is explicitly provided. Do not run `scripts/check-rls.ts` as an offline check: that pre-existing script constructs a Prisma client from `DATABASE_URL`.

## Read-only database counts

These queries use current Prisma model and column names from `prisma/schema.prisma`. They do not reference planned columns such as provenance or countryCodes because those columns do not exist yet. Table and field names were checked against that schema; PostgreSQL execution is UNVERIFIABLE offline.

```sh
psql "$AUDIT_DB_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align -c "SELECT COUNT(*) FROM \"Opportunity\" WHERE \"verificationStatus\" = 'verified' AND \"status\" IN ('open','closing_soon') AND (\"deadline\" IS NULL OR \"deadline\" > NOW());"

psql "$AUDIT_DB_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align -c "SELECT COUNT(DISTINCT \"organizationId\") FROM \"Opportunity\" WHERE \"verificationStatus\" = 'verified' AND \"status\" IN ('open','closing_soon') AND (\"deadline\" IS NULL OR \"deadline\" > NOW());"

psql "$AUDIT_DB_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align -c "SELECT c.relname, c.relrowsecurity FROM pg_class AS c JOIN pg_namespace AS n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname;"

psql "$AUDIT_DB_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align -c "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;"
```

The two opportunity counts and catalog queries above are valid against current field/table names, but their live execution remains UNVERIFIABLE offline. **UNVERIFIABLE:** the count of opportunities performed in Uganda, source/organization concentration, audience eligibility, report response times, dead-link rate and freshness error. The current schema does not contain enough fields to calculate all those plan metrics. A live database alone cannot supply missing schema fields or deployment-level review evidence.

## Optional plan verification

Do not use an unverified help switch for the catalog audit utility. No live query is implied by the offline verifier.
