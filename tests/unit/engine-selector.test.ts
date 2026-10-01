import { afterEach, describe, expect, it, vi } from "vitest";

import { FEATURE_FLAGS } from "@/config/feature-flags";
import { resolveMatchEngine } from "@/services/matching/engine-selector";
import { OrbitMatchEngine } from "@/services/matching/orbit/engine";
import { RuleBasedMatchEngine } from "@/services/matching/rule-based/engine";
import { AiAssistedMatchEngine } from "@/services/matching/ai-assisted/engine";

describe("matching engine selection", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to offline OrbitMatch with AI disabled", () => {
    vi.stubEnv("OPPSCOUT_AI_DEFAULT", "false");
    vi.stubEnv("OPPSCOUT_MATCH_ENGINE", undefined);
    expect(resolveMatchEngine()).toBeInstanceOf(OrbitMatchEngine);
    expect(FEATURE_FLAGS.aiMatching).toBe(false);
  });

  it("allows an explicit legacy rules fallback", () => {
    vi.stubEnv("OPPSCOUT_AI_DEFAULT", "false");
    vi.stubEnv("OPPSCOUT_MATCH_ENGINE", "rules");
    expect(resolveMatchEngine()).toBeInstanceOf(RuleBasedMatchEngine);
  });

  it("preserves AI approval and selection independently of the fallback", () => {
    vi.stubEnv("OPPSCOUT_AI_DEFAULT", "true");
    vi.stubEnv("OPPSCOUT_MATCH_ENGINE", "rules");
    vi.stubEnv("OPPSCOUT_AI_COMPARISON_APPROVED", "false");
    expect(resolveMatchEngine).toThrow("AI default is blocked");
    vi.stubEnv("OPPSCOUT_AI_COMPARISON_APPROVED", "true");
    expect(resolveMatchEngine()).toBeInstanceOf(AiAssistedMatchEngine);
  });
});
