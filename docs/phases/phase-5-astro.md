# Phase 5 — Astro Integration (`/utilities/`)

> **Goal:** the timer lives in the Astro site as first-class routes under a utilities hub,
> with no style bleed in either direction.

- **Depends on:** Phases 2–4 (player + builder + codec/repository).
- **Unblocks:** Phase 6 (ad slots in the page shell).
- **Confirm before starting:** **A1** (island framework) and **A2** (is the Astro site a
  separate repo? → decide: copy modules in, or publish this as a package the site imports).
- **Related:** [Architecture · Astro shape](../02-ARCHITECTURE.md#astro-integration-shape-phase-5-preview) · [Gherkin: Astro embedding](../04-GHERKIN-SPEC.md#feature-astro-embedding-phase5)

---

## Distribution model (A2 — RESOLVED)

**Decision:** this repo ships as a **portable package** (`@masonaviles/cuestack`); the Astro
site is a **consumer** that imports it and provides the routes + ad slots. Chosen because the
timer will be reused on other sites. Host: **Netlify** (no proxy/rewrite — the site pulls the
package at build time). Engine/data/persistence import unchanged because they're framework-free.

### Publishing options (pick per stability, can upgrade later)
| Method | Site installs via | Use when |
|--------|-------------------|----------|
| **GitHub install** | `npm i github:masonaviles/timer#<tag>` | Start here — no registry, version by git tag |
| **npm package** (public or scoped-private) | `npm i @masonaviles/cuestack` | Once stable / shared widely; private needs `NPM_TOKEN` on Netlify + `.npmrc` |
| **Monorepo workspace** | `workspace:*` | Only if site + timer end up in one repo |

### Package prep tasks (do these in *this* repo before consuming)
- [ ] `package.json`: `name`, `version`, `exports` map (e.g. `./player`, `./builder`, `./engine`), `files`, `sideEffects` for CSS.
- [ ] Build to `dist/` (ESM) with types; ensure CSS ships and is documented for import.
- [ ] Tag a release (`v0.1.0`) so the site can pin a version.
- [ ] README: install + minimal mount example for both player and builder.

> Netlify, private package only: set `NPM_TOKEN` env var in the **site** project and commit a
> `.npmrc` (`//registry.npmjs.org/:_authToken=${NPM_TOKEN}`) in the **site** repo. GitHub-install
> and public-npm need none of this.

## Objectives

1. `/utilities/` hub page listing utilities (ad-slot-ready layout shell).
2. `/utilities/timer` — PlayerView island, hydrated, resolving config from the URL/storage.
3. `/utilities/timer/builder` — BuilderView island.
4. No CSS/theme bleed between the timer and the rest of the site.
5. Fonts + meta/SEO wired through the Astro layer.

## Task breakdown

- [ ] Resolve A1/A2; add the chosen Astro framework integration (`@astrojs/preact` etc.) if needed.
- [ ] `src/pages/utilities/index.astro` — hub: heading, utility cards (Timer first), slot
      placeholders for Phase 6 (`<!-- AdSlot here -->`), links back to offerings.
- [ ] `src/pages/utilities/timer/index.astro` — server shell + PlayerView island.
  - Hydration: `client:load` (interactive immediately).
  - Read `Astro.url.searchParams` for `t`/`id`; pass to the island as a prop; island still
    falls back to draft → sample (reuse Phase 4 resolution order).
- [ ] `src/pages/utilities/timer/builder.astro` — BuilderView island (`client:only="<fw>"` is
      acceptable since it's editor-only and SEO doesn't matter).
- [ ] Style isolation:
  - Scope all timer styles under the `.cuestack` root (done in Phase 2); verify no global
    resets leak from the island.
  - Ensure the site's global CSS doesn't restyle the timer (the custom-property theme + scoped
    root protects this; test it).
- [ ] Fonts: switch to `@fontsource` packages (self-hosted) for the preset families, or keep
      `<link>` injection — pick one and document.
- [ ] SEO/meta: title, description, canonical for `/utilities/timer`; OG tags optional.

## Deliverables

Three `.astro` pages, the Astro framework integration config, font wiring, and either a
package boundary or a copied `src/` (per A2). Plus an E2E smoke test of both routes.

## Implementation notes

- Ad slots are **page-shell Astro components**, not inside the island — keep them out of the
  timer here so they render server-side and don't couple to the framework (Phase 6 fills them).
- The island should be a thin wrapper that constructs `TimerEngine` + mounts `PlayerView`;
  reuse, don't fork, the Phase 2/4 view code.
- Verify share links from Phase 4 resolve on the real routes (query parsing parity).

## Testing approach

- E2E (Playwright): visit both routes; assert the island is interactive (start a cue);
  open `/utilities/timer?t=<valid>` and assert restored title/steps.
- Visual: confirm no style bleed by rendering a deliberately clashing site theme around it.
- Build: `astro build` succeeds; routes render in preview.

## Exit criteria

- Both routes work in `astro dev` and a production build.
- No CSS/theme bleed in either direction.
- Share links resolve on the site routes.

## Demo

Navigate the live site to `/utilities/timer`, build and run a timer in-site; open a shared
link on the route.

## Handoff to Phase 6

The hub + timer pages have slot placeholders. Phase 6 implements `AdSlot` and drops it into
those placeholders, configured per deployment.
