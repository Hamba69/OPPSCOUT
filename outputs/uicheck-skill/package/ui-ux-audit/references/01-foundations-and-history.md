# Foundations and history

Contents: 1. Eras of web UI and the smells they left behind · 2. The control pendulum · 3. Nielsen's ten heuristics as audit questions · 4. Norman's model · 5. Laws of UX (with their limits) · 6. Gestalt in practice · 7. Mobile ergonomics

Why history belongs in an audit: nearly every defect you will find is an old idea surviving in new clothes. Recognizing the lineage tells you what the original problem was and what replaced it.

## 1. Eras and what each left behind

| Era | What defined it | Still shows up as |
|---|---|---|
| 1989 to 1993, documents | Hypertext for researchers. Structure and links, almost no presentation. | Good news: semantic HTML that works everywhere. Pages that are still fine when CSS and JS fail. |
| 1994 to 2000, layout hacks | Browser wars, `<font>`, `<center>`, tables for layout, 1x1 spacer GIFs, frames. Flash arrives in 1996 and gives pixel control. | Layout tables, text baked into images, splash screens, autoplay audio, `<marquee>`, fixed-pixel widths that break on small screens. |
| 2000 to 2007, standards and Web 2.0 | CSS replaces tables (CSS Zen Garden, 2003). Accessibility and semantic markup advocated. AJAX named in 2005 lets pages update without reload. | Div soup with no landmarks, AJAX updates with no focus management or announcements, back button broken by in-page state. |
| 2007 to 2010, mobile and skeuomorphism | iPhone (2007) ships without Flash. Glossy, textured, real-world metaphors. Apple's "Thoughts on Flash" letter (2010) ends Flash's mainstream role. | Over-decorated controls, heavy image-based UI, hover-dependent interactions that do not exist on touch. |
| 2010 to 2016, responsive and flat | Ethan Marcotte's "Responsive Web Design" (A List Apart, May 2010): fluid grids, flexible images, media queries. Bootstrap (2011). iOS 7 flat (2013). Material Design (2014). Mobile-first becomes default. | Flat buttons with no affordance, low-contrast ghost text, hamburger menus hiding primary navigation, device-width breakpoints instead of content breakpoints. |
| 2017 to 2022, platform catches up | CSS Grid in every browser (March 2017). PWAs and service workers. Dark mode. Design systems and tokens. Core Web Vitals announced 2020, used for ranking from 2021. Container queries and `:has()` arrive (Baseline 2023). | Framework-heavy sites with huge JS bundles, client-rendered content, design systems that exist only in Figma, dark mode done by inverting colors. |
| 2023 to 2026, performance, accessibility law, AI | INP replaces FID as a Core Web Vital (March 2024). WCAG 2.2 published (October 2023). European Accessibility Act enforced (28 June 2025). Cross-browser interop on view transitions, anchor positioning, `@scope`. Chat, copilots and agents enter ordinary products. | AI features bolted on with no provenance, undo or fallback. Chat as the only interface. Auto-generated UI with no consistency. Accessibility treated as a post-launch patch. |

## 2. The control pendulum

Each era swung control between designer and platform. Flash gave designers every pixel and took away the browser's ability to adapt, zoom, translate and read aloud. Responsive design handed control back to the viewing context. Generative UI (section 6 of `06-ai-agentic-and-future.md`) is the next swing: the system assembles the interface per user and per task.

Audit consequence: when a design claims total control of presentation (fixed sizes, custom scrollbars, text as images, canvas-only UI), ask what user capability it removed. When a design claims total flexibility (generated, personalized, adaptive), ask what consistency and predictability it removed.

## 3. Nielsen's ten heuristics as audit questions

1. **Visibility of system status.** Does every action get feedback within about 100 ms, and every wait longer than about a second show progress? Is the current location (nav state, step X of Y) clear?
2. **Match between system and real world.** Does the interface use the user's words, not internal terms? A user manages notifications, not webhook configuration.
3. **User control and freedom.** Is there undo, cancel, back and a clear exit from every state? Prefer undo over "Are you sure?" for reversible actions.
4. **Consistency and standards.** Does the same thing look and behave the same everywhere, and match platform conventions (Jakob's law)?
5. **Error prevention.** Are impossible or risky states prevented (constraints, defaults, confirmations proportional to the cost) before an error message is ever needed?
6. **Recognition rather than recall.** Is what the user needs visible or easily retrievable, not remembered from a previous screen?
7. **Flexibility and efficiency of use.** Are there shortcuts, defaults, saved details and bulk actions for experienced users, without burdening new ones?
8. **Aesthetic and minimalist design.** Does every element earn its place? Extra information competes with the information that matters.
9. **Help users recognize, diagnose, recover from errors.** Does the message say what happened, why, and exactly how to fix it, in plain language, next to the field?
10. **Help and documentation.** Is help findable in context, task-focused and consistently placed (WCAG 2.2 criterion 3.2.6 requires consistent placement of help mechanisms)?

## 4. Norman's model, for diagnosing "why do people fail here?"

- **Affordance** is what an element allows. **Signifier** is the visible cue that tells people. Flat design often keeps affordances and deletes signifiers: a text-colored word that is actually a button.
- **Feedback** closes every action loop. **Mapping** ties controls to results (the toggle that sits next to the thing it controls).
- **Constraints** prevent wrong actions. **Conceptual model** is what the user believes the system is doing.
- **Gulf of execution**: user cannot figure out how to do what they want. **Gulf of evaluation**: user cannot tell what happened. Most findings fall into one of these two gulfs; naming which one makes the fix obvious.

## 5. Laws of UX, with their limits

Use these as hypotheses to check, not as rules to enforce.

| Law | Practical meaning | Limit or caution |
|---|---|---|
| Fitts | Time to hit a target grows with distance and shrinks with size. Make primary targets large and near the pointer or thumb. | Edges and corners of screens are effectively infinite targets on desktop, not on touch. |
| Hick-Hyman | Decision time grows with the number of choices. Chunk, rank, default. | A long list is fine when it is scannable and sorted. The count alone is not the problem. |
| Miller | Working memory is small. Chunk information. | The popular "7 plus or minus 2" is a loose summary. Do not cap menus at 7 by rote. |
| Jakob | People spend most of their time on other sites, so they expect yours to work like those. | Do not use it to block genuinely better patterns, only to demand that novelty be justified. |
| Doherty threshold | Responses under about 400 ms keep people in flow. | Perceived speed (skeletons, optimistic updates) counts, not just measured speed. |
| Tesler | Complexity cannot be removed, only moved. Decide who carries it. | Move it to the system, not to the user, when you can. |
| Postel | Be liberal in what you accept (accept spaces and dashes in phone numbers) and strict in what you produce. | Liberal input still needs validation for safety. |
| Peak-end | People judge an experience by its peak and its end. | The end of a checkout (confirmation) and the end of an error (recovery) deserve care. |
| Zeigarnik, goal-gradient | Unfinished tasks nag, progress motivates. | Fake progress is a dark pattern. |
| Von Restorff | The odd one out is remembered. | Use once. Emphasis everywhere is emphasis nowhere. |
| Aesthetic-usability | Attractive interfaces are perceived as easier to use. | Perceived, not actual. Pretty can hide a broken flow from test participants. |
| Choice overload | Too many options can reduce action. | Replication is mixed. Test with your users before cutting options. |

## 6. Gestalt in practice

- **Proximity**: related things sit close, unrelated things sit apart. Most spacing bugs are proximity bugs (a label closer to the previous field than its own).
- **Similarity**: things that look alike are read as the same kind. Never style a non-clickable thing like a link.
- **Common region**: a shared container or background groups items. Use sparingly; nested boxes are noise.
- **Continuity and alignment**: shared edges create order. Ragged left edges and inconsistent gutters are felt before they are seen.
- **Figure and ground**: modals need a scrim and focus containment so the page behind reads as background.
- **Hierarchy**: size, weight, contrast, position and space, in that rough order of strength. If everything is bold, nothing is.

## 7. Mobile ergonomics

- One-handed reach favors the lower middle of the screen. Primary actions in the top corners are costly on large phones (the "thumb zone" idea; treat the exact zones as indicative, not exact).
- Targets: 24 CSS px is the WCAG 2.2 AA minimum with spacing exceptions; platform guidance sits around 44 pt (Apple) and 48 dp (Material). Use 44 as the working bar.
- Provide gesture alternatives. Dragging and swipe-only actions need a tap equivalent (WCAG 2.5.7).
- Mind the keyboard: choose `inputmode`, `type` and `autocomplete` so the right keyboard and autofill appear; make sure the focused field is not hidden under the keyboard.
- Respect safe areas (`env(safe-area-inset-*)`), and use `dvh` rather than `100vh` so mobile browser chrome does not cut off bottom actions.
