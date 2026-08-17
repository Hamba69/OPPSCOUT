"use client";

import { useEffect, useRef, useState } from "react";

export function OpportunityActions({ opportunityId, sourceUrl }: { opportunityId: string; sourceUrl: string }): React.JSX.Element {
  const tracked = useRef(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void fetch(`/api/v1/opportunities/${opportunityId}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "view" }) });
  }, [opportunityId]);

  async function save(): Promise<void> {
    const response = await fetch("/api/v1/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId }) });
    setMessage(response.ok ? "Saved. We’ll help you remember the deadline." : "Could not save this yet.");
  }

  async function report(): Promise<void> {
    const reason = window.prompt("What looks suspicious? Please keep it brief.");
    if (!reason) return;
    const response = await fetch("/api/v1/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId, reason }) });
    setMessage(response.ok ? "Thank you. This listing is now held for review." : "Could not send the report yet.");
  }

  async function apply(): Promise<void> {
    await fetch(`/api/v1/opportunities/${opportunityId}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "click" }) });
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
  }

  return <div className="mt-6"><div className="flex flex-wrap gap-3"><button className="button" onClick={save}>Save opportunity</button><button className="button-secondary" onClick={apply}>Apply on official site ↗</button><button className="rounded-full px-4 py-2 text-sm font-bold text-coral hover:bg-coral/10" onClick={report}>Report listing</button></div>{message && <p className="mt-3 rounded-2xl bg-butter p-3 text-sm font-bold" role="status">{message}</p>}</div>;
}
