import { z } from "zod";

export type DataRow = Record<string, unknown>;
export const DATASETS = {
  users: { table: "UserProfile", date: "createdAt", search: "name", filters: ["location", "educationLevel", "fieldOfStudy", "preferredChannel"], sorts: ["name", "createdAt", "profileCompletenessScore"] },
  organizations: { table: "Organization", date: "createdAt", search: "name", filters: ["verificationStatus", "sector"], sorts: ["name", "createdAt", "verificationStatus"] },
  opportunities: { table: "Opportunity", date: "publicationDate", search: "title", filters: ["category", "status", "source", "origin", "verificationStatus"], sorts: ["title", "publicationDate", "deadline", "status"] },
  matches: { table: "MatchResult", date: "createdAt", search: "userName", filters: ["generatedBy", "userId", "opportunityId"], sorts: ["createdAt", "score", "userName", "opportunityTitle"] },
  saved: { table: "SavedOpportunity", date: "createdAt", search: "userId", filters: ["status", "userId"], sorts: ["createdAt", "status"] },
  events: { table: "EventLog", date: "timestamp", search: "userId", filters: ["eventType", "userId", "opportunityId"], sorts: ["timestamp", "eventType"] },
  notifications: { table: "Notification", date: "sentAt", search: "message", filters: ["channel", "status", "userId"], sorts: ["sentAt", "channel", "status"] },
  feedback: { table: "Feedback", date: "createdAt", search: "message", filters: ["category", "rating", "status", "identity"], sorts: ["createdAt", "rating", "category", "status"] },
  "match-runs": { table: "MatchRun", date: "createdAt", search: "engine", filters: ["engine", "trigger"], sorts: ["createdAt", "durationMs", "topScore"] },
  "unmatched-terms": { table: "UnmatchedTerm", date: "lastSeenAt", search: "term", filters: ["kind"], sorts: ["count", "kind", "term", "firstSeenAt", "lastSeenAt"] },
  "request-metrics": { table: "RequestMetric", date: "createdAt", search: "route", filters: ["kind", "route", "status"], sorts: ["createdAt", "durationMs", "route", "status"] },
  "web-vitals": { table: "WebVitalSample", date: "createdAt", search: "route", filters: ["metric", "rating", "deviceClass", "route"], sorts: ["createdAt", "value", "route", "metric"] },
  "access-log": { table: "AdminAccessLog", date: "createdAt", search: "event", filters: ["event"], sorts: ["createdAt", "event"] },
} as const;
export type Dataset = keyof typeof DATASETS;
export function isDataset(value: string): value is Dataset { return Object.prototype.hasOwnProperty.call(DATASETS, value); }
export interface AdminQuery { page: number; size: number; sort: string; direction: "asc" | "desc"; search: string; from?: string; to?: string; filters: Record<string, string>; cursor?: { value: string | number | null; id: string }; export?: boolean; }
export interface DataPage { rows: DataRow[]; total: number; }
export interface AggregatePoint { group: string; label: string; value: number; samples?: number; p50?: number; p95?: number; p99?: number; }
export interface AdminSnapshot { headlines: Record<string, number | null>; series: AggregatePoint[]; }
export function parseAdminQuery(dataset: Dataset, params: URLSearchParams): AdminQuery {
  const spec = DATASETS[dataset];
  const filters: Record<string, string> = {};
  for (const key of spec.filters) { const value = params.get(key); if (value) filters[key] = value.slice(0, 200); }
  const sort = params.get("sort") ?? spec.date;
  const date = (key: string) => { const value = params.get(key); return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) ? value : undefined; };
  return { page: Math.max(1, Math.min(100000, Number(params.get("page")) || 1)) | 0, size: [25, 50, 100].includes(Number(params.get("size"))) ? Number(params.get("size")) : 25,
    sort: (spec.sorts as readonly string[]).includes(sort) ? sort : spec.date, direction: params.get("direction") === "asc" ? "asc" : "desc", search: (params.get("search") ?? "").slice(0, 200), from: date("from"), to: date("to"), filters };
}
export const feedbackSchema = z.object({ category: z.enum(["idea", "bug", "matching_quality", "speed", "other"]), rating: z.number().int().min(1).max(5), message: z.string().trim().min(10).max(2000), contact: z.boolean().default(false), contactEmail: z.union([z.string().email().max(254), z.literal("")]).optional(), website: z.string().max(200).default(""), deviceClass: z.enum(["mobile", "tablet", "desktop"]) }).strict();
export const feedbackUpdateSchema = z.object({ status: z.enum(["new", "reviewed", "planned", "shipped", "dismissed"]), adminNote: z.string().max(2000).nullable() }).strict();
export interface FeedbackInput { category: string; rating: number; message: string; contactEmail: string | null; userId: string | null; visitorHash: string; ipHash: string; deviceClass: string; appVersion: string | null; }
export interface RequestMetricInput { kind: "api" | "ussd"; route: string; method: string; status: number; ok: boolean; durationMs: number; }
export interface VitalInput { route: string; metric: "LCP" | "INP" | "CLS" | "FCP" | "TTFB"; value: number; rating: "good" | "needs-improvement" | "poor"; deviceClass: "mobile" | "tablet" | "desktop"; }
export interface MatchRunInput { userId: string | null; engine: "orbit" | "rules" | "ai"; engineVersion: string; trigger: "feed" | "profile_update" | "notification_run" | "api"; durationMs: number; candidatesConsidered: number; gateExcluded: number; scored: number; aboveThreshold: number; topScore: number | null; scoreHistogram: number[]; gateExclusionReasons: Record<string, number>; topMissingFactors: Record<string, number>; }
export interface UnmatchedInput { kind: "skill" | "field" | "location" | "interest"; term: string; }
export interface AccessLogInput { event: "unlock_success" | "unlock_failure" | "export" | "feedback_update"; ipHash: string; userAgent: string; detail: DataRow; }
export interface AdminRepository {
  adminPage(dataset: Dataset, query: AdminQuery): Promise<DataPage>;
  adminSnapshot(from: Date, to: Date): Promise<AdminSnapshot>;
  createFeedback(input: FeedbackInput): Promise<void>;
  hasFeedback(visitorHash: string, userId: string | null): Promise<boolean>;
  updateFeedback(id: string, input: z.infer<typeof feedbackUpdateSchema>): Promise<void>;
  writeRequestMetric(input: RequestMetricInput): Promise<void>;
  writeWebVitals(input: VitalInput[]): Promise<void>;
  writeMatchRun(input: MatchRunInput, terms: UnmatchedInput[]): Promise<void>;
  writeAdminAccessLog(input: AccessLogInput): Promise<void>;
  retainTelemetry(now?: Date): Promise<void>;
}
