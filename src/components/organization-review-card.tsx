"use client";

import { useState } from "react";

interface OrganizationReviewCardProps {
  id: string;
  name: string;
  sector: string;
  officialLinks: string[];
  officialEmail: string | null;
  registrationProof: string | null;
  accountableContact: string | null;
  status: string;
}

export function OrganizationReviewCard(props: OrganizationReviewCardProps): React.JSX.Element {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function decide(approved: boolean): Promise<void> {
    const response = await fetch(`/api/v1/organizations/review/${props.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-oppscout-demo-role": "admin" },
      body: JSON.stringify({ approved }),
    });
    setMessage(response.ok ? (approved ? "Organization verified." : "Organization held for follow-up.") : "Decision could not be saved.");
    if (response.ok) setDone(true);
  }

  return <article className={`card ${done ? "opacity-60" : ""}`}><div className="flex items-start justify-between gap-3"><div><span className="pill">{props.status}</span><h2 className="mt-2 text-xl font-black">{props.name}</h2><p className="text-sm font-bold text-ink/60">{props.sector}</p></div>{props.officialLinks[0] && <a className="button-secondary" href={props.officialLinks[0]} target="_blank" rel="noreferrer">Check site ↗</a>}</div><dl className="mt-5 grid gap-2 text-sm"><div><dt className="font-black">Official email</dt><dd>{props.officialEmail ?? "Not supplied"}</dd></div><div><dt className="font-black">Registration proof</dt><dd>{props.registrationProof ?? "Not supplied"}</dd></div><div><dt className="font-black">Accountable contact</dt><dd>{props.accountableContact ?? "Not supplied"}</dd></div></dl><div className="mt-5 flex flex-wrap gap-2"><button className="button" disabled={done} onClick={() => void decide(true)}>Verify organization</button><button className="button-secondary" disabled={done} onClick={() => void decide(false)}>Keep flagged</button></div>{message && <p className="mt-3 rounded-2xl bg-butter p-3 text-sm font-bold" role="status">{message}</p>}</article>;
}
