import Link from "next/link";

import { Icon } from "@/components/app-shell";
import type { MatchTip } from "@/services/profile/match-tips";

/** Each step gets its own colour, from the same family as the home tiles. */
const STEP_TINTS = ["tint-job", "tint-internship", "tint-fellowship"];

/**
 * Shown when someone has no or few matches: a warm card with a question, one line of why, then up to three
 * numbered steps, each its own colour. Kept small so it never crowds the matches that are there.
 */
export function MatchTips({ tips, hasMatches }: { tips: MatchTip[]; hasMatches: boolean }): React.JSX.Element | null {
  if (!tips.length) return null;
  return <section className="match-tips" aria-labelledby="match-tips-title">
    <div className="flex items-center gap-3">
      <span className="orb orb-breathing h-9 w-9" aria-hidden />
      <div className="min-w-0">
        <h2 id="match-tips-title" className="text-base font-bold text-ink">{hasMatches ? "Need more matches?" : "No matches yet?"}</h2>
        <p className="text-xs leading-5 text-navy">{hasMatches ? "These would open up listings you nearly matched." : "Listings you nearly matched are looking for these."}</p>
      </div>
    </div>
    <ol className="flex flex-col gap-2">
      {tips.map((tip, index) => <li key={tip.text}>
        <Link href={tip.href} className={`match-tip ${STEP_TINTS[index % STEP_TINTS.length]}`}>
          <span className="match-tip-number" aria-hidden>{index + 1}</span>
          <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink">{tip.text}</span>
          <Icon name="chevron" size={16} className="shrink-0 text-navy" />
        </Link>
      </li>)}
    </ol>
    {!hasMatches && <Link href="/opportunities" className="self-start text-[13px] font-bold text-[#6B4E00] hover:text-ink">Or browse all opportunities</Link>}
  </section>;
}
