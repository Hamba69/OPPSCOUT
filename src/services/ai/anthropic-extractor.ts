import { z } from "zod";

import { AI_RULES } from "@/config/ai-rules";
import { AppError } from "@/core/errors/app-error";
import type { ExtractedOpportunityData, OpportunityTextExtractor } from "@/services/ai/types";

const extractedSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(20),
  eligibility: z.object({
    educationLevels: z.array(z.string()).optional(),
    fieldsOfStudy: z.array(z.string()).optional(),
    minimumExperienceMonths: z.number().nonnegative().optional(),
    mandatoryCertifications: z.array(z.string()).optional(),
  }),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  location: z.string().min(1),
  workMode: z.enum(["remote", "onsite", "hybrid"]),
  deadline: z.string().datetime().nullable(),
  applicationMethod: z.string().min(1),
});

interface AnthropicResponse {
  content?: Array<{ type?: string; name?: string; input?: unknown }>;
}

export class AnthropicOpportunityExtractor implements OpportunityTextExtractor {
  public constructor(private readonly apiKey = process.env.ANTHROPIC_API_KEY, private readonly fetcher: typeof fetch = fetch) {}

  public async extract(sourceUrl: string, text: string): Promise<ExtractedOpportunityData> {
    if (!this.apiKey) throw new AppError("Anthropic is not configured.", 503, "AI_NOT_CONFIGURED");
    const response = await this.fetcher("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_RULES.model,
        max_tokens: AI_RULES.maxTokens,
        system: "Extract only facts explicitly present in the official source. Do not infer eligibility or dates. Return deadline as an ISO 8601 date-time only when the source publishes a closing date; return null when it states applications are rolling/open until filled or lists no closing date.",
        messages: [{ role: "user", content: `SOURCE ${sourceUrl}\n${text}` }],
        tools: [{
          name: "record_opportunity",
          description: "Record opportunity fields from the official source. Use deadline null when no closing date is published.",
          input_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              category: { type: "string" },
              description: { type: "string" },
              eligibility: {
                type: "object",
                properties: {
                  educationLevels: { type: "array", items: { type: "string" } },
                  fieldsOfStudy: { type: "array", items: { type: "string" } },
                  minimumExperienceMonths: { type: "number" },
                  mandatoryCertifications: { type: "array", items: { type: "string" } },
                },
              },
              requiredSkills: { type: "array", items: { type: "string" } },
              preferredSkills: { type: "array", items: { type: "string" } },
              location: { type: "string" },
              workMode: { type: "string", enum: ["remote", "onsite", "hybrid"] },
              deadline: { type: ["string", "null"], format: "date-time" },
              applicationMethod: { type: "string" },
            },
            required: ["title", "category", "description", "eligibility", "requiredSkills", "preferredSkills", "location", "workMode", "deadline", "applicationMethod"],
          },
        }],
        tool_choice: { type: "tool", name: "record_opportunity" },
      }),
    });
    if (!response.ok) throw new AppError(`Anthropic extraction failed with ${response.status}.`, 502, "AI_PROVIDER_ERROR");

    const body = await response.json() as AnthropicResponse;
    const block = body.content?.find((item) => item.type === "tool_use" && item.name === "record_opportunity");
    const parsed = extractedSchema.safeParse(block?.input);
    if (!parsed.success) throw new AppError("Anthropic returned invalid extracted fields.", 502, "AI_INVALID_RESPONSE", parsed.error.flatten());
    return parsed.data;
  }
}
