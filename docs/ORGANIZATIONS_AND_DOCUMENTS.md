# Organizations and private documents

## Status model

Organization accounts start as `unverified`, move to `pending` during review, and are either `verified` or `flagged` by an administrator. Only verified organizations can publish listings or view matched candidates.

## Consent and candidate access

Seekers opt in to organization visibility. Sharing requires a recorded date of birth proving the seeker is at least 18. Organizations receive only candidates with an above-threshold match on one of their open, verified listings. Date of birth, activity, saved items, other matches, and contact details are excluded unless contact sharing is separately enabled.

Every candidate detail view, card view, and document download is recorded in `SeekerAccessLog`. Withdrawal of consent is checked at request time.

## Upload flow

Research papers are limited to PDF, DOCX, and ODT and 5 MB per file, with a configurable per-seeker count. The browser receives a signed Supabase Storage upload URL so the file bytes bypass a Vercel route handler and its 4.5 MB request limit. Completion re-reads the private object, checks size and magic bytes, hashes it, and marks the row `ready`. Downloads use a separate 60-second signed URL and are never public.

Files are provided by seekers and are not scanned. Open them with appropriate care. Supabase free-tier storage is limited to 1 GB; monitor usage and upgrade storage before sustained growth.

## Retention and configuration

Pending uploads should be swept after one hour along with orphaned storage objects. Configure `PROFILE_DOCS_MAX_PER_USER`, `RATE_LIMIT_ORG_CANDIDATE_VIEWS_PER_DAY`, `RATE_LIMIT_ORG_DOWNLOADS_PER_DAY`, `RATE_LIMIT_ORG_INVITES_PER_DAY`, and `MATCH_RELEVANCE_THRESHOLD`.

## Screens

Organizations use `/organizations` for public information, `/organizations/signup` and `/organizations/login` for account entry, `/dashboard` for listings, `/dashboard/candidates` for consented matched seekers, `/dashboard/analytics` for aggregate listing activity, and `/dashboard/organization` for organization details. Seekers manage profile sharing from `/profile` and can review access history in Settings.
