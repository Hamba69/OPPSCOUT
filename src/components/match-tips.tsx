import Link from "next/link";

import { Icon } from "@/components/app-shell";
import type { MatchTip } from "@/services/profile/match-tips";

/**
 * Shown when someone has no or few matches: one line of why, then up to three tappable steps. Kept small so
 * it never crowds the matches that are there.
 */
export function MatchTips({ tips, hasMatches }: { tips: MatchTip[]; hasMatches: boolean }): React.JSX.Element | null {
  if (!tips.length) return null;
  return <section className="briefing-panel" aria-labelledby="match-tips-title">
    <div>
      <h2 id="match-tips-title" className="text-base font-bold text-ink">{hasMatches ? "Get more matches" : "No matches yet"}</h2>
      <p className="mt-1 text-xs leading-5 text-navy">{hasMatches ? "A few additions to your profile would bring in more." : "Your profile is missing a few things listings look for."}</p>
    </div>
    <ul className="flex flex-col">
      {tips.map((tip) => <li key={tip.text} className="border-t border-ink/[.07] first:border-t-0">
        <Link href={tip.href} className="flex min-h-11 items-center gap-3 py-2 text-sm font-semibold text-ink hover:text-[#6B4E00]">
          <span className="min-w-0 flex-1">{tip.text}</span>
          <Icon name="chevron" size={16} className="shrink-0 text-navy" />
        </Link>
      </li>)}
    </ul>
    {!hasMatches && <Link href="/opportunities" className="self-start text-[13px] font-bold text-[#6B4E00] hover:text-ink">Or browse all opportunities</Link>}
  </section>;
}
