import { LEGAL } from "@/config/legal";

/**
 * Shared layout for the Privacy Policy and Terms of Use, set as a formal document rather than app screens:
 * a plain page in Calibri 11: short headings over plain paragraphs, nothing numbered and no links (styled
 * by .legal-doc in globals.css).
 */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return <main className="legal-sheet">
    <article className="legal-doc">
      <header className="legal-doc-head">
        <p className="legal-doc-party">{LEGAL.entity}</p>
        <h1>{title}</h1>
      </header>
      {children}
      <h2>Contact</h2>
      <p>{LEGAL.entity} operates OppScout.{LEGAL.postalAddress ? ` Its address is ${LEGAL.postalAddress}.` : ""} Questions, requests and complaints about this document may be sent {LEGAL.privacyEmail ? `by email to ${LEGAL.privacyEmail}` : "through the Feedback page in the app"}.</p>
      <footer className="legal-doc-foot">
        <span>{title} · {LEGAL.entity}</span>
      </footer>
    </article>
  </main>;
}
