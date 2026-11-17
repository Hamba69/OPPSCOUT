# Design systems, tokens and consistency

Contents: 1. Why consistency is the cheapest quality lever · 2. Token tiers · 3. The DTCG format · 4. Scales and what to count · 5. Theming and dark mode · 6. Component state matrix · 7. Component API and governance · 8. Drift report

## 1. Why consistency is the cheapest quality lever

A design system is a deliberate symmetry: one decision, applied everywhere. When it holds, a fix made once is a fix made everywhere (a visible focus ring on the base button repairs every button). When it leaks, every defect has to be found and fixed one instance at a time. That is why the audit inventories repeated structure first (`SKILL.md`, Step 1) and treats inconsistency as a defect class of its own.

## 2. Token tiers

Design tokens are named design decisions. Three tiers keep systems flexible without chaos.

1. **Primitive (reference) tokens**: raw values. `color.blue.600 = #2563eb`, `space.4 = 16px`. No meaning attached.
2. **Semantic (system) tokens**: meaning and role. `color.text.primary`, `color.action.primary.bg`, `color.border.focus`, `space.stack.md`. Themes swap these.
3. **Component tokens**: specific to a component. `button.primary.bg` points to `color.action.primary.bg`. Optional; add where a component needs to diverge.

Audit rule: components should consume semantic or component tokens, never primitives and never literals. Count literals in component code. A raw hex in a component is a theming bug waiting for dark mode.

Naming: describe purpose, not appearance (`color.feedback.error`, not `color.red`). Use a consistent hierarchy. Avoid encoding values in names (`space.16`) when scales may change.

## 3. The DTCG format (stable as of October 2025)

The Design Tokens Community Group (a W3C community group with participation from design tool vendors and large design-system teams) published its first stable specification, version 2025.10. It is not a W3C Recommendation, but it is intended for implementation. It has three modules: Format, Color and Resolver.

Essentials of the Format module:
- Token files are JSON. Properties defined by the spec begin with `$`, so token and group names must not start with `$`.
- A token has `$value` and usually `$type` (color, dimension, fontFamily, fontWeight, duration, cubicBezier, number, shadow, typography, and others), and an optional `$description`.
- Groups nest tokens; aliases reference other tokens, enabling the semantic tier to point at primitives.
- The Color module adds support for modern color spaces. The Resolver module describes how to combine token sets for multiple contexts (for example light and dark, brand A and brand B) and enumerates the permutations.

Example:

```json
{
  "color": {
    "$type": "color",
    "blue": { "600": { "$value": "#2563eb" } },
    "action": {
      "primary": {
        "bg": { "$value": "{color.blue.600}", "$description": "Primary action background" }
      }
    }
  },
  "space": {
    "$type": "dimension",
    "4": { "$value": { "value": 16, "unit": "px" } }
  }
}
```

Check the exact value syntax against the current spec at designtokens.org before generating files for a tool, because details such as dimension objects and color value shapes have changed between drafts. Tools that read the format (Tokens Studio, Style Dictionary and others) declare which version they support, and the date-based version (2025.10) can be used to signal compliance.

Audit questions: is there a single source of truth for tokens? Does it generate both design-tool variables and CSS custom properties? Does a change propagate without manual copying?

## 4. Scales and what to count

A healthy system uses a small number of values from a defined scale. Count the distinct values actually present in code and compare to the designed scale. The scanner (`scripts/audit_static.py`) reports these counts; read them as a drift signal, not a verdict.

| Property | Healthy order of magnitude | Drift signal |
|---|---|---|
| Distinct text colors | 4 to 8 (primary, secondary, muted, inverse, link, feedback colors) | Dozens of near-identical grays. |
| Distinct background and surface colors | 4 to 8 | Many one-off tints. |
| Brand and feedback colors | 1 to 3 brand, 4 feedback | Several slightly different blues. |
| Font sizes | 6 to 9 steps on a modular scale | Twenty px values like 13, 14, 15, 15.5. |
| Font weights | 2 to 4 | Weights 300 to 900 all used. |
| Spacing values | 6 to 10 steps on a 4 or 8 base | Arbitrary pixel values. |
| Border radii | 3 to 5 | A different radius per component. |
| Shadows | 3 to 5 elevation levels | Many hand-tuned shadows. |
| z-index values | under 10, named | 999, 9999, 99999. |
| Durations and easings | 3 to 5 | Per-component one-offs. |

Type scale: pick a ratio (for example 1.2 to 1.333) or a hand-tuned set, with line heights per step. Body size 16 px or larger on mobile, relative units for text so user preferences apply.

## 5. Theming and dark mode

- Dark mode is a redesign of semantic tokens, not an inversion of colors. Pure white text on pure black glares; use off-white on very dark gray. Re-check contrast for every pair in both themes. Reduce saturation and elevation shadows; express elevation with lighter surfaces.
- Support `prefers-color-scheme` by default and offer an explicit user override that persists. Set `color-scheme` so native controls and scrollbars match. `light-dark()` keeps both values in one declaration.
- Support `forced-colors` (Windows High Contrast): do not rely on background images and box-shadows to convey boundaries or focus; use system color keywords and `outline`.
- Respect `prefers-contrast` and `prefers-reduced-motion` and `prefers-reduced-transparency` where relevant.
- Images and logos need dark variants or transparent backgrounds that work on both.
- Test charts, code blocks, form validation colors and disabled states in every theme.

## 6. Component state matrix

For each component type (button, link, input, select, checkbox, radio, switch, tab, card, row, menu item, chip), confirm each applicable state exists, looks distinct, and meets contrast:

| Component | Required states |
|---|---|
| Button | default, hover, focus-visible, active, disabled, loading, with icon, icon-only (with accessible name) |
| Link | default, visited (where meaningful), hover, focus-visible, active, in-text distinguishable beyond color |
| Text input | default, hover, focus, filled, disabled, read-only, error, success, with helper text, with prefix or suffix |
| Select, combobox | closed, open, focus, selected, disabled, empty, error, long list, no results |
| Checkbox, radio, switch | unchecked, checked, indeterminate (checkbox), focus-visible, disabled, error |
| Tabs, nav items | default, hover, focus-visible, selected, disabled |
| Table row | default, hover, selected, focus within, loading, expanded |
| Modal, popover, toast | opening, open, closing, focus handling, dismissal, stacking, small viewport |
| Card | default, interactive hover and focus, loading skeleton, empty, error, long content |

Missing focus-visible and missing error states are the two most common gaps. Report by component, because one fix usually serves every usage.

## 7. Component API and governance

- Components expose a small, consistent API (variant, size, state props) with the same names across components.
- Components bake in accessibility (labels required via props or TypeScript, keyboard behavior, ARIA pattern, focus management) so usage is accessible by default.
- Documentation shows usage, states, do and do not, accessibility notes and code. A system no one can find is not a system.
- Governance: who can change tokens, how changes are versioned and communicated, how deprecations work. Visual regression tests and automated accessibility tests in CI protect the system.
- Contribution path: teams need a way to propose variants without forking the system.
- Measure adoption (share of screens using system components) and drift (the counts above).

## 8. Drift report (include in the audit output)

```
Symmetry report
- Tokens: text colors 23 (designed 6), font sizes 17 (scale 8), radii 9 (scale 4), z-index values 12 (max 999999)
- Raw literals in components: 118 hex values, 64 px font sizes
- Missing states: Button focus-visible; Input error and success; Select empty; Toast reduced-motion
- Templates checked: home, listing, detail, checkout (4 of 4); differences from template noted
- Highest-leverage fix: define and apply focus-visible on base Button and Link (affects all pages)
```
