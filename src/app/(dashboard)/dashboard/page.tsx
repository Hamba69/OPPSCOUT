import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";
export default async function DashboardPage(): Promise<React.JSX.Element> {
  const repository = await getRepository(); const auth = await requirePageAuth(["organization"]); const organizationId = auth.organizationId!;
  const [organization, opportunities] = await Promise.all([repository.getOrganization(organizationId), repository.listOpportunities({ organizationId, origin: "organization" })]);
  return <main className="page-shell animate-in"><header className="text-center"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Publisher overview</h1><p className="mt-2 text-navy">{organization?.name} · Create and manage opportunities for your audience.</p><Link href="/dashboard/opportunities/new" className="button mt-5">Post an opportunity</Link></header><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="card border-honey bg-butter"><p className="text-3xl font-extrabold text-ink">{opportunities.length}</p><p className="text-sm font-bold text-navy">Total opportunities</p></div><div className="card"><p className="text-3xl font-extrabold text-leaf">{opportunities.filter((item) => item.verificationStatus === "verified").length}</p><p className="text-sm font-bold text-navy">Published</p></div><div className="card"><p className="text-3xl font-extrabold text-ink">{opportunities.filter((item) => item.verificationStatus === "pending").length}</p><p className="text-sm font-bold text-navy">In review</p></div></div></main>;
}
