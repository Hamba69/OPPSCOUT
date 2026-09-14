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
  return <article className="card match-lift flex h-full flex-col"><div className="flex items-start justify-between gap-4"><div><span className="pill">✓ Verified organization</span><h2 className="mt-3 text-xl font-black">{props.title}</h2><p className="mt-1 text-sm font-bold text-ink/60">{props.organization}</p></div><div className="score-enter grid size-16 shrink-0 place-items-center rounded-full border-4 border-sun bg-butter text-lg font-black" aria-label={`${props.score} percent match`}>{props.score}%</div></div><p className="mt-4 text-sm text-ink/70">{props.location} · {props.workMode} · closes {new Date(props.deadline).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}</p>{daysLeft > 0 && daysLeft <= 3 && <p className="mt-3 self-start rounded-full bg-coral/15 px-3 py-1 text-xs font-extrabold">Closes in {daysLeft} {daysLeft === 1 ? "day" : "days"}</p>}<div className="mt-5 rounded-2xl bg-butter/70 p-4"><p className="text-xs font-black uppercase tracking-wide">Why it fits</p><p className="mt-1 text-sm">{fit?.detail}</p></div><div className="mt-3 rounded-2xl bg-ink/[.035] p-4"><p className="text-xs font-black uppercase tracking-wide">One thing to mind</p><p className="mt-1 text-sm">{props.missing[0]?.detail}</p></div><p className="mt-4 text-xs text-ink/45">Published {new Date(props.publicationDate).toLocaleDateString("en-UG")} · source checked {new Date(props.checkedAt).toLocaleDateString("en-UG")}</p><div className="mt-auto flex gap-2 pt-5"><Link className="button flex-1" href={`/opportunity/${props.opportunityId}`}>View match</Link><a className="button-secondary" href={props.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a></div></article>;
}
