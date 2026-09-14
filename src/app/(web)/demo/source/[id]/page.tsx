import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository, isMemoryDataMode } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function DemoSourcePage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  if (!isMemoryDataMode()) notFound();
  const { id } = await params;
  const opportunity = await (await getRepository()).getOpportunity(id);
  if (!opportunity?.sourceUrl.startsWith("https://example.org/oppscout-demo/")) notFound();
  return <main className="page-shell animate-in"><article className="card mx-auto max-w-3xl">
    <p className="eyebrow">Demo source preview</p>
    <h1 className="mt-3 text-3xl font-black">{opportunity.title}</h1>
    <p className="mt-2 font-bold text-ink/60">{opportunity.organization?.name}</p>
    <p className="mt-6 rounded-2xl bg-butter p-4 text-sm leading-6">This is a fictional listing for the OppScout walkthrough. No applications are being collected. Real listings link directly to the organization’s official source.</p>
    <p className="mt-6 leading-7">{opportunity.description}</p>
    <h2 className="mt-6 text-xl font-black">Application preparation</h2>
    <p className="mt-3 leading-7">{opportunity.applicationMethod}</p>
    <Link href={`/opportunity/${id}`} className="button mt-6">Back to your match</Link>
  </article></main>;
}
