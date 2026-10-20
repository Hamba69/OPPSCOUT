import type { AdminRepository } from "@/lib/admin-data";
import type {
  EventLog,
  EventType,
  IngestionRun,
  Lead,
  LeadChannel,
  LeadStatus,
  ListingReport,
  ReportStatus,
  Opportunity,
  OpportunityOrigin,
  OpportunityStatus,
  Organization,
  PreferredChannel,
  SavedOpportunity,
  SavedStatus,
  Source,
  SourceKind,
  SourceStatus,
  TrustChecklist,
  UserProfile,
  VerificationStatus,
  WorkMode,
  ProfileLink,
  ProfileProject,
} from "@/core/entities/domain";
import type { MatchFactor } from "@/core/interfaces/match-engine";
import type { DeliveryStatus } from "@/core/interfaces/notification-channel";

export interface OpportunityFilters {
  category?: string;
  location?: string;
  workMode?: WorkMode;
  search?: string;
  verificationStatus?: VerificationStatus;
  statuses?: OpportunityStatus[];
  organizationId?: string;
  opportunityIds?: string[];
  origin?: OpportunityOrigin;
}

export interface StoredMatchResult {
  id: string;
  userId: string;
  opportunityId: string;
  score: number;
  matchedFactors: MatchFactor[];
  missingFactors: MatchFactor[];
  generatedBy: "rules" | "ai";
  createdAt: Date;
  opportunity?: Opportunity;
}

export interface StoredNotification {
  id: string;
  userId: string;
  matchId: string | null;
  channel: "email" | "sms" | "ussd" | "app";
  status: DeliveryStatus;
  triggerKey: string;
  message: string;
  sentAt: Date;
  deliveredAt: Date | null;
}

export interface ProfileInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
  preferredChannel?: PreferredChannel;
  secondaryChannels?: PreferredChannel[];
  notificationsEnabled?: boolean;
  notificationFrequency?: UserProfile["notificationFrequency"];
  educationLevel?: string | null;
  institution?: string | null;
  fieldOfStudy?: string | null;
  graduationStatus?: string | null;
  dateOfBirth?: Date | null;
  countryOfResidence?: string | null;
  openToAbroad?: boolean;
  skills?: string[];
  workExperience?: UserProfile["workExperience"];
  internshipExperience?: UserProfile["internshipExperience"];
  certifications?: string[];
  location?: string | null;
  preferredLocations?: string[];
  careerInterests?: string[];
  opportunityCategories?: string[];
  workModePreference?: WorkMode | null;
  languages?: string[];
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  otherLinks?: ProfileLink[];
  projects?: ProfileProject[];
  shareWithOrganizations?: boolean;
  shareContactDetails?: boolean;
  orgSharingConsentAt?: Date | null;
  orgSharingConsentVersion?: string | null;
  profileCompletenessScore?: number;
}

export type OpportunityInput = Omit<
  Opportunity,
  | "id"
  | "organization"
  | "publicationDate"
  | "checkedAt"
  | "reviewChecklist"
  | "reviewNotes"
  | "reviewerId"
  | "reviewedAt"
> & {
  publicationDate?: Date;
  checkedAt?: Date;
};

export interface OrganizationInput {
  name: string;
  sector: string;
  officialLinks: string[];
  officialEmail: string | null;
  registrationProof: string | null;
  accountableContact: string | null;
  dashboardUsers: string[];
}

export interface SourceInput {
  name: string;
  kind: SourceKind;
  baseUrl: string;
  organizationId?: string | null;
  status?: SourceStatus;
  termsReviewedAt?: Date | null;
  termsNotes?: string | null;
  crawlIntervalHours?: number;
  lastRunAt?: Date | null;
  lastSuccessAt?: Date | null;
  consecutiveFailures?: number;
}

export interface LeadInput {
  channel: LeadChannel;
  fingerprint: string;
  status?: LeadStatus;
  sourceId?: string | null;
  submittedById?: string | null;
  rawUrl?: string | null;
  canonicalUrl?: string | null;
  screenshotPath?: string | null;
  note?: string | null;
  extracted?: Record<string, unknown>;
  candidateOrgName?: string | null;
  officialUrl?: string | null;
  organizationId?: string | null;
  duplicateOfId?: string | null;
  promotedOpportunityId?: string | null;
  rejectReason?: string | null;
  tracedAt?: Date | null;
  resolvedAt?: Date | null;
}

export interface ListingReportInput {
  opportunityId: string;
  reason: string;
  reporterId?: string | null;
  details?: string | null;
  status?: ReportStatus;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  resolutionNote?: string | null;
}

export interface IngestionRunInput {
  sourceId: string;
  startedAt?: Date;
  finishedAt?: Date | null;
  fetched?: number;
  created?: number;
  updated?: number;
  duplicates?: number;
  failed?: number;
  errors?: unknown[];
}

export interface LeadFilters {
  status?: LeadStatus;
  sourceId?: string;
  submittedById?: string;
}

export interface ListingReportFilters {
  opportunityId?: string;
  reporterId?: string;
  status?: ReportStatus;
}

export interface IngestionRunFilters {
  sourceId?: string;
  startedAfter?: Date;
}

export interface SourceFilters {
  status?: SourceStatus;
  organizationId?: string;
}

export interface Repository extends AdminRepository {
  getProfile(userId: string): Promise<UserProfile | null>;
  listProfiles(): Promise<UserProfile[]>;
  createProfile(userId: string, input: ProfileInput): Promise<UserProfile>;
  updateProfile(userId: string, input: ProfileInput): Promise<UserProfile>;
  deleteProfile(userId: string): Promise<void>;
  listOpportunities(filters?: OpportunityFilters): Promise<Opportunity[]>;
  getOpportunity(id: string): Promise<Opportunity | null>;
  createOpportunity(input: OpportunityInput): Promise<Opportunity>;
  updateOpportunity(id: string, input: Partial<OpportunityInput>): Promise<Opportunity>;
  deleteOpportunity(id: string): Promise<void>;
  listOrganizations(): Promise<Organization[]>;
  listOrganizationReviewQueue(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | null>;
  createOrganization(input: OrganizationInput): Promise<Organization>;
  updateOrganization(id: string, input: Partial<OrganizationInput>): Promise<Organization>;
  reviewOrganization(id: string, approved: boolean): Promise<Organization>;
  updateOrganizationMonetization(id: string, input: { subscriptionTier?: Organization["subscriptionTier"]; subscriptionStatus?: Organization["subscriptionStatus"]; monetizationEnabled?: boolean; promotedListingCredits?: number; promotionPolicy?: Record<string, unknown> }): Promise<Organization>;
  listSources(filters?: SourceFilters): Promise<Source[]>;
  getSource(id: string): Promise<Source | null>;
  createSource(input: SourceInput): Promise<Source>;
  updateSource(id: string, input: Partial<SourceInput>): Promise<Source>;
  listLeads(filters?: LeadFilters): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | null>;
  createLead(input: LeadInput): Promise<Lead>;
  updateLead(id: string, input: Partial<LeadInput>): Promise<Lead>;
  listListingReports(filters?: ListingReportFilters): Promise<ListingReport[]>;
  getListingReport(id: string): Promise<ListingReport | null>;
  createListingReport(input: ListingReportInput): Promise<ListingReport>;
  updateListingReport(id: string, input: Partial<ListingReportInput>): Promise<ListingReport>;
  listIngestionRuns(filters?: IngestionRunFilters): Promise<IngestionRun[]>;
  getIngestionRun(id: string): Promise<IngestionRun | null>;
  createIngestionRun(input: IngestionRunInput): Promise<IngestionRun>;
  updateIngestionRun(id: string, input: Partial<IngestionRunInput>): Promise<IngestionRun>;
  upsertMatch(input: Omit<StoredMatchResult, "id" | "createdAt" | "opportunity">): Promise<StoredMatchResult>;
  listMatches(userId: string): Promise<StoredMatchResult[]>;
  getMatch(userId: string, id: string): Promise<StoredMatchResult | null>;
  listSaved(userId: string): Promise<SavedOpportunity[]>;
  saveOpportunity(userId: string, opportunityId: string): Promise<SavedOpportunity>;
  updateSaved(userId: string, id: string, status: SavedStatus): Promise<SavedOpportunity>;
  deleteSaved(userId: string, id: string): Promise<void>;
  listNotifications(userId: string): Promise<StoredNotification[]>;
  listAllNotifications(): Promise<StoredNotification[]>;
  createNotification(input: Omit<StoredNotification, "id" | "sentAt" | "deliveredAt">): Promise<StoredNotification>;
  updateNotificationStatus(id: string, status: DeliveryStatus): Promise<StoredNotification>;
  listRecentNotifications(userId: string, since: Date): Promise<StoredNotification[]>;
  writeEvent(input: { eventType: EventType; userId: string; opportunityId: string | null; metadata?: Record<string, unknown> }): Promise<EventLog>;
  listEvents(filters?: { eventType?: EventType; since?: Date }): Promise<EventLog[]>;
  listReviewQueue(): Promise<Opportunity[]>;
  reviewOpportunity(id: string, input: { checklist: TrustChecklist; approved: boolean; reviewerId: string; notes?: string }): Promise<Opportunity>;
  setOpportunityFlagged(id: string): Promise<Opportunity>;
}
