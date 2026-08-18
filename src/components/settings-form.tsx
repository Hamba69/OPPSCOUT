"use client";

import { useState } from "react";

export function SettingsForm({ channel, secondaryChannels, frequency, enabled }: { channel: string; secondaryChannels: string[]; frequency: string; enabled: boolean }): React.JSX.Element {
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const secondary = ["email", "sms", "ussd"].filter((value) => data.get(`secondary-${value}`) === "on" && value !== data.get("preferredChannel"));
    const response = await fetch("/api/v1/notifications/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferredChannel: String(data.get("preferredChannel")), secondaryChannels: secondary, notificationFrequency: String(data.get("frequency")), notificationsEnabled: data.get("enabled") === "on" }) });
    setMessage(response.ok ? "Preferences saved." : "Could not save preferences yet.");
  }
  return <form onSubmit={submit} className="card mt-8 max-w-xl space-y-5"><label><span className="label">Best way to reach you</span><select name="preferredChannel" defaultValue={channel} className="field"><option value="email">Email</option><option value="sms">SMS</option><option value="ussd">USSD inbox</option><option value="web">In-app only</option></select></label><fieldset><legend className="label">Also notify me through</legend><div className="grid gap-2 sm:grid-cols-3">{["email", "sms", "ussd"].map((value) => <label key={value} className="flex items-center gap-2 rounded-2xl bg-butter/60 p-3 font-bold capitalize"><input type="checkbox" name={`secondary-${value}`} defaultChecked={secondaryChannels.includes(value)} />{value}</label>)}</div></fieldset><label><span className="label">Notification frequency</span><select name="frequency" defaultValue={frequency} className="field"><option value="instant">Instant for important matches</option><option value="daily">Daily digest</option><option value="weekly">Weekly digest</option></select></label><label className="flex items-center gap-3 rounded-2xl bg-butter p-4 font-bold"><input className="size-5 accent-ink" type="checkbox" name="enabled" defaultChecked={enabled} />Send high-fit and deadline reminders</label><p className="text-sm leading-6 text-ink/60">We cap daily alerts, avoid duplicates for 48 hours, and only send deadline reminders at 7 days, 3 days, and 24 hours. Major changes to saved opportunities are always highlighted.</p><button className="button">Save preferences</button>{message && <p className="font-bold" role="status">{message}</p>}</form>;
}
