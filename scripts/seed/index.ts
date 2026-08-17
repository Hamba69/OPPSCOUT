import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const userId = "11111111-1111-4111-8111-111111111111";
const organizationId = "44444444-4444-4444-8444-444444444444";

async function main(): Promise<void> {
  await prisma.userProfile.upsert({ where: { id: userId }, update: {}, create: {
    id: userId, name: "Amina N.", phone: "+256700000001", email: "amina@example.com", preferredChannel: "email",
    secondaryChannels: ["sms"], educationLevel: "bachelors", institution: "Makerere University", fieldOfStudy: "computer science",
    graduationStatus: "final year", skills: ["javascript", "research", "communication", "data analysis"],
    workExperience: [{ title: "Student researcher", organization: "Makerere AI Lab", months: 8 }],
    internshipExperience: [{ title: "Web intern", organization: "Kampala Civic Lab", months: 3 }], certifications: ["google data analytics"],
    location: "Kampala", preferredLocations: ["Kampala", "Remote"], careerInterests: ["technology", "social impact", "data"],
    opportunityCategories: ["internship", "scholarship", "job"], workModePreference: "hybrid", languages: ["English", "Luganda"], profileCompletenessScore: 100,
  } });
  await prisma.organization.upsert({ where: { id: organizationId }, update: {}, create: {
    id: organizationId, name: "Nile Innovation Hub", sector: "Technology and social impact", officialLinks: ["https://example.org/nile-innovation"],
    officialEmail: "opportunities@example.org", registrationProof: "UG-NGO-2024-015", accountableContact: "Programme Office",
    verificationStatus: "verified", dashboardUsers: ["33333333-3333-4333-8333-333333333333"], postingHistory: [],
  } });
  await prisma.opportunity.upsert({ where: { id: "55555555-5555-4555-8555-555555555551" }, update: {}, create: {
    id: "55555555-5555-4555-8555-555555555551", title: "Junior Data & Impact Internship", organizationId, category: "internship",
    description: "Help a Kampala-based innovation team turn programme data into clear stories and useful decisions.",
    eligibility: { educationLevels: ["bachelors"], fieldsOfStudy: ["computer science", "statistics", "information systems"], minimumExperienceMonths: 0, programmeRules: [{ field: "language", allowedValues: ["english"], label: "English working proficiency" }] },
    requiredSkills: ["data analysis", "communication"], preferredSkills: ["javascript", "research"], location: "Kampala", workMode: "hybrid",
    deadline: new Date(Date.now() + 7 * 86_400_000), applicationMethod: "Apply on the official programme page", sourceUrl: "https://example.org/nile-innovation/internship",
    verificationStatus: "verified", source: "org_submitted", status: "open", reviewChecklist: { sourceAuthentic: true, noInappropriateFees: true, noSensitiveDataAsk: true, deadlinePlausible: true, duplicateChecked: true },
    reviewNotes: "Official source and organization details confirmed.", reviewerId: "22222222-2222-4222-8222-222222222222", reviewedAt: new Date(),
  } });
}

main().finally(async () => prisma.$disconnect());
