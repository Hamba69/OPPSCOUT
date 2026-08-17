export interface SloTarget {
  metric: string;
  target: number | null;
  unit: "percent" | "hours";
  alertThreshold: number;
  direction: "at-least" | "at-most";
  owner: string;
}

export const SLO_TARGETS = {
  coreApi: {
    metric: "Core API uptime",
    target: 99.9,
    unit: "percent",
    alertThreshold: 99.8,
    direction: "at-least",
    owner: "platform",
  },
  notificationDelivery: {
    metric: "Email/SMS delivery",
    target: 99,
    unit: "percent",
    alertThreshold: 98.5,
    direction: "at-least",
    owner: "notifications",
  },
  dataFreshness: {
    metric: "Correct listing freshness",
    target: 99,
    unit: "percent",
    alertThreshold: 98.5,
    direction: "at-least",
    owner: "ingestion",
  },
  matchRelevance: {
    metric: "Top-three match engagement",
    target: null,
    unit: "percent",
    alertThreshold: 0,
    direction: "at-least",
    owner: "matching",
  },
  ussdCompletion: {
    metric: "USSD session completion",
    target: 95,
    unit: "percent",
    alertThreshold: 94,
    direction: "at-least",
    owner: "ussd",
  },
  trustTurnaround: {
    metric: "Trust review turnaround",
    target: 48,
    unit: "hours",
    alertThreshold: 42,
    direction: "at-most",
    owner: "trust",
  },
} as const satisfies Record<string, SloTarget>;
