# Static scan results

Files scanned: 84 .tsx, 2 .css
Candidates by suggested severity: S0: 0, S1: 12, S2: 4, S3: 0

> Heuristic candidates only. Confirm each before reporting it as a defect. A clean scan is not a pass: rendered contrast, focus order, screen reader output and performance are not tested here.

## Findings

### input-no-label (S1, 12 found)
form control with no id, aria-label or wrapping <label>
Fix: Associate a visible label (htmlFor/id, wrapping label, or aria-label).
- src\components\profile-form.tsx:83 [low]
- src\components\profile-form.tsx:84 [low]
- src\components\profile-form.tsx:85 [low]
- src\components\profile-form.tsx:86 [low]
- src\components\profile-form.tsx:199 [low]
- ... and 7 more

### tiny-font (S2, 3 found)
e.g. font-size 10px is below 12px
Fix: Use at least 12px for supporting text and 16px for body; prefer rem so user text size applies.
- src\app\globals.css:245 [medium]
- src\app\globals.css:247 [medium]
- src\app\globals.css:289 [medium]

### focus-outline-removed (S2, 1 found)
outline removed on `.opp-card .stretch:focus-visible`; a focus replacement exists elsewhere, confirm it covers the same elements
Fix: Keep a visible focus indicator (3:1 contrast). Use `:focus-visible { outline: 2px solid; outline-offset: 2px }` and only remove outline for `:focus:not(:focus-visible)`.
- src\app\globals.css:297 [low]

## Symmetry report (token drift)

- Distinct literal colors in declarations: 47 (plus 48 defined as custom-property tokens)
- Distinct font sizes: 22; font weights: 7
- Distinct border radii: 11
- Distinct z-index values: 4 (max 60)
- `!important` declarations: 44
- Most used colors: #1e293b (22), #ffffff (6), rgb(255255255/.8) (4), rgb(255255255/.9) (4), #3f4d62 (4)
- Drift: 47 distinct literal colors used directly in declarations; a healthy system uses roughly 8 to 16 via tokens.
- Drift: 22 distinct font sizes; a scale usually has 6 to 9 steps.
- Drift: 11 distinct border radii; typically 3 to 5.
- Drift: 44 `!important` declarations suggest specificity conflicts; consider @layer.

