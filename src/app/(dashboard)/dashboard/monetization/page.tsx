import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { getMonetizationReadiness } from "@/services/monetization/readiness";

export const dynamic = "force-dynamic";

export default async function MonetizationPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const repository = await getRepository();
  const organization = await repository.getOrganization(auth.organizationId!);
  if (!organization) throw new Error("Publisher profile is missing.");
  const readiness = await getMonetizationReadiness(repository, organization);

  return (
    <main className="page-shell animate-in">
      <header className="page-header">
        <div>
          <p className="eyebrow">Publisher workspace</p>
          <h1 className="!text-left !font-extrabold">Monetization readiness</h1>
          <p>Subscriptions and promoted listings stay locked until legal, trust, and retention checks are healthy.</p>
        </div>
        <span className="pill capitalize">{organization.subscriptionTier} plan</span>
      </header>
      <section className={`overflow-hidden rounded-2xl border bg-white shadow-soft ${readiness.ready ? "border-leaf/40" : "border-ink/[.08]"}`}>
        <div className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${readiness.ready ? "bg-leaf/[.06]" : "bg-cream/60"}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy">Activation status</p>
            <h2 className="mt-1 text-lg font-extrabold text-ink">{readiness.ready ? "Ready for controlled activation" : "Activation safely blocked"}</h2>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${readiness.ready ? "bg-leaf/10 text-leaf" : "bg-honey/40 text-ink"}`}>
            {readiness.ready ? "Ready" : "Blocked"}
          </span>
        </div>
        {readiness.blockers.length ? (
          <ul className="divide-y divide-ink/[.08]">
            {readiness.blockers.map((blocker) => (
              <li key={blocker} className="flex items-start gap-3 px-5 py-3 text-sm text-navy">
                <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-honey" />
                {blocker}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-navy">All readiness checks currently pass.</p>
        )}
      </section>
      <section className="mt-5 rounded-2xl border border-honey/70 bg-butter/50 px-5 py-4">
        <h2 className="text-sm font-bold text-ink">Opportunity seekers always stay free</h2>
        <p className="mt-1 text-sm leading-6 text-navy">Profiles, ranked matches, explanations, saving, source links, and application tracking are never paywalled or down-ranked for unpaid users.</p>
      </section>
    </main>
  );
}
