# AI, agentic UX, and future or projected web technology

Contents: 1. What is shifting · 2. Auditing AI features · 3. Agentic UX patterns · 4. Generative UI · 5. Agent-ready sites · 6. On-device AI and new platform APIs · 7. Identity and passkeys · 8. Spatial, 3D and rich rendering · 9. Standards and regulation on the horizon · 10. Maturity radar · 11. How to give forward-looking advice

Everything here is a dated snapshot (research, November 2026). Items marked experimental can change or vanish. Do not recommend building a product on an origin-trial API without a fallback.

## 1. What is shifting

The 2026 consensus across industry write-ups (Nielsen Norman Group's State of UX 2026, Smashing Magazine, Google I/O 2026 notes) points the same way: people are spending less time navigating an interface and more time delegating to a layer on top of it. Interfaces are becoming more agentic (they act), multimodal (type, talk, show, gesture), personalized, provenance-aware, and in some cases generated on demand. The visual style matters less than how the system behaves and how well it earns trust.

Two consequences for audits:

1. **Trust is a UX property.** Users need to know who or what produced something, how sure it is, what it is about to do, and how to stop or undo it.
2. **Metrics invert.** If an agent finishes in two seconds a task that took ten minutes, time in the interface drops. That is success under task-completion metrics and failure under time-on-site metrics. Check that the team's KPIs match the product's real job.

## 2. Auditing AI features (chat, copilots, summaries, recommendations)

For any feature that uses a model, check each of these.

- **Disclosure**: AI-generated or AI-assisted content is labeled where it appears, and users can see sources or inputs where relevant. (One 2025 survey cited in 2026 write-ups found more than 80 percent of consumers want AI-created material clearly labeled.)
- **Control**: the user can edit, regenerate, undo, reject, and turn the feature off. Nothing consequential happens without a review point.
- **Uncertainty**: the interface does not present guesses as facts. Show confidence, sources, or a "verify this" cue where errors would matter (health, money, legal, safety).
- **Latency design**: streaming or progress for slow responses, a way to stop generation, and sensible timeouts with retry.
- **Failure modes**: wrong answer, refusal, empty answer, harmful answer, offline, rate limit. Each has a designed state and a human path (report, contact support).
- **Data and privacy**: say what is sent where, what is stored, whether it trains anything; offer on-device processing when available; never put secrets or other users' data into prompts silently.
- **Accessibility**: streamed text must be announced sensibly (a live region that does not re-read the whole message on every token), controls are keyboard operable, responses are structured with headings and lists, and voice or image input has alternatives.
- **Chat is not always the right interface.** A chat box hides capabilities (poor discoverability) and forces users to articulate intent from nothing. Offer suggested actions, structured inputs for common tasks, and visible results panes alongside conversation.
- **Evaluate quality, not only presence**: have a set of realistic test prompts, review outputs for correctness and tone, and monitor real usage.

## 3. Agentic UX patterns

When software acts on the user's behalf (books, buys, edits, sends), practitioners have converged on a lifecycle of patterns. Audit for each:

| Phase | Pattern | What to look for |
|---|---|---|
| Before acting | **Intent preview** | The agent shows what it plans to do; user can proceed, edit, or take over. |
| Before acting | **Autonomy dial** | The user sets how much the agent may do without asking (suggest only, ask first, act and report). |
| While acting | **Explainable rationale** | Plain-language reason for a choice, on demand, tied to the user's goal. |
| While acting | **Confidence signal** | Uncertainty is visible, and low-confidence steps pause for review. |
| After acting | **Action audit and undo** | A readable log of what was done, with rollback where possible. |
| Anytime | **Escalation pathway** | Clear handoff to a human or to manual control when the agent is stuck or the stakes are high. |

Additional checks: progress states that show what the agent is doing now; interruption points before irreversible actions (payments, deletions, sending messages); permission requests that are specific and revocable; and no silent scope creep (an agent asked to find flights must not also buy them).

The design problem shifts from polish around prompts to governance around autonomy: which steps need asking, which can be quiet, which must stop and confirm, and how to roll back.

## 4. Generative UI

Generative UI means the interface itself is assembled by a model for the user's task and context (Google described fully customized interactive responses in the Gemini app and Search AI Mode in late 2025; design tools offer prompt-to-app generation). It trades fixed screens for rules: instead of drawing ten variants, you define when a component appears, how it resizes, and what takes priority.

Audit risks:
- **Consistency and learnability**: constantly changing layouts make users relearn the interface. Nielsen Norman Group has warned about this and about hallucinations reproducing inside generated UI.
- **Accessibility drift**: generated markup may skip labels, headings, focus management and contrast. Run the same accessibility checks on generated output, ideally automatically before display.
- **Constraint design**: generation should draw from an approved component library and token set, so output stays on-brand and accessible by construction.
- **Predictable anchors**: keep navigation, global actions and critical controls stable while the content area adapts.
- **Editability**: users must be able to adjust or reject a generated surface.

## 5. Agent-ready sites (the web as read by software)

Browsers now ship assistants that browse and act for users (Gemini in Chrome and its "auto browse" were highlighted at I/O 2026 and Cloud Next 2026). Sites increasingly need to be usable by agents as well as people.

- **Semantics are the interface.** Agents read the DOM and the accessibility tree. Real buttons, links, labels, headings, landmarks, table headers, and form names help agents the same way they help screen reader users. Accessibility work and agent-readiness overlap almost completely.
- **Stable, meaningful structure**: labeled controls, predictable form behavior, no critical functions hidden behind canvas-only rendering or hover-only reveals.
- **WebMCP** (experimental origin trial starting in Chrome 149, announced at I/O 2026) lets a site expose structured tools to agents so they call site functions directly instead of clicking through forms. Treat as experimental; design the human UI first and treat tool exposure as an additional, permissioned interface with its own audit (what can an agent do, with what confirmation, with what logging).
- **Structured data** (schema.org, clear metadata, machine-readable prices, hours and stock) helps both search and agents.
- **Agent safety**: any action an agent can trigger must be protected the same way a human action is (authentication, confirmation for risky steps, rate limits). Be wary of untrusted content on pages instructing agents; do not let page text carry authority.
- Bot-friendly does not mean unprotected. Decide deliberately which pages and functions agents may use.

## 6. On-device AI and new platform APIs

- **Built-in AI in Chrome** (Gemini Nano and related models run locally): Summarizer, Translator, Language Detector, Writer, Rewriter, Proofreader and the Prompt API. Reports at I/O 2026 describe the Prompt API as stable from Chrome 148 with structured output, and others as stable or in preview; Translator and Language Detector were reported as desktop-only at the time. Benefits: privacy (data stays on device), no per-token cost, offline use. Constraints: hardware and download requirements, uneven availability. Always feature-detect and check availability, provide a non-AI fallback, and disclose when processing is local.
- **Soft Navigations API**: Core Web Vitals measurement for single-page apps (upcoming).
- **Declarative Partial Updates and streaming HTML APIs**: native out-of-order HTML updates and easier streaming insertion, reducing hand-rolled DOM code (origin trial).
- **HTML-in-Canvas** (origin trial): real DOM elements inside a WebGL or WebGPU canvas while staying searchable, translatable and accessible. Watch it for solving the "canvas is inaccessible" problem.
- **Element-scoped and two-phase view transitions** (Chrome 147 and in testing): layered motion without blocking interaction.
- **Navigation API, URLPattern, WebTransport, WebRTC improvements, JSPI for WebAssembly**: Interop 2026 items that make app-like experiences more reliable.
- **Speculation Rules**: prefetch and prerender likely next pages for instant navigations.

## 7. Identity and passkeys

Passkeys (WebAuthn) are replacing passwords for many consumer sign-ins. Audit for: passkey creation offered at a natural moment, a password fallback, account recovery that does not defeat the security, clear language ("Use your fingerprint, face or screen lock"), and multi-device behavior. Chrome's Immediate UI mode (announced at I/O 2026) aims to unify password and passkey sign-in in a single browser-managed flow. Meets WCAG 3.3.8 naturally because it removes memory and transcription tests.

## 8. Spatial, 3D and rich rendering

- **WebGPU** gives the browser a modern graphics and compute pipeline. One 2026 report says it reached Baseline across major browsers in January 2026; the source is a trade article, so verify on webstatus.dev. Libraries such as three.js and Babylon.js support it.
- **WebXR** (VR and AR in the browser) is in the Interop 2026 conversation; headset browsers and visionOS Safari support it to varying degrees. Spatial-style depth and translucency ("liquid glass" and similar) are trending in mainstream UI.
- Audit rule for immersive or 3D UI: provide a 2D equivalent and keyboard, screen reader and reduced-motion paths; avoid vestibular triggers; keep first load light; make the content findable and linkable. A 3D product configurator that cannot be used without a GPU and mouse is an S1 for many users.

## 9. Standards and regulation on the horizon

- **WCAG 3.0**: Working Draft. Direction: outcome-based requirements, scored conformance rather than pure pass/fail, broader scope (more disability groups, more technologies). One 2026 source reports the March 2026 draft organizes around roughly 174 requirements, all still at an early maturity level. Candidate Recommendation not expected before about late 2027, final not before 2028. Meeting WCAG 2.2 AA now is the best preparation.
- **Design tokens**: the Design Tokens Community Group published its first stable specification (2025.10, October 2025) including format, color and resolver modules. See `07-design-systems-and-tokens.md`.
- **Accessibility enforcement** is spreading and strengthening (EU EAA enforcement since June 2025; US ADA Title II dates in 2027 and 2028; national laws elsewhere).
- **Digital Fairness Act** (EU) on dark patterns, addictive design and manipulative personalization: proposal expected around late 2026, effect later in the decade.
- **AI transparency rules** (for example EU AI Act provisions on labeling AI interactions and generated content) will make provenance UI a compliance matter in some markets.
- **Privacy and data protection** laws continue to expand across Africa, Asia and the Americas; consent and data-handling UX should be built to the strictest jurisdiction you serve.

## 10. Maturity radar

Use this to calibrate recommendations. "Adopt" means recommend by default; "Trial" means recommend with fallback and awareness of the audience; "Watch" means mention, do not build on it; "Hold" means advise against for most products.

| Item | Status | Note |
|---|---|---|
| Semantic HTML, WCAG 2.2 AA, Core Web Vitals discipline | Adopt | Foundation for everything else. |
| Container queries, `:has()`, nesting, `@layer`, `clamp()`, logical properties | Adopt | Widely available. |
| `<dialog>`, `popover`, `<details name>`, `inert` | Adopt | Native and accessible. |
| Anchor positioning, same-document view transitions, `@scope`, `field-sizing`, `light-dark()` | Trial | Newly available; verify audience support, add fallbacks. |
| Cross-document view transitions, scroll-driven animations | Trial | Uneven across engines; enhancement only; honor reduced motion. |
| Design tokens in the DTCG format | Adopt | Stable spec, tool support growing. |
| Passkeys | Adopt | Keep a fallback. |
| Agentic UX patterns (intent preview, audit, undo) | Adopt | Principles are stable even as tech changes. |
| On-device AI APIs (Prompt, Summarizer, others) | Trial | Check availability; non-AI fallback required. |
| WebGPU for 3D and data viz | Trial | Verify support; 2D alternative required. |
| WebMCP and agent tool exposure | Watch | Origin trial; design permissions carefully. |
| Generative UI | Watch to Trial | Only from an approved component library, with stable anchors. |
| HTML-in-Canvas, Declarative Partial Updates | Watch | Origin trials. |
| CSS carousels, customizable `<select>`, `interpolate-size`, `reading-flow` | Watch | Chromium-led; keep fallbacks. |
| WCAG 3.0 conformance | Watch | Draft; do not audit against it. |
| Autoplaying media, parallax heroes, infinite-scroll-only content | Hold | Repeatedly fail accessibility and performance. |
| Chat as the only interface | Hold | Poor discoverability and control. |
| Dark patterns of any kind | Hold | Legal and trust risk. |

## 11. How to give forward-looking advice

- Separate what is shipping now from what is announced. Say which.
- Give the cheapest durable move: usually "fix semantics and structure", because it helps accessibility, SEO, agents, and future rendering models at once.
- Prefer principles that survive a technology change (user control, visibility, undo, honest labeling) over tactics tied to one API.
- State your confidence and your sources' dates. If you did not verify a claim on a primary source, say so.
- The web has swung between designer control and platform flexibility for thirty years. Whatever the next default is, ask what it removes from the user and what it gives back.
