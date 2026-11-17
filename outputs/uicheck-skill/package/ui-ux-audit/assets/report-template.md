# UI/UX audit: <subject>

Date: <date> | Reviewer: Claude | Bar: <e.g. WCAG 2.2 AA, Core Web Vitals good at p75, launch checklist>

## 1. Verdict

**Ship / Do not ship / Provisional**

| S0 blockers | S1 majors | S2 minors | S3 polish |
|---|---|---|---|
| n | n | n | n |

Certificate: open S0 + S1 = n. <One sentence on what decides the verdict.>

**Evidence examined:** <running URL / repo paths / screenshots / design file>. 
**Not covered:** <lenses or contexts that could not be tested, and why>. 
**Context floor assumed:** <device, network, assistive tech, locale>.

## 2. Top fixes, ranked by impact x reach / effort

| # | Finding | Sev | Where | Who it hurts and how | Fix | How to verify |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

## 3. Findings by lens

Include only lenses with findings. For each finding give: element or page, what you observed, the evidence type (ran it, read the code, inferred from a screenshot), severity, and the fix.

### Accessible
### Usable
### Fast and resilient
### Consistent
### Modern and maintainable
### Honest
### Clear
### Future-ready

## 4. What is working

2 to 4 specific strengths to protect from regressions.

## 5. Symmetry report

- Token counts vs designed scale: colors, font sizes, radii, spacing, z-index
- Raw literals found in components
- Missing states by component (default, hover, focus-visible, active, disabled, loading, empty, error, success)
- Templates checked and what differed between pages of the same template
- Highest-leverage single fix:

## 6. Context sweep (Lift)

| Context | Result | Evidence |
|---|---|---|
| 320 px wide | | |
| 400% zoom / 200% text | | |
| Keyboard only | | |
| Screen reader | | |
| Dark mode / forced colors | | |
| Reduced motion | | |
| Slow 3G, low-end CPU | | |
| Offline / error / empty | | |
| Long strings / RTL / other locale | | |

## 7. Boundary probes

List the extreme inputs and states tried (zero results, 10,000 results, 60-character name, expired session, double submit, back button after submit) and what happened.

## 8. Facts that need a primary-source check

List any standard, deadline, browser-support or threshold claim above that was taken from a secondary source or from the skill's dated references, with the primary source to confirm against.

## 9. Next step

<The one thing to do first.>
