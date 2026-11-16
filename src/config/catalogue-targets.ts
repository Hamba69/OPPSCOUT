/**
 * How big the live catalogue should be, and how much research keeps it there.
 * Read by `npm run seed:check`, which compares live records with these targets and writes
 * research-plan.json: how many of each type to find this week. See docs/catalogue/ROUTINE.md.
 *
 * The arithmetic is Little's law: records visible = records added per day x days each stays visible.
 * Jobs close fast, so most research effort goes to replacing them.
 */
export type CataloguePhase = "build" | "fill" | "steady";

export interface CategoryTarget {
  /** Visible records wanted at steady state. */
  target: number;
  /** Typical days a record stays visible after approval (until its deadline or removal). Re-measure monthly. */
  daysVisible: number;
}

// Sized for one catalogue owner researching about an hour a day (roughly 10 approvals a day).
// Raise the targets when more people help with research.
export const CATEGORY_TARGETS: Readonly<Record<string, CategoryTarget>> = {
  job: { target: 60, daysVisible: 12 },
  internship: { target: 20, daysVisible: 21 },
  training: { target: 15, daysVisible: 21 },
  scholarship: { target: 30, daysVisible: 45 },
  fellowship: { target: 10, daysVisible: 40 },
  grant: { target: 15, daysVisible: 35 },
};

export const CATALOGUE_PHASES: Readonly<Record<CataloguePhase, { share: number; minVisible: number; label: string }>> = {
  build: { share: 0.6, minVisible: 25, label: "Weeks 1-2: reach about 90 live listings" },
  fill: { share: 1, minVisible: 80, label: "Weeks 3-4: reach 150 and close coverage gaps" },
  steady: { share: 1, minVisible: 110, label: "Week 5 onward: hold about 150" },
};

/** Share of researched candidates that end up approved. Start at 0.6; replace with the measured funnel rate. */
export const DEFAULT_PASS_RATE = 0.6;

export interface CategoryPlan {
  category: string;
  visible: number;
  target: number;
  /** Approvals per week needed just to replace records that close. */
  weeklyReplacement: number;
  /** Approvals needed this week: replacement plus the shortfall (capped to a quarter of the target per week, so one person can keep up). */
  approvalsThisWeek: number;
  /** Listings to research this week to get those approvals. */
  candidatesThisWeek: number;
}

export function researchPlan(visibleByCategory: ReadonlyMap<string, number>, phase: CataloguePhase, passRate = DEFAULT_PASS_RATE): CategoryPlan[] {
  const { share } = CATALOGUE_PHASES[phase];
  return Object.entries(CATEGORY_TARGETS).map(([category, { target: fullTarget, daysVisible }]) => {
    const target = Math.round(fullTarget * share);
    const visible = visibleByCategory.get(category) ?? 0;
    const weeklyReplacement = Math.ceil((target * 7) / daysVisible);
    const shortfall = Math.max(0, target - visible);
    const approvalsThisWeek = weeklyReplacement + Math.min(shortfall, Math.ceil(fullTarget / 4));
    return { category, visible, target, weeklyReplacement, approvalsThisWeek, candidatesThisWeek: Math.ceil(approvalsThisWeek / Math.max(passRate, 0.1)) };
  });
}
