import { describe, expect, it } from "vitest";

import { displayTitle } from "@/lib/opportunity-title";

describe("displayTitle", () => {
  it("drops a trailing organization segment and keeps a parenthetical", () => {
    expect(displayTitle("Information Technologist – Masindi District Local Government (1 post)", "Masindi District Local Government")).toBe("Information Technologist (1 post)");
    expect(displayTitle("Graduate Software Engineer, Open Source and Linux – Canonical (remote, worldwide)", "Canonical")).toBe("Graduate Software Engineer, Open Source and Linux (remote, worldwide)");
  });

  it("drops a plain trailing organization segment", () => {
    expect(displayTitle("Junior Process Engineer – TotalEnergies EP Uganda", "TotalEnergies EP Uganda")).toBe("Junior Process Engineer");
    expect(displayTitle("Project Officer - WaterAid Uganda", "wateraid uganda")).toBe("Project Officer");
  });

  it("keeps titles that do not end with the exact organization name", () => {
    expect(displayTitle("Process Redesign Consultant – UNICEF Uganda Operations", "UNICEF Uganda")).toBe("Process Redesign Consultant – UNICEF Uganda Operations");
    expect(displayTitle("Mozilla Foundation Fellowships 2027–2028", "Mozilla Foundation")).toBe("Mozilla Foundation Fellowships 2027–2028");
    expect(displayTitle("Data Analyst", "Acme")).toBe("Data Analyst");
    expect(displayTitle("Data Analyst – Acme", null)).toBe("Data Analyst – Acme");
  });

  it("never returns an empty title", () => {
    expect(displayTitle("Acme – Acme", "Acme")).toBe("Acme");
  });
});

describe("shortTitle", () => {
  it("keeps the essence of a title for a small tile", async () => {
    const { shortTitle } = await import("@/lib/opportunity-title");
    expect(shortTitle("UBC International Scholarship")).toBe("UBC Scholarship");
    expect(shortTitle("AI Reporting Grant – Pulitzer Center")).toBe("AI Reporting Grant");
    expect(shortTitle("UNESCO/Japan Young Researchers' Fellowship 2026")).toBe("UNESCO/Japan Young Researchers' Fellowship");
    expect(shortTitle("Asia House Fellowship 2027/2028 (£24,000 stipend, remote)")).toBe("Asia House Fellowship");
    expect(shortTitle("2026 Young Graduate Program – TotalEnergies Marketing Uganda")).toBe("Young Graduate Program");
    expect(shortTitle("Mozilla Foundation Fellowships 2027–2028")).toBe("Mozilla Foundation Fellowships");
    expect(shortTitle("Information Technologist – Masindi District Local Government (1 post)", "Masindi District Local Government")).toBe("Information Technologist");
    expect(shortTitle("Assistant Lecturer - Big Data Analytics")).toBe("Assistant Lecturer - Big Data Analytics");
    expect(shortTitle("Graduate Software Engineer, Open Source and Linux – Canonical (remote, worldwide)")).toBe("Graduate Software Engineer, Open Source and Linux");
    expect(shortTitle("Graduate Software Engineer, Open Source and Linux Platforms – Canonical")).toBe("Graduate Software Engineer");
    expect(shortTitle("Programme Officer for Monitoring and Evaluation of Climate Projects")).toBe("Programme Officer for Monitoring and Evaluation");
    expect(shortTitle("MESPOM Erasmus Mundus Master in Environmental Sciences, Policy and Management")).toBe("MESPOM Erasmus Mundus Master in Environmental Sciences");
    expect(shortTitle("Global Citizen Prize: 2027 Cisco Youth Leadership Award ($250,000)")).toBe("Global Citizen Prize: Cisco Youth Leadership Award");
    expect(shortTitle("Global Citizen Prize: Cisco Youth Leadership Award for Changemakers")).toBe("Global Citizen Prize");
    expect(shortTitle("ETH Zurich Excellence Scholarship & Opportunity Programme (Master's)")).toBe("ETH Zurich Excellence Scholarship & Opportunity Programme");
    expect(shortTitle("Senior Regional Monitoring Evaluation Learning Accountability Officer Specialist")).toBe("Senior Regional Monitoring Evaluation Learning Accountability…");
  });
});

describe("listTitle", () => {
  it("drops the clutter around a name without cutting it", async () => {
    const { listTitle } = await import("@/lib/opportunity-title");
    expect(listTitle("MMed Research Scholarship in Neuro-Infectious Diseases (5 places) – IDI / O.R. Tambo Research Chair", "Infectious Diseases Institute")).toBe("MMed Research Scholarship in Neuro-Infectious Diseases");
    expect(listTitle("Graduate Software Engineer, Open Source and Linux – Canonical (remote, worldwide)", "Canonical")).toBe("Graduate Software Engineer, Open Source and Linux");
    expect(listTitle("Mozilla Foundation Fellowships 2027–2028", "Mozilla Foundation")).toBe("Mozilla Foundation Fellowships 2027–2028");
    expect(listTitle("Assistant Lecturer - Big Data Analytics", "Makerere University")).toBe("Assistant Lecturer - Big Data Analytics");
  });
});
