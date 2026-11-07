import Link from "next/link";

import { Logo } from "@/components/logo";

import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";
import { buildRankedFeed } from "@/services/matching/feed";

export const dynamic = "force-dynamic";

export default async function SavedPage(): Promise<React.JSX.Element> {
  const [repository, auth] = await Promise.all([getRepository(), requirePageAuth(["user"])]);
  const { userId } = auth;
  const saved = await repository.listSaved(userId);
  const opportunities = new Map((await repository.listOpportunities({ opportunityIds: saved.map((item) => item.opportunityId) })).map((opportunity) => [opportunity.id, opportunity]));
  const visibleOpportunities = [...opportunities.values()].filter((opportunity) => isUserVisibleOpportunity(opportunity));
  const matches = await buildRankedFeed(repository, userId, new Date(), undefined, {
    persist: false,
    telemetry: false,
    opportunities: visibleOpportunities,
    opportunityIds: new Set(visibleOpportunities.map((opportunity) => opportunity.id)),
  });
  const relevantIds = new Set(matches.map((match) => match.opportunityId));
  const items = saved.flatMap((item) => {
    const opportunity = opportunities.get(item.opportunityId);
    return opportunity && relevantIds.has(opportunity.id) ? [{ item, opportunity }] : [];
  });
  return (
    <main className="page-shell animate-in sm:!py-10">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Saved Opportunities</h1>
        <p className="mt-1 text-sm text-navy">Your shortlist with the next deadline clearly in view.</p>
      </header>
      <div className="mt-8 space-y-4">
        {items.length ? items.map(({ item, opportunity }) => {
          const daysLeft = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - Date.now()) / 86_400_000) : null;
          const countdown = opportunity.deadline
            ? daysLeft !== null && daysLeft > 0
              ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`
              : `Closed ${opportunity.deadline.toLocaleDateString("en-UG", { dateStyle: "medium" })}`
            : "Deadline not published";

          return (
            <article key={item.id} className="card match-lift !rounded-2xl !shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className={`pill capitalize ${item.status === "applied" ? "!border-leaf/40 !bg-leaf/10 !text-leaf" : ""}`}>{item.status}</span>
                <span className="rounded-full bg-butter px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-navy">{countdown}</span>
              </div>
              <h2 className="mt-3 text-xl font-extrabold text-ink">{opportunity.title}</h2>
              <p className="mt-2 text-sm leading-6 text-navy">{opportunity.description?.trim() || "Official opportunity details are available on the listing page."}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/[.08] pt-3">
                <p className="text-sm font-medium text-navy">{opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization"}</p>
                <Link className="button-secondary" href={`/opportunity/${opportunity.id}`}>View details</Link>
              </div>
            </article>
          );
        }) : (
          <section className="card bg-butter text-center">
            <div className="flex justify-center"><Logo size={56} /></div>
            <h2 className="mt-3 text-xl font-extrabold text-ink">Your shortlist is empty</h2>
            <p className="mt-2 text-navy">Found something promising? Save a match to keep its deadline and next steps together here.</p>
            <Link href="/feed" className="button mt-5">Browse matches</Link>
          </section>
        )}
      </div>
    </main>
  );
}
