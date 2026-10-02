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
  const urgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 3;
  const deadlineLabel = props.deadline ? `Closes ${new Date(props.deadline).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}` : "Open until filled";
  return (
    <article className="card match-lift flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold leading-snug text-ink">{props.title}</h2>
          <p className="mt-0.5 text-sm font-medium text-navy">{props.organization}</p>
        </div>
        <span className="match-score shrink-0">{props.score}% match</span>
      </div>
      <p className="mt-3 text-sm text-navy">
        <span className="capitalize">{props.location} · {props.workMode}</span> · {urgent
          ? <strong className="text-[#B3261E]">Closes in {daysLeft} {daysLeft === 1 ? "day" : "days"}</strong>
          : deadlineLabel}
      </p>
      {fit && <p className="mt-3 rounded-2xl bg-butter px-4 py-3 text-sm leading-6 text-ink">{fit.detail}</p>}
      <div className="mt-auto pt-4">
        <Link className="button w-full" href={`/opportunity/${props.opportunityId}`}>View match</Link>
      </div>
    </article>
  );
}
