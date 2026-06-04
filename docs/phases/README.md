# Phase Build-Out Docs

One detailed, pick-up-cold build doc per phase. The high-level overview and rationale live in
[../03-BUILD-PHASES.md](../03-BUILD-PHASES.md); these expand each phase into tasks, deliverables,
tests, exit criteria, and handoff notes.

Each doc follows the same shape: **Objectives → Task breakdown → Deliverables → Implementation
notes → Testing approach → Exit criteria → Demo → Handoff.**

| Phase | Doc | Outcome | Confirm first |
|------:|-----|---------|---------------|
| 0 | [phase-0-foundation.md](phase-0-foundation.md) | Typed, tested project skeleton | — |
| 1 | [phase-1-engine.md](phase-1-engine.md) | Headless state-machine engine + schema | — |
| 2 | [phase-2-player.md](phase-2-player.md) | Player UI at parity with the original | A1 |
| 3 | [phase-3-theming.md](phase-3-theming.md) | Preset + custom theming via tokens | — |
| 4 | [phase-4-builder-sharing.md](phase-4-builder-sharing.md) | Builder + URL share + local saves | A1 |
| 5 | [phase-5-astro.md](phase-5-astro.md) | `/utilities/` routes in the Astro site | A1, A2 |
| 6 | [phase-6-ad-slots.md](phase-6-ad-slots.md) | Pluggable self-promo / network ad slots | A3 |
| 7 | [phase-7-hardening.md](phase-7-hardening.md) | A11y, resilience, errors, launch | — |

**Assumptions (A1–A3)** are defined in [../README.md](../README.md#assumptions-to-confirm-do-not-block-planning-confirm-before-phase-5).

**Definition of Done** for every phase is in [../05-CONVENTIONS.md](../05-CONVENTIONS.md#definition-of-done-every-phase).

Work phases in order; each merges only when its Exit Criteria and mapped
[Gherkin scenarios](../04-GHERKIN-SPEC.md) are green.
