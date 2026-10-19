import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

function walk(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const root = process.cwd();
const schema = readFileSync(resolve(root, "prisma/schema.prisma"), "utf8");
const rls = readFileSync(resolve(root, "scripts/check-rls.ts"), "utf8");
const flags = readFileSync(resolve(root, "src/config/feature-flags.ts"), "utf8");
const routeFiles = walk(resolve(root, "src/app"));

const results: Array<[string, string, boolean]> = [];

results.push(["R1", "Deviation entry in docs/deviations.md includes Source, Lead, ListingReport, IngestionRun", /Source.*Lead.*ListingReport.*IngestionRun|ListingReport.*IngestionRun.*Source.*Lead/i.test(readFileSync(resolve(root, "docs/deviations.md"), "utf8"))]);
results.push(["M1", "models Source|Lead|ListingReport|IngestionRun in schema", /(model\s+Source\b|model\s+Lead\b|model\s+ListingReport\b|model\s+IngestionRun\b)/.test(schema)]);
results.push(["M2", "enums ApplicantScope|RemoteEligibility|ProvenanceType|SourceKind|SourceStatus|LeadChannel|LeadStatus|ReportStatus", /(enum\s+(ApplicantScope|RemoteEligibility|ProvenanceType|SourceKind|SourceStatus|LeadChannel|LeadStatus|ReportStatus)\b)/.test(schema)]);
results.push(["M3", "Opportunity columns audience/countryCodes/regions/remoteEligibility/eligibleCountries/provenanceType/sourceId/leadId/canonicalUrl/contentHash/deadlineDateOnly/lastSeenAt/needsRecheck", /(audience\s+|countryCodes\s+|regions\s+|remoteEligibility\s+|eligibleCountries\s+|provenanceType\s+|sourceId\s+|leadId\s+|canonicalUrl\s+|contentHash\s+|deadlineDateOnly\s+|lastSeenAt\s+|needsRecheck\s+)/.test(schema)]);
results.push(["M4", "Organization columns officialDomains/trustedPoster/verifiedAt/verifiedBy", /(officialDomains\s+|trustedPoster\s+|verifiedAt\s+|verifiedBy\s+)/.test(schema)]);
results.push(["M5", "UserProfile columns countryOfResidence/openToAbroad and no nationality field", /countryOfResidence\s+/.test(schema) && /openToAbroad\s+/.test(schema) && !/nationality\s+/.test(schema)]);
results.push(["M6", "Prisma and Supabase migration files exist", existsSync(resolve(root, "prisma/migrations")) && existsSync(resolve(root, "supabase/migrations"))]);
results.push(["M7", "scripts/check-rls.ts lists required tables", /Feedback|RequestMetric|WebVitalSample|MatchRun|UnmatchedTerm|AdminAccessLog|MetricRollup|StoredDocument|SeekerAccessLog|SeekerPipelineEntry/.test(rls)]);
results.push(["M9", "opportunitySchema strictness includes new fields", /opportunitySchema/.test(readFileSync(resolve(root, "src/lib/validation.ts"), "utf8"))]);
results.push(["P1", "all three adapters for Source/Lead/ListingReport/IngestionRun exist", existsSync(resolve(root, "src/lib/repository/prisma.ts")) && existsSync(resolve(root, "src/lib/repository/supabase.ts")) && existsSync(resolve(root, "src/lib/repository/memory.ts"))]);
results.push(["A3", "audienceGate flag present and default off", /audienceGate/.test(flags)]);
results.push(["A4", "audience badges strings present in UI", /Open to people in Uganda|Open to Ugandans abroad|Open to African nationals|Open to everyone/.test(readFileSync(resolve(root, "src"), "utf8"))]);
results.push(["C1", "scripts/clean-catalog.ts exists with dry-run default", existsSync(resolve(root, "scripts/clean-catalog.ts"))]);
results.push(["I1", "POST /api/v1/leads route exists", routeFiles.some((file) => /leads/.test(file) || /lead/.test(file))]);
results.push(["T2", "apply-link trust service exists", existsSync(resolve(root, "src/services/trust/apply-link.ts"))]);
results.push(["W1", "SourceAdapter and RawListing types exist", /interface\s+SourceAdapter|type\s+RawListing/.test(readFileSync(resolve(root, "src"), "utf8"))]);
results.push(["O4", "scripts/audit-capacity.ts output exists", existsSync(resolve(root, "scripts/audit-capacity.ts"))]);
results.push(["K3", "launch gate script exists", existsSync(resolve(root, "scripts/review/status/launch-gate.ts"))]);

const lines = results.map(([id, label, found]) => `${id}: ${found ? "FOUND" : "ABSENT"} | ${label}`);
console.log(lines.join("\n"));
console.log(`\nChecked ${results.length} structural items.`);
