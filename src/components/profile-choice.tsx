"use client";

import { useId, useState } from "react";
import { choiceLabel, type ProfileChoice } from "@/services/profile/choices";

interface ChoiceProps { name: string; label: string; options: ProfileChoice[]; value: string; onChange: (value: string) => void; allowCustom?: boolean }

export function ProfileSelect({ name, label, options, value, onChange, allowCustom = false }: ChoiceProps): React.JSX.Element {
  const [custom, setCustom] = useState(false);
  const values = value && !options.some((option) => option.value === value) ? [{ value, label: choiceLabel(value) }, ...options] : options;
  return <div><label><span className="label">{label}</span><select className="field" name={name} value={custom ? "__custom" : value} onChange={(event) => { const next = event.target.value; setCustom(next === "__custom"); onChange(next === "__custom" ? "" : next); }}>
    <option value="">Select an option</option>
    {values.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    {allowCustom && <option value="__custom">Other (type your own)</option>}
  </select></label>{custom && <label className="mt-2 block"><span className="label">{name === "location" ? "Your location" : `Your ${label.toLowerCase()}`}</span><input className="field" value={value} maxLength={120} onChange={(event) => onChange(event.target.value)} placeholder="Type here" /></label>}</div>;
}

interface MultiProps { name: string; label: string; hint: string; options: ProfileChoice[]; values: string[]; onChange: (values: string[]) => void }

export function ProfileMultiChoice({ name, label, hint, options, values, onChange }: MultiProps): React.JSX.Element {
  const id = useId();
  const [search, setSearch] = useState("");
  const selected = new Set(values);
  const allOptions: ProfileChoice[] = [...options, ...values.filter((value) => !options.some((option) => option.value === value)).map((value) => ({ value, label: choiceLabel(value) }))];
  const query = search.trim();
  const matches = query ? allOptions.filter((option) => `${option.label} ${option.value} ${option.keywords?.join(" ") ?? ""}`.toLowerCase().includes(query.toLowerCase())) : [];
  const filtered = [...matches].sort((a, b) => {
    const aExact = a.value.toLowerCase() === query.toLowerCase() || a.label.toLowerCase() === query.toLowerCase();
    const bExact = b.value.toLowerCase() === query.toLowerCase() || b.label.toLowerCase() === query.toLowerCase();
    return Number(bExact) - Number(aExact) || a.label.localeCompare(b.label);
  }).slice(0, 8);
  const exactMatch = allOptions.some((option) => option.value.toLowerCase() === query.toLowerCase() || option.label.toLowerCase() === query.toLowerCase());
  function toggle(value: string): void { onChange(selected.has(value) ? values.filter((item) => item !== value) : [...values, value]); }
  function addCustom(): void {
    const value = query;
    if (!value || values.length >= 50) return;
    const known = options.find((option) => option.value.toLowerCase() === value.toLowerCase() || option.label.toLowerCase() === value.toLowerCase());
    const resolved = known?.value ?? value;
    if (!selected.has(resolved)) onChange([...values, resolved]);
    setSearch("");
  }
  return <fieldset className="min-w-0 rounded-3xl border border-ink/10 bg-white/80 p-4 sm:p-5" aria-describedby={`${id}-hint`}>
    <legend className="px-2 font-extrabold">{label}</legend>
    <div className="flex items-start justify-between gap-3"><p id={`${id}-hint`} className="text-sm text-navy">{hint}</p><span className="shrink-0 rounded-full bg-butter px-2.5 py-1 text-xs font-bold" aria-live="polite">{values.length} selected</span></div>
    <label className="mt-4 block"><span className="sr-only">Search {label.toLowerCase()}</span><input className="field" type="search" value={search} maxLength={120} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (query && !exactMatch) addCustom(); } }} placeholder={`Type to search ${label.toLowerCase()}`} /></label>
    {values.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label={`Selected ${label.toLowerCase()}`}>{values.map((value) => <button key={value} type="button" onClick={() => toggle(value)} aria-label={`Remove ${choiceLabel(value)}`} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">{allOptions.find((option) => option.value === value)?.label}<span aria-hidden="true">×</span></button>)}</div>}
    {query && <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-ink/10 bg-white p-2">
      {filtered.map((option) => <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1 text-sm font-semibold text-ink hover:bg-butter">
        <input className="peer sr-only" type="checkbox" name={name} value={option.value} checked={selected.has(option.value)} disabled={!selected.has(option.value) && values.length >= 50} onChange={() => toggle(option.value)} />
        <span aria-hidden="true" className={`flex size-4 shrink-0 items-center justify-center rounded border ${selected.has(option.value) ? "border-ink bg-ink text-white" : "border-ink/30"} peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink`}>{selected.has(option.value) ? "✓" : ""}</span>
        {option.label}
      </label>)}
      {!filtered.length && <p className="px-2 py-1 text-sm text-navy">No matching options.</p>}
      {!exactMatch && <button type="button" className="button-secondary mt-2" onClick={addCustom} disabled={!query || values.length >= 50}>Add “{query}”</button>}
    </div>}
    {!query && <p className="mt-2 text-xs text-navy">Start typing to find an option, or add your own.</p>}
  </fieldset>;
}
