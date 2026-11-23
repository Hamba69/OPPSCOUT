"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ExternalIcon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { PosterContactPanel } from "@/components/poster-contact-panel";
import type { SubmitterContact } from "@/core/entities/domain";
import { contactLogLines } from "@/services/trust/poster-contact";

const checks = [
  "sourceAuthentic",
  "officialApplicationLink",
  "eligibleForUgandans",
  "noInappropriateFees",
  "noSensitiveDataAsk",
  "deadlinePlausible",
  "duplicateChecked",
] as const;

export interface ReviewCardProps {
  id: string;
  title: string;
  organization: string;
  sourceUrl: string;
  status: string;
  description: string;
  category?: string;
  location?: string;
  deadline?: string | null;
  applicationMethod?: string;
  /** Research evidence written by the seeding pipeline: source, retrieval time and verbatim quotes. */
  reviewNotes?: string | null;
  /** Member posts: who posted it and how to reach them. */
  submitterContact?: SubmitterContact | null;
}

/** Pulls the quoted evidence lines out of the pipeline's notes so the reviewer can check them at a glance. */
export function evidenceLines(notes: string | null | undefined): Array<{ label: string; text: string }> {
  if (!notes) return [];
  const lines: Array<{ label: string; text: string }> = [];
  for (const raw of notes.split("\n")) {
    const line = raw.trim();
    const deadline = line.match(/^Deadline evidence:\s*(.+)$/);
    const uganda = line.match(/^Ugandan eligibility \(([^)]+)\):\s*(.+)$/);
    const seeded = line.match(/^Seeded .+ from (\S+) \(retrieved ([^)]+)\)\.?$/);
    if (deadline) lines.push({ label: "Deadline, as the page says", text: deadline[1]! });
    else if (uganda) lines.push({ label: `Uganda eligibility (${uganda[1]!.replace(/_/g, " ")})`, text: uganda[2]! });
    else if (seeded) lines.push({ label: "Source page, as researched", text: `${seeded[1]} on ${seeded[2]}` });
  }
  return lines;
}

export function ReviewCard({ id, title, organization, sourceUrl, status, description, category, location, deadline, applicationMethod, reviewNotes, submitterContact }: ReviewCardProps): React.JSX.Element {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const evidence = evidenceLines(reviewNotes);
  async function review(approved: boolean): Promise<void> {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const requirementsChecked = data.get("requirementsChecked") === "on";
    if (approved && !requirementsChecked) { setMessage("Tick the confirmation box before approving."); return; }
    const checklist = Object.fromEntries(checks.map((name) => [name, approved && requirementsChecked]));
    const response = await fetch(`/api/v1/reports/review/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checklist, approved, notes: String(data.get("notes") ?? "") }) });
    setMessage(response.ok ? (approved ? "Approved. It is now live for matching." : "Flagged and removed from the queue.") : "Review could not be saved. Approval requires a future closing date (or a rolling listing), a safe application link and every check.");
    if (response.ok) {
      setDone(true);
      router.refresh();
    }
  }
  return (
    <article className={`surface ${done ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge value={status} />
          <h3 className="mt-2 text-lg font-extrabold text-ink">{title}</h3>
          <p className="text-sm text-navy">{organization}{category ? ` · ${category}` : ""}{location ? ` · ${location}` : ""}</p>
          <p className="mt-1 text-sm font-semibold text-ink">{deadline ? `Closes ${new Date(deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Kampala" })}` : "Rolling: no closing date"}</p>
        </div>
        <a className="button-secondary shrink-0" href={sourceUrl} target="_blank" rel="noreferrer">Check site <ExternalIcon /></a>
      </div>
      {submitterContact && <div className="mt-4"><PosterContactPanel id={id} title={title} contact={submitterContact} initialLog={contactLogLines(reviewNotes)} /></div>}
      {evidence.length > 0 && (
        <dl className="mt-4 space-y-2 rounded-xl bg-ink/[.04] p-3 text-sm">
          {evidence.map((item) => <div key={item.label}><dt className="text-xs font-bold text-navy">{item.label}</dt><dd className="text-ink">{item.text}</dd></div>)}
        </dl>
      )}
      <form ref={formRef} className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); void review(true); }}>
        <details className="rounded-xl glass-inset px-4">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-navy">Description and how to apply</summary>
          <div className="space-y-3 border-t border-ink/10 py-3">
            <p className="text-sm leading-6 text-navy">{description}</p>
            {applicationMethod && <p className="text-sm leading-6 text-navy"><strong className="text-ink">How to apply:</strong> {applicationMethod}</p>}
            <label><span className="label">Review note (optional)</span><textarea name="notes" className="field min-h-20" /></label>
          </div>
        </details>
        <label className="flex items-start gap-3 rounded-xl glass-notice p-3 text-sm font-medium text-ink">
          <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-leaf" name="requirementsChecked" />
          {submitterContact ? "I checked the source and confirmed with the poster: the listing is genuine, open to Ugandans, free to apply and the deadline is right" : "I checked the source: the listing is genuine, open to Ugandans, free to apply and the deadline is right"}
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="button" disabled={done}>Approve</button>
          <button type="button" className="button-secondary" disabled={done} onClick={() => void review(false)}>Flag and remove</button>
        </div>
        {message && <p className="rounded-xl glass-notice p-3 text-sm font-bold text-ink" role="status">{message}</p>}
      </form>
    </article>
  );
}
