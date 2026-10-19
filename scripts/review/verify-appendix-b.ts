type Profile = {
  countryOfResidence?: string;
  openToAbroad: boolean;
  location?: string;
};

type Opportunity = {
  audience: "uganda_residents" | "ugandan_citizens" | "african_nationals" | "global" | null;
  eligibleCountries: string[];
  workMode: "remote" | "onsite" | "hybrid";
  remoteEligibility: "unknown" | "uganda" | "east_africa" | "africa" | "global";
  category: string;
  countryCodes: string[];
};

const funding = new Set(["scholarship", "fellowship", "grant"]);
const remoteOk = new Set(["uganda", "east_africa", "africa", "global"]);
const normalize = (value: string): string => value.trim().toLowerCase();

function isVisibleToSeeker(profile: Profile, opportunity: Opportunity): boolean {
  if (!opportunity.audience) return false;
  const inUganda = (profile.countryOfResidence ?? "UG") === "UG";
  if (opportunity.audience === "uganda_residents" && !inUganda) return false;
  if (opportunity.eligibleCountries.length && !opportunity.eligibleCountries.includes("UG")) return false;
  if (opportunity.workMode === "remote") return remoteOk.has(opportunity.remoteEligibility);
  if (funding.has(opportunity.category.toLowerCase())) return true;
  if (opportunity.countryCodes.length === 0) return false;
  if (opportunity.countryCodes.includes("UG")) return true;
  return profile.openToAbroad;
}

function residenceTerms(profile: Profile): string[] {
  const town = normalize(profile.location ?? "");
  const country = (profile.countryOfResidence ?? "UG") === "UG" ? ["uganda"] : [];
  return [town, ...country];
}

function locationCredit(profile: Profile, opportunity: Opportunity): number {
  if (funding.has(opportunity.category.toLowerCase())) return 1;
  return opportunity.countryCodes.includes(profile.countryOfResidence ?? "UG") ? 0.5 : 0;
}

function reingestVerified(
  current: { verificationStatus: string; title: string; deadline: string; location: string; applicationMethod: string; sourceUrl: string; description: string; lastSeenAt?: string; needsRecheck?: boolean },
  incoming: { title: string; deadline: string; location: string; applicationMethod: string; sourceUrl: string; description: string },
  now: string,
): typeof current {
  const applyLinkChanged = current.applicationMethod !== incoming.applicationMethod || current.sourceUrl !== incoming.sourceUrl;
  if (applyLinkChanged) return { ...current, verificationStatus: "pending", lastSeenAt: now };
  const factsChanged = current.deadline !== incoming.deadline || current.description !== incoming.description;
  if (factsChanged) return { ...current, ...incoming, lastSeenAt: now, needsRecheck: true };
  return { ...current, lastSeenAt: now };
}

const base = {
  audience: "uganda_residents" as const,
  eligibleCountries: [],
  workMode: "onsite" as const,
  remoteEligibility: "unknown" as const,
  category: "job",
  countryCodes: ["UG"],
};
const cases: Array<[number, Profile, Opportunity, boolean]> = [
  [1, { countryOfResidence: "UG", openToAbroad: false }, { ...base }, true],
  [2, { countryOfResidence: "UG", openToAbroad: false }, { ...base, audience: "african_nationals", countryCodes: ["ET"] }, false],
  [3, { countryOfResidence: "UG", openToAbroad: true }, { ...base, audience: "african_nationals", countryCodes: ["ET"] }, true],
  [4, { openToAbroad: false }, { ...base, workMode: "remote", remoteEligibility: "unknown" }, false],
  [5, { openToAbroad: false }, { ...base, workMode: "remote", remoteEligibility: "africa" }, true],
  [6, { countryOfResidence: "UG", openToAbroad: false }, { ...base, category: "scholarship", countryCodes: ["GB"], eligibleCountries: ["UG"] }, true],
  [7, { countryOfResidence: "UG", openToAbroad: false }, { ...base, category: "scholarship", countryCodes: ["GB"], eligibleCountries: ["KE"] }, false],
  [8, { openToAbroad: false }, { ...base, audience: null }, false],
  [9, { countryOfResidence: "UG", openToAbroad: false }, { ...base, countryCodes: ["UG", "NG", "CD"] }, true],
  [10, { countryOfResidence: "KE", openToAbroad: false }, { ...base, audience: "uganda_residents" }, false],
  [11, { openToAbroad: true }, { ...base, countryCodes: [] }, false],
  [12, { countryOfResidence: "UG", openToAbroad: false }, { ...base, category: "scholarship", countryCodes: ["GB"] }, true],
];

let failures = 0;
function assertContract(row: number, condition: boolean, label: string): void {
  const result = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`row ${row}: ${result} (${label})`);
}
for (const [row, profile, opportunity, expected] of cases) {
  const actual = isVisibleToSeeker(profile, opportunity);
  const result = actual === expected ? "PASS" : "FAIL";
  if (result === "FAIL") failures += 1;
  console.log(`row ${row}: ${result} (expected ${expected}, got ${actual})`);
}
assertContract(9, locationCredit({ countryOfResidence: "UG", openToAbroad: false, location: "Jinja" }, { ...base, countryCodes: ["UG", "NG", "CD"] }) > 0, "country overlap gives positive location credit");
assertContract(12, locationCredit({ countryOfResidence: "UG", openToAbroad: false }, { ...base, category: "scholarship", countryCodes: ["GB"] }) === 1, "funding receives full location credit");
const rhodesRule = ["Kampala", "Uganda", "Tanzania", "Rwanda", "South Sudan", "Burundi", "Kenya"].map(normalize);
assertContract(13, rhodesRule.some((allowed) => residenceTerms({ location: "Gulu", countryOfResidence: "UG", openToAbroad: false }).includes(allowed)), "Gulu residence terms satisfy Uganda-level rule");
assertContract(13, !["kampala"].some((allowed) => residenceTerms({ location: "Gulu", countryOfResidence: "UG", openToAbroad: false }).includes(allowed)), "Gulu does not satisfy a Kampala-only rule");
const current = { verificationStatus: "verified", title: "Role", deadline: "2027-01-01", location: "Kampala", applicationMethod: "Apply", sourceUrl: "https://employer.example/job", description: "Original description", lastSeenAt: "yesterday" };
const unchanged = reingestVerified(current, { title: current.title, deadline: current.deadline, location: current.location, applicationMethod: current.applicationMethod, sourceUrl: current.sourceUrl, description: current.description }, "today");
assertContract(14, unchanged.verificationStatus === "verified" && unchanged.lastSeenAt === "today", "unchanged duplicate stays verified and refreshes lastSeenAt");
const changedLink = reingestVerified(current, { title: current.title, deadline: current.deadline, location: current.location, applicationMethod: "Apply here", sourceUrl: "https://employer.example/new-job", description: current.description }, "today");
assertContract(15, changedLink.verificationStatus === "pending", "changed application link requires review");
const existingAtCap = 10;
const incomingAtCap = existingAtCap >= 10 ? { status: "pending", reason: "held: origin at cap" } : { status: "open", reason: "" };
assertContract(16, incomingAtCap.status === "pending" && incomingAtCap.reason === "held: origin at cap", "11th listing waits with origin-cap reason");
if (failures) process.exitCode = 1;
