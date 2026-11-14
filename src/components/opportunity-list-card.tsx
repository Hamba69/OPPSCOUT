import Link from "next/link";

import type { OpportunityOrigin, VerificationStatus } from "@/core/entities/domain";
import { choiceLabel } from "@/services/profile/choices";

export interface OpportunityListItem {
  id: string; title: string; organization: string; category: string; location: string; workMode: string;
  deadline: Date | null; matchScore: number | null; origin: OpportunityOrigin; verificationStatus: VerificationStatus;
}

export function OpportunityListCard({ item, now }: { item: OpportunityListItem; now: Date }): React.JSX.Element {
  const days = item.deadline ? Math.ceil((item.deadline.getTime() - now.getTime()) / 86_400_000) : null;
  const urgent = days !== null && days > 0 && days <= 3;
  const workMode = item.workMode && item.workMode !== "unknown" && item.workMode.toLowerCase() !== item.location.toLowerCase() ? item.workMode : null;
  const deadline = item.deadline ? `Closes ${item.deadline.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}` : "Deadline not published";

  return <article className="opp-card">
    <div className="flex items-center justify-between gap-2">
      <span className="cat-pill">{choiceLabel(item.category)}</span>
      {item.matchScore !== null && <span className="match-score shrink-0 !text-xs">{item.matchScore}% match</span>}
    </div>
    <div className="min-h-0 flex-1">
      <p className="clamp-1 text-xs font-semibold text-navy"><span>{item.organization}</span><span className="capitalize"> · {item.location}{workMode ? ` · ${workMode}` : ""}</span></p>
      <h2 className="clamp-2 mt-1 text-base font-bold leading-snug text-ink"><Link href={`/opportunity/${item.id}`} className="stretch focus-visible:underline">{item.title}</Link></h2>
    </div>
    <div className="opp-card-foot">
      {urgent ? <strong className="text-[#9B1C1C]">Closes in {days} {days === 1 ? "day" : "days"}</strong> : <span>{deadline}</span>}
      <span aria-hidden="true" className="font-semibold">View details</span>
    </div>
  </article>;
}
