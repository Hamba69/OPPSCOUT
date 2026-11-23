"use client";

import { useState, useTransition } from "react";

import type { SubmitterContact } from "@/core/entities/domain";
import { apiErrorMessage } from "@/lib/api-error-message";
import { contactLinks, relationshipLabel, type ContactMethod } from "@/services/trust/poster-contact";

/**
 * Admin > Review: who posted this listing, one-tap email, call and WhatsApp, and a log of what they
 * confirmed. The log is saved in the listing's review notes.
 */
export function PosterContactPanel({ id, title, contact, initialLog }: { id: string; title: string; contact: SubmitterContact; initialLog: string[] }): React.JSX.Element {
  const links = contactLinks(contact, title);
  const [log, setLog] = useState(initialLog);
  const [method, setMethod] = useState<ContactMethod>("call");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const save = (): void => {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/v1/admin/opportunities/${id}/contact-log`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method, note }) });
      if (!response.ok) { setMessage(await apiErrorMessage(response, "The note could not be saved.")); return; }
      const body = await response.json() as { data: { contactLog: string[] } };
      setLog(body.data.contactLog);
      setNote("");
    });
  };
  return <section aria-label="Poster contact" className="rounded-xl border border-[#F5D76E] bg-[#FFF8DC] p-4">
    <h4 className="text-sm font-bold text-ink">Posted by {contact.name}</h4>
    <p className="mt-0.5 text-xs text-navy">{relationshipLabel(contact.relationship)} · {contact.phone} · {contact.email}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <a className="button-secondary !min-h-9 !px-4 !text-[13px]" href={links.call}>Call</a>
      {links.whatsapp && <a className="button-secondary !min-h-9 !px-4 !text-[13px]" href={links.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
      <a className="button-secondary !min-h-9 !px-4 !text-[13px]" href={links.email}>Email</a>
    </div>
    {log.length > 0
      ? <ul className="mt-3 space-y-1 text-xs text-ink">{log.map((line) => <li key={line}>{line}</li>)}</ul>
      : <p className="mt-3 text-xs font-semibold text-[#8A6400]">No contact logged yet. Check with the poster before approving.</p>}
    <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
      <label className="text-xs font-semibold text-navy"><span className="sr-only">How you contacted them</span>
        <select className="field !min-h-10 !text-[13px]" value={method} onChange={(event) => setMethod(event.target.value as ContactMethod)}>
          <option value="call">Phone call</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="other">Other</option>
        </select>
      </label>
      <label className="text-xs font-semibold text-navy"><span className="sr-only">What they confirmed</span>
        <input className="field !min-h-10 !text-[13px]" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Confirmed the role is real and the deadline is 30 Jan" />
      </label>
      <button type="button" className="button !min-h-10 !px-4 !text-[13px]" disabled={pending || note.trim().length < 3} onClick={save}>{pending ? "Saving…" : "Log contact"}</button>
    </div>
    {message && <p role="alert" className="mt-2 text-xs font-semibold text-[#B3261E]">{message}</p>}
  </section>;
}
