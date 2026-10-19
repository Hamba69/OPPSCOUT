import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

loadEnvConfig(process.cwd());

const scanDate = "2026-10-16";
const defaultPath = "D:\\PROBOOK\\finwa\\OppScout_Uganda_Opportunity_Scan_2026-10-16.md";
const scanPath = process.argv.find((argument) => argument.endsWith(".md")) ?? defaultPath;
const apply = process.argv.includes("--apply");

export type Category = "job" | "internship" | "scholarship" | "fellowship" | "grant" | "training" | "consultancy";
export type Lead = {
  id: string;
  title: string;
  organization: string;
  location: string;
  audience: string;
  deadline: Date | null;
  sourceUrl: string;
  confidence: string;
  flags: string;
  category: Category;
};

const sectionCategories: Record<string, Category> = {
  "1. Jobs": "job",
  "2. Internships and traineeships": "internship",
  "3. Scholarships": "scholarship",
  "4. Fellowships": "fellowship",
  "5. Grants": "grant",
  "6. Trainings": "training",
  "7. Consultancies": "consultancy",
};

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(row: string[]): boolean {
  return row.length > 0 && row.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseDeadline(value: string): Date | null {
  const match = value.match(/^2026-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(`${value}T00:00:00+03:00`);
}

function parseTableRow(row: string[], category: Category, header: string[]): Lead | null {
  if (row.length < 8 || !/^([A-Z]{3})-\d{3}$/.test(row[0])) return null;
  const values = Object.fromEntries(header.map((name, index) => [name.toLowerCase(), row[index] ?? ""]));
  const organization = values.organisation ?? values.organization ?? values.funder ?? values.provider;
  const location = values.location ?? values["study location"] ?? values.format ?? "To confirm";
  const audience = values.audience ?? "confirm";
  const sourceUrl = values["seen at"];
  if (!values.title || !organization || !sourceUrl?.startsWith("https://")) return null;

  return {
    id: row[0],
    title: values.title,
    organization,
    location,
    audience,
    deadline: parseDeadline(values.deadline),
    sourceUrl,
    confidence: values.conf ?? "",
    flags: values.flags ?? "",
    category,
  };
}

export function parseScan(markdown: string): Lead[] {
  const lines = markdown.split(/\r?\n/);
  const leads: Lead[] = [];
  let category: Category | undefined;
  let header: string[] | undefined;

  for (const line of lines) {
    const heading = line.match(/^###\s+(.+)$/)?.[1] ?? line.match(/^##\s+(.+)$/)?.[1];
    if (heading) {
      category = sectionCategories[heading.split(/\s+\(/)[0]] ?? category;
      header = undefined;
      continue;
    }
    if (!category || !line.trim().startsWith("|")) continue;
    const row = cells(line);
    if (row[0]?.toLowerCase() === "id") {
      header = row;
      continue;
    }
    if (!header || isSeparatorRow(row)) continue;
    const lead = parseTableRow(row, category, header);
    if (lead) leads.push(lead);
  }
  return leads;
}

function statusFor(deadline: Date | null): "open" | "closing_soon" | "closed" {
  if (!deadline) return "open";
  const now = new Date(`${scanDate}T23:59:59+03:00`);
  if (deadline < new Date(`${scanDate}T00:00:00+03:00`)) return "closed";
  return deadline.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000 ? "closing_soon" : "open";
}

function organizationLinks(organization: string): string[] {
  const domain = organization.match(/\b([a-z0-9-]+\.(?:org|com|net|ac\.ug|go\.ug|ug))\b/i)?.[1];
  return domain ? [`https://${domain.toLowerCase()}`] : [];
}

function organizationRecord(lead: Lead, id: string) {
  const timestamp = new Date(`${scanDate}T00:00:00+03:00`).toISOString();
  return {
    id,
    name: lead.organization,
    sector: `${lead.category} opportunities`,
    officialLinks: organizationLinks(lead.organization),
    officialEmail: null,
    registrationProof: null,
    accountableContact: null,
    verificationStatus: "pending",
    dashboardUsers: [],
    subscriptionTier: "free",
    subscriptionStatus: "inactive",
    monetizationEnabled: false,
    promotedListingCredits: 0,
    promotionPolicy: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function opportunityRecord(lead: Lead, organizationId: string) {
  const flagged = lead.confidence === "X" || lead.flags.includes("X");
  return {
    id: randomUUID(),
    title: lead.title,
    organizationId,
    category: lead.category,
    description: `${lead.title} opportunity reported for ${lead.location}. Audience proposal: ${lead.audience}. The scan is an aggregator or third-party lead and requires official-source tracing before publication.`,
    eligibility: {
      programmeRules: [{ field: "audience", allowedValues: [lead.audience], label: "Proposed audience; confirm against the official source" }],
      additionalRequirements: ["Trace this lead to the employer or funder's official page before approval.", ...(lead.flags ? [lead.flags] : [])],
    },
    requiredSkills: [],
    preferredSkills: [],
    location: lead.location,
    workMode: "unknown",
    deadline: lead.deadline?.toISOString() ?? null,
    applicationMethod: "Do not submit sensitive information or pay a fee from this record. Wait for trust-desk confirmation of the official application route.",
    sourceUrl: lead.sourceUrl,
    verificationStatus: flagged ? "flagged" : "pending",
    source: "scraped",
    origin: "catalog",
    publicationDate: new Date(`${scanDate}T00:00:00+03:00`).toISOString(),
    checkedAt: new Date(`${scanDate}T00:00:00+03:00`).toISOString(),
    status: statusFor(lead.deadline),
    reviewChecklist: {
      sourceAuthentic: false,
      noInappropriateFees: false,
      noSensitiveDataAsk: false,
      deadlinePlausible: lead.deadline !== null,
      duplicateChecked: false,
    },
    reviewNotes: `Imported from OppScout Uganda Opportunity Scan ${scanDate}. Confidence ${lead.confidence || "not recorded"}. ${lead.flags || "No additional flags recorded."} Official source, eligibility, deadline, fee and duplicate checks are pending.`,
    reviewerId: null,
    reviewedAt: null,
  };
}

async function main(): Promise<void> {
  const leads = parseScan(readFileSync(scanPath, "utf8"));
  if (!leads.length) throw new Error(`No open lead rows found in ${scanPath}.`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server-side Supabase configuration is missing.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existingOrganizations, error: organizationsError } = await client.from("Organization").select("id,name");
  const { data: existingOpportunities, error: opportunitiesError } = await client.from("Opportunity").select("id,title,sourceUrl,organizationId");
  if (organizationsError || opportunitiesError) throw new Error(organizationsError?.message ?? opportunitiesError?.message);

  const organizationIds = new Map((existingOrganizations ?? []).map((organization) => [organization.name.trim().toLowerCase(), organization.id]));
  const organizations = [];
  const opportunities = [];
  const seen = new Set<string>();

  for (const lead of leads) {
    const organizationKey = lead.organization.trim().toLowerCase();
    let organizationId = organizationIds.get(organizationKey);
    if (!organizationId) {
      organizationId = randomUUID();
      organizationIds.set(organizationKey, organizationId);
      organizations.push(organizationRecord(lead, organizationId));
    }
    const duplicate = existingOpportunities?.some(
      (opportunity) =>
        (opportunity.sourceUrl === lead.sourceUrl && opportunity.title.trim().toLowerCase() === lead.title.trim().toLowerCase()) ||
        (opportunity.organizationId === organizationId && opportunity.title.trim().toLowerCase() === lead.title.trim().toLowerCase()),
    );
    const keyForRun = `${organizationId}/${lead.title.trim().toLowerCase()}`;
    if (!duplicate && !seen.has(keyForRun)) {
      seen.add(keyForRun);
      opportunities.push(opportunityRecord(lead, organizationId));
    }
  }

  const counts = opportunities.reduce<Record<string, number>>((countsByStatus, opportunity) => {
    const key = `${opportunity.verificationStatus}/${opportunity.status}`;
    countsByStatus[key] = (countsByStatus[key] ?? 0) + 1;
    return countsByStatus;
  }, {});
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", scanPath, leadsFound: leads.length, organizationsToInsert: organizations.length, opportunitiesToInsert: opportunities.length, counts }, null, 2));
  if (!apply) return;

  if (organizations.length) {
    const response = await client.from("Organization").insert(organizations);
    if (response.error) throw new Error(`Organization import: ${response.error.message}`);
  }
  if (opportunities.length) {
    const response = await client.from("Opportunity").insert(opportunities);
    if (response.error) throw new Error(`Opportunity import: ${response.error.message}`);
  }
  console.log(`Imported ${opportunities.length} Uganda scan leads as pending/flagged records.`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Uganda scan import failed.");
    process.exitCode = 1;
  });
}
