"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileMultiChoice, ProfileSelect } from "@/components/profile-choice";
import type { ProfileChoice, ProfileChoices } from "@/services/profile/choices";

export interface ExperienceItem { title: string; organization: string; months: number }

export interface ProfileFormInitial {
  name: string; email: string; phone: string; dateOfBirth: string; location: string;
  educationLevel: string; institution: string; fieldOfStudy: string; graduationStatus: string;
  skills: string[]; certifications: string[]; languages: string[];
  workExperience: ExperienceItem[]; internshipExperience: ExperienceItem[];
  opportunityCategories: string[]; careerInterests: string[]; preferredLocations: string[];
  workModePreference: "remote" | "onsite" | "hybrid" | "";
}

type State = ProfileFormInitial;
type Errors = Partial<Record<"name" | "email" | "phone" | "dateOfBirth", string>>;

const EDUCATION_ORDER = ["no formal education", "secondary", "certificate", "diploma", "bachelors", "masters", "phd"];
const GRADUATION: ProfileChoice[] = [
  { value: "studying", label: "Currently studying" }, { value: "first year", label: "First year" }, { value: "second year", label: "Second year" },
  { value: "third year", label: "Third year" }, { value: "final year", label: "Final year" }, { value: "masters student", label: "Master’s student" },
  { value: "phd student", label: "PhD student" }, { value: "graduated within 12 months", label: "Graduated within the last 12 months" }, { value: "graduated", label: "Graduated" },
];
const WORK_MODES = [["", "No preference"], ["onsite", "On-site"], ["hybrid", "Hybrid"], ["remote", "Remote"]] as const;

const SECTIONS = [
  ["personal", "Personal details"], ["education", "Education"], ["skills", "Skills and languages"],
  ["experience", "Experience"], ["preferences", "Opportunity preferences"],
] as const;

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }): React.JSX.Element {
  return <label className="block"><span className="label">{label}{required && <span className="text-[#B3261E]" aria-hidden="true"> *</span>}{!required && <span className="ml-1 text-xs font-medium text-navy">(optional)</span>}</span>
    {children}
    {hint && !error && <span className="mt-1 block text-xs text-navy">{hint}</span>}
    {error && <span className="mt-1 block text-xs font-semibold text-[#B3261E]" role="alert">{error}</span>}
  </label>;
}

function Section({ id, title, hint, done, children }: { id: string; title: string; hint: string; done: boolean; children: React.ReactNode }): React.JSX.Element {
  return <section id={id} aria-labelledby={`${id}-title`} className="card scroll-mt-24">
    <div className="flex items-start justify-between gap-3">
      <div><h2 id={`${id}-title`} className="text-lg font-extrabold text-ink">{title}</h2><p className="mt-1 text-sm text-navy">{hint}</p></div>
      {done && <span className="badge-verified shrink-0">Complete</span>}
    </div>
    <div className="mt-5 space-y-5">{children}</div>
  </section>;
}

function TagInput({ label, hint, values, onChange, placeholder }: { label: string; hint: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }): React.JSX.Element {
  const [draft, setDraft] = useState("");
  function add(): void {
    const value = draft.trim();
    if (value && !values.some((item) => item.toLowerCase() === value.toLowerCase()) && values.length < 50) onChange([...values, value]);
    setDraft("");
  }
  return <div><span className="label">{label} <span className="ml-1 text-xs font-medium text-navy">(optional)</span></span>
    <div className="flex gap-2"><input className="field" value={draft} maxLength={120} placeholder={placeholder} aria-label={label}
      onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} />
      <button type="button" className="button-secondary shrink-0" onClick={add} disabled={!draft.trim()}>Add</button></div>
    <p className="mt-1 text-xs text-navy">{hint}</p>
    {values.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{values.map((value) => <li key={value}><button type="button" onClick={() => onChange(values.filter((item) => item !== value))} aria-label={`Remove ${value}`}
      className="inline-flex min-h-9 items-center gap-2 rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">{value}<span aria-hidden="true">×</span></button></li>)}</ul>}
  </div>;
}

function ExperienceList({ title, addLabel, items, onChange }: { title: string; addLabel: string; items: ExperienceItem[]; onChange: (v: ExperienceItem[]) => void }): React.JSX.Element {
  function patch(index: number, change: Partial<ExperienceItem>): void { onChange(items.map((item, i) => (i === index ? { ...item, ...change } : item))); }
  return <div><div className="flex items-center justify-between gap-3"><h3 className="font-extrabold text-ink">{title}</h3>
    <button type="button" className="button-secondary !min-h-10 !py-1.5 text-sm" disabled={items.length >= 30} onClick={() => onChange([...items, { title: "", organization: "", months: 0 }])}>{addLabel}</button></div>
    {items.length === 0 && <p className="mt-2 text-sm text-navy">Nothing added yet.</p>}
    <div className="mt-3 space-y-3">{items.map((item, index) => <fieldset key={index} className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
      <legend className="px-1 text-xs font-bold text-navy">{title} {index + 1}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Job title" required><input className="field" value={item.title} maxLength={160} onChange={(event) => patch(index, { title: event.target.value })} placeholder="e.g. Data Analyst" /></Field>
        <Field label="Organization"><input className="field" value={item.organization} maxLength={160} onChange={(event) => patch(index, { organization: event.target.value })} placeholder="e.g. Ministry of Health" /></Field>
        <Field label="Years"><select className="field" value={Math.floor(item.months / 12)} onChange={(event) => patch(index, { months: Number(event.target.value) * 12 + (item.months % 12) })}>{Array.from({ length: 31 }, (_, y) => <option key={y} value={y}>{y}</option>)}</select></Field>
        <Field label="Months"><select className="field" value={item.months % 12} onChange={(event) => patch(index, { months: Math.floor(item.months / 12) * 12 + Number(event.target.value) })}>{Array.from({ length: 12 }, (_, m) => <option key={m} value={m}>{m}</option>)}</select></Field>
      </div>
      <button type="button" className="mt-3 min-h-10 text-sm font-semibold text-[#B3261E] underline underline-offset-4" onClick={() => onChange(items.filter((_, i) => i !== index))}>Remove this entry</button>
    </fieldset>)}</div></div>;
}

export function ProfileForm({ initial, choices, isNew, nextPath }: { initial: ProfileFormInitial; choices: ProfileChoices; isNew: boolean; nextPath: string }): React.JSX.Element {
  const router = useRouter();
  const [state, setState] = useState<State>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dirty, setDirty] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const education = useMemo(() => [...choices.educationLevel].sort((a, b) => (EDUCATION_ORDER.indexOf(a.value) + 99) % 99 - (EDUCATION_ORDER.indexOf(b.value) + 99) % 99 || a.label.localeCompare(b.label)), [choices.educationLevel]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function set<K extends keyof State>(key: K, value: State[K]): void { setState((current) => ({ ...current, [key]: value })); setDirty(true); setStatus("idle"); }

  const done = {
    personal: Boolean(state.name.trim() && state.phone.trim() && state.location),
    education: Boolean(state.educationLevel && state.fieldOfStudy && state.graduationStatus),
    skills: state.skills.length > 0 && state.languages.length > 0,
    experience: state.workExperience.length + state.internshipExperience.length > 0,
    preferences: state.opportunityCategories.length > 0 && state.preferredLocations.length > 0,
  };

  function validate(): Errors {
    const next: Errors = {};
    if (state.name.trim().length < 2) next.name = "Enter your full name.";
    if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) next.email = "Enter a valid email address.";
    if (state.phone && !/^\+?[0-9\s-]{7,16}$/.test(state.phone.trim())) next.phone = "Enter a valid phone number, for example +256 700 000000.";
    if (state.dateOfBirth && state.dateOfBirth > today) next.dateOfBirth = "Date of birth cannot be in the future.";
    return next;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) { setStatus("error"); document.getElementById("personal")?.scrollIntoView({ behavior: "smooth" }); return; }
    setStatus("saving");
    const experience = (items: ExperienceItem[]): { title: string; organization?: string; months: number }[] => items.filter((item) => item.title.trim())
      .map((item) => ({ title: item.title.trim(), ...(item.organization.trim() ? { organization: item.organization.trim() } : {}), months: item.months }));
    const body = {
      name: state.name.trim(), email: state.email.trim() || null, phone: state.phone.trim() || null, dateOfBirth: state.dateOfBirth || null, location: state.location || null,
      educationLevel: state.educationLevel || null, institution: state.institution.trim() || null, fieldOfStudy: state.fieldOfStudy || null, graduationStatus: state.graduationStatus || null,
      skills: state.skills, certifications: state.certifications, languages: state.languages,
      workExperience: experience(state.workExperience), internshipExperience: experience(state.internshipExperience),
      opportunityCategories: state.opportunityCategories, careerInterests: state.careerInterests, preferredLocations: state.preferredLocations,
      workModePreference: state.workModePreference || null,
    };
    try {
      const response = await fetch("/api/v1/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) { setStatus("error"); return; }
      setDirty(false); setStatus("saved");
      if (isNew) { router.push(nextPath); router.refresh(); return; }
      router.refresh();
    } catch { setStatus("error"); }
  }

  return <div className="mt-6 grid gap-8 lg:grid-cols-[15rem_1fr]">
    <nav aria-label="Profile sections" className="hidden lg:block"><ol className="sticky top-24 space-y-1">{SECTIONS.map(([id, label]) => <li key={id}>
      <a href={`#${id}`} className="flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-sm font-semibold text-navy hover:bg-butter hover:text-ink">{label}
        <span aria-label={done[id] ? "Complete" : "Incomplete"} className={`size-2.5 rounded-full ${done[id] ? "bg-leaf" : "bg-ink/15"}`} /></a></li>)}</ol></nav>

    <form onSubmit={submit} noValidate className="space-y-5">
      <Section id="personal" title="Personal details" hint="Used to contact you about opportunities. Never shown to other users." done={done.personal}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" required error={errors.name}><input className="field" value={state.name} autoComplete="name" maxLength={120} required aria-invalid={Boolean(errors.name)} onChange={(event) => set("name", event.target.value)} placeholder="e.g. Amina Nakato" /></Field>
          <Field label="Email address" error={errors.email}><input className="field" type="email" value={state.email} autoComplete="email" aria-invalid={Boolean(errors.email)} onChange={(event) => set("email", event.target.value)} placeholder="name@example.com" /></Field>
          <Field label="Phone number" hint="Include the country code. Used for SMS alerts if you enable them." error={errors.phone}><input className="field" type="tel" value={state.phone} autoComplete="tel" aria-invalid={Boolean(errors.phone)} onChange={(event) => set("phone", event.target.value)} placeholder="+256 700 000000" /></Field>
          <Field label="Date of birth" hint="Some opportunities have age limits." error={errors.dateOfBirth}><input className="field" type="date" value={state.dateOfBirth} max={today} aria-invalid={Boolean(errors.dateOfBirth)} onChange={(event) => set("dateOfBirth", event.target.value)} /></Field>
        </div>
        <ProfileSelect name="location" label="Current location" options={choices.location} value={state.location} onChange={(v) => set("location", v)} allowCustom />
      </Section>

      <Section id="education" title="Education" hint="Eligibility is checked against these details first." done={done.education}>
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileSelect name="educationLevel" label="Highest education level" options={education} value={state.educationLevel} onChange={(v) => set("educationLevel", v)} />
          <ProfileSelect name="graduationStatus" label="Study status" options={GRADUATION} value={state.graduationStatus} onChange={(v) => set("graduationStatus", v)} />
          <ProfileSelect name="fieldOfStudy" label="Field of study" options={choices.fieldOfStudy} value={state.fieldOfStudy} onChange={(v) => set("fieldOfStudy", v)} allowCustom />
          <Field label="Institution"><input className="field" value={state.institution} maxLength={240} onChange={(event) => set("institution", event.target.value)} placeholder="e.g. Makerere University" /></Field>
        </div>
      </Section>

      <Section id="skills" title="Skills and languages" hint="The more accurately you list these, the better your matches." done={done.skills}>
        <ProfileMultiChoice name="skills" label="Skills" hint="Select all that apply." options={choices.skills} values={state.skills} onChange={(v) => set("skills", v)} />
        <TagInput label="Certifications" hint="For example: CPA, PMP, AWS Cloud Practitioner. Type one and press Add." values={state.certifications} onChange={(v) => set("certifications", v)} placeholder="Certification name" />
        <ProfileMultiChoice name="languages" label="Languages" hint="Languages you can work in." options={choices.languages} values={state.languages} onChange={(v) => set("languages", v)} />
      </Section>

      <Section id="experience" title="Experience" hint="Add roles you have held. Duration is used for experience requirements." done={done.experience}>
        <ExperienceList title="Work experience" addLabel="Add role" items={state.workExperience} onChange={(v) => set("workExperience", v)} />
        <ExperienceList title="Internships" addLabel="Add internship" items={state.internshipExperience} onChange={(v) => set("internshipExperience", v)} />
      </Section>

      <Section id="preferences" title="Opportunity preferences" hint="Tell us what you are looking for so we can rank it first." done={done.preferences}>
        <ProfileMultiChoice name="opportunityCategories" label="Opportunity types" hint="Choose the types you want to see." options={choices.opportunityCategories} values={state.opportunityCategories} onChange={(v) => set("opportunityCategories", v)} />
        <ProfileMultiChoice name="careerInterests" label="Career interests" hint="Sectors or areas you want to work in." options={choices.careerInterests} values={state.careerInterests} onChange={(v) => set("careerInterests", v)} />
        <ProfileMultiChoice name="preferredLocations" label="Preferred locations" hint="Where you would be willing to work or study." options={choices.preferredLocations} values={state.preferredLocations} onChange={(v) => set("preferredLocations", v)} />
        <Field label="Work arrangement"><select className="field" value={state.workModePreference} onChange={(event) => set("workModePreference", event.target.value as State["workModePreference"])}>{WORK_MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      </Section>

      <div className="sticky bottom-24 z-10 flex flex-wrap items-center gap-3 rounded-3xl border border-ink/10 bg-white/95 p-3 shadow-soft backdrop-blur md:bottom-4">
        <button className="button" disabled={status === "saving"}>{status === "saving" ? "Saving…" : isNew ? "Save and see my matches" : "Save changes"}</button>
        <p className="min-w-0 flex-1 text-sm" role="status" aria-live="polite">
          {status === "saved" && <span className="font-bold text-leaf">Profile saved. <Link href="/feed" className="underline">View my matches</Link></span>}
          {status === "error" && <span className="font-bold text-[#B3261E]">{Object.keys(errors).length ? "Please correct the highlighted fields." : "We could not save your profile. Please try again."}</span>}
          {status === "idle" && dirty && <span className="text-navy">You have unsaved changes.</span>}
        </p>
      </div>
    </form>
  </div>;
}
