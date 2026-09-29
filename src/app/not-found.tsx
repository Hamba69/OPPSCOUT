import Link from "next/link";

import { Logo } from "@/components/logo";

export default function NotFoundPage(): React.JSX.Element {
  return <main className="page-shell grid min-h-[65vh] place-items-center"><section className="card max-w-lg bg-butter text-center"><div className="flex justify-center"><Logo size={64} /></div><h1 className="mt-4 text-2xl font-extrabold text-ink">We could not find that page.</h1><p className="mt-2 text-navy">The opportunity may have closed, expired, or been removed after review.</p><Link className="button mt-6" href="/feed">Back to my matches</Link></section></main>;
}
