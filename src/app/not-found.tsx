import Link from "next/link";

export default function NotFoundPage(): React.JSX.Element {
  return <main className="page-shell grid min-h-[65vh] place-items-center"><section className="card max-w-lg bg-butter text-center"><div className="text-6xl">🐥</div><h1 className="mt-4 text-3xl font-black">That opportunity flew away.</h1><p className="mt-2 text-ink/60">It may have closed, gone stale, or failed verification.</p><Link className="button mt-6" href="/feed">Back to fresh matches</Link></section></main>;
}
