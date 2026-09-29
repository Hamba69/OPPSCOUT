import Image from "next/image";
import Link from "next/link";
<<<<<<< HEAD

import { AlertIcon, CheckIcon } from "@/components/icons";
=======
>>>>>>> e432442b8938ed60e121bd1272488719c9ec4569

export const dynamic = "force-dynamic";

const categories = ["Jobs", "Scholarships", "Grants", "Internships"] as const;

const promises = [
  ["Every listing checked", "We confirm the official source, the deadline and duplicates before a listing reaches you."],
  ["No application fees", "Listings that ask for payment or sensitive details are held back for review."],
  ["Official sources linked", "Go straight to the organization’s own page. Report anything that looks wrong."],
] as const;

<<<<<<< HEAD
function Stage({ title, text, flip, children }: { title: string; text: string; flip?: boolean; children: React.ReactNode }): React.JSX.Element {
  return <li className="relative grid items-center gap-5 pl-12 md:grid-cols-2 md:gap-14 md:pl-0">
    <span className="absolute left-[9px] top-2 size-5 rounded-full border-4 border-cream bg-amber shadow-[0_0_0_2px_#F6CA57] md:left-1/2 md:-ml-2.5" aria-hidden="true" />
    <div className={flip ? "md:order-2 md:pl-6" : "md:pr-6 md:text-right"}>
      <h3 className="text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-navy">{text}</p>
    </div>
    <div className={flip ? "md:order-1 md:justify-self-end" : "md:justify-self-start"}>{children}</div>
  </li>;
}

export default function HomePage(): React.JSX.Element {
  return (
    <main className="animate-in">
      <div className="bg-gradient-to-b from-cream to-butter">
        <section className="page-shell mx-auto max-w-2xl py-12 text-center lg:py-20">
          <Image src="/logo.png" alt="" width={96} height={96} priority className="mx-auto" aria-hidden="true" />
          <p className="mt-2 text-xs font-medium tracking-[0.14em] text-ink">MEET YOUR OPPORTUNITIES</p>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight text-ink sm:text-5xl">The right opportunity is already out there.</h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-navy">OppScout finds jobs, scholarships, grants and internships that fit you, and tells you before they close.</p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="What you can find">
            {categories.map((name) => <li key={name} className="rounded-full border-2 border-honey bg-white px-3 py-1.5 text-xs font-semibold text-ink">{name}</li>)}
          </ul>
          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-2">
            <Link href="/profile" className="button w-full">Get started</Link>
            <Link href="/login" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-navy underline-offset-4 hover:underline">I already have an account</Link>
=======
export default async function HomePage(): Promise<React.JSX.Element> {
  return (
    <main className="page-shell animate-in">
      <div className="grid items-center gap-10 py-6 lg:grid-cols-[1.2fr_.8fr] lg:py-10">
        <section>
          <p className="eyebrow">Your next good thing</p>
          <h1 className="mt-3 max-w-3xl text-5xl font-black leading-[1.02] sm:text-7xl">Good opportunities, minus the guesswork.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">OppScout checks eligibility first, ranks what genuinely fits, and tells you exactly why.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/feed" className="button">See my matches →</Link><Link href="/profile" className="button-secondary">Build my profile</Link></div>
        </section>
        <aside className="card relative overflow-hidden bg-butter">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-sun" />
          <div className="relative">
            <svg viewBox="0 0 64 64" className="size-14 text-leaf" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M32 54V29M32 40C14 41 10 31 12 20c13 0 22 6 20 20ZM32 30C32 13 42 8 54 10c1 14-7 21-22 20Z" /><path d="M20 54h24" /></svg>
            <p className="mt-5 text-xs font-black uppercase tracking-wider text-leaf">An explained match</p>
            <p className="score-enter mt-2 text-3xl font-black">Know why it fits</p>
            <p className="mt-2 font-bold">Your skills. Your next step.</p>
            <ul className="mt-5 space-y-3 text-sm leading-6">
              <li><span className="mr-2 font-black text-leaf" aria-hidden="true">✓</span>Eligibility checked before ranking</li>
              <li><span className="mr-2 font-black text-leaf" aria-hidden="true">✓</span>Clear reasons behind every match</li>
              <li><span className="mr-2 font-black" aria-hidden="true">△</span>See what to prepare before applying</li>
            </ul>
>>>>>>> e432442b8938ed60e121bd1272488719c9ec4569
          </div>
        </section>
      </div>

      <div className="page-shell">
        <section aria-labelledby="how-it-works" className="mx-auto max-w-4xl">
          <h2 id="how-it-works" className="text-center text-2xl font-extrabold text-ink sm:text-3xl">How OppScout works</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-navy">Follow the trail from who you are to your next step.</p>
          <div className="relative mt-10">
            <span className="absolute bottom-2 left-[18px] top-2 border-l-[3px] border-dashed border-honey md:left-1/2 md:-ml-[1.5px]" aria-hidden="true" />
            <ul className="relative space-y-12">
              <Stage title="You tell us who you are" text="Share your study field, skills and where you would like to work. A few minutes is enough.">
                <div className="flex max-w-xs flex-wrap gap-2 rounded-blob border-2 border-honey bg-butter p-4" aria-hidden="true">
                  {["Data analysis", "Bachelors", "Kampala", "English", "Research"].map((chip, index) => <span key={chip} className={`rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-soft ${index % 2 ? "rotate-2" : "-rotate-2"}`}>{chip}</span>)}
                </div>
              </Stage>
              <Stage flip title="We check the gate first" text="Eligibility comes before ranking. If you don’t qualify, it never reaches your feed, so you never waste time.">
                <div className="w-full max-w-xs space-y-2 rounded-blob border border-ink/10 bg-white p-4 shadow-soft" aria-hidden="true">
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-leaf/10 px-3 py-2 text-xs font-bold text-leaf"><span className="text-ink">Youth Innovation Fund</span><span className="flex items-center gap-1"><CheckIcon /> Eligible</span></div>
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-leaf/10 px-3 py-2 text-xs font-bold text-leaf"><span className="text-ink">Data Analyst Internship</span><span className="flex items-center gap-1"><CheckIcon /> Eligible</span></div>
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-coral/20 px-3 py-2 text-xs font-bold text-ink"><span className="line-through decoration-2">Masters Fellowship</span><span className="flex items-center gap-1"><AlertIcon /> Needs a masters</span></div>
                </div>
              </Stage>
              <Stage title="You get matches with reasons" text="Every match explains why it fits and what to prepare, and links to the official source so you can apply safely.">
                <div className="flex max-w-xs items-start gap-3 rounded-blob border-2 border-honey bg-white p-4 shadow-soft" aria-hidden="true">
                  <Image src="/logo.png" alt="" width={36} height={36} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold text-ink">Closes in 3 days</p>
                    <p className="mt-0.5 text-xs leading-5 text-navy">Youth Innovation Fund is a strong fit for your skills. Prepare a short project summary.</p>
                    <span className="badge-verified mt-2"><CheckIcon /> Official source linked</span>
                  </div>
                </div>
              </Stage>
            </ul>
          </div>
        </section>

        <section className="card mx-auto mt-16 max-w-4xl border-leaf/20 bg-leaf/5" aria-labelledby="trust-promises">
          <h2 id="trust-promises" className="text-2xl font-extrabold text-ink">Your next step should feel safe.</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">{promises.map(([title, description]) => <div key={title}>
            <svg viewBox="0 0 24 24" className="mb-3 size-7 text-leaf" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>
            <h3 className="font-bold text-ink">{title}</h3><p className="mt-1 text-sm leading-6 text-navy">{description}</p>
          </div>)}</div>
        </section>
      </div>
<<<<<<< HEAD
=======
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
>>>>>>> e432442b8938ed60e121bd1272488719c9ec4569
    </main>
  );
}
