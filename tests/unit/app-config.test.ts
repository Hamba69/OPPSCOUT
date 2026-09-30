import { afterEach, describe, expect, it, vi } from "vitest";

import { appUrl } from "@/config/app";

describe("application URL", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(["http://localhost:3000", "http://127.0.0.1:3000"]) (
    "uses the production origin for loopback configuration: %s",
    (configuredUrl) => {
      vi.stubEnv("OPPSCOUT_APP_URL", configuredUrl);
      expect(appUrl()).toBe("https://oppscout-delta.vercel.app");
    },
  );

  it("preserves an explicitly configured public origin", () => {
    vi.stubEnv("OPPSCOUT_APP_URL", "https://custom.example.com/");
    expect(appUrl()).toBe("https://custom.example.com");
  });

  it("uses the production origin when no URL is configured outside production", () => {
    vi.stubEnv("OPPSCOUT_APP_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(appUrl()).toBe("https://oppscout-delta.vercel.app");
  });
});