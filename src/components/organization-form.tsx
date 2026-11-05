"use client";

import { useState } from "react";

import { AccountableContactsFields } from "@/components/accountable-contacts-fields";
import type { AccountableContact } from "@/core/entities/domain";
import { useTransientMessage } from "@/hooks/use-transient-message";

interface OrganizationFormProps {
  id: string;
  name: string;
  sector: string;
  officialLinks: string[];
  officialEmail: string | null;
  registrationProof: string | null;
  accountableContact: string | null;
  accountableContacts?: AccountableContact[];
  additionalAccountableContact: string | null;
  additionalAccountableContactPhone: string | null;
}

export function OrganizationForm(props: OrganizationFormProps): React.JSX.Element {
  const [message, setMessage] = useTransientMessage<string>();
  const [contacts, setContacts] = useState<AccountableContact[]>(() => {
    if (props.accountableContacts?.length) return props.accountableContacts;
    const legacyContacts: AccountableContact[] = [];
    if (props.accountableContact) legacyContacts.push({ name: props.accountableContact, phone: "" });
    if (props.additionalAccountableContact || props.additionalAccountableContactPhone) {
      legacyContacts.push({
        name: props.additionalAccountableContact ?? "",
        phone: props.additionalAccountableContactPhone ?? "",
      });
    }
    return legacyContacts.length ? legacyContacts : [{ name: "", phone: "" }];
  });

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      name: String(data.get("name")),
      sector: String(data.get("sector")),
      officialLinks: String(data.get("officialLinks")).split(",").map((value) => value.trim()).filter(Boolean),
      officialEmail: String(data.get("officialEmail")) || null,
      registrationProof: String(data.get("registrationProof")) || null,
      accountableContacts: contacts,
    };

    setMessage("Saving organization details…");
    try {
      const response = await fetch(`/api/v1/organizations/${props.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setMessage(response.ok ? "Organization details saved." : "Could not save those details.");
    } catch {
      setMessage("Could not connect. Please try saving again.");
    }
  }

  return (
    <form onSubmit={submit} className="card mt-6 grid gap-4 md:grid-cols-2">
      <label><span className="label">Organization name</span><input className="field" name="name" defaultValue={props.name} required /></label>
      <label><span className="label">Sector</span><input className="field" name="sector" defaultValue={props.sector} required /></label>
      <label className="md:col-span-2"><span className="label">Official links</span><input className="field" name="officialLinks" defaultValue={props.officialLinks.join(", ")} required /></label>
      <label className="md:col-span-2"><span className="label">Official email</span><input className="field" type="email" name="officialEmail" defaultValue={props.officialEmail ?? ""} /></label>
      <AccountableContactsFields contacts={contacts} onChange={setContacts} />
      <label className="md:col-span-2"><span className="label">Registration proof reference</span><input className="field" name="registrationProof" defaultValue={props.registrationProof ?? ""} /></label>
      <div className="md:col-span-2 flex flex-wrap items-center gap-4">
        <button className="button">Save organization</button>
        {message && <p role="status" aria-live="polite" className="text-sm font-medium text-[#D4A900]">{message}</p>}
      </div>
    </form>
  );
}
