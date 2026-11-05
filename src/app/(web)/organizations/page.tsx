import Link from "next/link";

const steps = [
  ["Create an account", "Use an email that is separate from any personal account."],
  ["Get verified", "We review your organization’s details. This usually takes up to {hours} hours."],
  ["Submit an opportunity", "Add the details and where people can apply."],
  ["Reach people who fit", "After review, matched people appear, only if they chose to share their profile."],
] as const;

export default function OrganizationsPage(): React.JSX.Element {
  const hours = process.env.OPPSCOUT_MAX_TRUST_TURNAROUND_HOURS ?? "48";
  return <main className="publisher-bg page-shell animate-in">
    <section className="mx-auto max-w-3xl pt-8 text-center sm:pt-12">
      <span className="publisher-pill">For organizations</span>
      <h1 className="hero-title mt-6">Share opportunities with people who fit.</h1>
      <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-navy sm:text-lg">Publish a job, scholarship, grant, internship, training or consultancy. We review every listing, then help you reach people who match and choose to share their profile.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
        <Link href="/organizations/signup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgb(30_41_59/.25)] transition hover:brightness-125 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/60">Create a publisher account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
        <Link href="/organizations/login" className="text-sm font-bold text-ink underline underline-offset-2">I already have an account</Link>
      </div>
    </section>

    <section className="mt-20" aria-labelledby="how-publishing-works">
      <h2 id="how-publishing-works" className="text-center text-2xl font-extrabold text-ink sm:text-3xl">How publishing works</h2>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map(([title, body], index) => <li key={title} className={`rounded-2xl border border-ink/[.08] bg-white p-6 ${index === 3 ? "md:col-span-3" : ""}`}>
          <span className="publisher-step !h-8 !w-8 !text-sm">{index + 1}</span>
          <h3 className="mt-4 font-bold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-navy">{body.replace("{hours}", hours)}</p>
        </li>)}
      </ol>
    </section>

    <p className="mt-16 border-t border-ink/[.08] pt-8 text-sm text-navy">Looking for opportunities? <Link href="/" className="font-bold text-ink underline underline-offset-2">Go to OppScout</Link>.</p>
  </main>;
}
