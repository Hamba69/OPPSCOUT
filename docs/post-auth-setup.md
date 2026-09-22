# Finish your OppScout authentication setup

Password recovery is now available from **Forgot your password?** on the sign-in form. Its email link uses the existing `/auth/callback` code exchange, then opens `/reset-password`. A successful password update shows a confirmation before navigating to `/feed`. Invalid callback links show recovery guidance on the login page; an invalid reset session offers a link to request another email.

The existing `src/proxy.ts` was retained: this repository runs Next.js 16, whose supported convention is Proxy. The installed guide at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md` documents the older middleware convention as deprecated. The separate `src/lib/supabase/proxy.ts` session helper and callback handler are unchanged.

## Supply your project credentials

`.env.local` is ignored by Git. It now contains all variables from `.env.example`, with only the supplied public Supabase URL/key, local app URL, `OPPSCOUT_DATA_MODE="prisma"`, and `OPPSCOUT_DEMO_MODE="0"` filled in. All other values retain the exact template placeholders/defaults. Do not commit this file.

1. In Supabase **Project Settings → API / API Keys**, copy the legacy **service_role** key into `SUPABASE_SERVICE_ROLE_KEY`. Keep it server-only. It is required by the admin provisioning command; the public publishable key cannot perform admin operations.
2. In **Project Settings → Database**, or the dashboard **Connect** panel, obtain your actual connection strings and database password. Set `DATABASE_URL` to the Supabase transaction pooler (`.pooler.supabase.com`) on port **6543**, with `pgbouncer=true` and an integer `connection_limit` from **1 to 5**. Set `DIRECT_URL` to the direct `db.` host on port **5432**, without `pgbouncer`. Percent-encode special characters in the password. These are the URL checks in `scripts/validate-production-env.mjs`; never derive credentials from the public API key.
3. Once those database values are real, generate Prisma and apply migrations. Prisma CLI does not automatically load `.env.local` in this repository. In PowerShell, load its values into the current process without printing them:

   ```powershell
   node --env-file=.env.local node_modules/prisma/build/index.js generate
   node --env-file=.env.local node_modules/prisma/build/index.js migrate deploy
   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/check-rls.ts
   node --env-file=.env.local scripts/validate-production-env.mjs
   ```

   These invoke the same tools as `prisma:generate`, `db:migrate`, `check:rls`, and `validate:env`. Alternatively, export the variables in your shell and run those npm scripts. Migrations and live RLS verification were skipped during this setup because `DIRECT_URL` remained the template placeholder. The production validator will continue reporting missing provider and gate values until the separately governed setup is complete.

## Enable login and recovery email

In **Authentication → Sign In / Providers**, enable email/password sign-in. Under **Authentication → URL Configuration**, configure your Site URL and add these callback URLs to the redirect allowlist:

- `https://YOUR_DOMAIN/auth/callback`
- `http://127.0.0.1:3000/auth/callback`

The recovery request includes `?next=/reset-password`; ensure your redirect allowlist accepts that callback query as well (add the full recovery callback URL if needed). Keep the recovery email template using Supabase's confirmation URL so it completes the code exchange. Open the recovery email in the same browser that requested it, as the existing SSR client uses PKCE. Verify delivery, an expired link, password update, and login with the new password against your real project. See [Supabase password recovery](https://supabase.com/docs/guides/auth/passwords) for the provider setup.

Start with `npm run dev -- --hostname 127.0.0.1`. With Prisma mode enabled, signed-out protected routes redirect to login; authenticated application pages require the real database and applied migrations.

## Grant an administrator role

Have the person sign up and confirm their account, then run from the repository root:

```powershell
npm run admin:create -- person@example.com
```

The script loads `.env.local` automatically (explicit shell variables take precedence), searches Supabase Auth users by email with pagination, and grants `app_metadata.role=admin` while preserving their other app metadata. It does not create accounts or access Prisma tables through the Data API. Have the user sign out and sign in again afterward so their session reflects the role. A real service role key and an existing account are required; no live administrator was created during this setup.

## Remaining production work

Continue with [production readiness, required manual setup items 7 onward](production-readiness.md#required-manual-setup) for private shadow storage, Redis, Resend, Africa's Talking, workers, and the AI/USSD/monetization evidence gates. The [remaining phases strategy](remaining-phases-strategy.md) still applies. Feature flags, Prisma access boundaries, and the policy-free RLS migration were not changed by this task.

## Verification recorded on 22 September 2026

The requested commands ran in order with `OPPSCOUT_DATA_MODE=memory`. `.env.local` values were loaded into the verification process for Prisma validation; its database placeholders were not used to contact a database.

| Check | Result |
| --- | --- |
| `npm install` | Passed; lockfile unchanged. Reported 5 vulnerabilities: 2 moderate, 2 high, 1 critical. |
| `npm run prisma:validate` | Passed. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed. |
| `npm test` | Passed: 52 tests across 15 files. Includes recovery success/failure, missing/expired sessions, admin pagination/error cases, and protected routes. |
| `npm run build` | Passed. Final build recognizes both Proxy and dynamic `/reset-password`. |
| `npm run check:stubs` | Passed: `All-phase stub-marker check passed.` |

The reset page's server/client split was subsequently checked with targeted ESLint, all five recovery tests, and another successful full build including TypeScript validation.

A local production server on port 3125 ran with **Prisma mode**, demo mode disabled. All eight protected route groups returned 307 redirects to login preserving the requested path and query. Desktop/mobile browser checks covered the login and reset pages, the no-session recovery error, recovery confirmation with an intercepted Auth response, and invalid callback guidance. The intercepted request included the correct email and recovery callback URL. No page errors occurred in the successful browser checks. Screenshots are local, ignored artifacts under `test-results/auth-login-desktop.png`, `auth-recovery-mobile.png`, `auth-reset-desktop.png`, and `auth-reset-mobile.png`.

The CLI refused the placeholder service role key with: `Set real NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values before running admin:create.` No admin was provisioned. Database migrations, live `check:rls`, and `validate:env` were skipped because the migration credential remained a placeholder. Real email delivery, recovery code exchange, live password updates, and authenticated Prisma-backed pages still require owner configuration and live verification.

The additional `npm audit --omit=dev` reported two runtime dependency vulnerabilities: critical **Next.js** ([Windows server advisory](https://github.com/advisories/GHSA-p293-qw3h-jr36), [AVIF image advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4)) and high **Sharp** ([advisory](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)). Dependency upgrades were not included in this auth setup; address and reverify them before deployment.
