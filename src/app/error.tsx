"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }): React.JSX.Element {
  return <main className="page-shell grid min-h-[65vh] place-items-center"><section className="card max-w-lg text-center"><h1 className="text-2xl font-extrabold text-ink">Something went wrong on our side.</h1><p className="mt-2 text-navy">Your information is safe. Try again, and if it keeps happening, come back in a few minutes.</p><button className="button mt-6" onClick={reset}>Try again</button></section></main>;
}
