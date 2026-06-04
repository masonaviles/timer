# 01 · Product Brief

## One-liner

A white-label, themeable, step-by-step cue timer that anyone can configure with their own
steps and branding, share via a link, run fullscreen for an audience, and that lives as a
free utility on the Astro site to drive attention to paid offerings via ad slots.

## Problem & origin

The original `BTMB_Retreat_Timer.html` was a one-off built for a single retreat: its 19
steps, branding ("BTMB"), and dark amber theme are all hardcoded in the file. It works well
as a **presenter cue timer** — a big countdown, an ordered list of segments, fullscreen
projection, colour-coded urgency, and an audio alert when a segment ends.

We want to keep that proven UX but remove every hardcoded assumption, so it becomes a
**reusable utility**:

1. **White-label** — no fixed brand; the operator sets the name, theme, and steps.
2. **Self-serve building** — a non-technical user creates a step list in a builder UI.
3. **Themeable** — pick a preset theme or customize colours/fonts.
4. **Shareable** — a configured timer is captured in a URL; open it anywhere, no account.
5. **Embeddable** — ships in the Astro site at `/utilities/timer`.
6. **Monetizable** — ad slots advertise the site owner's offerings (or a network).

## Target users

| Persona | Need | Primary surface |
|---------|------|-----------------|
| **Presenter / facilitator** (Maya) | Run a pre-built agenda on a projector, glance-readable, no fiddling | Player + Fullscreen |
| **Organizer / builder** (Sam) | Compose and tweak a step list, theme it, get a shareable link | Builder |
| **Casual visitor** (Alex) | Quick single countdown or curiosity from the utilities page | Player (quick-start) |
| **Site owner** (you) | Free useful tool that surfaces paid offerings | Ad slots + utilities hub |

## Scope

### In scope (v1)
- Config-driven player preserving all original behaviours (parity).
- Builder UI: add / edit / reorder / delete steps; set name + duration; set timer title.
- Theme system: presets + custom colour/font overrides via design tokens.
- Share: encode full config into a URL; restore on load; `localStorage` autosave + named saves.
- Astro `/utilities/timer` (player) and `/utilities/timer/builder` (builder) routes.
- Pluggable ad slots (self-promo or network) on the utilities pages.
- Keyboard control, fullscreen, audio + visual end-of-step alert, accessibility baseline.

### Out of scope (v1 — parked for later phases/versions)
- User accounts, server persistence, public gallery of shared timers.
- Real-time multi-device sync / remote control.
- Per-step rich media (images, audio cues per step), nested sub-steps.
- Auto-advance chaining (auto-start next step) — **candidate fast-follow**, noted in backlog.
- Analytics dashboards for ad performance.

## Success criteria

- **Parity:** every behaviour in `BTMB_Retreat_Timer.html` is reproducible via config.
- **Zero-config usable:** opening the player with no config shows a usable quick-start.
- **Shareable:** a built timer round-trips through a URL with no data loss (within size limit).
- **Self-contained:** no backend required to build, save, share, or run a timer.
- **Embeds cleanly:** runs as an Astro island without layout/theme bleed.
- **Pickup-able:** a new contributor can `git clone`, read `docs/`, and resume at any phase.

## Non-functional requirements

- **Performance:** player interactive < 1s on a mid-range laptop; timer drift corrected
  against wall-clock (no `setInterval` accumulation error over hours-long sessions).
- **Resilience:** survives tab backgrounding (recompute from timestamps, not tick counts).
- **Accessibility:** keyboard-operable, visible focus, `prefers-reduced-motion` respected,
  colour is never the *only* urgency signal, screen-reader announcements for state changes.
- **Privacy:** self-promo mode sets no cookies; network-ad mode is gated behind consent.
- **Portability:** engine has no framework or DOM dependency and is unit-testable headless.
