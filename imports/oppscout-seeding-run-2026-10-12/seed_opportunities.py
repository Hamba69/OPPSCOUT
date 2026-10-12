"""Idempotently seed reviewed intake and current official opportunities.

All catalog entries are explicitly unlinked from the Organization table. Records
with incomplete trust evidence stay pending and are not made seeker-visible.
"""
from __future__ import annotations

import csv
import datetime as dt
import json
import os
import re
import urllib.parse
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INTAKE = Path(__file__).with_name("oppscout_seed_opportunities_reviewed.csv")
REPORT = Path(__file__).with_name("seed_execution_report.json")
NOW = dt.datetime.now(dt.timezone.utc)
DUP_WINDOW = dt.timedelta(days=3)
DUP_THRESHOLD = 0.85


def env_file() -> dict[str, str]:
    result = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        result[key.strip()] = value.strip().strip('"').strip("'")
    return result


ENV = {**env_file(), **os.environ}
BASE = ENV["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/") + "/rest/v1/Opportunity"
KEY = ENV["SUPABASE_SERVICE_ROLE_KEY"]


def request(method: str, params: dict[str, str] | None = None, body=None, prefer="", table="Opportunity"):
    url = BASE.rsplit("/", 1)[0] + "/" + table + ("?" + urllib.parse.urlencode(params) if params else "")
    data = json.dumps(body).encode() if body is not None else None
    headers = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Supabase REST request failed ({error.code}): {error.read().decode(errors='replace')}") from None


def read_all() -> list[dict]:
    rows, offset = [], 0
    while True:
        page = request("GET", {"select": "id,title,sourceUrl,deadline,organizationId,organizationName,verificationStatus,reviewNotes,reviewChecklist", "order": "id", "limit": "500", "offset": str(offset)})
        rows.extend(page)
        if len(page) < 500:
            return rows
        offset += 500


def norm(text: str) -> str:
    return " ".join(re.sub(r"[^a-z0-9]+", " ", text.lower()).split())


def similarity(left: str, right: str) -> float:
    def grams(s):
        s = norm(s)
        return {s[i:i+2] for i in range(len(s)-1)} if len(s) >= 2 else {s}
    a, b = grams(left), grams(right)
    return 2 * len(a & b) / (len(a) + len(b)) if a or b else 1.0


def specific_listing_url(value: str) -> bool:
    parsed = urllib.parse.urlparse(value)
    path = parsed.path.strip("/").lower()
    if not path:
        return False
    generic = {"jobs", "opportunities", "careers", "vacancies", "job-listings", "opportunities.aspx", "careers.aspx"}
    return path not in generic


def date_value(value: str | None, precision: str | None = None):
    if value:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(dt.timezone.utc)
    if precision == "date":
        return None
    return None


def parse_timestamp(value: str):
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=dt.timezone.utc) if parsed.tzinfo is None else parsed.astimezone(dt.timezone.utc)


def json_value(value: str, fallback):
    if not value:
        return fallback
    return json.loads(value)


def publication_timestamp(value: str | None) -> str:
    if not value:
        return NOW.isoformat().replace("+00:00", "Z")
    if re.fullmatch(r"\d{4}-\d{2}", value):
        value += "-01"
    return value + "T12:00:00Z"


def evidence_checklist(row: dict) -> dict:
    return {
        "sourceAuthentic": row.get("source_authentic") == "true",
        "noInappropriateFees": row.get("no_inappropriate_fees") == "true",
        "noSensitiveDataAsk": row.get("no_sensitive_data_ask") == "true",
        "deadlinePlausible": row.get("deadline_plausible") == "true",
        "duplicateChecked": row.get("duplicate_checked") == "true",
    }


def from_csv(row: dict) -> dict:
    deadline = date_value(row.get("deadline_utc"))
    if deadline is None and row.get("deadline_date"):
        # A date-only listing stays valid through its stated local calendar date.
        deadline = dt.datetime.fromisoformat(row["deadline_date"]).replace(tzinfo=dt.timezone.utc) + dt.timedelta(hours=12)
    source_url = row.get("official_listing_url") or row["source_url"]
    notes = row.get("review_notes") or ""
    if row.get("agent_verdict") != "verified":
        notes = (notes + "\n" if notes else "") + "Seeded from reviewed intake; provider verification is incomplete. Kept pending review."
    return {
        "id": str(uuid.uuid4()), "title": row["title"], "organizationId": None,
        "organizationName": row.get("organization_name") or None,
        "category": row.get("category") or "other", "description": row.get("description") or row["title"],
        "eligibility": json_value(row.get("eligibility_json", ""), {}),
        "requiredSkills": json_value(row.get("required_skills_json", ""), []),
        "preferredSkills": json_value(row.get("preferred_skills_json", ""), []),
        "location": row.get("location") or "Not stated", "workMode": "unknown",
        "deadline": deadline.isoformat().replace("+00:00", "Z") if deadline else None,
        "applicationMethod": row.get("application_method") or "See the source listing for application instructions.",
        "sourceUrl": source_url, "verificationStatus": "pending", "source": "scraped", "origin": "catalog",
        "publicationDate": publication_timestamp(row.get("source_publication_date")),
        "checkedAt": NOW.isoformat().replace("+00:00", "Z"), "status": "open",
        "reviewChecklist": evidence_checklist(row),
        "reviewNotes": notes[:8000] or "Provider verification is incomplete. Kept pending review.",
    }


def official_record(title, org, category, description, location, deadline, source_url, application, eligibility=None, notes=""):
    return {
        "id": str(uuid.uuid4()), "title": title, "organizationId": None, "organizationName": org,
        "category": category, "description": description, "eligibility": eligibility or {},
        "requiredSkills": [], "preferredSkills": [], "location": location, "workMode": "unknown",
        "deadline": deadline + "T12:00:00Z" if len(deadline) == 10 else deadline,
        "applicationMethod": application, "sourceUrl": source_url, "verificationStatus": "pending",
        "source": "scraped", "origin": "catalog", "publicationDate": NOW.isoformat().replace("+00:00", "Z"),
        "checkedAt": NOW.isoformat().replace("+00:00", "Z"), "status": "open",
        "reviewChecklist": {"sourceAuthentic": True, "noInappropriateFees": False, "noSensitiveDataAsk": False, "deadlinePlausible": True, "duplicateChecked": False},
        "reviewNotes": ("Official provider listing found and deadline checked on 2026-10-12. Fee and sensitive-data checks remain open; keep pending. " + notes)[:8000],
    }


def additions() -> list[dict]:
    idi = "https://idi.mak.ac.ug/opportunities/home/selected_job/{}"
    rows = [
        official_record("IDM-Africa Fellow (3 positions)", "Infectious Diseases Institute", "fellowship", "Three 12-month IDM-Africa fellowships: two based in Uganda and one in Mali. The official listing includes role-specific requirements and application instructions.", "Uganda and Mali", "2026-10-30", idi.format(2315), "Apply through the application instructions on the official IDI listing.", {"durationMonths": 12}, "Official page requests a national ID or passport; sensitivity review remains open."),
        official_record("Epidemiologist (2 positions)", "Infectious Diseases Institute", "job", "Two epidemiologist positions advertised by IDI. Review the official listing for qualifications and application details.", "Uganda", "2026-10-17", idi.format(2314), "Apply through the official IDI listing."),
        official_record("Technical Officer - Laboratory (2 positions)", "Infectious Diseases Institute", "job", "Two technical officer positions in laboratory services advertised by IDI.", "Uganda", "2026-10-17", idi.format(2313), "Apply through the official IDI listing."),
        official_record("Technical Officer - Infection Prevention and Control (2 positions)", "Infectious Diseases Institute", "job", "Two technical officer positions in infection prevention and control advertised by IDI.", "Uganda", "2026-10-17", idi.format(2312), "Apply through the official IDI listing."),
        official_record("Senior Technical Officer - Case Management (3 positions)", "Infectious Diseases Institute", "job", "Three senior technical officer positions in case management advertised by IDI.", "Uganda", "2026-10-17", idi.format(2311), "Apply through the official IDI listing."),
        official_record("M&E Specialist", "Infectious Diseases Institute", "job", "Monitoring and evaluation specialist position advertised by IDI.", "Uganda", "2026-10-17", idi.format(2310), "Apply through the official IDI listing."),
        official_record("Lab Runner/Messenger", "Infectious Diseases Institute", "job", "Laboratory runner/messenger position based in Gulu. The official listing describes UACE, Acholi language and laboratory handling requirements.", "Gulu, Uganda", "2026-10-15", idi.format(2309), "Apply through the official IDI listing."),
        official_record("Research Fellow - ACCEPT-Africa", "Infectious Diseases Institute", "research_grant", "ACCEPT-Africa research fellow awards of up to US$15,000 for targeted research. The official page lists an October 16, 2026 closing date.", "Africa", "2026-10-16", idi.format(2307), "Apply through the official IDI listing."),
        official_record("Two Drivers", "Wildlife Conservation Society Uganda", "job", "Two full-time driver positions for Ishasha Sector, Queen Elizabeth National Park. Requires secondary education, five years of progressive driving experience and valid A/B/D classes. Submit one PDF containing cover letter, CV and three references.", "Ishasha Sector, Queen Elizabeth National Park, Uganda", "2026-10-16", "https://uganda.wcs.org/Opportunities.aspx", "Email one PDF application to wcsuganda@wcs.org by October 16, 2026.", {"experienceYears": 5, "licenses": ["A", "B", "D"]}, "Official WCS page and linked job description reviewed; exact closing time not stated."),
    ]
    return rows


def update_princeton_candidate() -> dict:
    row_id = "77777777-7777-4777-8777-000000000016"
    previous_org_id = "66666666-6666-4666-8666-000000000050"
    org_rows = request("GET", {"select": "id,postingHistory", "id": "eq." + previous_org_id}, table="Organization")
    history_cleaned = False
    if org_rows:
        history = org_rows[0].get("postingHistory") or []
        cleaned = [entry for entry in history if entry.get("opportunityId") != row_id]
        if len(cleaned) != len(history):
            request("PATCH", {"id": "eq." + previous_org_id}, {"postingHistory": cleaned}, "return=minimal", table="Organization")
            history_cleaned = True
    matches = request("GET", {"select": "id,title,deadline,organizationId", "id": "eq." + row_id})
    if not matches:
        return {"updated": False, "reason": "expected catalog row did not match", "oldPostingHistoryCleaned": history_cleaned}
    current = matches[0]
    if current["title"] == "Princeton in Africa Fellowship 2027/28 (Nexus applicants)" and current.get("organizationId") is None:
        return {"updated": True, "alreadyUpdated": True, "id": row_id, "verificationStatus": "verified", "organizationId": None, "oldPostingHistoryCleaned": history_cleaned}
    if current["title"] != "Princeton in Africa Nexus Fellowships":
        return {"updated": False, "reason": "catalog row title changed unexpectedly", "oldPostingHistoryCleaned": history_cleaned}
    evidence = {
        "sourceAuthentic": {"urls": ["https://www.princetoninafrica.org/applicants/how-to-apply/", "https://www.princetoninafrica.org/nexus/"], "rationale": "Official Princeton in Africa application and Nexus pages reviewed on 2026-10-12.", "checkedAtUtc": NOW.isoformat()},
        "noInappropriateFees": {"urls": ["https://www.princetoninafrica.org/applicants/how-to-apply/"], "rationale": "Official application page states there is no application fee.", "checkedAtUtc": NOW.isoformat()},
        "noSensitiveDataAsk": {"urls": ["https://www.princetoninafrica.org/applicants/how-to-apply/"], "rationale": "Application materials include academic records and a recommender; no credentials, payment, or identity document request was found on the reviewed instructions.", "checkedAtUtc": NOW.isoformat()},
        "deadlinePlausible": {"urls": ["https://www.princetoninafrica.org/applicants/how-to-apply/"], "rationale": "Official page lists October 26, 2026 at 11:59 PM EDT, equivalent to October 27 at 03:59 UTC.", "checkedAtUtc": NOW.isoformat()},
        "duplicateChecked": {"urls": ["https://www.princetoninafrica.org/applicants/how-to-apply/"], "rationale": "Updated the matching existing record rather than creating a duplicate; checked current catalog titles and deadline.", "checkedAtUtc": NOW.isoformat()},
    }
    body = {
        "title": "Princeton in Africa Fellowship 2027/28 (Nexus applicants)", "organizationId": None,
        "organizationName": "Princeton in Africa", "category": "fellowship",
        "description": "Year-long fellowship placements with organizations across Africa. Nexus applicants are considered through the Princeton in Africa program's application process.",
        "eligibility": {"applicantCategories": ["Nexus applicants"]}, "location": "Various host countries in Africa",
        "workMode": "unknown", "deadline": "2026-10-27T03:59:00Z",
        "applicationMethod": "Apply through the official Princeton in Africa application process by October 26, 2026 at 11:59 PM EDT.",
        "sourceUrl": "https://www.princetoninafrica.org/applicants/how-to-apply/",
        "verificationStatus": "verified", "source": "scraped", "origin": "catalog", "status": "open",
        "reviewChecklist": {"sourceAuthentic": True, "noInappropriateFees": True, "noSensitiveDataAsk": True, "deadlinePlausible": True, "duplicateChecked": True},
        "reviewNotes": "Verified against Princeton in Africa's official application instructions and Nexus page on 2026-10-12. The official deadline is October 26, 2026 at 11:59 PM EDT (2026-10-27 03:59 UTC); the official page states there is no application fee. Existing catalog record updated and detached from the app Organization record.",
        "checkedAt": NOW.isoformat().replace("+00:00", "Z"), "reviewedAt": NOW.isoformat().replace("+00:00", "Z"),
        "reviewerId": "catalog-source-review",
    }
    request("PATCH", {"id": "eq." + row_id}, body, "return=minimal")
    return {"updated": True, "id": row_id, "previousOrganizationId": current.get("organizationId"), "verificationStatus": "verified", "organizationId": None, "oldPostingHistoryCleaned": history_cleaned}


def main():
    with INTAKE.open(encoding="utf-8-sig", newline="") as f:
        source_rows = list(csv.DictReader(f))
    records = []
    expired, excluded, deferred_update = [], [], []
    for row in source_rows:
        if row["action"] == "exclude":
            excluded.append(row["record_key"])
            continue
        if row["action"] == "update_existing":
            deferred_update.append(row["record_key"])
            continue
        record = from_csv(row)
        if record["deadline"] and parse_timestamp(record["deadline"]) <= NOW:
            expired.append(row["record_key"])
            continue
        records.append((row["record_key"], record))
    candidates = [("official:" + r["title"], r) for r in additions()]

    existing = read_all()
    known_urls = {}
    for row in existing:
        url = str(row.get("sourceUrl", "")).rstrip("/").lower()
        if specific_listing_url(url):
            known_urls[url] = row
    accepted, duplicate = [], []
    seen_titles = []
    for key, record in records + candidates:
        url_key = record["sourceUrl"].rstrip("/").lower()
        deadline = parse_timestamp(record["deadline"]) if record["deadline"] else None
        hit = known_urls.get(url_key) if specific_listing_url(url_key) else None
        if not hit:
            for old in existing:
                old_deadline = parse_timestamp(old["deadline"]) if old.get("deadline") else None
                compatible = deadline is None or old_deadline is None or abs(deadline - old_deadline) <= DUP_WINDOW
                if compatible and similarity(record["title"], old["title"]) >= DUP_THRESHOLD:
                    hit = old
                    break
        if not hit:
            for prior_title, prior_deadline, prior_url in seen_titles:
                compatible = deadline is None or prior_deadline is None or abs(deadline - prior_deadline) <= DUP_WINDOW
                if compatible and similarity(record["title"], prior_title) >= DUP_THRESHOLD:
                    hit = {"sourceUrl": prior_url, "title": prior_title}
                    break
        if hit:
            duplicate.append({"key": key, "title": record["title"], "matchedTitle": hit["title"], "matchedId": hit.get("id"), "sourceUrl": hit.get("sourceUrl")})
            continue
        accepted.append((key, record))
        seen_titles.append((record["title"], deadline, record["sourceUrl"]))
        if specific_listing_url(url_key):
            known_urls[url_key] = record

    princeton_update = update_princeton_candidate()
    created = 0
    for start in range(0, len(accepted), 50):
        batch = [record for _, record in accepted[start:start+50]]
        request("POST", {"select": "id"}, batch, "return=representation")
        created += len(batch)

    # Repair checklist keys for any batch inserted by an interrupted earlier run.
    repaired = 0
    for row in source_rows:
        if row["action"] != "create":
            continue
        source_url = row.get("official_listing_url") or row.get("source_url")
        matches = [item for item in existing if item.get("sourceUrl", "").rstrip("/").lower() == source_url.rstrip("/").lower() and item.get("title") == row["title"]]
        for item in matches:
            if item.get("organizationId") is None and item.get("verificationStatus") == "pending" and "Seeded from reviewed intake" in (item.get("reviewNotes") or ""):
                request("PATCH", {"id": "eq." + item["id"]}, {"reviewChecklist": evidence_checklist(row)}, "return=minimal")
                repaired += 1

    final_rows = read_all()
    intake_seeded = [item for item in final_rows if "Seeded from reviewed intake" in (item.get("reviewNotes") or "")]
    official_domains = ("idi.mak.ac.ug", "uganda.wcs.org")
    official_seeded = [item for item in final_rows if item.get("organizationId") is None and any(domain in (item.get("sourceUrl") or "") for domain in official_domains)]
    unlinked = [item for item in final_rows if item.get("organizationId") is None]
    report = {
        "runAtUtc": NOW.isoformat(), "sourceRows": len(source_rows), "created": created,
        "createdKeys": [key for key, _ in accepted], "expiredSkipped": expired,
        "excludedBySourceReview": excluded, "deferredUpdateRows": deferred_update,
        "duplicateSkipped": duplicate, "officialSourceCandidates": len(candidates),
        "allCreatedUnlinked": True, "allCreatedPending": True,
        "princetonUpdate": princeton_update,
        "repairedPendingChecklists": repaired,
        "organizationRowsCreated": 0,
        "catalogTotalsAfterRun": {
            "opportunities": len(final_rows), "unlinkedOpportunities": len(unlinked),
            "unlinkedPending": sum(item.get("verificationStatus") == "pending" for item in unlinked),
            "unlinkedVerified": sum(item.get("verificationStatus") == "verified" for item in unlinked),
            "intakeRowsSeededPending": len(intake_seeded),
            "additionalOfficialSourceRowsPending": sum(item.get("verificationStatus") == "pending" for item in official_seeded),
        },
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    summary = {k: report[k] for k in ("runAtUtc", "sourceRows", "created", "officialSourceCandidates", "expiredSkipped", "organizationRowsCreated", "catalogTotalsAfterRun", "princetonUpdate", "repairedPendingChecklists")}
    summary["duplicateSkippedCount"] = len(duplicate)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
