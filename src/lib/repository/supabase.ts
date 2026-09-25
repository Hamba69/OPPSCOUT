import "server-only";

import { randomUUID } from "node:crypto";

import type {
  EventLog,
  Opportunity,
  Organization,
  SavedOpportunity,
  TrustChecklist,
  UserProfile,
} from "@/core/entities/domain";
import { NotFoundError } from "@/core/errors/app-error";
import { createUserProfile, deleteUserProfile, getUserProfile, listUserProfiles, updateUserProfile } from "@/lib/profile-store";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type {
  OpportunityFilters,
  OpportunityInput,
  OrganizationInput,
  ProfileInput,
  Repository,
  StoredMatchResult,
  StoredNotification,
} from "@/lib/repository/types";

type DbRow = Record<string, unknown>;
type DataClient = ReturnType<typeof createServiceRoleClient>;

function asDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value : new Date(String(value));
}

function organizationFromRow(row: DbRow): Organization {
  return {
    ...row,
    createdAt: asDate(row.createdAt)!,
    updatedAt: asDate(row.updatedAt)!,
    postingHistory: row.postingHistory ?? [],
    promotionPolicy: row.promotionPolicy ?? {},
  } as Organization;
}

function opportunityFromRow(row: DbRow, organization?: DbRow): Opportunity {
  return {
    ...row,
    deadline: asDate(row.deadline),
    publicationDate: asDate(row.publicationDate)!,
    checkedAt: asDate(row.checkedAt)!,
    reviewedAt: asDate(row.reviewedAt),
    eligibility: row.eligibility ?? {},
    reviewChecklist: row.reviewChecklist ?? {},
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          verificationStatus: organization.verificationStatus,
        }
      : undefined,
  } as Opportunity;
}

function savedFromRow(row: DbRow): SavedOpportunity {
  return {
    ...row,
    createdAt: asDate(row.createdAt)!,
    updatedAt: asDate(row.updatedAt)!,
  } as SavedOpportunity;
}

function notificationFromRow(row: DbRow): StoredNotification {
  return {
    ...row,
    sentAt: asDate(row.sentAt)!,
    deliveredAt: asDate(row.deliveredAt),
  } as StoredNotification;
}

function eventFromRow(row: DbRow): EventLog {
  return { ...row, timestamp: asDate(row.timestamp)!, metadata: row.metadata ?? {} } as EventLog;
}

function matchFromRow(row: DbRow, opportunity?: Opportunity): StoredMatchResult {
  return {
    id: String(row.id),
    userId: String(row.userId),
    opportunityId: String(row.opportunityId),
    score: Number(row.score),
    matchedFactors: Array.isArray(row.matchedFactors) ? row.matchedFactors as StoredMatchResult["matchedFactors"] : [],
    missingFactors: Array.isArray(row.missingFactors) ? row.missingFactors as StoredMatchResult["missingFactors"] : [],
    generatedBy: row.generatedBy === "ai" ? "ai" : "rules",
    createdAt: asDate(row.createdAt)!,
    opportunity,
  };
}

function checked<T>(data: T | null, error: { message: string } | null, operation: string): T {
  if (error) throw new Error(`${operation}: ${error.message}`);
  if (data === null) throw new NotFoundError(operation);
  return data;
}

export class SupabaseRepository implements Repository {
  private readonly client: DataClient = createServiceRoleClient();

  public getProfile(userId: string): Promise<UserProfile | null> {
    return getUserProfile(userId);
  }

  public listProfiles(): Promise<UserProfile[]> {
    return listUserProfiles();
  }

  public createProfile(userId: string, input: ProfileInput): Promise<UserProfile> {
    return createUserProfile(userId, input);
  }

  public updateProfile(userId: string, input: ProfileInput): Promise<UserProfile> {
    return updateUserProfile(userId, input);
  }

  public deleteProfile(userId: string): Promise<void> {
    return deleteUserProfile(userId);
  }

  public async listOpportunities(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
    if (filters.statuses?.length === 0) return [];

    let query = this.client.from("Opportunity").select("*");
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.workMode) query = query.eq("workMode", filters.workMode);
    if (filters.verificationStatus) query = query.eq("verificationStatus", filters.verificationStatus);
    if (filters.statuses) query = query.in("status", filters.statuses);
    if (filters.organizationId) query = query.eq("organizationId", filters.organizationId);

    const { data, error } = await query.order("deadline", { ascending: true, nullsFirst: false });
    const rows = checked(data, error, "Could not list opportunities");
    const filtered = rows.filter((row: DbRow) =>
      (!filters.location || String(row.location).toLocaleLowerCase().includes(filters.location.toLocaleLowerCase())) &&
      (!filters.search || `${row.title}\n${row.description}`.toLocaleLowerCase().includes(filters.search.toLocaleLowerCase())),
    );
    return this.opportunitiesWithOrganizations(filtered);
  }

  public async getOpportunity(id: string): Promise<Opportunity | null> {
    const { data, error } = await this.client.from("Opportunity").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Could not read opportunity: ${error.message}`);
    if (!data) return null;
    const values = await this.opportunitiesWithOrganizations([data]);
    return values[0] ?? null;
  }

  public async createOpportunity(input: OpportunityInput): Promise<Opportunity> {
    const now = new Date().toISOString();
    const insert = {
      ...input,
      id: randomUUID(),
      publicationDate: input.publicationDate?.toISOString() ?? now,
      checkedAt: input.checkedAt?.toISOString() ?? now,
    };
    const { data, error } = await this.client.from("Opportunity").insert(insert).select("*").single();
    const created = checked(data, error, "Could not create opportunity");

    try {
      const { data: organizationRow, error: organizationError } = await this.client
        .from("Organization")
        .select("postingHistory")
        .eq("id", input.organizationId)
        .single();
      const organization = checked(organizationRow, organizationError, "Could not update organization posting history");
      const history = Array.isArray(organization.postingHistory) ? organization.postingHistory : [];
      const { error: historyError } = await this.client
        .from("Organization")
        .update({
          postingHistory: [...history, { opportunityId: created.id, postedAt: created.publicationDate }],
          updatedAt: new Date().toISOString(),
        })
        .eq("id", input.organizationId);
      if (historyError) throw new Error(historyError.message);
    } catch (error) {
      await this.client.from("Opportunity").delete().eq("id", created.id);
      throw error;
    }

    return (await this.opportunitiesWithOrganizations([created]))[0];
  }

  public async updateOpportunity(id: string, input: Partial<OpportunityInput>): Promise<Opportunity> {
    const { data, error } = await this.client.from("Opportunity").update(input).eq("id", id).select("*").maybeSingle();
    const row = checked(data, error, "Opportunity");
    return (await this.opportunitiesWithOrganizations([row]))[0];
  }

  public async deleteOpportunity(id: string): Promise<void> {
    const { data, error } = await this.client.from("Opportunity").delete().eq("id", id).select("id").maybeSingle();
    checked(data, error, "Opportunity");
  }

  public async listOrganizations(): Promise<Organization[]> {
    const { data, error } = await this.client.from("Organization").select("*").order("name", { ascending: true });
    return checked(data, error, "Could not list organizations").map(organizationFromRow);
  }

  public async listOrganizationReviewQueue(): Promise<Organization[]> {
    const { data, error } = await this.client
      .from("Organization")
      .select("*")
      .in("verificationStatus", ["pending", "flagged"])
      .order("createdAt", { ascending: true });
    return checked(data, error, "Could not list organization review queue").map(organizationFromRow);
  }

  public async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await this.client.from("Organization").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Could not read organization: ${error.message}`);
    return data ? organizationFromRow(data) : null;
  }

  public async createOrganization(input: OrganizationInput): Promise<Organization> {
    const { data, error } = await this.client.from("Organization")
      .insert({
        ...input,
        id: randomUUID(),
        verificationStatus: "pending",
        postingHistory: [],
        updatedAt: new Date().toISOString(),
      })
      .select("*")
      .single();
    return organizationFromRow(checked(data, error, "Could not create organization"));
  }

  public async updateOrganization(id: string, input: Partial<OrganizationInput>): Promise<Organization> {
    const { data, error } = await this.client.from("Organization")
      .update({ ...input, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    return organizationFromRow(checked(data, error, "Organization"));
  }

  public async reviewOrganization(id: string, approved: boolean): Promise<Organization> {
    const { data, error } = await this.client.from("Organization")
      .update({ verificationStatus: approved ? "verified" : "flagged", updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    return organizationFromRow(checked(data, error, "Organization"));
  }

  public async updateOrganizationMonetization(
    id: string,
    input: {
      subscriptionTier?: Organization["subscriptionTier"];
      subscriptionStatus?: Organization["subscriptionStatus"];
      monetizationEnabled?: boolean;
      promotedListingCredits?: number;
      promotionPolicy?: Record<string, unknown>;
    },
  ): Promise<Organization> {
    const { data, error } = await this.client.from("Organization")
      .update({ ...input, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    return organizationFromRow(checked(data, error, "Organization"));
  }

  public async upsertMatch(input: Omit<StoredMatchResult, "id" | "createdAt" | "opportunity">): Promise<StoredMatchResult> {
    const { data, error } = await this.client.from("MatchResult").upsert({
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    }, { onConflict: "userId,opportunityId" }).select("*").single();
    const row = checked(data, error, "Could not save match");
    const opportunity = await this.getOpportunity(row.opportunityId);
    return matchFromRow(row, opportunity ?? undefined);
  }

  public async listMatches(userId: string): Promise<StoredMatchResult[]> {
    const { data, error } = await this.client.from("MatchResult").select("*").eq("userId", userId).order("score", { ascending: false });
    const rows = checked(data, error, "Could not list matches");
    const opportunities = await this.opportunitiesWithOrganizationsForIds(rows.map((row: DbRow) => String(row.opportunityId)));
    return rows.map((row: DbRow) => matchFromRow(row, opportunities.get(String(row.opportunityId))));
  }

  public async getMatch(userId: string, id: string): Promise<StoredMatchResult | null> {
    const { data, error } = await this.client.from("MatchResult").select("*").eq("id", id).eq("userId", userId).maybeSingle();
    if (error) throw new Error(`Could not read match: ${error.message}`);
    if (!data) return null;
    const opportunity = await this.getOpportunity(data.opportunityId);
    return matchFromRow(data, opportunity ?? undefined);
  }

  public async listSaved(userId: string): Promise<SavedOpportunity[]> {
    const { data, error } = await this.client.from("SavedOpportunity").select("*").eq("userId", userId).order("createdAt", { ascending: false });
    return checked(data, error, "Could not list saved opportunities").map(savedFromRow);
  }

  public async saveOpportunity(userId: string, opportunityId: string): Promise<SavedOpportunity> {
    const { data, error } = await this.client.from("SavedOpportunity").upsert({
      id: randomUUID(),
      userId,
      opportunityId,
      status: "saved",
      updatedAt: new Date().toISOString(),
    }, { onConflict: "userId,opportunityId", ignoreDuplicates: true }).select("*").maybeSingle();
    if (error) throw new Error(`Could not save opportunity: ${error.message}`);
    if (data) return savedFromRow(data);

    const { data: existing, error: existingError } = await this.client.from("SavedOpportunity")
      .select("id")
      .eq("userId", userId)
      .eq("opportunityId", opportunityId)
      .single();
    const saved = checked(existing, existingError, "Could not find saved opportunity");
    const { data: updated, error: updateError } = await this.client.from("SavedOpportunity")
      .update({ status: "saved", updatedAt: new Date().toISOString() })
      .eq("id", saved.id)
      .select("*")
      .single();
    return savedFromRow(checked(updated, updateError, "Could not update saved opportunity"));
  }

  public async updateSaved(userId: string, id: string, status: SavedOpportunity["status"]): Promise<SavedOpportunity> {
    const { data, error } = await this.client.from("SavedOpportunity")
      .update({ status, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .eq("userId", userId)
      .select("*")
      .maybeSingle();
    return savedFromRow(checked(data, error, "Saved opportunity"));
  }

  public async deleteSaved(userId: string, id: string): Promise<void> {
    const { data, error } = await this.client.from("SavedOpportunity")
      .delete()
      .eq("id", id)
      .eq("userId", userId)
      .select("id")
      .maybeSingle();
    checked(data, error, "Saved opportunity");
  }

  public async listNotifications(userId: string): Promise<StoredNotification[]> {
    const { data, error } = await this.client.from("Notification").select("*").eq("userId", userId).order("sentAt", { ascending: false });
    return checked(data, error, "Could not list notifications").map(notificationFromRow);
  }

  public async listAllNotifications(): Promise<StoredNotification[]> {
    const { data, error } = await this.client.from("Notification").select("*").order("sentAt", { ascending: false });
    return checked(data, error, "Could not list notifications").map(notificationFromRow);
  }

  public async createNotification(input: Omit<StoredNotification, "id" | "sentAt" | "deliveredAt">): Promise<StoredNotification> {
    const { data, error } = await this.client.from("Notification").insert({ ...input, id: randomUUID() }).select("*").single();
    return notificationFromRow(checked(data, error, "Could not create notification"));
  }

  public async updateNotificationStatus(id: string, status: StoredNotification["status"]): Promise<StoredNotification> {
    const { data, error } = await this.client.from("Notification").update({
      status,
      deliveredAt: status === "delivered" ? new Date().toISOString() : undefined,
    }).eq("id", id).select("*").maybeSingle();
    return notificationFromRow(checked(data, error, "Notification"));
  }

  public async listRecentNotifications(userId: string, since: Date): Promise<StoredNotification[]> {
    const { data, error } = await this.client.from("Notification")
      .select("*")
      .eq("userId", userId)
      .gte("sentAt", since.toISOString())
      .order("sentAt", { ascending: false });
    return checked(data, error, "Could not list notifications").map(notificationFromRow);
  }

  public async writeEvent(input: { eventType: EventLog["eventType"]; userId: string; opportunityId: string | null; metadata?: Record<string, unknown> }): Promise<EventLog> {
    const { data, error } = await this.client.from("EventLog").insert({ ...input, id: randomUUID(), metadata: input.metadata ?? {} }).select("*").single();
    return eventFromRow(checked(data, error, "Could not record event"));
  }

  public async listEvents(filters: { eventType?: EventLog["eventType"]; since?: Date } = {}): Promise<EventLog[]> {
    let query = this.client.from("EventLog").select("*");
    if (filters.eventType) query = query.eq("eventType", filters.eventType);
    if (filters.since) query = query.gte("timestamp", filters.since.toISOString());
    const { data, error } = await query;
    return checked(data, error, "Could not list events").map(eventFromRow);
  }

  public async listReviewQueue(): Promise<Opportunity[]> {
    const { data, error } = await this.client.from("Opportunity")
      .select("*")
      .in("verificationStatus", ["pending", "flagged"])
      .order("publicationDate", { ascending: true });
    const rows = checked(data, error, "Could not list opportunity review queue");
    return this.opportunitiesWithOrganizations(rows);
  }

  public async reviewOpportunity(id: string, input: { checklist: TrustChecklist; approved: boolean; reviewerId: string; notes?: string }): Promise<Opportunity> {
    const { data, error } = await this.client.from("Opportunity").update({
      reviewChecklist: input.checklist,
      verificationStatus: input.approved ? "verified" : "flagged",
      reviewerId: input.reviewerId,
      reviewNotes: input.notes,
      reviewedAt: new Date().toISOString(),
    }).eq("id", id).select("*").maybeSingle();
    const row = checked(data, error, "Opportunity");
    return (await this.opportunitiesWithOrganizations([row]))[0];
  }

  public async setOpportunityFlagged(id: string): Promise<Opportunity> {
    const { data, error } = await this.client.from("Opportunity")
      .update({ verificationStatus: "flagged" })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    const row = checked(data, error, "Opportunity");
    return (await this.opportunitiesWithOrganizations([row]))[0];
  }

  private async opportunitiesWithOrganizations(rows: DbRow[]): Promise<Opportunity[]> {
    const organizations = await this.organizationsByIds(rows.map((row) => String(row.organizationId)));
    return rows.map((row) => opportunityFromRow(row, organizations.get(String(row.organizationId))));
  }

  private async opportunitiesWithOrganizationsForIds(ids: string[]): Promise<Map<string, Opportunity>> {
    if (ids.length === 0) return new Map();
    const uniqueIds = [...new Set(ids)];
    const { data, error } = await this.client.from("Opportunity").select("*").in("id", uniqueIds);
    const rows = checked(data, error, "Could not read match opportunities");
    const opportunities = await this.opportunitiesWithOrganizations(rows);
    return new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]));
  }

  private async organizationsByIds(ids: string[]): Promise<Map<string, DbRow>> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return new Map();
    const { data, error } = await this.client.from("Organization").select("id,name,verificationStatus").in("id", uniqueIds);
    const rows = checked(data, error, "Could not read opportunity organizations");
    return new Map(rows.map((row: DbRow) => [String(row.id), row]));
  }
}
