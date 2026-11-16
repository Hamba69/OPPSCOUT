"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { FixAction } from "@/services/admin/catalogue-fixes";

const LABEL: Record<FixAction, string> = {
  "send-to-review": "Send to review",
  "mark-checked": "I re-checked it today",
  remove: "Remove",
};
const HINT: Record<FixAction, string> = {
  "send-to-review": "Moves it back to the review queue so you can approve it with the full checklist.",
  "mark-checked": "Only after opening the source and confirming the listing is still open. Resets the 14-day re-check clock.",
  remove: "Takes it out of the catalogue.",
};

async function post(id: string, action: FixAction): Promise<boolean> {
  const response = await fetch(`/api/v1/admin/opportunities/${id}/fix`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
  return response.ok;
}

export function CatalogueFixActions({ id, actions }: { id: string; actions: FixAction[] }): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const run = (action: FixAction) => {
    if (action === "remove" && !window.confirm("Remove this listing from the catalogue?")) return;
    setMessage("");
    startTransition(async () => {
      const ok = await post(id, action);
      if (ok) router.refresh(); else setMessage("That did not work. Refresh and try again.");
    });
  };
  return <div className="flex flex-wrap items-center gap-2">
    {actions.map((action, index) => <button key={action} type="button" title={HINT[action]} disabled={pending} onClick={() => run(action)} className={`${index === 0 ? "button" : "button-secondary"} !min-h-9 !px-4 !text-[13px]`}>{LABEL[action]}</button>)}
    {message && <span role="status" className="text-xs font-semibold text-[#9B1C1C]">{message}</span>}
  </div>;
}
