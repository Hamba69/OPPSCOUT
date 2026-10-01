import { describe, expect, it } from "vitest";
import { getDemoCatalog } from "@/data/demo-catalog";
import { buildProfileChoices } from "@/services/profile/choices";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";
import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";

describe("profile choice vocabulary", () => {
  it("includes database values without rewriting hard-gate inputs", async () => {
    const opportunity = { ...getDemoCatalog().opportunities[0], category: "research placement", location: "Kira Municipality", requiredSkills: ["geospatial analysis"], eligibility: { educationLevels: ["Bachelor of Science"], fieldsOfStudy: ["geoinformatics"], programmeRules: [{ field: "graduationStatus" as const, allowedValues: ["completed semester 6"], label: "Study" }, { field: "language" as const, allowedValues: ["Kiswahili"], label: "Language" }, { field: "location" as const, allowedValues: ["Kira Municipality"], label: "Location" }] } };
    const options = buildProfileChoices([opportunity]);
    expect(options.educationLevel).toContainEqual({ value: "Bachelor of Science", label: "Bachelor Of Science" });
    expect(options.graduationStatus.map((option) => option.value)).toContain("completed semester 6");
    expect(options.languages.map((option) => option.value)).toContain("Kiswahili");
    expect(options.location.map((option) => option.value)).toContain("Kira Municipality");
    expect(options.skills.map((option) => option.value)).toContain("geospatial analysis");
    expect(options.fieldOfStudy.map((option) => option.value)).toContain("geoinformatics");
    expect(options.opportunityCategories.map((option) => option.value)).toContain("research placement");
    const profile = (await new MemoryRepository().getProfile(DEMO_USER_ID))!;
    expect(evaluateHardGates({ ...profile, educationLevel: "Bachelor of Science", graduationStatus: "completed semester 6", languages: ["Kiswahili"], location: "Kira Municipality" }, opportunity).eligible).toBe(true);
  });

  it("keeps engine choices available when the catalog is empty", () => {
    const options = buildProfileChoices();
    expect(options.educationLevel.find((option) => option.label === "Bachelor’s degree")?.value).toBe("bachelors");
    expect(options.skills.find((option) => option.label === "JavaScript")?.value).toBe("javascript");
    expect(options.skills.find((option) => option.label === "TypeScript")?.value).toBe("typescript");
    expect(options.opportunityCategories.find((option) => option.label === "Jobs")?.value).toBe("job");
    for (const choices of Object.values(options)) expect(new Set(choices.map((option) => option.value)).size).toBe(choices.length);
  });
});
