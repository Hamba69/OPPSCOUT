"use client";

import type { AccountableContact } from "@/core/entities/domain";

interface AccountableContactsFieldsProps {
  contacts: AccountableContact[];
  onChange: (contacts: AccountableContact[]) => void;
}

const MAX_CONTACTS = 10;

export function AccountableContactsFields({ contacts, onChange }: AccountableContactsFieldsProps): React.JSX.Element {
  function update(index: number, patch: Partial<AccountableContact>): void {
    onChange(contacts.map((contact, contactIndex) => contactIndex === index ? { ...contact, ...patch } : contact));
  }

  return (
    <section className="grid gap-4 md:col-span-2" aria-labelledby="accountable-contacts-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="accountable-contacts-heading" className="font-bold text-ink">Accountable contacts</h2>
          <p className="mt-1 text-sm text-navy">Add a name and phone number for each person we can contact about this publisher profile.</p>
        </div>
        <button
          type="button"
          className="button-secondary !min-h-9 !px-3 !py-1.5 text-sm"
          onClick={() => onChange([...contacts, { name: "", phone: "" }])}
          disabled={contacts.length >= MAX_CONTACTS}
        >
          + Add contact
        </button>
      </div>
      {contacts.map((contact, index) => (
        <fieldset key={index} className="grid gap-4 rounded-2xl border border-ink/10 bg-cream/50 p-4 md:grid-cols-2">
          <legend className="px-1 text-sm font-bold text-navy">Contact {index + 1}</legend>
          <label>
            <span className="label">Name</span>
            <input
              className="field"
              name={`accountableContactName-${index}`}
              value={contact.name}
              onChange={(event) => update(index, { name: event.target.value })}
              maxLength={180}
              autoComplete="name"
              required
              placeholder="Full name"
            />
          </label>
          <label>
            <span className="label">Phone number</span>
            <input
              className="field"
              type="tel"
              name={`accountableContactPhone-${index}`}
              value={contact.phone}
              onChange={(event) => update(index, { phone: event.target.value })}
              maxLength={32}
              autoComplete="tel"
              required
              placeholder="+256 700 000000"
            />
          </label>
          {index > 0 && (
            <button type="button" className="justify-self-start text-sm font-semibold text-navy underline underline-offset-4" onClick={() => onChange(contacts.filter((_, contactIndex) => contactIndex !== index))}>
              Remove contact {index + 1}
            </button>
          )}
        </fieldset>
      ))}
    </section>
  );
}
