import Link from "next/link";

import { CategoryArtwork } from "@/components/category-artwork";
import { SaveButton } from "@/components/save-button";
import { formatDate } from "@/lib/dates";

/** Listings published within this many days carry a "New" mark. */
export const NEW_FOR_DAYS = 7;

export function isNewListing(publicationDate: Date | string | null | undefined, now: Date): boolean {
  if (!publicationDate) return false;
  const age = now.getTime() - new Date(publicationDate).getTime();
  return age >= 0 && age <= NEW_FOR_DAYS * 86_400_000;
}

export type ScoreTier = "strong" | "good" | "fair";
export function scoreTier(score: number): ScoreTier {
  return score >= 85 ? "strong" : score >= 70 ? "good" : "fair";
}

export interface ScoreFirstCardProps {
  opportunityId: string;
  href: string;
  linkLabel: string;
  title: string;
  organization: string;
  location: string;
  workMode: string;
  category: string;
  categoryLabel: string;
  isNew: boolean;
  /** Null on the Opportunities page for listings that are not one of the person's matches. */
  score: number | null;
  deadline: Date | string | null;
  daysLeft: number | null;
}

/**
 * "Score first" card shared by matches and the Opportunities page: the match percentage sits in a coloured
 * block on the left (green strong, yellow good, neutral fair); a listing with no score shows its category artwork there.
 */
export function ScoreFirstCard(props: ScoreFirstCardProps): React.JSX.Element {
  const { score, daysLeft } = props;
  const urgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 3;
  const workMode = props.workMode && props.workMode !== "unknown" && props.workMode.toLowerCase() !== props.location.toLowerCase() ? props.workMode : null;
  const deadline = urgent
    ? `Closes in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`
    : props.deadline ? `Closes ${formatDate(props.deadline, { day: "numeric", month: "short" })}` : "Deadline not published";

  return (
    <article className="opp-card score-card">
      {score !== null
        ? <div className={`score-block score-${scoreTier(score)}`}><span className="score-value">{score}%</span><span className="text-[11px] font-bold">match</span></div>
        : <div className="score-block score-none"><CategoryArtwork category={props.category.trim().toLowerCase()} className="size-14" /></div>}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#8A6400]">{props.categoryLabel}{props.isNew ? <> · <span className="text-[#2F5A0A]">New</span></> : null}</span>
          <SaveButton opportunityId={props.opportunityId} />
        </div>
        <h2 className="clamp-2 -mt-1 text-base font-bold leading-snug text-ink">
          <Link className="stretch focus-visible:underline" href={props.href} aria-label={props.linkLabel}>{props.title}</Link>
        </h2>
        <p className="clamp-1 text-xs text-navy">{props.organization}<span className="capitalize"> · {props.location}{workMode ? ` · ${workMode}` : ""}</span></p>
        <span className={urgent ? "deadline-urgent" : "deadline-calm"}>{deadline}</span>
      </div>
    </article>
  );
}
