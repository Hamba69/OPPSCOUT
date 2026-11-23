import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { getOptionalAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Signed-in people go back to their matches (publishers also get their dashboard, since most also use
 * OppScout as seekers); visitors go to the front page or log in.
 */
export default async function NotFoundPage(): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  return <main className="page-shell grid min-h-[65vh] place-items-center"><section className="card max-w-lg text-center">
    <div className="flex justify-center"><Logo size={64} /></div>
    <h1 className="mt-4 text-2xl font-extrabold text-ink">We could not find that page.</h1>
    <p className="mt-2 text-navy">The link may be wrong, or the opportunity may have closed, expired or been removed after review.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {auth ? <Link className="button" href="/feed">Back to my matches</Link> : <Link className="button" href="/">Go to the OppScout home page</Link>}
      {!auth && <Link className="button-secondary" href="/login">Log in</Link>}
    </div>
  </section></main>;
}
