import Link from "next/link";

export default function HomePage(): React.JSX.Element {
  return (
    <main className="page-shell grid min-h-[70vh] items-center gap-10 lg:grid-cols-[1.2fr_.8fr]">
      <section>
        <p className="eyebrow">Your next good thing</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-black leading-[1.02] sm:text-7xl">Good opportunities, minus the guesswork.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">OppScout checks eligibility first, ranks what genuinely fits, and tells you exactly why.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/feed" className="button">See my matches →</Link><Link href="/profile" className="button-secondary">Build my profile</Link></div>
      </section>
      <aside className="card relative overflow-hidden bg-butter">
        <div className="absolute -right-8 -top-8 size-32 rounded-full bg-sun" />
        <div className="relative">
          <div className="text-5xl" aria-hidden="true">🌻</div>
          <p className="mt-5 text-3xl font-black">82% match</p>
          <p className="mt-2 font-bold">Junior Data & Impact Internship</p>
          <ul className="mt-5 space-y-3 text-sm"><li>✓ Your data skills fit</li><li>✓ Kampala + hybrid works</li><li>△ Tailor your application story</li></ul>
        </div>
      </aside>
    </main>
  );
}
