import { InterestFunnel } from "@/components/dashboard-charts";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ProviderAnalyticsPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const repository = await getRepository();
  const ids = new Set((await repository.listOpportunities({
    organizationId: auth.organizationId ?? undefined,
    origin: "organization",
  })).map((item) => item.id));
  const events = (await repository.listEvents()).filter((event) => event.opportunityId && ids.has(event.opportunityId));
  const count = (type: string): number => events.filter((event) => event.eventType === type).length;
  const cards = [["Views", count("view")], ["Saves", count("save")], ["Clicks to official source", count("click")], ["Plan to apply", count("apply_intent")]] as const;

  return (
    <main className="page-shell animate-in">
      <header className="page-header">
        <div>
          <p className="eyebrow">Publisher workspace</p>
          <h1 className="!text-left !font-extrabold">Opportunity interest</h1>
          <p>See how people engage with your listings, without exposing individual profiles.</p>
        </div>
      </header>
      <section aria-label="Engagement totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <article className="rounded-2xl border border-ink/[.08] bg-white px-5 py-4 shadow-soft" key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
          </article>
        ))}
      </section>
      <section className="card mt-5" aria-label="Engagement funnel">
        <h2 className="text-lg font-extrabold text-ink">Engagement funnel</h2>
        <p className="mt-1 text-sm text-navy">Combined activity across your opportunities.</p>
        <InterestFunnel items={cards} />
      </section>
      <section className="mt-5 rounded-2xl border border-leaf/20 bg-leaf/[.04] px-5 py-4">
        <h2 className="text-sm font-bold text-ink">Privacy stays simple</h2>
        <p className="mt-1 text-sm leading-6 text-navy">These totals summarize listing activity. Individual matched-person details are never included.</p>
      </section>
    </main>
  );
}
