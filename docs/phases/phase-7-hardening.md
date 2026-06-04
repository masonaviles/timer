# Phase 7 — Hardening & Launch Polish

> **Goal:** production-ready quality — accessibility, resilience, error states, responsive,
> docs — and sign-off to archive the original reference file.

- **Depends on:** Phases 1–6.
- **Unblocks:** launch.
- **Confirm before starting:** none.
- **Related:** [Gherkin: Accessibility](../04-GHERKIN-SPEC.md#feature-accessibility-phase2-phase3-phase7) · [Gherkin: Resilience](../04-GHERKIN-SPEC.md#feature-resilience-phase7) · all features

---

## Objectives

1. Accessibility pass to spec (keyboard, focus, reduced-motion, live announcements, contrast).
2. Resilience: long-session accuracy + backgrounded-tab catch-up, verified.
3. Graceful error + edge-case handling (bad links, empty/extreme configs).
4. Cross-browser + mobile/responsive pass.
5. End-user documentation + finalize naming; archive the original after parity sign-off.

## Task breakdown

### Accessibility
- [ ] Audit with axe (or similar); fix violations.
- [ ] `aria-live="polite"` region announces step start / change / finish.
- [ ] Every control keyboard-reachable with visible `:focus-visible`; logical tab order.
- [ ] Urgency conveyed by text/ARIA, not colour alone (verify across presets).
- [ ] `prefers-reduced-motion` fully respected (no flashing; non-animated alert remains).

### Resilience
- [ ] Long-session soak: fake-clock test over several simulated hours stays within 1s; plus
      one real wall-clock spot check.
- [ ] Backgrounded-tab: simulate throttled ticks + large clock gap; remaining reflects real time.
- [ ] Visibility/refocus handling re-syncs display immediately on tab return.

### Error & edge states
- [ ] Malformed `?t=`/missing `?id=` → default sample + non-blocking notice (from Phase 4; verify).
- [ ] Zero-step config → empty-state prompt, no crash.
- [ ] Single-step, very long names, large durations → layout holds, text truncates.
- [ ] Audio blocked / unsupported → silent visual-only fallback, no errors.

### Cross-platform
- [ ] Test latest Chrome/Firefox/Safari + iOS Safari + Android Chrome.
- [ ] Responsive: cue panel collapses/reflows on narrow screens; fullscreen works on mobile.
- [ ] Touch: cue selection, controls, builder reorder usable by touch.

### Docs & launch
- [ ] End-user README: how to build, theme, save, share, embed.
- [ ] Finalize product name (rename from CueStack if desired — single-source per Conventions).
- [ ] Update all `docs/` to match shipped reality.
- [ ] **Parity sign-off:** confirm every `Feature: Player Parity` scenario green, then archive
      `BTMB_Retreat_Timer.html` (move to `reference/`, do not delete).

## Deliverables

A11y fixes + live region, resilience tests, error/edge handling, responsive styles, end-user
README, finalized docs, archived original.

## Implementation notes

- Resilience leans on Phase 1's injected clock — exercise it; don't introduce real-time flakiness.
- Don't archive the original until parity is explicitly signed off; it's the behavioural baseline.
- Keep changes here corrective/polishing — new features go to the backlog, not Phase 7.

## Testing approach

- Automated: axe a11y checks; fake-clock soak + background-gap tests; error-recovery tests;
  empty/extreme config tests.
- Manual: device/browser matrix; screen-reader spot check; full happy-path walkthrough.

## Exit criteria

- All Gherkin scenarios green; a11y audit clean; no console errors.
- Long-session + background accuracy verified.
- Docs current; original archived after parity sign-off.

## Demo

Full happy-path on desktop + mobile, including colour escalation, alert, fullscreen, a shared
link, and a deliberately broken link recovering gracefully.

## Post-launch

Pull from the [backlog](../03-BUILD-PHASES.md#backlog-post-v1-captured-so-it-isnt-lost):
auto-advance, per-step media, backend `ApiRepository` + public gallery, more utilities reusing
the hub + AdSlot patterns.
