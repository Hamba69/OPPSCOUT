import type { Opportunity } from "@/core/entities/domain";
import { formatDate } from "@/lib/dates";
import { choiceLabel } from "@/services/profile/choices";
import { NO_DEADLINE_LABEL } from "@/lib/deadline-label";

const WORK_MODE: Record<string, string> = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" };
const RULE_FIELD: Record<string, string> = { graduationStatus: "Study status", location: "Where you live", language: "Language" };

/**
 * "Closes 4 Dec 2026", or "Open until filled". The countdown ("· 11 days left", "· last day") and the
 * urgent colour are only for opportunities the seeker has saved, i.e. ones they are actually pursuing.
 */
export function closingText(opportunity: Pick<Opportunity, "deadline" | "deadlineType">, now = new Date(), { countdown = false }: { countdown?: boolean } = {}): { label: string; urgent: boolean } {
  if (!opportunity.deadline) return { label: NO_DEADLINE_LABEL, urgent: false };
  const days = Math.ceil((new Date(opportunity.deadline).getTime() - now.getTime()) / 86_400_000);
  const date = formatDate(opportunity.deadline, { day: "numeric", month: "short", year: "numeric" });
  if (days <= 0) return { label: `Closed ${date}`, urgent: true };
  if (!countdown) return { label: `Closes ${date}`, urgent: false };
  if (days === 1) return { label: `Closes ${date} · last day`, urgent: true };
  return { label: `Closes ${date} · ${days} days left`, urgent: days <= 7 };
}

function years(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const value = Math.round((months / 12) * 10) / 10;
  return `${value} year${value === 1 ? "" : "s"}`;
}

/** Everything an applicant needs before clicking through: deadline, place, who can apply, skills, how to apply. */
export function eligibilityLines(eligibility: Opportunity["eligibility"]): string[] {
  const lines: string[] = [];
  if (eligibility.educationLevels?.length) lines.push(`Education: ${eligibility.educationLevels.map(choiceLabel).join(", ")}`);
  if (eligibility.fieldsOfStudy?.length) lines.push(`Field of study: ${eligibility.fieldsOfStudy.map(choiceLabel).join(", ")}`);
  const { minimumAge: min, maximumAge: max } = eligibility;
  if (min !== undefined && max !== undefined) lines.push(`Age: ${min} to ${max}`);
  else if (min !== undefined) lines.push(`Age: ${min} or older`);
  else if (max !== undefined) lines.push(`Age: up to ${max}`);
  if (eligibility.minimumExperienceMonths) lines.push(`Experience: at least ${years(eligibility.minimumExperienceMonths)}`);
  if (eligibility.mandatoryCertifications?.length) lines.push(`Certifications: ${eligibility.mandatoryCertifications.join(", ")}`);
  for (const rule of eligibility.programmeRules ?? []) lines.push(`${RULE_FIELD[rule.field] ?? rule.label}: ${rule.allowedValues.join(", ")}`);
  for (const requirement of eligibility.additionalRequirements ?? []) lines.push(requirement);
  return lines;
}

export function OpportunityFacts({ opportunity, saved = false, now = new Date() }: { opportunity: Opportunity; saved?: boolean; now?: Date }): React.JSX.Element {
  const closing = closingText(opportunity, now, { countdown: saved });
  const workMode = WORK_MODE[opportunity.workMode];
  const who = eligibilityLines(opportunity.eligibility);
  const facts: Array<[string, string, boolean?]> = [
    ["Closing date", closing.label, closing.urgent],
    ["Location", opportunity.location],
    ...(workMode && workMode.toLowerCase() !== opportunity.location.toLowerCase() ? [["Work arrangement", workMode] as [string, string]] : []),
    ["Type", choiceLabel(opportunity.category)],
  ];
  return <>
    <section className="surface" aria-labelledby="key-facts">
      <h2 id="key-facts" className="surface-title">Key facts</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {facts.map(([label, value, urgent]) => <div key={label} className="rounded-2xl glass-inset px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-[.06em] text-[#5B6A80]">{label}</dt>
          <dd className={`mt-0.5 text-[15px] font-semibold ${urgent ? "text-[#9B1C1C]" : "text-ink"}`}>{value}</dd>
        </div>)}
      </dl>
    </section>
    {(who.length > 0 || opportunity.requiredSkills.length > 0 || opportunity.preferredSkills.length > 0) && <section className="surface" aria-labelledby="who-can-apply">
      <h2 id="who-can-apply" className="surface-title">Who can apply</h2>
      {who.length > 0 && <ul className="mt-3 list-inside list-disc space-y-1 text-[15px] leading-7 text-ink">{who.map((line) => <li key={line}>{line}</li>)}</ul>}
      {opportunity.requiredSkills.length > 0 && <div className="mt-4"><h3 className="text-sm font-bold text-navy">Required skills</h3><div className="mt-2 flex flex-wrap gap-2">{opportunity.requiredSkills.map((skill) => <span key={skill} className="cat-pill">{choiceLabel(skill)}</span>)}</div></div>}
      {opportunity.preferredSkills.length > 0 && <div className="mt-4"><h3 className="text-sm font-bold text-navy">Nice to have</h3><div className="mt-2 flex flex-wrap gap-2">{opportunity.preferredSkills.map((skill) => <span key={skill} className="chip">{choiceLabel(skill)}</span>)}</div></div>}
    </section>}
  </>;
}

/** The provider's own instructions, shown after the description. */
export function HowToApply({ opportunity }: { opportunity: Opportunity }): React.JSX.Element | null {
  if (!opportunity.applicationMethod?.trim()) return null;
  return <section className="surface" aria-labelledby="how-to-apply">
    <h2 id="how-to-apply" className="surface-title">How to apply</h2>
    <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-ink">{opportunity.applicationMethod}</p>
    <p className="mt-3 text-sm text-navy">Apply on the organisation&apos;s own site. You should never be asked to pay to apply; if you are, use “Report a problem” above.</p>
  </section>;
}
