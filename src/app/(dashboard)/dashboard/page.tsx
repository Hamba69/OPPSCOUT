import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const organizationId = auth.organizationId;
  if (!organizationId) throw new Error("Publisher account is missing its organization.");
  const repository = await getRepository();
  const [organization, opportunities] = await Promise.all([
    repository.getOrganization(organizationId),
    repository.listOpportunities({ organizationId, origin: "organization" }),
  ]);
  if (!organization) throw new Error("Publisher profile is missing.");

  const metrics = [
    {
      label: "Total opportunities",
      value: opportunities.length,
      detail: "All opportunities you have submitted",
      accent: "border-t-amber",
      valueColor: "text-ink",
      icon: "↗",
    },
    {
      label: "Published",
      value: opportunities.filter((item) => item.verificationStatus === "verified").length,
      detail: "Verified and visible to opportunity seekers",
      accent: "border-t-leaf",
      valueColor: "text-leaf",
      icon: "✓",
    },
    {
      label: "In review",
      value: opportunities.filter((item) => item.verificationStatus === "pending").length,
      detail: "Awaiting a review by the OppScout team",
      accent: "border-t-honey",
      valueColor: "text-ink",
      icon: "◷",
    },
  ] as const;

  const recentOpportunities = [...opportunities]
    .sort((a, b) => b.publicationDate.getTime() - a.publicationDate.getTime())
    .slice(0, 5);

  return (
    <main className="page-shell animate-in">
      <header className="page-header">
        <div>
          <p className="eyebrow">Publisher workspace</p>
          <h1 className="mt-1 !text-left !text-3xl !font-extrabold sm:!text-4xl">{organization.name}</h1>
          <p className="mt-2 text-sm text-navy">A quick view of your listings and publisher account.</p>
        </div>
      </header>

      <section aria-label="Publisher account status" className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/[.08] bg-white px-5 py-4 shadow-soft">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy">Publisher account</p>
          <p className="mt-1 text-sm text-ink">
            {organization.verificationStatus === "verified"
              ? "Your publisher profile is verified."
              : organization.verificationStatus === "pending"
                ? "Your profile is being reviewed by the OppScout team."
                : organization.verificationStatus === "flagged"
                  ? "Your profile needs follow-up from the OppScout team."
                  : "Your profile has not been verified yet."}
          </p>
        </div>
        <StatusBadge value={organization.verificationStatus} />
      </section>

      <section aria-label="Publisher overview metrics" className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className={`rounded-2xl border border-ink/[.08] border-t-4 ${metric.accent} bg-white p-5 shadow-soft`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-navy">{metric.label}</p>
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream text-lg font-bold text-ink">
                {metric.icon}
              </span>
            </div>
            <p className={`mt-2 text-4xl font-extrabold tracking-tight ${metric.valueColor}`}>{metric.value}</p>
            <p className="mt-1 text-xs leading-5 text-navy">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="card mt-6 !p-0" aria-labelledby="recent-opportunities-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.08] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy">Recent activity</p>
            <h2 id="recent-opportunities-heading" className="mt-1 text-lg font-extrabold text-ink">Latest opportunities</h2>
          </div>
          <Link className="button-secondary" href="/dashboard/opportunities">View all opportunities</Link>
        </div>
        {recentOpportunities.length ? (
          <ul className="divide-y divide-ink/[.08]">
            {recentOpportunities.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-ink">{item.title}</h3>
                  <p className="mt-1 text-xs capitalize text-navy">
                    {item.category} · {item.deadline ? `Closes ${item.deadline.toLocaleDateString("en-UG")}` : "Rolling deadline"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge value={item.verificationStatus} />
                  <Link className="text-sm font-semibold text-navy underline underline-offset-4 hover:text-ink" href={`/dashboard/opportunities/${item.id}/edit`}>Edit</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-navy">Your submitted opportunities will appear here with their review status.</p>
        )}
      </section>
    </main>
  );
}
