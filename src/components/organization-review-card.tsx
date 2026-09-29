"use client";

import { useState } from "react";

import { ExternalIcon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    setMessage(response.ok ? (approved ? "Organization verified." : "Organization held for follow-up.") : "Decision could not be saved.");
    if (response.ok) setDone(true);
  }

  return <article className={`card ${done ? "opacity-60" : ""}`}><div className="flex items-start justify-between gap-3"><div><StatusBadge value={props.status} /><h2 className="mt-2 text-lg font-extrabold text-ink">{props.name}</h2><p className="text-sm font-bold text-navy">{props.sector}</p></div>{props.officialLinks[0] && <a className="button-secondary" href={props.officialLinks[0]} target="_blank" rel="noreferrer">Check site <ExternalIcon /></a>}</div><dl className="mt-5 grid gap-2 text-sm"><div><dt className="font-bold text-navy">Official email</dt><dd className="text-ink">{props.officialEmail ?? "Not supplied"}</dd></div><div><dt className="font-bold text-navy">Registration proof</dt><dd className="text-ink">{props.registrationProof ?? "Not supplied"}</dd></div><div><dt className="font-bold text-navy">Accountable contact</dt><dd className="text-ink">{props.accountableContact ?? "Not supplied"}</dd></div></dl><div className="mt-5 flex flex-wrap gap-2"><button className="button" disabled={done} onClick={() => void decide(true)}>Verify organization</button><button className="button-secondary" disabled={done} onClick={() => void decide(false)}>Keep flagged</button></div>{message && <p className="mt-3 rounded-2xl border border-honey bg-butter p-3 text-sm font-bold text-ink" role="status">{message}</p>}</article>;
}
