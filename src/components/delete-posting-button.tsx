"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Removes a member's own posting after an inline confirmation. */
export function DeletePostingButton({ id, title }: { id: string; title: string }): React.JSX.Element {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const remove = (): void => startTransition(async () => {
    const response = await fetch(`/api/v1/opportunities/${id}`, { method: "DELETE" });
    if (response.ok) { router.replace("/my-postings"); router.refresh(); return; }
    setMessage("It could not be removed. Please try again.");
  });
  if (!confirming) return <button type="button" className="button-secondary !text-[#B3261E]" onClick={() => setConfirming(true)}>Remove posting</button>;
  return <div className="flex flex-wrap items-center gap-2">
    <span className="text-sm font-semibold text-ink">Remove “{title}” for good?</span>
    <button type="button" className="button !bg-[#B3261E] !text-white" disabled={pending} onClick={remove}>{pending ? "Removing…" : "Yes, remove"}</button>
    <button type="button" className="button-secondary" disabled={pending} onClick={() => setConfirming(false)}>Cancel</button>
    {message && <span role="alert" className="text-sm font-semibold text-[#B3261E]">{message}</span>}
  </div>;
}
