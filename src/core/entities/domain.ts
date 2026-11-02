export type PreferredChannel = "web" | "email" | "sms" | "ussd";
export type NotificationFrequency = "instant" | "daily" | "weekly";
export type WorkMode = "remote" | "onsite" | "hybrid";
export type VerificationStatus = "unverified" | "pending" | "verified" | "flagged";
export type OpportunitySource = "org_submitted" | "scraped" | "partner_feed";
/** How the listing entered OppScout; separate from the source of its information. */
export type OpportunityOrigin = "catalog" | "organization";
export type OpportunityStatus = "open" | "closing_soon" | "closed" | "stale" | "removed";
export type SavedStatus = "saved" | "applied" | "expired";
export type SubscriptionTier = "free" | "growth" | "partner";
export type SubscriptionStatus = "inactive" | "trial" | "active" | "past_due" | "cancelled";
export type EventType = "view" | "save" | "click" | "apply_intent" | "report";
export type ApplicantScope = "uganda_residents" | "ugandan_citizens" | "african_nationals" | "global";
export type RemoteEligibility = "unknown" | "uganda" | "east_africa" | "africa" | "global";
export type ProvenanceType = "official_page" | "application_system" | "org_attested";
export type SourceKind = "api" | "careers_page" | "rss" | "newspaper" | "partner" | "community";
export type SourceStatus = "proposed" | "approved" | "paused" | "blocked";
export type LeadChannel = "whatsapp" | "tiktok" | "instagram" | "facebook" | "linkedin" | "newspaper" | "web" | "email" | "employer" | "other";
export type LeadStatus = "new" | "tracing" | "traced" | "rejected" | "duplicate" | "promoted" | "expired";
export type ReportStatus = "open" | "actioned" | "dismissed";

export interface ExperienceEntry {
  title: string;
  organization?: string;
  months: number;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface ProfileProject {
  title: string;
  description: string;
  url?: string;
  role?: string;
  tags: string[];
}

export interface Eligibility {
  additionalRequirements?: string[];
  educationLevels?: string[];
  fieldsOfStudy?: string[];
  minimumExperienceMonths?: number;
  minimumAge?: number;
  maximumAge?: number;
  mandatoryCertifications?: string[];
  programmeRules?: Array<{
    field: "graduationStatus" | "location" | "language";
    allowedValues: string[];
    label: string;
  }>;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  preferredChannel: PreferredChannel;
  secondaryChannels: PreferredChannel[];
  notificationsEnabled: boolean;
  notificationFrequency: NotificationFrequency;
  educationLevel: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
  graduationStatus: string | null;
  dateOfBirth: Date | null;
  countryOfResidence?: string | null;
  openToAbroad?: boolean;
  skills: string[];
  workExperience: ExperienceEntry[];
  internshipExperience: ExperienceEntry[];
  certifications: string[];
  location: string | null;
  preferredLocations: string[];
  careerInterests: string[];
  opportunityCategories: string[];
  workModePreference: WorkMode | null;
  languages: string[];
  githubUrl: string | null;
  portfolioUrl: string | null;
  otherLinks: ProfileLink[];
  projects: ProfileProject[];
  shareWithOrganizations: boolean;
  shareContactDetails: boolean;
  orgSharingConsentAt: Date | null;
  orgSharingConsentVersion: string | null;
  profileCompletenessScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  sector: string;
  officialLinks: string[];
  officialDomains?: string[];
  officialEmail: string | null;
  registrationProof: string | null;
  accountableContact: string | null;
  verificationStatus: VerificationStatus;
  trustedPoster?: boolean;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  dashboardUsers: string[];
  postingHistory: Array<{ opportunityId: string; postedAt: string }>;
  createdAt: Date;
  updatedAt: Date;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  monetizationEnabled: boolean;
  promotedListingCredits: number;
  promotionPolicy: Record<string, unknown>;
}

export interface TrustChecklist {
  sourceAuthentic: boolean;
  noInappropriateFees: boolean;
  noSensitiveDataAsk: boolean;
  deadlinePlausible: boolean;
  duplicateChecked: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  organizationId: string | null;
  organizationName?: string | null;
  organization?: Pick<Organization, "id" | "name" | "verificationStatus">;
  category: string;
  description: string;
  eligibility: Eligibility;
  requiredSkills: string[];
  preferredSkills: string[];
  location: string;
  workMode: WorkMode | "unknown";
  deadline: Date | null;
  applicationMethod: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  source: OpportunitySource;
  origin?: OpportunityOrigin;
  publicationDate: Date;
  checkedAt: Date;
  status: OpportunityStatus;
  reviewChecklist: Partial<TrustChecklist>;
  reviewNotes: string | null;
  reviewerId: string | null;
  reviewedAt: Date | null;
  audience?: ApplicantScope | null;
  countryCodes?: string[];
  regions?: string[];
  remoteEligibility?: RemoteEligibility;
  eligibleCountries?: string[];
  provenanceType?: ProvenanceType | null;
  sourceId?: string | null;
  leadId?: string | null;
  canonicalUrl?: string | null;
  contentHash?: string | null;
  deadlineDateOnly?: boolean;
  lastSeenAt?: Date | null;
  needsRecheck?: boolean;
}

export interface SavedOpportunity {
  id: string;
  userId: string;
  opportunityId: string;
  status: SavedStatus;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventLog {
  id: string;
  eventType: EventType;
  userId: string | null;
  opportunityId: string | null;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  baseUrl: string;
  organizationId: string | null;
  status: SourceStatus;
  termsReviewedAt: Date | null;
  termsNotes: string | null;
  crawlIntervalHours: number;
  lastRunAt: Date | null;
  lastSuccessAt: Date | null;
  consecutiveFailures: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  channel: LeadChannel;
  status: LeadStatus;
  sourceId: string | null;
  submittedById: string | null;
  rawUrl: string | null;
  canonicalUrl: string | null;
  screenshotPath: string | null;
  note: string | null;
  extracted: Record<string, unknown>;
  candidateOrgName: string | null;
  officialUrl: string | null;
  organizationId: string | null;
  fingerprint: string;
  duplicateOfId: string | null;
  promotedOpportunityId: string | null;
  rejectReason: string | null;
  createdAt: Date;
  tracedAt: Date | null;
  resolvedAt: Date | null;
}

export interface ListingReport {
  id: string;
  opportunityId: string;
  reporterId: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
}

export interface IngestionRun {
  id: string;
  sourceId: string;
  startedAt: Date;
  finishedAt: Date | null;
  fetched: number;
  created: number;
  updated: number;
  duplicates: number;
  failed: number;
  errors: unknown[];
}
