"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }): React.JSX.Element {
  return <main className="page-shell grid min-h-[65vh] place-items-center"><section className="card max-w-lg text-center"><div className="text-6xl">🌦️</div><h1 className="mt-4 text-3xl font-black">A small cloud got in the way.</h1><p className="mt-2 text-ink/60">Your information is still safe. Try that once more.</p><button className="button mt-6" onClick={reset}>Try again</button></section></main>;
}
