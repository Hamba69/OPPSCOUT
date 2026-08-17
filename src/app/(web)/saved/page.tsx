import Link from "next/link";

import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function SavedPage(): Promise<React.JSX.Element> {
  const repository = await getRepository();
  const { userId } = await requirePageAuth(["user"]);
  const saved = await repository.listSaved(userId);
  const items = (await Promise.all(saved.map(async (item) => ({ item, opportunity: await repository.getOpportunity(item.opportunityId) })))).filter((entry) => entry.opportunity);
  return <main className="page-shell"><p className="eyebrow">Your shortlist</p><h1 className="mt-2 text-4xl font-black">Saved for later. Not forgotten.</h1><div className="mt-8 space-y-4">{items.length ? items.map(({ item, opportunity }) => <article key={item.id} className="card flex flex-wrap items-center justify-between gap-4"><div><span className="pill capitalize">{item.status}</span><h2 className="mt-2 text-xl font-black">{opportunity!.title}</h2><p className="mt-1 text-sm text-ink/60">Deadline {opportunity!.deadline.toLocaleDateString("en-UG", { dateStyle: "medium" })}</p></div><Link className="button-secondary" href={`/opportunity/${opportunity!.id}`}>Open →</Link></article>) : <section className="card bg-butter text-center"><div className="text-5xl">🐣</div><h2 className="mt-3 text-2xl font-black">Your shortlist is empty</h2><p className="mt-2">Save a match and it will wait here.</p><Link href="/feed" className="button mt-5">Browse matches</Link></section>}</div></main>;
}
