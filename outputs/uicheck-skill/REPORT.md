# OppScout UI/UX audit ? 17 November 2026

## Verdict

**Provisional; not ready for UI sign-off. S0: 0, S1: 2, S2: 1, S3: 0.** Counts group shared root causes. No owners or dates have been assigned. The skill installation and available-workspace audit are complete; authenticated and assistive-technology coverage remains explicitly unverified.

Scope: Uganda-focused opportunity discovery, account entry and publisher entry. Context floor: narrow mobile screens, metered/unreliable connectivity, keyboard and low-vision use. Evidence: current source at `0b70d3f` plus local category artwork, installed static scanner, local Edge/Chromium, screenshots, computed styles and intercepted authentication responses. App code was not changed during this audit-completion pass.

## Ranked fixes

| ID | Severity | Evidence and impact | Smallest proposed fix | Verification |
| --- | --- | --- | --- | --- |
| UI-01 | S1 | Category tiles lose their focus indicator in emulated forced-colours mode. `forced-focus.json` confirms the Scholarships link matches `:focus-visible`, while outline style is `none`, shadow is `none`, and its border/background/text styles match unfocused neighbours. `.tile:focus-visible` in `src/app/globals.css` relies on a box-shadow. Keyboard users cannot distinguish their current tile in this mode. | Add a visible outline using a system colour under `@media (forced-colors: active)`; review other shadow-only focus rules as the same pattern. | Tab through all tiles in actual Windows high contrast and in browser emulation; focused tile must remain distinct. Computed-style evidence is confirmed; screenshot capture did not preserve the forced-colour rendering, so the screenshot is not proof. |
| UI-02 | S1 | At a 375px viewport with root font size set to 200%, the landing page expands to 472px; its hero word overflows and category labels overlap adjacent cards. Publisher landing expands to 461px, signup to 384px. See enlarged-text screenshots and `extended-audit.json`. | Allow long headings/labels to wrap; collapse category columns when enlarged content no longer fits; avoid fixed card heights where text needs more room; inspect publisher shell width constraints. | Repeat root-font enlargement, real browser text resizing and 200%/400% browser zoom; require readable separate labels, reachable actions and no unintended overflow. Root-font enlargement is a stress-test proxy, not a complete WCAG resizing verdict. |
| UI-03 | S2 | Source-inferred: `.app-badge`, `.app-group`, `.cat-pill` use 10?11px supporting text. This reduces readability and some pixel-sized text does not grow with the root-font test. | Consider rem-based supporting text around 12px and verify available space. | Inspect authenticated screens with enlarged text and a low-vision reader. This is a usability recommendation, not a WCAG minimum-font-size rule. |

The resizing target is informed by [W3C Resize Text guidance](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), which requires enlargement without losing content or functionality. Actual browser zoom remains untested.

## Coverage and results

- Original sweep: 10 route/viewport combinations, at 320 and 1280px. Correction to the earlier report: `/opportunities` redirected to `/login?next=%2Fopportunities`; those two results tested login, **not catalogue content**. The original JSON already records this final URL.
- Extended sweep: six requested routes (`/`, `/login`, `/opportunities`, `/organizations`, `/organizations/signup`, `/organizations/login`), eight contexts each, plus six keyboard traversals: **54 records, zero runner errors**. Final URLs are now recorded. The catalogue route again exercised its login redirect.
- Contexts: 375, 768 and 1920px; doubled root font; text-spacing overrides; forced colours; dark preference; reduced motion. Together with the earlier sweep, all five skill viewport widths were exercised. This is not every combination of those axes.
- Default axe checks and the six enlarged-root-font axe checks reported no selected WCAG A/AA violations. This does not overrule the manually confirmed focus and overflow findings. Axe did not establish screen-reader compatibility.
- Keyboard traversals recorded 8?16 steps per requested route. No application control was reported covered at its centre; the Next.js development overlay was excluded. Normal keyboard operation is sampled, not fully certified.
- Three forms?seeker login, publisher login and publisher signup?passed empty-email validation/focus, show/hide password, disabled submit during loading, visible error status, retry enabled afterwards and retained input. Provider responses were intercepted and simulated; no account was created and no credentials were sent to the provider. This establishes UI error behaviour, not successful authentication.
- Clicking Jobs from the landing page preserved `/opportunities?type=job` as the login return destination. Signed-out catalogue access correctly showed login. Search/filter/detail/save flows were not browser-tested without a session.
- The four existing feed/category unit tests passed during the asset task. Those are component checks, not real signed-in flow evidence.
- One local-development observation at 1.6 Mbps download, 150ms latency and 4x CPU slowdown measured LCP 2,092ms, CLS 0.0020 and 939,858 transferred resource bytes. INP was not measured. After taking the already-loaded page offline, Jobs opened a cached/prefetched login screen; this does not prove offline cold-start or offline sign-in support.

## Eight-lens assessment

| Lens | Outcome |
| --- | --- |
| Accessible | UI-01/UI-02 require attention. Labels and automated checks are otherwise positive within tested public pages. Screen reader, speech input and actual Windows high contrast remain untested. |
| Usable | Public navigation preserves intended category destination; simulated form errors retain work and permit retry. Signed-in completion remains untested. |
| Fast/resilient | Four new WebPs total 30,048 bytes with fixed display dimensions. `resilience-audit.json` records one throttled local-development experiment; it is not a production performance score or p75 claim. |
| Consistent | Shared category component and coherent illustrations. UI-03 and token inventory warrant review, not an automatic redesign. |
| Modern/maintainable | Semantic links/forms and shared image component; no new dependency for artwork. Existing TypeScript and targeted lint checks passed. |
| Honest | Simulated errors clearly visible; category destination preserved. No full audit of opportunity verification claims, consent or production matching decisions. |
| Clear | Labels remain explicit alongside decorative artwork. Enlarged-layout overlap undermines clarity in UI-02. |
| Future-ready | No generative or agent interface is exposed on tested public pages. Source matching explanation and recovery states were inspected only; AI correctness and agent integration are outside this UI test. |

## Symmetry and state inventory

Static scan: **84 TSX + 2 CSS files**. Literal observations: 82 distinct colours including custom-property values, 22 font-size values, 11 radius values, four z-index values, 44 `!important` declarations. Tailwind-generated values are incompletely represented; no intended scale was established, so these counts do not prove design drift.

All 12 missing-label warnings were rejected: `Field` at `src/components/profile-form.tsx:40` wraps children in a real label. The `.opp-card .stretch` removed-outline warning has a parent focus-within shadow replacement in normal colours; forced-colour variants still need the UI-01 sweep. Three tiny-font candidates are one UI-03 finding.

State coverage: form default/loading/error/retry tested with simulation; password visibility tested; empty required input tested; category default/focus and navigation tested. Auth success, confirmation delivery, authenticated empty/loading/save/error states and expired-session recovery remain untested. Source has search-clear and empty-state recovery actions, but source presence is not runtime proof.

## What is working

- Four custom category illustrations render cleanly in default desktop/mobile layouts and retain text labels.
- Shared wrapping labels avoid the scanner's apparent missing-label failures.
- Failed simulated submissions preserve entered values and re-enable retry.
- Authentication redirects preserve the selected Jobs destination.
- Logos/branding and application code were unchanged by this audit-completion pass.

## Installation and evidence

The complete 10-file skill is installed byte-identically in `C:/Users/PROBOOK/.codex/skills/ui-ux-audit` and `C:/Users/PROBOOK/.copilot/skills/ui-ux-audit`. Codex discovery was observed in its skill catalogue. Copilot's runtime discovery was not independently exercised. Its personal directory follows [GitHub's documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills).

Reproduce against this workspace on port 3107:

```powershell
python C:/Users/PROBOOK/.codex/skills/ui-ux-audit/scripts/audit_static.py src --format json
node outputs/uicheck-skill/browser-audit.cjs
node outputs/uicheck-skill/extended-audit.cjs
node outputs/uicheck-skill/flow-audit.cjs
```

Raw JSON and screenshots live beside this report. No production deployment, database writes or real account creation were performed. Next step: resolve UI-01/UI-02, then repeat those checks and complete signed-in keyboard/screen-reader flows.

### Existing-session follow-up

The user authorised using whichever account is already logged in. Desktop discovery showed no browser window (only VS Code and Windows UI); Edge processes had no main window. Desktop capture returned a black image. The installed Edge application was discovered, but desktop launch returned `activation_failed/not_running`. A shell attempt to open the production feed was rejected with `blocked by policy`, without a more specific reason. Desktop diagnostics themselves passed, so this does not establish that the machine is locked or broken. No authenticated session could be inspected. The signed-in coverage gap remains until a signed-in OppScout browser window is accessible. No credentials or browser cookies were read.
