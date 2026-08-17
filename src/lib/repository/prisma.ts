import {
  EventType as PrismaEventType,
  GeneratedBy as PrismaGeneratedBy,
  NotificationChannelType,
  NotificationStatus,
  OpportunitySource as PrismaOpportunitySource,
  OpportunityStatus as PrismaOpportunityStatus,
  PreferredChannel as PrismaPreferredChannel,
  Prisma,
  SavedOpportunityStatus,
  VerificationStatus as PrismaVerificationStatus,
  WorkMode as PrismaWorkMode,
} from "@prisma/client";

import type { EventLog, Opportunity, Organization, SavedOpportunity, TrustChecklist, UserProfile } from "@/core/entities/domain";
import { NotFoundError } from "@/core/errors/app-error";
import { prisma } from "@/lib/db";
import type {
  OpportunityFilters,
  OpportunityInput,
  OrganizationInput,
  ProfileInput,
  Repository,
  StoredMatchResult,
  StoredNotification,
} from "@/lib/repository/types";

type PrismaOpportunityRecord = Prisma.OpportunityGetPayload<{ include: { organization: true } }>;
type PrismaMatchRecord = Prisma.MatchResultGetPayload<{ include: { opportunity: { include: { organization: true } } } }>;

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function profileFromDb(value: Awaited<ReturnType<typeof prisma.userProfile.findUniqueOrThrow>>): UserProfile {
  return {
    ...value,
    preferredChannel: value.preferredChannel,
    notificationFrequency: value.notificationFrequency,
    secondaryChannels: value.secondaryChannels,
    workExperience: value.workExperience as unknown as UserProfile["workExperience"],
    internshipExperience: value.internshipExperience as unknown as UserProfile["internshipExperience"],
  };
}

function organizationFromDb(value: Awaited<ReturnType<typeof prisma.organization.findUniqueOrThrow>>): Organization {
  return {
    ...value,
    verificationStatus: value.verificationStatus,
    postingHistory: value.postingHistory as unknown as Organization["postingHistory"],
  };
}

function opportunityFromDb(value: PrismaOpportunityRecord): Opportunity {
  return {
    ...value,
    workMode: value.workMode,
    verificationStatus: value.verificationStatus,
    source: value.source,
    status: value.status,
    eligibility: value.eligibility as unknown as Opportunity["eligibility"],
    reviewChecklist: value.reviewChecklist as unknown as Opportunity["reviewChecklist"],
    organization: {
      id: value.organization.id,
      name: value.organization.name,
      verificationStatus: value.organization.verificationStatus,
    },
  };
}

function matchFromDb(value: PrismaMatchRecord): StoredMatchResult {
  return {
    id: value.id,
    userId: value.userId,
    opportunityId: value.opportunityId,
    score: value.score,
    matchedFactors: value.matchedFactors as unknown as StoredMatchResult["matchedFactors"],
    missingFactors: value.missingFactors as unknown as StoredMatchResult["missingFactors"],
    generatedBy: value.generatedBy,
    createdAt: value.createdAt,
    opportunity: opportunityFromDb(value.opportunity),
  };
}

function notificationFromDb(value: Awaited<ReturnType<typeof prisma.notification.findUniqueOrThrow>>): StoredNotification {
  return { ...value, channel: value.channel, status: value.status };
}

function savedFromDb(value: Awaited<ReturnType<typeof prisma.savedOpportunity.findUniqueOrThrow>>): SavedOpportunity {
  return { ...value, status: value.status };
}

export class PrismaRepository implements Repository {
  public async getProfile(userId: string): Promise<UserProfile | null> {
    const value = await prisma.userProfile.findUnique({ where: { id: userId } });
    return value ? profileFromDb(value) : null;
  }

  public async listProfiles(): Promise<UserProfile[]> {
    return (await prisma.userProfile.findMany({ orderBy: { createdAt: "asc" } })).map(profileFromDb);
  }

  public async createProfile(userId: string, input: ProfileInput): Promise<UserProfile> {
    const value = await prisma.userProfile.create({ data: this.profileCreateData(userId, input) });
    return profileFromDb(value);
  }

  public async updateProfile(userId: string, input: ProfileInput): Promise<UserProfile> {
    const value = await prisma.userProfile.update({ where: { id: userId }, data: this.profileUpdateData(input) });
    return profileFromDb(value);
  }

  public async deleteProfile(userId: string): Promise<void> {
    await prisma.userProfile.delete({ where: { id: userId } });
  }

  public async listOpportunities(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
    const where: Prisma.OpportunityWhereInput = {
      category: filters.category,
      location: filters.location ? { contains: filters.location, mode: "insensitive" } : undefined,
      workMode: filters.workMode as PrismaWorkMode | undefined,
      verificationStatus: filters.verificationStatus as PrismaVerificationStatus | undefined,
      status: filters.statuses ? { in: filters.statuses as PrismaOpportunityStatus[] } : undefined,
      organizationId: filters.organizationId,
      OR: filters.search ? [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ] : undefined,
    };
    const values = await prisma.opportunity.findMany({ where, include: { organization: true }, orderBy: { deadline: "asc" } });
    return values.map(opportunityFromDb);
  }

  public async getOpportunity(id: string): Promise<Opportunity | null> {
    const value = await prisma.opportunity.findUnique({ where: { id }, include: { organization: true } });
    return value ? opportunityFromDb(value) : null;
  }

  public async createOpportunity(input: OpportunityInput): Promise<Opportunity> {
    const value = await prisma.$transaction(async (transaction) => {
      const created = await transaction.opportunity.create({ data: this.opportunityCreateData(input), include: { organization: true } });
      const history = created.organization.postingHistory as unknown as Organization["postingHistory"];
      await transaction.organization.update({ where: { id: input.organizationId }, data: { postingHistory: asJson([...history, { opportunityId: created.id, postedAt: created.publicationDate.toISOString() }]) } });
      return created;
    });
    return opportunityFromDb(value);
  }

  public async updateOpportunity(id: string, input: Partial<OpportunityInput>): Promise<Opportunity> {
    const value = await prisma.opportunity.update({ where: { id }, data: this.opportunityUpdateData(input), include: { organization: true } });
    return opportunityFromDb(value);
  }

  public async deleteOpportunity(id: string): Promise<void> {
    await prisma.opportunity.delete({ where: { id } });
  }

  public async listOrganizations(): Promise<Organization[]> {
    const values = await prisma.organization.findMany({ orderBy: { name: "asc" } });
    return values.map(organizationFromDb);
  }

  public async getOrganization(id: string): Promise<Organization | null> {
    const value = await prisma.organization.findUnique({ where: { id } });
    return value ? organizationFromDb(value) : null;
  }

  public async createOrganization(input: OrganizationInput): Promise<Organization> {
    const value = await prisma.organization.create({ data: { ...input, verificationStatus: "pending", postingHistory: [] } });
    return organizationFromDb(value);
  }

  public async updateOrganization(id: string, input: Partial<OrganizationInput>): Promise<Organization> {
    const value = await prisma.organization.update({ where: { id }, data: input });
    return organizationFromDb(value);
  }

  public async upsertMatch(input: Omit<StoredMatchResult, "id" | "createdAt" | "opportunity">): Promise<StoredMatchResult> {
    const value = await prisma.matchResult.upsert({
      where: { userId_opportunityId: { userId: input.userId, opportunityId: input.opportunityId } },
      create: { ...input, matchedFactors: asJson(input.matchedFactors), missingFactors: asJson(input.missingFactors), generatedBy: input.generatedBy as PrismaGeneratedBy },
      update: { score: input.score, matchedFactors: asJson(input.matchedFactors), missingFactors: asJson(input.missingFactors), generatedBy: input.generatedBy as PrismaGeneratedBy, createdAt: new Date() },
      include: { opportunity: { include: { organization: true } } },
    });
    return matchFromDb(value);
  }

  public async listMatches(userId: string): Promise<StoredMatchResult[]> {
    const values = await prisma.matchResult.findMany({ where: { userId }, include: { opportunity: { include: { organization: true } } }, orderBy: { score: "desc" } });
    return values.map(matchFromDb);
  }

  public async getMatch(userId: string, id: string): Promise<StoredMatchResult | null> {
    const value = await prisma.matchResult.findFirst({ where: { id, userId }, include: { opportunity: { include: { organization: true } } } });
    return value ? matchFromDb(value) : null;
  }

  public async listSaved(userId: string): Promise<SavedOpportunity[]> {
    const values = await prisma.savedOpportunity.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return values.map(savedFromDb);
  }

  public async saveOpportunity(userId: string, opportunityId: string): Promise<SavedOpportunity> {
    const value = await prisma.savedOpportunity.upsert({
      where: { userId_opportunityId: { userId, opportunityId } },
      create: { userId, opportunityId },
      update: { status: "saved" },
    });
    return savedFromDb(value);
  }

  public async updateSaved(userId: string, id: string, status: SavedOpportunity["status"]): Promise<SavedOpportunity> {
    const current = await prisma.savedOpportunity.findFirst({ where: { id, userId } });
    if (!current) throw new NotFoundError("Saved opportunity");
    return savedFromDb(await prisma.savedOpportunity.update({ where: { id }, data: { status: status as SavedOpportunityStatus } }));
  }

  public async deleteSaved(userId: string, id: string): Promise<void> {
    const result = await prisma.savedOpportunity.deleteMany({ where: { id, userId } });
    if (!result.count) throw new NotFoundError("Saved opportunity");
  }

  public async listNotifications(userId: string): Promise<StoredNotification[]> {
    const values = await prisma.notification.findMany({ where: { userId }, orderBy: { sentAt: "desc" } });
    return values.map(notificationFromDb);
  }

  public async listAllNotifications(): Promise<StoredNotification[]> {
    const values = await prisma.notification.findMany({ orderBy: { sentAt: "desc" } });
    return values.map(notificationFromDb);
  }

  public async createNotification(input: Omit<StoredNotification, "id" | "sentAt" | "deliveredAt">): Promise<StoredNotification> {
    const value = await prisma.notification.create({ data: {
      ...input,
      channel: input.channel as NotificationChannelType,
      status: input.status as NotificationStatus,
    } });
    return notificationFromDb(value);
  }

  public async updateNotificationStatus(id: string, status: StoredNotification["status"]): Promise<StoredNotification> {
    const value = await prisma.notification.update({ where: { id }, data: {
      status: status as NotificationStatus,
      deliveredAt: status === "delivered" ? new Date() : undefined,
    } });
    return notificationFromDb(value);
  }

  public async listRecentNotifications(userId: string, since: Date): Promise<StoredNotification[]> {
    const values = await prisma.notification.findMany({ where: { userId, sentAt: { gte: since } }, orderBy: { sentAt: "desc" } });
    return values.map(notificationFromDb);
  }

  public async writeEvent(input: { eventType: EventLog["eventType"]; userId: string; opportunityId: string | null; metadata?: Record<string, unknown> }): Promise<EventLog> {
    const value = await prisma.eventLog.create({ data: {
      eventType: input.eventType as PrismaEventType,
      userId: input.userId,
      opportunityId: input.opportunityId,
      metadata: asJson(input.metadata ?? {}),
    } });
    return { ...value, eventType: value.eventType, metadata: value.metadata as Record<string, unknown> };
  }

  public async listEvents(filters: { eventType?: EventLog["eventType"]; since?: Date } = {}): Promise<EventLog[]> {
    const values = await prisma.eventLog.findMany({ where: {
      eventType: filters.eventType as PrismaEventType | undefined,
      timestamp: filters.since ? { gte: filters.since } : undefined,
    } });
    return values.map((value) => ({ ...value, eventType: value.eventType, metadata: value.metadata as Record<string, unknown> }));
  }

  public async listReviewQueue(): Promise<Opportunity[]> {
    const values = await prisma.opportunity.findMany({
      where: { verificationStatus: { in: ["pending", "flagged"] } },
      include: { organization: true },
      orderBy: { publicationDate: "asc" },
    });
    return values.map(opportunityFromDb);
  }

  public async reviewOpportunity(id: string, input: { checklist: TrustChecklist; approved: boolean; reviewerId: string; notes?: string }): Promise<Opportunity> {
    const value = await prisma.opportunity.update({ where: { id }, data: {
      reviewChecklist: asJson(input.checklist),
      verificationStatus: input.approved ? "verified" : "flagged",
      reviewerId: input.reviewerId,
      reviewNotes: input.notes,
      reviewedAt: new Date(),
    }, include: { organization: true } });
    return opportunityFromDb(value);
  }

  public async setOpportunityFlagged(id: string): Promise<Opportunity> {
    const value = await prisma.opportunity.update({ where: { id }, data: { verificationStatus: "flagged" }, include: { organization: true } });
    return opportunityFromDb(value);
  }

  private profileCreateData(userId: string, input: ProfileInput): Prisma.UserProfileUncheckedCreateInput {
    return {
      id: userId,
      ...input,
      name: input.name ?? "",
      preferredChannel: input.preferredChannel as PrismaPreferredChannel | undefined,
      secondaryChannels: input.secondaryChannels as PrismaPreferredChannel[] | undefined,
      workModePreference: input.workModePreference as PrismaWorkMode | null | undefined,
      workExperience: input.workExperience ? asJson(input.workExperience) : undefined,
      internshipExperience: input.internshipExperience ? asJson(input.internshipExperience) : undefined,
    };
  }

  private profileUpdateData(input: ProfileInput): Prisma.UserProfileUncheckedUpdateInput {
    return {
      ...input,
      preferredChannel: input.preferredChannel as PrismaPreferredChannel | undefined,
      secondaryChannels: input.secondaryChannels as PrismaPreferredChannel[] | undefined,
      workModePreference: input.workModePreference as PrismaWorkMode | null | undefined,
      workExperience: input.workExperience ? asJson(input.workExperience) : undefined,
      internshipExperience: input.internshipExperience ? asJson(input.internshipExperience) : undefined,
    };
  }

  private opportunityCreateData(input: OpportunityInput): Prisma.OpportunityUncheckedCreateInput {
    return {
      ...input,
      eligibility: asJson(input.eligibility),
      workMode: input.workMode as PrismaWorkMode,
      verificationStatus: input.verificationStatus as PrismaVerificationStatus,
      source: input.source as PrismaOpportunitySource,
      status: input.status as PrismaOpportunityStatus,
    };
  }

  private opportunityUpdateData(input: Partial<OpportunityInput>): Prisma.OpportunityUncheckedUpdateInput {
    return {
      ...input,
      eligibility: input.eligibility ? asJson(input.eligibility) : undefined,
      workMode: input.workMode as PrismaWorkMode | undefined,
      verificationStatus: input.verificationStatus as PrismaVerificationStatus | undefined,
      source: input.source as PrismaOpportunitySource | undefined,
      status: input.status as PrismaOpportunityStatus | undefined,
    };
  }
}
