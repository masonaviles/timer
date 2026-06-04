# CueStack — Build Documentation

> **CueStack** is the working codename for a white-label, themeable, step-by-step
> cue timer. It generalizes the original single-file `BTMB_Retreat_Timer.html` into a
> configurable utility that anyone can theme, fill with their own steps, share via a
> link, and that ships inside an Astro site under `/utilities/` with pluggable ad slots.
>
> The name is a placeholder — see [05-CONVENTIONS.md](05-CONVENTIONS.md#product-naming) to rename in one place.

## Why these docs exist

This folder is the **single source of truth** for the project. It is written so that
development can be paused and resumed at any phase boundary by any contributor (human or
agent) and produce the same result each time. Read in this order:

| # | Doc | What it answers |
|---|-----|-----------------|
| 1 | [01-PRODUCT-BRIEF.md](01-PRODUCT-BRIEF.md) | What we're building, for whom, and the locked product decisions |
| 2 | [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | How it's structured: modules, data model, design patterns, data flow |
| 3 | [03-BUILD-PHASES.md](03-BUILD-PHASES.md) | The phased plan overview — each phase independently shippable. Detailed per-phase build-out docs live in [phases/](phases/README.md) |
| 4 | [04-GHERKIN-SPEC.md](04-GHERKIN-SPEC.md) | Behaviour specs (Given/When/Then) that double as the acceptance tests |
| 5 | [05-CONVENTIONS.md](05-CONVENTIONS.md) | Naming, file layout, coding standards, git conventions |
| 6 | [06-DECISIONS.md](06-DECISIONS.md) | Decision records (ADRs) — the *why* behind the locked decisions |

## Locked decisions (confirmed with stakeholder)

Full rationale + rejected alternatives for each in [06-DECISIONS.md](06-DECISIONS.md).

1. **Persistence:** URL-encoded config + browser `localStorage`. **No backend** at launch. ([ADR-001](06-DECISIONS.md#adr-001--persistence-url--localstorage-no-backend))
2. **Astro embedding:** native Astro page route (`/utilities/timer`) with an interactive
   island — not an iframe. ([ADR-002](06-DECISIONS.md#adr-002--embedding-astro-route--island-not-iframe))
3. **Ad model:** pluggable ad slots that render either **self-promo** or a **third-party
   network** ad, chosen per deployment via config. ([ADR-003](06-DECISIONS.md#adr-003--ad-model-pluggable-slots))
4. **Repo & distribution:** this repo ships as a **portable package** consumed by the Astro
   site; chosen for cross-site reuse; host is Netlify (no proxy needed). ([ADR-004](06-DECISIONS.md#adr-004--repo--distribution-portable-package-consumed-by-the-astro-site))

## Assumptions to confirm (do not block planning, confirm before Phase 5)

- **A1** — The Astro site's UI framework for islands. Doc defaults to **vanilla TS**
  for the engine (framework-agnostic) and recommends **Preact** for the stateful builder
  UI. Swap freely; the engine has zero framework dependencies.
- **A2 — RESOLVED.** This `timer/` repo is the product; it ships as a **portable package**
  (working name `@masonaviles/cuestack`) that the separate Astro site repo consumes.
  Chosen because the timer will be **reused on other sites**. Host is **Netlify** (no proxy
  or rewrite needed — each consuming site pulls the package at build time). Phases 0–4 build
  the framework-free core here; Phase 5 = publish a release + `npm i` it in the Astro site,
  which owns the routes and ad slots. See [phase-5-astro.md](phases/phase-5-astro.md).
- **A3** — Self-promo ad content (offerings, links, images) will be supplied before Phase 6.

## Current state

- `BTMB_Retreat_Timer.html` — the original, working, single-file reference implementation.
  Treat it as the **behavioural baseline**: the generalized player must preserve every
  behaviour it has (see [04-GHERKIN-SPEC.md](04-GHERKIN-SPEC.md) Feature: Player Parity).
