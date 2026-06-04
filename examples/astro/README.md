# Astro integration (templates)

Drop-in templates for embedding CueStack in a **separate Astro site** as native
`/utilities/` routes — the Option B distribution from
[ADR-004](../../docs/06-DECISIONS.md#adr-004--repo--distribution-portable-package-consumed-by-the-astro-site).
These files are **not built or run in this repo**; copy them into the Astro site.

## 1. Install

In the Astro site repo:

```bash
# the Preact island integration
npx astro add preact

# the package — start with a GitHub install (no registry needed; version by git tag)
npm i github:masonaviles/timer#v0.1.0
#   …or once published to npm:
# npm i @masonaviles/cuestack
```

`preact` is a **peer dependency** of the package — `astro add preact` already installs it,
so there's a single Preact copy (avoids the dual-Preact hooks hazard).

> **Netlify, private npm only:** add `NPM_TOKEN` to the site's Netlify env and commit an
> `.npmrc` with `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`. GitHub-install and public
> npm need none of this.

## 2. Copy the files

```
src/components/TimerIsland.tsx          -> your src/components/
src/components/BuilderIsland.tsx        -> your src/components/
src/components/AdSlot.astro             -> your src/components/   (Phase 6 placeholder)
src/pages/utilities/index.astro         -> your src/pages/utilities/
src/pages/utilities/timer/index.astro   -> your src/pages/utilities/timer/
src/pages/utilities/timer/builder.astro -> your src/pages/utilities/timer/
```

Replace the bare `<html>` shells with your site's `Layout` component so the pages inherit
nav, fonts, and analytics. Keep the `.timer-frame { height: 100vh }` wrapper — the player
fills its container.

## 3. Verify

```bash
astro dev      # visit /utilities/timer and /utilities/timer/builder
astro build    # production build should succeed
```

- `/utilities/timer` — hydrated Player; `?t=…` share links resolve here.
- `/utilities/timer/builder` — the Builder; "Open in player" hands off via a `?t=` link.

## Notes

- **CSS ships with the package.** Importing `Player`/`Builder` pulls in `styles.css`
  automatically (the import is preserved and `sideEffects` keeps it). All styles are scoped
  under `.cuestack`, so they don't bleed into the site and the site doesn't bleed in.
- **Fonts.** Presets reference Bebas Neue / DM Sans / DM Mono / Inter / Space Grotesk. The
  example pages load them via Google Fonts `<link>`; prefer self-hosting with `@fontsource`
  in production.
- **Framework-only entry points.** Engine/data/persistence are framework-free — import them
  directly (`@masonaviles/cuestack/engine`, `/data`, `/persistence`) without pulling in Preact.
- **Ads.** `AdSlot.astro` is a placeholder; Phase 6 implements the pluggable
  `selfPromo | network | none` strategy. Ads live in the page shell, never in the island.
