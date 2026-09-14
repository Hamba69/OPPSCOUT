import type { Opportunity, Organization } from "@/core/entities/domain";
import { DEMO_ORG_ID, getSeedOrganizations, PRIMARY_SEED_OPPORTUNITY_ID } from "@/data/seed-catalog";

// Fictional, memory-only walkthrough content. The sourced seed catalogue is unchanged.
const organizationDetails = [
  [DEMO_ORG_ID, "Nile Innovation Hub", "Technology and social impact"],
  ["44444444-4444-4444-8444-444444444450", "Busoga Harvest Collective", "Agriculture and cooperative finance"],
  ["44444444-4444-4444-8444-444444444451", "Kira Community Health Lab", "Public health and research"],
  ["44444444-4444-4444-8444-444444444452", "Open Civic Uganda", "Civil society and financial inclusion"],
] as const;

type Listing = Pick<Opportunity, "title" | "category" | "description" | "requiredSkills" | "preferredSkills" | "location" | "workMode"> & {
  organization: number; fields: string[]; days: number; months?: number; application: string;
};

const listings: Listing[] = [
  { title: "Junior Frontend Developer — Community Tools", category: "job", organization: 0, fields: ["computer science", "software engineering"], days: 2,
    description: "Join the Community Tools team in Kampala to turn paper sign-up sheets into accessible web forms. You will build JavaScript interfaces, test them on low-cost Android phones, and work with a designer to explain each change to programme staff. Bring one small project you can walk us through; a polished portfolio is optional.",
    requiredSkills: ["javascript", "communication"], preferredSkills: ["data analysis", "accessibility"], location: "Kampala", workMode: "hybrid",
    application: "Share a CV, a link to one JavaScript project, and a short note about a usability problem you solved. Final-year students and recent graduates are welcome." },
  { title: "Data for Public Good Internship", category: "internship", organization: 0, fields: ["computer science", "statistics"], days: 3,
    description: "Help the Data for Public Good programme make sense of community-service feedback. Clean survey exports, check missing responses, and write a weekly summary a non-technical programme lead can use. A mentor reviews your analysis before it reaches a partner; curiosity and careful documentation matter more than knowing every tool.",
    requiredSkills: ["research", "data analysis"], preferredSkills: ["communication", "sql"], location: "Kampala", workMode: "hybrid",
    application: "Prepare your CV and a one-page explanation of an analysis you have done in class, at work, or for a community group." },
  { title: "Community Health Data Assistant", category: "job", organization: 2, fields: ["computer science", "public health", "statistics"], days: 12,
    description: "Support the outreach monitoring team as it reconciles anonymised attendance counts from community health days. Check spreadsheet totals, document inconsistencies, and help coordinators prepare clear monthly reports. This is an entry-level analysis role with no clinical duties and no access to identifiable patient records.",
    requiredSkills: ["data analysis", "excel", "communication"], preferredSkills: ["research"], location: "Kampala", workMode: "onsite",
    application: "Prepare a CV and a brief example of how you would check a spreadsheet for duplicate rows and missing values." },
  { title: "Digital Inclusion Research Scholarship", category: "scholarship", organization: 3, fields: ["computer science", "social sciences"], days: 24,
    description: "Develop a small final-year research project on how young people find trustworthy information using basic phones. The Digital Inclusion programme pairs scholars with a research mentor and supports fieldwork planning. Proposals should explain the question, consent process, and how findings will be shared back with participants.",
    requiredSkills: ["research", "communication"], preferredSkills: ["research ethics"], location: "Remote", workMode: "remote",
    application: "Prepare a 500-word research outline, a study-status letter, and a short fieldwork budget. Do not include participant names or sensitive personal information." },
  { title: "Harvest Market Information Intern", category: "internship", organization: 1, fields: ["agriculture", "economics"], days: 16,
    description: "Work with the market information desk to compare weekly maize and bean prices reported by farmer groups around Jinja. Check unusual entries with the field team, maintain a tidy spreadsheet, and turn the results into a short bulletin in plain English. You will learn how seasonality and transport costs shape a farmer's selling decision.",
    requiredSkills: ["data analysis", "communication"], preferredSkills: ["research", "excel"], location: "Kampala", workMode: "hybrid",
    application: "Prepare a CV and a short paragraph explaining a price change to a farmer who has never used a spreadsheet." },
  { title: "Graduate Cooperative Accounts Assistant", category: "job", organization: 1, fields: ["accounting", "finance"], days: 20,
    description: "Help the cooperative finance team keep member statements and produce receipts in order. Reconcile a daily cashbook with mobile-money records, flag differences for the accountant, and support the monthly reporting checklist. Training covers the cooperative's controls; you will never be asked to collect application fees or handle member PINs.",
    requiredSkills: ["communication", "bookkeeping"], preferredSkills: ["data analysis", "excel"], location: "Kampala", workMode: "hybrid",
    application: "Prepare a CV and describe how you would investigate a cashbook total that does not match a statement. No prior paid employment is required." },
  { title: "Rural Health Research Internship", category: "internship", organization: 2, fields: ["public health", "nursing"], days: 9,
    description: "Join the community research desk for a supervised placement studying why families miss outreach appointments. Help pilot interview questions, organise anonymised notes, and summarise recurring themes. The placement is based in Jinja with scheduled field visits; clinical qualifications are not needed because the work is research support.",
    requiredSkills: ["research", "communication"], preferredSkills: ["data analysis", "qualitative coding"], location: "Jinja", workMode: "onsite",
    application: "Prepare a CV, your availability for field visits, and a short reflection on listening respectfully during an interview." },
  { title: "Climate-Smart Farming Study Award", category: "scholarship", organization: 1, fields: ["agriculture", "environmental science"], days: 28,
    description: "Design a practical study of soil cover, water use, or post-harvest loss with a farmer learning group in Mbale. The award supports a supervised undergraduate project and a community demonstration of the findings. Applicants from other fields can propose a useful data or communication contribution alongside an agriculture mentor.",
    requiredSkills: ["research", "data analysis"], preferredSkills: ["communication", "agronomy"], location: "Kampala", workMode: "hybrid",
    application: "Prepare a two-page project outline, a supervisor's note, and a plan for sharing results with the farmer learning group." },
  { title: "Community Programme Communications Intern", category: "internship", organization: 3, fields: ["journalism", "communications"], days: 14,
    description: "Help the community programme desk explain local consultation meetings without jargon. Draft short event notices, check facts with programme leads, and turn approved research findings into accessible social posts. You will work from the Kampala office with a weekly editor review and a clear consent checklist for every story.",
    requiredSkills: ["communication", "research"], preferredSkills: ["copy editing", "photography"], location: "Kampala", workMode: "onsite",
    application: "Prepare two writing samples of up to 300 words each. Class assignments and volunteer work are welcome; obtain permission before sharing someone else's story." },
  { title: "Junior Financial Inclusion Researcher", category: "job", organization: 3, fields: ["economics", "finance"], days: 18, months: 12,
    description: "Support a small research team studying how savings groups explain borrowing costs to first-time members. Review public information sheets, compare fee disclosures, and write concise evidence notes for community facilitators. The team values careful source checking and clear writing; experience with financial modelling will help you grow into the role.",
    requiredSkills: ["research", "communication"], preferredSkills: ["financial modelling", "excel"], location: "Kampala", workMode: "onsite",
    application: "Prepare a CV and a 400-word comparison of two publicly available savings-product information sheets, with links to your sources." },
];

export function getDemoCatalog(now = new Date()): { organizations: Organization[]; opportunities: Opportunity[] } {
  const template = getSeedOrganizations().find((organization) => organization.id === DEMO_ORG_ID)!;
  const organizations: Organization[] = organizationDetails.map(([id, name, sector], index) => ({
    ...structuredClone(template), id, name, sector, dashboardUsers: index === 0 ? template.dashboardUsers : [],
    officialLinks: ["https://example.org"], officialEmail: null, registrationProof: "Fictional demo organization",
    createdAt: now, updatedAt: now, postingHistory: [],
  }));
  const opportunities: Opportunity[] = listings.map((listing, index) => {
    const organization = organizations[listing.organization];
    const id = index === 0 ? PRIMARY_SEED_OPPORTUNITY_ID : `55555555-5555-4555-8555-${String(555555555551 + index)}`;
    const published = new Date(now.getTime() - (index + 2) * 86_400_000);
    organization.postingHistory.push({ opportunityId: id, postedAt: published.toISOString() });
    return {
      id, organizationId: organization.id, organization: { id: organization.id, name: organization.name, verificationStatus: "verified" },
      title: listing.title, category: listing.category, description: listing.description,
      eligibility: { educationLevels: ["diploma", "bachelors", "masters"], fieldsOfStudy: listing.fields, minimumExperienceMonths: listing.months ?? 0 },
      requiredSkills: listing.requiredSkills, preferredSkills: listing.preferredSkills, location: listing.location, workMode: listing.workMode,
      deadline: new Date(now.getTime() + listing.days * 86_400_000), applicationMethod: listing.application,
      sourceUrl: `https://example.org/oppscout-demo/${id}`, verificationStatus: "verified", source: "org_submitted",
      publicationDate: published, checkedAt: now, status: listing.days <= 3 ? "closing_soon" : "open",
      reviewChecklist: { sourceAuthentic: true, noInappropriateFees: true, noSensitiveDataAsk: true, deadlinePlausible: true, duplicateChecked: true },
      reviewNotes: "Fictional demo fixture illustrating a completed review; not a real vacancy or verification claim.",
      reviewerId: "22222222-2222-4222-8222-222222222222", reviewedAt: new Date(published.getTime() + (index + 4) * 3_600_000),
    };
  });
  return { organizations, opportunities };
}

export function demoSourceHref(sourceUrl: string): string {
  const prefix = "https://example.org/oppscout-demo/";
  return sourceUrl.startsWith(prefix) ? `/demo/source/${sourceUrl.slice(prefix.length)}` : sourceUrl;
}
