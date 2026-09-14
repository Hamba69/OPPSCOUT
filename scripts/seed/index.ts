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
  getSeedOpportunities,
  getSeedOrganizations,
  SEED_SNAPSHOT_AT,
} from "../../src/data/seed-catalog";

const prisma = new PrismaClient();
const userId = "11111111-1111-4111-8111-111111111111";

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

function validateCatalog(): void {
  const organizations = getSeedOrganizations();
  const opportunities = getSeedOpportunities();
  const organizationIds = new Set(organizations.map((organization) => organization.id));
  const opportunityIds = new Set(opportunities.map((opportunity) => opportunity.id));

  if (organizationIds.size !== organizations.length) throw new Error("Seed organization IDs must be unique.");
  if (opportunityIds.size !== opportunities.length) throw new Error("Seed opportunity IDs must be unique.");

  for (const opportunity of opportunities) {
    if (!organizationIds.has(opportunity.organizationId)) throw new Error(`Missing organization for ${opportunity.title}.`);
    if (!opportunity.sourceUrl.startsWith("https://")) throw new Error(`Official source must use HTTPS: ${opportunity.title}.`);
    if (opportunity.deadline <= SEED_SNAPSHOT_AT) throw new Error(`Seed deadline is not current at the catalogue snapshot: ${opportunity.title}.`);
    if (Object.values(opportunity.reviewChecklist).some((value) => value !== true)) throw new Error(`Trust review is incomplete: ${opportunity.title}.`);
  }
}

async function main(): Promise<void> {
  validateCatalog();
  const organizations = getSeedOrganizations();
  const opportunities = getSeedOpportunities();

  await prisma.$transaction(async (transaction) => {
    await transaction.userProfile.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "Amina N.",
        phone: "+256700000001",
        email: "amina@example.com",
        preferredChannel: "email",
        secondaryChannels: ["sms"],
        educationLevel: "bachelors",
        institution: "Makerere University",
        fieldOfStudy: "computer science",
        graduationStatus: "final year",
        dateOfBirth: new Date("2002-05-14T00:00:00.000Z"),
        skills: ["javascript", "research", "communication", "data analysis"],
        workExperience: [{ title: "Student researcher", organization: "Makerere AI Lab", months: 8 }],
        internshipExperience: [{ title: "Web intern", organization: "Kampala Civic Lab", months: 3 }],
        certifications: ["google data analytics"],
        location: "Kampala",
        preferredLocations: ["Kampala", "Remote"],
        careerInterests: ["technology", "social impact", "data"],
        opportunityCategories: ["internship", "scholarship", "job"],
        workModePreference: "hybrid",
        languages: ["English", "Luganda"],
        profileCompletenessScore: 100,
      },
    });

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
      delete updateData.id;
      await transaction.opportunity.upsert({
        where: { id: opportunity.id },
        update: updateData,
        create: createData,
      });
    }
  });

  console.log(`Seeded ${organizations.length} organizations and ${opportunities.length} current opportunities (snapshot ${SEED_SNAPSHOT_AT.toISOString().slice(0, 10)}).`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Unknown seed failure.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
