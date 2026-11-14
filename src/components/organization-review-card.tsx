"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ExternalIcon } from "@/components/icons";
import type { AccountableContact } from "@/core/entities/domain";
import { StatusBadge } from "@/components/status-badge";

interface OrganizationReviewCardProps {
  id: string;
  name: string;
  sector: string;
  officialLinks: string[];
  officialEmail: string | null;
  registrationProof: string | null;
  registrationProofDocumentId?: string | null;
  accountableContact: string | null;
  accountableContacts?: AccountableContact[];
  additionalAccountableContact?: string | null;
  additionalAccountableContactPhone?: string | null;
  status: string;
}

export function OrganizationReviewCard(props: OrganizationReviewCardProps): React.JSX.Element {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const contacts = props.accountableContacts?.length ? props.accountableContacts : [
    ...(props.accountableContact ? [{ name: props.accountableContact, phone: "" }] : []),
    ...(props.additionalAccountableContact || props.additionalAccountableContactPhone
      ? [{ name: props.additionalAccountableContact ?? "", phone: props.additionalAccountableContactPhone ?? "" }]
      : []),
  ];

  async function decide(approved: boolean): Promise<void> {
    const registrationOverride = approved && !props.registrationProof?.trim();
    if (registrationOverride && !window.confirm("No URSB registration number was supplied. Verify this organization only if you have independently confirmed its identity and legitimacy. Continue?")) return;

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/organizations/review/${props.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, ...(registrationOverride ? { overrideMissingRegistrationProof: true } : {}) }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: { message?: string } };
        setMessage(result.error?.message ?? "Decision could not be saved.");
        return;
      }
      setMessage(approved ? "Organization verified." : "Organization held for follow-up.");
      setDone(true);
      router.refresh();
    } catch {
      setMessage("Decision could not be saved. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`surface ${done ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge value={props.status} />
          <h3 className="mt-2 truncate text-lg font-extrabold text-ink">{props.name}</h3>
          <p className="text-sm text-navy">{props.sector}</p>
        </div>
        {props.officialLinks[0] && (
          <a className="button-secondary shrink-0" href={props.officialLinks[0]} target="_blank" rel="noreferrer">
            Check site <ExternalIcon />
          </a>
        )}
      </div>
      <details className="mt-4 rounded-xl border border-ink/10 bg-white/70 px-4">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-navy">Organization details</summary>
        <dl className="grid gap-3 border-t border-ink/10 py-3 text-sm">
          <div><dt className="font-bold text-navy">Official email</dt><dd className="break-words text-ink">{props.officialEmail ?? "Not supplied"}</dd></div>
          <div><dt className="font-bold text-navy">URSB registration number</dt><dd className="text-ink">{props.registrationProof ?? "Not supplied"}</dd></div>
          <div>
            <dt className="font-bold text-navy">Supporting document</dt>
            <dd className="text-ink">
              {props.registrationProofDocumentId
                ? <a className="font-bold underline" href={`/api/v1/admin/registration-proof/${props.registrationProofDocumentId}`} target="_blank" rel="noreferrer">Review uploaded proof</a>
                : "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-navy">Accountable contacts</dt>
            <dd className="text-ink">
              {contacts.length
                ? <ul>{contacts.map((contact, index) => <li key={`${contact.name}-${index}`}>{contact.name || "Name not supplied"} · {contact.phone || "Phone not supplied"}</li>)}</ul>
                : "Not supplied"}
            </dd>
          </div>
        </dl>
        <p className="border-t border-ink/10 py-3 text-xs leading-5 text-navy">
          Verify the registration number when supplied. Without one, confirmation requires an independent check of the organization&apos;s identity and legitimacy.
        </p>
      </details>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="button" disabled={done || busy} onClick={() => void decide(true)}>
          {busy ? "Saving…" : "Verify"}
        </button>
        <button type="button" className="button-secondary" disabled={done || busy} onClick={() => void decide(false)}>Flag</button>
      </div>
      {message && <p className="mt-3 rounded-xl border border-honey bg-butter p-3 text-sm font-bold text-ink" role="status">{message}</p>}
    </article>
  );
}
