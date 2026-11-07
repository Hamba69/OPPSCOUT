"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AccountableContactsFields } from "@/components/accountable-contacts-fields";
import type { AccountableContact } from "@/core/entities/domain";
import { useTransientMessage } from "@/hooks/use-transient-message";
import { uploadRegistrationProof } from "@/lib/registration-proof-upload";

export function OrganizationOnboardingForm(): React.JSX.Element {
  const router = useRouter();
  const [message, setMessage] = useTransientMessage<string>();
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState<AccountableContact[]>([{ name: "", phone: "" }]);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage(null);
    const data = new FormData(event.currentTarget);
    try {
      const officialLink = String(data.get("officialLink"));
      const officialEmail = String(data.get("officialEmail"));
      const website = new URL(officialLink);
      if (website.protocol !== "https:" || website.username || website.password) {
        setMessage("Enter the organization's public HTTPS website without login credentials.");
        return;
      }
      const websiteDomain = website.hostname.toLowerCase().replace(/^www\./, "");
      const emailDomain = officialEmail.trim().toLowerCase().split("@").pop()?.replace(/^www\./, "") ?? "";
      if (!(emailDomain === websiteDomain || emailDomain.endsWith(`.${websiteDomain}`) || websiteDomain.endsWith(`.${emailDomain}`))) {
        setMessage("Use an official email address that matches the organization's website domain.");
        return;
      }

      const proofFile = data.get("registrationProofFile");
      if (!(proofFile instanceof File) || proofFile.size < 1) {
        setMessage("Upload a URSB registration proof document.");
        return;
      }
      const registrationProofDocumentId = await uploadRegistrationProof(proofFile);

      const response = await fetch("/api/v1/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: String(data.get("name")),
        sector: String(data.get("sector")),
        officialLinks: [officialLink],
        officialEmail,
        registrationProof: String(data.get("registrationProof")) || null,
        registrationProofDocumentId,
        accountableContacts: contacts,
      }) });
      if (!response.ok) {
        const result = await response.json() as { error?: { message?: string } };
        setMessage(result.error?.message ?? "We could not submit your publisher profile.");
        return;
      }
      setMessage("Publisher profile submitted for verification. Opening your dashboard…");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage("Could not complete publisher verification. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="card mx-auto mt-8 grid max-w-2xl gap-4 md:grid-cols-2" onSubmit={submit}>
      <label>
        <span className="label">Organization or publisher name</span>
        <input className="field" name="name" placeholder="Nile Innovation Hub" required />
      </label>
      <label>
        <span className="label">Sector</span>
        <select className="field" name="sector" required defaultValue="">
          <option value="" disabled>Select a sector</option>
          {["Education", "Health", "Technology", "Agriculture", "Finance and business", "Government and public sector", "NGO / non-profit", "Media and communications", "Energy and environment", "Other"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="md:col-span-2">
        <span className="label">Official website</span>
        <input className="field" type="url" name="officialLink" required placeholder="https://www.example.org" />
        <span className="mt-1 block text-xs text-navy">Use the organization's public HTTPS website.</span>
      </label>
      <label className="md:col-span-2">
        <span className="label">Official email</span>
        <input className="field" type="email" name="officialEmail" required placeholder="careers@example.org" />
        <span className="mt-1 block text-xs text-navy">Must use the same domain as the official website (for example, careers@example.org for example.org).</span>
      </label>
      <AccountableContactsFields contacts={contacts} onChange={setContacts} />
      <label className="md:col-span-2">
        <span className="label">URSB registration number</span>
        <input className="field" name="registrationProof" required placeholder="e.g. URSB registration number" />
        <span className="mt-1 block text-xs text-navy">Our review team will check this number against your supporting document.</span>
      </label>
      <label className="md:col-span-2">
        <span className="label">URSB registration proof</span>
        <input className="field" type="file" name="registrationProofFile" accept=".pdf,.docx,.odt,.jpg,.jpeg,.png" required />
        <span className="mt-1 block text-xs text-navy">Upload a clear certificate or official URSB document (PDF, DOCX, ODT, JPG or PNG; maximum 5 MB).</span>
      </label>
      <div className="md:col-span-2">
        <button className="button w-full" disabled={busy}>{busy ? "Submitting…" : "Submit publisher profile"}</button>
      </div>
      {message && <p className="md:col-span-2 text-sm font-medium text-[#D4A900]" role="status" aria-live="polite">{message}</p>}
    </form>
  );
}
