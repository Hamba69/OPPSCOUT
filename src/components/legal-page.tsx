import Link from "next/link";

import { LEGAL } from "@/config/legal";

/**
 * Shared layout for the Privacy Policy and Terms of Use, set as a formal document rather than app screens:
 * a plain page, small serif type, numbered clauses and lettered sub-points (styled by .legal-doc in
 * globals.css). Each <h2> becomes a numbered clause; each list item becomes (a), (b), (c).
 */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return <main className="legal-sheet">
    <article className="legal-doc">
      <header className="legal-doc-head">
        <p className="legal-doc-party">{LEGAL.entity}</p>
        <h1>{title}</h1>
        <p className="legal-doc-meta">Version {LEGAL.termsVersion} · Effective {LEGAL.updated}</p>
      </header>
      {children}
      <h2>Contact</h2>
      <p>{LEGAL.entity} operates OppScout.{LEGAL.postalAddress ? ` Its address is ${LEGAL.postalAddress}.` : ""} Questions, requests and complaints about this document may be sent {LEGAL.privacyEmail ? <>by email to <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a></> : <>through the <Link href="/feedback">Feedback page</Link></>}.</p>
      <footer className="legal-doc-foot">
        <span>{title} · {LEGAL.entity}</span>
        <span><Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms of Use</Link></span>
      </footer>
    </article>
  </main>;
}
