import { randomUUID } from "node:crypto";

import type { Opportunity, Organization, SavedOpportunity, TrustChecklist, UserProfile } from "@/core/entities/domain";
import { NotFoundError } from "@/core/errors/app-error";
import type {
  OpportunityFilters,
  OpportunityInput,
  OrganizationInput,
  ProfileInput,
  Repository,
  StoredMatchResult,
  StoredNotification,
} from "@/lib/repository/types";

export const DEMO_USER_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_ADMIN_ID = "22222222-2222-4222-8222-222222222222";
export const DEMO_ORG_USER_ID = "33333333-3333-4333-8333-333333333333";
export const DEMO_ORG_ID = "44444444-4444-4444-8444-444444444444";

const now = new Date();
const futureDate = (days: number): Date => new Date(now.getTime() + days * 86_400_000);

const initialProfile: UserProfile = {
  id: DEMO_USER_ID,
  name: "Amina N.",
  phone: "+256700000001",
  email: "amina@example.com",
  preferredChannel: "email",
  secondaryChannels: ["sms"],
  notificationsEnabled: true,
  educationLevel: "bachelors",
  institution: "Makerere University",
  fieldOfStudy: "computer science",
  graduationStatus: "final year",
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
  createdAt: now,
  updatedAt: now,
};

const initialOrganization: Organization = {
  id: DEMO_ORG_ID,
  name: "Nile Innovation Hub",
  sector: "Technology and social impact",
  officialLinks: ["https://example.org/nile-innovation"],
  officialEmail: "opportunities@example.org",
  registrationProof: "UG-NGO-2024-015",
  accountableContact: "Programme Office",
  verificationStatus: "verified",
  dashboardUsers: [DEMO_ORG_USER_ID],
  postingHistory: [],
  createdAt: now,
  updatedAt: now,
};

const initialOpportunities: Opportunity[] = [
  {
    id: "55555555-5555-4555-8555-555555555551",
    title: "Junior Data & Impact Internship",
    organizationId: DEMO_ORG_ID,
    organization: { id: DEMO_ORG_ID, name: initialOrganization.name, verificationStatus: "verified" },
    category: "internship",
    description: "Help a Kampala-based innovation team turn programme data into clear stories and useful decisions.",
    eligibility: {
      educationLevels: ["bachelors"],
      fieldsOfStudy: ["computer science", "statistics", "information systems"],
      minimumExperienceMonths: 0,
      programmeRules: [{ field: "language", allowedValues: ["english"], label: "English working proficiency" }],
    },
    requiredSkills: ["data analysis", "communication"],
    preferredSkills: ["javascript", "research"],
    location: "Kampala",
    workMode: "hybrid",
    deadline: futureDate(7),
    applicationMethod: "Apply on the official programme page",
    sourceUrl: "https://example.org/nile-innovation/internship",
    verificationStatus: "verified",
    source: "org_submitted",
    publicationDate: now,
    checkedAt: now,
    status: "open",
    reviewChecklist: {
      sourceAuthentic: true,
      noInappropriateFees: true,
      noSensitiveDataAsk: true,
      deadlinePlausible: true,
      duplicateChecked: true,
    },
    reviewNotes: "Official source and organization details confirmed.",
    reviewerId: DEMO_ADMIN_ID,
    reviewedAt: now,
  },
  {
    id: "55555555-5555-4555-8555-555555555552",
    title: "Uganda Women in Tech Scholarship",
    organizationId: DEMO_ORG_ID,
    organization: { id: DEMO_ORG_ID, name: initialOrganization.name, verificationStatus: "verified" },
    category: "scholarship",
    description: "A tuition and mentorship scholarship for final-year technology students building community-focused solutions.",
    eligibility: {
      educationLevels: ["bachelors"],
      fieldsOfStudy: ["computer science", "information systems", "software engineering"],
      programmeRules: [{ field: "graduationStatus", allowedValues: ["final year"], label: "Final-year student" }],
    },
    requiredSkills: ["communication"],
    preferredSkills: ["research", "social impact"],
    location: "Uganda",
    workMode: "remote",
    deadline: futureDate(14),
    applicationMethod: "Complete the official online form",
    sourceUrl: "https://example.org/nile-innovation/scholarship",
    verificationStatus: "verified",
    source: "org_submitted",
    publicationDate: now,
    checkedAt: now,
    status: "open",
    reviewChecklist: {
      sourceAuthentic: true,
      noInappropriateFees: true,
      noSensitiveDataAsk: true,
      deadlinePlausible: true,
      duplicateChecked: true,
    },
    reviewNotes: "Verified against the official programme page.",
    reviewerId: DEMO_ADMIN_ID,
    reviewedAt: now,
  },
];

function copy<T>(value: T): T {
  return structuredClone(value);
}

function includesText(value: string, expected?: string): boolean {
  return expected ? value.toLowerCase().includes(expected.toLowerCase()) : true;
}

export class MemoryRepository implements Repository {
  private readonly profiles = new Map<string, UserProfile>([[initialProfile.id, copy(initialProfile)]]);
  private readonly organizations = new Map<string, Organization>([[initialOrganization.id, copy(initialOrganization)]]);
  private readonly opportunities = new Map<string, Opportunity>(initialOpportunities.map((item) => [item.id, copy(item)]));
  private readonly matches = new Map<string, StoredMatchResult>();
  private readonly saved = new Map<string, SavedOpportunity>();
  private readonly notifications = new Map<string, StoredNotification>();
  private readonly events = new Map<string, import("@/core/entities/domain").EventLog>();

  public async getProfile(userId: string): Promise<UserProfile | null> {
    return copy(this.profiles.get(userId) ?? null);
  }

  public async listProfiles(): Promise<UserProfile[]> {
    return copy([...this.profiles.values()]);
  }

  public async createProfile(userId: string, input: ProfileInput): Promise<UserProfile> {
    const timestamp = new Date();
    const profile: UserProfile = { ...copy(initialProfile), ...copy(input), id: userId, createdAt: timestamp, updatedAt: timestamp };
    this.profiles.set(userId, profile);
    return copy(profile);
  }

  public async updateProfile(userId: string, input: ProfileInput): Promise<UserProfile> {
    const current = this.profiles.get(userId);
    if (!current) throw new NotFoundError("Profile");
    const profile = { ...current, ...copy(input), updatedAt: new Date() };
    this.profiles.set(userId, profile);
    return copy(profile);
  }

  public async deleteProfile(userId: string): Promise<void> {
    this.profiles.delete(userId);
    for (const [id, match] of this.matches) if (match.userId === userId) this.matches.delete(id);
    for (const [id, item] of this.saved) if (item.userId === userId) this.saved.delete(id);
    for (const [id, item] of this.notifications) if (item.userId === userId) this.notifications.delete(id);
  }

  public async listOpportunities(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
    return copy([...this.opportunities.values()].filter((item) =>
      (!filters.category || item.category === filters.category) &&
      includesText(item.location, filters.location) &&
      (!filters.workMode || item.workMode === filters.workMode) &&
      (!filters.search || includesText(`${item.title} ${item.description}`, filters.search)) &&
      (!filters.verificationStatus || item.verificationStatus === filters.verificationStatus) &&
      (!filters.statuses || filters.statuses.includes(item.status)) &&
      (!filters.organizationId || item.organizationId === filters.organizationId)
    ));
  }

  public async getOpportunity(id: string): Promise<Opportunity | null> {
    return copy(this.opportunities.get(id) ?? null);
  }

  public async createOpportunity(input: OpportunityInput): Promise<Opportunity> {
    const organization = this.organizations.get(input.organizationId);
    if (!organization) throw new NotFoundError("Organization");
    const opportunity: Opportunity = {
      ...copy(input),
      id: randomUUID(),
      organization: { id: organization.id, name: organization.name, verificationStatus: organization.verificationStatus },
      publicationDate: input.publicationDate ?? new Date(),
      checkedAt: input.checkedAt ?? new Date(),
      reviewChecklist: {},
      reviewNotes: null,
      reviewerId: null,
      reviewedAt: null,
    };
    this.opportunities.set(opportunity.id, opportunity);
    return copy(opportunity);
  }

  public async updateOpportunity(id: string, input: Partial<OpportunityInput>): Promise<Opportunity> {
    const current = this.opportunities.get(id);
    if (!current) throw new NotFoundError("Opportunity");
    const opportunity = { ...current, ...copy(input) };
    this.opportunities.set(id, opportunity);
    return copy(opportunity);
  }

  public async deleteOpportunity(id: string): Promise<void> {
    this.opportunities.delete(id);
  }

  public async listOrganizations(): Promise<Organization[]> {
    return copy([...this.organizations.values()]);
  }

  public async getOrganization(id: string): Promise<Organization | null> {
    return copy(this.organizations.get(id) ?? null);
  }

  public async createOrganization(input: OrganizationInput): Promise<Organization> {
    const timestamp = new Date();
    const organization: Organization = {
      ...copy(input), id: randomUUID(), verificationStatus: "pending", postingHistory: [], createdAt: timestamp, updatedAt: timestamp,
    };
    this.organizations.set(organization.id, organization);
    return copy(organization);
  }

  public async upsertMatch(input: Omit<StoredMatchResult, "id" | "createdAt" | "opportunity">): Promise<StoredMatchResult> {
    const existing = [...this.matches.values()].find((item) => item.userId === input.userId && item.opportunityId === input.opportunityId);
    const match: StoredMatchResult = {
      ...copy(input), id: existing?.id ?? randomUUID(), createdAt: new Date(), opportunity: await this.getOpportunity(input.opportunityId) ?? undefined,
    };
    this.matches.set(match.id, match);
    return copy(match);
  }

  public async listMatches(userId: string): Promise<StoredMatchResult[]> {
    return copy([...this.matches.values()].filter((item) => item.userId === userId).sort((a, b) => b.score - a.score));
  }

  public async getMatch(userId: string, id: string): Promise<StoredMatchResult | null> {
    const match = this.matches.get(id);
    return copy(match?.userId === userId ? match : null);
  }

  public async listSaved(userId: string): Promise<SavedOpportunity[]> {
    return copy([...this.saved.values()].filter((item) => item.userId === userId));
  }

  public async saveOpportunity(userId: string, opportunityId: string): Promise<SavedOpportunity> {
    const existing = [...this.saved.values()].find((item) => item.userId === userId && item.opportunityId === opportunityId);
    if (existing) return copy(existing);
    const timestamp = new Date();
    const item: SavedOpportunity = { id: randomUUID(), userId, opportunityId, status: "saved", reminderSent: false, createdAt: timestamp, updatedAt: timestamp };
    this.saved.set(item.id, item);
    return copy(item);
  }

  public async updateSaved(userId: string, id: string, status: SavedOpportunity["status"]): Promise<SavedOpportunity> {
    const current = this.saved.get(id);
    if (!current || current.userId !== userId) throw new NotFoundError("Saved opportunity");
    const item = { ...current, status, updatedAt: new Date() };
    this.saved.set(id, item);
    return copy(item);
  }

  public async deleteSaved(userId: string, id: string): Promise<void> {
    const current = this.saved.get(id);
    if (!current || current.userId !== userId) throw new NotFoundError("Saved opportunity");
    this.saved.delete(id);
  }

  public async listNotifications(userId: string): Promise<StoredNotification[]> {
    return copy([...this.notifications.values()].filter((item) => item.userId === userId).sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime()));
  }

  public async listAllNotifications(): Promise<StoredNotification[]> {
    return copy([...this.notifications.values()]);
  }

  public async createNotification(input: Omit<StoredNotification, "id" | "sentAt" | "deliveredAt">): Promise<StoredNotification> {
    const item: StoredNotification = { ...copy(input), id: randomUUID(), sentAt: new Date(), deliveredAt: input.status === "delivered" ? new Date() : null };
    this.notifications.set(item.id, item);
    return copy(item);
  }

  public async updateNotificationStatus(id: string, status: StoredNotification["status"]): Promise<StoredNotification> {
    const current = this.notifications.get(id);
    if (!current) throw new NotFoundError("Notification");
    const item = { ...current, status, deliveredAt: status === "delivered" ? new Date() : current.deliveredAt };
    this.notifications.set(id, item);
    return copy(item);
  }

  public async listRecentNotifications(userId: string, since: Date): Promise<StoredNotification[]> {
    return copy([...this.notifications.values()].filter((item) => item.userId === userId && item.sentAt >= since));
  }

  public async writeEvent(input: { eventType: import("@/core/entities/domain").EventType; userId: string; opportunityId: string | null; metadata?: Record<string, unknown> }): Promise<import("@/core/entities/domain").EventLog> {
    const event = { ...copy(input), metadata: input.metadata ?? {}, id: randomUUID(), timestamp: new Date() };
    this.events.set(event.id, event);
    return copy(event);
  }

  public async listEvents(filters: { eventType?: import("@/core/entities/domain").EventType; since?: Date } = {}): Promise<import("@/core/entities/domain").EventLog[]> {
    return copy([...this.events.values()].filter((item) =>
      (!filters.eventType || item.eventType === filters.eventType) && (!filters.since || item.timestamp >= filters.since)
    ));
  }

  public async listReviewQueue(): Promise<Opportunity[]> {
    return copy([...this.opportunities.values()].filter((item) => item.verificationStatus === "pending" || item.verificationStatus === "flagged"));
  }

  public async reviewOpportunity(id: string, input: { checklist: TrustChecklist; approved: boolean; reviewerId: string; notes?: string }): Promise<Opportunity> {
    const current = this.opportunities.get(id);
    if (!current) throw new NotFoundError("Opportunity");
    const opportunity: Opportunity = {
      ...current,
      verificationStatus: input.approved ? "verified" : "flagged",
      reviewChecklist: copy(input.checklist),
      reviewNotes: input.notes ?? null,
      reviewerId: input.reviewerId,
      reviewedAt: new Date(),
    };
    this.opportunities.set(id, opportunity);
    return copy(opportunity);
  }

  public async setOpportunityFlagged(id: string): Promise<Opportunity> {
    return this.updateOpportunity(id, { verificationStatus: "flagged" });
  }
}
