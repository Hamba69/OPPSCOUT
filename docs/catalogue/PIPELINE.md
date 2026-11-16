# Catalogue pipeline

Every listing the catalogue owner records passes the same gates before it can reach seekers. Each run
reports how many records survive each stage and why the rest were held.

```
Research    the owner, following RESEARCH_GUIDE.md          -> imports/seeding-runs/inbox/<date>.json
Check       npm run seed:run -- <file>                       dry run, writes a report
Stage       npm run seed:run -- <file> --apply               survivors become PENDING
Approve     Admin > Review queue (or npm run seed:publish)   the owner approves or rejects
Seekers     the app's visibility gate
```

Each run writes a folder `imports/seeding-runs/run-<timestamp>/` with `accepted.json`, `held.json`,
`report.json` and, once applied, `staged.json` and an append-only `applied.jsonl`. These are local working
files and are not committed (see `.gitignore`); the evidence that matters is stored with each listing.

## What each stage holds back

| Stage | Holds a record when |
|---|---|
| schema | a field is missing or malformed, a deadline has no timezone, a quote is too short |
| source | the page is an aggregator, job board, social page or homepage, or the apply link is |
| evidence | anything is `unresolved`; Uganda eligibility is unclear or excluded; a suspicious fee or off-platform data request; evidence older than 3 days |
| deadline | a fixed deadline is under 7 days away for jobs, internships and consultancies, or under 14 days for other types (or implausibly far) |
| duplicates | the same source or organisation and title appears twice, already exists live, or was **rejected** before |
| visibility | the record would still be hidden from seekers once approved |

Records missing skills, minimum education, work mode or (for vacancies) experience months pass, but the
report warns `matching data missing`: they rank lower for seekers.

Repeat runs are safe. A record already live becomes a `recheck` (timestamp refreshed, no review needed) when
nothing changed, or an `update-changed` (back to pending for approval) when the deadline or cycle changed.
A record you rejected in the review queue is never staged again.

## Supervised exceptions

For a deliberate, careful review you can stage job-board sources or records with evidence concerns
without making them publishable: `npm run seed:run -- <file> --allow-aggregators-for-review
--include-evidence-held-for-review`. These rows are staged with every checklist item false and stay hidden
until you correct the source and run them through again.

## Organisations

Each listing names its provider. When the pipeline stages a listing from a new provider it creates a
catalogue provider record with no dashboard user. Providers like this never need publisher verification:
only organisations that sign up in the app to post their own listings are verified, in the review queue's
Publishers tab.

## Freshness

- A listing disappears from seekers the moment its deadline passes; the nightly maintenance job marks it removed.
- A listing not re-confirmed for 14 days is removed. Admin > Catalogue fixes lists those within 4 days of it.
- Rolling listings (no closing date) show only while re-checked within 14 days.

## Known limits

- The pipeline cannot browse; its evidence checks are only as good as the quotes recorded.
- When a provider's own domain is not a known institutional one, the source tier rests on the domain you
  declare. The pipeline flags these for you to confirm at approval.
