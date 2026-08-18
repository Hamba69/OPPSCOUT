import { OrganizationReviewCard } from "@/components/organization-review-card";
import { ReviewCard } from "@/components/review-card";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage(): Promise<React.JSX.Element> {
  await requirePageAuth(["admin"]);
  const repository = await getRepository();
  const [queue, organizations] = await Promise.all([repository.listReviewQueue(), repository.listOrganizationReviewQueue()]);
  const total = queue.length + organizations.length;
  return <main className="page-shell"><p className="eyebrow">Trust desk</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-4xl font-black">Review queue</h1><p className="mt-2 text-ink/60">Organizations and listings both need a verified decision before trust is shown.</p></div><span className="pill">{total} waiting</span></div>{organizations.length > 0 && <section className="mt-8"><h2 className="text-2xl font-black">Organizations</h2><div className="mt-4 grid gap-5 lg:grid-cols-2">{organizations.map((item) => <OrganizationReviewCard key={item.id} id={item.id} name={item.name} sector={item.sector} officialLinks={item.officialLinks} officialEmail={item.officialEmail} registrationProof={item.registrationProof} accountableContact={item.accountableContact} status={item.verificationStatus} />)}</div></section>}<section className="mt-8"><h2 className="text-2xl font-black">Opportunities</h2><div className="mt-4 grid gap-5 lg:grid-cols-2">{queue.length ? queue.map((item) => <ReviewCard key={item.id} id={item.id} title={item.title} organization={item.organization?.name ?? "Unknown organization"} sourceUrl={item.sourceUrl} status={item.verificationStatus} description={item.description} />) : <section className="card bg-butter text-center lg:col-span-2"><div className="text-5xl">✨</div><h3 className="mt-3 text-2xl font-black">Opportunity queue clear</h3><p className="mt-2">Every current listing has a decision.</p></section>}</div></section></main>;
}
