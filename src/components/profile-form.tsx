"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileMultiChoice, ProfileSelect } from "@/components/profile-choice";
import { buildProfileChoices, type ProfileChoices } from "@/services/profile/choices";
import { calculateProfileCompleteness } from "@/services/profile/completeness";

export interface ProfileFormInitial {
  name: string; email: string; phone: string; educationLevel: string; fieldOfStudy: string; graduationStatus: string;
  dateOfBirth: string; location: string; skills: string[]; careerInterests: string[]; preferredLocations: string[];
  opportunityCategories: string[]; languages: string[]; workModePreference: "remote" | "onsite" | "hybrid" | "";
}
const DEFAULT_CHOICES = buildProfileChoices();
const MULTI_FIELDS = ["skills", "careerInterests", "preferredLocations", "opportunityCategories", "languages"] as const;
type MultiField = typeof MULTI_FIELDS[number];
type SingleField = "educationLevel" | "fieldOfStudy" | "graduationStatus" | "location";
const WORK_MODES = [
  { value: "remote", label: "Remote", detail: "Work from where you are", symbol: "⌂" },
  { value: "onsite", label: "On-site", detail: "Be there with the team", symbol: "▦" },
  { value: "hybrid", label: "Hybrid", detail: "A little of both", symbol: "↔" },
  { value: "", label: "No preference", detail: "Keep my options open", symbol: "✦" },
] as const;

function SectionHeading({ number, title, hint }: { number: string; title: string; hint: string }): React.JSX.Element {
  return <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-butter font-black" aria-hidden="true">{number}</span><div><h2 className="text-lg font-extrabold">{title}</h2><p className="text-sm text-navy">{hint}</p></div></div>;
}

export function ProfileForm({ initial, choices = DEFAULT_CHOICES, afterSavePath }: { initial: ProfileFormInitial; choices?: ProfileChoices; afterSavePath?: string }): React.JSX.Element {
  const router = useRouter();
  const [fields, setFields] = useState(initial);
  const [selected, setSelected] = useState<Record<MultiField, string[]>>(() => Object.fromEntries(MULTI_FIELDS.map((field) => [field, [...initial[field]]])) as Record<MultiField, string[]>);
  const [message, setMessage] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const completeness = calculateProfileCompleteness({ ...fields, ...selected, dateOfBirth: fields.dateOfBirth ? new Date(fields.dateOfBirth) : null, workModePreference: fields.workModePreference || null });
  function update(field: Exclude<keyof ProfileFormInitial, MultiField>, value: string): void { setFields((previous) => ({ ...previous, [field]: value })); }
  function selectProps(field: SingleField, label: string) { return { name: field, label, options: choices[field], value: fields[field], allowCustom: field === "location" || field === "fieldOfStudy", onChange: (value: string) => update(field, value) }; }
  function multiProps(field: MultiField, label: string, hint: string) { return { name: field, label, hint, options: choices[field], values: selected[field], onChange: (values: string[]) => setSelected((previous) => ({ ...previous, [field]: values })) }; }
  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage(""); setSaveFailed(false);
    const body = { name: fields.name.trim(), email: fields.email.trim() || null, phone: fields.phone.trim() || null, educationLevel: fields.educationLevel || null, fieldOfStudy: fields.fieldOfStudy || null, graduationStatus: fields.graduationStatus || null, dateOfBirth: fields.dateOfBirth || null, location: fields.location || null, ...selected, workModePreference: fields.workModePreference || null };
    try {
      const response = await fetch("/api/v1/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } } | null;
        const problems = Object.values(result?.error?.details?.fieldErrors ?? {}).flat();
        setSaveFailed(true);
        setMessage(response.status === 401 ? "Your session has ended. Sign in again to save your profile." : problems.length ? problems.join(" ") : result?.error?.message ?? "We could not save that yet. Please try again.");
      } else if (afterSavePath) { router.replace(afterSavePath); router.refresh(); }
      else { setMessage("Profile saved. Your choices are ready for matching."); router.refresh(); }
    } catch { setSaveFailed(true); setMessage("We could not connect to save your profile. Please try again."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-6 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-ink px-5 py-4 text-white">
      <div><p className="text-sm font-extrabold">Make it feel like you.</p><p className="mt-1 text-xs text-white/75">Pick what’s true today. You can always change your choices.</p></div>
      <div className="flex items-center gap-3"><div className="h-2 w-24 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Profile completeness" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-sun transition-all" style={{ width: `${completeness}%` }} /></div><span className="text-sm font-bold">{completeness}%</span></div>
    </div>
    <fieldset className="card"><legend className="sr-only">About you</legend><SectionHeading number="01" title="Start with you" hint="Your name is all you need to continue." />
      <div className="grid gap-4 md:grid-cols-2">
        <label><span className="label">Your name</span><input className="field" name="name" autoComplete="name" value={fields.name} onChange={(event) => update("name", event.target.value)} required minLength={2} maxLength={120} placeholder="Your name" /></label>
        <label><span className="label">Email</span><input className="field" name="email" type="email" autoComplete="email" value={fields.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" /></label>
        <label><span className="label">Phone</span><input className="field" name="phone" type="tel" autoComplete="tel" value={fields.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+256…" /></label>
        <ProfileSelect {...selectProps("location", "Where you live now")} />
      </div>
    </fieldset>
    <fieldset className="card"><legend className="sr-only">Study and skills</legend><SectionHeading number="02" title="What you bring" hint="Choose your background, then mark the skills you use." />
      <div className="grid gap-4 md:grid-cols-2"><ProfileSelect {...selectProps("educationLevel", "Education level")} /><ProfileSelect {...selectProps("fieldOfStudy", "Field of study")} /><ProfileSelect {...selectProps("graduationStatus", "Study / graduation status")} />
        <label><span className="label">Date of birth</span><input className="field" type="date" name="dateOfBirth" value={fields.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} max={new Date().toISOString().slice(0, 10)} /></label>
      </div>
      <div className="mt-6 space-y-4"><ProfileMultiChoice {...multiProps("skills", "Skills", "Pick as many as you genuinely have. Search to find more.")} /><ProfileMultiChoice {...multiProps("languages", "Languages", "Mark the languages you can use comfortably.")} /></div>
    </fieldset>
    <fieldset className="card"><legend className="sr-only">Your next chapter</legend><SectionHeading number="03" title="Your next chapter" hint="What would you like to discover?" />
      <div className="space-y-4"><ProfileMultiChoice {...multiProps("opportunityCategories", "Opportunity types", "A new role, a study award, or something in between? Mark your interests.")} /><ProfileMultiChoice {...multiProps("careerInterests", "Career interests", "Choose the areas you’d like to grow into.")} /><ProfileMultiChoice {...multiProps("preferredLocations", "Places you would work", "Select every place you’re open to. Remote is an option too.")} /></div>
      <fieldset className="mt-6"><legend className="label">How would you like to work?</legend><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{WORK_MODES.map((mode) => <label key={mode.value} className="relative cursor-pointer"><input className="peer sr-only" type="radio" name="workModePreference" value={mode.value} checked={fields.workModePreference === mode.value} onChange={() => update("workModePreference", mode.value)} /><span className="flex h-full min-h-28 flex-col rounded-3xl border border-ink/15 bg-white p-4 transition hover:border-ink/40 peer-checked:border-ink peer-checked:bg-butter peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"><span className="text-2xl" aria-hidden="true">{mode.symbol}</span><span className="mt-2 font-extrabold">{mode.label}</span><span className="mt-1 text-xs text-navy">{mode.detail}</span></span></label>)}</div></fieldset>
    </fieldset>
    {message && <p className={`rounded-2xl border p-4 text-sm font-semibold ${saveFailed ? "border-coral bg-coral/10" : "border-honey bg-butter"}`} role={saveFailed ? "alert" : "status"}>{message}</p>}
    <div className="sticky bottom-24 z-10 rounded-3xl border border-ink/10 bg-white/95 p-3 shadow-soft backdrop-blur md:static md:flex md:items-center md:justify-between md:p-4"><p className="mb-3 text-center text-xs text-navy md:mb-0 md:text-left">Your profile stays private. Only choose details that are accurate.</p><button className="button w-full md:w-auto" disabled={busy}>{busy ? "Saving your choices…" : "Save my profile →"}</button></div>
  </form>;
}
