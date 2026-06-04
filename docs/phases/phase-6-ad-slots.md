# Phase 6 — Ad Slots

> **Goal:** monetizable, pluggable slots that advertise your offerings now and can switch to
> a third-party network later via config — without touching the timer.

- **Depends on:** Phase 5 (page shells with slot placeholders).
- **Unblocks:** Phase 7 (polish/launch).
- **Confirm before starting:** **A3** — self-promo content (offerings: title, blurb, link,
  optional image) supplied.
- **Related:** [Architecture · ad slots](../02-ARCHITECTURE.md#ad-slots-srcviewadslot--strategy-pattern) · [Gherkin: Ad slots](../04-GHERKIN-SPEC.md#feature-ad-slots-phase6)

---

## Objectives

1. One `AdSlot` component with a swappable strategy: `selfPromo` | `network` | `none`.
2. Self-promo renders your offerings with **no cookies**.
3. `network` strategy renders only behind a consent gate.
4. `none` produces a fully clean tool/layout.
5. Slot placements on the utilities hub + timer pages, selectable by config.

## Strategy model

```ts
type AdStrategy =
  | { kind: 'selfPromo'; offerings: Offering[] }
  | { kind: 'network'; provider: 'adsense'; slotId: string }
  | { kind: 'none' };

interface Offering { title: string; blurb: string; href: string; image?: string; cta?: string; }
```
- **Layout owns *where*** (slot placement declared by the page); **config owns *what*** (which
  strategy). The timer core never imports ad code.

## Task breakdown

- [ ] `view/AdSlot.*` (Astro component in the page shell) accepting `id` + resolved strategy.
- [ ] Self-promo: `data/offerings.ts` (or site config) → responsive card(s); no tracking, no cookies.
- [ ] Network: thin wrapper that injects the provider script only **after** consent; renders
      nothing pre-consent.
- [ ] Consent gate: a small `ConsentProvider`/cookie check; `selfPromo` and `none` bypass it.
- [ ] Deployment config: a single place (env or site config) selecting strategy per slot id.
- [ ] Placements: hub sidebar/below-fold + timer page slot; ensure they don't crowd the tool
      or shift layout (reserve space to avoid CLS).
- [ ] Responsive + reduced-motion friendly; slots never overlap the player controls.

## Deliverables

`view/AdSlot.*`, `data/offerings.ts`, consent gate, per-slot config wiring, placements on the
Phase 5 pages, tests.

## Implementation notes

- Keep the player/builder islands **ad-free**; ads live only in the page shell so the tool
  stays reusable and clean (and embeddable elsewhere with `none`).
- Self-promo is the privacy-safe default; only `network` touches consent and external scripts.
- Reserve slot dimensions to prevent layout shift when an ad loads (or doesn't).

## Testing approach

- Self-promo renders offerings; assert **no advertising cookies** are set.
- Switching a slot to `network` renders nothing before consent, the ad after consent.
- `none` renders no ad content and doesn't alter layout (snapshot/visual).

## Exit criteria

- Self-promo renders cookie-free.
- Strategy switch (`selfPromo`→`network`→`none`) is config-only, no component edits.
- `none` yields a fully clean tool.

## Demo

Show the utilities page with self-promo offerings; switch a slot to `none` to prove the tool
is clean; (optionally) show the consent-gated network path in a test config.

## Handoff to Phase 7

All surfaces exist. Phase 7 hardens a11y, resilience, error states, responsiveness, and docs,
then signs off parity to archive the original file.
