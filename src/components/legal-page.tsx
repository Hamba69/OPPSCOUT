import Link from "next/link";

import { LEGAL } from "@/config/legal";

/** Shared layout and contact line for the Privacy Policy and Terms. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return <main className="page-shell animate-in">
    <article className="surface mx-auto max-w-3xl !px-6 !py-8 sm:!px-10 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:mt-1 [&_p]:mt-3 [&_p]:leading-7 [&_p]:text-ink [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:leading-7 [&_ul]:text-ink">
      <h1 className="!m-0 !text-left !text-3xl !font-extrabold text-ink">{title}</h1>
      <p className="!mt-2 text-sm !text-navy">Last updated {LEGAL.updated}</p>
      {children}
      <h2>Contact us</h2>
      <p>{LEGAL.entity} runs OppScout.{LEGAL.postalAddress ? ` Our address is ${LEGAL.postalAddress}.` : ""} {LEGAL.privacyEmail ? <>Email <a className="font-semibold underline" href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a></> : <>Use our <Link className="font-semibold underline" href="/feedback">Feedback page</Link></>} for questions, requests or complaints about this page.</p>
      <p className="text-sm !text-navy">See also: <Link className="underline" href="/privacy">Privacy Policy</Link> · <Link className="underline" href="/terms">Terms of Use</Link></p>
    </article>
  </main>;
}
