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
    if (!response.ok) { setMessage("We could not create that organization. Check every field and try again."); return; }
    setMessage("Organization created and sent for verification. Opening your dashboard…");
    router.push("/dashboard");
    router.refresh();
  }
  return <form className="card mx-auto mt-8 grid max-w-2xl gap-4 md:grid-cols-2" onSubmit={submit}><label><span className="label">Organization name</span><input className="field" name="name" required /></label><label><span className="label">Sector</span><input className="field" name="sector" required /></label><label className="md:col-span-2"><span className="label">Official website</span><input className="field" type="url" name="officialLink" required /></label><label><span className="label">Official email</span><input className="field" type="email" name="officialEmail" required /></label><label><span className="label">Accountable contact</span><input className="field" name="accountableContact" required /></label><label className="md:col-span-2"><span className="label">Registration or institutional proof</span><input className="field" name="registrationProof" required /></label><div className="md:col-span-2"><button className="button w-full" disabled={busy}>{busy ? "Creating…" : "Create organization"}</button></div>{message && <p className="md:col-span-2 rounded-2xl bg-butter p-3 font-bold" role="status">{message}</p>}</form>;
}
