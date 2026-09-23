import Link from "next/link";

export interface MatchCardProps {
  id: string; opportunityId: string; title: string; organization: string; score: number;
  deadline: string; location: string; workMode: string;
  matched: { label: string; detail: string }[]; missing: { label: string; detail: string }[];
  sourceUrl: string; checkedAt: string; publicationDate: string;
  daysLeft: number;
}

export function MatchCard(props: MatchCardProps): React.JSX.Element {
  const daysLeft = props.daysLeft;
  const fit = props.matched.find((factor) => factor.label === "Skills") ?? props.matched[0];
  const deadlineLabel = new Date(props.deadline).toLocaleDateString("en-UG", { day: "numeric", month: "short" });
  return (
    <article className="card match-lift relative flex h-full flex-col">
      <div className="score-enter absolute -right-2 -top-2"><span className="rating-pill">★ {props.score}%</span></div>
      <span className="badge-verified self-start">✓ Verified organization</span>
      <h2 className="mt-3 text-xl font-extrabold leading-snug">{props.title}</h2>
      <p className="mt-1 text-sm font-semibold text-muted">{props.organization}</p>

      <div className="mt-4 flex gap-3">
        <div className="stat-badge flex-1"><span className="stat-value">{props.workMode}</span><span className="stat-label">Mode</span></div>
        <div className="stat-badge flex-1"><span className="stat-value">{props.location}</span><span className="stat-label">Where</span></div>
        <div className="stat-badge flex-1"><span className="stat-value">{deadlineLabel}</span><span className="stat-label">Deadline</span></div>
      </div>
      {daysLeft > 0 && daysLeft <= 3 && <p className="badge-urgent mt-3 self-start">⏱ Closes in {daysLeft} {daysLeft === 1 ? "day" : "days"}</p>}

      <div className="mt-5 rounded-2xl bg-butter/70 p-4"><p className="text-xs font-bold uppercase tracking-wide text-ink/70">Why it fits</p><p className="mt-1 text-sm">{fit?.detail}</p></div>
      <div className="mt-3 rounded-2xl bg-ink/[.035] p-4"><p className="text-xs font-bold uppercase tracking-wide">One thing to mind</p><p className="mt-1 text-sm">{props.missing[0]?.detail}</p></div>
      <p className="mt-4 text-xs text-muted">Published {new Date(props.publicationDate).toLocaleDateString("en-UG")} · source checked {new Date(props.checkedAt).toLocaleDateString("en-UG")}</p>

      <div className="mt-auto flex gap-2 pt-5">
        <Link className="button flex-1" href={`/opportunity/${props.opportunityId}`}>View match</Link>
        <a className="button-secondary" href={props.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a>
      </div>
    </article>
  );
}
