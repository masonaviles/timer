# 06 · Decision Records (ADRs)

A running log of significant decisions, why they were made, and what was rejected. Each entry
is dated and stable — supersede with a new ADR rather than rewriting history. The one-line
"locked decisions" in [README.md](README.md) are the index; the *reasoning* lives here.

| ADR | Decision | Status |
|-----|----------|--------|
| [001](#adr-001--persistence-url--localstorage-no-backend) | Persistence: URL-encoded config + localStorage, no backend | Accepted |
| [002](#adr-002--embedding-astro-route--island-not-iframe) | Embedding: Astro route + island, not iframe | Accepted |
| [003](#adr-003--ad-model-pluggable-slots) | Ad model: pluggable slots (self-promo / network / none) | Accepted |
| [004](#adr-004--repo--distribution-portable-package-consumed-by-the-astro-site) | Repo & distribution: portable package consumed by the Astro site | Accepted |
| [005](#adr-005--view-framework-preact) | View framework: Preact | Accepted |

---

## ADR-001 — Persistence: URL + localStorage, no backend
**Date:** 2026-06-03 · **Status:** Accepted

**Context.** Users build a timer and want to keep/share it. Options ranged from
browser-only storage to a full accounts-and-database backend.

**Decision.** A configured timer is encoded into a **shareable URL** and cached in
**`localStorage`**. **No backend** at launch.

**Why.** Zero server cost and zero ops for a free utility; instant; works as a pure static
asset; no auth, privacy, or hosting burden for a solo maintainer. A backend can be added
later without rework because storage sits behind the `ConfigRepository` interface (Repository
pattern) — a future `ApiRepository` drops in unchanged.

**Rejected.**
- *localStorage only* — no sharing, the core use case (hand a presenter a link).
- *Backend / accounts* — auth, DB, hosting, ongoing cost; unjustified at launch.

**Consequences.** Share format must be compact and versioned (see `ConfigCodec`,
`SCHEMA_VERSION`); large timers hit URL-length limits → documented cap + `localStorage`-slug
fallback with a visible warning. See [02-ARCHITECTURE.md](02-ARCHITECTURE.md#persistence-srcpersistence).

---

## ADR-002 — Embedding: Astro route + island, not iframe
**Date:** 2026-06-03 · **Status:** Accepted

**Context.** The tool must live on the Astro site under `/utilities/` and surface ad slots
tied to the owner's offerings.

**Decision.** Render as native **Astro page routes** (`/utilities/timer`,
`/utilities/timer/builder`) with the interactive part as a **hydrated island** — not an iframe.

**Why.** Native routes give clean SEO, shared layout/nav/fonts/analytics, and let ad slots be
real Astro components in the page shell (the monetization goal). An iframe would wall the tool
off from the site's ad components and complicate SEO and theming.

**Rejected.**
- *Standalone HTML in an iframe* — fastest to ship but isolates the tool from site ad/nav and
  hurts SEO; only acceptable as a portability escape hatch.

**Consequences.** Styles must be scoped to a timer root (`.cuestack`) to prevent bleed in both
directions; the island stays a thin wrapper over the framework-free core. Interacts with
ADR-004: the island imports the published package. See
[02-ARCHITECTURE.md](02-ARCHITECTURE.md#astro-integration-shape-phase-5-preview).

---

## ADR-003 — Ad model: pluggable slots
**Date:** 2026-06-03 · **Status:** Accepted

**Context.** Ad space should advertise the owner's offerings now, but allow a third-party
network later, per deployment.

**Decision.** One `AdSlot` component with a **Strategy** chosen by config:
`selfPromo` | `network` | `none`.

**Why.** Self-promo is privacy-safe (no cookies, no consent) and ships value immediately;
`network` is available without a rewrite when traffic justifies it; `none` keeps the tool
clean when embedded elsewhere. Layout owns *where* a slot is; config owns *what* it renders.

**Rejected.**
- *Self-promo only* — closes the door on ad revenue.
- *Network only* — adds cookie consent, external scripts, and approval friction before there's
  any traffic.

**Consequences.** Ad code lives only in the page shell, never inside the player/builder island,
so the tool stays reusable and ad-free by default. `network` is consent-gated; `selfPromo`/`none`
need no consent. See [02-ARCHITECTURE.md](02-ARCHITECTURE.md#ad-slots-srcviewadslot--strategy-pattern).

---

## ADR-004 — Repo & distribution: portable package consumed by the Astro site
**Date:** 2026-06-04 · **Status:** Accepted · **Supersedes assumption A2**

**Context.** Question raised: should the timer be built *inside* the existing Astro site repo,
or kept in a separate repo and attached to the domain? Stakeholder confirmed the timer will
likely be **reused on other sites**, and the Astro site deploys on **Netlify**.

**Key framing.** "Where it's *served*" (URL/SEO) and "where the *code* lives" (repo hygiene)
are separate questions. The site can serve `domain.com/utilities/timer` natively while the
timer's code lives in its own repo — these don't conflict. The real axis is *same deploy vs
separate deploy*, and *coupled code vs portable code*.

**Options considered.**

| Option | URL | Shares site ad/nav/analytics | SEO | Setup | Reuse |
|--------|-----|------------------------------|-----|-------|-------|
| A. Build in the Astro site repo | native path | native | best | low | hard later |
| **B. Separate repo → import core as a package** ✅ | native path (site provides routes) | native (site shell) | best | medium | easy |
| C. Separate repo, separate deploy, attached via subdomain/path-rewrite | subdomain or rewritten path | ❌ no | subdomain dilutes | medium–high | easy |

**Decision.** **Option B.** This `timer/` repo is the product and ships as a **portable
package** (working name `@masonaviles/cuestack`). The Astro site is a **consumer**: it `npm i`s
the package, owns the `/utilities/timer` routes, and supplies its own `AdSlot` components wired
to real offerings.

**Why B over A.** Reuse across sites was confirmed, so the modest packaging cost pays off; the
core is already framework-free by design ([02-ARCHITECTURE.md](02-ARCHITECTURE.md#guiding-principle-separate-the-engine-from-everything-else)),
so it's package-ready by construction. A would couple the timer into one site's repo and make
extraction a later chore.

**Why not C.** A separate *deploy* cuts the tool off from the site's ad components, nav, fonts,
and analytics — working directly against the monetization goal — and a subdomain dilutes the
`/utilities/` path/SEO intent. Path-rewrite proxies add config and still don't share components.

**Netlify specifics.** Option B needs **no proxy or rewrite** — each consuming site pulls the
package at build time. The only host-specific step exists *only* if the package is published
**private**: set `NPM_TOKEN` in the site's Netlify env and commit a `.npmrc`
(`//registry.npmjs.org/:_authToken=${NPM_TOKEN}`) in the **site** repo. GitHub-install and
public-npm need none of this.

**Publishing path (upgradeable).**
1. **GitHub install** — `npm i github:masonaviles/timer#<tag>`. Start here: no registry, version by git tag.
2. **npm package** (public or scoped-private) — `npm i @masonaviles/cuestack`. Once stable / shared widely.
3. **Monorepo workspace** — `workspace:*`. Only if site + timer ever merge into one repo.

**Consequences.**
- Phases 0–4 are unchanged — keep building the core framework-free.
- Phase 5 becomes **publish + consume** rather than "copy files in": tag a release here,
  install it in the Astro site, add routes + ad slots there.
- This repo needs package metadata before Phase 5: `exports` map (`./player`, `./builder`,
  `./engine`), `dist/` ESM build with types, shipped CSS, and release tags. Tracked in
  [phase-5-astro.md](phases/phase-5-astro.md#distribution-model-a2--resolved).

---

## ADR-005 — View framework: Preact
**Date:** 2026-06-04 · **Status:** Accepted · **Resolves assumption A1**

**Context.** Phase 2 introduces the view layer (player) and Phase 4 the form-heavy builder.
A framework had to be chosen for `src/view/` only — the engine/data/persistence layers are
framework-free by design and stay that way.

**Decision.** Use **Preact** for the view layer.

**Why.** Tiny (~4kb) so it barely affects the package footprint; React-like JSX is familiar
and ergonomic for the stateful builder; first-class Astro island support via `@astrojs/preact`
(matters for Phase 5). The engine is consumed through a thin `useEngine` hook, keeping all
timer logic outside the framework.

**Rejected.**
- *Vanilla TS* — smallest, but the Phase 4 builder (add/edit/reorder forms) becomes manual
  DOM + hand-rolled state; not worth it once a builder is in scope.
- *Svelte* — excellent DX and small output, but its own `.svelte` tooling and a less familiar
  model; Preact's JSX is closer to the team's default.

**Consequences.**
- `preact` becomes a runtime dependency; `@preact/preset-vite` + `jsdom` +
  `@testing-library/preact` are dev dependencies for the dev server and component tests.
- View files are `.tsx`; tsconfig sets `jsx: react-jsx`, `jsxImportSource: preact`.
- Phase 5 adds `@astrojs/preact` to the consuming site and hydrates `<Player>` / `<Builder>`
  as islands.
- The engine exposes a `snapshot()` so Preact (and SSR/hydration) can prime initial state.
