import Link from "next/link";

export interface MatchCardProps {
  id: string;
  opportunityId: string;
  title: string;
  organization: string;
  score: number;
  deadline: string;
  location: string;
  workMode: string;
  matched: { label: string; detail: string }[];
  missing: { label: string; detail: string }[];
  sourceUrl: string;
  checkedAt: string;
}

export function MatchCard(props: MatchCardProps): React.JSX.Element {
  return (
    <article className="card flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div><span className="pill">✓ Verified</span><h2 className="mt-3 text-xl font-black">{props.title}</h2><p className="mt-1 text-sm font-bold text-ink/60">{props.organization}</p></div>
        <div className="grid size-16 shrink-0 place-items-center rounded-full border-4 border-sun bg-butter text-lg font-black" aria-label={`${props.score} percent match`}>{props.score}%</div>
      </div>
      <p className="mt-4 text-sm text-ink/70">{props.location} · {props.workMode} · closes {new Date(props.deadline).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}</p>
      <div className="mt-5 rounded-2xl bg-butter/70 p-4"><p className="text-xs font-black uppercase tracking-wide">Why it fits</p><p className="mt-1 text-sm">{props.matched[0]?.detail}</p></div>
      <div className="mt-3 rounded-2xl bg-ink/[.035] p-4"><p className="text-xs font-black uppercase tracking-wide">One thing to mind</p><p className="mt-1 text-sm">{props.missing[0]?.detail}</p></div>
      <p className="mt-4 text-xs text-ink/45">Source checked {new Date(props.checkedAt).toLocaleDateString("en-UG")}</p>
      <div className="mt-auto flex gap-2 pt-5"><Link className="button flex-1" href={`/opportunity/${props.opportunityId}`}>View match</Link><a className="button-secondary" href={props.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a></div>
    </article>
  );
}
