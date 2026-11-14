import Link from "next/link";

import { Icon } from "@/components/app-shell";
import { choiceLabel } from "@/services/profile/choices";

import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function SavedPage(): Promise<React.JSX.Element> {
  const [repository, auth] = await Promise.all([getRepository(), requirePageAuth(["user"])]);
  const { userId } = auth;
  const saved = await repository.listSaved(userId);
  const opportunities = new Map((await repository.listOpportunities({ opportunityIds: saved.map((item) => item.opportunityId) })).map((opportunity) => [opportunity.id, opportunity]));
  const items = saved.flatMap((item) => {
    const opportunity = opportunities.get(item.opportunityId);
    return opportunity && isUserVisibleOpportunity(opportunity) ? [{ item, opportunity }] : [];
  });
  const now = new Date().getTime();
  const daysUntil = (deadline: Date | null | undefined): number | null => deadline ? Math.ceil((deadline.getTime() - now) / 86_400_000) : null;
  const next = items
    .filter(({ opportunity }) => { const days = daysUntil(opportunity.deadline); return days !== null && days > 0; })
    .sort((a, b) => a.opportunity.deadline!.getTime() - b.opportunity.deadline!.getTime())[0];
  const nextDays = next ? daysUntil(next.opportunity.deadline)! : null;
  return (
    <main className="animate-in flex flex-col gap-6">
      <header className="title-card">
        <h1>Saved Opportunities</h1>
      </header>
      {next && nextDays !== null && (
        <section aria-label="Next deadline" className="surface flex flex-wrap items-center gap-4 !rounded-3xl !border-[1.5px] !border-[#F5D76E] !px-5 !py-4">
          <span className="icon-chip !size-11 !rounded-[14px]"><Icon name="clock" size={20} /></span>
          <div className="min-w-[200px] flex-1">
            <p className="text-xs font-bold text-[#9B1C1C]">{nextDays} {nextDays === 1 ? "day" : "days"} left</p>
            <p className="mt-0.5 text-base font-bold text-ink">{next.opportunity.title} · {next.opportunity.organization?.name ?? next.opportunity.organizationName ?? "Source organization"}</p>
          </div>
          <Link className="button !min-h-11" href={`/opportunity/${next.opportunity.id}`}><Icon name="chevron" size={15} strokeWidth={2.2} />View details</Link>
        </section>
      )}
      {items.length ? <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ item, opportunity }) => {
          const daysLeft = daysUntil(opportunity.deadline);
          const urgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 3;
          const countdown = opportunity.deadline
            ? daysLeft !== null && daysLeft > 0
              ? urgent ? `Closes in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}` : `${daysLeft} days left`
              : `Closed ${formatDate(opportunity.deadline, { dateStyle: "medium" })}`
            : "Deadline not published";

          return (
            <article key={item.id} className="opp-card">
              <div className="flex items-center justify-between gap-2">
                <span className="cat-pill">{choiceLabel(opportunity.category)}</span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold capitalize ${item.status === "applied" ? "text-[#145347]" : "text-[#6B4E00]"}`}>
                  <Icon name={item.status === "applied" ? "check" : "saved"} size={13} strokeWidth={2.4} />{item.status}
                </span>
              </div>
              <div className="min-h-0 flex-1">
                <p className="clamp-1 text-xs font-semibold text-navy">{opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization"}</p>
                <h2 className="clamp-2 mt-1 text-base font-bold leading-snug text-ink"><Link className="stretch focus-visible:underline" href={`/opportunity/${opportunity.id}`}>{opportunity.title}</Link></h2>
              </div>
              <div className="opp-card-foot">
                <span className={urgent ? "font-bold text-[#9B1C1C]" : undefined}>{countdown}</span>
                <span aria-hidden="true" className="font-semibold">View details</span>
              </div>
            </article>
          );
        })}
      </div> : (
        <section className="surface py-10 text-center">
          <div className="flex justify-center"><span className="orb block size-14" aria-hidden="true" /></div>
          <h2 className="mt-4 text-xl font-extrabold text-ink">Your shortlist is empty</h2>
          <p className="mt-2 text-navy">Found something promising? Save a match to keep its deadline and next steps together here.</p>
          <Link href="/feed" className="button mt-5">Browse matches</Link>
        </section>
      )}
    </main>
  );
}
