import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

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

  return (
    <main className="page-shell animate-in">
      <header className="mb-10 text-center">
        <p className="eyebrow">Publisher workspace</p>
        <h1 className="mt-2 !text-3xl !font-extrabold sm:!text-4xl">{organization.name}</h1>
        <p className="mt-3 text-navy">Create and manage opportunities for your audience.</p>
      </header>

      <section aria-label="Publisher overview metrics" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className={`min-h-64 rounded-2xl border border-ink/[.08] border-t-4 ${metric.accent} bg-white p-8 shadow-soft sm:p-9`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-navy">{metric.label}</p>
                <p className={`mt-5 text-5xl font-extrabold tracking-tight ${metric.valueColor}`}>{metric.value}</p>
              </div>
              <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-cream text-2xl font-bold text-ink">
                {metric.icon}
              </span>
            </div>
            <p className="mt-7 border-t border-ink/[.08] pt-5 text-sm leading-6 text-navy">{metric.detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
