---
name: ui-ux-audit
description: Audit, validate and improve the UI and UX of any website, web app, component, design file or screenshot. Runs a structured review across accessibility (WCAG 2.2), usability heuristics, performance (Core Web Vitals, low-bandwidth), design-system consistency, modern HTML/CSS platform use, content and microcopy, trust and dark patterns, and AI or agent-facing interfaces, then returns severity-ranked findings with concrete fixes and a ship or no-ship verdict. Use this skill whenever the user asks to review, check, audit, critique, validate, QA, score, polish or "make better" a UI, page, flow, dashboard, form, landing page or design system, asks if a site is accessible, fast, usable, modern or ready to launch, shares a URL, screenshot, Figma export or front-end code and wants feedback, or wants a UX checklist, a redesign plan, or an accessibility or performance pass, even if they never say "audit".
---

# UI/UX Audit

A skill for finding what is wrong with an interface, proving it, and fixing it in the right order. It covers three jobs that share one method:

- **Check**: find defects and risks in a UI that already exists.
- **Validate**: confirm that a UI, or a fix, meets a stated bar (WCAG 2.2 AA, a performance budget, a launch checklist). Report only what was actually tested.
- **Improve**: turn findings into a ranked fix plan, and when code is available, into the smallest diff that resolves each one.

The skill is for evaluation. To generate a distinctive new visual direction, use `frontend-design` or `udesign` and come back here to check the result.

## The method in one paragraph

Interfaces are repetitive by construction. The same token, component and template appears hundreds of times, and each appearance runs through the same grid of contexts (screen size, theme, input device, network, language, ability). That repetition is a symmetry, and it makes auditing cheap: verify one representative of each repeated thing, sweep the repetition mechanically, then spend human judgment on the places where the symmetry breaks or never existed. A defect is very often a broken symmetry (one button that does not match its siblings, one state nobody drew). This is the useful core of the `scc-reasoning` skill carried over to design review: find the symmetry, compress by it, attack from two directions, and certify with a count. The mathematics in that skill is not used here; the four-step shape is.

## Workflow

### Step 0. Scope and ground (keep it short)

Establish four things from the request, and state any you assumed in one line rather than interrogating the user:

1. **Subject**: URL, repo, component, screenshot, flow, or design file. Say what evidence you actually have (running page, source only, one screenshot). Findings are only as strong as the evidence, and the report must say which kind each came from.
2. **Audience and job**: who uses it and the one thing the page or flow exists to do.
3. **Context floor**: the weakest realistic user context. Default to a mid-range Android phone on an unreliable 3G/4G connection, a keyboard-only user, and a screen reader user. If the audience is known, tighten this (for example, a Uganda-first product should treat metered data and low-end devices as the norm, not an edge case).
4. **Bar**: the standard to validate against. Default to WCAG 2.2 AA, Core Web Vitals "good" at p75, and the heuristics in `references/01-foundations-and-history.md`.

If the subject is a URL and web tools exist, fetch it. If it is a repo, read the entry points, global CSS and layout first. If it is a screenshot, say plainly that behavior, focus order, performance and responsive behavior cannot be verified from an image.

### Step 1. Find the symmetry (inventory)

Write down the repeated structure before judging anything. This takes minutes and removes most of the work later.

- **Tokens**: colors, type sizes, spacing, radii, shadows, z-index, durations. Count the distinct values actually used. `scripts/audit_static.py` does this for code.
- **Components**: buttons, inputs, cards, modals, nav, tables, toasts. Note variants.
- **Templates**: page types (home, list, detail, form, dashboard, error).
- **State matrix**: every interactive component should exist in default, hover, focus-visible, active, disabled, loading, empty, error, success.
- **Context axes**: viewport (320, 375, 768, 1280, 1920), theme (light, dark, forced-colors), input (touch, mouse, keyboard, voice), network (offline, slow 3G, fast), text (200% size, 400% zoom, long strings, RTL), motion (reduced), ability (screen reader, low vision, cognitive load).

### Step 2. Compress and sweep the symmetric part

Treat the interface as `symmetric part + residual`. Handle the symmetric part with sweeps that are exact and cheap.

1. **Run the static scanner** when code or saved HTML is available: `python scripts/audit_static.py <path> --format md`. Its findings are candidates, not verdicts. Confirm each before reporting it as a defect, and delete false positives.
2. **Token drift check**: if a scale has 6 spacing steps designed but 31 distinct values in the CSS, the system is leaking. Report the count.
3. **State matrix sweep**: for each component type, list missing states. One missing focus style on the shared button fixes every button on the site, so shared components get priority.
4. **Template sweep**: check one page per template, then only the differences between pages of the same template.

### Step 3. Attack the residual from two directions

What the sweeps cannot reach is the residual: unique flows, one-off pages, content, judgment calls. Use both of these attacks, and switch to the other when one stalls.

- **Lift (broaden the context)**: render or reason about the same screen across the context axes from Step 1. Ask what breaks when the viewport shrinks, the theme flips, the network slows, the user tabs instead of tapping. Defects that only appear in a particular combination live here.
- **Boundary (go to the extremes)**: probe the edges, because failures cluster there. 320 px wide. 400% zoom. 200% text size. A 60-character surname. Zero results. 10,000 results. Failed request. Expired session. No JavaScript. Screen reader reading order. Paste into the password field. Back button after submit. The slowest thing a user can plausibly be on.

For the task flow itself, walk the primary job end to end as the target user and count steps, decisions, fields and waits. Heuristic and flow lenses are in `references/05-ux-flows-and-patterns.md`.

### Step 4. Certify with a count

A review should end in numbers a reader can check, not an adjective.

Severity scale (assign by user impact, not by how easy the fix is):

| Level | Meaning | Examples |
|---|---|---|
| S0 Blocker | Task impossible for some users, legal exposure, data loss, security-relevant UX | Keyboard trap, unlabeled form on a checkout, no way to cancel a subscription, CTA unreachable on mobile |
| S1 Major | Task possible but painful or error-prone for many users | Contrast failure on body text, CLS on load, 6 s LCP on 3G, error messages that do not say what to fix |
| S2 Minor | Friction or inconsistency, workaround obvious | Inconsistent button radius, vague link text, missing empty state |
| S3 Polish | Refinement | Optical alignment, motion easing, microcopy tone |

The certificate is the integer count of open S0 and S1 findings. **Verdict: Ship** only when S0 = 0 and every open S1 has an owner and a date. Otherwise **Do not ship**. If the evidence was too thin to test a whole lens (for example no running page, so no performance data), the verdict is **Provisional** and says which lenses were not covered. Never convert "not tested" into "passed".

## The eight lenses

Run every lens at least at triage depth. Go deep where the Step 0 context floor or the Step 2 sweeps point.

| # | Lens | Core question | Deep reference |
|---|---|---|---|
| 1 | Accessible | Can people with different abilities and input methods perceive, operate and understand it? | `02-accessibility.md` |
| 2 | Usable | Can the target user finish the primary job without confusion or error? | `01-foundations-and-history.md`, `05-ux-flows-and-patterns.md` |
| 3 | Fast and resilient | Does it work on the worst realistic device and network? | `03-performance-and-resilience.md` |
| 4 | Consistent | Is it one system, or many one-offs? | `07-design-systems-and-tokens.md` |
| 5 | Modern and maintainable | Does it use the platform well, or fight it? | `04-modern-platform.md` |
| 6 | Honest | Does it respect the user's attention, consent and money? | `05-ux-flows-and-patterns.md` (dark patterns) |
| 7 | Clear | Do the words, hierarchy and layout make the next step obvious? | `05-ux-flows-and-patterns.md` (content) |
| 8 | Future-ready | Does it hold up with AI features, agents, new input modes and coming standards? | `06-ai-agentic-and-future.md` |

### Triage checks (about 5 minutes, catch most serious problems)

Do these first on any subject. They map to the highest-yield defects across audits.

1. Tab through the whole page. Is focus always visible, in a sensible order, never trapped, never lost behind a sticky header?
2. Zoom to 200% and 400%, then shrink to 320 px. Does anything clip, overlap or force horizontal scrolling (outside tables and code)?
3. Is every form field labeled with a real label, with errors that say what to fix, and input preserved after an error?
4. Is body text at least 4.5:1 against its background, UI boundaries and focus rings at 3:1?
5. Does every image have the right alt (empty for decoration), every icon button an accessible name, every link text that makes sense out of context?
6. Do touch targets meet 24 px minimum (WCAG 2.2 AA) and, as a practical bar, about 44 px?
7. Is there one `h1`, a logical heading order, and landmarks (`header`, `nav`, `main`, `footer`)?
8. Does the page declare `lang` and a viewport, and does zoom stay enabled?
9. On a throttled connection, when does the main content appear, and does layout jump?
10. Is the primary action obvious within 5 seconds, and is the cost of every action (price, time, data, commitment) stated before the click?
11. Can the user undo, cancel, go back, or recover from every error and empty state?
12. Is anything hover-only, color-only, or reliant on a gesture with no alternative?

## Improve mode

Findings are only useful if they turn into a fix order.

1. **Rank** by `impact x reach / effort`. Reach is how many users and pages the fix touches, which is why shared components and tokens come first. A one-line `:focus-visible` rule on a base button often outranks a week of page polish.
2. **Group** fixes by root cause, not by symptom. Forty low-contrast text instances are one token change.
3. **Propose the smallest change** that resolves the finding, in the user's own stack and conventions. If code is available, give a diff or a replacement snippet. Prefer native platform features over custom code (`<dialog>`, `popover`, `<details>`, `:has()`, container queries, `field-sizing`, `light-dark()`); see `04-modern-platform.md` and check browser support before recommending.
4. **State the verification** for each fix: the exact check that proves it worked (for example "tab through the checkout, focus ring visible on all 9 controls" or "LCP at p75 under 2.5 s on throttled 4G").
5. **Do not redesign what is not broken.** Preserve the user's brand and voice. Taste differences are S3 at most, and should be labeled as opinion.

## Validate mode

When asked "is this ready?" or "does this pass X?":

- State the bar and its version (for example "WCAG 2.2 AA", "Core Web Vitals thresholds as published on web.dev").
- List each criterion tested, the method (automated scan, manual keyboard pass, screen reader pass, code read, not tested) and the result.
- Automated tools find only a fraction of accessibility issues. A clean scan is not a pass. Say so.
- Keep "verified by running" separate from "inferred from code". Both are fine; mixing them is not.

## Output format

Default to this structure. Use `assets/report-template.md` for a fuller version. Keep prose plain and specific; name the element, the page, the measured value.

```
## Verdict
Ship / Do not ship / Provisional. S0: n, S1: n, S2: n, S3: n. Evidence: <what was examined>. Not covered: <lenses or contexts>.

## Top fixes (ranked)
1. <finding> | Severity | Where | Why it matters to a real user | Fix | How to verify

## Findings by lens
<only lenses with findings, each with evidence>

## What is working
<2 to 4 specific things worth keeping; protects them from regressions>

## Symmetry report
Token counts vs designed scale, missing states by component, templates checked.

## Next
<one concrete step>
```

Lead with the verdict and the top three fixes. If the user asked a narrow question (just contrast, just a form), answer that and skip the template.

## Keeping facts current

This field moves quickly, and several facts in the references carry dates. Rules for staying honest:

- Treat any browser-support claim, legal deadline, threshold or version number in the references as a dated snapshot (research date: November 2026). Before stating one as fact in a deliverable, check a primary source when web tools are available: web.dev and webstatus.dev for Baseline status and Core Web Vitals, w3.org/WAI for WCAG, the regulator's own pages for legal deadlines, MDN for syntax.
- Secondary SEO blogs disagree with each other and with primary sources. During research for this skill, some sources claimed Core Web Vitals thresholds were tightened in March 2026 while Google's own documentation and most other sources said they were unchanged. When sources conflict, prefer the standards body or vendor documentation, and report the disagreement rather than choosing silently.
- Never invent a measurement. If you did not run Lighthouse or a screen reader, do not report a score.

## Auditor discipline

- A blacklist of "AI-looking" fonts or colors is not a defect list. Judge by what the choice does to the user.
- Do not flag a pattern just because it is old or new. Flag it because it fails someone: a layout table that breaks reflow, or a view transition that ignores `prefers-reduced-motion`.
- Do not penalize necessary complexity. Moving it somewhere the user can handle it is the job (Tesler's law); removing it usually just relocates the problem.
- Report the severity honestly even when the team is proud of the page. Report what works just as honestly.
- If the user supplied a design intent that conflicts with a guideline, state the conflict, the cost, and the alternative, then respect their decision.

## Reference map

Read only what the current job needs.

- `references/01-foundations-and-history.md`: eras of web UI from table layouts to agents, what each left behind as a smell, Nielsen's heuristics, laws of UX, Gestalt. Read for any usability review or when asked about history.
- `references/02-accessibility.md`: WCAG 2.2 criteria as audit steps, legal status, keyboard and screen reader procedure, ARIA rules, cognitive accessibility. Read for any accessibility or compliance question.
- `references/03-performance-and-resilience.md`: Core Web Vitals diagnosis, budgets by network tier, low-bandwidth and offline design. Read when speed, devices or data cost matter.
- `references/04-modern-platform.md`: native HTML and CSS features with support status, old-pattern to new-pattern table, framework notes for React, Next.js and Tailwind. Read when recommending code changes.
- `references/05-ux-flows-and-patterns.md`: forms, navigation, states, auth, checkout, content, consent, dark patterns and regulation. Read for flow and conversion reviews.
- `references/06-ai-agentic-and-future.md`: agentic UX patterns, generative UI, WebMCP, on-device AI, passkeys, spatial and WebGPU, WCAG 3, with a maturity radar. Read for AI features or forward-looking advice.
- `references/07-design-systems-and-tokens.md`: token tiers, the stable DTCG format, theming, state matrices, drift metrics. Read for consistency and design-system work.
- `scripts/audit_static.py`: heuristic scanner for HTML, CSS, JSX, TSX, Vue and Svelte. Standard library only.
- `assets/report-template.md`: full report skeleton.
