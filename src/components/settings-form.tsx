"use client";

import { useState } from "react";

export function SettingsForm({
  channel,
  secondaryChannels,
  frequency,
  enabled,
}: {
  channel: string;
  secondaryChannels: string[];
  frequency: string;
  enabled: boolean;
}): React.JSX.Element {
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const secondary = ["email", "sms", "ussd"].filter(
      (value) => data.get(`secondary-${value}`) === "on" && value !== data.get("preferredChannel"),
    );
    const response = await fetch("/api/v1/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferredChannel: String(data.get("preferredChannel")),
        secondaryChannels: secondary,
        notificationFrequency: String(data.get("frequency")),
        notificationsEnabled: data.get("enabled") === "on",
      }),
    });
    setMessage(response.ok ? "Preferences saved." : "We could not save your preferences. Please try again.");
  }

  return (
    <form onSubmit={submit} className="card mt-4 space-y-4">
      <label>
        <span className="label">Best way to reach you</span>
        <select name="preferredChannel" defaultValue={channel} className="field">
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="ussd">USSD inbox</option>
          <option value="web">In-app only</option>
        </select>
      </label>

      <fieldset>
        <legend className="label">Also notify me through</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {(
            [
              ["email", "Email"],
              ["sms", "SMS"],
              ["ussd", "USSD"],
            ] as const
          ).map(([value, name]) => (
            <label
              key={value}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-butter px-3 py-1.5 text-sm font-semibold text-ink"
            >
              <input
                className="size-4 accent-leaf"
                type="checkbox"
                name={`secondary-${value}`}
                defaultChecked={secondaryChannels.includes(value)}
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        <span className="label">Notification frequency</span>
        <select name="frequency" defaultValue={frequency} className="field">
          <option value="instant">Instant, for important matches</option>
          <option value="daily">Daily digest</option>
          <option value="weekly">Weekly digest</option>
        </select>
      </label>

      <label className="flex items-start gap-2.5 rounded-xl border border-ink/10 bg-butter/80 px-3 py-2.5 text-sm font-semibold text-ink">
        <input
          className="mt-0.5 size-4 shrink-0 accent-leaf"
          type="checkbox"
          name="enabled"
          defaultChecked={enabled}
        />
        <span>Send reminders for strong matches and closing dates</span>
      </label>

      <p className="text-xs leading-5 text-navy">
        We cap daily alerts, avoid duplicates for 48 hours, and only send deadline reminders at 7 days, 3
        days, and 24 hours. Major changes to saved opportunities are always highlighted.
      </p>

      <button type="submit" className="button">
        Save preferences
      </button>

      {message && (
        <p className="rounded-xl bg-leaf/10 px-3 py-2 text-sm font-semibold text-leaf" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
