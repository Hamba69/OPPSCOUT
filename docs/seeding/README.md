# Seeding pipeline

Opportunities reach seekers through four gated stages. Each stage reports how many records survive and
why the rest were held, so an empty catalogue can never be a surprise.

```
Find        research agent, using the tiered sources (AGENT_INSTRUCTIONS.md)
  v         candidate JSON with quoted evidence
Verify +    npm run seed:run -- <file|folder>            dry run, writes a report
gate        npm run seed:run [-- <file|folder>] --apply  stages survivors as PENDING
  v
Publish     npm run seed:publish -- <run> --reviewer "Name" [--apply]   a person approves
  v
Seekers     the app's own visibility gate, plus a weekly refresh
```

## One-time setup

1. `npm run db:migrate` applies `20261110000000_opportunity_deadline_type`, which lets rolling listings
   exist. Until it is applied, rolling records are skipped (everything else works).
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (the same values the other scripts use).
3. Add the same two as GitHub Actions secrets for `.github/workflows/catalogue-health.yml`.

## A normal run

1. Give the agent `AGENT_INSTRUCTIONS.md`. It saves JSON in `imports/seeding-runs/inbox/`.
2. `npm run seed:run` scans every top-level `.json` file in `imports/seeding-runs/inbox/`. To test one
   batch alone, pass its file path instead. Read the funnel, held reasons and coverage table. Fix the
   instructions or data, not the gate.
3. `npm run seed:run -- --apply` stages survivors from the inbox as `pending` with the full checklist and
   quoted evidence in `reviewNotes`. Nothing is visible yet. The run folder (`imports/seeding-runs/run-...`)
   holds `accepted.json`, `held.json`, `report.json`, `staged.json` and an append-only `applied.jsonl`.
4. Open each source link (the publish dry run lists them, with anything to double-check) and run
   `npm run seed:publish -- imports/seeding-runs/run-... --reviewer "Your Name"`.
   Add `--apply` to approve. Records that would still be invisible are refused, with the reason.
5. The viewer reads published records from the database and applies the same visibility gate;
   `npm run seed:check` confirms what seekers can now see. JSON files are never displayed directly.

## Manual-review intake exceptions

For an explicitly supervised review run, you can stage Tier B source/application links and records with
evidence concerns without making them publishable:

1. Dry run: `npm run seed:run -- --allow-aggregators-for-review --include-evidence-held-for-review`
2. Inspect `held.json`, `accepted.json`, and warnings. Schema failures remain held. The deadline and
   duplicate checks still apply. The evidence exception does **not** apply to records admitted only by
   the aggregator override; those still need to pass evidence.
3. If the run is correct, add `--apply` to stage the review-only records in the database.
4. These rows have every publication checklist item marked false and remain hidden. After checking a
   record, correct its source/evidence in the inbox and rerun the pipeline; an incomplete pending row
   can be updated by matching organisation and title. The normal publish command still refuses any
   row whose checklist is incomplete.

The exception flags are opt-in. The 23 schema-invalid records are never admitted by them.

## What each stage rejects

| Stage | Holds a record when |
|---|---|
| schema | a field is missing or malformed, a deadline has no timezone, a quote is too short |
| source | the verified page is Tier B or C, a homepage, or the application link is an aggregator or social page |
| evidence | anything is `unresolved`; Ugandan eligibility is unclear or excluded; a suspicious fee or off-platform data request; evidence older than 3 days |
| deadline | a fixed deadline is under 14 days away (or implausibly far) |
| duplicates | the same source URL or organisation and title appears twice, or already exists live |
| visibility | the record would not pass `isUserVisibleOpportunity` once approved |

Repeat runs are safe. A record already in the catalogue becomes a `recheck` (timestamp refreshed) when
nothing changed, or an `update-changed` (set back to pending for re-approval) when the deadline or a reopened cycle changed.

## Keeping it fresh

- `npm run seed:check` runs daily in GitHub Actions. It lists why verified records are hidden, shows
  coverage for eight typical seekers, writes `recheck-queue.json`, and **fails** if fewer than 10 records are visible.
- Give `recheck-queue.json` to the agent (re-check mode). Vacancies come due every 3 days, other categories every 7.
- Expired listings disappear from the app the moment the deadline passes. The weekly job also marks them removed.
  A listing not re-confirmed for 14 days is removed by the freshness job, so a lapse in re-checking empties the
  catalogue: the check warns when records are within 4 days of that.
- Rolling listings are shown only while re-checked within 14 days.

## Matching changes that came with this

- A provider rule on a field a profile cannot hold (such as `audience`) no longer excludes every seeker; it
  appears as "Confirm eligibility with provider".
- One shared `buildReviewChecklist()` is the only way to write a checklist. The two review scripts and the importer
  that wrote five of the seven required keys are the reason the old catalogue was verified but invisible.

## Known limits

- Unchanged: a missing education level or date of birth still excludes a seeker from rules that need it
  (an existing, tested decision).
- The pipeline cannot browse; it validates what the agent hands over. Its evidence checks are only as good as the quotes.
- Tier A for a non-institutional domain rests on the domain the agent declares. The pipeline flags those for you
  to confirm at approval.
- `scripts/` is not covered by `npm run typecheck`; the new scripts were checked with a temporary config.
