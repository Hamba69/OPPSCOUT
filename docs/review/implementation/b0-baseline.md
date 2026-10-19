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

No Docker executable or safe database was established during baseline. Database-gated work remains deferred until a local database can be provided or started.
