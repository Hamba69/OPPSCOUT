import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type SnapshotOpportunity = {
  id: string;
  title: string;
  organizationId?: string | null;
  organizationName?: string | null;
  category: string;
  location: string;
  deadline?: string | null;
  sourceUrl: string;
  status: string;
  verificationStatus: string;
};

type Snapshot = {
  capturedAt: string;
  opportunities: SnapshotOpportunity[];
};

const snapshot = JSON.parse(
  readFileSync(resolve(process.cwd(), "docs/audits/catalog-snapshot.json"), "utf8"),
) as Snapshot;
const ugandaLocation = /uganda|kampala|jinja|gulu|entebbe|mbarara|mukono|wakiso|lira|arua/i;
const rows = snapshot.opportunities.filter(
  (item) =>
    item.verificationStatus === "pending" &&
    (item.status === "open" || item.status === "closing_soon") &&
    ugandaLocation.test(item.location),
);
const fields = [
  "snapshotCapturedAt",
  "id",
  "title",
  "organizationName",
  "organizationId",
  "category",
  "location",
  "status",
  "verificationStatus",
  "deadline",
  "sourceUrl",
  "traceStatus",
  "reviewer",
  "evidenceNote",
] as const;
const csvCell = (value: string | null | undefined): string => `"${(value ?? "").replace(/"/g, '""')}"`;
const csv = [
  fields.join(","),
  ...rows.map((item) =>
    [
      snapshot.capturedAt,
      item.id,
      item.title,
      item.organizationName,
      item.organizationId,
      item.category,
      item.location,
      item.status,
      item.verificationStatus,
      item.deadline,
      item.sourceUrl,
      "not_started",
      "",
      "",
    ]
      .map(csvCell)
      .join(","),
  ),
  "",
].join("\n");

writeFileSync(resolve(process.cwd(), "docs/review/evidence/pending-uganda.csv"), csv);
console.log(`snapshotCapturedAt: ${snapshot.capturedAt}`);
console.log(`pendingActiveUgandaRows: ${rows.length}`);
console.log("networkRequests: none");
console.log("worksheet: docs/review/evidence/pending-uganda.csv");
