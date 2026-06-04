# Phase 1 — Engine & Data Model (headless)

> **Goal:** the original timer's *logic* as a pure, fully-tested state machine with a
> versioned config schema. No UI. This is the correctness foundation — do it first, with
> nothing to hide bugs behind.

- **Depends on:** Phase 0.
- **Unblocks:** Phase 2 (player), Phase 4 (persistence builds on schema).
- **Confirm before starting:** none.
- **Related:** [Architecture · data model](../02-ARCHITECTURE.md#core-data-model-srcdataschemats) · [Architecture · engine](../02-ARCHITECTURE.md#the-engine-srcengineTimerEnginets) · [Gherkin: Timer engine](../04-GHERKIN-SPEC.md#feature-timer-engine-phase1)

---

## Objectives

1. Define `TimerConfig` / `Step` / `ThemeTokens` and `SCHEMA_VERSION`.
2. Port `fmt` / `pad` / `fmtShort` from the original file, with tests.
3. Build an injectable wall-clock and a tiny typed event emitter.
4. Build `TimerEngine` as an explicit finite state machine that counts down from wall-clock
   time (no drift), emitting `tick` / `statechange` / `stepchange` / `finished`.
5. Port the original 19-step list as the default sample config.

## Task breakdown

### Data layer
- [ ] `data/schema.ts` — types from [Architecture](../02-ARCHITECTURE.md#core-data-model-srcdataschemats) + `export const SCHEMA_VERSION = 1`.
- [ ] `data/validate.ts` — `validateConfig(input: unknown): TimerConfig` that fills defaults,
      coerces, and throws/normalizes on invalid (blank step name, `durationSecs <= 0`, empty steps handled).
- [ ] `data/presets.ts` — `RETREAT_AMBER` theme tokens (ported colours/fonts/thresholds from
      the original `:root`) + `SAMPLE_TIMER` (the 19 steps, now in **seconds**).

### Engine layer
- [ ] `engine/clock.ts` — `interface Clock { now(): number }`; `systemClock` using
      `performance.now()`/`Date.now()`; `createFakeClock(start)` with `advance(ms)` for tests.
- [ ] `engine/format.ts` — port `fmt`, `pad`, `fmtShort`; pure functions.
- [ ] `engine/events.ts` — typed `Emitter<EventMap>` with `on/off/emit`; define `EngineEventMap`.
- [ ] `engine/TimerEngine.ts` — the FSM (below).

### Engine behaviour spec (implement exactly)
- States: `IDLE → READY → RUNNING ⇄ PAUSED → FINISHED` (+ resets). See
  [state diagram](../02-ARCHITECTURE.md#states).
- Commands: `selectStep(id)`, `start()`, `pause()`, `toggle()`, `reset()`, `next()`, `prev()`.
- Illegal command in a given state = **no-op** (matches original's tolerance).
- **Wall-clock countdown (the critical part):**
  - `start()`: `endsAt = clock.now() + remainingSecs * 1000`; begin a ~250ms ticker.
  - each tick: `remainingSecs = max(0, round((endsAt - clock.now()) / 1000))`; emit `tick`.
  - `pause()`: store `remainingSecs`, stop ticker.
  - at `remainingSecs === 0`: stop, set `FINISHED`, emit `finished`.
- `tick` payload: `{ remainingSecs, totalSecs, fraction, urgency }` where
  `urgency = fraction <= theme.thresholds.danger ? 'danger' : fraction <= warn ? 'warn' : 'normal'`.
- `stepchange` payload: `{ index, step, nextStep }`.

### Tests (Vitest, fake clock) — map each to a Gherkin scenario name
- [ ] Select → READY at full duration.
- [ ] Start → counts down by injected-clock delta, not tick count.
- [ ] **No-drift:** 2 ticks while clock advances 90s ⇒ remaining is exactly right.
- [ ] Reach zero ⇒ FINISHED + `finished` emitted.
- [ ] Pause/resume preserves remaining across a large clock gap.
- [ ] Reset → READY at full duration.
- [ ] Urgency outline (0.50 normal / 0.20 warn / 0.05 danger).
- [ ] next()/prev() move the pointer.
- [ ] format.ts: h:mm:ss vs mm:ss, `fmtShort` cases.
- [ ] validate.ts: defaults, rejects blank name / non-positive duration.

## Deliverables

`data/schema.ts`, `data/validate.ts`, `data/presets.ts`, `engine/clock.ts`,
`engine/format.ts`, `engine/events.ts`, `engine/TimerEngine.ts`, and their `*.test.ts`.
Replace `tests/smoke.test.ts`.

## Implementation notes

- The engine takes the `Clock` and the active `TimerConfig` via constructor injection — it
  never reads `Date.now()` or the DOM directly. This is load-bearing for tests and Phase 7
  resilience; don't bypass it.
- Use the theme's thresholds for urgency so Phase 3 theming "just works."
- Keep the ticker interval (~250ms) independent from countdown accuracy — accuracy comes
  from `endsAt`, the interval only controls UI smoothness.
- Coverage target for `engine/` + `data/`: ~100%.

## Exit criteria

- A test drives a full run headlessly: select → start → tick down → finished → next.
- No-drift test passes across simulated hours and a simulated background gap.
- `npm run check` green; engine/data coverage near 100%.

## Demo

Show the test suite output narrating a countdown reaching zero and advancing, plus the
no-drift test passing.

## Handoff to Phase 2

Phase 2 imports `TimerEngine`, subscribes to its events, and renders them — it adds **no**
timing logic. `SAMPLE_TIMER` + `RETREAT_AMBER` are the fixtures the player boots with.
