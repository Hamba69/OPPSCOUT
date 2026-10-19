import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type SnapshotOpportunity = {
  title: string;
  category: string;
  organizationName?: string | null;
  organizationId?: string | null;
  location: string;
  status: string;
  verificationStatus: string;
  source: string;
  sourceUrl: string;
  deadline?: string | null;
};

type Snapshot = {
  capturedAt: string;
  total: number;
  opportunities: SnapshotOpportunity[];
};

const snapshot = JSON.parse(
  readFileSync(resolve(process.cwd(), "docs/audits/catalog-snapshot.json"), "utf8"),
) as Snapshot;
const opportunities = snapshot.opportunities;
const count = <T>(items: T[]): Map<T, number> => {
  const result = new Map<T, number>();
  for (const item of items) result.set(item, (result.get(item) ?? 0) + 1);
  return result;
};
const printMap = <T>(label: string, values: Map<T, number>): void => {
  console.log(`${label}: ${JSON.stringify(Object.fromEntries(values))}`);
};
const host = (value: string): string => new URL(value).hostname.replace(/^www\./, "");
const ugandaLocation = /uganda|kampala|jinja|gulu|entebbe|mbarara|mukono|wakiso|lira|arua/i;
const open = opportunities.filter((item) => item.status === "open");
const active = opportunities.filter((item) => item.status === "open" || item.status === "closing_soon");
const verifiedOpen = opportunities.filter((item) => item.verificationStatus === "verified" && item.status === "open");
const uganda = opportunities.filter((item) => ugandaLocation.test(item.location));
const pendingUgandaAllStatuses = opportunities.filter((item) => item.verificationStatus === "pending" && ugandaLocation.test(item.location));
const pendingActiveUganda = opportunities.filter(
  (item) => item.verificationStatus === "pending" && active.includes(item) && ugandaLocation.test(item.location),
);
const operationalActive = active.filter((item) => item.verificationStatus !== "flagged");

console.log(`capturedAt: ${snapshot.capturedAt}`);
console.log(`total: ${opportunities.length}`);
printMap("state", count(opportunities.map((item) => `${item.verificationStatus}/${item.status}`)));
printMap("category", count(opportunities.map((item) => item.category)));
printMap("source", count(opportunities.map((item) => item.source)));
console.log(`open: ${open.length}`);
console.log(`active: ${active.length}`);
console.log(`operationalOpenExcludingFlagged: ${operationalActive.length}`);
console.log(`verifiedOpen: ${verifiedOpen.length}`);
printMap("verifiedOpenCategories", count(verifiedOpen.map((item) => item.category)));
console.log(`ugandaMatched: ${uganda.length}`);
console.log(`pendingUgandaAllStatuses: ${pendingUgandaAllStatuses.length}`);
console.log(`pendingActiveUganda: ${pendingActiveUganda.length}`);
console.log(`pendingActiveUgandaJobs: ${pendingActiveUganda.filter((item) => item.category.toLowerCase() === "job").length}`);
printMap("pendingActiveUgandaHosts", count(pendingActiveUganda.map((item) => host(item.sourceUrl))));
console.log(`pendingActiveUgandaOrganizations: ${new Set(pendingActiveUganda.map((item) => item.organizationName ?? item.organizationId ?? "")).size}`);
printMap("openHosts", count(open.map((item) => host(item.sourceUrl))));
printMap("operationalActiveHosts", count(operationalActive.map((item) => host(item.sourceUrl))));
console.log(`advanceAfricaOperationalActive: ${operationalActive.filter((item) => host(item.sourceUrl) === "advance-africa.com").length}`);
console.log(`advanceAfricaOpen: ${open.filter((item) => host(item.sourceUrl) === "advance-africa.com").length}`);
const organizations = opportunities.map((item) => item.organizationName ?? item.organizationId ?? "");
console.log(`distinctOrganizationsExact: ${new Set(organizations).size}`);
console.log(`largestOrganizationExact: ${Math.max(...count(organizations).values())}`);
console.log(`grants: ${opportunities.filter((item) => item.category === "grant").length}`);
for (const phrase of ["Chevening", "Commonwealth", "Digital Impact Manager"]) {
  console.log(`${phrase}: ${JSON.stringify(opportunities.filter((item) => item.title.includes(phrase)).map((item) => ({
    title: item.title,
    status: item.status,
    verificationStatus: item.verificationStatus,
    deadline: item.deadline ?? null,
  })))}`);
}
const nonUgandaVerifiedActive = opportunities.filter(
  (item) => item.verificationStatus === "verified" && active.includes(item) && !ugandaLocation.test(item.location),
);
console.log(`verifiedActiveNonUganda: ${nonUgandaVerifiedActive.length}`);
const reportReference = new Date("2026-10-18T12:00:00+03:00").getTime();
console.log(`verifiedActiveNonUgandaWithNullOrFutureDeadlineAtReportDate: ${nonUgandaVerifiedActive.filter((item) => !item.deadline || Date.parse(item.deadline) > reportReference).length}`);
console.log(`verifiedActiveNonUgandaTitles: ${JSON.stringify(nonUgandaVerifiedActive.map((item) => item.title))}`);

if (opportunities.length !== snapshot.total) throw new Error("Snapshot total does not match opportunity rows.");
if (new Set(organizations).size !== 79) throw new Error("Distinct organization count changed from the recorded baseline.");
