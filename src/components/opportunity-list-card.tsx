import type { OpportunityOrigin, VerificationStatus } from "@/core/entities/domain";
import { ScoreFirstCard, isNewListing } from "@/components/score-first-card";
import { choiceLabel } from "@/services/profile/choices";

export interface OpportunityListItem {
  id: string; title: string; organization: string; category: string; location: string; workMode: string;
  deadline: Date | null; matchScore: number | null; origin: OpportunityOrigin; verificationStatus: VerificationStatus;
  publicationDate?: Date | null;
  /** Lower-case text used for in-browser search. */
  search?: string;
}

export function OpportunityListCard({ item, now }: { item: OpportunityListItem; now: Date }): React.JSX.Element {
  const daysLeft = item.deadline ? Math.ceil((item.deadline.getTime() - now.getTime()) / 86_400_000) : null;
  return <ScoreFirstCard opportunityId={item.id} href={`/opportunity/${item.id}`} linkLabel={item.title}
    title={item.title} organization={item.organization} location={item.location} workMode={item.workMode}
    category={item.category} categoryLabel={choiceLabel(item.category)} isNew={isNewListing(item.publicationDate, now)}
    score={item.matchScore} deadline={item.deadline} daysLeft={daysLeft} />;
}
