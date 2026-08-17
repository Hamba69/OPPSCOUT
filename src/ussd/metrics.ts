const metrics = globalThis as unknown as { oppScoutUssdOutcomes?: boolean[] };
metrics.oppScoutUssdOutcomes ??= [];
export function recordUssdOutcome(completed: boolean): void { metrics.oppScoutUssdOutcomes!.push(completed); if (metrics.oppScoutUssdOutcomes!.length > 10_000) metrics.oppScoutUssdOutcomes!.shift(); }
export function getUssdCompletionMetric(): { value: number | null; samples: number } { const values = metrics.oppScoutUssdOutcomes!; return { value: values.length ? Number(((values.filter(Boolean).length / values.length) * 100).toFixed(2)) : null, samples: values.length }; }
