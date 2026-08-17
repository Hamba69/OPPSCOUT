# Phase 1 SLO monitoring

OppScout emits a structured `api_request` JSON log for every `/api/v1` handler and records notification delivery state in PostgreSQL. The admin dashboard at `/admin/slo` reports the real samples currently available; an empty metric is shown as `Collecting data`, never as a fabricated success rate.

Production alert thresholds are defined once in `src/config/slo-targets.ts`:

- Core API uptime: target 99.9%, alert below 99.8%.
- Email/SMS delivery: target 99%, alert below 98.5%.
- Data freshness: target 99%, alert below 98.5%.
- Match relevance: establish a Phase 1 behavioral baseline.
- USSD completion: Phase 4 only, tracked separately.
- Manual trust turnaround: under 48 hours, alert at 42 hours.

Vercel should drain structured logs to the selected observability backend. The dashboard must not combine USSD completion with API uptime.

Run `npm run worker:freshness` before computing the freshness SLO and `npm run worker:notifications` on the configured batch schedule. Provider failures are persisted as failed notifications and make the worker exit non-zero.
