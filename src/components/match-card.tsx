import Link from "next/link";
import type { OpportunityOrigin } from "@/core/entities/domain";
import { SaveButton } from "@/components/save-button";

export interface MatchCardProps {
  id: string;
  opportunityId: string;
  title: string;
  organization: string;
  origin?: OpportunityOrigin;
  score: number;
  deadline: string | null;
  location: string;
  workMode: string;
  matched: { label: string; detail: string }[];
  missing: { label: string; detail: string }[];
  sourceUrl: string;
  checkedAt: string;
  publicationDate: string;
  daysLeft: number | null;
}

const preferredLabels = new Set(["Skills", "Field of study", "Career direction", "Experience", "Education eligibility", "Location"]);

const iconProps = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export function MatchCard(props: MatchCardProps): React.JSX.Element {
  const { daysLeft } = props;
  const relevantMatched = props.matched.filter((factor) => {
    const label = factor.label.toLowerCase();
    const detail = factor.detail.toLowerCase();
    return !label.includes("eligibility") && !detail.includes("no mandatory exclusion") && !detail.includes("mandatory eligibility checks") && !detail.includes("field of study") && !detail.includes("no field of study");
  });
  const reason = relevantMatched.find((factor) => preferredLabels.has(factor.label)) ?? relevantMatched[0];
  const urgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 3;
  const workMode = props.workMode && props.workMode !== "unknown" ? props.workMode : null;
  const deadlineLabel = props.deadline
    ? `Closes ${new Date(props.deadline).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}`
    : "Deadline not published";
  return (
    <article className="card match-lift flex flex-col !rounded-2xl !shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-navy">{props.organization}</p>
          <h2 className="mt-0.5 text-lg font-bold leading-snug text-ink">{props.title}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-leaf/10 px-3 py-1 text-[13px] font-bold text-[#145347]">{props.score}% match</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-navy">
        <span className="inline-flex items-center gap-1.5 capitalize">
          <svg {...iconProps}><path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
          {props.location}{workMode ? ` · ${workMode}` : ""}
        </span>
        <span className={`inline-flex items-center gap-1.5 ${urgent ? "font-bold text-[#B3261E]" : ""}`}>
          <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {urgent ? `Closes in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}` : deadlineLabel}
        </span>
      </div>
      {reason && <p className="mt-3.5 text-sm leading-6 text-ink"><strong className="font-bold text-[#145347]">Why it fits:</strong> {reason.detail}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/[.08] pt-3.5">
        <span />
        <div className="flex gap-2">
          <SaveButton opportunityId={props.opportunityId} />
          <Link className="button !min-h-11 !px-4" href={`/opportunity/${props.opportunityId}?from=matches`}>View details</Link>
        </div>
      </div>
    </article>
  );
}
