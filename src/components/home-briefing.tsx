import Link from "next/link";

import { Icon } from "@/components/app-shell";
import { SaveButton } from "@/components/save-button";
import type { ClosingItem, NewTile } from "@/lib/home-briefing";
import type { ProfileNudge } from "@/services/profile/nudge";

/** The breathing orb. While matching runs it turns and sends out a second ripple. */
export function BriefingOrb({ working = false }: { working?: boolean }): React.JSX.Element {
  return <div className="briefing-orb" aria-hidden="true">
    <span className="orb-ripple" />
    {working && <span className="orb-ripple orb-ripple-late" />}
    <span className={`orb ${working ? "orb-working" : "orb-breathing"}`} />
  </div>;
}

/**
 * First card on the Matches home: date, greeting and one button. The button opens today's matches
 * (/feed/all); the matching itself runs while that page loads, and its loading screen shows the progress.
 */
export function TodayCard({ dateLine, salutation, firstName, ready }: { dateLine: string; salutation: string; firstName?: string; ready: boolean }): React.JSX.Element {
  return <section className="briefing-card rise" aria-labelledby="today-greeting">
    <div className="relative flex items-center gap-4">
      <BriefingOrb />
      <div className="min-w-0 flex-1">
        <p className="briefing-eyebrow">{dateLine}</p>
        <h1 id="today-greeting" className="briefing-greeting">{salutation}{firstName ? <>, <strong>{firstName}</strong></> : null}</h1>
      </div>
    </div>
    {ready
      ? <Link href="/feed/all" className="button relative !min-h-12 self-start !px-6 !text-[15px]">View today&apos;s matches<Icon name="arrow" size={18} /></Link>
      : <div className="relative flex flex-col gap-3">
          <p className="text-sm text-navy">Add your education, field of study, skills and the opportunity types you want so we can find relevant matches.</p>
          <Link href="/profile" className="button !min-h-12 self-start !px-6 !text-[15px]">Complete your profile<Icon name="arrow" size={18} /></Link>
        </div>}
  </section>;
}

/** Saved opportunities closing soon, or, with nothing saved, the seeker's matches closing first (with a save button). */
export function ClosingSoon({ items, fromSaved }: { items: ClosingItem[]; fromSaved: boolean }): React.JSX.Element | null {
  if (!items.length) return null;
  return <section className="briefing-panel rise rise-2" aria-labelledby="closing-soon-title">
    <div className="flex items-baseline justify-between gap-2">
      <h2 id="closing-soon-title" className="text-base font-bold text-ink">{fromSaved ? "Closing soon" : "Closing soon in your matches"}</h2>
      {fromSaved && <span className="text-xs font-semibold text-navy">From your saved list</span>}
    </div>
    <ul className="flex flex-col gap-3.5">
      {items.map((item) => <li key={item.opportunityId} className="relative flex items-center gap-3">
        <span className={`days-badge ${item.daysLeft <= 5 ? "days-badge-urgent" : ""}`}>
          <span className="text-lg font-extrabold leading-none">{item.daysLeft}</span>
          <span className="mt-0.5 text-[10px] font-bold">{item.daysLeft === 1 ? "day" : "days"}</span>
        </span>
        <span className="min-w-0 flex-1">
          <Link href={`/opportunity/${item.opportunityId}`} className="stretch clamp-1 block text-sm font-bold text-ink focus-visible:underline">{item.title}</Link>
          <span className="mt-0.5 block text-xs text-navy">{item.detail}</span>
        </span>
        {fromSaved ? <Icon name="chevron" size={16} className="shrink-0 text-navy" /> : <SaveButton opportunityId={item.opportunityId} />}
      </li>)}
    </ul>
  </section>;
}

/** Listings published today, by type. Each tile opens the Opportunities page filtered to that type. */
export function NewToday({ tiles }: { tiles: NewTile[] }): React.JSX.Element | null {
  if (!tiles.length) return null;
  return <section className="rise rise-3 flex flex-col gap-3.5" aria-labelledby="new-today-title">
    <div className="flex items-baseline justify-between px-1">
      <h2 id="new-today-title" className="text-base font-bold text-ink">New today</h2>
      <Link href="/opportunities" className="text-[13px] font-bold text-[#6B4E00] hover:text-ink">Browse all</Link>
    </div>
    <nav aria-label="New today by type" className="new-tiles">
      {tiles.map((tile) => <Link key={tile.type} href={`/opportunities?type=${encodeURIComponent(tile.type)}`} className={`tile tile-tinted tint-${tile.type} new-tile`}>
        <span className="text-2xl font-extrabold leading-none">{tile.count}</span>
        <span className="text-xs font-bold">{tile.label}</span>
      </Link>)}
    </nav>
  </section>;
}

/** Shown only while the profile is incomplete, with the one field worth adding next. */
export function ProfileStrength({ nudge }: { nudge: ProfileNudge | null }): React.JSX.Element | null {
  if (!nudge) return null;
  return <section className="briefing-panel rise rise-4 !flex-row items-center !gap-3.5" aria-labelledby="profile-strength-title">
    <div className="profile-ring" style={{ "--progress": `${nudge.completeness}%` } as React.CSSProperties} role="img" aria-label={`Profile ${nudge.completeness}% complete`}>
      <span>{nudge.completeness}%</span>
    </div>
    <div className="min-w-0 flex-1">
      <h2 id="profile-strength-title" className="text-sm font-bold text-ink">Strengthen your profile</h2>
      <p className="mt-1 text-xs leading-5 text-navy">{nudge.tip}</p>
    </div>
    <Link href={nudge.href} className="icon-button shrink-0" aria-label={`Add ${nudge.field.toLowerCase()}`}><Icon name="chevron" size={16} /></Link>
  </section>;
}
