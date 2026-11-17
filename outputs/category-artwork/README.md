# Category artwork — 17 November 2026

Generated with the built-in image-generation tool. Four original transparent PNGs are in `originals/`; the app serves 192 × 192 transparent WebP versions in `public/images/categories/` at 48 CSS pixels. Total shipped image size: 30,048 bytes. No logo or branding assets were edited.

Used on the public landing page and category shortcuts in the Matches feed. Any category without artwork falls back to the generic opportunity icon. Utility controls retain their existing icons.

## Prompt set

Each asset used this prompt, substituting the subject below:

> Create one premium miniature editorial UI illustration: {subject}. This is a small category asset for OppScout, an opportunity discovery app. Restrained tactile paper-and-matte-ceramic 3D style, soft bevels, simple bold silhouette readable at 48 CSS pixels, subtle dimensional shading, front three-quarter view, warm golden yellow #FFD700 and ochre accents, cream #FAFAF6, deep ink #1E293B, tiny muted green #1F7E6E accent. Single centered composition filling 78% of a square canvas. Transparent background, very subtle contact shadow only. No surrounding tile, no badge, no frame, no text, no letters, no logo, no watermark, no decorative sparkles, no extra floating objects. Carefully composed, quiet and sophisticated, not glossy plastic or cartoon clipart.

- Job: a sculptural warm ochre briefcase with a cream document tucked behind it and a tiny muted teal clasp.
- Scholarship: a deep ink graduation cap with a curved gold tassel resting on one cream closed book.
- Internship: a cream notebook with a muted teal spine and a warm gold pencil leaning diagonally against it, representing a first work placement.
- Grant: two warm gold coins beside a cream funding envelope, a small muted teal leaf emerging from the envelope, no currency signs.
- Fellowship: a cream rolled certificate scroll tied with a muted teal ribbon, with a round warm gold medallion seal resting against it.
- Training: a small deep ink presentation board on a warm ochre wooden stand, showing a simple muted teal rising bar chart, with a cream rounded marker resting on the board's ledge.
- Exhibition: a small cream canvas painting with simple abstract warm gold and muted teal shapes, in a thin ochre frame, standing on a short cream gallery plinth.
- Consultancy: two overlapping rounded speech bubbles, a deep ink one behind and a cream one in front, with a small warm gold lightbulb resting on top of the cream bubble, representing expert advice and consulting (prompt also adds: no dots inside the bubbles).

Fellowship, training, exhibition and consultancy (added 17 November 2026) were generated with Figma's image tool (gpt-image-2.5-flare) from the same prompt. The generator painted a checkerboard instead of real transparency, so the background was removed by flood-filling the light neutral pixels connected to the image edge, then the object was cropped, fitted to 168 px and centred on a 192 × 192 transparent WebP. Originals are in `originals/`.

## Validation

TypeScript and targeted ESLint checks passed. Four existing feed and opportunity filter tests passed. Landing-page screenshots at 320 and 1280 CSS pixels were visually reviewed; all four assets render and no horizontal overflow was measured. The landing page has no violations in the selected axe WCAG A/AA rules at either viewport. Signed-in feed rendering was not tested with a real account; its category links and filtering were covered by the existing unit tests.
