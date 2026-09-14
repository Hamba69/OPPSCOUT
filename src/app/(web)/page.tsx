import Link from "next/link";
import { getRepository, isMemoryDataMode } from "@/lib/repository";
import { DEMO_USER_ID } from "@/lib/repository/memory";
import { buildRankedFeed } from "@/services/matching/feed";

export const dynamic = "force-dynamic";

const steps = [
  ["01", "Build your profile", "Your study field, skills, and preferred locations give us a useful starting point."],
  ["02", "See explained matches", "Eligibility comes first. See what fits and what needs a little preparation."],
  ["03", "Apply with confidence", "Save your next step, check the deadline, and follow the official source."],
] as const;

const promises = [
  ["Every listing checked", "Official sources, plausible deadlines, and duplicate checks before a listing reaches your feed."],
  ["No application fees", "We check for inappropriate fees and unnecessary requests for sensitive information."],
  ["Sources always linked", "Go straight to the official listing. Report anything suspicious for a fresh review."],
] as const;

export default async function HomePage(): Promise<React.JSX.Element> {
  const memory = isMemoryDataMode();
  const data = memory ? await (async () => {
    const repository = await getRepository();
    const [opportunities, organizations, matches] = await Promise.all([
      repository.listOpportunities({ verificationStatus: "verified", statuses: ["open", "closing_soon"] }),
      repository.listOrganizations(),
      buildRankedFeed(repository, process.env.OPPSCOUT_DEMO_USER_ID || DEMO_USER_ID),
    ]);
    return {
      matches, opportunities: opportunities.filter((item) => item.deadline > new Date()).length,
      organizations: organizations.filter((item) => item.verificationStatus === "verified").length,
      reasons: matches.length ? (matches.reduce((sum, match) => sum + match.matchedFactors.length + match.missingFactors.length, 0) / matches.length).toFixed(1) : "0",
    };
  })() : null;
  const featured = data?.matches[0];
  const strengths = featured?.matchedFactors.filter((factor) => factor.label === "Skills" || factor.label === "Location").slice(0, 2);

  return (
    <main className="page-shell animate-in">
      <div className="grid items-center gap-10 py-6 lg:grid-cols-[1.2fr_.8fr] lg:py-10">
        <section>
          <p className="eyebrow">Your next good thing</p>
          <h1 className="mt-3 max-w-3xl text-5xl font-black leading-[1.02] sm:text-7xl">Good opportunities, minus the guesswork.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">OppScout checks eligibility first, ranks what genuinely fits, and tells you exactly why.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/feed" className="button">See my matches →</Link><Link href={memory ? "/login" : "/profile"} className="button-secondary">{memory ? "Explore the demo" : "Build my profile"}</Link></div>
        </section>
        <aside className="card relative overflow-hidden bg-butter">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-sun" />
          <div className="relative">
            <svg viewBox="0 0 64 64" className="size-14 text-leaf" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M32 54V29M32 40C14 41 10 31 12 20c13 0 22 6 20 20ZM32 30C32 13 42 8 54 10c1 14-7 21-22 20Z" /><path d="M20 54h24" /></svg>
            <p className="mt-5 text-xs font-black uppercase tracking-wider text-leaf">{memory ? "From the demo feed" : "An explained match"}</p>
            <p className="score-enter mt-2 text-3xl font-black">{featured ? `${featured.score}% match` : "Know why it fits"}</p>
            <p className="mt-2 font-bold">{featured?.opportunity?.title ?? "Your skills. Your next step."}</p>
            <ul className="mt-5 space-y-3 text-sm leading-6">
              {strengths?.length ? strengths.map((factor) => <li key={factor.label}><span className="mr-2 font-black text-leaf" aria-hidden="true">✓</span>{factor.detail}</li>) : <><li>✓ Eligibility checked before ranking</li><li>✓ Clear reasons behind every match</li></>}
              <li><span className="mr-2 font-black" aria-hidden="true">△</span>{featured?.missingFactors[0]?.detail ?? "See what to prepare before applying"}</li>
            </ul>
            {featured && <Link href={`/opportunity/${featured.opportunityId}`} className="mt-5 inline-block text-sm font-extrabold underline decoration-ink/25 underline-offset-4">Read this match →</Link>}
          </div>
        </aside>
      </div>
      <section className="mt-10 border-t border-ink/10 pt-8" aria-labelledby="how-it-works">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 id="how-it-works" className="text-2xl font-black">A clearer path to what’s next.</h2><p className="text-sm text-ink/55">Three steps. All yours.</p></div>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">{steps.map(([number, title, description]) => <li key={number} className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sun text-xs font-black" aria-hidden="true">{number}</span>
          <div><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-ink/65">{description}</p></div>
        </li>)}</ol>
      </section>
      <section className="card mt-10 bg-leaf/5" aria-labelledby="trust-promises">
        <p className="eyebrow">Trust, in plain language</p><h2 id="trust-promises" className="mt-2 text-2xl font-black">Your next step should feel safe.</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">{promises.map(([title, description]) => <div key={title}>
          <svg viewBox="0 0 24 24" className="mb-3 size-6 text-leaf" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>
          <h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-ink/65">{description}</p>
        </div>)}</div>
      </section>
      {data && <section className="mt-10" aria-labelledby="live-collection">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 id="live-collection" className="text-2xl font-black">A little proof behind the promise.</h2><span className="flex items-center gap-2 text-xs font-bold text-leaf"><span className="size-2 rounded-full bg-leaf" aria-hidden="true" />Live demo collection</span></div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">{[[data.opportunities, "Verified open opportunities"], [data.organizations, "Verified organizations"], [data.reasons, "Reasons per match, on average"]].map(([value, label]) => <div key={label} className="rounded-blob border border-ink/10 bg-white/70 p-5"><dt className="text-sm font-bold text-ink/60">{label}</dt><dd className="mt-2 text-4xl font-black tabular-nums">{value}</dd></div>)}</dl>
        <p className="mt-4 text-xs leading-5 text-ink/50">Calculated from the current memory session. Listings and organizations are fictional demo records; reasons include strengths and things to prepare.</p>
      </section>}
    </main>
  );
}
