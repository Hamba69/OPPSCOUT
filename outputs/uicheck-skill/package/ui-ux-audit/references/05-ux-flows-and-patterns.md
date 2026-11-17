# UX flows, content and patterns

Contents: 1. Walking a flow · 2. Information architecture and navigation · 3. Forms · 4. The state set · 5. Feedback, errors, destructive actions · 6. Authentication · 7. Checkout, payments and money · 8. Content and microcopy · 9. Data display · 10. Consent, trust and dark patterns · 11. International and multilingual

## 1. Walking a flow

For the primary job, write the path as numbered steps from entry to outcome and record at each step: what the user must decide, what they must type, what they must wait for, and what could go wrong. Then measure:

- **Steps** and **fields**: each one is a place people leave. Remove, merge, default, or prefill.
- **Decisions without information**: any choice where the consequence (cost, time, commitment) is not shown beforehand.
- **Dead ends**: error and empty states with no next action.
- **Re-entry**: coming back after interruption, with the session expired or on another device.
- **First-time vs returning**: onboarding for the first, shortcuts for the second.
- **Entry points**: users arrive from search, shared links and notifications mid-flow, not only from the home page. Every page needs context on its own (what is this, where am I, what next).

Success is not time on page. When a product does the work for the user (automation, agents), less time in the interface can be the win. Pick the metric that matches the job: task completion, time to complete, error rate, recovery rate, and satisfaction.

## 2. Information architecture and navigation

- Label by user language, validated with card sorting or search logs. Avoid internal org-chart names.
- Keep top-level navigation to the set of primary jobs. Put rare items in secondary navigation, not in a hamburger on desktop. On mobile, hidden navigation reduces discovery; consider a bottom bar for 3 to 5 primary destinations.
- Show current location (active state, breadcrumbs for deep hierarchies, page titles that match the link that led there).
- Search: visible on content-heavy sites, forgiving of typos, useful empty results (suggest, do not just say "no results"), keeps the query in the field.
- Footer and utility links must stay reachable (beware infinite scroll).
- Links go where they say and open in the same tab by default; warn about new tabs, downloads and external sites when it matters.
- Back button and deep links must work. Preserve scroll position and filter state on return.

## 3. Forms

Forms are where most conversions are lost and where accessibility failures concentrate.

- One column; labels above fields; visible persistent labels, never placeholder-only. Placeholders are for examples and disappear on typing.
- Ask only what you need. Mark optional fields as optional rather than marking everything required. Split long forms into meaningful steps with a progress indicator and a way back.
- Use the correct `type`, `inputmode`, `autocomplete` and `enterkeyhint`: `type="email"`, `inputmode="numeric"` for codes, `autocomplete="one-time-code"`, `autocomplete="name"` / `"tel"` / `"street-address"` and so on. Do not split name, phone or date into awkward segments without a reason. Accept pasted and formatted input (spaces, dashes, country codes such as +256) and normalize it for the user (Postel's law).
- **Validation timing**: validate on blur or on submit, not on every keystroke while the user is mid-entry. Style invalid state only after interaction (`:user-invalid`). Once an error is shown, clear it as soon as it is fixed.
- **Errors**: put a summary at the top for long forms (focus it on failed submit, with links to each field), and a specific message beside each field linked with `aria-describedby`. Say what to do ("Enter a phone number like 0772 123 456"), not what the system objected to ("Invalid input"). Never clear what the user typed.
- Buttons: the label names the outcome ("Save changes", "Send message"), not "Submit". The primary action is visually distinct and is the only one per view. Disable with care: a disabled submit with no explanation is a trap. Prefer enabling and explaining.
- Show password toggles, allow paste, support password managers. Do not impose arbitrary composition rules; favor length and breach checking.
- Date entry: native `type="date"` is reliable on mobile; for known dates (birth year) a typed field beats a calendar that makes you click back 40 years.
- Protect against double-submit and show a clear in-progress and success state.
- Save progress for long forms, and warn before losing unsaved changes.

## 4. The state set

Every data-driven view and every interactive component needs all of these. Missing states are the most common residual defect.

| State | Question | Good pattern |
|---|---|---|
| Default | Is it obvious what this is and what to do? | Clear hierarchy, one primary action. |
| Hover, focus-visible, active | Does every interactive element respond to mouse, keyboard and touch? | Distinct, consistent, 3:1 contrast on focus. |
| Disabled | Does the user understand why? | Explanatory text or tooltip alternative accessible to keyboard. |
| Loading | Is there feedback, and does layout hold still? | Skeleton or progress at the same dimensions. |
| Empty | Does it teach the next step? | Explain what will appear here and offer the action that fills it. First-run and no-results differ. |
| Error | Can the user recover? | What happened, why if known, how to fix, retry and escape. |
| Partial or degraded | What if one widget fails? | Fail the widget, not the page. |
| Success | Is completion unmistakable and what next? | Confirmation naming the outcome and the next step. |
| Offline or slow | Is the user told and protected from loss? | Honest status, queued work. |
| Overflow | What about 0, 1, 1,000 items, long names, long words? | Truncation with access to the full text, pagination, wrapping rules. |

## 5. Feedback, errors and destructive actions

- Every action gets visible feedback quickly. Match the weight of feedback to the weight of the action.
- Prefer **undo** to confirmation for reversible actions ("Message deleted. Undo"). Reserve confirmation dialogs for irreversible or costly actions, and make the dialog name the action and the object ("Delete 14 invoices"), with a button label that repeats it, not "OK".
- Make destructive actions visually distinct but not the default focus.
- Toasts disappear, so they are wrong for critical errors and for anything with an action; use inline messages. Announce via `role="status"` or `role="alert"`.
- Errors at the network or server level: say it is not the user's fault when true, say what is preserved, offer retry, and give a way to contact support with a reference code.
- Do not blame. Do not use humor on errors involving money, health or safety.

## 6. Authentication

- Offer more than one route: passkeys, social sign-in, magic link or one-time code, password. Passkeys reduce phishing and failed logins; Chrome announced an "Immediate UI mode" at I/O 2026 that unifies password and passkey sign-in into one browser-managed flow, so check current support.
- Accessible authentication (WCAG 3.3.8): no memory or transcription test without an alternative; allow paste and autofill; make OTP fields accept the full code and use `autocomplete="one-time-code"`.
- Separate "sign in" and "create account" clearly; do not force account creation before value or purchase when guest checkout is feasible.
- Session expiry should preserve work and return the user to where they were.
- Show what is happening during redirects (OAuth) and why a permission is requested.
- Recovery flows are part of the product: test "forgot password" and "lost device" end to end.

## 7. Checkout, payments and money

- Show the total, fees, taxes, delivery and recurring charges before the final step, not at it. Drip pricing (revealing fees late) is a dark pattern and a legal risk.
- Support the payment methods the audience actually uses. In mobile-money markets this means MTN and Airtel Mobile Money flows with clear instructions for the approval prompt on the phone, status polling, timeout handling, and a way to confirm payment if the user closes the page.
- Pending, success and failure are three different states; money flows need all three plus "unknown, we are checking".
- Make payment retries idempotent so repeated taps do not charge twice. Tell the user explicitly when it is safe to retry.
- Always give a receipt and a reference that works as proof.
- Subscriptions: state price, renewal date, and how to cancel at signup, send reminders before renewal, and make cancellation about as easy as signup.

## 8. Content and microcopy

- Write from the user's side of the screen. Name things by what people control and recognize, not by system internals.
- Use active voice, sentence case, plain verbs. A control states exactly what happens when used, and the same action keeps the same name through the flow (the "Publish" button produces a message saying "Published").
- Lead with the point. Short paragraphs, informative headings, lists only for real lists. Line length around 45 to 75 characters. Left-aligned body text. Adequate line height (about 1.4 to 1.6 for body).
- Link text makes sense out of context ("Read the refund policy", not "click here").
- Empty and error text is direction, not mood: what to do next.
- Avoid filler marketing language and template phrases (abstract noun plus its own repetition). Say what the product actually does.
- Numbers, dates and currency in the user's locale and format; state time zones when ambiguity costs something.
- Reading level appropriate to the audience; test with real users, not a formula alone.

## 9. Data display

- Tables for comparable records: sticky header, sortable columns announced to assistive tech, alignment by data type (numbers right-aligned), zebra or row lines for scanning, responsive strategy that is not "shrink until unreadable" (scroll container with sticky first column, or card transform with preserved labels).
- Charts: label directly, do not rely on color alone, offer a table or text summary, choose the simplest chart that answers the question, start bars at zero, keep scales consistent between comparisons.
- Dashboards: lead with the few numbers that drive decisions, show change and context (compared to what), and let users drill down. Dense is fine when it is organized.
- Filters: show active filters, make clearing them one action, preserve them in the URL.

## 10. Consent, trust and dark patterns

Dark patterns (now also called deceptive patterns) are designs that steer users against their own interests. They are an ethics problem, a trust problem, and increasingly a legal one. Audit for these:

- **Hidden costs and drip pricing**; fake urgency (countdown timers that reset, "only 2 left" that is not true); fake scarcity and phantom strikethrough prices.
- **Roach motel**: easy to sign up, hard to cancel; "subscribe online, cancel by phone".
- **Confirmshaming**: decline buttons that insult ("No, I like paying full price").
- **Forced continuity and sneak-into-basket**: pre-selected add-ons, trial that converts silently.
- **Misdirection and visual interference**: low-contrast decline options, an accept button much larger than reject, cookie banners where rejecting takes more clicks than accepting.
- **Nagging** and repeated prompts after a refusal; **forced action** (account or data required for no reason).
- **Obstruction**: making privacy settings and data deletion hard to find.
- **Disguised ads** that look like content or buttons.
- **Addictive or compulsive design**: infinite engagement loops with no stopping cues, aimed at time spent rather than user benefit.
- **Manipulative AI personalization**: nudges tuned to exploit a user's vulnerabilities.

Regulatory context (snapshot, verify): the EU Digital Services Act (Article 25) bars online platforms from interfaces that deceive or materially distort free choice. The Digital Markets Act and the Consumer Rights Directive add related rules. The EU's Digital Fairness Act was consulted on in 2025 and listed for a proposal around late 2026, with entry into force expected in 2028 or later. In the United States, the FTC's 2024 "click-to-cancel" rule was vacated by the Eighth Circuit in July 2025 on procedural grounds, and the FTC restarted rulemaking in March 2026. Enforcement continues case by case under FTC Act Section 5 and the Restore Online Shoppers' Confidence Act, and several US states have their own cancellation laws. California privacy law treats consent obtained through dark patterns as invalid. Many countries' consumer and data protection laws (including data protection acts in East Africa) require clear, informed, freely given consent. Treat dark-pattern findings in consent, billing and cancellation as S0 or S1.

Consent interfaces: equal prominence for accept and reject, no pre-ticked boxes for non-essential data, granular choices available, withdrawal as easy as giving, plain language about what is collected and why, and no consent wall on essential content where the law forbids it.

Trust signals: real contact details, visible pricing, clear policies, honest social proof (real reviews, real numbers), secure payment cues that are true, and clear labeling of AI-generated or sponsored content.

## 11. International and multilingual

- Plan for string expansion (30 to 40 percent longer in many translations). Avoid fixed-width buttons and labels in tight containers.
- Use logical CSS properties for right-to-left support. Mirror directional icons; do not mirror logos, media controls and numerals incorrectly.
- Do not concatenate sentence fragments from variables; translators need whole sentences and plural rules.
- Format dates, numbers, currency and units with `Intl` APIs; show unambiguous dates.
- Fonts must cover the scripts and diacritics in use; test language switching, text direction and fallback fonts.
- Offer language choice in a consistent, findable place, labeled in each language's own name. Set `lang` per language span.
- Names and addresses vary: do not force first and last name, a postal code, or state fields where they do not exist; accept long names and non-Latin characters.
- Local conventions matter: phone number formats, mobile money, ID formats, and common device and network profiles.
