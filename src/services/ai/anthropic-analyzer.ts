import { z } from "zod";
import { AI_RULES } from "@/config/ai-rules";
import { AppError } from "@/core/errors/app-error";
import type { AiOpportunityAnalysis, OpportunityAnalyzer } from "@/services/ai/types";

const analysisSchema = z.object({
  scoreAdjustment: z.number().min(-AI_RULES.maximumScoreAdjustment).max(AI_RULES.maximumScoreAdjustment),
  matchedFactors: z.array(z.object({ label: z.string().min(1), detail: z.string().min(1) })).min(1).max(8),
  missingFactors: z.array(z.object({ label: z.string().min(1), detail: z.string().min(1) })).min(1).max(8),
  suspiciousSignals: z.array(z.string().min(1)).max(8),
});

interface AnthropicResponse { content?: Array<{ type?: string; name?: string; input?: unknown }>; }

export class AnthropicOpportunityAnalyzer implements OpportunityAnalyzer {
  public constructor(private readonly apiKey = process.env.ANTHROPIC_API_KEY, private readonly fetcher: typeof fetch = fetch) {}
  public async analyze(input: { profileSummary: string; opportunityText: string }): Promise<AiOpportunityAnalysis> {
    if (!this.apiKey) throw new AppError("Anthropic is not configured.", 503, "AI_NOT_CONFIGURED");
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), AI_RULES.timeoutMs);
    try {
      const response = await this.fetcher("https://api.anthropic.com/v1/messages", { method: "POST", signal: controller.signal, headers: { "content-type": "application/json", "x-api-key": this.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: AI_RULES.model, max_tokens: AI_RULES.maxTokens, system: "Analyze relevance only. Never decide education, certification, age, or programme eligibility. Return concise plain-language factors.", messages: [{ role: "user", content: `PROFILE\n${input.profileSummary}\n\nOPPORTUNITY\n${input.opportunityText}` }], tools: [{ name: "record_match_analysis", description: "Record structured relevance analysis", input_schema: { type: "object", properties: { scoreAdjustment: { type: "number", minimum: -10, maximum: 10 }, matchedFactors: { type: "array", minItems: 1, items: { type: "object", properties: { label: { type: "string" }, detail: { type: "string" } }, required: ["label", "detail"] } }, missingFactors: { type: "array", minItems: 1, items: { type: "object", properties: { label: { type: "string" }, detail: { type: "string" } }, required: ["label", "detail"] } }, suspiciousSignals: { type: "array", items: { type: "string" } } }, required: ["scoreAdjustment", "matchedFactors", "missingFactors", "suspiciousSignals"] } }], tool_choice: { type: "tool", name: "record_match_analysis" } }) });
      if (!response.ok) throw new AppError(`Anthropic request failed with ${response.status}.`, 502, "AI_PROVIDER_ERROR");
      const body = await response.json() as AnthropicResponse; const block = body.content?.find((item) => item.type === "tool_use" && item.name === "record_match_analysis");
      const parsed = analysisSchema.safeParse(block?.input); if (!parsed.success) throw new AppError("Anthropic returned an invalid analysis.", 502, "AI_INVALID_RESPONSE", parsed.error.flatten());
      return parsed.data;
    } catch (error) { if (error instanceof AppError) throw error; if (error instanceof Error && error.name === "AbortError") throw new AppError("Anthropic request timed out.", 504, "AI_TIMEOUT"); throw new AppError("Anthropic request failed.", 502, "AI_PROVIDER_ERROR"); }
    finally { clearTimeout(timeout); }
  }
}
