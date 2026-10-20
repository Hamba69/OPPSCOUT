import { AdminDataRepository } from "@/lib/repository/admin-base";
﻿import "server-only";

import { randomUUID } from "node:crypto";
import { parseDatabaseDate as asDate } from "@/lib/database-date";

import type {
  EventLog,
  IngestionRun,
  Lead,
  ListingReport,
  Opportunity,
  Organization,
  SavedOpportunity,
  Source,
  TrustChecklist,
  UserProfile,
} from "@/core/entities/domain";
import { NotFoundError } from "@/core/errors/app-error";
import { createUserProfile, deleteUserProfile, getUserProfile, listUserProfiles, updateUserProfile } from "@/lib/profile-store";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type {
  OpportunityFilters,
  OpportunityInput,
  IngestionRunFilters,
  IngestionRunInput,
  LeadFilters,
  LeadInput,
  ListingReportFilters,
  ListingReportInput,
  OrganizationInput,
  ProfileInput,
  Repository,
  SourceFilters,
  SourceInput,
  StoredMatchResult,
  StoredNotification,
} from "@/lib/repository/types";
import { deriveOfficialDomains } from "@/lib/repository/organization-domains";

type DbRow = Record<string, unknown>;
type DataClient = ReturnType<typeof createServiceRoleClient>;


function organizationFromRow(row: DbRow): Organization {
  return {
    ...row,
    officialDomains: Array.isArray(row.officialDomains)
      ? row.officialDomains
      : deriveOfficialDomains((row.officialLinks as string[] | undefined) ?? []),
    trustedPoster: row.trustedPoster ?? false,
    verifiedAt: asDate(row.verifiedAt),
    createdAt: asDate(row.createdAt)!,
    updatedAt: asDate(row.updatedAt)!,
    postingHistory: row.postingHistory ?? [],
    promotionPolicy: row.promotionPolicy ?? {},
  } as Organization;
}

function opportunityFromRow(row: DbRow, organization?: DbRow): Opportunity {
  return {
    ...row,
    origin: row.origin === "organization" ? "organization" : "catalog",
    deadline: asDate(row.deadline),
    publicationDate: asDate(row.publicationDate)!,
    checkedAt: asDate(row.checkedAt)!,
    lastSeenAt: asDate(row.lastSeenAt),
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
    organizationName: row.organizationName as string | null | undefined,
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

function sourceFromRow(row: DbRow): Source {
  return {
    ...row,
    termsReviewedAt: asDate(row.termsReviewedAt),
    lastRunAt: asDate(row.lastRunAt),
    lastSuccessAt: asDate(row.lastSuccessAt),
    createdAt: asDate(row.createdAt)!,
    updatedAt: asDate(row.updatedAt)!,
  } as Source;
}

function leadFromRow(row: DbRow): Lead {
  return {
    ...row,
    extracted: row.extracted ?? {},
    createdAt: asDate(row.createdAt)!,
    tracedAt: asDate(row.tracedAt),
    resolvedAt: asDate(row.resolvedAt),
  } as Lead;
}

function listingReportFromRow(row: DbRow): ListingReport {
  return {
    ...row,
    createdAt: asDate(row.createdAt)!,
    resolvedAt: asDate(row.resolvedAt),
  } as ListingReport;
}

function ingestionRunFromRow(row: DbRow): IngestionRun {
  return {
    ...row,
    startedAt: asDate(row.startedAt)!,
    finishedAt: asDate(row.finishedAt),
    errors: Array.isArray(row.errors) ? row.errors : [],
  } as IngestionRun;
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

export class SupabaseRepository extends AdminDataRepository implements Repository {

  protected async adminRpc(name: string, args: Record<string, unknown>): Promise<unknown> {
    const { data, error } = await this.client.rpc(name, args);
    if (error) throw new Error(`${error.code}: ${error.message}`);
    return data;
  }

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
    if (filters.opportunityIds?.length === 0) return [];

    let query = this.client.from("Opportunity").select("*");
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.workMode) query = query.eq("workMode", filters.workMode);
    if (filters.verificationStatus) query = query.eq("verificationStatus", filters.verificationStatus);
    if (filters.statuses) query = query.in("status", filters.statuses);
    if (filters.organizationId) query = query.eq("organizationId", filters.organizationId);
    if (filters.opportunityIds) query = query.in("id", filters.opportunityIds);
    if (filters.origin) query = query.eq("origin", filters.origin);

    // Read every page: the Data API otherwise silently caps a growing catalog.
    const rows: DbRow[] = [];
    let cursor: string | undefined;
    for (;;) {
      const pageQuery = query.order("id", { ascending: true }).limit(500);
      const { data, error } = await (cursor ? pageQuery.gt("id", cursor) : pageQuery);
      const page = checked(data, error, "Could not list opportunities");
      rows.push(...page);
      if (!page.length) break;
      cursor = String(page[page.length - 1].id);
    }
    rows.sort((a, b) => (asDate(a.deadline)?.getTime() ?? Infinity) - (asDate(b.deadline)?.getTime() ?? Infinity));
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
      origin: input.origin ?? "catalog",
      id: randomUUID(),
      publicationDate: input.publicationDate?.toISOString() ?? now,
      checkedAt: input.checkedAt?.toISOString() ?? now,
      lastSeenAt: input.lastSeenAt?.toISOString() ?? now,
      needsRecheck: input.needsRecheck ?? false,
    };
    const { data, error } = await this.client.from("Opportunity").insert(insert).select("*").single();
    const created = checked(data, error, "Could not create opportunity");

    try {
      if (!input.organizationId || input.origin === "catalog") return (await this.opportunitiesWithOrganizations([created]))[0];
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
    const { data, error } = await this.client.from("Opportunity").update({
      ...input,
      publicationDate: input.publicationDate?.toISOString(),
      checkedAt: input.checkedAt?.toISOString(),
      lastSeenAt: input.lastSeenAt?.toISOString() ?? (input.lastSeenAt === null ? null : undefined),
    }).eq("id", id).select("*").maybeSingle();
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
        officialDomains: deriveOfficialDomains(input.officialLinks),
        trustedPoster: false,
        verifiedAt: null,
        verifiedBy: null,
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
      .update({
        ...input,
        officialDomains: input.officialLinks ? deriveOfficialDomains(input.officialLinks) : undefined,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    return organizationFromRow(checked(data, error, "Organization"));
  }

  public async listSources(filters: SourceFilters = {}): Promise<Source[]> {
    let query = this.client.from("Source").select("*");
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.organizationId) query = query.eq("organizationId", filters.organizationId);
    const { data, error } = await query.order("name", { ascending: true });
    return checked(data, error, "Could not list sources").map(sourceFromRow);
  }

  public async getSource(id: string): Promise<Source | null> {
    const { data, error } = await this.client.from("Source").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Could not read source: ${error.message}`);
    return data ? sourceFromRow(data) : null;
  }

  public async createSource(input: SourceInput): Promise<Source> {
    const timestamp = new Date().toISOString();
    const { data, error } = await this.client.from("Source").insert({
      ...input,
      id: randomUUID(),
      status: input.status ?? "proposed",
      termsReviewedAt: input.termsReviewedAt?.toISOString() ?? null,
      crawlIntervalHours: input.crawlIntervalHours ?? 24,
      lastRunAt: input.lastRunAt?.toISOString() ?? null,
      lastSuccessAt: input.lastSuccessAt?.toISOString() ?? null,
      consecutiveFailures: input.consecutiveFailures ?? 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).select("*").single();
    return sourceFromRow(checked(data, error, "Could not create source"));
  }

  public async updateSource(id: string, input: Partial<SourceInput>): Promise<Source> {
    const { data, error } = await this.client.from("Source").update({
      ...input,
      termsReviewedAt: input.termsReviewedAt?.toISOString() ?? (input.termsReviewedAt === null ? null : undefined),
      lastRunAt: input.lastRunAt?.toISOString() ?? (input.lastRunAt === null ? null : undefined),
      lastSuccessAt: input.lastSuccessAt?.toISOString() ?? (input.lastSuccessAt === null ? null : undefined),
      updatedAt: new Date().toISOString(),
    }).eq("id", id).select("*").maybeSingle();
    return sourceFromRow(checked(data, error, "Source"));
  }

  public async listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
    let query = this.client.from("Lead").select("*");
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.sourceId) query = query.eq("sourceId", filters.sourceId);
    if (filters.submittedById) query = query.eq("submittedById", filters.submittedById);
    const { data, error } = await query.order("createdAt", { ascending: false });
    return checked(data, error, "Could not list leads").map(leadFromRow);
  }

  public async getLead(id: string): Promise<Lead | null> {
    const { data, error } = await this.client.from("Lead").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Could not read lead: ${error.message}`);
    return data ? leadFromRow(data) : null;
  }

  public async createLead(input: LeadInput): Promise<Lead> {
    const { data, error } = await this.client.from("Lead").insert({
      ...input,
      id: randomUUID(),
      status: input.status ?? "new",
      extracted: input.extracted ?? {},
      createdAt: new Date().toISOString(),
    }).select("*").single();
    return leadFromRow(checked(data, error, "Could not create lead"));
  }

  public async updateLead(id: string, input: Partial<LeadInput>): Promise<Lead> {
    const { data, error } = await this.client.from("Lead").update({
      ...input,
      tracedAt: input.tracedAt?.toISOString() ?? (input.tracedAt === null ? null : undefined),
      resolvedAt: input.resolvedAt?.toISOString() ?? (input.resolvedAt === null ? null : undefined),
    }).eq("id", id).select("*").maybeSingle();
    return leadFromRow(checked(data, error, "Lead"));
  }

  public async listListingReports(filters: ListingReportFilters = {}): Promise<ListingReport[]> {
    let query = this.client.from("ListingReport").select("*");
    if (filters.opportunityId) query = query.eq("opportunityId", filters.opportunityId);
    if (filters.reporterId) query = query.eq("reporterId", filters.reporterId);
    if (filters.status) query = query.eq("status", filters.status);
    const { data, error } = await query.order("createdAt", { ascending: false });
    return checked(data, error, "Could not list listing reports").map(listingReportFromRow);
  }

  public async getListingReport(id: string): Promise<ListingReport | null> {
    const { data, error } = await this.client.from("ListingReport").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Could not read listing report: ${error.message}`);
    return data ? listingReportFromRow(data) : null;
  }

  public async createListingReport(input: ListingReportInput): Promise<ListingReport> {
    const { data, error } = await this.client.from("ListingReport").insert({
      ...input,
      id: randomUUID(),
      status: input.status ?? "open",
      createdAt: new Date().toISOString(),
      resolvedAt: input.resolvedAt?.toISOString() ?? null,
    }).select("*").single();
    return listingReportFromRow(checked(data, error, "Could not create listing report"));
  }

  public async updateListingReport(id: string, input: Partial<ListingReportInput>): Promise<ListingReport> {
    const { data, error } = await this.client.from("ListingReport").update({
      ...input,
      resolvedAt: input.resolvedAt?.toISOString() ?? (input.resolvedAt === null ? null : undefined),
    }).eq("id", id).select("*").maybeSingle();
    return listingReportFromRow(checked(data, error, "Listing report"));
  }

  public async listIngestionRuns(filters: IngestionRunFilters = {}): Promise<IngestionRun[]> {
    let query = this.client.from("IngestionRun").select("*");
    if (filters.sourceId) query = query.eq("sourceId", filters.sourceId);
    if (filters.startedAfter) query = query.gte("startedAt", filters.startedAfter.toISOString());
    const { data, error } = await query.order("startedAt", { ascending: false });
    return checked(data, error, "Could not list ingestion runs").map(ingestionRunFromRow);
  }

  public async getIngestionRun(id: string): Promise<IngestionRun | null> {
    const { data, error } = await this.client.from("IngestionRun").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Could not read ingestion run: ${error.message}`);
    return data ? ingestionRunFromRow(data) : null;
  }

  public async createIngestionRun(input: IngestionRunInput): Promise<IngestionRun> {
    const { data, error } = await this.client.from("IngestionRun").insert({
      ...input,
      id: randomUUID(),
      startedAt: input.startedAt?.toISOString() ?? new Date().toISOString(),
      finishedAt: input.finishedAt?.toISOString() ?? null,
      fetched: input.fetched ?? 0,
      created: input.created ?? 0,
      updated: input.updated ?? 0,
      duplicates: input.duplicates ?? 0,
      failed: input.failed ?? 0,
      errors: input.errors ?? [],
    }).select("*").single();
    return ingestionRunFromRow(checked(data, error, "Could not create ingestion run"));
  }

  public async updateIngestionRun(id: string, input: Partial<IngestionRunInput>): Promise<IngestionRun> {
    const { data, error } = await this.client.from("IngestionRun").update({
      ...input,
      startedAt: input.startedAt?.toISOString() ?? undefined,
      finishedAt: input.finishedAt?.toISOString() ?? (input.finishedAt === null ? null : undefined),
    }).eq("id", id).select("*").maybeSingle();
    return ingestionRunFromRow(checked(data, error, "Ingestion run"));
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
    const organizations = await this.organizationsByIds(rows.flatMap((row) => row.organizationId ? [String(row.organizationId)] : []));
    return rows.map((row) => opportunityFromRow(row, row.organizationId ? organizations.get(String(row.organizationId)) : undefined));
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
    const organizations = new Map<string, DbRow>();
    for (let offset = 0; offset < uniqueIds.length; offset += 100) {
      const { data, error } = await this.client.from("Organization").select("id,name,verificationStatus").in("id", uniqueIds.slice(offset, offset + 100));
      for (const row of checked(data, error, "Could not read opportunity organizations")) organizations.set(String(row.id), row);
    }
    return organizations;
  }
}
