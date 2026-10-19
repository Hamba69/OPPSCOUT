# B0 baseline

**Baseline branch/commit:** `main` / `7588d39f42d19f5f6cb98969a13c387cdf4f161c`  
**Runtime:** Node `v24.13.0`, npm `11.6.2`, Prisma `6.19.3`, Next.js `16.3.1`.

Checks ran in the isolated B0 worktree with database environment variables unset, except `prisma validate`, which used dummy localhost URLs because the schema requires `DATABASE_URL` and `DIRECT_URL`; it does not connect.

| Command | Exit | Result |
|---|---:|---|
| `npm ci` | 1 | Initially failed with `EUSAGE`: lockfile omitted `@emnapi/wasi-threads`, `@testing-library/dom`, `@types/aria-query`, `dom-accessibility-api`, `lz-string`, `pretty-format`, and transitive entries. |
| `npm install --no-audit --no-fund` | 1 | Attempted lock repair; failed with `ECONNRESET` fetching npm registry packages. |
| `npm install --package-lock-only --offline --ignore-scripts --no-audit --no-fund` | 0 | Updated lock metadata/entries from cached metadata. |
| `npm ci --offline --no-audit --no-fund` | 1 | `ENOTCACHED`: `prisma@6.19.3` tarball is not cached. This is an environment/cache limitation, not a dependency-resolution result. |
| `npm run prisma:validate` | 0 | Schema valid with local-only dummy connection URLs; no database connection. |
| `npm run typecheck` | 0 | Passed; generated `tsconfig.tsbuildinfo` was restored immediately. |
| `npm run lint` | 0 | No errors; four existing warnings in `discovered-catalog.ts`, two audit scripts, and `page-skeleton.tsx`. |
| `npm test -- --reporter=dot` | 1 | 24 files / 84 tests passed; two known baseline failures: auth proxy redirect and recovery `toHaveAttribute`. |
| `npm run build` | 0 | Next.js 16.3.1 Turbopack build passed; no font fix required. |

An initial concurrent check run had two extra timeouts in `profile-form.test.ts`; the serial rerun returned exactly the two known baseline failures. The initial build attempt used a dependency junction pointing outside the worktree and failed Turbopack's symlink check; the successful build ran with a physical dependency copy in the isolated worktree. That setup artifact is not a repository defect.

## B0 implementation verification

| Command | Exit | Result |
|---|---:|---|
| `npm run prisma:validate` | 0 | Schema valid. |
| `npm run typecheck` | 0 | Passed after B0 changes. |
| `npm run lint` | 0 | No errors; the same four existing warnings remain. |
| `npm test -- --reporter=dot --maxWorkers=1 tests/unit/db-guard.test.ts` | 0 | 1 file / 11 tests passed. |
| `npm test -- --reporter=dot --maxWorkers=1` | 1 | 25 files / 95 tests passed; the same two known failures remain, in `auth-proxy.test.ts:15` and `auth-recovery.test.ts:28`. |
| `npm run build` | 0 | Production build passed. |
| `npm run impl:self-audit` | 0 | Changed-source and test hygiene checks passed. |
| Pre-amendment `npm run impl:migration-rehearsal -- --apply` | 0 | Superseded: this used plain PostgreSQL on port 55432 and does not satisfy the amended Supabase-stack requirement. |
| Post-amendment `npm run impl:migration-rehearsal -- --apply` | 1 | All 14 Prisma migrations applied to the local Supabase stack; the tracked Supabase mirror failed because it adds `Opportunity.organizationName`, already added by Prisma. The mirror was not edited or skipped; see [the rehearsal status](../../audits/migration-rehearsal-results.json). |
| `npm run impl:migration-rehearsal -- --verify-snapshot-only` | 0 | Read-only comparison verified all 115 snapshot Opportunities unchanged (SHA-256 `e1c870c285493f14c9126ff83b3eb88db20d057679072cc114b4c03e92f5103b`). This does not convert the failed mirror rehearsal into a pass. |

The prior migration and seed operations used only the B0 local PostgreSQL container bound to `127.0.0.1:55432`; no production database variables or credentials were used. Those results are retained as historical evidence but are superseded by the post-amendment rehearsal. The current local Supabase CLI stack used `127.0.0.1:54329`; no production database variables or credentials were used. `npm ci` remains unverified because the package tarball is absent from the local cache and registry requests fail with `ECONNRESET`.
