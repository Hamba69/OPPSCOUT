import {
  OpportunitySource,
  OpportunityStatus,
  Prisma,
  PrismaClient,
  VerificationStatus,
  WorkMode,
} from "@prisma/client";

import type { Opportunity } from "../../src/core/entities/domain";
import {
  getDiscoveredOpportunities,
  getDiscoveredOrganizations,
  SEED_SNAPSHOT_AT,
} from "../../src/data/discovered-catalog";

// Drop-in companion to scripts/seed/index.ts: seeds the live-schema-shaped
// output of the ingestion-pipeline simulation (src/data/discovered-catalog.ts)
// instead of the hand-authored fixtures in src/data/seed-catalog.ts.
// Run with: tsx scripts/seed/discovered.ts
// (Uses upsert throughout, so it is safe to run alongside `npm run db:seed`.)

const prisma = new PrismaClient();

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function opportunityCreateData(opportunity: Opportunity): Prisma.OpportunityUncheckedCreateInput {
  return {
    id: opportunity.id,
    title: opportunity.title,
    organizationId: opportunity.organizationId,
    category: opportunity.category,
    description: opportunity.description,
    eligibility: json(opportunity.eligibility),
    requiredSkills: opportunity.requiredSkills,
    preferredSkills: opportunity.preferredSkills,
    location: opportunity.location,
    workMode: opportunity.workMode as WorkMode,
    deadline: opportunity.deadline,
    applicationMethod: opportunity.applicationMethod,
    sourceUrl: opportunity.sourceUrl,
    verificationStatus: opportunity.verificationStatus as VerificationStatus,
    source: opportunity.source as OpportunitySource,
    publicationDate: opportunity.publicationDate,
    checkedAt: opportunity.checkedAt,
    status: opportunity.status as OpportunityStatus,
    reviewChecklist: json(opportunity.reviewChecklist),
    reviewNotes: opportunity.reviewNotes,
    reviewerId: opportunity.reviewerId,
    reviewedAt: opportunity.reviewedAt,
  };
}

// Same validation contract as scripts/seed/index.ts's validateCatalog() —
// unique IDs, HTTPS sources, future deadlines, fully-checked trust review.
function validateCatalog(): void {
  const organizations = getDiscoveredOrganizations();
  const opportunities = getDiscoveredOpportunities();
  const organizationIds = new Set(organizations.map((organization) => organization.id));
  const opportunityIds = new Set(opportunities.map((opportunity) => opportunity.id));

  if (organizationIds.size !== organizations.length) throw new Error("Discovered-catalog organization IDs must be unique.");
  if (opportunityIds.size !== opportunities.length) throw new Error("Discovered-catalog opportunity IDs must be unique.");

  for (const opportunity of opportunities) {
    if (!organizationIds.has(opportunity.organizationId)) throw new Error(`Missing organization for ${opportunity.title}.`);
    if (!opportunity.sourceUrl.startsWith("https://")) throw new Error(`Official source must use HTTPS: ${opportunity.title}.`);
    if (!opportunity.deadline || opportunity.deadline <= SEED_SNAPSHOT_AT) throw new Error(`Discovered deadline is missing or not current at the catalogue snapshot: ${opportunity.title}.`);
    if (opportunity.verificationStatus === "verified" && Object.values(opportunity.reviewChecklist).some((value) => value !== true)) throw new Error(`Verified opportunity trust review is incomplete: ${opportunity.title}.`);
  }
}

async function main(): Promise<void> {
  validateCatalog();
  const organizations = getDiscoveredOrganizations();
  const opportunities = getDiscoveredOpportunities();

  await prisma.$transaction(async (transaction) => {
    for (const organization of organizations) {
      const { id, createdAt, updatedAt, ...fields } = organization;
      const data = {
        ...fields,
        verificationStatus: fields.verificationStatus as VerificationStatus,
        postingHistory: json(fields.postingHistory),
        promotionPolicy: json(fields.promotionPolicy),
      };
      await transaction.organization.upsert({
        where: { id },
        update: data,
        create: { id, createdAt, updatedAt, ...data },
      });
    }

    for (const opportunity of opportunities) {
      const createData = opportunityCreateData(opportunity);
      const updateData = { ...createData };
      delete (updateData as { id?: string }).id;
      await transaction.opportunity.upsert({
        where: { id: opportunity.id },
        update: updateData,
        create: createData,
      });
    }
  });

  console.log(
    `Seeded ${organizations.length} discovered organizations and ${opportunities.length} discovered opportunities (snapshot ${SEED_SNAPSHOT_AT.toISOString().slice(0, 10)}).`
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Unknown discovered-seed failure.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
