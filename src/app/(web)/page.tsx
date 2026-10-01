import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

const categories = ["Jobs", "Scholarships", "Grants", "Internships"] as const;

const steps = [
  ["1", "Build your profile", "Add your study field, skills and preferred locations. It takes a few minutes."],
  ["2", "See explained matches", "We check eligibility first, then show what fits and what you still need to prepare."],
  ["3", "Apply with confidence", "Save it, watch the deadline, and apply through the official source."],
] as const;

const promises = [
  ["Every listing checked", "We confirm the official source, the deadline and duplicates before a listing reaches you."],
  ["No application fees", "Listings that ask for payment or sensitive details are held back for review."],
  ["Official sources linked", "Go straight to the organization’s own page. Report anything that looks wrong."],
] as const;

export default function HomePage(): React.JSX.Element {
  return (
    <main className="animate-in">
      <div className="bg-gradient-to-b from-cream to-butter">
        <div className="page-shell grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
          <section className="text-center lg:text-left">
            <Image src="/logo.png" alt="" width={88} height={88} priority className="mx-auto lg:mx-0" aria-hidden="true" />
            <p className="mt-2 text-xs font-medium tracking-[0.14em] text-ink">MEET YOUR OPPORTUNITIES</p>
            <h1 className="mt-6 text-3xl font-extrabold leading-tight text-ink sm:text-5xl">The right opportunity is already out there.</h1>
            <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-navy lg:mx-0">OppScout finds jobs, scholarships, grants and internships that fit you, and tells you before they close.</p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start" aria-label="What you can find">
              {categories.map((name) => <li key={name} className="rounded-full border-2 border-honey bg-white px-3 py-1.5 text-xs font-semibold text-ink">{name}</li>)}
            </ul>
            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-2 lg:mx-0">
              <Link href="/profile" className="button w-full">Get started</Link>
              <Link href="/login" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-navy underline-offset-4 hover:underline">I already have an account</Link>
            </div>
          </section>

          <aside className="mx-auto w-full max-w-sm" aria-label="Example match">
            <p className="mb-2 text-center text-sm font-semibold text-navy lg:text-left">Example of a match</p>
            <div className="rounded-blob border-2 border-honey bg-butter p-5 shadow-soft">
              <span className="inline-block rounded-full bg-coral px-3 py-1 text-xs font-bold text-ink">Closes in 3 days</span>
              <h2 className="mt-3 text-lg font-extrabold leading-snug text-ink">Youth Innovation Fund</h2>
              <p className="mt-1 text-sm text-navy">Grant · Open to ages 18–30</p>
              <p className="mt-4 text-sm font-extrabold text-leaf">92% match</p>
              <ul className="mt-2 space-y-2 text-sm text-ink">
                <li className="flex gap-2"><span className="font-extrabold text-leaf" aria-hidden="true">✓</span>Your skills match what they ask for</li>
                <li className="flex gap-2"><span className="font-extrabold text-leaf" aria-hidden="true">✓</span>You meet the age and study requirements</li>
                <li className="flex gap-2"><span className="font-extrabold text-ink" aria-hidden="true">!</span>Prepare a short project summary</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <div className="page-shell">
        <section aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-2xl font-extrabold text-ink">How OppScout works</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">{steps.map(([number, title, description]) => <li key={number} className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber text-sm font-extrabold text-ink" aria-hidden="true">{number}</span>
            <div><h3 className="font-bold text-ink">{title}</h3><p className="mt-1 text-sm leading-6 text-navy">{description}</p></div>
          </li>)}</ol>
        </section>

        <section className="card mt-10 border-leaf/20 bg-leaf/5" aria-labelledby="trust-promises">
          <h2 id="trust-promises" className="text-2xl font-extrabold text-ink">Your next step should feel safe.</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">{promises.map(([title, description]) => <div key={title}>
            <svg viewBox="0 0 24 24" className="mb-3 size-7 text-leaf" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>
            <h3 className="font-bold text-ink">{title}</h3><p className="mt-1 text-sm leading-6 text-navy">{description}</p>
          </div>)}</div>
        </section>
      </div>
    </main>
  );
}
