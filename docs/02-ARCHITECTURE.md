# 02 · Architecture

## Guiding principle: separate the engine from everything else

The single most important architectural decision is to split the original monolithic HTML
file into **four layers** with one-way dependencies. The timer *logic* must not know about
the DOM, the theme, the URL, or Astro.

```
┌──────────────────────────────────────────────────────────────┐
│  VIEW LAYER  (framework: vanilla/Preact)                       │
│  PlayerView · BuilderView · FullscreenView · AdSlot            │
│  - renders state, captures input, subscribes to engine events  │
└───────────────▲───────────────────────────┬───────────────────┘
                │ events (tick/state/step)   │ commands (start/pause/select)
┌───────────────┴───────────────────────────▼───────────────────┐
│  ENGINE LAYER  (pure TS, no DOM)                               │
│  TimerEngine (state machine) · clock (wall-clock source)       │
└───────────────▲───────────────────────────┬───────────────────┘
                │ reads config               │ reads/writes config
┌───────────────┴───────────────────────────▼───────────────────┐
│  DATA LAYER  (pure TS)                                         │
│  TimerConfig schema · validation · migrations · ThemeTokens    │
└───────────────▲───────────────────────────┬───────────────────┘
                │                            │
┌───────────────┴───────────────────────────▼───────────────────┐
│  PERSISTENCE LAYER  (pure TS, side-effecting at edges)         │
│  ConfigCodec (URL ⇄ config) · ConfigRepository (storage)       │
└────────────────────────────────────────────────────────────────┘
```

**Dependency rule:** arrows point inward/downward only. View → Engine → Data; Persistence
depends only on Data. Nothing below the View layer imports a framework or touches `window`
except through a thin, injected adapter (clock, storage). This is what makes the engine
unit-testable headless and keeps Astro integration a thin shell.

## Repository / package shape

Build standalone in this repo first (Phases 0–4), then port to Astro (Phase 5). Recommended
layout — same whether it stays a folder or becomes an npm-style package the Astro site imports:

```
timer/
├── docs/                      # these documents (source of truth)
├── BTMB_Retreat_Timer.html    # original reference — DO NOT delete until parity verified
├── src/
│   ├── engine/
│   │   ├── TimerEngine.ts      # state machine, the heart of the app
│   │   ├── clock.ts            # wall-clock source (injectable for tests)
│   │   ├── events.ts           # event type definitions + tiny emitter
│   │   └── format.ts           # fmt / pad / fmtShort (ported from original)
│   ├── data/
│   │   ├── schema.ts           # TimerConfig, Step, ThemeTokens types + SCHEMA_VERSION
│   │   ├── validate.ts         # runtime validation + defaults
│   │   ├── migrate.ts          # version migrations
│   │   └── presets.ts          # built-in theme presets + sample timers
│   ├── persistence/
│   │   ├── codec.ts            # ConfigCodec: config ⇄ compressed URL param
│   │   └── repository.ts       # ConfigRepository interface + LocalStorageRepository
│   ├── view/                   # framework layer (vanilla or Preact — see A1)
│   │   ├── PlayerView.*        # the runtime timer UI (player + fullscreen)
│   │   ├── BuilderView.*       # the step/theme editor
│   │   ├── ThemeProvider.*     # applies ThemeTokens -> CSS custom properties
│   │   └── AdSlot.*            # pluggable ad component (strategy pattern)
│   └── index.ts                # public API surface
├── tests/                      # unit (engine/data/codec) + behaviour (gherkin-mapped)
└── (Astro integration lives in the Astro site repo — see Phase 5)
```

> Until the framework for the View layer is confirmed (A1), `view/*` files use a neutral
> extension placeholder `.*`. Engine/data/persistence are plain `.ts` regardless.

## Core data model (`src/data/schema.ts`)

```ts
export const SCHEMA_VERSION = 1 as const;

/** A single ordered segment of the timer. */
export interface Step {
  id: string;            // stable unique id (nanoid-style); survives reorder
  name: string;          // display label, e.g. "Family Journal Time"
  durationSecs: number;  // > 0; canonical unit is SECONDS, not minutes
  note?: string;         // optional presenter note (future use)
}

/** Visual identity. Maps 1:1 onto CSS custom properties at runtime. */
export interface ThemeTokens {
  preset?: string;       // name of a built-in preset this derives from (or 'custom')
  colors: {
    bg: string; bg2: string; surface: string;
    text: string; muted: string; accent: string;
    warn: string; danger: string; ok: string;
  };
  fonts: {
    display: string;     // big clock font (original: 'Bebas Neue')
    body: string;        // UI font (original: 'DM Sans')
    mono: string;        // labels/numbers (original: 'DM Mono')
  };
  thresholds: {          // urgency colour switch points, as fraction remaining
    warn: number;        // original: 0.25
    danger: number;      // original: 0.10
  };
}

/** Everything needed to render a fully-branded timer. The shareable unit. */
export interface TimerConfig {
  version: number;       // === SCHEMA_VERSION at write time; migrate on read
  title: string;         // brand/header text, e.g. "Retreat Cue Timer"
  brandAccent?: string;  // optional highlighted word in the title (original: "BTMB")
  steps: Step[];
  theme: ThemeTokens;
  options: {
    audioAlert: boolean;     // beep at step end (original: true)
    autoAdvance: boolean;    // v1 default false; backlog feature flag
    showProgressBar: boolean;
  };
}
```

**Design notes**
- **Seconds are canonical.** The original stored `mins`; storing seconds removes a class of
  rounding bugs and lets the builder offer sub-minute steps. The builder UI presents
  minutes:seconds; the model stores seconds.
- **Stable `Step.id`** decouples list identity from array index, which is required for
  drag-reorder and for the active-step pointer to survive edits.
- **`ThemeTokens` mirrors CSS variables** so theming is "write tokens → set custom
  properties," no per-component styling logic.
- **`version` on every config** enables forward-compatible URL links via `migrate.ts`.

## The engine (`src/engine/TimerEngine.ts`)

A **finite state machine** plus an **event emitter**. It owns *time*, not pixels.

### States
```
        select(step)            start()            (remaining→0)
 IDLE ───────────────► READY ───────────► RUNNING ───────────► FINISHED
   ▲                     ▲   ▲               │  │                  │
   │       reset()       │   └── pause() ────┘  │   start()        │
   └─────────────────────┘        ▼             │ (restart step)   │
                               PAUSED ──────────┘◄─────────────────┘
                                start()
```

| State | Meaning |
|-------|---------|
| `IDLE` | No step selected. Clock shows `00:00`. |
| `READY` | A step is selected, not yet started (full duration shown). |
| `RUNNING` | Counting down. Emits `tick` ~4×/sec but computes from wall-clock. |
| `PAUSED` | Frozen mid-step; `start()` resumes. |
| `FINISHED` | Step hit zero; alert fired. `select`/`reset`/`start` move on. |

### Commands (called by the View)
`selectStep(id)` · `start()` · `pause()` · `toggle()` · `reset()` · `next()` · `prev()`

### Events (subscribed by the View) — Observer pattern
- `statechange` `{ state }` — drives status dot/label and button text.
- `tick` `{ remainingSecs, totalSecs, fraction, urgency }` — drives clock + progress bar.
- `stepchange` `{ index, step, nextStep }` — drives labels, cue list highlight, scroll.
- `finished` `{ step }` — triggers visual flash + audio alert in the View.

### Wall-clock correctness (critical fix vs. original)
The original decrements a counter every `setInterval(1000)`. Over a 6-hour session, or when
the browser throttles background tabs, this **drifts and pauses**. The engine instead:
- On `start()`, records `endsAt = now() + remainingSecs*1000` (and on resume, recomputes).
- On each tick, `remainingSecs = max(0, round((endsAt - now())/1000))`.
- `now()` is injected (`clock.ts`) so tests run deterministically without real time.
This guarantees accuracy regardless of tick frequency or tab throttling.

## Persistence (`src/persistence/`)

### ConfigCodec — share links (`codec.ts`)
- `encode(config): string` → validate → JSON → **LZ-compress** → URL-safe base64.
- `decode(param): TimerConfig` → base64 → decompress → JSON → `migrate` → `validate`.
- Put result in `?t=<encoded>` (and/or URL hash). **Hard cap ~1800 chars** for safe URLs.
- **Overflow strategy:** if encoded length exceeds the cap, fall back to saving the config
  in `localStorage` under a short slug and sharing `?id=<slug>` (local-only link, with a
  visible warning that it won't open on another device). Documented limit, never silent.

### ConfigRepository — local saves (`repository.ts`)
Interface so a backend can be added later **without touching callers** (Strategy/Repository
pattern — protects the "no backend now, maybe later" decision):
```ts
export interface ConfigRepository {
  list(): Promise<SavedTimerMeta[]>;
  load(id: string): Promise<TimerConfig | null>;
  save(name: string, config: TimerConfig): Promise<string>; // returns id
  remove(id: string): Promise<void>;
}
```
v1 ships `LocalStorageRepository`. A future `ApiRepository` drops in unchanged at call sites.

## Theming (`src/view/ThemeProvider`)

Theme application is a pure mapping, no conditional styling:
1. `presets.ts` exports built-in `ThemeTokens` (including the original "Retreat Amber").
2. `ThemeProvider` writes each token to a CSS custom property on the timer root element
   (`--bg`, `--accent`, `--font-display`, …) — exactly the variables the original used.
3. All component CSS reads only custom properties. **Restyling = swapping a token object.**
4. Builder "custom" theme = a preset with user-overridden token values; `preset: 'custom'`.

Fonts: presets reference Google Fonts families; the ThemeProvider injects the matching
`<link>` (or the Astro layer uses `@fontsource`). Self-hosting is a Phase 5 optimization.

## Ad slots (`src/view/AdSlot`) — Strategy pattern

One component, swappable rendering strategy chosen by config/env (honours the "both /
pluggable" decision):
```ts
type AdStrategy =
  | { kind: 'selfPromo'; offerings: Offering[] }     // your products; no cookies
  | { kind: 'network'; provider: 'adsense'; slotId: string } // gated behind consent
  | { kind: 'none' };                                 // clean / embed-elsewhere mode
```
- **Slot placement** is declared by the page (e.g. `<AdSlot id="utilities-sidebar" />`), so
  layout owns *where*, config owns *what*. Player core never imports ad code — ads live in
  the Astro page shell around the timer island, keeping the tool clean and reusable.
- **Consent gate:** `network` strategy renders nothing until consent is granted; `selfPromo`
  and `none` need no consent. This keeps the privacy NFR satisfiable per deployment.

## Astro integration shape (Phase 5 preview)

- `/utilities/` — hub/index page listing utilities, with ad slots. (Future utilities slot in.)
- `/utilities/timer` — **PlayerView** island; reads config from `?t=`/`?id=`/localStorage,
  else a default sample. Server-rendered shell + hydrated island (`client:load`).
- `/utilities/timer/builder` — **BuilderView** island (`client:only` is acceptable here).
- Ad slots are **Astro components in the page shell**, not inside the island, so they render
  server-side and don't couple to the timer framework.
- The engine/data/persistence modules are imported as-is — they're framework-free.

## Design patterns summary (and *why* each)

| Pattern | Where | Why |
|---------|-------|-----|
| **Layered architecture** | whole app | Testable engine; Astro/iframe/standalone all reuse the same core |
| **Finite state machine** | `TimerEngine` | The original's boolean flags (`running`, `activeId`) caused implicit illegal states; explicit states remove ambiguity |
| **Observer / pub-sub** | engine events ↔ view | Decouples logic from rendering; multiple views (player + fullscreen) react to one source |
| **Strategy** | `AdSlot`, theme presets | Swap ad source / theme without branching logic in consumers |
| **Repository + Adapter** | `ConfigRepository`, `clock` | Future backend & deterministic time tests without rewrites |
| **Schema versioning + Migration** | `data/migrate.ts` | Old share links keep working as the model evolves |
| **Codec** | `ConfigCodec` | Single, tested boundary for the URL-sharing format |
| **Design tokens** | `ThemeTokens` → CSS vars | Theming is data, not code |

## Key risks & mitigations

| Risk | Mitigation |
|------|-----------|
| URL length blows past browser limits for big timers | Compress (LZ) + documented cap + `localStorage` slug fallback with explicit warning |
| Timer drift / pause on backgrounded tab | Wall-clock recomputation, injected `now()` |
| Theme/CSS bleed when embedded in Astro | Scope all styles under a timer root class + CSS custom properties; no global resets in the island |
| Audio blocked by autoplay policy | Lazily create `AudioContext` on first user gesture (original already does; preserve it) |
| Framework lock-in | Engine/data/persistence stay framework-free; only `view/` is frameworked |
| Parity regressions | Gherkin "Player Parity" feature pinned to original behaviour; verify before deleting reference file |
