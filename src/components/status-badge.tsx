const tones: Record<string, string> = {
  verified: "bg-leaf/10 text-leaf", open: "bg-leaf/10 text-leaf", applied: "bg-leaf/10 text-leaf",
  pending: "bg-honey/40 text-ink", closing_soon: "bg-honey/40 text-ink", saved: "bg-honey/40 text-ink",
  flagged: "bg-coral/30 text-ink", stale: "bg-coral/30 text-ink", closed: "bg-ink/10 text-navy", removed: "bg-ink/10 text-navy", unverified: "bg-ink/10 text-navy", expired: "bg-ink/10 text-navy",
};
const labels: Record<string, string> = { pending: "Awaiting review", closing_soon: "Closing soon", unverified: "Not verified" };

export function StatusBadge({ value }: { value: string }): React.JSX.Element {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${tones[value] ?? "bg-ink/10 text-navy"}`}>{labels[value] ?? value.replace("_", " ")}</span>;
}
