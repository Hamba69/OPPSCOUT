# Owner commands for live evidence

These commands are intentionally read-only and should be run by the owner. Report only pass/fail and counts back to the audit, never credentials.

## Baseline repo

```bash
git rev-parse HEAD
git status --short --branch
git log --oneline b3bcf65d5543e779618ee49cc52a814743e59504..HEAD
```

## Prisma and schema validation

```bash
npm run prisma:validate
npm run typecheck
```

## RLS inventory

```bash
npm run check:rls
psql "$DATABASE_URL" -Atqc "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
psql "$DATABASE_URL" -Atqc "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
```

## Launch gate checks

```bash
psql "$DATABASE_URL" -Atqc "SELECT COUNT(*) FROM \"Opportunity\" WHERE \"verificationStatus\" = 'verified' AND status IN ('open','closing_soon');"
psql "$DATABASE_URL" -Atqc "SELECT COUNT(*) FROM \"Opportunity\" WHERE \"verificationStatus\" = 'verified' AND status IN ('open','closing_soon') AND (deadline IS NULL OR deadline > NOW());"
psql "$DATABASE_URL" -Atqc "SELECT COUNT(DISTINCT \"organizationId\") FROM \"Opportunity\" WHERE \"verificationStatus\" = 'verified';"
```

## Deployment and env evidence

```bash
ls .github/workflows
grep -R "audienceGate\|automatedScraping\|trustReview\|organizationSubmission" src/config .env* .env.example 2>/dev/null || true
```

## Expected output

- Pass/fail listing for all new tables and RLS entries
- Exact count of live verified opportunities
- Distinct organization count for the launch gate
- Flag state for audience gate and scraper controls
