import { AnthropicOpportunityAnalyzer } from "../src/services/ai/anthropic-analyzer";
import { MemoryRepository } from "../src/lib/repository/memory";
import { AiAssistedMatchEngine } from "../src/services/matching/ai-assisted/engine";
import { compareMatchEngines } from "../src/services/matching/ai-assisted/comparison";
import { RuleBasedMatchEngine } from "../src/services/matching/rule-based/engine";

const repository = new MemoryRepository(); const profile = (await repository.listProfiles())[0]; const opportunities = await repository.listOpportunities({ verificationStatus: "verified" });
const comparison = await compareMatchEngines(opportunities.map((opportunity) => ({ id: opportunity.id, profile, opportunity, relevant: true })), new RuleBasedMatchEngine(), new AiAssistedMatchEngine(new AnthropicOpportunityAnalyzer()));
console.info(JSON.stringify(comparison, null, 2)); if (!comparison.aiCanBecomeDefault) process.exitCode = 1;
