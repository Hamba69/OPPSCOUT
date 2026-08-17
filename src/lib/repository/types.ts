import type {
  EventLog,
  EventType,
  Opportunity,
  OpportunityStatus,
  Organization,
  PreferredChannel,
  SavedOpportunity,
  SavedStatus,
  TrustChecklist,
  UserProfile,
  VerificationStatus,
  WorkMode,
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

export interface Repository {
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
  getOrganization(id: string): Promise<Organization | null>;
  createOrganization(input: OrganizationInput): Promise<Organization>;
  updateOrganization(id: string, input: Partial<OrganizationInput>): Promise<Organization>;
  updateOrganizationMonetization(id: string, input: { subscriptionTier?: Organization["subscriptionTier"]; subscriptionStatus?: Organization["subscriptionStatus"]; monetizationEnabled?: boolean; promotedListingCredits?: number; promotionPolicy?: Record<string, unknown> }): Promise<Organization>;
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
