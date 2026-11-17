# Accessibility

Contents: 1. Standards and legal status (snapshot Nov 2026) · 2. WCAG 2.2 additions · 3. Audit procedure · 4. Criteria as checks · 5. ARIA rules · 6. SPA and dynamic content · 7. Cognitive and inclusive design · 8. Tools and their limits

## 1. Standards and legal status (research snapshot, November 2026)

Verify against the regulator or w3.org/WAI before quoting in a deliverable. Secondary sources disagree on details.

- **WCAG 2.2** (W3C Recommendation, October 2023) is the current stable version. It is backward compatible, so meeting 2.2 AA also meets 2.1 AA and 2.0 AA. Target **WCAG 2.2 AA**.
- **WCAG 3.0** is a W3C Working Draft. It moves from pass/fail success criteria toward outcome-based requirements with scoring. Reports put its draft updates in 2025 and 2026, a Candidate Recommendation no earlier than about late 2027, and a final Recommendation no earlier than 2028. No regulator requires it. The W3C has said WCAG 2 will not be deprecated for years after WCAG 3 finalizes. Use it to anticipate direction, not to audit.
- **European Accessibility Act**: applicable since 28 June 2025 to covered consumer products and services (e-commerce, banking, transport, e-books and others sold in the EU). The harmonized standard is EN 301 549, which references WCAG. Sources differ on whether the current EN 301 549 text points to 2.1 or 2.2, so 2.2 AA is the safe target.
- **United States**: the ADA Title II rule for state and local governments references WCAG 2.1 AA. Reports say the compliance dates were extended in April 2026 to 26 April 2027 (populations of 50,000 or more) and 26 April 2028 (smaller entities). Private businesses face Title III litigation with no federal technical rule; courts and settlements usually reference WCAG 2.1 or 2.2 AA. Section 508 references WCAG 2.0 AA. One 2026 source counted 3,117 federal website accessibility suits in 2025.
- Elsewhere (Canada, UK, Turkey, India, others) national rules mostly reference WCAG 2.x AA. For any project with a stated jurisdiction, check the local rule.

## 2. What WCAG 2.2 added (new criteria worth checking by name)

| SC | Level | Check |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | A focused element is not entirely hidden by sticky headers, cookie bars or chat widgets. Use `scroll-padding` and `scroll-margin`. |
| 2.4.12 / 2.4.13 | AAA | Fully unobscured focus; strong focus appearance. Worth meeting for focus rings regardless. |
| 2.5.7 Dragging Movements | AA | Anything done by dragging (reorder, sliders, maps) has a single-pointer alternative. |
| 2.5.8 Target Size (Minimum) | AA | Targets at least 24 by 24 CSS px, or enough spacing. Inline text links are exempt. |
| 3.2.6 Consistent Help | A | Help links, contact, chat appear in the same relative place across pages. |
| 3.3.7 Redundant Entry | A | Do not make users re-enter information already given in the same process; prefill or let them select it. |
| 3.3.8 Accessible Authentication (Minimum) | AA | No cognitive function test to log in (remembering, transcribing, puzzles) unless an alternative exists. Allow paste and password managers, support passkeys, email links, or OAuth. |
| 4.1.1 Parsing | removed | Obsolete in 2.2. Do not report duplicate-attribute parsing as a WCAG failure (duplicate `id`s can still break label and ARIA references, so report those under 1.3.1 or 4.1.2 when they do). |

## 3. Audit procedure (about 30 minutes for a page, longer for flows)

1. **Automated pass.** axe-core, Lighthouse, WAVE or Pa11y. Remember they catch roughly a third to 40 percent of issues (an approximate figure widely cited by tool vendors). Treat a clean scan as a start.
2. **Keyboard pass.** Unplug the mouse. Tab and Shift+Tab through everything; Enter and Space on controls; arrow keys in composite widgets (tabs, menus, radios, listboxes); Escape closes layers. Check: visible focus, logical order, no traps, focus moves into a modal and returns to its trigger on close, skip link works, nothing is only reachable by hover.
3. **Zoom and reflow pass.** 200% text-only zoom, then 400% browser zoom at 1280 px (equals a 320 px layout): no loss of content or function, no two-axis scrolling except for data tables, maps, code. Check text spacing overrides (line height 1.5, paragraph spacing 2x, letter spacing 0.12em, word spacing 0.16em) do not clip.
4. **Screen reader pass.** At least one real pairing: NVDA with Firefox or Chrome on Windows, VoiceOver with Safari on macOS or iOS, TalkBack with Chrome on Android. Navigate by headings, landmarks, links and form fields. Complete the primary task using speech only.
5. **Color and contrast pass.** Check text, UI components, focus indicators, states, charts and images of text. Test dark mode and `forced-colors` (Windows High Contrast).
6. **Motion and media pass.** Enable reduced motion; check autoplay, parallax, large transitions, flashing (nothing flashes more than 3 times per second). Captions and transcripts for media.

## 4. Criteria as checks (organized by POUR)

### Perceivable
- Text alternatives: informative images get purposeful alt; decorative get `alt=""`; complex charts get a text or table equivalent; icon-only buttons get an accessible name. Never use a filename as alt.
- Structure: one `h1`, no skipped heading levels for visual styling; use real `ul`, `ol`, `table` with `th` and `scope`, `fieldset` with `legend` for grouped controls. Landmarks present and labeled when repeated.
- Contrast (WCAG 2 formula): 4.5:1 normal text, 3:1 large text (18 pt or 14 pt bold), 3:1 for UI boundaries, icons that carry meaning and focus indicators. Placeholder text counts. APCA is a candidate model for WCAG 3, not a conformance method today; it can be a useful secondary signal for very light or thin type.
- Do not use color alone to convey state (required, error, link, chart series). Add text, icon or pattern.
- Reflow, orientation and text spacing as in section 3. Do not lock orientation unless essential.
- Content on hover or focus (tooltips) must be dismissible, hoverable and persistent.

### Operable
- Everything works with a keyboard alone; no keyboard traps; no single-key shortcuts that cannot be turned off or remapped.
- Skip link to main content as the first focusable element. Page has a unique, descriptive `title`.
- Focus is visible with at least 3:1 contrast and a size that is noticeable; never `outline: none` without a replacement.
- Targets, dragging alternatives as in section 2. Pointer cancellation: actions fire on pointer up, so a user can slide off to abort.
- Timeouts: warn and allow extension; do not log people out mid-form without saving.
- Motion: respect `prefers-reduced-motion`; provide pause for moving content longer than 5 seconds.

### Understandable
- `lang` on `html` (and on foreign-language passages). Predictable behavior: no context change on focus or on input without warning.
- Forms: visible persistent labels (not placeholder-only), instructions before the field, required marked in text, `autocomplete` tokens on personal data fields (WCAG 1.3.5), errors identified in text, associated with the field (`aria-describedby`), suggestions offered, financial or legal submissions reversible, checked or confirmed.
- Consistent navigation and identification across pages. Consistent help (3.2.6). No redundant entry (3.3.7). Accessible authentication (3.3.8).

### Robust
- Name, role, value for every custom control. Status messages announced without moving focus (`role="status"`, `aria-live="polite"`; `role="alert"` only for urgent errors).
- Valid references: `for`/`id`, `aria-labelledby`, `aria-controls` point to real, unique ids.

## 5. ARIA rules that prevent most mistakes

1. Do not use ARIA if a native element does the job. `button`, `a`, `input`, `select`, `dialog`, `details` come with keyboard and semantics free.
2. Do not change native semantics (`<h2 role="button">`) unless you truly must.
3. Every interactive ARIA role needs the keyboard behavior of its pattern. The ARIA Authoring Practices Guide lists each.
4. Do not hide focusable elements with `aria-hidden="true"` or `display:none` while leaving them reachable.
5. Every interactive element needs an accessible name. Check with the browser accessibility tree, not the DOM.
6. "No ARIA is better than bad ARIA." Wrong ARIA actively misleads users of assistive technology.

## 6. SPA and dynamic content

- On client-side route change: move focus to the new page's `h1` or a main container (`tabindex="-1"`), update `document.title`, and announce the change. Silent route changes are one of the most common SPA failures.
- Modals: prefer native `<dialog>` with `showModal()` (focus containment, Escape, inert background handled by the browser). If custom, trap focus, restore on close, set `aria-modal`, label with `aria-labelledby`.
- Toasts: `role="status"`, do not auto-dismiss errors or anything with an action, give 5 seconds plus reading time otherwise, make dismissal keyboard reachable.
- Loading: announce with `aria-busy` and a status message; skeletons should not be read as content.
- Infinite scroll: keep footer reachable, offer "load more" or pagination, preserve position on back.
- Carousels: no autoplay by default; visible pause; keyboard and swipe equal; each slide reachable.
- Custom selects, date pickers, comboboxes: the most error-prone widgets. Prefer native `select`, `input type="date"` or a well-tested library, and test with a screen reader.
- CSS `reading-flow` (rolling out in Chromium) can align tab order with visual order in flex and grid. Until supported broadly, keep DOM order equal to visual order.

## 7. Cognitive and inclusive design

- Plain language, short sentences, one idea per paragraph; define jargon. Aim for roughly an 8th to 9th grade reading level on public services, lower for critical instructions.
- One primary action per view; reduce simultaneous choices; avoid time pressure unless necessary.
- Predictable patterns, consistent labels, clear progress for multi-step flows, easy review and correction before submit.
- Support users in low literacy, multilingual and shared-device contexts: icons plus text, local language options, no reliance on memorized codes alone. Where USSD, SMS or WhatsApp channels exist, keep their wording and flow in parity with the web version.
- Seizure and vestibular safety: no large parallax, spinning or zooming motion without a reduction path.
- Test with real disabled users when possible. Compliance does not equal usability.

## 8. Tools and their limits

- **Automated**: axe-core and `@axe-core/playwright` in CI, Lighthouse accessibility score (a subset of axe rules), WAVE, Pa11y. Good for missing names, contrast, ARIA validity, duplicate ids, language.
- **Manual**: keyboard pass, screen reader pass, zoom and spacing overrides, color-blindness simulation, forced colors.
- **Cannot be automated well**: alt quality, reading order sense, focus management quality, error message clarity, cognitive load, motion comfort.
- Interop 2026 lists accessibility testing and consistent accessibility trees across browsers as an investigation area, so cross-browser accessibility tree differences are still a real source of bugs. Test in at least two browser and screen reader pairings.
