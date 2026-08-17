export type PreferredChannel = "web" | "email" | "sms" | "ussd";
export type WorkMode = "remote" | "onsite" | "hybrid";
export type VerificationStatus = "unverified" | "pending" | "verified" | "flagged";
export type OpportunitySource = "org_submitted" | "scraped" | "partner_feed";
export type OpportunityStatus = "open" | "closing_soon" | "closed" | "stale" | "removed";
export type SavedStatus = "saved" | "applied" | "expired";
export type EventType = "view" | "save" | "click" | "apply_intent" | "report";

export interface ExperienceEntry {
  title: string;
  organization?: string;
  months: number;
}

export interface Eligibility {
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
  educationLevel: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
  graduationStatus: string | null;
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
  profileCompletenessScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  sector: string;
  officialLinks: string[];
  officialEmail: string | null;
  registrationProof: string | null;
  accountableContact: string | null;
  verificationStatus: VerificationStatus;
  dashboardUsers: string[];
  postingHistory: Array<{ opportunityId: string; postedAt: string }>;
  createdAt: Date;
  updatedAt: Date;
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
  organizationId: string;
  organization?: Pick<Organization, "id" | "name" | "verificationStatus">;
  category: string;
  description: string;
  eligibility: Eligibility;
  requiredSkills: string[];
  preferredSkills: string[];
  location: string;
  workMode: WorkMode;
  deadline: Date;
  applicationMethod: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  source: OpportunitySource;
  publicationDate: Date;
  checkedAt: Date;
  status: OpportunityStatus;
  reviewChecklist: Partial<TrustChecklist>;
  reviewNotes: string | null;
  reviewerId: string | null;
  reviewedAt: Date | null;
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
