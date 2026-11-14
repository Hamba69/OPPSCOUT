"use client";

import { useRef, useState } from "react";

import { ExternalIcon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";

const checks = [
  ["sourceAuthentic", "Listing is published by the named organization or an authorized partner"],
  ["officialApplicationLink", "Apply link is official or linked from the organization's official site"],
  ["eligibleForUgandans", "Opportunity is based in Uganda or remote and explicitly open to Ugandan applicants"],
  ["noInappropriateFees", "No inappropriate application fee"],
  ["noSensitiveDataAsk", "No unnecessary sensitive-data request"],
  ["deadlinePlausible", "A stated future closing date is shown on the official source"],
  ["duplicateChecked", "Duplicate check completed"],
] as const;

export function ReviewCard({ id, title, organization, sourceUrl, status, description, reviewNotes }: { id: string; title: string; organization: string; sourceUrl: string; status: string; description: string; reviewNotes: string | null }): React.JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function review(approved: boolean): Promise<void> {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const checklist = Object.fromEntries(checks.map(([name]) => [name, data.get(name) === "on"]));
    const response = await fetch(`/api/v1/reports/review/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checklist, approved, notes: String(data.get("notes") ?? "") }) });
    setMessage(response.ok ? (approved ? "Approved and ready for matching." : "Kept out of feeds for follow-up.") : "Review could not be saved. Approval requires every check, including a stated deadline, safe application link and Uganda eligibility.");
    if (response.ok) setDone(true);
  }
  return (
    <article className={`surface ${done ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge value={status} />
          <h3 className="mt-2 text-lg font-extrabold text-ink">{title}</h3>
          <p className="text-sm text-navy">{organization}</p>
        </div>
        <a className="button-secondary shrink-0" href={sourceUrl} target="_blank" rel="noreferrer">Check site <ExternalIcon /></a>
      </div>
      <form ref={formRef} className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); void review(true); }}>
        <details className="rounded-xl border border-ink/10 bg-white/70 px-4">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-navy">Listing details and checks</summary>
          <div className="space-y-3 border-t border-ink/10 py-3">
            <p className="text-sm leading-6 text-navy">{description}</p>
            {reviewNotes && <aside className="rounded-xl border border-honey bg-butter p-3 text-sm font-bold text-ink" role="alert">{reviewNotes}</aside>}
            <fieldset className="space-y-2">
              <legend className="label">Review checks</legend>
              {checks.map(([name, label]) => (
                <label key={name} className="flex items-start gap-3 rounded-xl bg-butter p-3 text-sm font-medium text-ink">
                  <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-leaf" name={name} />
                  {label}
                </label>
              ))}
            </fieldset>
            <label><span className="label">Review note</span><textarea name="notes" className="field min-h-20" /></label>
          </div>
        </details>
        <div className="flex flex-wrap gap-2">
          <button className="button" disabled={done}>Verify</button>
          <button type="button" className="button-secondary" disabled={done} onClick={() => void review(false)}>Flag</button>
        </div>
        {message && <p className="rounded-xl border border-honey bg-butter p-3 text-sm font-bold text-ink" role="status">{message}</p>}
      </form>
    </article>
  );
}
