# Site-wide custom UI artwork

Scope: replace application-authored stock SVG icons and decorative Unicode glyphs throughout public, seeker, publisher and admin UI. Existing category illustrations are reused. Logos, favicon, wordmark, brand orb and brand palette are preserved. SVG data charts and the KPI multiplication symbol remain because they represent data, not stock interface icons.

## Implementation

- `src/components/custom-icon.tsx`: shared generated-image renderer, decorative empty alt text, reserved dimensions, minimum 18px control size; larger illustrations fill card icon holders.
- `app-shell.tsx`: existing Icon imports resolve to the shared renderer, covering all sidebar/navigation/card consumers.
- `icons.tsx`: legacy named exports use the same assets.
- Inline illustrations replaced in authentication forms, mobile tabs, opportunity actions, publisher navigation, profile selections/removal controls, admin links and table sort controls.
- Save controls keep accessible labels and pressed state; saved uses the check seal, failure uses the warning illustration. Active styling now targets the button rather than an SVG fill.
- Directional arrows and the close glyph reuse rotated artwork, avoiding redundant image downloads.

## Asset provenance

Generated using the built-in image-generation tool, one request per illustration. `generation.json` records every exact prompt and original file location. `originals/` retains full-resolution PNGs; production files are transparent 160px WebPs in `public/images/icons/`. `manifest.json` records sizes and verified transparency. The earlier four category images remain in `public/images/categories/`.

## Validation

- TypeScript and targeted ESLint checks.
- 26 existing tests across feed/category filtering, mobile navigation, site header, profile editing, authentication recovery and admin overview.
- `branding-verification.json`: logo/favicon bytes and normalised logo-component source match HEAD.
- `verify-icons.cjs` renders the actual shared component at 18px, 24px, 44px and on a dark surface; `asset-verification.json` records missing-image checks and `gallery.png` provides visual inspection evidence.
- `home-desktop.png` and `home-mobile.png` show the updated three process illustrations in the real local page.
- Browser access to authenticated deployed pages is not claimed. Shared authenticated components are covered by source tracing, component tests and the render gallery.

No deployment or push is included in this task.
