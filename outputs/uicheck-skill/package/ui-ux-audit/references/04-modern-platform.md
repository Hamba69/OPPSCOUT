# Modern platform: HTML, CSS and framework notes

Contents: 1. How to read support status · 2. Old pattern to native replacement · 3. Feature status snapshot · 4. Legacy smells · 5. Framework notes (React, Next.js, Tailwind, Supabase UIs) · 6. Progressive enhancement recipe

## 1. How to read support status

Baseline is the shared language for browser support. **Widely available** means supported in all major engines for about 30 months. **Newly available** means all major engines support it but for less time. **Limited availability** means at least one major engine lacks it. Statuses below are a snapshot from late 2026 research (modern-css.com changelog, Chrome I/O 2026 notes, Mozilla Interop 2026 post). Confirm on webstatus.dev or MDN before recommending, and check the user's real audience share (analytics, or Google's Baseline Checker) before dropping a fallback.

Rule: use a limited-availability feature only as progressive enhancement, behind `@supports` or feature detection, with a working baseline experience when it is absent.

## 2. Old pattern to native replacement

| Old pattern | Native replacement | Why it is better for users |
|---|---|---|
| Custom modal built from divs and focus-trap JS | `<dialog>` with `showModal()` | Built-in focus containment, Escape, inert background, top layer. |
| Tooltip and dropdown positioned with JS (Popper, Floating UI) | `popover` attribute plus CSS anchor positioning (`anchor-name`, `position-anchor`, `position-area`) | Top layer, light dismiss, no layout math, fewer bytes. |
| Click handler toggling a class for accordion | `<details>` (with `name` for exclusive groups) | Keyboard and screen reader support for free; works without JS. |
| JS to set up a button that opens a dialog or popover | `commandfor` and `command` (invoker commands) | Declarative, accessible wiring. |
| Media queries on the viewport for every component | Container queries (`@container`), `container-type: inline-size` | Components adapt to the space they get, so they are reusable. |
| JS or parent class to style a parent based on child state | `:has()` | Pure CSS. Example: highlight a card when its checkbox is checked. |
| Preprocessor nesting | Native CSS nesting | One less build step. |
| Specificity wars | `@layer` for ordering, `@scope` for proximity | Predictable cascade. Replaces much BEM and CSS Modules ceremony. |
| Fixed px type with breakpoint jumps | `clamp()` fluid type and spacing | Smooth scaling, respects user text size when mixed with `rem`. |
| `100vh` full-height sections | `100dvh` (or `svh`/`lvh`) | Mobile browser chrome no longer clips bottom buttons. |
| Margin-left and padding-right | Logical properties (`margin-inline`, `padding-block`) | RTL and vertical writing work without extra CSS. |
| Hex colors and manual dark mode duplication | `oklch()`, `color-mix()`, `light-dark()`, `color-scheme` | Perceptually even palettes, simple theming. `contrast-color()` is new for picking readable text. |
| Auto-growing textarea scripts | `field-sizing: content` | No scroll-height listeners. |
| JS form validation styling | `:user-valid` and `:user-invalid`, native constraint validation | Errors appear after interaction, not on first paint. |
| IntersectionObserver reveal animations | Scroll-driven animations (`animation-timeline: view()`), or `animation-trigger` | Off the main thread, less JS. Enhancement only, see status. |
| Page transition libraries | View Transitions API (same-document), `@view-transition { navigation: auto; }` for multi-page | Smooth continuity with little code. Must honor reduced motion. |
| Carousel library | Scroll snap plus `::scroll-button()` and `::scroll-marker` where available | Fewer bytes; accessibility behavior built in. Currently Chromium-led. |
| Image resizing in JS | `srcset`, `sizes`, `<picture>`, `loading`, `fetchpriority` | Browser picks the right file. |
| JS polyfills for lazy iframes and images | `loading="lazy"` | Native. |
| Hand-built "search" landmark | `<search>` element | Landmark for free. |
| Balanced headlines via manual `<br>` | `text-wrap: balance` (headings), `pretty` (paragraphs, partial support) | No orphans, works across widths. |
| Custom animated height to auto | `interpolate-size: allow-keywords` or `calc-size()` | Animate to intrinsic sizes. Limited availability. |

## 3. Feature status snapshot (late 2026, verify before citing)

- **Widely available, safe by default**: Flexbox, Grid, subgrid, container size queries, `:has()`, CSS nesting, `@layer`, custom properties, `clamp()`, `:focus-visible`, `inert`, `<dialog>`, `loading="lazy"`, logical properties, `prefers-reduced-motion`, `prefers-color-scheme`, `forced-colors`, `dvh`/`svh`/`lvh`.
- **Newly available (Baseline 2024 to 2026), use with awareness of audience share**: Popover API, `@starting-style`, `light-dark()`, `field-sizing`, `<details name>` and `::details-content`, invoker commands (Chrome 135, Safari 18.4, Firefox 144), `@scope`, container style queries (`@container style()`, Firefox 151 in May 2026), `contrast-color()`, `:open`, `shape()`, `sibling-index()` and `sibling-count()`, same-document View Transitions, CSS Anchor Positioning, Navigation API, URLPattern. Anchor positioning, same-document view transitions, the Navigation API, `@scope` and URLPattern were focus areas in Interop 2025, which raised cross-browser pass rates sharply; reports note some browsers passed tests while still behaving differently, so test real behavior.
- **Interop 2026 focus (20 areas, plus investigation of accessibility testing)**: includes cross-document view transitions, `attr()` in more values, `contrast-color()`, `shape()`, WebTransport, WebRTC fixes, `user-select`, `zoom`, and JSPI for WebAssembly. Expect these to firm up through 2026 and into 2027.
- **Limited or experimental**: scroll-driven animations (Chromium solid; other engines uneven in reports), scroll-triggered animations via `animation-trigger` (new), CSS carousels (`::scroll-button`, `::scroll-marker`), customizable `<select>`, `interpolate-size`/`calc-size()`, `reading-flow`, cross-document view transitions (Chrome and Safari; check Firefox), element-scoped view transitions (Chrome 147), HTML-in-Canvas and Declarative Partial Updates (origin trials in Chromium), gap decorations, CSS mixins.

Pairing reminder: every animation feature above must be wrapped in a reduced-motion check (`@media (prefers-reduced-motion: no-preference)` for adding motion, or disable under `reduce`).

## 4. Legacy smells to detect (and what to do)

| Smell | Evidence | Fix |
|---|---|---|
| Layout tables | `<table>` with no `th`, nested tables, spacer images | Grid or Flexbox; keep tables for data. |
| Clickable divs | `onclick` on `div` or `span` with no role, tabindex or key handler | Use `button` or `a`. |
| Text in images | Headlines or buttons as PNGs | Real text, real fonts. |
| `<font>`, `<center>`, `<marquee>`, `<blink>`, `<frame>` | Deprecated tags | CSS. |
| Fixed pixel layout | `width: 960px` containers, desktop-only breakpoints | Fluid layout, content-driven breakpoints. |
| `outline: none` | Global reset with no `:focus-visible` replacement | Visible ring, 3:1 contrast. |
| `user-scalable=no` or `maximum-scale=1` | Viewport meta | Remove; zoom must work. |
| Hover-only disclosure | Menu or info on `:hover` only | Support focus and tap; use `popover` or `details`. |
| Autoplaying carousels and videos | `autoplay`, rotating banners | Remove or provide pause; respect reduced motion. |
| Hash bang or JS-only routing with broken back | No history entries | Real URLs, History or Navigation API. |
| `transition: all` | Animates layout properties | List specific properties; prefer transform and opacity. |
| `z-index: 9999` arms race | Many large z-index values | Token scale, top layer for overlays. |
| Mega CSS framework fully shipped | Hundreds of KB unused CSS | Purge or switch to a utility approach with a build step. |
| jQuery plugin pile for modals and tabs | Large legacy JS for simple widgets | Native elements. |
| Flash-style splash and intro animation | Interstitials before content | Remove. |

## 5. Framework notes

### React and Next.js
- Server-render content that matters for first paint; avoid client-only data fetching for above-the-fold content. In the Next.js App Router, keep components Server Components by default and mark only interactive leaves with `"use client"`.
- Use `next/image` for responsive, lazy, size-stable images and set `priority` on the LCP image; always give meaningful `alt`. Use `next/font` to self-host and avoid layout shift.
- Hydration mismatches and late client-only rendering cause CLS and flashes; render loading states with the same dimensions as final content.
- On route change in client navigation, manage focus and document title (see `02-accessibility.md`); Next.js announces route changes with a route announcer, but verify it works with your layout and that focus lands somewhere sensible.
- Controlled forms re-render on every keystroke; for large forms use uncontrolled inputs or a library that isolates updates (INP).
- Avoid inline `onClick` on non-interactive elements. Use `button`, `Link`.
- `useEffect` data fetching with no error and empty branches is the most common source of missing states. Require loading, empty, error and success for every fetch.
- Third-party scripts: use the framework's script loader strategies (`afterInteractive`, `lazyOnload`).

### Tailwind CSS
- `outline-none` or `focus:outline-none` without `focus-visible:ring-*` or `focus-visible:outline-*` removes focus indication. Flag every occurrence.
- Contrast traps: `text-gray-300`, `text-gray-400` and `text-slate-400` on white often fail 4.5:1; muted text on tinted backgrounds fails more often than people expect. Check the actual pair.
- Hover-only utilities (`hover:`, `group-hover:`) that reveal content need `focus-within:` or `group-focus-within:` equivalents, and a tap path on touch.
- `sr-only` hides visually but keeps content readable by screen readers; `hidden` removes it from both. Choose deliberately.
- Responsive utilities are mobile-first: unprefixed is the smallest screen. Review the unprefixed styles first.
- Repeated long class strings that differ slightly are the token-drift symptom: extract a component or `@apply`-free design token, and count variants.
- Use `motion-safe:` and `motion-reduce:` variants for animation.
- Tailwind's default palette includes many near-duplicate colors; constrain the theme to the brand tokens.

### Apps built on a backend-as-a-service (Supabase, Firebase and similar)
- Auth flows: show loading while the session resolves (avoid a flash of logged-out UI), explain OAuth redirects, handle expired sessions with a way back to where the user was, offer magic link or passkey alongside passwords, allow paste in password fields.
- Row-level security and permission errors should become human messages ("You do not have access to this record. Ask an admin."), not raw error strings.
- Realtime updates need a visible live indicator and must not steal focus or move content under the cursor.
- Admin dashboards: tables need sortable, keyboard-operable headers with `aria-sort`, sticky headers that do not obscure focus, bulk actions with undo, and empty and error states per widget.
- File uploads: progress, retry, size and type limits stated before upload, resumable on bad networks.

## 6. Progressive enhancement recipe

1. Start with semantic HTML that delivers content and core action.
2. Add CSS for layout and theme, with a mobile-first, content-driven layout.
3. Add JavaScript for enhancement; the page must still do its core job if a script fails.
4. Gate new features with `@supports` or feature detection.
5. Test the base layer (no JS, no custom CSS features) and the top layer (all features) separately.
