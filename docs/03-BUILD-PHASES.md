# 03 · Build Phases

Each phase is **independently shippable, demoable, and resumable**. A phase is "done" only
when its Exit Criteria pass and its mapped Gherkin scenarios (see
[04-GHERKIN-SPEC.md](04-GHERKIN-SPEC.md)) are green. Pick up any phase by reading its block
top-to-bottom — no other context required.

> **This file is the overview.** Each phase also has a detailed, pick-up-cold build-out doc
> in [`phases/`](phases/README.md) with full task breakdowns, file-level deliverables, testing
> approach, and handoff notes. The blocks below summarize; the `phases/` docs are the working
> spec when you build.

Legend: **Deliverables** = files/artifacts produced · **Exit criteria** = how you know it's
done · **Demo** = what you can show a stakeholder · **Specs** = Gherkin features it satisfies.

---

## Phase 0 — Foundation & tooling

**Goal:** a clean, testable project skeleton. No features yet.

**Deliverables**
- Repo init: `package.json`, TypeScript config, formatter/linter, test runner (Vitest).
- Folder skeleton from [02-ARCHITECTURE.md](02-ARCHITECTURE.md#repository--package-shape) with empty stubs + `index.ts`.
- CI script: `lint && typecheck && test` runnable locally (and in CI if available).
- `tests/` wired so a trivial test passes.

**Exit criteria:** `npm run check` (lint + typecheck + test) is green on a stub test.

**Demo:** repo builds clean; one green test.

**Specs:** none (infrastructure).

---

## Phase 1 — Engine + data model (headless, no UI)

**Goal:** the original timer's *logic* as a pure, tested state machine. This is the riskiest
correctness work, done first, with zero UI to hide behind.

**Deliverables**
- `data/schema.ts` (`TimerConfig`, `Step`, `ThemeTokens`, `SCHEMA_VERSION`).
- `data/validate.ts` + `data/presets.ts` (port the original 19-step list as a sample config).
- `engine/clock.ts` (injectable `now()`), `engine/format.ts` (port `fmt`/`pad`/`fmtShort`).
- `engine/events.ts` + `engine/TimerEngine.ts` (FSM + emitter, wall-clock countdown).
- Unit tests for: state transitions, drift correctness (with a fake clock), formatting,
  urgency thresholds, validation/defaults.

**Exit criteria:** engine drives a full timer run headlessly in tests; fake-clock test proves
no drift across simulated hours and across a simulated background gap.

**Demo:** test output showing a step counting down, hitting `finished`, advancing via `next()`.

**Specs:** `Feature: Timer engine`, `Feature: Player Parity` (logic portions).

---

## Phase 2 — Player view (parity with the original)

**Goal:** a runnable UI that reproduces **every** behaviour of `BTMB_Retreat_Timer.html`,
but driven by a config object and engine events.

**Deliverables**
- `view/PlayerView` + `view/FullscreenView`: clock, cue label/number, progress bar, status
  dot, cue list (select/scroll/highlight), Start/Pause/Reset, next-hint, done banner.
- Keyboard: Space (toggle), F (fullscreen), Esc (exit). Fullscreen via Fullscreen API.
- End-of-step: visual flash + Web Audio beep (port, preserve lazy `AudioContext`).
- `view/ThemeProvider` minimal pass: apply the ported "Retreat Amber" preset via CSS vars.
- A standalone `index.html` / dev page that boots PlayerView with the sample config.

**Exit criteria:** side-by-side with the original, all parity scenarios pass; visual+audio
alert fires; fullscreen works; keyboard shortcuts work.

**Demo:** load the sample config, run a short step to completion in both windowed + fullscreen.

**Specs:** `Feature: Player Parity` (full), `Feature: Fullscreen presentation`, `Feature: Accessibility` (baseline).

---

## Phase 3 — Theming system

**Goal:** swap the look without touching component code; offer presets + custom.

**Deliverables**
- `data/presets.ts`: ≥3 presets (incl. original) covering light + dark.
- `ThemeProvider`: full `ThemeTokens` → CSS custom properties mapping incl. fonts + thresholds.
- Token-driven urgency thresholds wired into the engine's `urgency` computation.
- `prefers-reduced-motion` + `prefers-color-scheme` respected; visible focus styles.

**Exit criteria:** changing the theme token object restyles the entire player with no other
edits; reduced-motion disables flashing animation but keeps a non-animated alert.

**Demo:** flip between 3 presets live; show a custom accent colour changing instantly.

**Specs:** `Feature: Theming`, `Feature: Accessibility` (motion/contrast).

---

## Phase 4 — Builder + persistence + sharing

**Goal:** non-technical users create/edit timers, save locally, and share via link.

**Deliverables**
- `view/BuilderView`: set title/brand accent; add/edit/delete steps; reorder (drag or up/down);
  duration entry as mm:ss; pick preset + tweak accent; live preview of the player.
- `persistence/codec.ts`: `encode`/`decode` with LZ compression + URL-safe base64; size cap
  + `localStorage` slug fallback with explicit user warning.
- `persistence/repository.ts`: `ConfigRepository` interface + `LocalStorageRepository`
  (named saves, list, load, delete) + autosave of the working draft.
- "Copy share link" + "Open in player" flow; player reads `?t=` / `?id=` on load.
- `data/migrate.ts`: v→v migration scaffold (no-op for v1) exercised by decode.

**Exit criteria:** a config round-trips URL→player with no data loss within the size cap;
oversize configs fall back to slug with a visible warning; named saves persist across reloads.

**Demo:** build a 3-step timer, theme it, copy the link, open it in a fresh tab → identical.

**Specs:** `Feature: Builder`, `Feature: Share & restore`, `Feature: Local saves`.

---

## Phase 5 — Astro integration (`/utilities/`)

> Confirm **A1** (island framework) and **A2** (Astro repo location) before starting.

**Goal:** the tool lives in the Astro site as first-class routes.

**Deliverables**
- `/utilities/` hub page (lists utilities; ad-slot-ready layout).
- `/utilities/timer` route — PlayerView island, hydrated; reads config from query/storage.
- `/utilities/timer/builder` route — BuilderView island.
- Engine/data/persistence imported as framework-free modules; styles scoped to a timer root
  to prevent bleed; fonts wired via the Astro layer (`@fontsource` or `<link>`).
- SEO/meta for the utilities pages; back-link to offerings.

**Exit criteria:** both routes work in `astro dev` and a production build; no CSS/theme bleed
into the rest of the site; share links resolve on these routes.

**Demo:** navigate the live site to `/utilities/timer`, build + run a timer in-site.

**Specs:** `Feature: Astro embedding`.

---

## Phase 6 — Ad slots

> Confirm **A3** (self-promo content) before starting.

**Goal:** monetizable slots that advertise offerings, pluggable to a network later.

**Deliverables**
- `view/AdSlot` (Astro component in the page shell) with Strategy: `selfPromo` | `network` | `none`.
- Self-promo data source (offerings list) + responsive slot styling that doesn't crowd the tool.
- Consent gate wrapper for `network` strategy (renders nothing pre-consent); `selfPromo`/`none`
  need no consent.
- Slot placements on `/utilities/` hub + timer pages (sidebar/below-fold), config-selectable.

**Exit criteria:** self-promo renders with zero cookies; switching strategy to `network` is a
config change only; `none` produces a fully clean tool.

**Demo:** show the utilities page with self-promo offerings; toggle a slot to `none` to prove cleanliness.

**Specs:** `Feature: Ad slots`.

---

## Phase 7 — Hardening & launch polish

**Goal:** production-ready quality bar.

**Deliverables**
- Accessibility pass (screen-reader announcements for state/step changes; audit with axe).
- Cross-browser + mobile/responsive pass; long-session (hours) soak using fake-clock + a real check.
- Error states: malformed `?t=` link → friendly recovery to default + notice.
- Empty/edge configs (0 steps, 1 step, very long names) handled gracefully.
- README for end-users (how to build/share/embed) + finalize naming (rename from CueStack if desired).
- Decide fate of `BTMB_Retreat_Timer.html` (archive once parity is signed off).

**Exit criteria:** all Gherkin scenarios green; a11y audit clean; no console errors; docs current.

**Demo:** full happy-path walkthrough on desktop + mobile, including a broken-link recovery.

**Specs:** all features, esp. `Feature: Accessibility`, `Feature: Resilience`.

---

## Backlog (post-v1, captured so it isn't lost)
- Auto-advance / chaining steps; per-step "auto-start next."
- Per-step notes/media; sub-steps.
- Server persistence + shareable short links + public gallery (drop-in `ApiRepository`).
- Multiple utilities under `/utilities/` reusing the AdSlot + hub patterns.
- Ad performance analytics.
