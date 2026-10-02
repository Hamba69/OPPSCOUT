import Link from "next/link";
import type { OpportunityOrigin } from "@/core/entities/domain";

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

export function MatchCard(props: MatchCardProps): React.JSX.Element {
  const daysLeft = props.daysLeft;
  // Prefer skills / field / career factors for the card summary; fall back to any matched factors.
  const preferredLabels = new Set(["Skills", "Field of study", "Career direction", "Experience", "Education eligibility", "Location"]);
  const ranked = [
    ...props.matched.filter((f) => preferredLabels.has(f.label)),
    ...props.matched.filter((f) => !preferredLabels.has(f.label)),
  ];
  const highlights = ranked.slice(0, 3);
  const urgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 3;
  const deadlineLabel = props.deadline
    ? `Closes ${new Date(props.deadline).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}`
    : "Open until filled";
  return (
    <article className="card match-lift flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold leading-snug text-ink">{props.title}</h2>
          <p className="mt-0.5 text-sm font-medium text-navy">{props.organization}</p>
        </div>
        <span className="match-score shrink-0">{props.score}% match</span>
      </div>
      <p className="mt-2 text-xs font-semibold text-navy">
        {props.origin === "organization" ? "Posted through OppScout by the organization" : "Sourced for the OppScout catalog"}
      </p>
      <p className="mt-3 text-sm text-navy">
        <span className="capitalize">
          {props.location} · {props.workMode}
        </span>{" "}
        ·{" "}
        {urgent ? (
          <strong className="text-[#B3261E]">
            Closes in {daysLeft} {daysLeft === 1 ? "day" : "days"}
          </strong>
        ) : (
          deadlineLabel
        )}
      </p>
      {highlights.length > 0 && (
        <ul className="mt-3 space-y-2 rounded-2xl bg-butter px-4 py-3 text-sm leading-6 text-ink">
          {highlights.map((factor) => (
            <li key={`${factor.label}-${factor.detail}`}>
              <strong className="text-leaf">{factor.label}:</strong> {factor.detail}
            </li>
          ))}
        </ul>
      )}
      {props.missing.length > 0 && (
        <p className="mt-2 text-xs text-navy">
          To prepare: {props.missing.slice(0, 2).map((f) => f.label).join(" · ")}
          {props.missing.length > 2 ? "…" : ""}
        </p>
      )}
      <div className="mt-auto pt-4">
        <Link className="text-link" href={`/opportunity/${props.opportunityId}`}>
          View details
        </Link>
      </div>
    </article>
  );
}
