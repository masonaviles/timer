# Phase 3 — Theming System

> **Goal:** restyle the entire player by swapping a token object — presets plus custom
> overrides — with no component code changes.

- **Depends on:** Phase 2 (player reads CSS custom properties).
- **Unblocks:** Phase 4 (builder theme controls).
- **Confirm before starting:** none.
- **Related:** [Architecture · theming](../02-ARCHITECTURE.md#theming-srcviewthemeprovider) · [Gherkin: Theming](../04-GHERKIN-SPEC.md#feature-theming-phase3) · [Gherkin: Accessibility](../04-GHERKIN-SPEC.md#feature-accessibility-phase2-phase3-phase7)

---

## Objectives

1. Provide ≥3 built-in presets (including the original), covering light + dark.
2. Map the full `ThemeTokens` (colours, fonts, thresholds) to CSS custom properties.
3. Drive engine urgency from theme thresholds.
4. Honour `prefers-reduced-motion` and `prefers-color-scheme`; ensure focus + contrast.

## Task breakdown

- [ ] `data/presets.ts` — add presets: `RETREAT_AMBER` (dark, original), `DAYLIGHT` (light),
      `MIDNIGHT` (cool dark), optionally `FOREST`. Each a complete `ThemeTokens`.
- [ ] `view/ThemeProvider` — full mapping `tokens → --bg/--bg2/--surface/--text/--muted/
      --accent/--warn/--danger/--ok/--font-display/--font-body/--font-mono`. Apply on a root
      element; updating tokens re-applies live.
- [ ] Font loading — inject the matching font `<link>` for a preset's families (or document
      that Phase 5 will self-host via `@fontsource`).
- [ ] Thresholds — pass `theme.thresholds` into the engine so `warn`/`danger` switch points
      come from the theme (already plumbed in Phase 1; wire the UI to it).
- [ ] Accessibility:
  - [ ] `prefers-reduced-motion`: disable the flash animation; keep a non-animated end
        indication (e.g. banner + status text + a single non-flashing colour change).
  - [ ] `prefers-color-scheme`: pick the default preset accordingly when none specified.
  - [ ] `:focus-visible` styles on all controls; verify contrast of accent/text per preset.
  - [ ] Pair every urgency colour with a text/ARIA signal (status label already does this).

## Deliverables

Expanded `data/presets.ts`, full `view/ThemeProvider.*`, font-injection helper, reduced-motion
+ color-scheme handling, focus styles. Tests for token→property mapping and threshold sourcing.

## Implementation notes

- Theming is a **pure data→CSS-variable mapping**. If any component needs a conditional or a
  hardcoded colour to restyle, that's a bug — add a token instead.
- "Custom" theme = a base preset with overridden token values and `preset: 'custom'`. Keep
  the merge logic (preset defaults ← user overrides) in one helper reused by Phase 4's builder.
- Keep the original `:root` variable names mapped in a comment for traceability to the source.

## Testing approach

- Unit: `applyTheme(tokens, rootEl)` sets every expected custom property; custom overrides win.
- Unit: engine urgency switches at theme-provided thresholds (vary thresholds, assert).
- Visual/manual: cycle presets live; toggle OS reduced-motion + color-scheme.

## Exit criteria

- Switching the theme token object restyles the whole player; no component edits required.
- Reduced-motion suppresses flashing but a non-animated alert remains.
- Each preset meets contrast expectations and shows visible focus.

## Demo

Flip between 3 presets live; change a custom accent and watch clock/progress/active-cue update
instantly; toggle reduced-motion and show the alert degrade gracefully.

## Handoff to Phase 4

The builder reuses the preset list + the (preset ← overrides) merge helper to offer theme
selection and custom accent editing with a live player preview.
