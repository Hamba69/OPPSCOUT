import "server-only";
import { AppError } from "@/core/errors/app-error";
import type { AccessLogInput, AdminQuery, AdminRepository, AdminSnapshot, DataPage, Dataset, FeedbackInput, MatchRunInput, RequestMetricInput, UnmatchedInput, VitalInput, feedbackUpdateSchema } from "@/lib/admin-data";
import type { z } from "zod";

export abstract class AdminDataRepository implements AdminRepository {
  protected abstract adminRpc(name: string, args: Record<string, unknown>): Promise<unknown>;
  async adminPage(dataset: Dataset, query: AdminQuery): Promise<DataPage> { return await this.adminRpc("admin_data_page", { dataset, options: query }) as DataPage; }
  async adminSnapshot(from: Date, to: Date): Promise<AdminSnapshot> { return await this.adminRpc("admin_snapshot", { start_at: from.toISOString(), end_at: to.toISOString() }) as AdminSnapshot; }
  private async write(operation: string, payload: unknown): Promise<void> {
    try { await this.adminRpc("admin_write", { operation, payload }); }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/23505|Feedback already submitted|unique constraint/.test(message)) throw new AppError("You have already shared feedback. Thank you.", 409, "FEEDBACK_EXISTS");
      if (message.includes("FEEDBACK_DAILY_LIMIT")) throw new AppError("Please try again tomorrow.", 429, "RATE_LIMITED", { retryAfterSeconds: 86400 });
      if (message.includes("FEEDBACK_NOT_FOUND")) throw new AppError("Feedback not found.", 404, "NOT_FOUND");
      throw error;
    }
  }
  createFeedback(input: FeedbackInput): Promise<void> { return this.write("feedback", input); }
  async hasFeedback(visitorHash: string, userId: string | null): Promise<boolean> { return Boolean(await this.adminRpc("admin_write", { operation: "feedback_exists", payload: { visitorHash, userId } })); }
  updateFeedback(id: string, input: z.infer<typeof feedbackUpdateSchema>): Promise<void> { return this.write("feedback_update", { id, ...input }); }
  writeRequestMetric(input: RequestMetricInput): Promise<void> { return this.write("request", input); }
  writeWebVitals(input: VitalInput[]): Promise<void> { return this.write("vitals", input); }
  writeMatchRun(input: MatchRunInput, terms: UnmatchedInput[]): Promise<void> { return this.write("match_run", { run: input, terms }); }
  writeAdminAccessLog(input: AccessLogInput): Promise<void> { return this.write("access", input); }
  async retainTelemetry(now = new Date()): Promise<void> { await this.adminRpc("retain_telemetry", { at_time: now.toISOString() }); }
}
