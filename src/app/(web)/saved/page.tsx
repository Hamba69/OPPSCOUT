import Link from "next/link";

import { Logo } from "@/components/logo";

import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function SavedPage(): Promise<React.JSX.Element> {
  const repository = await getRepository();
  const { userId } = await requirePageAuth(["user"]);
  const saved = await repository.listSaved(userId);
  const items = (await Promise.all(saved.map(async (item) => ({ item, opportunity: await repository.getOpportunity(item.opportunityId) })))).filter((entry) => entry.opportunity);
  return <main className="page-shell animate-in"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Saved</h1><div className="mt-8 space-y-4">{items.length ? items.map(({ item, opportunity }) => <article key={item.id} className="card flex flex-wrap items-center justify-between gap-4"><div><span className={`pill capitalize ${item.status === "applied" ? "!border-leaf/40 !bg-leaf/10 !text-leaf" : ""}`}>{item.status}</span><h2 className="mt-2 text-lg font-extrabold text-ink">{opportunity!.title}</h2><p className="mt-1 text-sm text-navy">Deadline {opportunity!.deadline?.toLocaleDateString("en-UG", { dateStyle: "medium" }) ?? "Rolling; no closing date published"}</p></div><Link className="button-secondary" href={`/opportunity/${opportunity!.id}`}>Open</Link></article>) : <section className="card bg-butter text-center"><div className="flex justify-center"><Logo size={56} /></div><h2 className="mt-3 text-xl font-extrabold text-ink">Your shortlist is empty</h2><p className="mt-2 text-navy">Found something promising? Save a match to keep its deadline and next steps together here.</p><Link href="/feed" className="button mt-5">Browse matches</Link></section>}</div></main>;
}
