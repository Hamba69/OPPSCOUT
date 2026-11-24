import { isMatchScore } from "@/config/match-threshold";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/back-button";
import { scoreTier } from "@/components/score-first-card";
import { choiceLabel } from "@/services/profile/choices";
import { OpportunityActions } from "@/components/opportunity-actions";
import { HowToApply, OpportunityFacts, closingText } from "@/components/opportunity-facts";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { displayTitle } from "@/lib/opportunity-title";
import { displayDescription } from "@/lib/opportunity-description";
import { buildRankedFeed } from "@/services/matching/feed";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> };
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Opportunity" };
}

export default async function OpportunityPage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const [repository, auth] = await Promise.all([getRepository(), requirePageAuth(["user"])]);
  const { userId } = auth;
  const opportunity = await repository.getOpportunity(id);
  if (!opportunity || !isUserVisibleOpportunity(opportunity)) notFound();
  const [match, saved] = await Promise.all([
    buildRankedFeed(repository, userId, new Date(), undefined, { persist: false, telemetry: false, opportunityIds: new Set([id]), opportunities: [opportunity] })
      .then((matches) => matches.find((item) => item.opportunityId === id && isMatchScore(item.score))),
    repository.listSaved(userId),
  ]);
  const savedId = saved.find((item) => item.opportunityId === id)?.id;
  // Days left only once they have saved it.
  const closing = closingText(opportunity, new Date(), { countdown: Boolean(savedId) });
  const sourceHref = opportunity.sourceUrl;
  const organizationName = opportunity.organization?.name ?? opportunity.organizationName ?? null;
  const backHref = from === "matches" ? "/feed" : "/opportunities";
  const backLabel = from === "matches" ? "Back to matches" : "Back to opportunities";
  return <main className="animate-in flex flex-col gap-6">
    <BackButton fallbackHref={backHref} label={backLabel} className="self-start" />
    <section className="surface !rounded-[1.75rem] !px-6 !py-7 sm:!px-8">
      <h1 className="!m-0 !text-left !text-2xl !font-extrabold !leading-tight text-ink sm:!text-[2rem]">{displayTitle(opportunity.title, organizationName)}</h1>
      <p className="mt-1.5 text-[15px] font-semibold text-navy">{organizationName ?? "Source organization"}</p>
      <p className={`mt-1 text-sm font-bold ${closing.urgent ? "text-[#9B1C1C]" : "text-[#6B4E00]"}`}>{closing.label} · {opportunity.location}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {match
          ? <p className={`score-badge score-block score-${scoreTier(match.score)}`}><span className="text-base font-extrabold">{match.score}%</span> match</p>
          : <p className="cat-pill">{choiceLabel(opportunity.category)}</p>}
      </div>
      {!match ? <p className="mt-4 rounded-2xl glass-inset p-4 text-sm text-navy">This opportunity is not in your matches, so you may not meet every requirement. Check the details below and the official source before applying.</p> : null}
      <OpportunityActions opportunityId={id} sourceUrl={sourceHref} savedId={savedId} />
    </section>
    <OpportunityFacts opportunity={opportunity} saved={Boolean(savedId)} />
    {opportunity.description && <section className="surface"><h2 className="surface-title">About this opportunity</h2><p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-ink">{displayDescription(opportunity.description)}</p></section>}
    <HowToApply opportunity={opportunity} />
  </main>;
}
