# Catalogue routine

OppScout's catalogue is curated by one person, the **catalogue owner**. Organisations that sign up in the
app can also post their own listings; those go through the same review queue. Nothing reaches seekers
without the owner's approval.

## What runs on its own

| When (Kampala) | What |
|---|---|
| Every night, 03:00 | **Catalogue maintenance** workflow: removes listings whose deadline passed or that went 14 days without a re-check, checks catalogue health (emails you if too few listings are live), and writes this week's research plan |
| Instantly | A listing disappears from seekers the moment its deadline passes |

## Your morning (about an hour)

1. **Admin > Overview.** Glance at *Needs your attention* and the catalogue numbers.
2. **Admin > Catalogue fixes.**
   - *Approved but hidden*: fix each one (link its provider, or send it back to review).
   - *Re-check due*: open each source. If it's still open, press **I re-checked it today**; if not, press **Remove**.
3. **Research.** Find today's listings following `RESEARCH_GUIDE.md`, guided by the research plan (section
   "Targets" below), and save them as `imports/seeding-runs/inbox/<today>.json`.
4. **Check and stage:**
   ```
   npm run seed:run -- imports/seeding-runs/inbox/<today>.json            # dry run: read held reasons, fix the file
   npm run seed:run -- imports/seeding-runs/inbox/<today>.json --apply    # stage as pending
   ```
   Run it the same day you research: evidence older than 3 days is held.
5. **Admin > Review queue.** For each listing, read the quoted deadline and Uganda evidence, open the
   source if anything looks off, tick the box, then **Approve** or **Reject**. Rejected listings leave the
   queue and the pipeline never proposes them again. Verify any new publishers in the Publishers tab.

## Targets

Sized for one person at about 10 approvals a day. The numbers live in `src/config/catalogue-targets.ts`.

| Type | Live target | Typical days live | Approvals per week to hold it |
|---|---:|---:|---:|
| Jobs | 60 | 12 | 35 |
| Internships | 20 | 21 | 7 |
| Training | 15 | 21 | 5 |
| Scholarships | 30 | 45 | 5 |
| Fellowships | 10 | 40 | 2 |
| Grants (individuals) | 15 | 35 | 3 |
| **Total** | **150** | | **about 57** |

| Phase | When | Goal | Approvals per week | Health alert below |
|---|---|---|---:|---:|
| `build` | Weeks 1-2 | about 90 live | about 74 | 25 |
| `fill` | Weeks 3-4 | 150 live, no seeker group short | about 96 | 80 |
| `steady` | After that | hold about 150 | about 57 | 110 |

Set the GitHub repository variable `OPPSCOUT_CATALOGUE_PHASE` to the current phase. `npm run seed:check`
(or the nightly workflow's `catalogue-plan` artifact) shows live counts against these targets and how many of
each type to research this week, assuming 60% of what you research gets approved.

## Weekly focus

Rotate the research focus so the catalogue does not drift towards what is easiest to find (senior NGO
roles, grants for organisations):

| Day | Focus |
|---|---|
| Monday | Entry-level and graduate-trainee jobs |
| Tuesday | Health and education jobs |
| Wednesday | Jobs outside Kampala |
| Thursday | Trades, vocational jobs, training and short courses |
| Friday | Scholarships, fellowships, grants for individuals, internships |
| Saturday | Whatever the research plan or the coverage table shows furthest behind |

## Friday review (20 minutes)

1. **Net growth:** live listings now versus last Friday, by type. Behind target? Research more of that type.
2. **Pass rate:** approved divided by researched. Much lower than 60%? Read the run's `held.json` for the
   most common reason and adjust how you research.
3. **Coverage:** `npm run seed:check` shows matches for typical seekers. Any "LOW" group gets Saturday's focus.

## When you are away

Nothing breaks: expired listings still drop off, and pending listings wait in the queue. Live listings start
dropping after 14 days without a re-check, so for longer absences, re-check the *Re-check due* list before
you go, or name someone to cover the morning review.

## One-time setup

1. GitHub repository secrets: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. GitHub repository variable: `OPPSCOUT_CATALOGUE_PHASE` = `build`.
3. `npm run db:migrate` (once), so rolling listings can be stored.

How the pipeline's checks work is described in `PIPELINE.md`.
