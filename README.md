# CueStack

White-label, themeable, step-by-step cue timer — a framework-free core that ships as a
package and embeds into an Astro site. (Working codename; see
[docs/05-CONVENTIONS.md](docs/05-CONVENTIONS.md#product-naming) to rename.)

## Status

**Phase 5 — Astro integration.** Player, builder, theming, persistence/sharing are built and
tested; the package is publishable (`./player`, `./builder`, `./engine`, `./data`,
`./persistence` entry points + bundled CSS). Astro route/island templates live in
[examples/astro/](examples/astro/README.md). Next: Phase 6 (ad slots).
Full plan: [docs/](docs/README.md) · per-phase docs: [docs/phases/](docs/phases/README.md).

- `prototype.html` — a single-file working prototype (proof of the vision; not the package).
- `BTMB_Retreat_Timer.html` — the original reference; the behavioural baseline for parity.

## Use it (as a package)

```bash
npm i github:masonaviles/timer#v0.1.0   # or @masonaviles/cuestack once published
npx astro add preact                     # the view layer needs Preact (a peer dependency)
```

```tsx
// Player — resolves ?t= / ?id= / draft / sample, then renders
import { TimerEngine } from '@masonaviles/cuestack/engine';
import { createSampleTimer } from '@masonaviles/cuestack/data';
import { resolvePlayerConfig, LocalStorageRepository } from '@masonaviles/cuestack/persistence';
import { Player } from '@masonaviles/cuestack/player';          // pulls in CSS automatically

// Builder
import { Builder } from '@masonaviles/cuestack/builder';
```

Engine/data/persistence are framework-free; only `./player` and `./builder` need Preact.
Full Astro wiring: [examples/astro/](examples/astro/README.md).

## Develop

```bash
npm install
npm run check     # lint + typecheck + test (the gate every phase must pass)
npm test          # tests once
npm run test:watch
npm run build     # emit dist/ (package output)
```

## Architecture (one line)

Four layers with inward dependencies — **view → engine → data**, with **persistence**
depending only on data. The engine/data/persistence layers have zero framework/DOM
dependencies, which is what makes the core unit-testable and shippable as a package. See
[docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md).

```
src/
  engine/        TimerEngine (state machine) · clock · events · format
  data/          schema · validate · migrate · presets
  persistence/   codec (URL) · repository (storage)
  view/          player · builder · theme · ad-slot   (Phase 2+)
  index.ts       public API
```

## Distribution

This repo is the product; the Astro site consumes it as a package
([ADR-004](docs/06-DECISIONS.md#adr-004--repo--distribution-portable-package-consumed-by-the-astro-site)).
