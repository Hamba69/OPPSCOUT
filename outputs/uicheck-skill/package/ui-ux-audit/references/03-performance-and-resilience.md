# Performance and resilience

Contents: 1. Core Web Vitals and how to diagnose each · 2. Budgets by network tier · 3. Asset rules · 4. JavaScript and rendering · 5. Low-bandwidth and offline design · 6. Perceived performance · 7. Measurement

Speed is a design decision. A page that takes nine seconds on 3G has already lost many of its visitors before any layout matters, and on metered data every kilobyte is a cost to the user.

## 1. Core Web Vitals

Thresholds (assessed at the 75th percentile of real page loads, per device class, over a 28-day window):

| Metric | Measures | Good | Poor |
|---|---|---|---|
| LCP, Largest Contentful Paint | Loading | 2.5 s or less | over 4 s |
| INP, Interaction to Next Paint | Responsiveness across the whole visit | 200 ms or less | over 500 ms |
| CLS, Cumulative Layout Shift | Visual stability | 0.1 or less | over 0.25 |

INP replaced First Input Delay on 12 March 2024. A page passes only if all three are good. Several 2026 SEO articles claim the thresholds were tightened in March 2026 (for example INP to 150 ms). Google's own documentation and most other 2026 sources say the thresholds are unchanged. Check web.dev before telling a client the bar moved.

### Diagnosing LCP
Split it into four parts and fix the largest:
1. Time to first byte (server, CDN, redirects, cold starts).
2. Resource load delay (the browser discovered the hero image late: CSS background image, lazy-loaded hero, JS-rendered).
3. Resource load duration (file too large, no modern format, no CDN).
4. Element render delay (render-blocking CSS or JS, client-side rendering, web font swap).
Fixes: preload or `fetchpriority="high"` on the LCP image, never `loading="lazy"` on it, serve AVIF or WebP at the right size, server-render the above-the-fold content, inline critical CSS, cut blocking scripts.

### Diagnosing INP
INP has three phases: input delay (main thread busy), processing time (your handlers), presentation delay (rendering after). Look at long tasks and long animation frames in the Performance panel.
Fixes: break long tasks and yield to the main thread (`scheduler.yield()` where available, else `setTimeout` or `requestIdleCallback`), debounce expensive handlers, move work to a Web Worker, avoid forced synchronous layout (reading layout then writing in a loop), reduce DOM size, use `content-visibility: auto` for offscreen sections, avoid hydrating components that never need interactivity, defer third-party scripts.
For single-page apps, Chrome announced a Soft Navigations API (Google I/O, May 2026) to bring Core Web Vitals measurement to client-side route changes. Until it is everywhere, instrument route changes yourself.

### Diagnosing CLS
Causes and fixes: images and iframes without `width`/`height` or `aspect-ratio`; ads, embeds, banners and consent bars injected above content (reserve the space); web fonts that swap with different metrics (use `font-display: swap` or `optional` with metric-matched fallbacks via `size-adjust`); animations that change layout properties (animate `transform` and `opacity` instead); late-hydrating components that change size.

## 2. Budgets by network tier

Sources disagree on exact numbers, so treat these as working heuristics and calibrate to the audience's real data. Measure on a throttled connection and a throttled CPU, not on office fiber.

| Tier | Typical user | Page weight, first view (compressed) | JS | Main content visible |
|---|---|---|---|---|
| Constrained | 2G or congested 3G, low-end Android, metered data | under 500 KB, stretch under 1 MB for rich pages | under 100 KB | under 3 s on throttled 3G |
| Mainstream mobile | Mid-range phone, 4G | under 1.5 MB | under 250 KB | LCP under 2.5 s at p75 |
| Fast | Broadband, recent hardware | under 3 MB | under 500 KB | LCP under 2 s |

Rule of thumb for 3G (about 1.5 Mbps real throughput with high latency): each additional 100 KB costs roughly half a second to a second, and a 3 MB page can take around 10 seconds. Request count matters too, because each request pays latency. Keep first-view requests low (a few dozen at most, far fewer on constrained tiers).

## 3. Asset rules

- **Images**: AVIF first, WebP fallback, JPEG last. `srcset` and `sizes` so phones do not download desktop images. `width` and `height` always. `loading="lazy"` for below the fold; `decoding="async"`. Compress to the point of visible loss, then back off. SVG for icons and simple illustration, optimized and inlined when small.
- **Video**: no autoplay with sound; respect `prefers-reduced-motion` and Save-Data; poster image; do not make a hero video the LCP on constrained tiers.
- **Fonts**: WOFF2 only, subset to used scripts, limit to two families and a few weights, variable fonts when they replace several static files, self-host to skip a connection. Ensure the font covers the audience's scripts and diacritics.
- **CSS**: purge unused rules, inline critical CSS, avoid `@import` chains. A utility framework with proper purging is fine; the whole framework shipped unpurged is not.
- **Compression and caching**: Brotli, long immutable cache headers for hashed assets, a CDN with a node near the audience, HTTP/2 or HTTP/3.
- **Third parties**: each tag, widget and chat bubble is a performance and privacy cost. Load after interaction or idle, or remove. Audit them by cost per feature.

## 4. JavaScript and rendering

- Ship less. Every kilobyte of JavaScript costs download, parse, compile and execute time, and low-end phones pay the most.
- Prefer server-rendered or static HTML for content; hydrate only interactive islands. React Server Components, Astro-style islands and progressive enhancement all aim at this.
- Code-split by route and by interaction; lazy-load heavy components (editors, charts, maps).
- Avoid layout thrash and unbounded lists: virtualize long lists; use `content-visibility`.
- Use native features instead of libraries where support allows (`dialog`, `popover`, `details`, CSS animations, `:has()`), see `04-modern-platform.md`.
- Speculation Rules (prefetch and prerender for likely next pages) can make navigations feel instant on supporting browsers; use conservatively on constrained tiers because it spends data.

## 5. Low-bandwidth and offline design

- **Content first**: the page should deliver its core content and core action as HTML before any JavaScript runs. Test with JS disabled.
- **Progressive enhancement and graceful degradation**: features layer on; failure of one layer leaves the one below working.
- **Offline**: a service worker with a sensible cache strategy (cache-first for static assets, network-first or stale-while-revalidate for data) lets people keep browsing and queue actions during outages. Show offline state honestly, and queue form submissions with a visible "pending" status rather than failing silently.
- **Data cost transparency**: say what a download or video will cost. Offer a lite mode. Honor the `Save-Data` client hint where present.
- **Resilient forms**: save drafts locally, retry failed submits, never lose typed input on a network error, make payment steps idempotent so a retry does not double charge.
- **Real devices**: test on a low-end Android phone with 4x to 6x CPU throttling and "Slow 4G" or custom 3G network profile. Treat a $50 phone as a first-class target in many markets.
- **Channel parity**: where the product also runs over USSD, SMS or WhatsApp, the web UI should not be the only place a task can be completed, and wording should match.

## 6. Perceived performance

- Respond to input within about 100 ms (visual acknowledgement), even if the work takes longer.
- Skeleton screens that match the final layout beat spinners for content loads; spinners fit short, indeterminate waits.
- Optimistic UI for low-risk actions (like, add to list) with rollback and clear failure messages.
- Keep layout stable while loading; reserve space.
- Stream or progressively render long pages and results.

## 7. Measurement

- **Lab**: Lighthouse, WebPageTest, Chrome DevTools Performance panel with throttling. Good for diagnosis and regressions, not a verdict on real users.
- **Field**: the `web-vitals` library (attribution build) sending to your analytics, CrUX data via PageSpeed Insights or the CrUX API, and Search Console's Core Web Vitals report. Field data decides pass or fail.
- Lab and field often disagree because lab runs a single load on one profile while field covers real devices, networks and interactions. When they conflict, trust field and use lab to find why.
- Add a performance budget to CI so regressions fail the build.
- Report measurements with conditions: device profile, network profile, page, date. Never report a score you did not run.
