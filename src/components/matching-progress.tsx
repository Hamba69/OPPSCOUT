"use client";

import { useEffect, useState } from "react";

import { BriefingOrb } from "@/components/home-briefing";
import { Icon } from "@/components/app-shell";

export const MATCHING_STEPS = ["Checking every open listing", "Applying your eligibility", "Comparing your skills and field", "Ranking by fit"] as const;

/**
 * Loading screen for today's matches. It is only on screen while the server is really matching, and the
 * steps are the order OrbitMatch works in. If matching takes longer than the steps, the last one stays active.
 */
export function MatchingProgress(): React.JSX.Element {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, MATCHING_STEPS.length - 1)), 750);
    return () => window.clearInterval(timer);
  }, []);
  // The working orb sits centred above the heading, and the whole card is centred in the visible page.
  return <main className="matching-screen" aria-busy="true">
    <section className="briefing-card matching-card" aria-labelledby="matching-title">
      <div className="relative flex flex-col items-center gap-3 text-center">
        <BriefingOrb working />
        <div>
          <p className="briefing-eyebrow">Today&apos;s matches</p>
          <h1 id="matching-title" className="briefing-greeting"><strong>Finding your matches…</strong></h1>
        </div>
      </div>
      <ol className="relative flex flex-col gap-2.5" aria-label="Matching progress">
        {MATCHING_STEPS.map((label, index) => <li key={label} className={`matching-step ${index < step ? "is-done" : index === step ? "is-active" : ""}`} aria-current={index === step ? "step" : undefined}>
          <span className="matching-dot">{index < step && <Icon name="check" size={11} strokeWidth={4} />}</span>{label}
        </li>)}
      </ol>
      <div className="matching-track" aria-hidden="true"><div style={{ width: `${Math.round(((step + 1) / MATCHING_STEPS.length) * 100)}%` }} /></div>
      <p className="sr-only" role="status">{MATCHING_STEPS[step]}</p>
    </section>
  </main>;
}
