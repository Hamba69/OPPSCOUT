import type { OpportunityOrigin } from "@/core/entities/domain";
import { ScoreFirstCard } from "@/components/score-first-card";

export interface MatchCardProps {
  id: string;
  opportunityId: string;
  title: string;
  organization: string;
  origin?: OpportunityOrigin;
  category?: string;
  categoryLabel?: string;
  score: number;
  deadline: string | null;
  location: string;
  workMode: string;
  sourceUrl: string;
  checkedAt: string;
  publicationDate: string;
  daysLeft: number | null;
  /** Worked out on the server (published in the last week) so server and browser render the same. */
  isNew?: boolean;
}

// Seekers see only the match percentage. The engine's matched/missing factors are still computed,
// stored and available to admins, but are deliberately not passed to this card or the browser.
export function MatchCard(props: MatchCardProps): React.JSX.Element {
  return <ScoreFirstCard opportunityId={props.opportunityId} href={`/opportunity/${props.opportunityId}?from=matches`} linkLabel={`View match: ${props.title}`}
    title={props.title} organization={props.organization} location={props.location} workMode={props.workMode}
    category={props.category ?? ""} categoryLabel={props.categoryLabel ?? "Match"} isNew={props.isNew ?? false}
    score={props.score} deadline={props.deadline} daysLeft={props.daysLeft} />;
}
