import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { OpportunityOrigin, VerificationStatus } from "@/core/entities/domain";
import { choiceLabel } from "@/services/profile/choices";

export interface OpportunityListItem {
  id: string; title: string; organization: string; category: string; location: string; workMode: string;
  deadline: Date | null; matchScore: number | null; origin: OpportunityOrigin; verificationStatus: VerificationStatus;
}

export function OpportunityListCard({ item, now }: { item: OpportunityListItem; now: Date }): React.JSX.Element {
  const days = item.deadline ? Math.ceil((item.deadline.getTime() - now.getTime()) / 86_400_000) : null;
  const urgent = days !== null && days > 0 && days <= 3;
  const workMode = item.workMode === "unknown" ? "Work mode not stated" : item.workMode;
  const deadline = item.deadline ? `Closes ${item.deadline.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}` : "Open until filled";
  const verified = item.verificationStatus === "verified";

  return <article className="card flex h-full flex-col">
    <div className="flex items-start justify-between gap-3">
      <span className="pill capitalize">{choiceLabel(item.category)}</span>
      {verified
        ? item.matchScore !== null && <span className="match-score shrink-0">{item.matchScore}% match</span>
        : <StatusBadge value="pending" />}
    </div>
    <h2 className="mt-3 text-lg font-extrabold leading-snug text-ink">{item.title}</h2>
    <p className="mt-0.5 text-sm font-medium text-navy">{item.organization}</p>
    <p className="mt-2 text-xs font-semibold text-navy">{item.origin === "organization" ? "Posted through OppScout by the organization" : "Sourced for the OppScout catalog"}</p>
    {!verified && <p className="mt-2 text-xs leading-5 text-navy">This catalog listing is awaiting review. Its source and details have not been verified.</p>}
    <p className="mt-3 text-sm text-navy"><span className="capitalize">{item.location} · {workMode}</span> · {urgent ? <strong className="text-[#B3261E]">Closes in {days} {days === 1 ? "day" : "days"}</strong> : deadline}</p>
    <div className="mt-auto pt-4">
      {verified && <Link href={`/opportunity/${item.id}`} className="text-link">View details</Link>}
    </div>
  </article>;
}
