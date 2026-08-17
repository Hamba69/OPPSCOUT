import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repository/memory";
import { getKpiSnapshot } from "@/services/kpi/dashboard";

describe("KPI dashboard", () => {
  it("returns all ten mapped KPIs with finite real values", async () => {
    const snapshot = await getKpiSnapshot(new MemoryRepository());
    expect(snapshot.metrics).toHaveLength(10);
    expect(new Set(snapshot.metrics.map((item) => item.key)).size).toBe(10);
    expect(snapshot.metrics.every((item) => Number.isFinite(item.value) && item.sampleSize >= 0)).toBe(true);
  });
});
