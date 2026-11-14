import Link from "next/link";
import type { OpportunityOrigin } from "@/core/entities/domain";
import { SaveButton } from "@/components/save-button";
import { formatDate } from "@/lib/dates";

export interface MatchCardProps {
  id: string;
  opportunityId: string;
  title: string;
  organization: string;
  origin?: OpportunityOrigin;
  categoryLabel?: string;
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

export function MatchCard(props: MatchCardProps): React.JSX.Element {
  const { daysLeft } = props;
  const relevantMatched = props.matched.filter((factor) => {
    const label = factor.label.toLowerCase();
    const detail = factor.detail.toLowerCase();
    return !label.includes("eligibility") && !detail.includes("no mandatory exclusion") && !detail.includes("mandatory eligibility checks") && !detail.includes("field of study") && !detail.includes("no field of study");
  });
  const reason = relevantMatched.find((factor) => preferredLabels.has(factor.label)) ?? relevantMatched[0];
  const urgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 3;
  const workMode = props.workMode && props.workMode !== "unknown" && props.workMode.toLowerCase() !== props.location.toLowerCase() ? props.workMode : null;
  const deadlineLabel = props.deadline
    ? `Closes ${formatDate(props.deadline, { day: "numeric", month: "short" })}`
    : "Deadline not published";
  return (
    <article className={`opp-card ${reason ? "with-reason" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="cat-pill">{props.categoryLabel ?? "Match"}</span>
        <SaveButton opportunityId={props.opportunityId} />
      </div>
      <div className="min-h-0 flex-1">
        <p className="clamp-1 text-xs font-semibold text-navy"><span>{props.organization}</span><span className="capitalize"> · {props.location}{workMode ? ` · ${workMode}` : ""}</span></p>
        <h2 className="clamp-2 mt-1 text-base font-bold leading-snug text-ink">
          <Link className="stretch focus-visible:underline" href={`/opportunity/${props.opportunityId}?from=matches`} aria-label={`View match: ${props.title}`}>{props.title}</Link>
        </h2>
        {reason && <p className="clamp-1 mt-1.5 text-xs text-navy"><strong className="font-semibold text-ink">Why it fits:</strong> {reason.detail}</p>}
      </div>
      <div className="opp-card-foot">
        <span className={urgent ? "font-bold text-[#9B1C1C]" : undefined}>{urgent ? `Closes in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}` : deadlineLabel}</span>
        <span className="match-score !text-xs">{props.score}% match</span>
      </div>
    </article>
  );
}
