"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OrganizationOnboardingForm(): React.JSX.Element {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: String(data.get("name")), sector: String(data.get("sector")), officialLinks: [String(data.get("officialLink"))], officialEmail: String(data.get("officialEmail")) || null, registrationProof: String(data.get("registrationProof")) || null, accountableContact: String(data.get("accountableContact")) || null }) });
    setBusy(false);
    if (!response.ok) { setMessage("We could not create your organization. Check that every field is complete and the website starts with https://."); return; }
    setMessage("Organization created and sent for verification. Opening your dashboard…");
    router.push("/dashboard");
    router.refresh();
  }
  return <form className="card mx-auto mt-8 grid max-w-2xl gap-4 md:grid-cols-2" onSubmit={submit}><label><span className="label">Organization name</span><input className="field" name="name" placeholder="Nile Innovation Hub" required /></label><label><span className="label">Sector</span><select className="field" name="sector" required defaultValue=""><option value="" disabled>Select a sector</option>{["Education", "Health", "Technology", "Agriculture", "Finance and business", "Government and public sector", "NGO / non-profit", "Media and communications", "Energy and environment", "Other"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="md:col-span-2"><span className="label">Official website</span><input className="field" type="url" name="officialLink" required placeholder="https://www.example.org" /><span className="mt-1 block text-xs text-navy">Must be your organization’s own website.</span></label><label><span className="label">Official email</span><input className="field" type="email" name="officialEmail" required placeholder="careers@example.org" /></label><label><span className="label">Contact person</span><input className="field" name="accountableContact" required placeholder="Full name and job title" /></label><label className="md:col-span-2"><span className="label">Registration number or proof</span><input className="field" name="registrationProof" required placeholder="e.g. URSB registration number" /><span className="mt-1 block text-xs text-navy">Used only by our review team to verify your organization.</span></label><div className="md:col-span-2"><button className="button w-full" disabled={busy}>{busy ? "Creating…" : "Create organization"}</button></div>{message && <p className="md:col-span-2 rounded-2xl border border-honey bg-butter p-3 font-bold text-ink" role="status">{message}</p>}</form>;
}
