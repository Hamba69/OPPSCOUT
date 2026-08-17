"use client";

import { useRef, useState } from "react";

const checks = [
  ["sourceAuthentic", "Official source is authentic"],
  ["noInappropriateFees", "No inappropriate application fee"],
  ["noSensitiveDataAsk", "No unnecessary sensitive-data request"],
  ["deadlinePlausible", "Deadline is plausible"],
  ["duplicateChecked", "Duplicate check completed"],
] as const;

export function ReviewCard({ id, title, organization, sourceUrl, status, description }: { id: string; title: string; organization: string; sourceUrl: string; status: string; description: string }): React.JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function review(approved: boolean): Promise<void> {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const checklist = Object.fromEntries(checks.map(([name]) => [name, data.get(name) === "on"]));
    const response = await fetch(`/api/v1/reports/review/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-oppscout-demo-role": "admin" }, body: JSON.stringify({ checklist, approved, notes: String(data.get("notes") ?? "") }) });
    setMessage(response.ok ? (approved ? "Approved and ready for matching." : "Kept out of feeds for follow-up.") : "Review could not be saved. Approval requires every check.");
    if (response.ok) setDone(true);
  }
  return <article className={`card ${done ? "opacity-60" : ""}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`pill ${status === "flagged" ? "bg-coral/20" : ""}`}>{status}</span><h2 className="mt-2 text-xl font-black">{title}</h2><p className="text-sm font-bold text-ink/60">{organization}</p></div><a className="button-secondary" href={sourceUrl} target="_blank" rel="noreferrer">Check source ↗</a></div><p className="mt-4 text-sm leading-6 text-ink/70">{description}</p><form ref={formRef} className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); void review(true); }}>{checks.map(([name, label]) => <label key={name} className="flex items-center gap-3 rounded-2xl bg-butter/60 p-3 text-sm font-bold"><input type="checkbox" className="size-5 accent-ink" name={name} />{label}</label>)}<label><span className="label">Review note</span><textarea name="notes" className="field min-h-20" /></label><div className="flex flex-wrap gap-2"><button className="button" disabled={done}>Approve</button><button type="button" className="button-secondary" disabled={done} onClick={() => void review(false)}>Keep flagged</button></div>{message && <p className="rounded-2xl bg-butter p-3 text-sm font-bold" role="status">{message}</p>}</form></article>;
}
