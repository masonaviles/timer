# Phase 2 — Player View (parity)

> **Goal:** a runnable UI that reproduces **every** behaviour of
> `BTMB_Retreat_Timer.html`, but driven by a `TimerConfig` + `TimerEngine` events instead of
> hardcoded data. This is the parity milestone.

- **Depends on:** Phase 1.
- **Unblocks:** Phase 3 (theming), Phase 4 (builder preview), Phase 5 (Astro island).
- **Confirm before starting:** **A1** — view framework. Default: vanilla TS (engine is
  framework-free, so the player can be vanilla; revisit for the builder in Phase 4).
- **Related:** [Gherkin: Player Parity](../04-GHERKIN-SPEC.md#feature-player-parity-phase1-phase2) · [Gherkin: Fullscreen](../04-GHERKIN-SPEC.md#feature-fullscreen-presentation-phase2) · original `BTMB_Retreat_Timer.html`

---

## Objectives

1. Render the full player UI from engine state: clock, cue label/number, progress bar,
   status dot/label, cue list, controls, next-up hint, done banner.
2. Mirror everything in a Fullscreen view kept in sync via the same engine events.
3. Reproduce keyboard control, the audio beep, and the end-of-step flash.
4. Apply the ported "Retreat Amber" theme via CSS custom properties (minimal ThemeProvider).
5. Ship a standalone dev page that boots the player with `SAMPLE_TIMER`.

## Parity checklist (against the original)

Walk the original file and reproduce each behaviour. Source line refs in `BTMB_Retreat_Timer.html`:

- [ ] Idle: clock `00:00`, "select a cue" label, status `STANDBY`. *(orig ~439, 686)*
- [ ] Select cue: label highlights, `CUE n OF N`, next-up hint, list highlight + auto-scroll. *(orig `selectCue` 558)*
- [ ] Countdown colours: warn ≤25%, danger ≤10% on clock + progress + status text. *(orig `colorClass` 521, `updateDisplay` 529)*
- [ ] Status text: RUNNING / WARNING / URGENT / STANDBY. *(orig 549–555)*
- [ ] Start/Pause button toggles label + style; Reset returns to full. *(orig 580–619)*
- [ ] End of step: clock flash animation + 4-beep Web Audio alert + "Time's Up" banner. *(orig `triggerAlert` 632)*
- [ ] Fullscreen: enter via button/F, Fullscreen API, mirrors clock/label/progress/next. *(orig `openFS`/`closeFS` 621)*
- [ ] Keyboard: Space toggle, F fullscreen, Esc exit. *(orig 678)*
- [ ] Cue list renders all steps with number/name/duration; click selects. *(orig `renderList` 659)*

## Task breakdown

- [ ] `view/PlayerView` — subscribes to `tick`/`statechange`/`stepchange`/`finished`; renders.
      Holds **no timing logic**; forwards user input as engine commands.
- [ ] `view/FullscreenView` — same subscriptions, fullscreen layout; toggled via Fullscreen API.
- [ ] `view/ThemeProvider` (minimal) — write `RETREAT_AMBER` tokens to CSS custom properties
      on the player root element. (Full system is Phase 3.)
- [ ] `view/audio.ts` — port the lazy `AudioContext` 4-beep; created on first user gesture.
- [ ] `view/alert.ts` — flash animation trigger (respect reduced-motion stub; full in Phase 3).
- [ ] Keyboard handler module; ensure Space doesn't scroll, scope handlers cleanly.
- [ ] `dev/index.html` (+ entry) booting `new TimerEngine(systemClock, SAMPLE_TIMER)` + PlayerView.
- [ ] Port CSS from the original into component styles **reading only CSS custom properties**
      (replace literal `--amber` etc. with tokenized names; keep a mapping comment).

## Deliverables

`view/PlayerView.*`, `view/FullscreenView.*`, `view/ThemeProvider.*`, `view/audio.ts`,
`view/alert.ts`, keyboard handler, `dev/index.html` + entry, ported stylesheet.

## Implementation notes

- The two views are independent subscribers to one engine — that's the Observer pattern
  paying off; never sync them to each other, only to engine events.
- Audio must be lazily unlocked on a user gesture (browser autoplay policy). The original
  already does this; preserve it.
- Keep all colours/fonts as custom properties now so Phase 3 is a no-rewrite swap.
- Scope every selector under a single root class (e.g. `.cuestack`) to prevent style bleed
  in Phase 5's Astro embed.

## Testing approach

- Component/DOM tests (Vitest + jsdom, or Playwright component tests) for: select shows
  label/number/next; colour classes at thresholds; keyboard toggles; fullscreen mirrors state.
- Manual side-by-side parity pass vs the original for audio/flash/fullscreen feel.

## Exit criteria

- All `Feature: Player Parity` + `Feature: Fullscreen presentation` scenarios pass.
- Visual + audio alert fires; fullscreen mirrors live; keyboard shortcuts work.
- No console errors; styles scoped, no global bleed.

## Demo

Boot the sample config; run a short cue to completion windowed, then in fullscreen; show the
colour escalation, beep, flash, and "Time's Up".

## Handoff to Phase 3

The player reads everything visual from CSS custom properties supplied by `ThemeProvider`.
Phase 3 expands `ThemeProvider` to full presets + custom tokens with zero component edits.
