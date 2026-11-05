"use client";

import { useTransientMessage } from "@/hooks/use-transient-message";

interface OrganizationFormProps {
  id: string;
  name: string;
  sector: string;
  officialLinks: string[];
  officialEmail: string | null;
  registrationProof: string | null;
  accountableContact: string | null;
  additionalAccountableContact: string | null;
  additionalAccountableContactPhone: string | null;
}

export function OrganizationForm(props: OrganizationFormProps): React.JSX.Element {
  const [message, setMessage] = useTransientMessage<string>();

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      name: String(data.get("name")),
      sector: String(data.get("sector")),
      officialLinks: String(data.get("officialLinks")).split(",").map((value) => value.trim()).filter(Boolean),
      officialEmail: String(data.get("officialEmail")) || null,
      registrationProof: String(data.get("registrationProof")) || null,
      accountableContact: String(data.get("accountableContact")) || null,
      additionalAccountableContact: String(data.get("additionalAccountableContact")) || null,
      additionalAccountableContactPhone: String(data.get("additionalAccountableContactPhone")) || null,
    };
    if (Boolean(body.additionalAccountableContact) !== Boolean(body.additionalAccountableContactPhone)) {
      setMessage("Add both the additional contact name and phone number.");
      return;
    }

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
      <label><span className="label">Official email</span><input className="field" type="email" name="officialEmail" defaultValue={props.officialEmail ?? ""} /></label>
      <label><span className="label">Accountable contact</span><input className="field" name="accountableContact" defaultValue={props.accountableContact ?? ""} /></label>
      <section className="grid gap-4 rounded-2xl border border-ink/10 bg-cream/50 p-4 md:col-span-2 md:grid-cols-2" aria-labelledby="additional-contact-heading">
        <div className="md:col-span-2">
          <h2 id="additional-contact-heading" className="font-bold text-ink">Additional accountable contact</h2>
          <p className="mt-1 text-sm text-navy">Add another person our team can contact about this publisher profile.</p>
        </div>
        <label><span className="label">Contact name</span><input className="field" name="additionalAccountableContact" defaultValue={props.additionalAccountableContact ?? ""} /></label>
        <label><span className="label">Phone number</span><input className="field" type="tel" name="additionalAccountableContactPhone" defaultValue={props.additionalAccountableContactPhone ?? ""} placeholder="+256 700 000000" /></label>
      </section>
      <label className="md:col-span-2"><span className="label">Registration proof reference</span><input className="field" name="registrationProof" defaultValue={props.registrationProof ?? ""} /></label>
      <div className="md:col-span-2 flex flex-wrap items-center gap-4">
        <button className="button">Save organization</button>
        {message && <p role="status" aria-live="polite" className="text-sm font-bold text-[#B8860B]">{message}</p>}
      </div>
    </form>
  );
}
