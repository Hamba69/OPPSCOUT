# Research guide: finding and recording opportunities

The catalogue is curated by one person, the catalogue owner, who researches listings, records them as
JSON, runs them through the pipeline and approves them in Admin > Review. This guide is how to research
and record a listing so it passes the pipeline first time and matches the right seekers.

The rule that matters most: **a short list of true records is worth more than a long list of guesses.**
If you cannot confirm something, put it in `unresolved`; the record is held and you can come back to it.

## 1. Where to look: source tiers

| Tier | What it is | What you may do with it |
|---|---|---|
| **A: official** | The funder's, employer's, university's or institution's own page (for example `chevening.org`, `jobs.au.int`, `careers.unesco.org`, a `.ac.ug` site) | This is the only kind of page a record may be verified against. |
| **B: aggregator or job board** | Opportunity Desk, ReliefWeb, LinkedIn, Indeed, BrighterMonday, Fuzu, scholarship lists, newsletters | **Discovery only.** Use it to find leads, then follow it to the official page (section 2). |
| **C: social or forwards** | Facebook, X, Telegram, WhatsApp, TikTok, blogs, YouTube | A lead at best. Never a source. If you cannot reach an official page, drop it. |

Aggregators are good at finding things and bad at getting them right. They carry wrong or stale
deadlines, recycle closed listings and sometimes host scams. Treat everything on them as unconfirmed.

## 2. Tracing a lead to its official page

1. Note the lead URL in `leads`.
2. Find the employer, funder or institution named in the listing. Go to **their own website**, not a
   link the aggregator gives you if it is on another aggregator or a shortener.
3. Find the page about this specific opportunity. It must be about this listing, not a homepage or
   a search page.
4. Read the facts on that page. Ignore what the aggregator said.
5. If the official page does not mention the opportunity, or contradicts the lead, **drop it**.
   If you cannot find the official page, drop it; do not put the aggregator URL in `sourceUrl`.

`sourceUrl` is the official page you read. `applicationUrl` is where a person actually applies, on the
provider's own site or its application system (a careers portal is fine). Never an aggregator.

An employer's own job board on a hiring system (for example `job-boards.greenhouse.io/oneacrefund/...` or
`jobs.lever.co/...`) is accepted as an official source when the address contains the employer's name. Set
`organizationOfficialDomain` to the organisation's real website, and make `sourceUrl` a page about this specific
listing, never a site's front page or a general search page. If a programme's pages live on a different domain from
its main site (for example an application portal), declare the domain the programme's own pages are on.

## 3. What to find

- Open to people in Uganda or to applicants from Uganda: jobs, internships, scholarships, fellowships,
  grants, training and consultancies. On-site abroad is fine for scholarships, fellowships, grants,
  training and internships.
- Aim for variety. Cover school leavers, undergraduates, final-year students, graduates, early and
  mid-career people, researchers, and people with diplomas or certificates and small businesses.
- **Enough time to apply.** Jobs, internships and consultancies must close at least 7 days from today
  (14 or more preferred); scholarships, fellowships, grants and training at least 14 days (30 or more
  preferred). Anything sooner is rejected by the pipeline. Rolling listings are welcome.
- Skip: opportunities with an upfront fee to a recruiter, any request for money or a bank or mobile
  money detail, requests for ID or passwords outside the official application, and grants only
  organisations (not individuals) can apply for. If a grant is for organisations, list it under
  `unresolved` as "applicant must be an organisation".

## 4. Filling in each record

Every field you can fill from the page, fill. Quote the page for the three claims that matter.

- `deadlineType`: `fixed` or `rolling`. For `fixed`, give the exact `deadline` with a timezone offset
  (`2027-01-12T12:00:00Z` or `2027-01-12T23:59:00+03:00`). If the page gives only a date, use
  `00:00` at the start of that date in the provider's timezone; this is the cautious choice. Do not mention
  the missing time in the description: seekers read "no closing time" as "no closing date". At most, write
  "Apply at least a day early to be safe." If you cannot tell which date is the deadline (several rounds,
  conflicting pages), put it in `unresolved`; do not choose one.
- **A missing closing time is not "unresolved".** If the page gives a date but no time or timezone, use the 00:00
  rule above and leave the missing time out of the description. Use `unresolved` only for a real conflict or
  a fact you cannot find.
- `deadlineQuote`: the sentence from the page that states the deadline (or says applications are rolling).
- `ugandanEligibility`:
  - `explicit`: the page names Uganda.
  - `region_includes_uganda`: the page says, for example, "African countries" or "Commonwealth countries" and Uganda is in it.
  - `open_to_all_nationalities`: no nationality restriction.
  - `unclear`: you cannot tell. The record is held.
  - `excluded`: Ugandans cannot apply. The record is held.
  `ugandanEligibilityQuote` must be a sentence copied word for word from the page, at least 15 characters; a label
  such as "open to all" is rejected. For `open_to_all_nationalities`, quote the eligibility sentence that shows who
  may apply (for example "Applicants of any nationality may apply"). If the page is silent about nationality, the
  value is `unclear`, not `open_to_all_nationalities`.
- `feeAssessment`: `none`; `disclosed_official` (the provider itself states a charge; say so in `feeNote`,
  for example "USD 20 application charge"); or `suspicious` (anything else). Set
  `asksSensitiveDataOffPlatform` to `true` if it asks for sensitive data outside the official application.
- `eligibility`: only what the page states.
  - `minimumEducation`: `secondary`, `certificate`, `diploma`, `bachelors`, `masters` or `phd`. Higher
    levels qualify automatically, so say the **lowest** level accepted. Use `educationLevels` only when
    higher levels do not qualify (for example "current undergraduates only").
  - `minimumAge` / `maximumAge`: the app tests age on the deadline date.
  - `programmeRules`: only `graduationStatus`, `location` or `language`. Use exactly these values for
    graduation status: `studying`, `first year`, `second year`, `third year`, `final year`, `graduated`,
    `graduate`, `graduated within 12 months`, `masters student`, `phd student`.
  - Everything else (nationality, years in a sector, organisation type, a research proposal, a degree
    classification) goes in `additionalRequirements` as a plain sentence. Do not invent a rule type.
- `description`: your own words, 80 to 4000 characters. What it is, who it is for, what it provides, what
  the application involves. No marketing copy and no claims the page does not support.
- `organizationOfficialDomain`: the organisation's own domain (`chevening.org`), not an aggregator's.
- `retrievedAt`: when you read the page, with timezone. It must be within 3 days of the run.

### Matching data: fill these on every record

Seekers are ranked by comparing their profile with these fields. A record without them still goes live,
but it ranks low for everyone and cannot explain why it fits. `npm run seed:run` warns about each gap.

- `requiredSkills` / `preferredSkills`: 2 to 8 short skill names the page asks for, in plain words
  ("bookkeeping", "patient care", "Excel", "electrical wiring", "lesson planning"). Required = the page says
  must/required; preferred = desirable/an advantage. For scholarships and grants, use the qualities they assess
  ("leadership", "research", "community engagement").
- `eligibility.minimumEducation`: the lowest level accepted. "Diploma or degree" is `diploma`.
- `eligibility.fieldsOfStudy`: only when the page names fields ("degree in accounting, finance or economics").
- `eligibility.minimumExperienceMonths`: "3 years of experience" is `36`. Use `0` when the page says no
  experience is needed or it is a graduate/entry-level programme.
- `location`: the town or district ("Gulu", "Mbarara"), not just "Uganda", when the page gives one.
- `workMode`: `onsite`, `hybrid` or `remote` whenever the page says; `unknown` only if it truly does not.

### How many and which kinds: `research-plan.json`

Each night the Catalogue maintenance workflow writes `research-plan.json` (download it from the run's
artifacts, or run `npm run seed:check` yourself). `candidatesThisWeek` says how many of each type to find
this week to reach and hold the targets. Fill the type furthest behind first.

### Coverage: what the catalogue needs most

The catalogue is short of these. Spend most of each batch on them, and note which seeker group each record serves:

1. Paid entry-level jobs and graduate trainee programmes (0 to 2 years of experience).
2. Certificate and diploma holders: technical/vocational (TVET) jobs and training, nursing and allied
   health, teaching, artisans and trades.
3. Locations outside Kampala: district local governments, regional referral hospitals, upcountry NGOs.
4. Agriculture and agribusiness, health, education and trades.
5. Short courses and training with a certificate, open to secondary-school leavers.

Good official (Tier A) places to look for these: the Public Service, Health Service and Education Service
Commissions and district service commissions; UN agencies' and large NGOs' own career sites; banks,
telecoms and manufacturers' careers pages; TVET institutions and universities; and government or
foundation scholarship schemes. Senior roles and organisation-only grants are lower priority: the
catalogue already leans that way.

## 5. When you are unsure

Add a short sentence to `unresolved` for each thing you could not establish ("exact deadline time not
stated", "two conflicting deadlines on the page", "could not find the official application link"). The
record is held and a person decides. This is the right outcome; do not hide uncertainty to get a record through.

## 6. Saving your records

Save one JSON array per research session as `imports/seeding-runs/inbox/<YYYY-MM-DD>.json`, at most 25
records per file (add `-2`, `-3` for more). The exact shape is `docs/catalogue/candidate.example.json`; the
rules are enforced by `src/services/seeding/candidate.ts`, and unknown keys are rejected. Then follow the
daily routine in `docs/catalogue/ROUTINE.md` to check and stage the file.

## 7. Re-checking live listings

Admin > Catalogue fixes lists live listings close to the 14-day re-check limit. Open each source:
- Still open with the same deadline: press **I re-checked it today**.
- The deadline moved or a new cycle opened: record a fresh entry with the same `sourceUrl` and run it
  through the pipeline. It returns to the review queue for approval.
- Closed or gone: press **Remove**. Anything left unchecked is removed automatically after 14 days.

## 8. Checklist before you run the pipeline

- Every `sourceUrl` is an official page about that specific listing, read today or yesterday.
- Every deadline has a timezone and a quote, and meets the lead time in section 3 (or the record is `rolling`).
- Every Uganda claim has a word-for-word quote.
- Every record has skills, minimum education, work mode and (for vacancies) experience months.
- Nothing is guessed; anything uncertain is in `unresolved`.
- No record has an aggregator, social media or homepage as its source or application link.
