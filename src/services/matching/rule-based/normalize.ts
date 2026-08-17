export function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
}

export function includesNormalized(values: string[], expected: string): boolean {
  const target = normalize(expected);
  return values.some((value) => {
    const candidate = normalize(value);
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  });
}
