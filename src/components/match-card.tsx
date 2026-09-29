import Link from "next/link";

export interface MatchCardProps {
  id: string; opportunityId: string; title: string; organization: string; score: number;
  deadline: string | null; location: string; workMode: string;
  matched: { label: string; detail: string }[]; missing: { label: string; detail: string }[];
  sourceUrl: string; checkedAt: string; publicationDate: string;
  daysLeft: number | null;
}

export function MatchCard(props: MatchCardProps): React.JSX.Element {
  const daysLeft = props.daysLeft;
  const fit = props.matched.find((factor) => factor.label === "Skills") ?? props.matched[0];
  const gap = props.missing[0];
  const deadlineLabel = props.deadline ? new Date(props.deadline).toLocaleDateString("en-UG", { day: "numeric", month: "short" }) : "Rolling";
  return (
    <article className="card match-lift flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <span className="badge-verified">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
          Verified organization
        </span>
        <span className="match-score">{props.score}% match</span>
      </div>
      <h2 className="mt-3 text-lg font-extrabold leading-snug text-ink">{props.title}</h2>
      <p className="mt-1 text-sm font-medium text-navy">{props.organization}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="stat-badge"><span className="stat-value">{props.workMode}</span><span className="stat-label">Work mode</span></div>
        <div className="stat-badge"><span className="stat-value">{props.location}</span><span className="stat-label">Location</span></div>
        <div className="stat-badge"><span className="stat-value">{deadlineLabel}</span><span className="stat-label">Deadline</span></div>
      </div>
      {daysLeft !== null && daysLeft > 0 && daysLeft <= 3 && <p className="badge-urgent mt-3 self-start">Closes in {daysLeft} {daysLeft === 1 ? "day" : "days"}</p>}

      <div className="mt-4 rounded-2xl bg-butter p-4"><p className="text-sm font-bold text-ink">Why it fits</p><p className="mt-1 text-sm text-navy">{fit?.detail}</p></div>
      {gap && <div className="mt-3 rounded-2xl bg-ink/[.04] p-4"><p className="text-sm font-bold text-ink">One thing to prepare</p><p className="mt-1 text-sm text-navy">{gap.detail}</p></div>}
      <p className="mt-4 text-xs text-navy">Published {new Date(props.publicationDate).toLocaleDateString("en-UG")}. Source checked {new Date(props.checkedAt).toLocaleDateString("en-UG")}.</p>

      <div className="mt-auto flex gap-2 pt-5">
        <Link className="button flex-1" href={`/opportunity/${props.opportunityId}`}>View match</Link>
        <a className="button-secondary" href={props.sourceUrl} target="_blank" rel="noreferrer">
          Official source
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
        </a>
      </div>
    </article>
  );
}
