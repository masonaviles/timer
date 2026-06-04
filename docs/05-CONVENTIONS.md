# 05 · Conventions

Standards that keep the build reproducible across contributors and sessions. When in doubt,
match the patterns already in the codebase over introducing a new one.

## Product naming

- Working codename: **CueStack**. It appears in docs and the default config title only.
- To rename, change: (1) `data/presets.ts` default title, (2) `docs/README.md` heading,
  (3) package `name`. There is **no** brand string hardcoded in components — the header text
  comes from `TimerConfig.title` / `brandAccent`.
- Domain vocabulary — use these exact terms everywhere (code, docs, UI copy):
  | Term | Meaning | Avoid |
  |------|---------|-------|
  | **Step** | one ordered segment with a name + duration | "cue" (UI may *display* "cue"), "segment", "item" |
  | **Timer** | the whole ordered collection + theme + meta (a `TimerConfig`) | "agenda", "list" |
  | **Player** | the runtime UI that runs a timer | "viewer", "runner" |
  | **Builder** | the editor UI | "editor", "admin" |
  | **Theme** | the `ThemeTokens` visual identity | "skin", "style" |
  | **Slot** | an ad placement | "ad", "banner" |

  > Note: the original UI uses the word "cue" on screen. UI *copy* may say "cue"; the *code*
  > and *data model* say `step`. Keep that boundary consistent.

## Languages & tooling

- **TypeScript**, `strict: true`. No `any` in committed code (use `unknown` + narrowing).
- **Test runner:** Vitest. **Lint/format:** ESLint + Prettier (or Biome) — one config, enforced in `npm run check`.
- Engine/data/persistence layers: **zero runtime dependencies** beyond a tiny LZ compressor
  and an id generator. No framework imports below `view/`.
- View layer framework: TBD (A1); default Preact. Keep view logic thin — it renders engine
  state and forwards commands; **no timer math in components**.

## File & module conventions

- One primary export per file; filename matches the export.
- **Classes / types / components:** `PascalCase` (`TimerEngine`, `ThemeTokens`, `PlayerView`).
- **Functions / variables:** `camelCase` (`encodeConfig`, `remainingSecs`).
- **Constants:** `SCREAMING_SNAKE_CASE` (`SCHEMA_VERSION`, `MAX_URL_LENGTH`).
- **Files:** components `PascalCase.*`; non-component modules `camelCase.ts`
  (`codec.ts`, `validate.ts`). Test files mirror source: `TimerEngine.test.ts`.
- **Types** live with their layer (`data/schema.ts`); import from there, don't redefine.
- **Time:** the canonical unit in code and storage is **seconds** (`*Secs` suffix on names,
  e.g. `durationSecs`, `remainingSecs`). Minutes/`mm:ss` exist only at the UI boundary.

## Engine / events conventions

- The engine never touches the DOM, `window`, `localStorage`, or `Date.now()` directly —
  time comes from the injected `clock`. This is load-bearing for testability; do not bypass it.
- Event names are lowercase nouns: `tick`, `statechange`, `stepchange`, `finished`.
- State enum values are `UPPERCASE`: `IDLE`, `READY`, `RUNNING`, `PAUSED`, `FINISHED`.
- Commands are imperative verbs: `selectStep`, `start`, `pause`, `toggle`, `reset`, `next`, `prev`.
- Illegal command-in-state is a no-op (return without throwing), matching the original's tolerance.

## Theming conventions

- Every visual value is a **design token** in `ThemeTokens`, surfaced as a CSS custom
  property with a stable name (`--bg`, `--accent`, `--font-display`, `--warn`, …).
- Components reference **only** custom properties for themeable values — never hardcode a
  colour or font in a component. Adding a themeable value means adding a token first.
- Keep the original variable names where they already exist (`--amber`→`--accent`, etc.)
  documented in a mapping comment in `ThemeProvider` for traceability to the source file.

## Persistence / sharing conventions

- The share format is **versioned**: `TimerConfig.version` is written on encode and migrated
  on decode. Never decode without running `migrate` then `validate`.
- URL params: `?t=<lz-base64>` for embedded configs, `?id=<slug>` for local-slug fallback.
- `MAX_URL_LENGTH` constant (~1800) governs the fallback; never silently truncate — warn.
- `localStorage` keys are namespaced: `cuestack:draft`, `cuestack:save:<id>`, `cuestack:index`.
  (Namespace string follows the product name; change in one place if renamed.)

## Accessibility conventions

- Colour is never the sole carrier of meaning — pair every urgency colour with text/ARIA.
- All interactive elements: keyboard reachable, visible `:focus-visible`, real `<button>`s.
- Respect `prefers-reduced-motion` (no flashing) and `prefers-color-scheme` (default theme).
- State/step changes announced via an `aria-live="polite"` region.

## Testing conventions

- Engine, codec, validate, migrate: **unit-tested** with a fake clock — these are the
  correctness-critical core and must stay near 100% covered.
- Each Gherkin scenario maps to at least one test; reference the scenario name in the test
  description so the spec ↔ test link is greppable.
- A new feature lands with its tests in the same change. Parity scenarios are non-negotiable
  before the original reference file is archived.

## Git & workflow conventions

- Branch per phase/feature: `phase-1-engine`, `feat/builder-reorder`, `fix/url-overflow`.
- **Conventional Commits:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
  Scope optional: `feat(engine): wall-clock countdown`.
- Keep `docs/` current **in the same PR** as the behaviour it describes — docs are source of truth.
- A phase PR is mergeable only when its Exit Criteria + mapped Gherkin scenarios are green.
- Don't delete `BTMB_Retreat_Timer.html` until Phase 7 signs off parity; then archive, don't drop.

## Definition of Done (every phase)
1. Exit criteria in [03-BUILD-PHASES.md](03-BUILD-PHASES.md) met.
2. Mapped Gherkin scenarios green.
3. `npm run check` (lint + typecheck + test) green.
4. Docs updated to match reality.
5. Demo performed/recorded per the phase's Demo line.
