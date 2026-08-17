import { ReviewCard } from "@/components/review-card";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage(): Promise<React.JSX.Element> {
  await requirePageAuth(["admin"]);
  const queue = await (await getRepository()).listReviewQueue();
  return <main className="page-shell"><p className="eyebrow">Trust desk</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-4xl font-black">Review queue</h1><p className="mt-2 text-ink/60">Nothing reaches a feed until the checks are green.</p></div><span className="pill">{queue.length} waiting</span></div><div className="mt-8 grid gap-5 lg:grid-cols-2">{queue.length ? queue.map((item) => <ReviewCard key={item.id} id={item.id} title={item.title} organization={item.organization?.name ?? "Unknown organization"} sourceUrl={item.sourceUrl} status={item.verificationStatus} description={item.description} />) : <section className="card bg-butter text-center lg:col-span-2"><div className="text-5xl">✨</div><h2 className="mt-3 text-2xl font-black">Queue clear</h2><p className="mt-2">Every current listing has a decision.</p></section>}</div></main>;
}
