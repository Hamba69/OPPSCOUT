"use client";

import { useId, useState } from "react";
import { choiceLabel, type ProfileChoice } from "@/services/profile/choices";

interface ChoiceProps { name: string; label: string; options: ProfileChoice[]; value: string; onChange: (value: string) => void; allowCustom?: boolean }

export function ProfileSelect({ name, label, options, value, onChange, allowCustom = false }: ChoiceProps): React.JSX.Element {
  const [custom, setCustom] = useState(false);
  const values = value && !options.some((option) => option.value === value) ? [{ value, label: choiceLabel(value) }, ...options] : options;
  return <div><label><span className="label">{label}</span><select className="field" name={name} value={custom ? "__custom" : value} onChange={(event) => { const next = event.target.value; setCustom(next === "__custom"); onChange(next === "__custom" ? "" : next); }}>
    <option value="">Choose when you’re ready</option>
    {values.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    {allowCustom && <option value="__custom">Another option…</option>}
  </select></label>{custom && <label className="mt-2 block"><span className="label">{name === "location" ? "Your location" : `Your ${label.toLowerCase()}`}</span><input className="field" value={value} maxLength={120} onChange={(event) => onChange(event.target.value)} placeholder="Enter the detail that fits you" /></label>}</div>;
}

interface MultiProps { name: string; label: string; hint: string; options: ProfileChoice[]; values: string[]; onChange: (values: string[]) => void }

export function ProfileMultiChoice({ name, label, hint, options, values, onChange }: MultiProps): React.JSX.Element {
  const id = useId();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [custom, setCustom] = useState("");
  const selected = new Set(values);
  const allOptions: ProfileChoice[] = [...options, ...values.filter((value) => !options.some((option) => option.value === value)).map((value) => ({ value, label: choiceLabel(value) }))];
  const filtered = allOptions.filter((option) => `${option.label} ${option.value} ${option.keywords?.join(" ") ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const visible = search || expanded ? filtered : filtered.slice(0, 12);
  function toggle(value: string): void { onChange(selected.has(value) ? values.filter((item) => item !== value) : [...values, value]); }
  function addCustom(): void {
    const value = custom.trim();
    if (!value || values.length >= 50) return;
    const known = options.find((option) => option.value.toLowerCase() === value.toLowerCase() || option.label.toLowerCase() === value.toLowerCase());
    const resolved = known?.value ?? value;
    if (!selected.has(resolved)) onChange([...values, resolved]);
    setCustom("");
  }
  return <fieldset className="min-w-0 rounded-3xl border border-ink/10 bg-white/80 p-4 sm:p-5" aria-describedby={`${id}-hint`}>
    <legend className="px-2 font-extrabold">{label}</legend>
    <div className="flex items-start justify-between gap-3"><p id={`${id}-hint`} className="text-sm text-navy">{hint}</p><span className="shrink-0 rounded-full bg-butter px-2.5 py-1 text-xs font-bold" aria-live="polite">{values.length} picked</span></div>
    <label className="mt-4 block"><span className="sr-only">Search {label.toLowerCase()}</span><input className="field" type="search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} placeholder={`Find ${label.toLowerCase()}…`} /></label>
    {values.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label={`Selected ${label.toLowerCase()}`}>{values.map((value) => <button key={value} type="button" onClick={() => toggle(value)} aria-label={`Remove ${choiceLabel(value)}`} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">{allOptions.find((option) => option.value === value)?.label}<span aria-hidden="true">×</span></button>)}</div>}
    <div className="mt-4 flex max-h-64 flex-wrap gap-2 overflow-y-auto p-1">
      {visible.map((option) => <label key={option.value} className="relative cursor-pointer">
        <input className="peer sr-only" type="checkbox" name={name} value={option.value} checked={selected.has(option.value)} disabled={!selected.has(option.value) && values.length >= 50} onChange={() => toggle(option.value)} />
        <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-ink/40 peer-checked:border-ink peer-checked:bg-butter peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:opacity-40"><span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded border ${selected.has(option.value) ? "border-ink bg-ink text-white" : "border-ink/30"}`}>{selected.has(option.value) ? "✓" : ""}</span>{option.label}</span>
      </label>)}
      {!visible.length && <p className="text-sm text-navy">No choices found. You can add your own below.</p>}
    </div>
    {!search && filtered.length > 12 && <button type="button" className="mt-3 min-h-10 text-sm font-bold underline underline-offset-4" onClick={() => setExpanded(!expanded)}>{expanded ? "Show fewer" : `Explore all ${filtered.length} choices`}</button>}
    <details className="mt-3 text-sm"><summary className="cursor-pointer py-2 font-semibold text-navy">Something else to add?</summary><div className="mt-2 flex flex-wrap gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Add another {label.toLowerCase()}</span><input className="field" value={custom} maxLength={120} onChange={(event) => setCustom(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustom(); } }} placeholder="Add one detail" /></label><button type="button" className="button-secondary" onClick={addCustom} disabled={!custom.trim() || values.length >= 50}>Add</button></div></details>
  </fieldset>;
}
